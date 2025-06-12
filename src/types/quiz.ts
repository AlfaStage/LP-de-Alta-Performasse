
import type { LucideIcon } from 'lucide-react';

export interface QuizOption {
  value: string;
  label: string;
  icon?: keyof typeof import('lucide-react'); // Store icon name
  explanation?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  placeholder?: string;
  icon?: keyof typeof import('lucide-react'); // Store icon name
}

export interface QuizQuestion {
  id: string;
  name: string; // for form data
  text: string;
  explanation?: string;
  type: 'radio' | 'checkbox' | 'textFields';
  options?: QuizOption[];
  fields?: FormFieldConfig[];
  condition?: (formData: Record<string, any>) => boolean; // Condition logic might be tricky to serialize/deserialize if complex
  icon?: keyof typeof import('lucide-react'); // Store icon name
}

export interface QuizConfig {
  title: string;
  slug: string;
  questions: QuizQuestion[];
  successIcon?: keyof typeof import('lucide-react');
  // Potentially add other quiz-specific metadata here
}

// Helper to get Lucide icon components dynamically
// This is a simplified example. For a robust solution, you might need a map or more complex dynamic import.
// Ensure all used icons are actually available in lucide-react.
export const getLucideIcon = (iconName?: keyof typeof import('lucide-react')): LucideIcon | undefined => {
  if (!iconName) return undefined;
  const icons = require('lucide-react');
  return icons[iconName] as LucideIcon;
};
