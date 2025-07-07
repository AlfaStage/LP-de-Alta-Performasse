
"use server";
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig, QuizQuestion, QuizListItem, OverallQuizStats, QuizAnalyticsData, QuizQuestionAnalytics, QuizOption } from '@/types/quiz';
import { revalidatePath } from 'next/cache';

const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
const analyticsDirectory = path.join(process.cwd(), 'src', 'data', 'analytics');
const AGGREGATE_STATS_FILE_PATH = path.join(analyticsDirectory, 'quiz_stats.json');
const DEFAULT_QUIZ_SLUG = "default";
const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas rápidas e descubra o tratamento de depilação a laser Ice Lazer perfeito para você!";

interface AggregateQuizStats {
  [quizSlug: string]: {
    startedCount: number;
    completedCount: number;
  };
}

function getQuestionStatsFilePath(quizSlug: string): string {
  return path.join(analyticsDirectory, `${quizSlug}_question_stats.json`);
}

async function ensureDirectoryExists(directoryPath: string) {
  try {
    await fs.access(directoryPath);
  } catch {
    await fs.mkdir(directoryPath, { recursive: true });
  }
}

async function ensureFileExists(filePath: string, defaultContent: string = '{}') {
  await ensureDirectoryExists(path.dirname(filePath));
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, defaultContent, 'utf8');
  }
}

async function getAggregateQuizStatsData(): Promise<AggregateQuizStats> {
  await ensureFileExists(AGGREGATE_STATS_FILE_PATH, JSON.stringify({}, null, 2));
  try {
    const fileContents = await fs.readFile(AGGREGATE_STATS_FILE_PATH, 'utf8');
    return JSON.parse(fileContents) as AggregateQuizStats;
  } catch (error) {
    console.error("Failed to read or parse quiz_stats.json:", error);
    return {}; 
  }
}

async function saveAggregateQuizStatsData(data: AggregateQuizStats): Promise<void> {
  await ensureFileExists(AGGREGATE_STATS_FILE_PATH, JSON.stringify({}, null, 2));
  try {
    await fs.writeFile(AGGREGATE_STATS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Failed to write quiz_stats.json:", error);
  }
}

export async function updateQuizStat(quizSlug: string, statType: 'startedCount' | 'completedCount'): Promise<void> {
  const stats = await getAggregateQuizStatsData();
  if (!stats[quizSlug]) {
    stats[quizSlug] = { startedCount: 0, completedCount: 0 };
  }
  stats[quizSlug][statType]++;
  await saveAggregateQuizStatsData(stats);
  revalidatePath('/config/dashboard');
  revalidatePath(`/config/dashboard/quiz/edit/${quizSlug}`);
  revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`);
}

export async function recordQuizStartedAction(quizSlug: string): Promise<void> {
  if (!quizSlug) return;
  await updateQuizStat(quizSlug, 'startedCount');
}

async function getQuizQuestionAnalyticsData(quizSlug: string): Promise<QuizQuestionAnalytics> {
  const filePath = getQuestionStatsFilePath(quizSlug);
  await ensureFileExists(filePath);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as QuizQuestionAnalytics;
  } catch (error) {
    console.error(`Failed to read or parse ${filePath}:`, error);
    return {};
  }
}

async function saveQuizQuestionAnalyticsData(quizSlug: string, data: QuizQuestionAnalytics): Promise<void> {
  const filePath = getQuestionStatsFilePath(quizSlug);
  await ensureFileExists(filePath);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Failed to write ${filePath}:`, error);
  }
}

