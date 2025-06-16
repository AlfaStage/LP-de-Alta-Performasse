
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
}

export interface QuizListItem extends Omit<QuizConfig, 'questions'> {
  startedCount?: number;
  completedCount?: number;
}

export interface OverallQuizStats {
  totalStarted: number;
  totalCompleted: number;
  mostEngagingQuiz?: QuizListItem & { conversionRate?: number };
}

export interface QuizAnalyticsData extends QuizListItem {
  // Se precisarmos de estatísticas mais detalhadas por pergunta no futuro:
  // questionStats?: Array<{ questionId: string; responseCount: number; answers: Record<string, number> }>;
}

