'use server';

/**
 * Platform definitions — all scraped in parallel per ingredient.
 */
const PLATFORMS = [
    {
        name: 'IndiaMART',
        buildUrl: (q: string) => `https://dir.indiamart.com/search.mp?ss=${q}&geo=IN`,
    },
    {
        name: 'JioMart',
        buildUrl: (q: string) => `https://www.jiomart.com/search/${q}`,
    },
    {
        name: 'Flipkart',
        buildUrl: (q: string) => `https://www.flipkart.com/search?q=${q}`,
    },
];

/**
 * Builds keywords from ingredient name for matching.
 * e.g. "vegan sausages" → ["vegan", "sausages"]
 */
function keywordsFrom(name: string): string[] {
    return name
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length >= 3);
}

/**
 * Extracts prices where ALL ingredient keywords appear within 300 chars of the price.
 */
function extractMatchedPrices(html: string, ingredientName: string): number[] {
    const keywords = keywordsFrom(ingredientName);
    const matched: number[] = [];

    const contextRegex = /(.{0,300})(₹|&#8377;|Rs\.?)\s*([\d,]{2,7}(?:\.\d{1,2})?)(.{0,300})/gi;
    let m: RegExpExecArray | null;

    while ((m = contextRegex.exec(html)) !== null) {
        const context = (m[1] + m[4]).toLowerCase();
        const price = parseFloat(m[3].replace(/,/g, ''));

        if (price < 20 || price > 8000) continue;

        const hits = keywords.filter(kw => context.includes(kw)).length;
        if (keywords.length > 0 && hits === keywords.length) {
            matched.push(price);
        }
    }

    return matched;
}

export interface ScrapedPrice {
    platform: string;
    price: number;
}

/**
 * Scrapes ALL platforms in parallel for a single ingredient.
 * Returns an array of { platform, price } for every platform that had a valid match.
 */
export async function scrapeAllPlatforms(
    ingredientName: string,
): Promise<ScrapedPrice[]> {
    const apiKey = process.env.SCRAPINGDOG_API_KEY;
    if (!apiKey) {
        console.warn('[ScrapingDog] SCRAPINGDOG_API_KEY not set — skipping live price fetch');
        return [];
    }

    const query = encodeURIComponent(ingredientName);

    const results = await Promise.all(
        PLATFORMS.map(async (platform): Promise<ScrapedPrice | null> => {
            const targetUrl = platform.buildUrl(query);
            const scrapingDogUrl = `https://api.scrapingdog.com/scrape?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;

            console.log(`[ScrapingDog] Scraping "${ingredientName}" on ${platform.name}...`);

            try {
                const response = await fetch(scrapingDogUrl, {
                    next: { revalidate: 3600 },
                });

                if (!response.ok) {
                    console.warn(`[ScrapingDog] ${platform.name}: ${response.status}`);
                    return null;
                }

                const html = await response.text();

                if (html.length < 1000) {
                    console.warn(`[ScrapingDog] ${platform.name}: bot-blocked (${html.length} chars)`);
                    return null;
                }

                const prices = extractMatchedPrices(html, ingredientName);

                if (prices.length === 0) {
                    console.warn(`[ScrapingDog] ${platform.name}: no exact match for "${ingredientName}"`);
                    return null;
                }

                prices.sort((a, b) => a - b);
                const median = prices[Math.floor(prices.length / 2)];

                console.log(`[ScrapingDog] ✅ ${platform.name}: "${ingredientName}" → ₹${median} (${prices.length} matches)`);
                return { platform: platform.name, price: median };

            } catch (err) {
                console.error(`[ScrapingDog] ${platform.name} error:`, err);
                return null;
            }
        })
    );

    return results.filter((r): r is ScrapedPrice => r !== null);
}
