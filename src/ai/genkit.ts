import { genkit, z } from 'genkit';
import { openAI } from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      models: [
        {
          name: 'google/gemini-2.0-flash-001',
          info: {
            versions: ['google/gemini-2.0-flash-001'],
            label: 'Gemini 2.0 Flash',
            supports: {
              multiturn: true,
              tools: true,
              media: false,
              systemRole: true,
              output: ['json', 'text'],
            },
          },
          configSchema: z.object({}),
        },
      ],
    }),
  ],
  model: 'openai/google/gemini-2.0-flash-001',
});
