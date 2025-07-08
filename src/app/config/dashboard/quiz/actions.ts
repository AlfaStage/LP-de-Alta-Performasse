
"use server";
import { promises as fs } from 'fs';
import path from 'path';
import type { QuizConfig, QuizQuestion, QuizListItem, OverallQuizStats, QuizAnalyticsData, QuizQuestionAnalytics, QuizOption, AggregateQuizStats, AnalyticsEvent, QuestionAnswerEvent, QuestionSpecificAnalytics, DateRange, ChartDataPoint, QuizEditData } from '@/types/quiz';
import { revalidatePath } from 'next/cache';
import { isWithinInterval, parseISO, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { generateQuizFromTopic } from '@/ai/flows/quizGeneratorFlow';
import type { QuizGenerationInput } from '@/ai/flows/quizGeneratorFlow';


const quizzesDirectory = path.join(process.cwd(), 'src', 'data', 'quizzes');
const analyticsDirectory = path.join(process.cwd(), 'src', 'data', 'analytics');
const AGGREGATE_STATS_FILE_PATH = path.join(analyticsDirectory, 'quiz_stats.json');
const DEFAULT_QUIZ_SLUG = "default";
const DEFAULT_QUIZ_DESCRIPTION = "Responda algumas perguntas rápidas e descubra o tratamento de depilação a laser Ice Lazer perfeito para você!";


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
    const data = JSON.parse(fileContents);
    // Ensure data structure is valid
    for (const slug in data) {
        if (!data[slug].started) data[slug].started = [];
        if (!data[slug].completed) data[slug].completed = [];
        if (!data[slug].firstAnswer) data[slug].firstAnswer = [];
    }
    return data as AggregateQuizStats;
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

// Helper to filter events by date
const filterEventsByDate = (events: AnalyticsEvent[], dateRange?: DateRange): AnalyticsEvent[] => {
  if (!dateRange || !dateRange.from) return events;
  const fromDate = startOfDay(dateRange.from);
  const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

  return events.filter(event => {
    try {
      const eventDate = parseISO(event.date);
      return isWithinInterval(eventDate, { start: fromDate, end: toDate });
    } catch (e) {
      return false;
    }
  });
};

export async function recordQuizStartedAction(quizSlug: string): Promise<void> {
  if (!quizSlug) return;
  const stats = await getAggregateQuizStatsData();
  if (!stats[quizSlug]) {
    stats[quizSlug] = { started: [], completed: [], firstAnswer: [] };
  }
  stats[quizSlug].started.push({ date: new Date().toISOString() });
  await saveAggregateQuizStatsData(stats);
  revalidatePath('/config/dashboard');
  revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`);
}

export async function recordFirstQuestionAnsweredAction(quizSlug: string): Promise<void> {
  if (!quizSlug) return;
  const stats = await getAggregateQuizStatsData();
  if (!stats[quizSlug]) {
    stats[quizSlug] = { started: [], completed: [], firstAnswer: [] };
  }
  if (!stats[quizSlug].firstAnswer) {
    stats[quizSlug].firstAnswer = [];
  }
  stats[quizSlug].firstAnswer!.push({ date: new Date().toISOString() });
  await saveAggregateQuizStatsData(stats);
  revalidatePath('/config/dashboard');
  revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`);
}


