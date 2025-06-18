
import type { LucideIcon } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import type { FormFieldConfig, QuizOption, QuizQuestion } from '@/types/quiz'; 

export const defaultContactStep: QuizQuestion = {
    id: 'final_contact_step',
    name: 'contato',
    icon: 'MessageSquare',
    text: 'Ótimo! Para finalizar e nossa equipe entrar em contato, por favor, deixe seu nome e WhatsApp/Email:',
    explanation: 'Suas informações estão seguras conosco e serão usadas apenas para o contato sobre nossos serviços.',
    type: 'textFields',
    fields: [
      { name: 'nomeCompleto', label: 'Seu nome completo', type: 'text', placeholder: 'Ex: Maria Silva', icon: 'User' },
      { name: 'whatsapp', label: 'Seu WhatsApp (com DDD) ou Email', type: 'text', placeholder: 'Ex: (XX) XXXXX-XXXX ou email@exemplo.com', icon: 'Smartphone' },
    ],
};

export const successIconName: keyof typeof import('lucide-react') = 'CheckCircle';
export const getSuccessIcon = (): LucideIcon => CheckCircle;

