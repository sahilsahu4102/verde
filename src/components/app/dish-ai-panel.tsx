"use client";

import { useState, useRef, useEffect } from "react";
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
    Sparkles,
    Send,
    Bot,
    User,
    Loader2,
    Brain,
    MessageCircle,
    Lightbulb,
} from "lucide-react";
import type { Dish } from "@/lib/data";
import { fetchDishReviews, type Review } from "@/lib/sprout-db";

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
    actionItems?: string[];
    category?: string;
};

export function DishAIPanel({ dish }: { dish: Dish }) {
    const [activeTab, setActiveTab] = useState<"chat" | "retrain">("chat");

    // ─── Reviews loaded once ───
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    useEffect(() => {
        fetchDishReviews(dish.id).then((r) => {
            setReviews(r);
            setReviewsLoading(false);
        });
    }, [dish.id]);

    // ─── Retrain Panel State (auto-populated from dish + reviews) ───
    const tasteRated = reviews.filter((r) => r.taste_rating != null);
    const textureRated = reviews.filter((r) => r.texture_rating != null);

    const avgTaste = tasteRated.length
        ? (
            tasteRated.reduce((s, r) => s + r.taste_rating!, 0) /
            tasteRated.length
        ).toFixed(1)
        : null;
    const avgTexture = textureRated.length
        ? (
            textureRated.reduce((s, r) => s + r.texture_rating!, 0) /
            textureRated.length
        ).toFixed(1)
        : null;

    const complaints = reviews
        .filter((r) => r.rating <= 2)
        .map((r) => r.review_text)
        .slice(0, 5);
    const praises = reviews
        .filter((r) => r.rating >= 4)
        .map((r) => r.review_text)
        .slice(0, 5);
    const feedbackSummary = reviews
        .map((r) => r.review_text)
        .filter(Boolean)
        .slice(0, 8)
        .join("; ");

    const [retrainResult, setRetrainResult] = useState<Record<
        string,
        unknown
    > | null>(null);
    const [retrainLoading, setRetrainLoading] = useState(false);

    // ─── Chat State ───
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content: `Hi! I'm Verde AI. I'm ready to help you improve **${dish.name}**. Ask me about substitutions, review insights, marketing ideas, or anything else! 🌱`,
        },
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    async function handleRetrain() {
        setRetrainLoading(true);
        try {
            const res = await fetch("/api/ai/feedback-reformulation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dishName: dish.name,
                    originalIngredients: dish.ingredients,
                    currentSubstitutions: dish.ingredients, // same for now
                    feedbackSummary:
                        feedbackSummary || "No customer reviews yet.",
                    avgTasteRating: avgTaste ? parseFloat(avgTaste) : 3,
                    avgTextureRating: avgTexture ? parseFloat(avgTexture) : 3,
                    commonComplaints: complaints.length
                        ? complaints
                        : ["No complaints yet"],
                    commonPraises: praises.length
                        ? praises
                        : ["No praises yet"],
                }),
            });
            const data = await res.json();
            setRetrainResult(data);
        } catch (err) {
            console.error("Retrain error:", err);
        }
        setRetrainLoading(false);
    }

    async function handleChat() {
        if (!chatInput.trim()) return;
        const userMsg: ChatMessage = { role: "user", content: chatInput };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        setChatLoading(true);

        try {
            // Include dish context in the chat
            const contextMessage = `[Context: The owner is viewing dish "${dish.name}" with ingredients: ${dish.ingredients.join(", ")}. Reviews count: ${reviews.length}, Avg taste: ${avgTaste ?? "N/A"}/5, Avg texture: ${avgTexture ?? "N/A"}/5]\n\nOwner's question: ${chatInput}`;

            const res = await fetch("/api/ai/owner-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: contextMessage }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        data.reply ||
                        "I'm not sure about that. Could you rephrase?",
                    actionItems: data.actionItems,
                    category: data.category,
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Sorry, I had trouble processing that. Please try again.",
                },
            ]);
        }
        setChatLoading(false);
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> AI Tools
                </CardTitle>
                <CardDescription>
                    Chat with AI or improve this dish based on reviews
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === "chat"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat
                    </button>
                    <button
                        onClick={() => setActiveTab("retrain")}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === "retrain"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Brain className="w-3.5 h-3.5" /> Improve
                    </button>
                </div>

                {/* ─── Chat Panel ─── */}
                {activeTab === "chat" && (
                    <div className="flex flex-col" style={{ height: "400px" }}>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">
                                            {msg.content}
                                        </p>
                                        {msg.actionItems &&
                                            msg.actionItems.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-primary/10">
                                                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                                        <Lightbulb className="w-3 h-3" />{" "}
                                                        Action Items:
                                                    </p>
                                                    <ul className="text-xs space-y-0.5">
                                                        {msg.actionItems.map(
                                                            (item, i) => (
                                                                <li key={i}>
                                                                    • {item}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                            <User className="w-3.5 h-3.5 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <div className="bg-muted rounded-2xl px-3 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleChat();
                            }}
                            className="flex gap-2 pt-3 border-t mt-2"
                        >
                            <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={`Ask about ${dish.name}...`}
                                className="flex-1 text-sm"
                                disabled={chatLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={chatLoading || !chatInput.trim()}
                                className="h-9 w-9"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </form>
                    </div>
                )}

                {/* ─── Retrain / Improve Panel ─── */}
                {activeTab === "retrain" && (
                    <div className="space-y-4">
                        {/* Auto-populated summary */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Dish
                                </span>
                                <span className="font-medium">
                                    {dish.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Ingredients
                                </span>
                                <span className="font-medium text-right max-w-[60%]">
                                    {dish.ingredients.slice(0, 4).join(", ")}
                                    {dish.ingredients.length > 4 && "..."}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Reviews
                                </span>
                                <span className="font-medium">
                                    {reviewsLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin inline" />
                                    ) : (
                                        reviews.length
                                    )}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-md p-2 text-center">
                                    <p className="text-lg font-bold text-orange-600">
                                        {avgTaste ? `${avgTaste}/5` : "N/A"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Taste
                                    </p>
                                </div>
                                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-md p-2 text-center">
                                    <p className="text-lg font-bold text-cyan-600">
                                        {avgTexture ? `${avgTexture}/5` : "N/A"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Texture
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleRetrain}
                            disabled={retrainLoading || reviewsLoading}
                            className="w-full"
                        >
                            {retrainLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />{" "}
                                    Generate Improvements
                                </>
                            )}
                        </Button>

                        {/* Results */}
                        {retrainResult && (
                            <div className="space-y-3 text-sm">
                                {!!retrainResult.overallStrategy && (
                                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                        <p className="font-semibold text-primary mb-1">
                                            Strategy
                                        </p>
                                        <p>
                                            {String(retrainResult.overallStrategy)}
                                        </p>
                                    </div>
                                )}
                                {Array.isArray(
                                    (retrainResult as Record<string, unknown>)
                                        .tasteImprovements
                                ) && (
                                        <div>
                                            <p className="font-semibold mb-1">
                                                🍽️ Taste Improvements
                                            </p>
                                            <ul className="space-y-1">
                                                {(
                                                    (
                                                        retrainResult as Record<
                                                            string,
                                                            unknown
                                                        >
                                                    ).tasteImprovements as string[]
                                                ).map(
                                                    (t: string, i: number) => (
                                                        <li key={i}>• {t}</li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                {Array.isArray(
                                    (retrainResult as Record<string, unknown>)
                                        .textureImprovements
                                ) && (
                                        <div>
                                            <p className="font-semibold mb-1">
                                                🧱 Texture Improvements
                                            </p>
                                            <ul className="space-y-1">
                                                {(
                                                    (
                                                        retrainResult as Record<
                                                            string,
                                                            unknown
                                                        >
                                                    )
                                                        .textureImprovements as string[]
                                                ).map(
                                                    (t: string, i: number) => (
                                                        <li key={i}>• {t}</li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                <div className="flex gap-3">
                                    {(retrainResult as Record<string, unknown>)
                                        .predictedTasteScore !== undefined && (
                                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 flex-1 text-center">
                                                <p className="text-xl font-bold text-orange-600">
                                                    {String(
                                                        (
                                                            retrainResult as Record<
                                                                string,
                                                                unknown
                                                            >
                                                        ).predictedTasteScore
                                                    )}
                                                    /10
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Predicted Taste
                                                </p>
                                            </div>
                                        )}
                                    {(retrainResult as Record<string, unknown>)
                                        .predictedTextureScore !==
                                        undefined && (
                                            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2 flex-1 text-center">
                                                <p className="text-xl font-bold text-cyan-600">
                                                    {String(
                                                        (
                                                            retrainResult as Record<
                                                                string,
                                                                unknown
                                                            >
                                                        ).predictedTextureScore
                                                    )}
                                                    /10
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Predicted Texture
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {!retrainResult && !retrainLoading && (
                            <div className="text-center py-6 text-muted-foreground">
                                <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                    Click &quot;Generate Improvements&quot; to
                                    get AI suggestions based on{" "}
                                    {reviews.length > 0
                                        ? `${reviews.length} review${reviews.length > 1 ? "s" : ""}`
                                        : "dish data"}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
