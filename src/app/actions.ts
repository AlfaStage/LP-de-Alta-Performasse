
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

interface SubmittedQuizData {
  [key: string]: any;
  submittedAt: string;
  quizType: string;
}

export async function submitQuizData(data: Record<string, any>) {
  const webhookUrl = "https://webhook.workflow.alfastage.com.br/webhook/icelazer";

  const payload: SubmittedQuizData = {
    ...data,
    submittedAt: new Date().toISOString(),
    quizType: "IceLazerLeadFilter_Submission_V2",
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Webhook for submitted quiz failed with status: ${response.status}`, errorBody);
      return { success: false, message: `Falha ao enviar: ${response.status}. Detalhes: ${errorBody}` };
    }
    console.log("Submitted quiz data sent to webhook:", payload);
    return { success: true, message: "Dados enviados com sucesso para o webhook." };
  } catch (error) {
    console.error("Error sending submitted quiz data to webhook:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Erro ao enviar dados para o webhook: ${errorMessage}` };
  }
}