export async function recordQuizCompletedAction(quizSlug: string): Promise<void> {
    if (!quizSlug) return;
    const stats = await getAggregateQuizStatsData();
    if (!stats[quizSlug]) {
      stats[quizSlug] = { started: [], completed: [], firstAnswer: [] };
    }
    stats[quizSlug].completed.push({ date: new Date().toISOString() });
    await saveAggregateQuizStatsData(stats);
    revalidatePath('/config/dashboard');
    revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`);
}

async function getQuizQuestionAnalyticsData(quizSlug: string): Promise<QuizQuestionAnalytics> {
  const filePath = getQuestionStatsFilePath(quizSlug);
  await ensureFileExists(filePath);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    // Ensure data structure is valid
    for (const qId in data) {
        if (!data[qId].answers) data[qId].answers = [];
    }
    return data as QuizQuestionAnalytics;
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
  questionType: QuizQuestion['type'],
  answer: any, 
): Promise<{ success: boolean; message?: string }> {
  if (!quizSlug || !questionId) {
    return { success: false, message: "Quiz slug and question ID are required." };
  }

  try {
    const questionStats = await getQuizQuestionAnalyticsData(quizSlug);
    
    if (!questionStats[questionId]) {
      questionStats[questionId] = {
        id: questionId,
        type: questionType,
        answers: [],
      };
    }

    const newAnswerEvent: QuestionAnswerEvent = {
        date: new Date().toISOString(),
        value: answer,
    };
    
    questionStats[questionId].answers.push(newAnswerEvent);

    await saveQuizQuestionAnalyticsData(quizSlug, questionStats);
    revalidatePath(`/config/dashboard/quiz/stats/${quizSlug}`);
    return { success: true };
  } catch (error) {
    console.error(`Error recording answer for q:${questionId} in quiz:${quizSlug}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to record answer: ${errorMessage}` };
  }
}

export async function getQuizQuestionAnalytics(quizSlug: string, dateRange?: DateRange): Promise<QuizQuestionAnalytics | null> {
  if (!quizSlug) return null;
  const allQuestionStats = await getQuizQuestionAnalyticsData(quizSlug);
  if (!dateRange) return allQuestionStats;

  const filteredStats: QuizQuestionAnalytics = {};
  for (const qId in allQuestionStats) {
      const questionData = allQuestionStats[qId];
      filteredStats[qId] = {
          ...questionData,
          answers: filterEventsByDate(questionData.answers, dateRange) as QuestionAnswerEvent[],
      };
  }
  return filteredStats;
}


interface CreateQuizPayload {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questions: QuizQuestion[];
  displayMode?: 'step-by-step' | 'single-page';
}

export async function createQuizAction(payload: CreateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureDirectoryExists(quizzesDirectory);
  const { title, slug, description, dashboardName, questions, displayMode } = payload;

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
    isActive: true,
    useCustomTheme: false,
    customTheme: {},
    displayMode: displayMode || 'step-by-step',
    pixelSettings: {
      ignoreGlobalPrimaryPixel: false,
      ignoreGlobalSecondaryPixel: false,
      quizSpecificPixelId: '',
    },
  };

  try {
    await fs.writeFile(filePath, JSON.stringify(quizConfig, null, 2));
    await saveAggregateQuizStatsData({ ...(await getAggregateQuizStatsData()), [slug]: { started: [], completed: [], firstAnswer: [] } });
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
      isActive: quizData.isActive ?? true,
      useCustomTheme: quizData.useCustomTheme ?? false,
      customTheme: quizData.customTheme || {},
      displayMode: quizData.displayMode || 'step-by-step',
      pixelSettings: quizData.pixelSettings || {},
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
    quizData.isActive = quizData.isActive ?? true;
    quizData.useCustomTheme = quizData.useCustomTheme ?? false;
    quizData.customTheme = quizData.customTheme || {};
    quizData.displayMode = quizData.displayMode || 'step-by-step';
    quizData.pixelSettings = quizData.pixelSettings || {};

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
  isActive?: boolean;
  useCustomTheme?: boolean;
  customTheme?: {
    primaryColorHex?: string;
    secondaryColorHex?: string;
    buttonPrimaryBgColorHex?: string;
    quizBackgroundColorHex?: string;
  };
  displayMode?: 'step-by-step' | 'single-page';
  pixelSettings?: QuizConfig['pixelSettings'];
}

export async function updateQuizAction(payload: UpdateQuizPayload): Promise<{ success: boolean; message?: string; slug?: string }> {
  await ensureDirectoryExists(quizzesDirectory);
  const { title, slug, description, dashboardName, questions, isActive, useCustomTheme, customTheme, displayMode, pixelSettings } = payload;

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
    isActive: isActive ?? true,
    useCustomTheme: useCustomTheme ?? false,
    customTheme: customTheme || {},
    displayMode: displayMode || 'step-by-step',
    pixelSettings: pixelSettings || {},
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


export async function getQuizzesList(dateRange?: DateRange): Promise<QuizListItem[]> {
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
        
        const quizAggStats = aggStatsData[slug] || { started: [], completed: [], firstAnswer: [] };
        const startedCount = filterEventsByDate(quizAggStats.started, dateRange).length;
        const completedCount = filterEventsByDate(quizAggStats.completed, dateRange).length;
        const firstAnswerCount = filterEventsByDate(quizAggStats.firstAnswer || [], dateRange).length;

        return { 
          title: quizData.title || `Quiz ${slug}`,
          slug: quizData.slug || slug,
          dashboardName: quizData.dashboardName || quizData.title,
          successIcon: quizData.successIcon,
          isActive: quizData.isActive ?? true,
          displayMode: quizData.displayMode || 'step-by-step',
          startedCount: startedCount,
          completedCount: completedCount,
          firstAnswerCount: firstAnswerCount,
        };
      } catch (parseError) {
        console.error(`Failed to parse quiz file ${filename}:`, parseError);
        const analytics = aggStatsData[slug] || { started: [], completed: [], firstAnswer: [] };
        return {
          title: `Erro ao carregar: ${filename}`,
          slug: slug,
          dashboardName: `Erro: ${filename}`,
          successIcon: undefined, 
          isActive: false,
          displayMode: 'step-by-step',
          startedCount: filterEventsByDate(analytics.started, dateRange).length,
          completedCount: filterEventsByDate(analytics.completed, dateRange).length,
          firstAnswerCount: filterEventsByDate(analytics.firstAnswer || [], dateRange).length,
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

export async function getOverallQuizAnalytics(dateRange?: DateRange): Promise<OverallQuizStats> {
  const aggStatsData = await getAggregateQuizStatsData();
  const whitelabelConfig = await getWhitelabelConfig();

  const quizzesList = await getQuizzesList(dateRange);

  const totalQuizzes = quizzesList.length;
  const activeQuizzes = quizzesList.filter(q => q.isActive).length;

  let totalStarted = 0;
  let totalCompleted = 0;
  let totalFirstAnswers = 0;
  let mostEngagingQuizData: (QuizListItem & { conversionRate?: number }) | undefined = undefined;
  let highestConversionRate = -1;

  for (const quiz of quizzesList) {
    totalStarted += quiz.startedCount || 0;
    totalCompleted += quiz.completedCount || 0;
    totalFirstAnswers += quiz.firstAnswerCount || 0;

    const conversionDenominator = whitelabelConfig.conversionMetric === 'first_answer_vs_complete'
      ? (quiz.firstAnswerCount || 0)
      : (quiz.startedCount || 0);
    
    const conversionRate = conversionDenominator > 0 ? ((quiz.completedCount || 0) / conversionDenominator) * 100 : 0;

    if (conversionRate > highestConversionRate) {
      highestConversionRate = conversionRate;
      mostEngagingQuizData = {
        ...quiz,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      };
    }
  }
  
  // Generate chart data
  const chartData: ChartDataPoint[] = [];
  if (dateRange && dateRange.from) {
    const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) };
    
    if (interval.end >= interval.start) {
      const days = eachDayOfInterval(interval);
      for (const day of days) {
        const dayString = format(day, 'dd/MM/yyyy');
        let dailyStarted = 0;
        let dailyCompleted = 0;

        for (const slug in aggStatsData) {
            dailyStarted += aggStatsData[slug].started.filter(e => format(parseISO(e.date), 'dd/MM/yyyy') === dayString).length;
            dailyCompleted += aggStatsData[slug].completed.filter(e => format(parseISO(e.date), 'dd/MM/yyyy') === dayString).length;
        }

        chartData.push({
          date: dayString,
          iniciados: dailyStarted,
          finalizados: dailyCompleted,
        });
      }
    }
  }
  
  return {
    totalStarted, 
    totalCompleted,
    totalFirstAnswers,
    mostEngagingQuiz: mostEngagingQuizData,
    chartData,
    totalQuizzes,
    activeQuizzes,
  };
}


export async function getQuizAnalyticsBySlug(slug: string, dateRange?: DateRange): Promise<QuizAnalyticsData | null> {
  await ensureDirectoryExists(quizzesDirectory);
  const aggStatsData = await getAggregateQuizStatsData();
  const quizAggStats = aggStatsData[slug];

  const filePath = path.join(quizzesDirectory, `${slug}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const quizData = JSON.parse(fileContents) as QuizConfig;
    
    const startedCount = quizAggStats ? filterEventsByDate(quizAggStats.started, dateRange).length : 0;
    const completedCount = quizAggStats ? filterEventsByDate(quizAggStats.completed, dateRange).length : 0;
    const firstAnswerCount = quizAggStats ? filterEventsByDate(quizAggStats.firstAnswer || [], dateRange).length : 0;

    return {
      title: quizData.title,
      slug: quizData.slug,
      description: quizData.description || DEFAULT_QUIZ_DESCRIPTION,
      dashboardName: quizData.dashboardName || quizData.title,
      successIcon: quizData.successIcon,
      isActive: quizData.isActive ?? true,
      displayMode: quizData.displayMode || 'step-by-step',
      startedCount: startedCount,
      completedCount: completedCount,
      firstAnswerCount: firstAnswerCount,
    };
  } catch {
    if (quizAggStats) { 
        return {
            title: `Quiz ${slug} (Arquivo não encontrado)`,
            slug: slug,
            description: DEFAULT_QUIZ_DESCRIPTION,
            dashboardName: `Quiz ${slug} (Arquivo não encontrado)`,
            successIcon: undefined,
            isActive: false,
            displayMode: 'step-by-step',
            startedCount: filterEventsByDate(quizAggStats.started, dateRange).length,
            completedCount: filterEventsByDate(quizAggStats.completed, dateRange).length,
            firstAnswerCount: filterEventsByDate(quizAggStats.firstAnswer || [], dateRange).length,
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
      aggStats[quizSlug] = { started: [], completed: [], firstAnswer: [] };
      await saveAggregateQuizStatsData(aggStats);
    }

    const questionStatsFilePath = getQuestionStatsFilePath(quizSlug);
    try {
      await fs.unlink(questionStatsFilePath);
    } catch (unlinkError) {
      const nodeError = unlinkError as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        console.warn(`Could not delete question stats file ${questionStatsFilePath} during reset, will attempt to clear:`, unlinkError);
      }
    }
    // Ensure the file exists as an empty JSON object
    await saveQuizQuestionAnalyticsData(quizSlug, {});


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

export async function generateAndCreateQuizAction(topic: string): Promise<{ success: boolean; message?: string; slug?: string }> {
  try {
    const whitelabelConfig = await getWhitelabelConfig();
    if (!whitelabelConfig.googleApiKey || whitelabelConfig.googleApiKey.trim() === "") {
        return { success: false, message: 'A chave de API do Google não está configurada. Por favor, adicione-a em Configurações > Integrações.' };
    }

    const input: QuizGenerationInput = { topic };
    const { quizJson } = await generateQuizFromTopic(input);

    if (!quizJson) {
      return { success: false, message: 'A IA não conseguiu gerar um quiz para este tópico. Tente novamente.' };
    }
    
    // The AI might sometimes wrap the JSON in ```json ... ```, so we need to clean it.
    const cleanedJson = quizJson.replace(/^```json\n/, '').replace(/\n```$/, '');

    const quizData: QuizConfig = JSON.parse(cleanedJson);

    // Validate that the AI-generated data has the essentials
    if (!quizData.title || !quizData.slug || !Array.isArray(quizData.questions)) {
       return { success: false, message: 'O JSON gerado pela IA é inválido ou está incompleto.' };
    }

    // Now, create the quiz using the existing action
    return await createQuizAction({
      title: quizData.title,
      slug: quizData.slug,
      description: quizData.description,
      dashboardName: quizData.dashboardName || quizData.title,
      questions: quizData.questions,
      displayMode: quizData.displayMode || 'step-by-step',
    });

  } catch (error) {
    console.error("Error in generateAndCreateQuizAction:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar a geração do quiz.";
    if (error instanceof SyntaxError) {
        return { success: false, message: 'Erro: A IA retornou um JSON mal formatado. Por favor, tente gerar novamente.' };
    }
    return { success: false, message: `Falha na geração do quiz por IA: ${errorMessage}` };
  }
}
