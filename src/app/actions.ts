
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

// The SubmittedQuizData interface might not be needed if the webhook expects raw data.
// If the webhook expects specific metadata like submittedAt or quizType,
// those should ideally be part of the 'data' object passed from the form,
// or the webhook should handle timestamping/typing itself.
// For now, we'll send the raw 'data' as per the request for a direct JSON of answers.

export async function submitQuizData(data: Record<string, any>) {
  const webhookUrl = "https://webhook.workflow.alfastage.com.br/webhook/icelazer";

  // The payload is now the 'data' object itself, which includes all questions and contact info.
  const payload = data;

  console.log("Attempting to submit quiz data to webhook. URL:", webhookUrl);
  console.log("Payload being sent:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Send the raw data object as JSON
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Webhook for submitted quiz failed. Status: ${response.status}`);
      console.error("Response body from webhook:", errorBody);
      console.error("Payload that failed:", JSON.stringify(payload, null, 2));
      return { success: false, message: `Falha ao enviar os dados (HTTP ${response.status}). Detalhes: ${errorBody}` };
    }

    // It's good practice to see what a successful response looks like too, if anything.
    const successResponseBody = await response.text();
    console.log("Submitted quiz data sent to webhook successfully. Status:", response.status);
    if (successResponseBody) {
      console.log("Response body from webhook (success):", successResponseBody);
    }
    
    return { success: true, message: "Dados enviados com sucesso para o webhook." };
  } catch (error) {
    console.error("Critical error sending submitted quiz data to webhook (catch block):", error);
    console.error("Payload that caused the error:", JSON.stringify(payload, null, 2));
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erro ao conectar com o serviço de webhook: ${errorMessage}` };
  }
}
