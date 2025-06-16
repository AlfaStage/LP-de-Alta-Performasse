
"use server";
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig, QuizQuestion, QuizListItem, OverallQuizStats, QuizAnalyticsData } from '@/types/quiz';
import { defaultContactStep } from '@/config/quizConfig'; 
import { revalidatePath } from 'next/cache';

const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
const analyticsDirectory = path.join(process.cwd(), 'src', 'data', 'analytics');
const STATS_FILE_PATH = path.join(analyticsDirectory, 'quiz_stats.json');
const DEFAULT_QUIZ_SLUG = "default";

interface QuizStats {
  [quizSlug: string]: {
    startedCount: number;
    completedCount: number;
  };
}

async function ensureAnalyticsDirectoryExists() {
  try {
    await fs.access(analyticsDirectory);
  } catch {
    await fs.mkdir(analyticsDirectory, { recursive: true });
  }
}

async function ensureStatsFileExists() {
  await ensureAnalyticsDirectoryExists();
  try {
    await fs.access(STATS_FILE_PATH);
  } catch {
    await fs.writeFile(STATS_FILE_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function getQuizStatsData(): Promise<QuizStats> {
  await ensureStatsFileExists();
  try {
    const fileContents = await fs.readFile(STATS_FILE_PATH, 'utf8');
    return JSON.parse(fileContents) as QuizStats;
  } catch (error) {
    console.error("Failed to read or parse quiz_stats.json:", error);
    return {}; // Return empty object on error
  }
}

async function saveQuizStatsData(data: QuizStats): Promise<void> {
  await ensureStatsFileExists();
  try {
    await fs.writeFile(STATS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Failed to write quiz_stats.json:", error);
  }
}

export async function updateQuizStat(quizSlug: string, statType: 'startedCount' | 'completedCount'): Promise<void> {
  const stats = await getQuizStatsData();
  if (!stats[quizSlug]) {
    stats[quizSlug] = { startedCount: 0, completedCount: 0 };
  }
  stats[quizSlug][statType]++;
  await saveQuizStatsData(stats);
  revalidatePath('/config/dashboard'); // Revalidate dashboard to show updated stats
}

export async function recordQuizStartedAction(quizSlug: string): Promise<void> {
  if (!quizSlug) return;
  await updateQuizStat(quizSlug, 'startedCount');
}


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
    
    // Also remove its stats
    const stats = await getQuizStatsData();
    if (stats[slug]) {
      delete stats[slug];
      await saveQuizStatsData(stats);
    }

    revalidatePath('/'); 
    revalidatePath('/config/dashboard'); 
    revalidatePath(`/${slug}`); 
    revalidatePath(`/config/dashboard/quiz/edit/${slug}`); 
    
    return { success: true, message: `Quiz "${slug}" apagado com sucesso e estatísticas removidas.` };
  } catch (error) {
    console.error(`Failed to delete quiz file or stats for slug ${slug}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao apagar o arquivo do quiz ou suas estatísticas: ${errorMessage}` };
  }
}


export async function getQuizzesList(): Promise<QuizListItem[]> {
  await ensureQuizzesDirectoryExists();
  const statsData = await getQuizStatsData();
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    const quizFiles = filenames.filter(filename => filename.endsWith('.json'));
    
    const quizzesPromises = quizFiles.map(async (filename) => {
      const filePath = path.join(quizzesDirectory, filename);
      const slug = filename.replace('.json', '');
      try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const quizData = JSON.parse(fileContents) as QuizConfig;
        const analytics = statsData[slug] || { startedCount: 0, completedCount: 0 };
        return { 
          title: quizData.title || `Quiz ${slug}`,
          slug: quizData.slug || slug,
          successIcon: quizData.successIcon,
          startedCount: analytics.startedCount,
          completedCount: analytics.completedCount,
        };
      } catch (parseError) {
        console.error(`Failed to parse quiz file ${filename}:`, parseError);
        const analytics = statsData[slug] || { startedCount: 0, completedCount: 0 };
        return {
          title: `Erro ao carregar: ${filename}`,
          slug: slug,
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
  const statsData = await getQuizStatsData();
  let totalStarted = 0;
  let totalCompleted = 0;
  let mostEngagingQuizData: (QuizListItem & { conversionRate?: number }) | undefined = undefined;
  let highestConversionRate = -1;

  // To get quiz titles, we still need to read the quiz files
  const quizzesList = await getQuizzesList(); // This already incorporates stats

  for (const quizSlug in statsData) {
    const quizStats = statsData[quizSlug];
    totalStarted += quizStats.startedCount;
    totalCompleted += quizStats.completedCount;

    const conversionRate = quizStats.startedCount > 0 ? (quizStats.completedCount / quizStats.startedCount) * 100 : 0;
    if (conversionRate > highestConversionRate) {
      highestConversionRate = conversionRate;
      const quizDetails = quizzesList.find(q => q.slug === quizSlug);
      if (quizDetails) {
        mostEngagingQuizData = {
          ...quizDetails, // contains title, slug, successIcon, and already correct started/completed counts
          conversionRate: parseFloat(conversionRate.toFixed(1))
        };
      }
    }
  }
  
  return {
    totalStarted: totalStarted, 
    totalCompleted: totalCompleted,
    mostEngagingQuiz: mostEngagingQuizData,
  };
}


export async function getQuizAnalyticsBySlug(slug: string): Promise<QuizAnalyticsData | null> {
  await ensureQuizzesDirectoryExists();
  const statsData = await getQuizStatsData();
  const quizStats = statsData[slug];

  if (!quizStats) {
     // Try to read quiz file to at least return title and slug with 0 counts
    const filePath = path.join(quizzesDirectory, `${slug}.json`);
    try {
      const fileContents = await fs.readFile(filePath, 'utf8');
      const quizData = JSON.parse(fileContents) as QuizConfig;
      return {
        title: quizData.title,
        slug: quizData.slug,
        successIcon: quizData.successIcon,
        startedCount: 0,
        completedCount: 0,
      };
    } catch {
      return null; // Quiz file also not found
    }
  }

  // Quiz stats found, try to get title from quiz file
  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  let title = `Quiz ${slug}`;
  let successIcon;
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    title = quizData.title;
    successIcon = quizData.successIcon;
  } catch (e) {
    console.warn(`Could not read quiz file for slug ${slug} to get title for analytics, using slug as title.`);
  }

  return {
    title: title,
    slug: slug,
    successIcon: successIcon,
    startedCount: quizStats.startedCount,
    completedCount: quizStats.completedCount,
  };
}

export async function resetAllQuizAnalyticsAction(): Promise<{ success: boolean; message?: string }> {
  try {
    await saveQuizStatsData({}); // Write empty object to reset stats
    console.log("All quiz statistics have been reset.");
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
    revalidatePath('/config/dashboard');
    return { success: true, message: "Estatísticas de todos os quizzes foram resetadas." };
  } catch (error) {
    console.error("Error resetting quiz statistics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to reset statistics: ${errorMessage}` };
  }
}
