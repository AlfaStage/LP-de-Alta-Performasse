
import type { LucideIcon } from 'lucide-react';

export interface QuizOption {
  value: string;
  label: string;
  icon?: keyof typeof import('lucide-react');
  explanation?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  placeholder?: string;
  icon?: keyof typeof import('lucide-react');
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
  icon?: keyof typeof import('lucide-react');
}

export interface QuizConfig {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questions: QuizQuestion[];
  successIcon?: keyof typeof import('lucide-react');
}

export interface WhitelabelConfig {
  projectName: string;
  logoUrl: string;
  primaryColorHex: string; 
  secondaryColorHex: string; 
  buttonPrimaryBgColorHex?: string; 
  pageBackgroundColorHex: string; 
  quizBackgroundColorHex: string; 
  quizSubmissionWebhookUrl: string;
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
  footerCopyrightText?: string;
  apiStatsAccessToken?: string; // Novo campo para o token da API
}

// Statistics types
export interface QuizListItem extends Omit<QuizConfig, 'questions' | 'description' | 'dashboardName'> {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  successIcon?: keyof typeof import('lucide-react');
  startedCount?: number;
  completedCount?: number;
}

export interface OverallQuizStats {
  totalStarted: number;
  totalCompleted: number;
  mostEngagingQuiz?: QuizListItem & { conversionRate?: number };
}

export interface QuizAnalyticsData extends QuizListItem {
  // Detailed stats if needed in the future for the main list
}

// New types for per-question analytics
export interface QuestionOptionStats {
  [optionValue: string]: number; // count for each option value
}

export interface QuestionFieldStats {
  totalSubmissions: number; // For textFields, just count submissions for the step
}

export interface QuestionSpecificAnalytics {
  id: string; // questionId
  type: QuizQuestion['type'];
  totalAnswers: number; // Total times this question was answered/submitted
  options?: QuestionOptionStats; // For radio/checkbox
  fieldsHandled?: boolean; // For textFields, indicates submissions were counted
}

// Structure for the [quizSlug]_question_stats.json file
export interface QuizQuestionAnalytics {
  [questionId: string]: QuestionSpecificAnalytics;
}

export interface QuizEditData {
  title: string;
  slug: string;
  description?: string;
  dashboardName?: string;
  questionsJson: string; 
}

