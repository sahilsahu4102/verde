import { NextRequest, NextResponse } from "next/server";
import { ownerChatFlow } from "@/ai/flows/owner-chat";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await ownerChatFlow({
            message: body.message,
            context: body.context,
        });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Owner chat error:", error);
        return NextResponse.json(
            { reply: "Sorry, I encountered an error. Please try again.", error: error.message },
            { status: 500 }
        );
    }
}
