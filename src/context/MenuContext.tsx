'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Dish } from '@/lib/data';
import { fetchDishes, insertDish as dbInsertDish, deleteDish as dbDeleteDish } from '@/lib/db';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { generateNutrition } from '@/ai/flows/generate-nutrition';

type MenuContextType = {
  menuItems: Dish[];
  isLoading: boolean;
  addMenuItem: (item: Omit<Dish, 'id' | 'image' | 'nutrition' | 'impact' | 'isBestSeller'> & { description: string }, imageUrl?: string) => Promise<void>;
  refreshMenu: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deleteDish: (id: string) => Promise<void>;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDishes = async () => {
    setIsLoading(true);
    try {
      const dishes = await fetchDishes();
      setMenuItems(dishes);
    } catch (error) {
      console.error('Failed to load dishes from Supabase:', error);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  const addMenuItem = async (item: Omit<Dish, 'id' | 'image' | 'nutrition' | 'impact' | 'isBestSeller'> & { description: string }, imageUrl?: string) => {
    const newId = item.name.toLowerCase().replace(/\s+/g, '-');

    const keywords = (item.name + " " + item.category).toLowerCase().split(" ").filter(k => k.length > 2);
    const usedImageUrls = new Set(menuItems.map(d => d.image.imageUrl));
    const unusedImages = PlaceHolderImages.filter(p => !usedImageUrls.has(p.imageUrl));

    let bestMatch: { image: ImagePlaceholder, score: number } | undefined;

    if (unusedImages.length > 0) {
      for (const image of unusedImages) {
        const hintWords = image.imageHint.split(' ');
        const score = hintWords.reduce((acc, hintWord) => {
          if (keywords.some(k => k.includes(hintWord) || hintWord.includes(k))) {
            return acc + 1;
          }
          return acc;
        }, 0);

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { image, score };
        }
      }
    }

    let selectedImage: ImagePlaceholder | undefined = bestMatch?.image;

    if (!selectedImage) {
      if (unusedImages.length > 0) {
        selectedImage = unusedImages[item.name.length % unusedImages.length];
      } else {
        selectedImage = PlaceHolderImages[item.name.length % PlaceHolderImages.length];
      }
    }

    const newItem: Dish = {
      ...item,
      id: newId,
      image: imageUrl
        ? { id: newId, description: item.description, imageUrl, imageHint: item.name.toLowerCase() }
        : selectedImage!,
      isBestSeller: false,
      impact: 0,
      nutrition: { original: { servingSize: '200g', calories: 0, protein: 0, fat: 0, carbohydrates: 0, sodium: 0 }, plantBasedInitial: { servingSize: '200g', calories: 0, protein: 0, fat: 0, carbohydrates: 0, sodium: 0 }, plantBasedOptimized: { servingSize: '200g', calories: 0, protein: 0, fat: 0, carbohydrates: 0, sodium: 0 } },
    };

    const nutritionResult = await generateNutrition({
      dishName: item.name,
      ingredients: item.ingredients.join(', '),
      cuisineType: item.cuisine,
    }).catch(() => ({
      original: { servingSize: '200g', calories: 500, protein: 20, fat: 25, carbohydrates: 40, sodium: 900 },
      plantBasedInitial: { servingSize: '200g', calories: 450, protein: 15, fat: 20, carbohydrates: 45, sodium: 800 },
      plantBasedOptimized: { servingSize: '200g', calories: 470, protein: 20, fat: 22, carbohydrates: 42, sodium: 800 },
      impact: (item.name.length * 7) % 100 + 20,
      impactExplanation: undefined as string | undefined,
    }));

    newItem.impact = nutritionResult.impact ?? ((item.name.length * 7) % 100 + 20);
    newItem.impactExplanation = nutritionResult.impactExplanation;
    newItem.nutrition = {
      original: nutritionResult.original,
      plantBasedInitial: nutritionResult.plantBasedInitial,
      plantBasedOptimized: nutritionResult.plantBasedOptimized,
    };

    // Save to Supabase
    const saved = await dbInsertDish(newItem);
    if (saved) {
      setMenuItems(prevItems => [saved, ...prevItems]);
    } else {
      // Fallback: add to local state even if DB fails
      setMenuItems(prevItems => [newItem, ...prevItems]);
    }
  };

  const refreshMenu = async () => {
    await loadDishes();
  };

  const deleteDish = async (id: string) => {
    try {
      await dbDeleteDish(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete dish:', error);
      throw error;
    }
  };

  return (
    <MenuContext.Provider value={{ menuItems, isLoading, addMenuItem, refreshMenu, searchQuery, setSearchQuery, deleteDish }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
