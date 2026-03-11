import type { ImagePlaceholder } from './placeholder-images';

export type NutritionInfo = {
    servingSize: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    sodium: number;
};

export type Dish = {
    id: string;
    name: string;
    description: string;
    category: string;
    isBestSeller: boolean;
    image: ImagePlaceholder;
    ingredients: string[];
    cuisine: string;
    price: {
        original: number;
        plantBased: number;
    };
    nutrition: {
        original: NutritionInfo;
        plantBasedInitial: NutritionInfo;
        plantBasedOptimized: NutritionInfo;
    };
    impact: number;
    impactExplanation?: string;
    published?: boolean;
};

export const MENU_CATEGORIES = [
    "Starters",
    "Main Course",
    "Seafood",
    "Pasta",
    "Desserts",
    "Beverages",
    "Sides"
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];
