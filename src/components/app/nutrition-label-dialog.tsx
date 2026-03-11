"use client";

import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import type { Dish, NutritionInfo } from "@/lib/data";
import { Separator } from '../ui/separator';

const NutritionLabel = ({ dish, plantBasedNutrition, componentRef }: { dish: Dish, plantBasedNutrition: NutritionInfo, componentRef: React.Ref<HTMLDivElement> }) => (
  <div ref={componentRef} className="bg-white text-black p-4 font-sans text-xs">
    <div className="border-4 border-black p-2">
      <h2 className="text-2xl font-bold font-serif">Nutrition Facts</h2>
      <Separator className='my-1 bg-black h-px' />
      <p>Serving Size {plantBasedNutrition.servingSize}</p>
      <Separator className='my-1 bg-black h-[2px]' />
      <p className='font-bold'>Amount Per Serving</p>
      <div className='flex justify-between items-baseline'>
        <h3 className="text-lg font-bold">Calories</h3>
        <p className="text-lg font-bold">{plantBasedNutrition.calories}</p>
      </div>
      <Separator className='my-1 bg-black h-[4px]' />
      <p className='text-right font-bold'>% Daily Value*</p>
      <Separator className='my-1 bg-black h-px' />
      <div className='flex justify-between'><p><span className='font-bold'>Total Fat</span> {plantBasedNutrition.fat}g</p> <p className='font-bold'>-</p></div>
      <Separator className='my-1 bg-black h-px' />
      <div className='flex justify-between'><p><span className='font-bold'>Sodium</span> {plantBasedNutrition.sodium}mg</p> <p className='font-bold'>-</p></div>
      <Separator className='my-1 bg-black h-px' />
      <div className='flex justify-between'><p><span className='font-bold'>Total Carbohydrate</span> {plantBasedNutrition.carbohydrates}g</p> <p className='font-bold'>-</p></div>
      <Separator className='my-1 bg-black h-px' />
      <div className='flex justify-between'><p><span className='font-bold'>Protein</span> {plantBasedNutrition.protein}g</p> <p className='font-bold'>-</p></div>
      <Separator className='my-1 bg-black h-[4px]' />
      <p className='text-xs'>*The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
    </div>
    <div className='mt-2 text-center'>
      <p className='font-bold'>The Daily Grind</p>
      <p>Plant-Based {dish.name}</p>
    </div>
  </div>
);


export function NutritionLabelDialog({ dish, plantBasedNutrition }: { dish: Dish; plantBasedNutrition: NutritionInfo }) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = labelRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Nutrition Label</title>');
        printWindow.document.write('<style>body { font-family: sans-serif; } .label-container { max-width: 300px; margin: 20px auto; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="label-container">' + printContent.innerHTML + '</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Printer className="mr-2 h-4 w-4" />
          Print Nutrition Label
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Final Nutrition Label</DialogTitle>
          <DialogDescription>
            This is the final, printable nutrition label for your plant-based dish.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-gray-100 rounded-md">
          <NutritionLabel dish={dish} plantBasedNutrition={plantBasedNutrition} componentRef={labelRef} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
