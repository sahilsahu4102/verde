'use server';

/**
 * @fileOverview Analyzes dishes and suggests plant-based alternatives, providing metrics for taste and texture similarity.
 *
 * - plantBasedReformulation - A function that handles the plant-based reformulation process.
 * - PlantBasedReformulationInput - The input type for the plantBasedReformulation function.
 * - PlantBasedReformulationOutput - The return type for the plantBasedReformulation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlantBasedReformulationInputSchema = z.object({
  dishName: z.string().describe('The name of the dish to reformulate.'),
  ingredients: z.string().describe('A comma-separated list of ingredients in the original dish.'),
  cuisineType: z.string().describe('The cuisine type of the dish.'),
});
export type PlantBasedReformulationInput = z.infer<typeof PlantBasedReformulationInputSchema>;

const PlantBasedReformulationOutputSchema = z.object({
  plantBasedIngredients: z.string().describe('A comma-separated list of plant-based ingredients that can replace the original ingredients.'),
  teasingIngredientDescription: z.string().describe('A short, appetizing, 1-2 sentence marketing tease of the plant-based ingredients used, keeping the exact recipe a secret but making it sound delicious and premium (e.g., "A proprietary blend of hearty soy-chunks and savory chickpea flour, slow-cooked in our secret spices").'),
  tasteSimilarityScore: z.number().describe('A score between 1 and 10 representing the similarity in taste between the original and plant-based dish.').min(1).max(10),
  textureSimilarityScore: z.number().describe('A score between 1 and 10 representing the similarity in texture between the original and plant-based dish.').min(1).max(10),
  localAvailabilityScore: z.number().describe('A score between 1 and 10 representing how easy it is to source the ingredients locally in India.').min(1).max(10),
  differenceNoticeability: z.enum(['Low', 'Medium', 'High']).describe('A description of how noticeable the difference will be to customers (Low, Medium, High).'),
  ingredientSwapExplanation: z.string().describe('A detailed, recipe-style breakdown of each ingredient swap in PLAIN TEXT only (no markdown, no asterisks, no bold formatting). For EACH non-plant-based ingredient, use a numbered format with clear labels.'),
});
export type PlantBasedReformulationOutput = z.infer<typeof PlantBasedReformulationOutputSchema>;

export async function plantBasedReformulation(input: PlantBasedReformulationInput): Promise<PlantBasedReformulationOutput> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("API Key is missing. Please set OPENROUTER_API_KEY in your environment secrets.");
  }
  return plantBasedReformulationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'plantBasedReformulationPrompt',
  input: { schema: PlantBasedReformulationInputSchema },
  output: { schema: PlantBasedReformulationOutputSchema },
  prompt: `You are an expert chef specializing in plant-based cuisine for restaurant kitchens.

  Your task is to convert traditional dishes into plant-based versions while maintaining similar taste, texture, and preparation style.

  IMPORTANT CONTEXT:
  This solution is for cafés and restaurants in India.

  Prefer plant-based replacements that are commonly available in Indian kitchens, wholesalers, or suppliers such as:
  soy chunks, soy granules, tofu, chickpeas, lentils, jackfruit, mushrooms, peanuts, cashews, oats, wheat gluten, coconut milk, almond milk, or chickpea flour.

  Avoid suggesting premium Western vegan products like Impossible Meat, Beyond Meat, or specialty vegan egg powders unless absolutely necessary.

  Focus on ingredients that are:
  - affordable
  - easy to source in India
  - suitable for café kitchens
  - easy to procure from local suppliers

  Dish Name: {{{dishName}}}
  Ingredients: {{{ingredients}}}
  Cuisine Type: {{{cuisineType}}}

  Provide plant-based substitutions for each non-plant ingredient.

  For ingredientSwapExplanation, write a detailed recipe-style substitution guide using this exact format:

  1. [Ingredient Name]
     Original: [ingredient] ([quantity])
     Replacement: [plant-based alternative] ([quantity])
     Preparation: [simple preparation method suitable for a café kitchen]
     Tip: [practical cooking tip]
     Note: [flavor or texture difference explanation]
     
  Also provide the required scores:
  tasteSimilarityScore (1–10)
  textureSimilarityScore (1–10)
  localAvailabilityScore (1–10)
  differenceNoticeability (Low / Medium / High)

  IMPORTANT FORMATTING RULES:
  - Do NOT use markdown
  - Do NOT use bullet symbols
  - Use the exact labels provided
  - Keep instructions practical for a kitchen

  Adhere to the output schema descriptions provided. Return the response in JSON format.`,
});

const plantBasedReformulationFlow = ai.defineFlow(
  {
    name: 'plantBasedReformulationFlow',
    inputSchema: PlantBasedReformulationInputSchema,
    outputSchema: PlantBasedReformulationOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
