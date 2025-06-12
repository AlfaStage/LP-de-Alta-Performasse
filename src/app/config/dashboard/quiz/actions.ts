
"use server";
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig, QuizQuestion } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig'; 
import { revalidatePath } from 'next/cache';

const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');

async function ensureQuizzesDirectoryExists() {
  try {
    await fs.access(quizzesDirectory);
  } catch {
    await fs.mkdir(quizzesDirectory, { recursive: true });
  }
}

interface CreateQuizPayload {
  title: string;
  slug: string;
  questions: QuizQuestion[]; 
}

export async function createQuizAction(payload: CreateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureQuizzesDirectoryExists();

  const { title, slug, questions } = payload;

  if (!title || !slug ) { 
    return { success: false, message: "Título e slug são obrigatórios." };
  }
   if (!Array.isArray(questions)) {
     return { success: false, message: "O campo de perguntas deve ser um array JSON válido (pode ser vazio)." };
   }

  if (!/^[a-z0-9-]+$/.test(slug)) {
      return { success: false, message: "Slug inválido. Use apenas letras minúsculas, números e hífens."};
  }
  if (slug === 'config' || slug === 'api' || slug === 'public' || slug === 'assets' || slug === 'images' || slug === '_next') {
      return { success: false, message: "Este slug é reservado e não pode ser usado."};
  }

  const filePath = path.join(quizzesDirectory, `${slug}.json`);

  try {
    await fs.access(filePath);
    return { success: false, message: `Um quiz com o slug "${slug}" já existe.` };
  } catch {
    // File does not exist, proceed to create
  }

  const questionsWithoutExistingContact = questions.filter(q => q.id !== defaultContactStep.id);
  const questionsWithContactStep = [...questionsWithoutExistingContact, defaultContactStep];

  const quizConfig: QuizConfig = {
    title,
    slug,
    questions: questionsWithContactStep,
    successIcon: 'CheckCircle', 
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(quizConfig, null, 2));
    revalidatePath('/'); 
    revalidatePath(`/${slug}`); 
    revalidatePath('/config/dashboard'); 
    return { success: true, message: `Quiz "${title}" criado com sucesso.`, slug };
  } catch (error) {
    console.error("Failed to write quiz file:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao salvar o arquivo do quiz: ${errorMessage}` };
  }
}

export interface QuizEditData {
  title: string;
  slug: string;
  questionsJson: string; // Questions as a JSON string, without the contact step
}

export async function getQuizForEdit(slug: string): Promise<QuizEditData | null> {
  await ensureQuizzesDirectoryExists();
  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    const questionsForEditing = quizData.questions.filter(q => q.id !== defaultContactStep.id);
    
    return {
      title: quizData.title,
      slug: quizData.slug,
      questionsJson: JSON.stringify(questionsForEditing, null, 2),
    };
  } catch (error) {
    console.error(`Failed to read quiz config for editing (slug ${slug}):`, error);
    return null;
  }
}

interface UpdateQuizPayload {
  title: string;
  slug: string; // Original slug, not editable for now
  questions: QuizQuestion[]; // Parsed questions from user input
}

export async function updateQuizAction(payload: UpdateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureQuizzesDirectoryExists();
  const { title, slug, questions } = payload;

  if (!title || !slug) {
    return { success: false, message: "Título e slug são obrigatórios." };
  }
  if (!Array.isArray(questions)) {
    return { success: false, message: "O campo de perguntas deve ser um array JSON válido." };
  }

  const filePath = path.join(quizzesDirectory, `${slug}.json`);

  try {
    await fs.access(filePath);
  } catch {
    return { success: false, message: `Quiz com o slug "${slug}" não encontrado para atualização.` };
  }

  const questionsWithoutExistingContact = questions.filter(q => q.id !== defaultContactStep.id);
  const questionsWithContactStep = [...questionsWithoutExistingContact, defaultContactStep];

  const quizConfig: QuizConfig = {
    title,
    slug, 
    questions: questionsWithContactStep,
    successIcon: 'CheckCircle', 
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(quizConfig, null, 2));
    revalidatePath('/');
    revalidatePath(`/${slug}`);
    revalidatePath('/config/dashboard');
    revalidatePath(`/config/dashboard/quiz/edit/${slug}`);
    return { success: true, message: `Quiz "${title}" atualizado com sucesso.`, slug };
  } catch (error) {
    console.error("Failed to update quiz file:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao atualizar o arquivo do quiz: ${errorMessage}` };
  }
}

export async function deleteQuizAction(slug: string): Promise<{ success: boolean; message?: string }> {
  await ensureQuizzesDirectoryExists();
  if (!slug) {
    return { success: false, message: "Slug do quiz é obrigatório para apagar." };
  }

  const filePath = path.join(quizzesDirectory, `${slug}.json`);

  try {
    await fs.access(filePath); // Verifica se o arquivo existe
  } catch {
    return { success: false, message: `Quiz com o slug "${slug}" não encontrado.` };
  }

  try {
    await fs.unlink(filePath); // Apaga o arquivo
    revalidatePath('/'); // Revalida a página inicial que lista os quizzes (se aplicável)
    revalidatePath('/config/dashboard'); // Revalida a página do dashboard
    revalidatePath(`/${slug}`); // Revalida o caminho do quiz apagado (resultará em 404)
    // Revalida também a página de edição para o caso de alguém estar nela
    revalidatePath(`/config/dashboard/quiz/edit/${slug}`); 
    
    return { success: true, message: `Quiz "${slug}" apagado com sucesso.` };
  } catch (error) {
    console.error(`Failed to delete quiz file for slug ${slug}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao apagar o arquivo do quiz: ${errorMessage}` };
  }
}


export async function getQuizzesList(): Promise<QuizListItem[]> {
  await ensureQuizzesDirectoryExists();
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    const quizFiles = filenames.filter(filename => filename.endsWith('.json'));
    
    const quizzesPromises = quizFiles.map(async (filename) => {
      const filePath = path.join(quizzesDirectory, filename);
      try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const quizData = JSON.parse(fileContents) as QuizConfig;
        return { 
          title: quizData.title || `Quiz ${filename.replace('.json', '')}`,
          slug: quizData.slug || filename.replace('.json', ''),
          successIcon: quizData.successIcon,
        };
      } catch (parseError) {
        console.error(`Failed to parse quiz file ${filename}:`, parseError);
        // Retorna um objeto parcial para não quebrar a lista inteira
        return {
          title: `Erro ao carregar: ${filename}`,
          slug: filename.replace('.json', ''),
          successIcon: undefined, // ou um ícone de erro padrão
        };
      }
    });
    const quizzes = await Promise.all(quizzesPromises);
    // Filtrar quaisquer quizzes que falharam completamente em carregar e retornaram null (se ajustado para isso)
    return quizzes.filter(q => q !== null) as QuizListItem[];
  } catch (error) {
    console.error("Failed to read quizzes directory for list:", error);
    return [];
  }
}

interface QuizListItem extends Omit<QuizConfig, 'questions'> {
  // Adicione quaisquer outros campos que você deseja na lista, se necessário
}
