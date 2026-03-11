'use client';

import { notFound, useParams } from "next/navigation";
import { useMenu } from "@/context/MenuContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";
import { DishAnalysis } from "@/components/app/dish-analysis";
import { DishAIPanel } from "@/components/app/dish-ai-panel";

export default function DishDetailPage() {
  const params = useParams<{ id: string }>();
  const { menuItems } = useMenu();
  const dish = menuItems.find((d) => d.id === params.id);

  if (!dish) {
    notFound();
  }

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{dish.name}</CardTitle>
                  <CardDescription>{dish.cuisine}</CardDescription>
                </div>
                {dish.isBestSeller && <Badge variant="secondary">Best Seller</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="ingredients">
                  <AccordionTrigger>Original Ingredients</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {dish.ingredients.map((ing) => (
                        <li key={ing}>{ing}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <DishAnalysis dish={dish} />

        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 bg-primary/10">
            <CardHeader className="flex flex-row items-center gap-4">
              <Leaf className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Impact Indicator</CardTitle>
                <CardDescription>By switching this one dish</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Estimated animal lives spared per year:</p>
              <p className="text-4xl font-bold text-primary">~{dish.impact}</p>
              {dish.impactExplanation && (
                <p className="text-xs text-muted-foreground mt-2 italic">{dish.impactExplanation}</p>
              )}
            </CardContent>
          </Card>

          <DishAIPanel dish={dish} />
        </div>
      </div>
    </main>
  );
}
