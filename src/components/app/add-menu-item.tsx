'use client';

import { useState, useTransition, useRef } from 'react';
import { Plus, Loader2, ImagePlus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMenu } from "@/context/MenuContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from '@/hooks/use-toast';
import { MENU_CATEGORIES } from '@/lib/data';
import { uploadDishImageAction } from '@/app/actions/upload-dish-image';

const CATEGORIES = MENU_CATEGORIES;


const formSchema = z.object({
  name: z.string().min(2, { message: "Dish name must be at least 2 characters." }),
  category: z.string().min(2, { message: "Category must be at least 2 characters." }),
  cuisine: z.string().min(2, { message: "Cuisine must be at least 2 characters." }),
  ingredients: z.string().min(10, { message: "Ingredients must be at least 10 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  priceOriginal: z.coerce.number().positive({ message: "Original price must be a positive number." }),
});

export function AddMenuItem() {
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const { addMenuItem } = useMenu();
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      cuisine: "",
      ingredients: "",
      description: "",
      priceOriginal: '' as unknown as number,
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    startSaving(async () => {
      let uploadedImageUrl: string | undefined;

      // Upload image if selected
      if (imageFile && user?.id) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('userId', user.id);
        const uploadResult = await uploadDishImageAction(formData);
        if (uploadResult.url) {
          uploadedImageUrl = uploadResult.url;
        } else if (uploadResult.error) {
          toast({
            title: "Image Upload Failed",
            description: uploadResult.error,
            variant: "destructive",
          });
        }
      }

      const { priceOriginal, ...rest } = values;
      await addMenuItem({
        ...rest,
        ingredients: values.ingredients.split(',').map(i => i.trim()),
        price: {
          original: priceOriginal,
          plantBased: priceOriginal, // placeholder — will be replaced by procurement cost
        },
      }, uploadedImageUrl);
      toast({
        title: "Menu Item Added",
        description: `${values.name} has been added to your menu and saved to the database.`,
      });
      form.reset();
      clearImage();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>
            Fill in the details for the new dish you want to add to your menu.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Dish Image (Optional)
              </label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                    <img
                      src={imagePreview}
                      alt="Dish preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">Click to upload an image</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dish Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vegan Burger" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short, appealing description of the dish." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuisine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., American" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Comma-separated, e.g., vegan patty, lettuce, tomato, bun" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-1">
              <FormField
                control={form.control}
                name="priceOriginal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="e.g. 299" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing nutrition...</> : 'Add Item'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
