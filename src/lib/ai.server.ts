
import { promises as fs } from 'fs';
import path from 'path';
import type { AiPromptsConfig } from '@/types/quiz';

const promptsFilePath = path.join(process.cwd(), 'src', 'data', 'ai-prompts.json');

export const defaultPrompts: AiPromptsConfig = {
  fullQuizGeneration: `Você é um especialista em marketing e criação de conteúdo para geração de leads. Sua tarefa é criar um quiz completo, envolvente e divertido sobre um determinado tópico.

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

Agora, gere o JSON completo para o quiz sobre "{{{topic}}}".`
};

async function ensurePromptsFileExists() {
  try {
    await fs.access(promptsFilePath);
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(promptsFilePath), { recursive: true });
      await fs.writeFile(promptsFilePath, JSON.stringify(defaultPrompts, null, 2), 'utf8');
      console.log('Created default ai-prompts.json at:', promptsFilePath);
    } catch (writeError) {
      console.error('Failed to write default ai-prompts.json:', writeError);
    }
  }
}

export async function getAiPrompts(): Promise<AiPromptsConfig> {
  await ensurePromptsFileExists();
  try {
    const fileContents = await fs.readFile(promptsFilePath, 'utf8');
    const savedPrompts = JSON.parse(fileContents) as Partial<AiPromptsConfig>;
    return { ...defaultPrompts, ...savedPrompts };
  } catch (error) {
    console.warn('Failed to read or parse ai-prompts.json, returning default prompts:', error);
    return defaultPrompts;
  }
}

export async function saveAiPrompts(newPrompts: AiPromptsConfig): Promise<{ success: boolean; message?: string }> {
  try {
    await fs.writeFile(promptsFilePath, JSON.stringify(newPrompts, null, 2), 'utf8');
    return { success: true, message: 'Prompts de IA salvos com sucesso!' };
  } catch (error) {
    console.error('Failed to save ai-prompts.json:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, message: `Erro ao salvar prompts: ${errorMessage}` };
  }
}
