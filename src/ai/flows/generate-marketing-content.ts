'use server';

/**
 * @fileOverview A marketing content generation AI agent.
 *
 * - generateMarketingContent - A function that handles the marketing content generation process.
 * - GenerateMarketingContentInput - The input type for the generateMarketingContent function.
 * - GenerateMarketingContentOutput - The return type for the generateMarketingContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMarketingContentInputSchema = z.object({
  dishName: z.string().describe('The name of the plant-based dish.'),
});
export type GenerateMarketingContentInput = z.infer<typeof GenerateMarketingContentInputSchema>;

const GenerateMarketingContentOutputSchema = z.object({
  caption: z.string().describe('The generated marketing caption for the dish.'),
  hashtags: z.string().describe('The generated marketing hashtags for the dish.'),
});
export type GenerateMarketingContentOutput = z.infer<typeof GenerateMarketingContentOutputSchema>;

export async function generateMarketingContent(
  input: GenerateMarketingContentInput
): Promise<GenerateMarketingContentOutput> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("API Key is missing. Please set OPENROUTER_API_KEY in your environment secrets.");
  }
  return generateMarketingContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarketingContentPrompt',
  input: { schema: GenerateMarketingContentInputSchema },
  output: { schema: GenerateMarketingContentOutputSchema },
  prompt: `You are a marketing expert specializing in generating engaging social media content for plant-based dishes.

  Based on current food trends and consumer interests, generate a marketing caption and relevant hashtags for the following plant-based dish:

  Dish Name: {{{dishName}}}

  Caption:
  Hashtags:`,
});

const generateMarketingContentFlow = ai.defineFlow(
  {
    name: 'generateMarketingContentFlow',
    inputSchema: GenerateMarketingContentInputSchema,
    outputSchema: GenerateMarketingContentOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