export async function recordQuestionAnswerAction(
  quizSlug: string, 
  questionId: string, 
  questionName: string,
  answer: any, 
  questionType: QuizQuestion['type']
): Promise<{ success: boolean; message?: string }> {
  if (!quizSlug || !questionId || !questionName) {
    return { success: false, message: "Quiz slug, question ID, and question name are required." };
  }

  try {
    const questionStats = await getQuizQuestionAnalyticsData(quizSlug);
    
    if (!questionStats[questionId]) {
      questionStats[questionId] = {
        id: questionId,
        type: questionType,
        totalAnswers: 0,
        ...(questionType === 'radio' || questionType === 'checkbox' ? { options: {} } : {}),
        ...(questionType === 'textFields' ? { fieldsHandled: false } : {}) 
      };
    }

    const currentQStats = questionStats[questionId];
    currentQStats.totalAnswers++;

    if (questionType === 'radio' && typeof answer === 'string') {
      if (!currentQStats.options) currentQStats.options = {};
      currentQStats.options[answer] = (currentQStats.options[answer] || 0) + 1;
    } else if (questionType === 'checkbox' && Array.isArray(answer)) {
      if (!currentQStats.options) currentQStats.options = {};
      answer.forEach(optValue => {
        if (typeof optValue === 'string') {
          currentQStats.options[optValue] = (currentQStats.options[optValue] || 0) + 1;
        }
      });
    } else if (questionType === 'textFields') {
      currentQStats.fieldsHandled = true;
    }

    await saveQuizQuestionAnalyticsData(quizSlug, questionStats);
    revalidatePath(`/config/dashboard/quiz/edit/${quizSlug}`); 
    revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`);
    return { success: true };
  } catch (error) {
    console.error(`Error recording answer for q:${questionId} in quiz:${quizSlug}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to record answer: ${errorMessage}` };
  }
}

export async function getQuizQuestionAnalytics(quizSlug: string): Promise<QuizQuestionAnalytics | null> {
  if (!quizSlug) return null;
  return await getQuizQuestionAnalyticsData(quizSlug);
}


interface CreateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questions: QuizQuestion[]; 
}

export async function createQuizAction(payload: CreateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureDirectoryExists(quizzesDirectory);
  const { title, slug, description, dashboardName, questions } = payload;

  if (!title || !slug ) { 
    return { success: false, message: "Título e slug são obrigatórios." };
  }
   if (!Array.isArray(questions)) {
     return { success: false, message: "O campo de perguntas deve ser um array JSON válido (pode ser vazio)." };
   }

  if (!/^[a-z0-9-]+$/.test(slug)) {
      return { success: false, message: "Slug inválido. Use apenas letras minúsculas, números e hífens."};
  }
  if (slug === 'config' || slug === 'api' || slug === 'public' || slug === 'assets' || slug === 'images' || slug === '_next' || slug === 'analytics' || slug === 'whitelabel-config') {
      return { success: false, message: "Este slug é reservado e não pode ser usado."};
  }

  const filePath = path.join(quizzesDirectory, `${slug}.json`);

  try {
    await fs.access(filePath);
    return { success: false, message: `Um quiz com o slug "${slug}" já existe.` };
  } catch {
    // File does not exist, proceed to create
  }

  const quizConfig: QuizConfig = {
    title,
    slug,
    description: description || DEFAULT_QUIZ_DESCRIPTION,
    dashboardName: dashboardName || title,
    questions: questions,
    successIcon: 'CheckCircle', 
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(quizConfig, null, 2));
    await saveAggregateQuizStatsData({ ...(await getAggregateQuizStatsData()), [slug]: { startedCount: 0, completedCount: 0 } });
    await saveQuizQuestionAnalyticsData(slug, {});

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
  description?: string;
  dashboardName?: string;
  questionsJson: string; 
}

export async function getQuizForEdit(slug: string): Promise<QuizEditData | null> {
  await ensureDirectoryExists(quizzesDirectory);
  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    return {
      title: quizData.title,
      slug: quizData.slug,
      description: quizData.description || DEFAULT_QUIZ_DESCRIPTION,
      dashboardName: quizData.dashboardName || quizData.title,
      questionsJson: JSON.stringify(quizData.questions, null, 2),
    };
  } catch (error) {
    console.error(`Failed to read quiz config for editing (slug ${slug}):`, error);
    return null;
  }
}

export async function getQuizConfigForPreview(slug: string): Promise<QuizConfig | null> {
  const quizzesDir = path.join(process.cwd(), 'src', 'data', 'quizzes');
  const filePath = path.join(quizzesDir, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    quizData.title = quizData.title || "Quiz Interativo";
    quizData.slug = quizData.slug || slug; 
    quizData.description = quizData.description || DEFAULT_QUIZ_DESCRIPTION;
    quizData.dashboardName = quizData.dashboardName || quizData.title;

    return quizData;
  } catch (error) {
    console.error(`Failed to read quiz config for preview (slug ${slug}):`, error);
    return null;
  }
}


interface UpdateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questions: QuizQuestion[];
}

export async function updateQuizAction(payload: UpdateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureDirectoryExists(quizzesDirectory);
  const { title, slug, description, dashboardName, questions } = payload;

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

  const quizConfig: QuizConfig = {
    title,
    slug, 
    description: description || DEFAULT_QUIZ_DESCRIPTION,
    dashboardName: dashboardName || title,
    questions: questions,
    successIcon: 'CheckCircle', 
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(quizConfig, null, 2));
    revalidatePath('/');
    revalidatePath(`/${slug}`);
    revalidatePath('/config/dashboard');
    revalidatePath(`/config/dashboard/quiz/edit/${slug}`);
    revalidatePath(`/config/dashboard/quiz/stats/${slug}`);
    return { success: true, message: `Quiz "${title}" atualizado com sucesso.`, slug };
  } catch (error) {
    console.error("Failed to update quiz file:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao atualizar o arquivo do quiz: ${errorMessage}` };
  }
}

