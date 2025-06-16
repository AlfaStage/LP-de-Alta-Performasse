
"use server";
import { SERVER_SIDE_ABANDONMENT_WEBHOOK_URL as ENV_SERVER_SIDE_ABANDONMENT_WEBHOOK_URL } from '@/config/appConfig';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { updateQuizStat } from '@/app/config/dashboard/quiz/actions'; // Importar a função para atualizar estatísticas

interface ClientInfo {
  userAgent?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
  windowWidth?: number;
  windowHeight?: number;
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

export async function submitQuizData(data: Record<string, any>): Promise<SubmitQuizResponse> {
  const whitelabelConfig = await getWhitelabelConfig();
  const webhookUrl = whitelabelConfig.quizSubmissionWebhookUrl;
  
  const payload = { ...data }; 

  if (!payload.quizSlug) {
    console.warn("Quiz slug is missing in the submission data. This is unexpected.");
  }

  if (!webhookUrl || webhookUrl === "YOUR_QUIZ_SUBMISSION_WEBHOOK_URL_PLACEHOLDER" || webhookUrl.trim() === "") {
    console.warn("Quiz submission webhook URL not properly configured in Whitelabel settings. Data not sent.", { webhookUrl, quizSlug: payload.quizSlug });
    return { status: 'webhook_error', message: "Webhook de submissão não configurado nas configurações Whitelabel." };
  }

  console.log("Attempting to submit quiz data to webhook. URL:", webhookUrl);
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
      if (webhookStatusHeader === 'numero incorreto') {
        console.warn("Webhook returned non-OK HTTP status but 'status' header is 'numero incorreto'.");
        return { status: 'invalid_number', message: "O número de WhatsApp informado parece estar incorreto. Por favor, verifique e tente novamente." };
      }
      const errorBody = await response.text();
      console.error(`Webhook for submitted quiz failed. HTTP Status: ${response.status}`);
      console.error("Response body from webhook:", errorBody);
      console.error("Payload that failed:", JSON.stringify(payload, null, 2));
      return { status: 'webhook_error', message: `Falha ao enviar os dados (HTTP ${response.status}). Detalhes: ${errorBody}` };
    }

    if (webhookStatusHeader === 'mensagem enviada') {
      console.log("Submitted quiz data sent to webhook successfully. Webhook 'status' header: mensagem enviada");
      // Registrar que o quiz foi completado
      if (payload.quizSlug) {
        await updateQuizStat(payload.quizSlug, 'completedCount');
      }
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
