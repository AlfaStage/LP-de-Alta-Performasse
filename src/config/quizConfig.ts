
import type { LucideIcon } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import type { FormFieldConfig, QuizOption, QuizQuestion } from '@/types/quiz'; 

export const successIconName: keyof typeof import('lucide-react') = 'CheckCircle';
export const getSuccessIcon = (): LucideIcon => CheckCircle;