export async function deleteQuizAction(slug: string): Promise<{ success: boolean; message?: string }> {
  await ensureDirectoryExists(quizzesDirectory);
  if (!slug) {
    return { success: false, message: "Slug do quiz é obrigatório para apagar." };
  }

  if (slug === DEFAULT_QUIZ_SLUG) {
    return { success: false, message: "O quiz padrão não pode ser apagado." };
  }

  const quizFilePath = path.join(quizzesDirectory, `${slug}.json`);
  const questionStatsFilePath = getQuestionStatsFilePath(slug);

  try {
    await fs.access(quizFilePath); 
  } catch {
    return { success: false, message: `Quiz com o slug "${slug}" não encontrado.` };
  }

  try {
    await fs.unlink(quizFilePath); 
    
    const aggStats = await getAggregateQuizStatsData();
    if (aggStats[slug]) {
      delete aggStats[slug];
      await saveAggregateQuizStatsData(aggStats);
    }

    try {
      await fs.access(questionStatsFilePath);
      await fs.unlink(questionStatsFilePath);
    } catch (questionStatsError) {
      const nodeError = questionStatsError as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        console.warn(`Could not delete question stats file ${questionStatsFilePath}:`, questionStatsError);
      }
    }

    revalidatePath('/'); 
    revalidatePath('/config/dashboard'); 
    revalidatePath(`/${slug}`); 
    revalidatePath(`/config/dashboard/quiz/edit/${slug}`); 
    revalidatePath(`/config/dashboard/quiz/stats/${slug}`);
    
    return { success: true, message: `Quiz "${slug}" e suas estatísticas foram apagados com sucesso.` };
  } catch (error) {
    console.error(`Failed to delete quiz file or stats for slug ${slug}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Erro ao apagar o arquivo do quiz ou suas estatísticas: ${errorMessage}` };
  }
}


