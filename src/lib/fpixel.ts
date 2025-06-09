export const trackPageView = () => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'PageView');
  }
};

export const trackEvent = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', name, options);
  }
};

export const trackCustomEvent = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', name, options);
  }
};

export const trackQuizStep = (stepNumber: number, questionId: string) => {
  trackCustomEvent('QuizStepViewed', { stepNumber, questionId });
};

export const trackLeadGenerated = (leadDetails: {
  quiz_name: string;
  value?: number;
  currency?: string;
  lead_name?: string;
  lead_whatsapp?: string;
}) => {
  trackEvent('Lead', leadDetails);
};
