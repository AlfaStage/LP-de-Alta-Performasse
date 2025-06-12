
// This file is now primarily for icon exports or default structures if needed,
// as quiz questions are loaded dynamically from JSON files.

import type { LucideIcon } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import type { FormFieldConfig, QuizOption, QuizQuestion } from '@/types/quiz'; // Import from new types file

// Example of how the contact step is structured, to be appended by the server action.
export const defaultContactStep: QuizQuestion = {
    id: 'final_contact_step',
    name: 'contato',
    icon: 'MessageSquare',
    text: 'Excelente! Para finalizarmos e nossa equipe entrar em contato com as melhores ofertas para você, por favor, deixe seu nome e WhatsApp:',
    explanation: 'Suas informações estão seguras conosco e serão usadas apenas para o contato sobre nossos serviços.',
    type: 'textFields',
    fields: [
      { name: 'nomeCompleto', label: 'Seu nome completo', type: 'text', placeholder: 'Ex: Maria Silva', icon: 'User' },
      { name: 'whatsapp', label: 'Seu WhatsApp (com DDD)', type: 'tel', placeholder: 'Ex: (XX) XXXXX-XXXX ou XXXXXXXXXXX', icon: 'Smartphone' },
    ],
};

export const successIconName: keyof typeof import('lucide-react') = 'CheckCircle';
export const getSuccessIcon = (): LucideIcon => CheckCircle;

// Conditional logic for q5 (interesseEstetica) is complex for simple JSON.
// It's removed from the default JSON and would need careful handling if re-added to the dynamic quiz builder.
// For now, dynamic quizzes won't support this specific conditional question easily unless the condition logic is simplified or handled differently.
// const unidadesComEsteticaAdicional: string[] = []; // Example: ['brasilia_df', 'taguatinga_df'];
// export const q5Condition = (formData: Record<string, any>) => unidadesComEsteticaAdicional.includes(formData.localizacao);

// This file can also export default option structures or icons if needed elsewhere.
// For example:
// export const defaultUserIcon: keyof typeof import('lucide-react') = 'User';
