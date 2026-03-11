"use client";

import { useEffect, useState } from "react";
import {
    fetchAllReviews,
    fetchCafeReviews,
    fetchDishReviews,
    fetchCafeDishes,
    replyToReview,
    type Review,
    type Dish,
} from "@/lib/sprout-db";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Star,
    MessageSquare,
    Send,
    Store,
    UtensilsCrossed,
    TrendingUp,
    BarChart3,
} from "lucide-react";

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"all" | "cafe" | "dish">("all");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        loadData();
    }, [tab]);

    async function loadData() {
        setLoading(true);
        const [reviewsData, dishesData] = await Promise.all([
            tab === "cafe" ? fetchCafeReviews() : tab === "dish" ? fetchDishReviews() : fetchAllReviews(),
            fetchCafeDishes()
        ]);
        setReviews(reviewsData);
        setDishes(dishesData);
        setLoading(false);
    }

    async function handleReply(reviewId: string) {
        if (!replyText.trim()) return;
        const { error } = await replyToReview(reviewId, replyText.trim());
        if (!error) {
            setReplyingTo(null);
            setReplyText("");
            loadData();
        }
    }

    // Stats
    const avgRating =
        reviews.length > 0
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : 0;
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
    });
    const maxDist = Math.max(...distribution, 1);

    const cafeCount = reviews.filter((r) => r.review_type === "cafe").length;
    const dishCount = reviews.filter((r) => r.review_type === "dish").length;

    // Average taste/texture for dish reviews
    const dishReviews = reviews.filter((r) => r.review_type === "dish");
    const avgTaste =
        dishReviews.length > 0
            ? dishReviews.reduce((s, r) => s + (r.taste_rating ?? 0), 0) /
            dishReviews.filter((r) => r.taste_rating != null).length || 0
            : 0;
    const avgTexture =
        dishReviews.length > 0
            ? dishReviews.reduce((s, r) => s + (r.texture_rating ?? 0), 0) /
            dishReviews.filter((r) => r.texture_rating != null).length || 0
            : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
                <p className="text-muted-foreground">
                    View and respond to customer feedback
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold">
                            {avgRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center gap-0.5 my-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${i <= Math.round(avgRating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg Rating
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold">
                            {reviews.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total Reviews
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Store className="w-5 h-5 text-blue-500" />
                            <span className="text-3xl font-bold">
                                {cafeCount}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Restaurant Reviews
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <UtensilsCrossed className="w-5 h-5 text-green-500" />
                            <span className="text-3xl font-bold">
                                {dishCount}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Dish Reviews
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Chart + Sub-Ratings */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Rating
                            Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = distribution[star - 1];
                            const pct = (count / maxDist) * 100;
                            return (
                                <div
                                    key={star}
                                    className="flex items-center gap-2"
                                >
                                    <span className="w-4 text-sm font-semibold">
                                        {star}
                                    </span>
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-xs text-muted-foreground text-right">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Dish Sub-Ratings
                        </CardTitle>
                        <CardDescription>
                            Average taste & texture from dish reviews
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Taste</span>
                                <span className="font-semibold">
                                    {avgTaste.toFixed(1)} / 5
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-400 rounded-full transition-all"
                                    style={{
                                        width: `${(avgTaste / 5) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Texture</span>
                                <span className="font-semibold">
                                    {avgTexture.toFixed(1)} / 5
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-400 rounded-full transition-all"
                                    style={{
                                        width: `${(avgTexture / 5) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                {(["all", "cafe", "dish"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === t
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {t === "all"
                            ? "All Reviews"
                            : t === "cafe"
                                ? "Restaurant"
                                : "Dish Reviews"}
                    </button>
                ))}
            </div>

            {/* Review List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading reviews...
                </div>
            ) : reviews.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">
                            No reviews found
                        </p>
                    </CardContent>
                </Card>
            ) : tab === "dish" ? (
                <div className="space-y-8">
                    {Array.from(new Set(reviews.map((r) => r.dish_id))).map((dishId) => {
                        const dishReviews = reviews.filter((r) => r.dish_id === dishId);
                        const dishName = dishId
                            ? dishes.find((d) => d.id === dishId)?.name || "Unknown Dish"
                            : "General Dish Info";

                        return (
                            <div key={dishId || "general"} className="space-y-4">
                                <h2 className="text-xl font-semibold border-b pb-2">Reviews for {dishName}</h2>
                                <div className="space-y-4">
                                    {dishReviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            dishes={dishes}
                                            replyingTo={replyingTo}
                                            replyText={replyText}
                                            setReplyText={setReplyText}
                                            setReplyingTo={setReplyingTo}
                                            handleReply={handleReply}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            dishes={dishes}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            setReplyingTo={setReplyingTo}
                            handleReply={handleReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Extracted Component
function ReviewCard({
    review,
    dishes,
    replyingTo,
    replyText,
    setReplyText,
    setReplyingTo,
    handleReply
}: {
    review: Review,
    dishes: Dish[],
    replyingTo: string | null,
    replyText: string,
    setReplyText: (text: string) => void,
    setReplyingTo: (id: string | null) => void,
    handleReply: (id: string) => void
}) {
    return (
        <Card>
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {(review.user_name || "A")
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold">
                                {review.user_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center flex-wrap gap-1 mt-0.5">
                                {new Date(
                                    review.created_at
                                ).toLocaleDateString()}{" "}
                                •{" "}
                                <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${review.review_type ===
                                        "cafe"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        }`}
                                >
                                    {review.review_type ===
                                        "cafe"
                                        ? "Restaurant"
                                        : "Dish"}
                                </span>
                                {review.review_type === "dish" && review.dish_id && (
                                    <span className="font-medium text-foreground ml-1">
                                        for {dishes.find((d) => d.id === review.dish_id)?.name || "Unknown Dish"}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Sub-ratings for dish reviews */}
                {review.review_type === "dish" &&
                    (review.taste_rating != null ||
                        review.texture_rating != null) && (
                        <div className="flex gap-6 mb-3 text-sm">
                            {review.taste_rating != null && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    Taste:
                                    <span className="font-medium text-foreground">
                                        {review.taste_rating}/5
                                    </span>
                                </span>
                            )}
                            {review.texture_rating != null && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    Texture:
                                    <span className="font-medium text-foreground">
                                        {
                                            review.texture_rating
                                        }
                                        /5
                                    </span>
                                </span>
                            )}
                        </div>
                    )}

                {/* Review text */}
                {review.review_text && (
                    <p className="text-sm mb-2">
                        {review.review_text}
                    </p>
                )}

                {/* Suggestions */}
                {review.suggestions && (
                    <p className="text-sm text-muted-foreground mb-3">
                        💡 {review.suggestions}
                    </p>
                )}

                {/* Owner reply */}
                {review.owner_reply && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-primary mb-1">
                            Your Reply
                        </p>
                        <p className="text-sm">
                            {review.owner_reply}
                        </p>
                    </div>
                )}

                {/* Reply actions */}
                {!review.owner_reply && (
                    <div>
                        {replyingTo === review.id ? (
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={replyText}
                                    onChange={(e) =>
                                        setReplyText(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Write your reply..."
                                    className="flex-1"
                                />
                                <Button
                                    size="icon"
                                    onClick={() =>
                                        handleReply(review.id)
                                    }
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setReplyingTo(review.id)
                                }
                            >
                                <MessageSquare className="w-3 h-3 mr-1" />{" "}
                                Reply
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
