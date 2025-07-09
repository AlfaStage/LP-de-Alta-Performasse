
import type { LucideIcon } from 'lucide-react';
import type { DateRange as ReactDayPickerDateRange } from 'react-day-picker';
import type { IconName } from '@/lib/lucide-icons';


export interface DateRange extends ReactDayPickerDateRange {}

export interface QuizOption {
  value: string;
  label: string;
  icon?: IconName;
  explanation?: string;
  imageUrl?: string;
  dataAiHint?: string;
  text_message?: string;
  isDisqualifying?: boolean;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  placeholder?: string;
  icon?: IconName;
}

export interface QuizQuestion {
  id: string;
  name: string; 
  text: string;
  explanation?: string;
  type: 'radio' | 'checkbox' | 'textFields';
  options?: QuizOption[];
  fields?: FormFieldConfig[];
  condition?: (formData: Record<string, any>) => boolean; 
  icon?: IconName;
}

export interface QuizMessage {
  id: string;
  type: 'mensagem' | 'imagem' | 'audio';
  content: string; // The text content or base64 data URI
  filename?: string;
}

export interface QuizConfig {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questions: QuizQuestion[];
  messages?: QuizMessage[];
  successIcon?: IconName;
  isActive?: boolean;
  useCustomTheme?: boolean;
  customTheme?: {
    primaryColorHex?: string;
    secondaryColorHex?: string;
    buttonPrimaryBgColorHex?: string;
    quizBackgroundColorHex?: string;
  };
  displayMode?: 'step-by-step' | 'single-page';
  pixelSettings?: {
    ignoreGlobalPrimaryPixel?: boolean;
    ignoreGlobalSecondaryPixel?: boolean;
    quizSpecificPixelId?: string;
  };
  successPageText?: string;
  disqualifiedPageText?: string;
  disqualifiedRedirectUrl?: string;
  disqualifiedRedirectDelaySeconds?: number;
}

export interface WhitelabelConfig {
  projectName: string;
  logoUrl: string;
  primaryColorHex: string; 
  secondaryColorHex: string; 
  buttonPrimaryBgColorHex?: string; 
  pageBackgroundColorHex: string; 
  quizBackgroundColorHex: string; 
  pageBackgroundImageUrl?: string;
  pageBackgroundGradient?: string;
  pageBackgroundType: 'color' | 'image' | 'gradient';
  quizSubmissionWebhookUrl: string;
  disqualifiedSubmissionWebhookUrl?: string;
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
  googleApiKey?: string;
  footerCopyrightText?: string;
  apiStatsAccessToken?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookDomainVerification?: string;
  dashboardDefaultFilter?: 'today' | 'yesterday' | 'last7' | 'last30';
  conversionMetric?: 'start_vs_complete' | 'first_answer_vs_complete';
}

export interface AiPromptsConfig {
  generateQuizDetails: string;
  generateQuizQuestions: string;
  generateQuizMessages: string;
  generateQuizResultsPages: string;
}

// Statistics types
export interface QuizListItem extends Omit<QuizConfig, 'questions' | 'description' | 'dashboardName' | 'customTheme' | 'useCustomTheme' | 'pixelSettings' | 'messages'> {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  successIcon?: IconName;
  isActive?: boolean;
  startedCount?: number;
  completedCount?: number;
  firstAnswerCount?: number;
}

export interface ChartDataPoint {
  date: string; // "dd/MM/yyyy"
  iniciados: number;
  finalizados: number;
}

export interface OverallQuizStats {
  totalStarted: number;
  totalCompleted: number;
  totalFirstAnswers?: number;
  mostEngagingQuiz?: QuizListItem & { conversionRate: number };
  chartData?: ChartDataPoint[];
  totalQuizzes?: number;
  activeQuizzes?: number;
}

export interface QuizAnalyticsData extends QuizListItem {
  // Detailed stats if needed in the future for the main list
}

// New types for per-question analytics
export interface AnalyticsEvent {
  date: string; // ISO Date String
}

export interface QuestionAnswerEvent extends AnalyticsEvent {
  value: any; // The answer given
}

export interface AggregateQuizStats {
  [quizSlug: string]: {
    started: AnalyticsEvent[];
    completed: AnalyticsEvent[];
    firstAnswer?: AnalyticsEvent[];
  };
}


export interface QuestionSpecificAnalytics {
  id: string; // questionId
  type: QuizQuestion['type'];
  answers: QuestionAnswerEvent[];
}

export interface QuizQuestionAnalytics {
  [questionId: string]: QuestionSpecificAnalytics;
}

export interface QuizEditData {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questionsJson: string;
  messages?: QuizMessage[];
  isActive?: boolean;
  useCustomTheme?: boolean;
  customTheme?: {
    primaryColorHex?: string;
    secondaryColorHex?: string;
    buttonPrimaryBgColorHex?: string;
    quizBackgroundColorHex?: string;
  };
  displayMode?: 'step-by-step' | 'single-page';
  pixelSettings?: {
    ignoreGlobalPrimaryPixel?: boolean;
    ignoreGlobalSecondaryPixel?: boolean;
    quizSpecificPixelId?: string;
  };
  successPageText?: string;
  disqualifiedPageText?: string;
  disqualifiedRedirectUrl?: string;
  disqualifiedRedirectDelaySeconds?: number;
}
