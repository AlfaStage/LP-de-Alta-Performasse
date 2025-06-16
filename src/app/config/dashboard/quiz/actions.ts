
"use server";
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig, QuizQuestion, QuizListItem, OverallQuizStats, QuizAnalyticsData } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig'; 
import { revalidatePath } from 'next/cache';

const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
const DEFAULT_QUIZ_SLUG = "default";

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
  questionsJson: string; 
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
  slug: string; 
  questions: QuizQuestion[];
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

  if (slug === DEFAULT_QUIZ_SLUG) {
    return { success: false, message: "O quiz padrão não pode ser apagado." };
  }

  const filePath = path.join(quizzesDirectory, `${slug}.json`);

  try {
    await fs.access(filePath); 
  } catch {
    return { success: false, message: `Quiz com o slug "${slug}" não encontrado.` };
  }

  try {
    await fs.unlink(filePath); 
    revalidatePath('/'); 
    revalidatePath('/config/dashboard'); 
    revalidatePath(`/${slug}`); 
    revalidatePath(`/config/dashboard/quiz/edit/${slug}`); 
    
    return { success: true, message: `Quiz "${slug}" apagado com sucesso.` };
  } catch (error) {
    console.error(`Failed to delete quiz file for slug ${slug}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao apagar o arquivo do quiz: ${errorMessage}` };
  }
}


// Função para simular dados de analytics para um quiz específico
function getMockAnalyticsForQuiz(slug: string): { startedCount: number; completedCount: number } {
  // Lógica de simulação simples: números baseados no hash do slug para consistência, mas variados
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const baseStarted = Math.abs(hash % 500) + 50; // entre 50 e 549
  const completedRatio = (Math.abs(hash % 70) + 20) / 100; // entre 0.2 e 0.89
  const completedCount = Math.floor(baseStarted * completedRatio);
  return { startedCount: baseStarted, completedCount };
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
        const analytics = getMockAnalyticsForQuiz(quizData.slug);
        return { 
          title: quizData.title || `Quiz ${filename.replace('.json', '')}`,
          slug: quizData.slug || filename.replace('.json', ''),
          successIcon: quizData.successIcon,
          startedCount: analytics.startedCount,
          completedCount: analytics.completedCount,
        };
      } catch (parseError) {
        console.error(`Failed to parse quiz file ${filename}:`, parseError);
        const analytics = getMockAnalyticsForQuiz(filename.replace('.json', ''));
        return {
          title: `Erro ao carregar: ${filename}`,
          slug: filename.replace('.json', ''),
          successIcon: undefined, 
          startedCount: analytics.startedCount,
          completedCount: analytics.completedCount,
        };
      }
    });
    const quizzes = await Promise.all(quizzesPromises);
    return quizzes.filter(q => q !== null) as QuizListItem[];
  } catch (error) {
    console.error("Failed to read quizzes directory for list:", error);
    return [];
  }
}

export async function getOverallQuizAnalytics(): Promise<OverallQuizStats> {
  // Simulação: Em uma aplicação real, você buscaria isso de um banco de dados ou serviço de analytics.
  const quizzes = await getQuizzesList();
  let totalStarted = 0;
  let totalCompleted = 0;
  let mostEngagingQuiz: QuizListItem | null = null;
  let highestConversionRate = -1;

  quizzes.forEach(quiz => {
    totalStarted += quiz.startedCount || 0;
    totalCompleted += quiz.completedCount || 0;
    const conversionRate = (quiz.startedCount && quiz.startedCount > 0) ? ((quiz.completedCount || 0) / quiz.startedCount) : 0;
    if (conversionRate > highestConversionRate) {
      highestConversionRate = conversionRate;
      mostEngagingQuiz = quiz;
    }
  });
  
  const mostEngagingQuizData = mostEngagingQuiz ? {
        ...mostEngagingQuiz,
        conversionRate: parseFloat((highestConversionRate * 100).toFixed(1))
      } : undefined;


  return {
    totalStarted: totalStarted, 
    totalCompleted: totalCompleted,
    mostEngagingQuiz: mostEngagingQuizData,
  };
}


export async function getQuizAnalyticsBySlug(slug: string): Promise<QuizAnalyticsData | null> {
  const quizzes = await getQuizzesList(); // Reutiliza a lista que já tem os mocks
  const quiz = quizzes.find(q => q.slug === slug);

  if (!quiz) {
    return null;
  }
  // Em um cenário real, aqui você buscaria dados mais detalhados, como respostas por pergunta.
  // Por enquanto, retorna os dados agregados já mockados.
  return {
    title: quiz.title,
    slug: quiz.slug,
    successIcon: quiz.successIcon,
    startedCount: quiz.startedCount,
    completedCount: quiz.completedCount,
  };
}

export async function resetAllQuizAnalyticsAction(): Promise<{ success: boolean; message?: string }> {
  // Em uma aplicação real, esta função interagiria com seu sistema de analytics
  // para limpar ou resetar os dados.
  // Como estamos usando dados mockados gerados dinamicamente, não há estado real para limpar aqui.
  // Apenas simulamos o sucesso da operação. O recarregamento dos dados no frontend
  // gerará novos números mockados.
  console.log("Simulando reset de todas as estatísticas de quiz.");
  // Adicionar uma pequena espera para simular uma operação de backend
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  revalidatePath('/config/dashboard');
  return { success: true, message: "Estatísticas simuladas foram 'resetadas'." };
}
