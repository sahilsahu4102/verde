'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  plantBasedReformulation,
  type PlantBasedReformulationOutput,
} from '@/ai/flows/plant-based-reformulation';
import {
  generateMarketingContent,
  type GenerateMarketingContentOutput,
} from '@/ai/flows/generate-marketing-content';
import {
  submitVideoReel,
  checkVideoReelStatus,
} from '@/ai/flows/generate-video-reel';
import { SupplierChecker } from './supplier-checker';
import type { Dish, NutritionInfo } from '@/lib/data';
import {
  fetchReformulation,
  saveReformulation,
  deleteReformulation,
  fetchMarketingContent,
  saveMarketingContent,
  deleteMarketingContent,
  fetchVideo,
  saveVideo,
  deleteVideo,
} from '@/lib/db';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Bot, Loader2, Sparkles, ExternalLink, RefreshCw, X, Send, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { NutritionLabelDialog } from './nutrition-label-dialog';
import { useToast } from '@/hooks/use-toast';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { UsageBadge } from './usage-badge';
import { useSubscription } from '@/context/SubscriptionContext';
import { useRouter } from 'next/navigation';

export function DishAnalysis({ dish }: { dish: Dish }) {
  const { toast } = useToast();
  const { canUse, trackUsage } = useSubscription();
  const router = useRouter();
  const [isReformulating, startReformulation] = useTransition();
  const [reformulation, setReformulation] =
    useState<PlantBasedReformulationOutput | null>(null);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizedNutrition, setShowOptimizedNutrition] = useState(false);
  const [plantBasedNutrition, setPlantBasedNutrition] = useState<NutritionInfo | null>(dish.nutrition.plantBasedInitial);

  const [isGeneratingMarketing, startMarketingGeneration] = useTransition();
  const [marketingContent, setMarketingContent] =
    useState<GenerateMarketingContentOutput | null>(null);

  const [isGeneratingReel, startReelGeneration] = useTransition();
  const [videoReelUrl, setVideoReelUrl] = useState<string | null>(null);
  const reelCancelledRef = useRef(false);
  const currentRequestIdRef = useRef<string | null>(null);
  const [reelInstructions, setReelInstructions] = useState('');
  const [reelHistory, setReelHistory] = useState<{ role: 'user' | 'system'; text: string }[]>([]);

  const [rawMaterialCostPerServing, setRawMaterialCostPerServing] = useState<number | null>(null);

  const [isLoadingCached, setIsLoadingCached] = useState(true);

  // Load cached data from Supabase on mount
  useEffect(() => {
    let cancelled = false;

    async function loadCachedData() {
      setIsLoadingCached(true);
      try {
        // Load all cached data in parallel
        const [cachedReformulation, cachedMarketing, cachedVideo] = await Promise.all([
          fetchReformulation(dish.id),
          fetchMarketingContent(dish.id),
          fetchVideo(dish.id),
        ]);

        if (cancelled) return;

        if (cachedReformulation) {
          setReformulation(cachedReformulation);
        }
        if (cachedMarketing) {
          setMarketingContent(cachedMarketing);
        }
        if (cachedVideo) {
          setVideoReelUrl(cachedVideo.videoUrl);
        }

        // Only generate reformulation if not cached
        if (!cachedReformulation) {
          runReformulation();
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
        // Fall back to generating fresh
        runReformulation();
      } finally {
        if (!cancelled) setIsLoadingCached(false);
      }
    }

    loadCachedData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dish.id]);

  const runReformulation = (forceRegenerate = false) => {
    startReformulation(async () => {
      try {
        if (forceRegenerate) {
          await deleteReformulation(dish.id);
          setReformulation(null);
          setShowOptimizedNutrition(false);
          setPlantBasedNutrition(dish.nutrition.plantBasedInitial);
        }
        const result = await plantBasedReformulation({
          dishName: dish.name,
          ingredients: dish.ingredients.join(', '),
          cuisineType: dish.cuisine,
        });
        setReformulation(result);
        // Save to Supabase
        await saveReformulation(dish.id, result);
        if (forceRegenerate) {
          toast({
            title: '✅ Reformulation Regenerated',
            description: 'New plant-based alternative has been generated and saved.',
          });
        }
      } catch (error: any) {
        console.error('Reformulation failed:', error);
        let description = error.message || 'Could not generate plant-based alternative.';
        if (error.message && error.message.includes('leaked')) {
          description = "Your API key has been compromised and cannot be used. Please generate a new key and update your .env file.";
        } else if (error.message && error.message.includes('quota')) {
          description = "You've exceeded the free API quota. Please check your Google Cloud billing details or try again later.";
        }
        toast({
          variant: 'destructive',
          title: 'Reformulation Failed',
          description: description,
        });
      }
    });
  };

  useEffect(() => {
    if (reformulation && !showOptimizedNutrition) {
      const proteinDifference = dish.nutrition.original.protein - dish.nutrition.plantBasedInitial.protein;
      if (proteinDifference > 2) {
        setIsOptimizing(true);
        const timer = setTimeout(() => {
          setPlantBasedNutrition(dish.nutrition.plantBasedOptimized);
          setShowOptimizedNutrition(true);
          setIsOptimizing(false);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setPlantBasedNutrition(dish.nutrition.plantBasedOptimized);
        setShowOptimizedNutrition(true);
      }
    }
  }, [reformulation, dish.nutrition, showOptimizedNutrition]);

  const handleGenerateMarketing = async (forceRegenerate = false) => {
    startMarketingGeneration(async () => {
      try {
        if (forceRegenerate) {
          await deleteMarketingContent(dish.id);
          setMarketingContent(null);
        }
        const result = await generateMarketingContent({ dishName: `Plant-Based ${dish.name}` });
        setMarketingContent(result);
        setVideoReelUrl(null);
        // Save to Supabase
        await saveMarketingContent(dish.id, result);
        if (forceRegenerate) {
          toast({
            title: '✅ Marketing Regenerated',
            description: 'New marketing content has been generated and saved.',
          });
        }
      } catch (error: any) {
        console.error('Marketing content generation failed:', error);
        let description = error.message || 'Could not generate marketing content.';
        if (error.message && error.message.includes('leaked')) {
          description = "Your API key has been compromised and cannot be used. Please generate a new key and update your .env file.";
        } else if (error.message && error.message.includes('quota')) {
          description = "You've exceeded the free API quota. Please check your Google Cloud billing details or try again later.";
        }
        toast({
          variant: 'destructive',
          title: 'Marketing Failed',
          description,
        });
      }
    });
  };

  const handleGenerateReel = (forceRegenerate = false, instructions?: string) => {
    reelCancelledRef.current = false;
    startReelGeneration(async () => {
      if (forceRegenerate) {
        await deleteVideo(dish.id);
      }
      setVideoReelUrl(null);

      // Step 1: Submit to queue (returns immediately)
      const submitResult = await submitVideoReel({
        dishName: `Plant-Based ${dish.name}`,
        imageUrl: dish.image.imageUrl,
        caption: marketingContent?.caption,
        customInstructions: instructions,
      });

      if ('error' in submitResult) {
        toast({ variant: 'destructive', title: 'Reel Generation Failed', description: submitResult.error });
        return;
      }

      const { requestId } = submitResult;
      currentRequestIdRef.current = requestId;

      // Step 2: Poll for status every 5 seconds
      const poll = async (): Promise<void> => {
        if (reelCancelledRef.current || currentRequestIdRef.current !== requestId) return;

        const status = await checkVideoReelStatus(requestId);

        if (reelCancelledRef.current || currentRequestIdRef.current !== requestId) return;

        if (status.error) {
          currentRequestIdRef.current = null;
          toast({ variant: 'destructive', title: 'Reel Generation Failed', description: status.error });
          return;
        }

        if (status.status === 'COMPLETED' && status.videoUrl) {
          currentRequestIdRef.current = null;
          setVideoReelUrl(status.videoUrl);
          await saveVideo(dish.id, status.videoUrl, marketingContent?.caption, marketingContent?.hashtags);
          if (forceRegenerate) {
            toast({ title: '✅ Video Reel Regenerated', description: 'New video reel has been generated and saved.' });
          }
          return;
        }

        // Still processing — wait 5s and poll again
        await new Promise((r) => setTimeout(r, 5000));
        return poll();
      };

      await poll();
    });
  };

  // Add visibility listener to resume polling instantly when tabbing back
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && currentRequestIdRef.current && !videoReelUrl && !reelCancelledRef.current) {
        // We have an active job and just tabbed back in, trigger an immediate check
        const activeRequestId = currentRequestIdRef.current;
        const status = await checkVideoReelStatus(activeRequestId);

        if (reelCancelledRef.current || currentRequestIdRef.current !== activeRequestId) return;

        if (status.error) {
          currentRequestIdRef.current = null;
          toast({ variant: 'destructive', title: 'Reel Generation Failed', description: status.error });
          return;
        }

        if (status.status === 'COMPLETED' && status.videoUrl) {
          currentRequestIdRef.current = null;
          setVideoReelUrl(status.videoUrl);
          await saveVideo(dish.id, status.videoUrl, marketingContent?.caption, marketingContent?.hashtags);
          toast({ title: '✅ Video Reel Ready', description: 'Your background video reel generation has finished.' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dish.id, marketingContent?.caption, marketingContent?.hashtags, videoReelUrl, toast]);

  const handleCancelReel = () => {
    reelCancelledRef.current = true;
    toast({
      title: 'Reel Generation Cancelled',
      description: 'The video reel generation has been cancelled.',
    });
  };

  if (isLoadingCached) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              🌱 Plant-Based Alternative Generated
            </CardTitle>
            {reformulation && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { allowed } = canUse('dish_analyses');
                  if (!allowed) {
                    toast({ variant: 'destructive', title: 'Limit Reached', description: 'You\'ve used all your dish analyses this month.', action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/subscription')}>Upgrade Plan</Button> });
                    return;
                  }
                  const result = await trackUsage('dish_analyses');
                  if (result.allowed) runReformulation(true);
                }}
                disabled={isReformulating || !canUse('dish_analyses').allowed}
              >
                {isReformulating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate
                <UsageBadge feature="dish_analyses" className="ml-2" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isReformulating ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : reformulation ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <h3 className="font-semibold text-sm">Taste Match</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={reformulation.tasteSimilarityScore * 10} />
                    <span className="font-bold text-sm">
                      {reformulation.tasteSimilarityScore}/10
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Texture Match</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={reformulation.textureSimilarityScore * 10} />
                    <span className="font-bold text-sm">
                      {reformulation.textureSimilarityScore}/10
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Local Sourcing</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={reformulation.localAvailabilityScore * 10} className="[&>div]:bg-green-500" />
                    <span className="font-bold text-sm">
                      {reformulation.localAvailabilityScore}/10
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm">
                <span className="font-semibold">
                  Customer-noticeable difference:
                </span>{' '}
                <Badge
                  variant={
                    reformulation.differenceNoticeability.toUpperCase() === 'LOW'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {reformulation.differenceNoticeability}
                </Badge>
              </p>
              <div>
                <h3 className="font-semibold">📋 Recipe Substitution Guide</h3>
                <div className="mt-2 p-4 rounded-lg bg-muted/50 space-y-1">
                  {reformulation.ingredientSwapExplanation
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .split('\n')
                    .map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      const isNumberedHeader = /^\d+\./.test(trimmed) && !trimmed.includes(':');
                      const isLabel = /^(Original|Replacement|Tip|Note|Preparation|Flavor|Plant-Based)/i.test(trimmed);
                      return (
                        <p
                          key={i}
                          className={`text-sm leading-relaxed ${isNumberedHeader
                            ? 'font-semibold text-foreground mt-3 pt-2 border-t border-border first:mt-0 first:pt-0 first:border-0'
                            : isLabel
                              ? 'text-muted-foreground pl-4'
                              : 'text-muted-foreground pl-4'
                            }`}
                        >
                          {trimmed}
                        </p>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to generate a plant-based alternative. This may be due to API quota limits. Please check your billing details or try again later.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Nutrition Comparison</CardTitle>
          <CardDescription>Side-by-side view of nutritional information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOptimizing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Protein difference detected!</AlertTitle>
              <AlertDescription>
                Optimizing formulation to better match the original nutrition profile...
              </AlertDescription>
            </Alert>
          )}
          {showOptimizedNutrition && !isOptimizing && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>✅ Formulation Optimized</AlertTitle>
              <AlertDescription>
                The plant-based recipe has been updated using pea protein to match the original protein content.
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nutrient</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Plant-Based</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!plantBasedNutrition ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Calories (kcal)</TableCell>
                      <TableCell className="text-right">{dish.nutrition.original.calories}</TableCell>
                      <TableCell className="text-right">{plantBasedNutrition.calories}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Protein (g)</TableCell>
                      <TableCell className="text-right">{dish.nutrition.original.protein}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{plantBasedNutrition.protein}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fat (g)</TableCell>
                      <TableCell className="text-right">{dish.nutrition.original.fat}</TableCell>
                      <TableCell className="text-right">{plantBasedNutrition.fat}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carbs (g)</TableCell>
                      <TableCell className="text-right">{dish.nutrition.original.carbohydrates}</TableCell>
                      <TableCell className="text-right">{plantBasedNutrition.carbohydrates}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          {plantBasedNutrition && showOptimizedNutrition && (
            <NutritionLabelDialog dish={dish} plantBasedNutrition={plantBasedNutrition} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💰 Price Comparison</CardTitle>
          <CardDescription>
            Original dish price vs. estimated raw material cost for plant-based alternative.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Original Dish</p>
              <p className="text-3xl font-bold">₹{dish.price.original.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Raw Material Cost</p>
              {rawMaterialCostPerServing !== null ? (
                <>
                  <p className="text-3xl font-bold text-primary">₹{rawMaterialCostPerServing.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">per serving (procurement estimate)</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-3 italic">Run procurement plan ↓ to see cost</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reformulation && (
        <SupplierChecker
          ingredients={reformulation.plantBasedIngredients}
          onResult={(totalBudget, batchServings) =>
            setRawMaterialCostPerServing(Math.round((totalBudget / batchServings) * 100) / 100)
          }
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="text-primary" /> 📢 AI Marketing Agent</CardTitle>
          <CardDescription>Generates marketing content and video reels based on daily food trends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Detected Trends Today</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">🔥 High-protein plant-based meals</Badge>
              <Badge variant="outline">🌱 Dairy-free desserts</Badge>
              <Badge variant="outline">🏋️ Fitness-conscious eating</Badge>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold">AI-Selected Strategy</h3>
            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
              <div><span className="font-medium text-muted-foreground">Platform</span><p>Instagram</p></div>
              <div><span className="font-medium text-muted-foreground">Format</span><p>Reel</p></div>
              <div><span className="font-medium text-muted-foreground">Core Message</span><p>Protein & taste parity</p></div>
            </div>
          </div>
          {marketingContent && (
            <div className="space-y-4">
              <div>
                <label htmlFor="caption" className="text-sm font-medium">Ready-to-use Caption</label>
                <Textarea id="caption" readOnly value={`${marketingContent.caption}\n\n⚠️ Note: This reel is AI-generated. The actual item may look different. Used purely for marketing purposes.`} className="mt-1 h-36" />
              </div>
              <div>
                <label htmlFor="hashtags" className="text-sm font-medium">Hashtags</label>
                <Textarea id="hashtags" readOnly value={marketingContent.hashtags} className="mt-1" />
              </div>
            </div>
          )}
          {isGeneratingMarketing && (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {videoReelUrl && (
            <div className="space-y-2">
              <h3 className="font-semibold">Generated Reel</h3>
              <video src={videoReelUrl} controls className="w-full rounded-lg" />
            </div>
          )}
          {/* Reel Instructions Chat */}
          {marketingContent && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 text-primary" />
                Customize Your Reel
              </h3>
              {reelHistory.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {reelHistory.map((msg, i) => (
                    <div key={i} className={`text-sm px-3 py-1.5 rounded-lg w-fit max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reelInstructions.trim()) return;
                  const instruction = reelInstructions.trim();
                  setReelHistory(prev => [
                    ...prev,
                    { role: 'user', text: instruction },
                    { role: 'system', text: 'Generating reel with your instructions...' },
                  ]);
                  setReelInstructions('');
                  (async () => {
                    const { allowed } = canUse('video_reels');
                    if (!allowed) {
                      toast({ variant: 'destructive', title: 'Limit Reached', description: 'You\'ve used all your video reels this month.' });
                      return;
                    }
                    await trackUsage('video_reels');
                    handleGenerateReel(!!videoReelUrl, instruction);
                  })();
                }}
                className="flex gap-2"
              >
                <Input
                  value={reelInstructions}
                  onChange={(e) => setReelInstructions(e.target.value)}
                  placeholder="e.g. 'Make it warmer', 'Focus on the cheese pull'..."
                  className="flex-1 text-sm"
                  disabled={isGeneratingReel}
                />
                <Button type="submit" size="icon" disabled={isGeneratingReel || !reelInstructions.trim()} className="h-9 w-9">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">Type specific changes and hit send to regenerate the reel with your instructions.</p>
            </div>
          )}
          {isGeneratingReel && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <TextShimmer
                duration={1.2}
                className="text-base font-semibold [--base-color:theme(colors.green.800)] [--base-gradient-color:theme(colors.green.400)] dark:[--base-color:theme(colors.green.600)] dark:[--base-gradient-color:theme(colors.green.300)]"
              >
                Generating your video reel...
              </TextShimmer>
              <p className="text-xs text-muted-foreground">This can take up to a minute. Please don&apos;t close this page.</p>
              <Button variant="outline" size="sm" onClick={handleCancelReel} className="mt-1">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              onClick={async () => {
                const { allowed } = canUse('marketing_generations');
                if (!allowed) {
                  toast({ variant: 'destructive', title: 'Limit Reached', description: 'You\'ve used all your marketing generations this month.', action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/subscription')}>Upgrade Plan</Button> });
                  return;
                }
                await trackUsage('marketing_generations');
                handleGenerateMarketing(!!marketingContent);
              }}
              disabled={isGeneratingMarketing || isGeneratingReel || !canUse('marketing_generations').allowed}
            >
              {isGeneratingMarketing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : marketingContent ? <RefreshCw className="mr-2 h-4 w-4" /> : <Bot className="mr-2 h-4 w-4" />}
              {marketingContent ? "Regenerate Marketing Content" : "Run Today's Marketing Agent"}
              <UsageBadge feature="marketing_generations" className="ml-2" />
            </Button>
            {marketingContent && (
              <Button
                onClick={async () => {
                  const { allowed } = canUse('video_reels');
                  if (!allowed) {
                    toast({ variant: 'destructive', title: canUse('video_reels').limit === 0 ? 'Not Available' : 'Limit Reached', description: canUse('video_reels').limit === 0 ? 'Video reels require Growth plan or above.' : 'You\'ve used all your video reels this month.', action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/subscription')}>Upgrade Plan</Button> });
                    return;
                  }
                  await trackUsage('video_reels');
                  handleGenerateReel(!!videoReelUrl);
                }}
                disabled={isGeneratingReel || isGeneratingMarketing || !canUse('video_reels').allowed}
              >
                {isGeneratingReel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : videoReelUrl ? <RefreshCw className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {videoReelUrl ? "Regenerate Reel" : "Generate Reel"}
                <UsageBadge feature="video_reels" className="ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
