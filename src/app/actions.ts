"use server";

interface AbandonedQuizData {
  [key: string]: any;
  timestamp: string;
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
  };

  try {
    // Note: In a real scenario, this fetch should be done client-side using navigator.sendBeacon
    // or fetch with keepalive if this server action is called from a beforeunload handler.
    // However, the prompt specifies a server action for the webhook.
    // For robustness in `beforeunload`, direct client-side beaconing is preferred.
    // This server action serves as a proxy if direct client-side beaconing to an external URL is restricted or complex.
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook failed with status: ${response.status}`, await response.text());
      return { success: false, message: `Webhook request failed with status ${response.status}` };
    }
    console.log("Quiz abandonment data sent to webhook:", payload);
    return { success: true, message: "Data sent to webhook." };
  } catch (error) {
    console.error("Error sending data to webhook:", error);
    return { success: false, message: "Error sending data to webhook." };
  }
}
