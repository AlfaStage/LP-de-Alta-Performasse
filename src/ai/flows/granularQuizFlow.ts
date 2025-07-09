
'use server';
/**
 * @fileOverview A flow to generate specific sections of a quiz using AI.
 */

import { ai } from '@/ai/genkit';
import { getAiPrompts } from '@/lib/ai.server';
import { z } from 'genkit';

const GranularQuizGenerationInputSchema = z.object({
  topic: z.string().describe('The topic or instruction for the quiz section to be generated.'),
  generationType: z.enum(['details', 'questions', 'messages', 'results']).describe('The section of the quiz to generate.'),
  generationMode: z.enum(['overwrite', 'improve', 'complete']).describe('The mode of generation.'),
  existingData: z.string().optional().describe('A JSON string of the existing data for this section, if any.'),
});
export type GranularQuizGenerationInput = z.infer<typeof GranularQuizGenerationInputSchema>;

const GranularQuizGenerationOutputSchema = z.object({
  jsonOutput: z.string().describe('A valid JSON string representing the generated quiz section.'),
});
export type GranularQuizGenerationOutput = z.infer<typeof GranularQuizGenerationOutputSchema>;

export async function generateQuizSection(input: GranularQuizGenerationInput): Promise<GranularQuizGenerationOutput> {
  return granularQuizFlow(input);
}

const granularQuizFlow = ai.defineFlow(
  {
    name: 'granularQuizFlow',
    inputSchema: GranularQuizGenerationInputSchema,
    outputSchema: GranularQuizGenerationOutputSchema,
  },
  async (input) => {
    // Fetch the customizable prompts from the configuration file.
    const promptsConfig = await getAiPrompts();
    let promptText = '';

    // Select the appropriate prompt based on the generation type
    switch (input.generationType) {
        case 'details':
            promptText = promptsConfig.generateQuizDetails;
            break;
        case 'questions':
            promptText = promptsConfig.generateQuizQuestions;
            break;
        case 'messages':
            promptText = promptsConfig.generateQuizMessages;
            break;
        case 'results':
            promptText = promptsConfig.generateQuizResultsPages;
            break;
        default:
            throw new Error(`Invalid generation type: ${input.generationType}`);
    }

    // Dynamically define the prompt inside the flow to use the fetched text.
    const granularPrompt = ai.definePrompt({
      name: 'dynamicGranularQuizPrompt',
      input: { schema: GranularQuizGenerationInputSchema },
      output: { schema: z.object({ jsonOutput: z.string() }) }, // Ensure output schema matches what AI should return
      prompt: promptText,
    });
    
    // The prompt expects 'jsonOutput' in the result object, so we wrap it.
    const { output } = await granularPrompt(input);
    if (!output || !output.jsonOutput) {
      throw new Error("AI did not return the expected 'jsonOutput' field.");
    }
    
    return { jsonOutput: output.jsonOutput };
  }
);
