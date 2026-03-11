import { ai } from '../genkit';
import { z } from 'genkit';

// Input schema: feedback data from customer reviews
const FeedbackReformulationInputSchema = z.object({
    dishName: z.string().describe('Name of the dish being reformulated'),
    originalIngredients: z.array(z.string()).describe('Original dish ingredients'),
    currentSubstitutions: z.array(z.string()).describe('Current plant-based substitutions'),
    feedbackSummary: z.string().describe('Aggregated taste/texture feedback from customers'),
    avgTasteRating: z.number().describe('Average customer taste rating (1-5)'),
    avgTextureRating: z.number().describe('Average customer texture rating (1-5)'),
    commonComplaints: z.array(z.string()).describe('Most common customer complaints'),
    commonPraises: z.array(z.string()).describe('Most common customer praises'),
});

// Output schema: improved reformulation suggestions
const FeedbackReformulationOutputSchema = z.object({
    improvedSubstitutions: z.array(z.object({
        original: z.string(),
        currentSub: z.string(),
        improvedSub: z.string(),
        reason: z.string(),
    })).describe('Improved substitution suggestions based on feedback'),
    tasteImprovements: z.array(z.string()).describe('Specific suggestions to improve taste'),
    textureImprovements: z.array(z.string()).describe('Specific suggestions to improve texture'),
    predictedTasteScore: z.number().describe('Predicted taste score after improvements (1-10)'),
    predictedTextureScore: z.number().describe('Predicted texture score after improvements (1-10)'),
    overallStrategy: z.string().describe('Overall improvement strategy summary'),
});

// Define the flow
export const feedbackReformulationFlow = ai.defineFlow(
    {
        name: 'feedbackReformulationFlow',
        inputSchema: FeedbackReformulationInputSchema,
        outputSchema: FeedbackReformulationOutputSchema,
    },
    async (input) => {
        const { output } = await ai.generate({
            prompt: `You are a plant-based food scientist AI. Analyze customer feedback about a plant-based dish reformulation and suggest improvements.

## Dish: ${input.dishName}

### Original Ingredients:
${input.originalIngredients.join(', ')}

### Current Plant-Based Substitutions:
${input.currentSubstitutions.join(', ')}

### Customer Feedback Summary:
${input.feedbackSummary}

### Ratings:
- Average Taste Rating: ${input.avgTasteRating}/5
- Average Texture Rating: ${input.avgTextureRating}/5

### Common Complaints:
${input.commonComplaints.map(c => `- ${c}`).join('\n')}

### Common Praises:
${input.commonPraises.map(p => `- ${p}`).join('\n')}

Based on this feedback, provide:
1. Improved substitution suggestions for each ingredient that received negative feedback
2. Specific taste improvement techniques
3. Specific texture improvement techniques
4. Predicted taste and texture scores (1-10) after implementing your suggestions
5. An overall strategy summary

Focus on practical, actionable suggestions that a restaurant kitchen can implement.`,
            output: {
                schema: FeedbackReformulationOutputSchema,
            },
        });

        return output!;
    }
);
