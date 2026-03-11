import { ai } from '../genkit';
import { z } from 'genkit';

const OwnerChatInputSchema = z.object({
    message: z.string().describe('The owner\'s question or message'),
    context: z.object({
        cafeName: z.string().optional(),
        totalReviews: z.number().optional(),
        avgRating: z.number().optional(),
        recentComplaints: z.array(z.string()).optional(),
    }).optional().describe('Optional restaurant context for more relevant answers'),
});

const OwnerChatOutputSchema = z.object({
    reply: z.string().describe('The chatbot\'s response to the owner'),
    actionItems: z.array(z.string()).optional().describe('Suggested action items for the owner'),
    category: z.string().describe('Category of the question: menu, reviews, operations, marketing, general'),
});

export const ownerChatFlow = ai.defineFlow(
    {
        name: 'ownerChatFlow',
        inputSchema: OwnerChatInputSchema,
        outputSchema: OwnerChatOutputSchema,
    },
    async (input) => {
        const contextStr = input.context
            ? `\n\nRestaurant Context:
- Name: ${input.context.cafeName ?? 'Unknown'}
- Total Reviews: ${input.context.totalReviews ?? 'N/A'}
- Average Rating: ${input.context.avgRating ?? 'N/A'}
${input.context.recentComplaints?.length ? `- Recent Complaints: ${input.context.recentComplaints.join('; ')}` : ''}`
            : '';

        const { output } = await ai.generate({
            prompt: `You are Verde AI, a helpful assistant for plant-based restaurant owners. You help them with:
- Understanding and improving their menu
- Interpreting customer reviews and feedback
- Operational best practices
- Marketing their plant-based offerings
- General restaurant management advice

Be concise, actionable, and supportive. Always relate advice back to their plant-based focus.
${contextStr}

Owner's message: ${input.message}

Respond with a helpful reply, any action items, and categorize the question.`,
            output: {
                schema: OwnerChatOutputSchema,
            },
        });

        return output!;
    }
);
