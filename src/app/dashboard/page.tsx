"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Search, Trash2, Utensils } from "lucide-react";
import { useMenu } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import type { Dish } from "@/lib/data";
import { MENU_CATEGORIES } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddMenuItem } from "@/components/app/add-menu-item";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublishToggle } from "@/components/ui/publish-toggle";

const CATEGORIES = MENU_CATEGORIES;

export default function MenuDashboardPage() {
  const { menuItems, isLoading, searchQuery, deleteDish, refreshMenu } = useMenu();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const cafeName = user?.user_metadata?.cafe_name || "My Café";

  const searchLower = searchQuery.toLowerCase().trim();
  const filteredMenuItems = menuItems.filter(dish => {
    const matchesSearch =
      (dish.name || "").toLowerCase().includes(searchLower) ||
      (dish.description || "").toLowerCase().includes(searchLower) ||
      (dish.category || "").toLowerCase().includes(searchLower);

    const matchesCategory = selectedCategory === "All Categories" || dish.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupByCategory = (dishes: Dish[]) => {
    const grouped: Record<string, Dish[]> = {};
    for (const dish of dishes) {
      const category = dish.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(dish);
    }
    return grouped;
  };

  const groupedMenu = groupByCategory(filteredMenuItems);
  // Filter out categories that have no items after search filtering
  const categories = Object.keys(groupedMenu).filter(cat => groupedMenu[cat].length > 0);

  return (
    <main className="flex-1 p-4 md:p-8 lg:p-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{cafeName} Menu</h1>
          <p className="text-muted-foreground">
            {searchQuery
              ? `Showing results for "${searchQuery}"`
              : "Select a menu item to generate a plant-based alternative"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddMenuItem />
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden bg-card shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="border-t pt-4 mt-4">
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {!isLoading && categories.length > 0 && <div className="space-y-12">
        {categories.map(category => (
          <section key={category}>
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <span className="text-primary">•</span> {category}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupedMenu[category].map(dish => (
                <Card key={dish.id} className="relative flex flex-col bg-card shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                  />
                  {/* Dish Image */}
                  <div className="relative h-40 w-full bg-muted overflow-hidden rounded-t-xl">
                    {dish.image?.imageUrl ? (
                      <img
                        src={dish.image.imageUrl}
                        alt={dish.name}
                        className="h-full w-full object-cover brightness-75"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Utensils className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Overlay controls */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <Badge className="font-normal bg-black/60 text-white border-0 backdrop-blur-sm text-xs">{dish.category}</Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/60 backdrop-blur-sm text-white hover:text-white hover:bg-black/80">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Dish?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{dish.name}&quot;? This action cannot be undone and will remove the dish from your database.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  setIsDeleting(dish.id);
                                  await deleteDish(dish.id);
                                  toast({
                                    title: "Dish deleted",
                                    description: `${dish.name} has been removed from your menu.`,
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete dish. Please try again.",
                                    variant: "destructive"
                                  });
                                } finally {
                                  setIsDeleting(null);
                                }
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {/* Publish status badge */}
                    <div className="absolute bottom-2 left-2">
                      <PublishToggle
                        published={dish.published ?? false}
                        onChange={async (newState) => {
                          const { toggleDishPublished } = await import("@/lib/db");
                          const success = await toggleDishPublished(dish.id, newState);
                          if (success) {
                            refreshMenu();
                            toast({
                              title: newState ? "Dish Published" : "Dish Unpublished",
                              description: newState
                                ? `${dish.name} is now visible to customers on Sprout.`
                                : `${dish.name} has been hidden from customers.`,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <CardContent className="flex flex-col flex-grow justify-between gap-4 pt-2">
                    <div>
                      <h3 className="text-lg font-semibold">{dish.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{dish.description}</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-muted-foreground">Starting at</p>
                          <p className="text-lg font-bold">₹{dish.price.original.toFixed(2)}</p>
                        </div>
                        <Link href={`/dashboard/dish/${dish.id}`} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                          Generate Alternative <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="mt-4 text-sm space-y-2">
                        <div className="grid grid-cols-3 gap-x-2 text-center">
                          <div />
                          <div className="text-xs text-muted-foreground font-medium">Original</div>
                          <div className="text-xs text-primary font-medium">Plant-Based</div>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 text-center items-center">
                          <div className="text-muted-foreground text-left">Calories</div>
                          <div className="font-bold text-foreground">{dish.nutrition.original.calories}</div>
                          <div className="font-bold text-primary">{dish.nutrition.plantBasedOptimized.calories}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 text-center items-center">
                          <div className="text-muted-foreground text-left">Protein</div>
                          <div className="font-bold text-foreground">{dish.nutrition.original.protein}g</div>
                          <div className="font-bold text-primary">{dish.nutrition.plantBasedOptimized.protein}g</div>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 text-center items-center">
                          <div className="text-muted-foreground text-left">Fat</div>
                          <div className="font-bold text-foreground">{dish.nutrition.original.fat}g</div>
                          <div className="font-bold text-primary">{dish.nutrition.plantBasedOptimized.fat}g</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>}

      {!isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Search className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold">No dishes found</h3>
          <p className="text-muted-foreground max-w-xs mt-2">
            We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try a different term or add a new menu item.
          </p>
          <div className="mt-6">
            <AddMenuItem />
          </div>
        </div>
      )}
    </main>
  );
}
