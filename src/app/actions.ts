
"use server";

interface AbandonedQuizData {
  [key: string]: any;
  timestamp: string;
  quizType: string;
}

export async function logQuizAbandonment(data: Record<string, any>) {
  const webhookUrl = process.env.QUIZ_ABANDONMENT_WEBHOOK_URL || "YOUR_WEBHOOK_URL";

  if (webhookUrl === "YOUR_WEBHOOK_URL") {
    console.warn("Quiz abandonment webhook URL not configured. Data not sent.");
    return { success: false, message: "Webhook URL not configured." };
  }

  const payload: AbandonedQuizData = {
    ...data,
    timestamp: new Date().toISOString(),
    quizType: "IceLazerLeadFilter_Abandonment_V2",
  };

  try
 {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook for abandoned quiz failed with status: ${response.status}`, await response.text());
      return { success: false, message: `Webhook request failed with status ${response.status}` };
    }
    console.log("Quiz abandonment data sent to webhook:", payload);
    return { success: true, message: "Data sent to webhook." };
  } catch (error) {
    console.error("Error sending quiz abandonment data to webhook:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error sending data to webhook: ${errorMessage}` };
  }
}

interface SubmitQuizResponse {
  status: 'success' | 'invalid_number' | 'webhook_error' | 'network_error';
  message: string;
}

export async function submitQuizData(data: Record<string, any>): Promise<SubmitQuizResponse> {
  const webhookUrl = "https://webhook.workflow.alfastage.com.br/webhook/icelazerquiz-mensagem";
  const payload = data;

  console.log("Attempting to submit quiz data to webhook. URL:", webhookUrl);
  console.log("Payload being sent:", JSON.stringify(payload, null, 2));

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
      // Mesmo que a resposta HTTP não seja OK, o header 'status' pode dar uma informação mais específica.
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

    // Resposta HTTP foi OK (2xx)
    if (webhookStatusHeader === 'mensagem enviada') {
      console.log("Submitted quiz data sent to webhook successfully. Webhook 'status' header: mensagem enviada");
      return { status: 'success', message: "Dados enviados com sucesso!" };
    } else if (webhookStatusHeader === 'numero incorreto') {
      console.log("Webhook 'status' header: numero incorreto");
      return { status: 'invalid_number', message: "O número de WhatsApp informado parece estar incorreto. Por favor, verifique e tente novamente." };
    } else {
      const responseBodyText = await response.text(); // Consumir o corpo para liberar a conexão
      console.warn("Webhook response OK, but 'status' header was missing or unexpected:", webhookStatusHeader);
      console.warn("Response body (if any):", responseBodyText);
      // Se o HTTP é OK mas o header não é o esperado, consideramos um erro de lógica do webhook ou contrato.
      return { status: 'webhook_error', message: `Resposta inesperada do webhook. Header 'status': ${webhookStatusHeader || 'não encontrado'}` };
    }

  } catch (error) {
    console.error("Critical error sending submitted quiz data to webhook (catch block):", error);
    console.error("Payload that caused the error:", JSON.stringify(payload, null, 2));
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: 'network_error', message: `Erro ao conectar com o serviço de webhook: ${errorMessage}` };
  }
}
