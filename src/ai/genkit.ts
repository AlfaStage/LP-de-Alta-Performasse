
import {genkit, type Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { WhitelabelConfig } from '@/types/quiz';

// This function will now dynamically configure Genkit based on the saved settings.
// It is called once at startup.
const configureGenkitDynamic = (): Plugin<any>[] => {
    let config: Partial<WhitelabelConfig> = {};
    try {
        const configFilePath = path.join(process.cwd(), 'src', 'data', 'whitelabel-config.json');
        if (existsSync(configFilePath)) {
            const fileContents = readFileSync(configFilePath, 'utf8');
            config = JSON.parse(fileContents);
        }
    } catch (e) {
        console.error("Could not read whitelabel config for Genkit. Using defaults.", e);
    }

    const plugins: Plugin<any>[] = [];

    // Always configure Google AI if a key is present
    if (config.googleApiKey) {
        plugins.push(googleAI({ apiKey: config.googleApiKey }));
    }

    return plugins;
};

// Initialize Genkit with the dynamically determined plugins
export const ai = genkit({
  plugins: configureGenkitDynamic(),
});
