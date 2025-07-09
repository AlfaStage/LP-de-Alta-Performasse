
"use server";
import { SERVER_SIDE_ABANDONMENT_WEBHOOK_URL as ENV_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL } from '@/config/appConfig';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { recordQuizCompletedAction, getQuizConfigForPreview } from '@/app/config/dashboard/quiz/actions'; // Importar a nova função
import type { QuizQuestion } from '@/types/quiz';

interface ClientInfo {
  userAgent?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
  windowWidth?: number;
  windowHeight?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface AbandonedQuizData {
  [key: string]: any; // existing quiz answers
  quizSlug?: string;
  quizType?: string;
  abandonedAtStep?: string | number;
  clientInfo?: ClientInfo;
  abandonedAt?: string; // ISO timestamp
}

export async function logQuizAbandonment(data: Record<string, any>, quizSlugInput?: string) {
  const webhookUrl = ENV_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === "YOUR_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL") {
    console.warn("Server-side Quiz abandonment webhook URL not configured. Data not sent.", { webhookUrl });
    return { success: false, message: "Webhook URL not configured." };
  }

  const payload: AbandonedQuizData = {
    ...data, 
  };

  if (!payload.quizSlug && quizSlugInput) {
    payload.quizSlug = quizSlugInput;
  }
  
  payload.quizType = payload.quizType || `IceLazerLeadFilter_Abandonment_V2_Server`; 
  payload.abandonedAt = payload.abandonedAt || new Date().toISOString();


  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook for abandoned quiz (server) failed with status: ${response.status}`, await response.text());
      return { success: false, message: `Webhook request failed with status ${response.status}` };
    }
    console.log("Quiz abandonment data sent to server-side webhook:", JSON.stringify(payload, null, 2));
    return { success: true, message: "Data sent to webhook." };
  } catch (error) {
    console.error("Error sending quiz abandonment data to server-side webhook:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error sending data to webhook: ${errorMessage}` };
  }
}

interface SubmitQuizResponse {
  status: 'success' | 'invalid_number' | 'webhook_error' | 'network_error';
  message: string;
}

