import { supabase } from './supabase';
import type { Dish, NutritionInfo } from './data';
import type { PlantBasedReformulationOutput } from '@/ai/flows/plant-based-reformulation';
import type { GenerateMarketingContentOutput } from '@/ai/flows/generate-marketing-content';

// ─── Auth Helper ───

async function getCurrentUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
}

// ─── Dish CRUD ───

export async function fetchDishes(): Promise<Dish[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching dishes:', error);
        return [];
    }

    return (data || []).map(mapRowToDish);
}

export async function fetchDishById(id: string): Promise<Dish | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return mapRowToDish(data);
}

export async function insertDish(dish: Dish): Promise<Dish | null> {
    const userId = await getCurrentUserId();
    if (!userId) {
        console.error('Cannot insert dish: no authenticated user');
        return null;
    }
    const row = { ...mapDishToRow(dish), user_id: userId };
    const { data, error } = await supabase
        .from('dishes')
        .insert(row)
        .select()
        .single();

    if (error) {
        console.error('Error inserting dish:', error);
        return null;
    }

    return mapRowToDish(data);
}

export async function deleteDish(id: string): Promise<void> {
    // Delete associated records first if cascade delete is not set in DB
    await Promise.all([
        deleteReformulation(id),
        deleteMarketingContent(id),
        deleteVideo(id)
    ]);

    const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting dish:', error);
    }
}

export async function toggleDishPublished(id: string, published: boolean): Promise<boolean> {
    const { error } = await supabase
        .from('dishes')
        .update({ published })
        .eq('id', id);

    if (error) {
        console.error('Error toggling dish published state:', error);
        return false;
    }
    return true;
}

// ─── Reformulation CRUD ───

export async function fetchReformulation(dishId: string): Promise<PlantBasedReformulationOutput | null> {
    const { data, error } = await supabase
        .from('reformulations')
        .select('*')
        .eq('dish_id', dishId)
        .single();

    if (error || !data) return null;

    return {
        plantBasedIngredients: data.plant_based_ingredients || '',
        tasteSimilarityScore: Number(data.taste_similarity) || 0,
        textureSimilarityScore: Number(data.texture_similarity) || 0,
        localAvailabilityScore: Number(data.local_availability) || 0,
        differenceNoticeability: data.customer_noticeable_difference || 'Medium',
        ingredientSwapExplanation: data.ingredient_swap_explanation || '',
        teasingIngredientDescription: data.teasing_ingredient_description || '',
    };
}

export async function saveReformulation(
    dishId: string,
    result: PlantBasedReformulationOutput
): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { error } = await supabase
        .from('reformulations')
        .upsert({
            dish_id: dishId,
            user_id: userId,
            plant_based_ingredients: result.plantBasedIngredients,
            taste_similarity: result.tasteSimilarityScore,
            texture_similarity: result.textureSimilarityScore,
            local_availability: result.localAvailabilityScore,
            customer_noticeable_difference: result.differenceNoticeability,
            ingredient_swap_explanation: result.ingredientSwapExplanation,
            teasing_ingredient_description: result.teasingIngredientDescription,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'dish_id' });

    if (error) console.error('Error saving reformulation:', error);
}

export async function deleteReformulation(dishId: string): Promise<void> {
    const { error } = await supabase
        .from('reformulations')
        .delete()
        .eq('dish_id', dishId);

    if (error) console.error('Error deleting reformulation:', error);
}

// ─── Marketing Content CRUD ───

export async function fetchMarketingContent(dishId: string): Promise<GenerateMarketingContentOutput | null> {
    const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('dish_id', dishId)
        .single();

    if (error || !data) return null;

    return {
        caption: data.caption || '',
        hashtags: data.hashtags || '',
    };
}

export async function saveMarketingContent(
    dishId: string,
    result: GenerateMarketingContentOutput
): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { error } = await supabase
        .from('marketing_content')
        .upsert({
            dish_id: dishId,
            user_id: userId,
            caption: result.caption,
            hashtags: result.hashtags,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'dish_id' });

    if (error) console.error('Error saving marketing content:', error);
}

export async function deleteMarketingContent(dishId: string): Promise<void> {
    const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('dish_id', dishId);

    if (error) console.error('Error deleting marketing content:', error);
}

// ─── Video CRUD ───

export async function fetchVideo(dishId: string): Promise<{ videoUrl: string; caption?: string; hashtags?: string } | null> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('dish_id', dishId)
        .single();

    if (error || !data) return null;

    return {
        videoUrl: data.video_url,
        caption: data.caption || undefined,
        hashtags: data.hashtags || undefined,
    };
}

export async function saveVideo(
    dishId: string,
    videoUrl: string,
    caption?: string,
    hashtags?: string
): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { error } = await supabase
        .from('videos')
        .upsert({
            dish_id: dishId,
            user_id: userId,
            video_url: videoUrl,
            caption: caption || null,
            hashtags: hashtags || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'dish_id' });

    if (error) console.error('Error saving video:', error);
}

export async function deleteVideo(dishId: string): Promise<void> {
    const { error } = await supabase
        .from('videos')
        .delete()
        .eq('dish_id', dishId);

    if (error) console.error('Error deleting video:', error);
}

// ─── Helpers ───

function mapRowToDish(row: any): Dish {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        category: row.category || 'Uncategorized',
        isBestSeller: row.is_best_seller || false,
        image: {
            id: row.id,
            description: row.description || '',
            imageUrl: row.image_url || `https://picsum.photos/seed/${row.id}/400/300`,
            imageHint: row.image_hint || row.name?.toLowerCase() || 'food dish',
        },
        ingredients: row.ingredients || [],
        cuisine: row.cuisine || 'International',
        price: {
            original: Number(row.price_original) || 0,
            plantBased: Number(row.price_plant_based) || 0,
        },
        nutrition: {
            original: row.nutrition_original || defaultNutrition(),
            plantBasedInitial: row.nutrition_plant_based_initial || defaultNutrition(),
            plantBasedOptimized: row.nutrition_plant_based_optimized || defaultNutrition(),
        },
        impact: row.impact || 0,
        impactExplanation: row.impact_explanation || undefined,
        published: row.published ?? false,
    };
}

function mapDishToRow(dish: Dish) {
    return {
        id: dish.id,
        name: dish.name,
        description: dish.description,
        category: dish.category,
        is_best_seller: dish.isBestSeller,
        image_url: dish.image?.imageUrl || null,
        image_hint: dish.image?.imageHint || null,
        ingredients: dish.ingredients,
        cuisine: dish.cuisine,
        price_original: dish.price.original,
        price_plant_based: dish.price.plantBased,
        nutrition_original: dish.nutrition.original,
        nutrition_plant_based_initial: dish.nutrition.plantBasedInitial,
        nutrition_plant_based_optimized: dish.nutrition.plantBasedOptimized,
        impact: dish.impact,
        impact_explanation: dish.impactExplanation || null,
        published: dish.published ?? false,
    };
}

function defaultNutrition(): NutritionInfo {
    return {
        servingSize: '200g',
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        sodium: 0,
    };
}
