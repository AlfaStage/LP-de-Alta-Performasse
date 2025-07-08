'use server';
/**
 * @fileOverview A flow to generate a complete quiz from a topic using AI.
 *
 * - generateQuizFromTopic - A function that takes a topic and returns a QuizConfig JSON.
 * - QuizGenerationInput - The input type for the flow.
 * - QuizGenerationOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuizGenerationInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz to be generated.'),
});
export type QuizGenerationInput = z.infer<typeof QuizGenerationInputSchema>;

// The output is a string, which we will parse as JSON.
const QuizGenerationOutputSchema = z.object({
  quizJson: z.string().describe('A valid JSON string representing the entire QuizConfig object.'),
});
export type QuizGenerationOutput = z.infer<typeof QuizGenerationOutputSchema>;

export async function generateQuizFromTopic(input: QuizGenerationInput): Promise<QuizGenerationOutput> {
  return quizGeneratorFlow(input);
}

// For reference, we include the type definitions inside the prompt.
const typeDefinitionsForPrompt = `
// Type Definitions for Quiz Structure
// Do not include these types in the final JSON output. This is for structural reference only.
interface QuizOption {
  value: string;
  label: string;
  icon?: string; // Must be a valid name from lucide-react icon library
  explanation?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

interface FormFieldConfig {
  name: string;
  label:string;
  type: 'text' | 'tel' | 'email';
  placeholder?: string;
  icon?: string; // Must be a valid name from lucide-react icon library
}

interface QuizQuestion {
  id: string; // unique identifier for the question, e.g., "q1_main_goal"
  name: string; // form field name, e.g., "mainGoal"
  text: string; // The question text presented to the user.
  explanation?: string; // A short explanation of the question.
  type: 'radio' | 'checkbox' | 'textFields';
  options?: QuizOption[];
  fields?: FormFieldConfig[];
  icon?: string; // A valid name from lucide-react icon library, e.g., "Trophy"
}

interface QuizConfig {
  title: string;
  slug: string; // a URL-friendly version of the title. e.g., "awesome-quiz"
  description?: string;
  dashboardName?: string; // An internal name for the dashboard.
  questions: QuizQuestion[];
  successIcon?: string; // e.g. "CheckCircle"
  isActive?: boolean;
  useCustomTheme?: boolean;
  displayMode?: 'step-by-step' | 'single-page';
}
`;


const quizGeneratorPrompt = ai.definePrompt({
  name: 'quizGeneratorPrompt',
  input: { schema: QuizGenerationInputSchema },
  output: { schema: QuizGenerationOutputSchema },
  prompt: `Você é um especialista em marketing e criação de conteúdo para geração de leads. Sua tarefa é criar um quiz completo, envolvente e divertido sobre um determinado tópico.

O quiz deve ser estruturado em um formato JSON específico. O resultado final deve ser APENAS o objeto JSON, sem nenhum texto, explicação ou markdown antes ou depois dele.

Tópico do Quiz: {{{topic}}}

Siga estas regras estritamente:
1.  **Título e Nomes**: Crie um título ('title') e nome para o dashboard ('dashboardName') cativantes para o quiz.
2.  **Slug**: O 'slug' deve ser uma versão do título otimizada para URL (letras minúsculas, sem espaços, usar hífens).
3.  **Perguntas**: Crie de 3 a 5 perguntas no total.
4.  **Etapa de Contato**: A ÚLTIMA pergunta DEVE ser do tipo 'textFields' para coletar o nome, WhatsApp e email do usuário. Use os nomes de campo 'nomeCompleto', 'whatsapp', e 'email'.
5.  **Tipos de Pergunta**: Varie os tipos de pergunta entre 'radio' (escolha única) e 'checkbox' (múltipla escolha) para as outras perguntas.
6.  **Ícones**: Use nomes de ícones válidos da biblioteca 'lucide-react' para os campos 'icon'. Escolha ícones que façam sentido para a pergunta ou opção.
7.  **Validade do JSON**: O JSON deve ser perfeitamente válido e pronto para ser parseado.

Aqui está a estrutura de tipos TypeScript como referência. NÃO inclua isso no JSON final, use apenas para entender a estrutura:
${typeDefinitionsForPrompt}

Exemplo de uma pergunta de contato:
{
  "id": "final_contact_step",
  "name": "contato",
  "icon": "MessageSquare",
  "text": "Excelente! Para finalizarmos e nossa equipe entrar em contato, por favor, deixe seus dados:",
  "explanation": "Suas informações estão seguras conosco.",
  "type": "textFields",
  "fields": [
    { "name": "nomeCompleto", "label": "Seu nome completo", "type": "text", "placeholder": "Ex: Maria da Silva", "icon": "User" },
    { "name": "whatsapp", "label": "Seu WhatsApp (com DDD)", "type": "tel", "placeholder": "Ex: (11) 98765-4321", "icon": "Smartphone" },
    { "name": "email", "label": "Seu melhor email", "type": "email", "placeholder": "Ex: maria.silva@email.com", "icon": "Mail" }
  ]
}

Agora, gere o JSON completo para o quiz sobre "{{{topic}}}".`,
});


const quizGeneratorFlow = ai.defineFlow(
  {
    name: 'quizGeneratorFlow',
    inputSchema: QuizGenerationInputSchema,
    outputSchema: QuizGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await quizGeneratorPrompt(input);
    return output!;
  }
);
