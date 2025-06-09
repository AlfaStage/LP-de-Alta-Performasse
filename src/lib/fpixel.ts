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
