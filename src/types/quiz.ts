
import type { LucideIcon } from 'lucide-react';

export interface QuizOption {
  value: string;
  label: string;
  icon?: keyof typeof import('lucide-react'); // Store icon name
  explanation?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  placeholder?: string;
  icon?: keyof typeof import('lucide-react'); // Store icon name
}

export interface QuizQuestion {
  id: string;
  name: string; // for form data
  text: string;
  explanation?: string;
  type: 'radio' | 'checkbox' | 'textFields';
  options?: QuizOption[];
  fields?: FormFieldConfig[];
  condition?: (formData: Record<string, any>) => boolean; // Condition logic might be tricky to serialize/deserialize if complex
  icon?: keyof typeof import('lucide-react'); // Store icon name
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
  primaryColorHex: string; // Cor primária do tema (para anéis de foco, gráficos, etc.)
  secondaryColorHex: string; // Cor secundária do tema
  buttonPrimaryBgColorHex?: string; // Cor de fundo específica para botões primários
  pageBackgroundColorHex: string; // Cor de fundo da página inteira
  quizBackgroundColorHex: string; // Cor de fundo do card/container do quiz
  quizSubmissionWebhookUrl: string;
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
  footerCopyrightText?: string;
}

// Removida a função getLucideIcon daqui. Ela será gerenciada localmente nos componentes que precisam de carregamento dinâmico de ícones.
// O QuizForm.tsx terá sua própria implementação otimizada.
// Outros componentes que usam poucos ícones específicos podem importá-los diretamente de 'lucide-react'.
