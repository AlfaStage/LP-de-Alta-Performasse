import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';

let apiKey: string | undefined;

try {
    const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');
    if (existsSync(configFilePath)) {
        const fileContents = readFileSync(configFilePath, 'utf8');
        const config = JSON.parse(fileContents) as Partial<WhitelabelConfig>;
        if (config.googleApiKey && config.googleApiKey.trim() !== "") {
            apiKey = config.googleApiKey;
        }
    }
} catch (e) {
    console.error("Could not read API key from whitelabel config for Genkit. Will rely on GOOGLE_API_KEY environment variable if available.", e);
}

// O plugin googleAI usará automaticamente process.env.GOOGLE_API_KEY se 'apiKey' for undefined.
// Isso fornece um fallback para desenvolvedores que usam .env.
export const ai = genkit({
  plugins: [googleAI({ apiKey: apiKey })],
  model: 'googleai/gemini-2.0-flash',
});
