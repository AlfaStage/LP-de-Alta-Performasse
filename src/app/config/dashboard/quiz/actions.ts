
"use server";
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig, QuizQuestion } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig'; // To ensure contact step is last
import { revalidatePath } from 'next/cache';

const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');

// Certifique-se de que o diretório de quizzes exista
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
  questions: QuizQuestion[]; // Recebe as questões já parseadas
}

export async function createQuizAction(payload: CreateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureQuizzesDirectoryExists();

  const { title, slug, questions } = payload;

  if (!title || !slug || !questions || questions.length === 0) {
    return { success: false, message: "Título, slug e perguntas são obrigatórios." };
  }

  // Validação simples do slug (apenas letras minúsculas, números e hífens)
  if (!/^[a-z0-9-]+$/.test(slug)) {
      return { success: false, message: "Slug inválido. Use apenas letras minúsculas, números e hífens."};
  }
  if (slug === 'config' || slug === 'api' || slug === 'public' || slug === 'assets') {
      return { success: false, message: "Este slug é reservado e não pode ser usado."};
  }


  const filePath = path.join(quizzesDirectory, `${slug}.json`);

  try {
    // Verifica se já existe um quiz com esse slug
    await fs.access(filePath);
    return { success: false, message: `Um quiz com o slug "${slug}" já existe.` };
  } catch {
    // File does not exist, proceed to create
  }

  // Garante que a última pergunta seja a de contato
  const questionsWithContactStep = [...questions.filter(q => q.id !== defaultContactStep.id), defaultContactStep];


  const quizConfig: QuizConfig = {
    title,
    slug,
    questions: questionsWithContactStep,
    successIcon: 'CheckCircle', // Default success icon
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(quizConfig, null, 2));
    revalidatePath('/'); // Revalida a página inicial para atualizar a lista de quizzes
    revalidatePath(`/${slug}`); // Revalida a página do quiz recém-criado
    revalidatePath('/config/dashboard'); // Revalida a página do dashboard
    return { success: true, message: `Quiz "${title}" criado com sucesso.`, slug };
  } catch (error) {
    console.error("Failed to write quiz file:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao salvar o arquivo do quiz: ${errorMessage}` };
  }
}

export async function getQuizzesList(): Promise<QuizConfig[]> {
  await ensureQuizzesDirectoryExists();
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    const quizFiles = filenames.filter(filename => filename.endsWith('.json'));
    
    const quizzes = await Promise.all(quizFiles.map(async (filename) => {
      const filePath = path.join(quizzesDirectory, filename);
      const fileContents = await fs.readFile(filePath, 'utf8');
      const quizData = JSON.parse(fileContents) as QuizConfig;
      return { // Retornar apenas o necessário para a listagem
        title: quizData.title || "Quiz sem título",
        slug: quizData.slug || filename.replace('.json', ''),
        questions: [], // Não precisa das questões completas para a lista
      };
    }));
    return quizzes;
  } catch (error) {
    console.error("Failed to read quizzes directory for list:", error);
    return [];
  }
}
