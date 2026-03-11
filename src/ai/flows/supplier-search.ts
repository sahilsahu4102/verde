'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { scrapeAllPlatforms } from '@/lib/scrape-prices';

const SupplierSearchInputSchema = z.object({
    ingredients: z.string().describe('A comma-separated list of plant-based ingredients.'),
    pincode: z.string().describe('The pincode of the restaurant/business location.'),
});
export type SupplierSearchInput = z.infer<typeof SupplierSearchInputSchema>;

const RetailerSchema = z.object({
    name: z.string().describe('Retailer name (e.g., IndiaMART, JioMart, Flipkart)'),
    packSize: z.string().describe('The standard available pack size for this ingredient, e.g. "500g bag", "1L bottle", "1kg pack"'),
    pricePerPack: z.number().describe('Estimated retail price for one pack in INR. Be specific and realistic for India.'),
    packsNeeded: z.number().describe('Number of packs needed to fulfill the quantityNeeded for this batch. Round up to whole number.'),
    subtotal: z.number().describe('pricePerPack multiplied by packsNeeded'),
    searchUrl: z.string().url().describe('Search results URL for this ingredient on the retailer site. Use the retailer search URL patterns provided in the prompt.'),
    isLivePrice: z.boolean().optional().describe('True if this price was scraped live from the retailer. False/absent means AI estimate.'),
});

const IngredientBudgetSchema = z.object({
    ingredient: z.string().describe('Common Indian retail name for this ingredient (simplified for searchability, e.g. "pea protein powder" not "pea protein isolate 90%")'),
    quantityNeeded: z.string().describe('Total quantity of this ingredient needed for the batch, e.g. "500g", "1.5L", "200ml"'),
    retailers: z.array(RetailerSchema).min(3).max(3),
});

const SupplierSearchOutputSchema = z.object({
    isFeasible: z.boolean().describe('Whether high-quality plant-based ingredients are deliverable to the given pincode.'),
    reasoning: z.string().describe('Short explanation of feasibility and any relevant delivery notes for this pincode.'),
    batchServings: z.number().describe('Number of restaurant servings this procurement batch covers. Pick a realistic number, e.g. 20 or 25.'),
    budgetDetails: z.array(IngredientBudgetSchema).describe('One entry per unique ingredient needed.'),
    budgetBreakdown: z.string().describe('A human-readable one-line breakdown showing how the total was calculated, e.g. "Pea Protein 2×₹350 + Oat Milk 1×₹85 + Jackfruit 3×₹120 = ₹1,195"'),
    totalEstimatedBudget: z.number().describe('Sum of all subtotals across all ingredients and retailers (use the cheapest retailer per ingredient for the total). Must match the budgetBreakdown sum.'),
});
export type SupplierSearchOutput = z.infer<typeof SupplierSearchOutputSchema>;

export async function supplierSearch(input: SupplierSearchInput): Promise<SupplierSearchOutput> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('API Key is missing. Please set OPENROUTER_API_KEY in your environment secrets.');
    }

    // Step 1: Get AI-generated plan (structure, quantities, batch size, pack info)
    const result = await supplierSearchFlow(input);

    // Step 2: Scrape ALL platforms in parallel per ingredient, map to retailer rows
    if (process.env.SCRAPINGDOG_API_KEY && result.isFeasible) {
        await Promise.all(
            result.budgetDetails.map(async (item) => {
                const scrapedPrices = await scrapeAllPlatforms(item.ingredient);

                // Map each scraped result to the matching retailer row
                for (const { platform, price } of scrapedPrices) {
                    const retailer = item.retailers.find(r =>
                        r.name.toLowerCase().includes(platform.toLowerCase())
                    );
                    if (retailer) {
                        retailer.pricePerPack = price;
                        retailer.subtotal = Math.round(price * retailer.packsNeeded);
                        retailer.isLivePrice = true;
                    }
                }
            })
        );

        // Step 3: Recalculate total using cheapest retailer per ingredient
        let newTotal = 0;
        const breakdownParts: string[] = [];
        for (const item of result.budgetDetails) {
            const cheapest = item.retailers.reduce((min, r) =>
                r.subtotal < min.subtotal ? r : min
            );
            newTotal += cheapest.subtotal;
            breakdownParts.push(
                `${item.ingredient} ${cheapest.packsNeeded}×₹${cheapest.pricePerPack.toFixed(0)}`
            );
        }
        result.totalEstimatedBudget = Math.round(newTotal);
        result.budgetBreakdown = breakdownParts.join(' + ') + ` = ₹${Math.round(newTotal).toLocaleString('en-IN')}`;
    }

    return result;
}

const prompt = ai.definePrompt({
    name: 'supplierSearchPrompt',
    input: { schema: SupplierSearchInputSchema },
    output: { schema: SupplierSearchOutputSchema },
    prompt: `You are a procurement expert for plant-based food ingredients in India. You help restaurant owners understand exactly what to buy, in what quantity, at what price, and where to buy it.

Plant-Based Ingredients to Procure: {{{ingredients}}}
Restaurant Pincode: {{{pincode}}}

## Your Tasks

### 1. Feasibility
Determine if these ingredients can be delivered to the given Indian pincode via major online retailers. Most metro and tier-2 cities are feasible. Rural pincodes may have limited options.

### 2. Batch Size
Choose a realistic restaurant batch size, e.g. 20 or 25 servings. State this as batchServings.

### 3. Per Ingredient
For each ingredient:
- **Simplify the name** to a common Indian retail search term. Examples:
  - "pea protein isolate" → "pea protein powder"
  - "aquafaba" → "chickpea brine"
  - "oat milk alternative" → "oat milk"
  - "cashew cream" → "cashew nuts"
- **quantityNeeded**: Calculate a realistic quantity for the batch size you chose. E.g. for 20 servings of a curry: chicken substitute 1kg, coconut milk 2L, etc.
- **Retailers**: ALWAYS use exactly these 3 retailers: **IndiaMART**, **JioMart**, **Flipkart**.
  - For each retailer, specify a **real standard pack size** (e.g. "500g bag", "1L Tetra Pak", "200g jar")
  - Estimate a **realistic INR price** for that pack. Examples: oat milk 1L ≈ ₹85-110, pea protein 500g ≈ ₹350-500, jackfruit 400g can ≈ ₹80-120
  - Calculate packsNeeded = ceil(quantityNeeded / packSize)
  - Calculate subtotal = pricePerPack × packsNeeded
- **Search URLs**: Generate search result URLs using these exact patterns (URL-encode ingredient name, replace spaces with +):
  - IndiaMART: https://dir.indiamart.com/search.mp?ss=INGREDIENT+NAME
  - JioMart: https://www.jiomart.com/search/INGREDIENT+NAME
  - Flipkart: https://www.flipkart.com/search?q=INGREDIENT+NAME

### 4. Budget Breakdown
- Use the **cheapest retailer's subtotal** for each ingredient when summing the total
- Write a one-line budgetBreakdown string showing the math clearly
- totalEstimatedBudget must match the sum in budgetBreakdown

Return strictly valid JSON matching the output schema.`,
});

const supplierSearchFlow = ai.defineFlow(
    {
        name: 'supplierSearchFlow',
        inputSchema: SupplierSearchInputSchema,
        outputSchema: SupplierSearchOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
