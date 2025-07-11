
'use server';
/**
 * @fileOverview A flow to generate specific sections of a quiz using AI.
 */

import { ai } from '@/ai/genkit';
import { getWhitelabelConfig, getAiPrompts } from '@/lib/ai.server';
import { z } from 'genkit';
import { defaultPrompts } from '@/lib/ai.server';

const GranularQuizGenerationInputSchema = z.object({
  topic: z.string().describe('The topic or instruction for the quiz section to be generated.'),
  generationType: z.enum(['details', 'questions', 'messages', 'results']).describe('The section of the quiz to generate.'),
  generationMode: z.enum(['overwrite', 'improve', 'complete']).describe('The mode of generation.'),
  existingData: z.string().optional().describe('A JSON string of the entire existing quiz data for context.'),
});
export type GranularQuizGenerationInput = z.infer<typeof GranularQuizGenerationInputSchema>;

// Shared output schema
const JsonOutputSchema = z.object({
  jsonOutput: z.string().describe('A valid JSON string representing the generated quiz section.'),
});
export type GranularQuizGenerationOutput = z.infer<typeof JsonOutputSchema>;


export async function generateQuizSection(input: GranularQuizGenerationInput): Promise<GranularQuizGenerationOutput> {
  return granularQuizFlow(input);
}

// Fixed JSON structures for the AI to follow. These are NOT editable by the user.
// This ensures the AI always returns the correct format.
const jsonStructures = {
    details: `{\"title\": \"...\", \"dashboardName\": \"...\", \"slug\": \"...\", \"description\": \"...\"}`,
    questions: `{\"questions\": [{\"id\": \"...\", \"name\": \"...\", \"text\": \"...\", \"type\": \"radio\", \"icon\": \"HelpCircle\", \"isRequired\": true, \"options\": [{\"value\": \"...\", \"label\": \"...\", \"isDisqualifying\": false}]}]}`,
    messages: `{\"messages\": [{\"id\": \"...\", \"type\": \"mensagem\", \"content\": \"...\"}]}`,
    results: `{\"successPageText\": \"...\", \"disqualifiedPageText\": \"...\"}`,
};

const granularQuizFlow = ai.defineFlow(
  {
    name: 'granularQuizFlow',
    inputSchema: GranularQuizGenerationInputSchema,
    outputSchema: JsonOutputSchema,
  },
  async (input) => {
    const [promptsConfig, whitelabelConfig] = await Promise.all([
        getAiPrompts(),
        getWhitelabelConfig(),
    ]);

    const modelToUse = whitelabelConfig.aiModel || 'googleai/gemini-1.5-flash';
    let userEditablePrompt = '';
    let jsonStructure = '';
    let modeInstruction = '';

    // Select the appropriate prompt based on the generation type
    switch (input.generationType) {
        case 'details':
            userEditablePrompt = promptsConfig.generateQuizDetails || defaultPrompts.generateQuizDetails;
            jsonStructure = jsonStructures.details;
            break;
        case 'questions':
            userEditablePrompt = promptsConfig.generateQuizQuestions || defaultPrompts.generateQuizQuestions;
            jsonStructure = jsonStructures.questions;
            break;
        case 'messages':
            userEditablePrompt = promptsConfig.generateQuizMessages || defaultPrompts.generateQuizMessages;
            jsonStructure = jsonStructures.messages;
            break;
        case 'results':
            userEditablePrompt = promptsConfig.generateQuizResultsPages || defaultPrompts.generateQuizResultsPages;
            jsonStructure = jsonStructures.results;
            break;
        default:
            throw new Error(`Invalid generation type: ${input.generationType}`);
    }

    // Select the instruction for the generation mode
    switch(input.generationMode) {
        case 'overwrite':
            modeInstruction = "Your task is to generate the content from scratch based on the topic, overwriting any existing data for this section.";
            break;
        case 'improve':
            modeInstruction = "Your task is to improve the existing data for this section based on the user's instruction (e.g., 'make the tone more professional').";
            break;
        case 'complete':
            modeInstruction = "Your task is to complete the existing data. If a field is empty, fill it. If it's a list (like questions or messages), add 1-2 new relevant items to the end of the list. Do not modify existing items.";
            break;
    }

    // Combine the user-editable prompt with the fixed, non-editable JSON structure instructions.
    const fullPromptText = `${userEditablePrompt}\n\nMODE OF OPERATION: ${modeInstruction}\n\nIMPORTANT: You must return ONLY a valid JSON object with a single key "jsonOutput" which contains a STRINGIFIED JSON. This stringified JSON must match this exact structure: ${jsonStructure}.\n\nDo not add any other text, markdown formatting like \`\`\`json, or explanations.`;
    
    const granularPrompt = ai.definePrompt({
      name: 'dynamicGranularQuizPrompt',
      input: { schema: GranularQuizGenerationInputSchema },
      output: { schema: JsonOutputSchema },
      prompt: fullPromptText,
      model: modelToUse,
      config: {
          temperature: 0.7,
      },
    });
    
    const { output } = await granularPrompt(input);
    if (!output || !output.jsonOutput) {
      throw new Error("AI did not return the expected 'jsonOutput' field.");
    }
    
    return { jsonOutput: output.jsonOutput };
  }
);