export async function getQuizzesList(): Promise<QuizListItem[]> {
  await ensureDirectoryExists(quizzesDirectory);
  const aggStatsData = await getAggregateQuizStatsData();
  try {
    const filenames = await fs.readdir(quizzesDirectory);
    const quizFiles = filenames.filter(filename => filename.endsWith('.json'));
    
    const quizzesPromises = quizFiles.map(async (filename) => {
      const filePath = path.join(quizzesDirectory, filename);
      const slug = filename.replace('.json', '');
      try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const quizData = JSON.parse(fileContents) as QuizConfig;
        const analytics = aggStatsData[slug] || { startedCount: 0, completedCount: 0 };
        return { 
          title: quizData.title || `Quiz ${slug}`,
          slug: quizData.slug || slug,
          dashboardName: quizData.dashboardName || quizData.title,
          successIcon: quizData.successIcon,
          startedCount: analytics.startedCount,
          completedCount: analytics.completedCount,
        };
      } catch (parseError) {
        console.error(`Failed to parse quiz file ${filename}:`, parseError);
        const analytics = aggStatsData[slug] || { startedCount: 0, completedCount: 0 };
        return {
          title: `Erro ao carregar: ${filename}`,
          slug: slug,
          dashboardName: `Erro: ${filename}`,
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
  const aggStatsData = await getAggregateQuizStatsData();
  let totalStarted = 0;
  let totalCompleted = 0;
  let mostEngagingQuizData: (QuizListItem & { conversionRate?: number }) | undefined = undefined;
  let highestConversionRate = -1;

  const quizzesList = await getQuizzesList(); 

  for (const quizSlug in aggStatsData) {
    const quizStats = aggStatsData[quizSlug];
    totalStarted += quizStats.startedCount;
    totalCompleted += quizStats.completedCount;

    const conversionRate = quizStats.startedCount > 0 ? (quizStats.completedCount / quizStats.startedCount) * 100 : 0;
    if (conversionRate > highestConversionRate) {
      highestConversionRate = conversionRate;
      const quizDetails = quizzesList.find(q => q.slug === quizSlug);
      if (quizDetails) {
        mostEngagingQuizData = {
          ...quizDetails,
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
  await ensureDirectoryExists(quizzesDirectory);
  const aggStatsData = await getAggregateQuizStatsData();
  const quizAggStats = aggStatsData[slug];

  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    return {
      title: quizData.title,
      slug: quizData.slug,
      description: quizData.description || DEFAULT_QUIZ_DESCRIPTION,
      dashboardName: quizData.dashboardName || quizData.title,
      successIcon: quizData.successIcon,
      startedCount: quizAggStats?.startedCount || 0,
      completedCount: quizAggStats?.completedCount || 0,
    };
  } catch {
    if (quizAggStats) { 
        return {
            title: `Quiz ${slug} (Arquivo não encontrado)`,
            slug: slug,
            description: DEFAULT_QUIZ_DESCRIPTION,
            dashboardName: `Quiz ${slug} (Arquivo não encontrado)`,
            successIcon: undefined,
            startedCount: quizAggStats.startedCount,
            completedCount: quizAggStats.completedCount,
        }
    }
    return null; 
  }
}

export async function resetAllQuizAnalyticsAction(): Promise<{ success: boolean; message?: string }> {
  try {
    // Clear aggregate stats
    await saveAggregateQuizStatsData({}); 
    
    // Delete all per-question stats files
    await ensureDirectoryExists(analyticsDirectory);
    const analyticsFiles = await fs.readdir(analyticsDirectory);
    for (const file of analyticsFiles) {
      if (file.endsWith('_question_stats.json')) { 
        await fs.unlink(path.join(analyticsDirectory, file));
      }
    }
     // Re-create the main stats file with empty content to ensure it exists after clearing.
    await saveAggregateQuizStatsData({});

    console.log("All quiz statistics (aggregate and per-question) have been reset.");
    await new Promise(resolve => setTimeout(resolve, 300)); 
    revalidatePath('/config/dashboard', 'layout'); 
    return { success: true, message: "Estatísticas de todos os quizzes foram resetadas." };
  } catch (error) {
    console.error("Error resetting all quiz statistics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Falha ao resetar estatísticas: ${errorMessage}` };
  }
}

export async function resetSingleQuizAnalyticsAction(quizSlug: string): Promise<{ success: boolean; message?: string }> {
  if (!quizSlug) {
    return { success: false, message: "Slug do quiz é obrigatório para resetar estatísticas." };
  }

  try {
    const aggStats = await getAggregateQuizStatsData();
    if (aggStats[quizSlug]) {
      aggStats[quizSlug].startedCount = 0;
      aggStats[quizSlug].completedCount = 0;
      await saveAggregateQuizStatsData(aggStats);
    } else {
      // If quiz not in aggregate, ensure it's added with 0 counts
      aggStats[quizSlug] = { startedCount: 0, completedCount: 0 };
      await saveAggregateQuizStatsData(aggStats);
    }

    const questionStatsFilePath = getQuestionStatsFilePath(quizSlug);
    try {
      // Attempt to delete, if fails (e.g. not found), ensure a clean empty file
      await fs.unlink(questionStatsFilePath);
    } catch (unlinkError) {
      const nodeError = unlinkError as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        console.warn(`Could not delete question stats file ${questionStatsFilePath} during reset, will attempt to clear:`, unlinkError);
      }
    }
    // Ensure the file exists as an empty JSON object after attempting deletion or if it didn't exist
    await ensureDirectoryExists(path.dirname(questionStatsFilePath));
    await fs.writeFile(questionStatsFilePath, JSON.stringify({}, null, 2), 'utf8');


    console.log(`Statistics for quiz "${quizSlug}" have been reset.`);

    revalidatePath('/config/dashboard', 'layout');
    revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`, 'page');
    revalidatePath(`/config/dashboard/quiz/edit/${quizSlug}`, 'page');
    revalidatePath(`/${quizSlug}`);

    return { success: true, message: `Estatísticas do quiz "${quizSlug}" foram resetadas com sucesso.` };
  } catch (error) {
    console.error(`Error resetting statistics for quiz "${quizSlug}":`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha ao resetar estatísticas do quiz: ${errorMessage}` };
  }
}
    
