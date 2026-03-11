'use server';

/**
 * @fileOverview Generates realistic nutritional estimates for a dish and its plant-based alternatives.
 *
 * - generateNutrition - A function that returns original and plant-based nutrition info.
 * - GenerateNutritionInput - The input type for the generateNutrition function.
 * - GenerateNutritionOutput - The return type for the generateNutrition function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NutritionInfoSchema = z.object({
    servingSize: z.string().describe('The serving size, e.g. "200g" or "1 serving".'),
    calories: z.number().describe('Calories in kcal.'),
    protein: z.number().describe('Protein in grams.'),
    fat: z.number().describe('Total fat in grams.'),
    carbohydrates: z.number().describe('Total carbohydrates in grams.'),
    sodium: z.number().describe('Sodium in milligrams.'),
});

const GenerateNutritionInputSchema = z.object({
    dishName: z.string().describe('The name of the dish.'),
    ingredients: z.string().describe('A comma-separated list of ingredients in the original dish.'),
    cuisineType: z.string().describe('The cuisine type of the dish.'),
});
export type GenerateNutritionInput = z.infer<typeof GenerateNutritionInputSchema>;

const GenerateNutritionOutputSchema = z.object({
    original: NutritionInfoSchema.describe('Nutritional info for the original dish.'),
    plantBasedInitial: NutritionInfoSchema.describe(
        'Nutritional info for the dish after direct 1-to-1 plant-based swaps. Protein may be slightly lower than original.'
    ),
    plantBasedOptimized: NutritionInfoSchema.describe(
        'Nutritional info after optimization (e.g. adding pea protein) to better match the original protein level. Calories and fat may differ slightly.'
    ),
    impact: z.number().describe(
        'Estimated number of animal lives spared per year if a restaurant switches this one dish to its plant-based version. Base on how meat/dairy-heavy the original ingredients are. A fully vegan dish scores 0. A beef-heavy dish might score 80-120. A chicken or dairy-based dish 30-70. Return a realistic whole number.'
    ),
    impactExplanation: z.string().describe(
        'A single concise sentence (max 20 words) explaining what drives the impact score. E.g. "Switching from ground beef to lentils is the primary driver of lives spared."'
    ),
});
export type GenerateNutritionOutput = z.infer<typeof GenerateNutritionOutputSchema>;

export async function generateNutrition(input: GenerateNutritionInput): Promise<GenerateNutritionOutput> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('API Key is missing. Please set OPENROUTER_API_KEY in your environment secrets.');
    }
    return generateNutritionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateNutritionPrompt',
    input: { schema: GenerateNutritionInputSchema },
    output: { schema: GenerateNutritionOutputSchema },
    prompt: `You are a professional nutritionist and sustainability expert with expertise in plant-based cooking.

Given the following dish, estimate realistic per-serving nutritional values for three scenarios, and also estimate its sustainability impact:

Dish Name: {{{dishName}}}
Ingredients: {{{ingredients}}}
Cuisine Type: {{{cuisineType}}}

1. **original** – The dish as described with the listed ingredients. Estimate realistic calories, protein, fat, carbohydrates, and sodium for a standard single serving.

2. **plantBasedInitial** – The same dish after direct plant-based swaps (e.g. chicken → jackfruit, beef → lentils, dairy → oat milk). This version will typically have slightly less protein.

3. **plantBasedOptimized** – The plant-based version after optimization, where a protein booster (such as pea protein, tempeh, or extra legumes) has been added to match or closely approach the original protein content. Calories and fat may differ slightly from the initial version.

4. **impact** – Estimated animal lives spared per year if a restaurant permanently switches one dish to its plant-based version (assume ~500 servings/year). Base this on how meat- and dairy-heavy the original is:
   - Fully plant-based original → 0
   - Fish/seafood based → 5–20
   - Dairy/egg heavy → 10–40
   - Chicken/poultry based → 30–70
   - Lamb/pork based → 50–90
   - Beef/red meat heavy → 80–130
   Return a realistic whole number.

5. **impactExplanation** – One concise sentence (max 20 words) naming the primary animal-product driver of the impact score.

Be realistic and specific. Do not return generic placeholder values.
Use a consistent serving size (e.g. "200g" or "1 serving (250g)") across all three nutrition objects.

Return the response strictly in JSON following the output schema.`,
});

const generateNutritionFlow = ai.defineFlow(
    {
        name: 'generateNutritionFlow',
        inputSchema: GenerateNutritionInputSchema,
        outputSchema: GenerateNutritionOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
