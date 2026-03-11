import { NextRequest, NextResponse } from "next/server";
import { feedbackReformulationFlow } from "@/ai/flows/feedback-reformulation";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await feedbackReformulationFlow(body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Feedback reformulation error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
