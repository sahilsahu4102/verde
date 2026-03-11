'use client';

import { useState, useTransition } from 'react';
import {
    supplierSearch,
    type SupplierSearchOutput,
} from '@/ai/flows/supplier-search';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PackageSearch, ExternalLink, CheckCircle2, AlertCircle, Info, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UsageBadge } from './usage-badge';
import { useSubscription } from '@/context/SubscriptionContext';
import { useRouter } from 'next/navigation';

interface SupplierCheckerProps {
    ingredients: string;
    onResult?: (totalBudget: number, batchServings: number) => void;
}

export function SupplierChecker({ ingredients, onResult }: SupplierCheckerProps) {
    const { toast } = useToast();
    const { canUse, trackUsage } = useSubscription();
    const router = useRouter();
    const [pincode, setPincode] = useState('');
    const [isSearching, startSearching] = useTransition();
    const [result, setResult] = useState<SupplierSearchOutput | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleCheckFeasibility = () => {
        if (!pincode || pincode.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Invalid Pincode',
                description: 'Please enter a valid 6-digit pincode.',
            });
            return;
        }

        const { allowed } = canUse('procurement_plans');
        if (!allowed) {
            toast({
                variant: 'destructive',
                title: 'Limit Reached',
                description: 'You\'ve used all your procurement plans this month.',
                action: <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/subscription')}>Upgrade Plan</Button>,
            });
            return;
        }

        startSearching(async () => {
            try {
                await trackUsage('procurement_plans');
                const output = await supplierSearch({ ingredients, pincode });
                setResult(output);
                if (onResult && output.isFeasible) {
                    onResult(output.totalEstimatedBudget, output.batchServings);
                }
            } catch (error: any) {
                console.error('Supplier search failed:', error);
                toast({
                    variant: 'destructive',
                    title: 'Search Failed',
                    description: error.message || 'Could not fetch supplier data.',
                });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="w-full bg-primary hover:bg-primary/90">
                    <PackageSearch className="mr-2 h-4 w-4" />
                    Procure Raw Materials
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackageSearch className="text-primary" />
                        Raw Material Procurement Agent
                    </DialogTitle>
                    <DialogDescription>
                        Get a detailed batch procurement plan with quantities, pack sizes, and live retailer links.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Pincode input */}
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="pincode">Your Restaurant Pincode</Label>
                        <div className="flex gap-2">
                            <Input
                                id="pincode"
                                placeholder="e.g. 400001"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                maxLength={6}
                                className="max-w-[200px]"
                            />
                            <Button onClick={handleCheckFeasibility} disabled={isSearching || !canUse('procurement_plans').allowed}>
                                {isSearching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Building plan...
                                    </>
                                ) : (
                                    <>
                                        Get Procurement Plan
                                        <UsageBadge feature="procurement_plans" className="ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {result && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

                            {/* Feasibility */}
                            <Alert
                                variant={result.isFeasible ? 'default' : 'destructive'}
                                className={result.isFeasible ? 'bg-primary/10 border-primary/20' : ''}
                            >
                                {result.isFeasible
                                    ? <CheckCircle2 className="h-4 w-4 text-primary" />
                                    : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle className={result.isFeasible ? 'text-primary font-bold' : ''}>
                                    {result.isFeasible ? 'Delivery Feasible' : 'Delivery Not Feasible'}
                                </AlertTitle>
                                <AlertDescription>{result.reasoning}</AlertDescription>
                            </Alert>

                            {result.isFeasible && (
                                <>
                                    {/* Batch badge + disclaimer */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">
                                                Batch plan for{' '}
                                                <span className="text-primary font-bold">{result.batchServings} servings</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                                            <Info className="h-3.5 w-3.5 shrink-0" />
                                            <span>Prices are AI estimates. Click retailer links to see live prices.</span>
                                        </div>
                                    </div>

                                    {/* Per-ingredient cards */}
                                    <div className="space-y-3">
                                        {result.budgetDetails.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-lg border bg-card p-4 space-y-3"
                                            >
                                                {/* Header row */}
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <span className="font-semibold text-sm capitalize">{item.ingredient}</span>
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        Need: <span className="font-bold ml-1">{item.quantityNeeded}</span>
                                                    </Badge>
                                                </div>

                                                {/* Retailer rows */}
                                                <div className="grid gap-2">
                                                    {item.retailers.map((r, rIdx) => (
                                                        <div
                                                            key={rIdx}
                                                            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-md px-3 py-2"
                                                        >
                                                            {/* Left: link + pack info */}
                                                            <div className="flex items-center gap-3">
                                                                <a
                                                                    href={r.searchUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-primary hover:underline font-medium text-xs whitespace-nowrap"
                                                                >
                                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                                    {r.name}
                                                                </a>
                                                                <span className="text-muted-foreground text-xs">{r.packSize}</span>
                                                            </div>

                                                            {/* Right: calculation */}
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                                                {r.isLivePrice ? (
                                                                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                                                        Live
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground/60 font-medium">~ Est.</span>
                                                                )}
                                                                <span>₹{r.pricePerPack.toFixed(0)}/pack</span>
                                                                <span>×</span>
                                                                <span>{r.packsNeeded} pack{r.packsNeeded !== 1 ? 's' : ''}</span>
                                                                <span>=</span>
                                                                <span className="font-bold text-foreground">₹{r.subtotal.toFixed(0)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total + breakdown */}
                                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                            Cost Breakdown (cheapest retailer per ingredient)
                                        </p>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {result.budgetBreakdown}
                                        </p>
                                        <div className="flex items-end justify-between pt-1 border-t mt-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total batch cost</p>
                                                <p className="text-xs text-muted-foreground">≈ ₹{(result.totalEstimatedBudget / result.batchServings).toFixed(0)} per serving</p>
                                            </div>
                                            <p className="text-3xl font-bold text-primary">
                                                ~₹{result.totalEstimatedBudget.toFixed(0)}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