export async function submitQuizData(data: Record<string, any>, isDisqualified: boolean): Promise<SubmitQuizResponse> {
  const whitelabelConfig = await getWhitelabelConfig();
  
  const webhookUrl = isDisqualified 
    ? whitelabelConfig.disqualifiedSubmissionWebhookUrl 
    : whitelabelConfig.quizSubmissionWebhookUrl;
  
  const { quizSlug, quizTitle, clientInfo, submittedAt } = data;

  if (!quizSlug) {
    console.warn("Quiz slug is missing in the submission data. This is unexpected.");
    return { status: 'webhook_error', message: "Identificador do quiz ausente." };
  }
  
  // Record completion for analytics regardless of qualification status
  await recordQuizCompletedAction(quizSlug);

  if (!webhookUrl || webhookUrl.trim() === "" || webhookUrl.includes("_PLACEHOLDER")) {
    const reason = isDisqualified ? "disqualified submission" : "quiz submission";
    console.warn(`${reason} webhook URL not properly configured in Whitelabel settings. Data for ${quizSlug} not sent.`, { webhookUrl });
    
    // If disqualified and no webhook, it's a "success" for the user, data is just dropped.
    if (isDisqualified) {
      return { status: 'success', message: "Dados do usuário desqualificado processados." };
    }
    
    return { status: 'webhook_error', message: `Webhook de submissão (${isDisqualified ? 'desqualificado' : 'padrão'}) não configurado.` };
  }
  
  const quizConfig = await getQuizConfigForPreview(quizSlug);
  if (!quizConfig) {
      console.error("Quiz config not found for slug:", quizSlug);
      return { status: 'webhook_error', message: `Configuração do quiz '${quizSlug}' não encontrada.` };
  }

  // 1. Construct 'perguntas' object from form data
  const perguntas: Record<string, any> = {};
  quizConfig.questions.forEach(q => {
      if (q.type === 'textFields' && q.fields) {
          q.fields.forEach(field => {
              if (data[field.name] !== undefined) {
                  perguntas[field.name] = data[field.name];
              }
          });
      } else {
          if (data[q.name] !== undefined) {
              perguntas[q.name] = data[q.name];
          }
      }
  });

  // 2. Get 'mensagens' array from quiz config and perform variable substitution
  const findQuestionByAnswerKey = (key: string): QuizQuestion | undefined => {
    for (const q of quizConfig.questions) {
      if (q.name === key) return q;
      if (q.fields?.some(f => f.name === key)) return q;
    }
    return undefined;
  };

  const processedMessages = (quizConfig.messages || []).map(msg => {
    let processedContent = msg.content;
    if (msg.type === 'mensagem') {
      processedContent = msg.content.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variableName) => {
        const value = perguntas[variableName];
        if (value === undefined) {
          return match; // Variable not found in answers, leave tag as is
        }

        // For radio or checkbox, try to find the label instead of the value
        const question = findQuestionByAnswerKey(variableName);
        if (question && question.options) {
          if (Array.isArray(value)) { // Checkbox
            const labels = value.map(v => {
              const option = question.options?.find(o => o.value === v);
              if (!option) return v;
              return (option.text_message && option.text_message.trim() !== '') ? option.text_message : option.label;
            });
            return labels.join(', ');
          } else { // Radio
            const option = question.options.find(o => o.value === value);
            if (!option) return value;
            return (option.text_message && option.text_message.trim() !== '') ? option.text_message : option.label;
          }
        }
        
        // For text fields or if no label is found (e.g. legacy data)
        return String(value);
      });
    }
    return {
      tipo: msg.type,
      conteúdo: processedContent,
      ...(msg.filename && { filename: msg.filename }),
    };
  });


  // 3. Construct the final payload with nested body
  const payload = {
      quizSlug,
      quizTitle,
      clientInfo,
      submittedAt,
      isDisqualified, // Add the disqualification status
      body: {
          perguntas,
          mensagens: processedMessages
      }
  };


  console.log(`Attempting to submit ${isDisqualified ? 'disqualified ' : ''}quiz data to webhook. URL:`, webhookUrl);
  console.log("Payload being sent to webhook:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const webhookStatusHeader = response.headers.get('status');
    console.log("Webhook response HTTP status:", response.status);
    console.log("Webhook response 'status' header:", webhookStatusHeader);

    if (!response.ok) {
      if (webhookStatusHeader === 'numero incorreto' && !isDisqualified) {
        console.warn("Webhook returned non-OK HTTP status but 'status' header is 'numero incorreto'.");
        return { status: 'invalid_number', message: "O número de WhatsApp informado parece estar incorreto. Por favor, verifique e tente novamente." };
      }
      const errorBody = await response.text();
      console.error(`Webhook for submitted quiz failed. HTTP Status: ${response.status}`);
      console.error("Response body from webhook:", errorBody);
      console.error("Payload that failed:", JSON.stringify(payload, null, 2));
      return { status: 'webhook_error', message: `Falha ao enviar os dados (HTTP ${response.status}). Detalhes: ${errorBody}` };
    }
    
    // For disqualified leads, a 200 OK is sufficient.
    if(isDisqualified) {
       console.log("Disqualified quiz data sent to webhook successfully.");
       return { status: 'success', message: "Dados enviados com sucesso!" };
    }

    if (webhookStatusHeader === 'mensagem enviada') {
      console.log("Submitted quiz data sent to webhook successfully. Webhook 'status' header: mensagem enviada");
      return { status: 'success', message: "Dados enviados com sucesso!" };
    } else if (webhookStatusHeader === 'numero incorreto') {
      console.log("Webhook 'status' header: numero incorreto");
      return { status: 'invalid_number', message: "O número de WhatsApp informado parece estar incorreto. Por favor, verifique e tente novamente." };
    } else {
      const responseBodyText = await response.text(); 
      console.warn("Webhook response OK, but 'status' header was missing or unexpected:", webhookStatusHeader);
      console.warn("Response body (if any):", responseBodyText);
      return { status: 'webhook_error', message: `Resposta inesperada do webhook. Header 'status': ${webhookStatusHeader || 'não encontrado'}` };
    }

  } catch (error) {
    console.error("Critical error sending submitted quiz data to webhook (catch block):", error);
    console.error("Payload that caused the error:", JSON.stringify(payload, null, 2));
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: 'network_error', message: `Erro ao conectar com o serviço de webhook: ${errorMessage}` };
  }
}
