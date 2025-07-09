
'use server';
/**
 * @fileOverview A flow to generate a complete quiz from a topic using AI.
 *
 * - generateQuizFromTopic - A function that takes a topic and returns a QuizConfig JSON.
 * - QuizGenerationInput - The input type for the flow.
 * - QuizGenerationOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { getAiPrompts } from '@/lib/ai.server';
import { z } from 'genkit';

const QuizGenerationInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz to be generated.'),
});
export type QuizGenerationInput = z.infer<typeof QuizGenerationInputSchema>;

// The output is a string, which we will parse as JSON.
const QuizGenerationOutputSchema = z.object({
  quizJson: z.string().describe('A valid JSON string representing the entire QuizConfig object.'),
});
export type QuizGenerationOutput = z.infer<typeof QuizGenerationOutputSchema>;

export async function generateQuizFromTopic(input: QuizGenerationInput): Promise<QuizGenerationOutput> {
  return quizGeneratorFlow(input);
}

const quizGeneratorFlow = ai.defineFlow(
  {
    name: 'quizGeneratorFlow',
    inputSchema: QuizGenerationInputSchema,
    outputSchema: QuizGenerationOutputSchema,
  },
  async (input) => {
    // Fetch the customizable prompt from the configuration file.
    const promptsConfig = await getAiPrompts();
    const promptText = promptsConfig.fullQuizGeneration;

    // Dynamically define the prompt inside the flow to use the fetched text.
    const quizGeneratorPrompt = ai.definePrompt({
      name: 'dynamicQuizGeneratorPrompt',
      input: { schema: QuizGenerationInputSchema },
      output: { schema: QuizGenerationOutputSchema },
      prompt: promptText,
    });
    
    const { output } = await quizGeneratorPrompt(input);
    return output!;
  }
);
