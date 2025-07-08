'use client';

import dynamic from 'next/dynamic';
import QuizFormLoading from '@/components/quiz/QuizFormLoading';
import type { QuizConfig, QuizQuestion } from '@/types/quiz';

const DynamicQuizForm = dynamic(() => import('@/components/quiz/QuizForm'), {
  loading: () => <QuizFormLoading />,
  ssr: false,
});

interface QuizClientWrapperProps {
  quizQuestions: QuizQuestion[];
  quizSlug: string;
  quizTitle?: string;
  quizDescription?: string;
  logoUrl: string;
  finalFacebookPixelIds: string[];
  googleAnalyticsId?: string;
  clientAbandonmentWebhookUrl?: string;
  footerCopyrightText?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  useCustomTheme?: boolean;
  customTheme?: QuizConfig['customTheme'];
  displayMode?: 'step-by-step' | 'single-page';
}

export default function QuizClientWrapper(props: QuizClientWrapperProps) {
  return <DynamicQuizForm {...props} />;
}
