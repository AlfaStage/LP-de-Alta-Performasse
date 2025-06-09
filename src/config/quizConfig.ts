
import type { LucideIcon } from 'lucide-react';
import { User, MapPin, Sparkles, MessageSquare, ShoppingBag, Smile, Zap, Palette, HeartHandshake, Footprints, Brain, CheckCircle } from 'lucide-react';

export interface QuizOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  explanation?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  placeholder?: string;
  icon?: LucideIcon;
}

export interface QuizQuestion {
  id: string;
  name: string; // for form data
  text: string;
  explanation?: string;
  type: 'radio' | 'checkbox' | 'textFields';
  options?: QuizOption[];
  fields?: FormFieldConfig[];
  condition?: (formData: Record<string, any>) => boolean;
  icon?: LucideIcon;
}

const unidadesComEsteticaAdicional = ['df'];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    name: 'experienciaPrevia',
    icon: User,
    text: 'Você já realizou algum tratamento de depilação a laser anteriormente?',
    explanation: 'Saber sobre suas experiências anteriores nos ajuda a personalizar nossa abordagem.',
    type: 'radio',
    options: [
      { value: 'sim', label: 'Sim, já fiz', icon: Smile },
      { value: 'nao', label: 'Não, primeira vez', icon: Sparkles },
    ],
  },
  {
    id: 'q2',
    name: 'areasInteresse',
    icon: ShoppingBag,
    text: 'Quais áreas do corpo você tem mais interesse em tratar com a depilação a laser Ice Lazer?',
    explanation: 'Você pode selecionar mais de uma opção. Escolha as áreas para uma depilação a laser confortável e eficaz.',
    type: 'checkbox',
    options: [
      { value: 'axilas', label: 'Axilas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/axila-1.png', dataAiHint: 'armpit body' },
      { value: 'virilha', label: 'Virilha', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/meia-virilha.png', dataAiHint: 'bikini line simple' },
      { value: 'perianal', label: 'Perianal', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/perianal.png', dataAiHint: 'perianal area' },
    ],
  },
  {
    id: 'q3',
    name: 'objetivoPrincipal',
    icon: Zap,
    text: 'Qual o seu principal objetivo ao buscar a depilação a laser?',
    explanation: 'Compreender seu objetivo principal nos permite focar no que é mais importante para você.',
    type: 'radio',
    options: [
      { value: 'reducao_permanente', label: 'Redução permanente dos pelos', explanation: 'Para uma pele lisa por muito mais tempo.' },
      { value: 'evitar_foliculite', label: 'Evitar pelos encravados e foliculite', explanation: 'Diga adeus à irritação e inflamação.' },
      { value: 'praticidade', label: 'Praticidade e economia de tempo', explanation: 'Liberte-se da rotina de depilação frequente.' },
      { value: 'pele_lisa', label: 'Melhorar a aparência e textura da pele', explanation: 'Conquiste uma pele mais suave e uniforme.' },
    ],
  },
  {
    id: 'q4',
    name: 'localizacao',
    icon: MapPin,
    text: 'Em qual estado você gostaria de realizar o tratamento ou ter mais informações?',
    explanation: 'Selecione o estado para um atendimento personalizado e informações sobre as unidades Ice Lazer disponíveis.',
    type: 'radio',
    options: [
      { value: 'df', label: 'Distrito Federal' },
      { value: 'ba', label: 'Bahia' },
      { value: 'ms', label: 'Mato Grosso do Sul' },
    ],
  },
  {
    id: 'q5',
    name: 'interesseEstetica',
    icon: Sparkles,
    text: 'Além da depilação a laser, as unidades da Ice Lazer no Distrito Federal oferecem outros procedimentos estéticos avançados. Você gostaria de saber mais sobre eles?',
    explanation: 'Temos tratamentos faciais, corporais e muito mais para realçar sua beleza!',
    type: 'radio',
    options: [
      { value: 'sim_estetica', label: 'Sim, tenho interesse!' },
      { value: 'nao_estetica', label: 'Não, obrigado(a). Foco na depilação por agora.' },
    ],
    condition: (formData) => unidadesComEsteticaAdicional.includes(formData.localizacao),
  },
  {
    id: 'q6',
    name: 'contato',
    icon: MessageSquare,
    text: 'Excelente! Para finalizarmos e nossa equipe entrar em contato com as melhores ofertas para você, por favor, deixe seu nome e WhatsApp:',
    explanation: 'Suas informações estão seguras conosco e serão usadas apenas para o contato sobre nossos serviços.',
    type: 'textFields',
    fields: [
      { name: 'nomeCompleto', label: 'Seu nome completo', type: 'text', placeholder: 'Ex: Maria Silva' },
      { name: 'whatsapp', label: 'Seu WhatsApp (com DDD)', type: 'tel', placeholder: 'Ex: (61) 99999-9999' },
    ],
  },
];

export const successIcon = CheckCircle;
