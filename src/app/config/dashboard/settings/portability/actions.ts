
"use server";

import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { revalidatePath } from 'next/cache';

const dataDir = path.join(process.cwd(), 'src', 'data');
const quizzesDir = path.join(dataDir, 'quizzes');
const analyticsDir = path.join(dataDir, 'analytics');
const whitelabelConfigFile = path.join(dataDir, 'whitelabel-config.json');
const aiPromptsFile = path.join(dataDir, 'ai-prompts.json');
const quizStatsFile = path.join(analyticsDir, 'quiz_stats.json');

async function getAllFiles(dirPath: string, parentPath: string = ''): Promise<{ filePath: string, content: Buffer }[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolvedPath = path.join(dirPath, entry.name);
      const relativePath = path.join(parentPath, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(resolvedPath, relativePath);
      } else {
        const content = await fs.readFile(resolvedPath);
        return [{ filePath: relativePath, content }];
      }
    })
  );
  return Array.prototype.concat(...files);
}

export async function exportAllDataAction(): Promise<{ success: boolean; data?: string; fileName?: string; message?: string }> {
  try {
    const zip = new JSZip();

    // Add config files
    zip.file('whitelabel-config.json', await fs.readFile(whitelabelConfigFile));
    zip.file('ai-prompts.json', await fs.readFile(aiPromptsFile));

    // Add quizzes
    const quizzes = await getAllFiles(quizzesDir);
    quizzes.forEach(file => {
      zip.folder('quizzes')?.file(file.filePath, file.content);
    });

    // Add analytics
    const analytics = await getAllFiles(analyticsDir);
    analytics.forEach(file => {
      zip.folder('analytics')?.file(file.filePath, file.content);
    });

    const zipContent = await zip.generateAsync({ type: 'base64' });

    return {
      success: true,
      data: zipContent,
      fileName: 'quiz-system-backup.zip',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Export Error:", error);
    return { success: false, message: `Falha na exportação: ${msg}` };
  }
}

export async function exportFileAction(fileKey: string): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    const filePath = path.join(dataDir, fileKey);
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Export file error for key ${fileKey}:`, error);
    return { success: false, message: `Falha ao exportar arquivo: ${msg}` };
  }
}

export async function importDataAction(fileContent: string, type: 'zip' | 'json'): Promise<{ success: boolean; message?: string }> {
  try {
    if (type === 'zip') {
      const zip = await JSZip.loadAsync(fileContent, { base64: true });
      for (const relativePath in zip.files) {
        if (!zip.files[relativePath].dir) {
          const fileData = await zip.files[relativePath].async('nodebuffer');
          const destPath = path.join(dataDir, relativePath);
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.writeFile(destPath, fileData);
        }
      }
    } else { // JSON file
        // This is a simplified version. A real app might need to know which file is being imported.
        // For now, we assume it's one of the main config files.
        // A more robust implementation would require a filename hint from the client.
        // Let's assume for now it's a whitelabel config for simplicity.
        // THIS IS A HUGE ASSUMPTION AND SHOULD BE IMPROVED IN A REAL SCENARIO
        try {
            const parsed = JSON.parse(fileContent);
            if ('projectName' in parsed) { // Heuristic for whitelabel-config.json
                 await fs.writeFile(whitelabelConfigFile, fileContent, 'utf-8');
            } else if ('generateQuizDetails' in parsed) { // Heuristic for ai-prompts.json
                 await fs.writeFile(aiPromptsFile, fileContent, 'utf-8');
            } else if ('questions' in parsed && 'slug' in parsed) { // Heuristic for a quiz file
                 const quizPath = path.join(quizzesDir, `${parsed.slug}.json`);
                 await fs.writeFile(quizPath, fileContent, 'utf-8');
            } else {
                 throw new Error("Formato de arquivo JSON não reconhecido.");
            }
        } catch (e) {
            throw new Error(`Arquivo JSON inválido ou não reconhecido: ${(e as Error).message}`);
        }
    }
    
    // Revalidate all paths to reflect changes
    revalidatePath('/', 'layout');
    return { success: true, message: 'Dados importados com sucesso! A página será recarregada.' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido.";
    console.error("Import Error:", error);
    return { success: false, message: `Falha na importação: ${msg}` };
  }
}
