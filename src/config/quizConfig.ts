
import type { LucideIcon } from 'lucide-react';
import { User, MapPin, Sparkles, MessageSquare, ShoppingBag, Smile, Zap, Building, Palette, HeartHandshake, Footprints, Brain, CheckCircle } from 'lucide-react';

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

const dfUnidades = ['brasilia_df'];

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
      // ROSTO
      { value: 'buco', label: 'Buço', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/buco.png', dataAiHint: 'upper lip face' },
      { value: 'queixo', label: 'Queixo', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/queixo.png', dataAiHint: 'chin face' },
      { value: 'maxilar', label: 'Maxilar', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/maxilar.png', dataAiHint: 'jawline face' },
      { value: 'testa', label: 'Testa', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/testa.png', dataAiHint: 'forehead face' },
      { value: 'bochechas', label: 'Bochechas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/bochechas.png', dataAiHint: 'cheeks face' },
      { value: 'nariz', label: 'Nariz', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/nariz.png', dataAiHint: 'nose face' },
      { value: 'glabela', label: 'Glabela', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/glabela.png', dataAiHint: 'eyebrows face' },
      // MEMBROS SUPERIORES
      { value: 'axilas', label: 'Axilas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/axila-1.png', dataAiHint: 'armpit body' },
      { value: 'antebracos', label: 'Antebraços', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/antebraco.png', dataAiHint: 'forearms body' },
      { value: 'bracos_completos', label: 'Braços Completos', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/bracos-completos.png', dataAiHint: 'full arms body' },
      { value: 'maos_dedos', label: 'Mãos e Dedos', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/maos.png', dataAiHint: 'hands fingers' },
      // TRONCO
      { value: 'areolas', label: 'Aréolas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/aureola.png', dataAiHint: 'areolas chest' },
      { value: 'seios', label: 'Seios', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/seios.png', dataAiHint: 'breasts chest' },
      { value: 'abdomen', label: 'Abdômen', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/abdomen.png', dataAiHint: 'abdomen body' },
      { value: 'linha_alba', label: 'Linha Alba', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/linha-alba.png', dataAiHint: 'linea alba stomach' },
      { value: 'costas', label: 'Costas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/costas.png', dataAiHint: 'back body' },
      { value: 'lombar', label: 'Lombar', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/lombar.png', dataAiHint: 'lower back' },
      // REGIÃO ÍNTIMA
      { value: 'virilha_simples', label: 'Virilha Simples', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/meia-virilha.png', dataAiHint: 'bikini line simple' },
      { value: 'virilha_cavada', label: 'Virilha Cavada', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/virilha-cavada.png', dataAiHint: 'deep bikini line' },
      { value: 'virilha_completa', label: 'Virilha Completa', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/virilha-total.png', dataAiHint: 'full bikini area' },
      { value: 'perianal', label: 'Perianal', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/perianal.png', dataAiHint: 'perianal area' },
      { value: 'coccix', label: 'Cóccix', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/coccix.png', dataAiHint: 'tailbone area' },
      // MEMBROS INFERIORES
      { value: 'meia_perna', label: 'Meia Perna', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/meia-perna.png', dataAiHint: 'half leg' },
      { value: 'coxas', label: 'Coxas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/coxa.png', dataAiHint: 'thighs body' },
      { value: 'pernas_completas', label: 'Pernas Completas', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/pernas-completas.png', dataAiHint: 'full legs body' },
      { value: 'pes_dedos', label: 'Pés e Dedos', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/pes.png', dataAiHint: 'feet toes' },
      { value: 'interno_coxa', label: 'Interno de Coxa', imageUrl: 'https://espacoicelaser.com/wp-content/uploads/2021/09/entre-coxas.png', dataAiHint: 'inner thigh' },
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
    text: 'Qual unidade da Ice Lazer está mais próxima de você ou é de sua preferência?',
    explanation: 'Selecione a localidade para um atendimento personalizado.',
    type: 'radio',
    options: [
      { value: 'brasilia_df', label: 'Brasília - DF', icon: Building },
      { value: 'salvador_ba', label: 'Salvador - BA', icon: Building },
      { value: 'campo_grande_ms', label: 'Campo Grande - MS', icon: Building },
    ],
  },
  {
    id: 'q5',
    name: 'interesseEstetica',
    icon: Sparkles,
    text: 'Além da depilação a laser, as unidades da Ice Lazer em Brasília - DF oferecem outros procedimentos estéticos avançados. Você gostaria de saber mais sobre eles?',
    explanation: 'Temos tratamentos faciais, corporais e muito mais para realçar sua beleza!',
    type: 'radio',
    options: [
      { value: 'sim_estetica', label: 'Sim, tenho interesse!' },
      { value: 'nao_estetica', label: 'Não, obrigado(a). Foco na depilação por agora.' },
    ],
    condition: (formData) => dfUnidades.includes(formData.localizacao),
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
