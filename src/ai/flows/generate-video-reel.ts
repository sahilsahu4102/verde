'use server';

import { z } from 'genkit';
import { fal } from '@fal-ai/client';

const FAL_MODEL = 'fal-ai/kling-video/v1.5/pro/text-to-video';

const GenerateVideoReelInputSchema = z.object({
  dishName: z.string().describe('The name of the plant-based dish.'),
  imageUrl: z.string().optional().describe('URL of the dish image for image-to-video generation.'),
  caption: z.string().optional().describe('Marketing caption to guide the video generation.'),
  customInstructions: z.string().optional().describe('Custom instructions from the owner to customize the reel.'),
});
export type GenerateVideoReelInput = z.infer<typeof GenerateVideoReelInputSchema>;

// --- Submit: starts generation, returns request_id immediately ---
export async function submitVideoReel(
  input: GenerateVideoReelInput
): Promise<{ requestId: string } | { error: string }> {
  if (!process.env.FAL_KEY) {
    return { error: 'API Key is missing. Please set FAL_KEY in your environment secrets.' };
  }

  try {
    const { dishName, caption, customInstructions } = input;

    let prompt = `Create a hyper-realistic, cinematic vertical video (9:16) optimized for Instagram Reels, with a natural, documentary-style aesthetic, featuring ${dishName}.

Opening (0–2s):
Abstract layers forming — soft liquid textures, particles, or flowing ingredients subtly coming together. Minimal, aesthetic, shallow depth of field, natural light. Smooth, intriguing motion.

Transition (2–5s):
Seamless morph into real food preparation. Close-ups of hands pouring, mixing, frothing, or shaping food. Emphasize real texture, steam, softness, melt. No exaggerated motion.

Cinematic Core (5–8s):
Inside a small café or kitchen. Barista or baker working naturally. Warm lighting, handheld cinematic camera, film-like grain, authentic movement.

Final Beat (8–10s):
Genuine human reaction — a bite, smile, or satisfied nod. Calm, confident ending frame. No loud branding.

Overall tone: authentic, premium, modern, emotional realism.
Avoid: cartoon visuals, over-saturation, artificial motion, obvious AI artifacts.`;

    if (caption) {
      prompt += `\n\nContext/Vibe: ${caption}`;
    }
    if (customInstructions) {
      prompt += `\n\nOwner's specific instructions: ${customInstructions}`;
    }

    console.log(`[Reel] Submitting video generation for "${dishName}" to queue...`);

    const { request_id } = await fal.queue.submit(FAL_MODEL, {
      input: {
        prompt,
        duration: '10',
        aspect_ratio: '9:16',
      },
    });

    console.log(`[Reel] ✅ Queued with request_id: ${request_id}`);
    return { requestId: request_id };
  } catch (error: any) {
    console.error('[Reel] ❌ Submit error:', error.message);
    return { error: error.message || 'Unknown error submitting video generation' };
  }
}

// --- Poll status: called from the client every few seconds ---
export async function checkVideoReelStatus(
  requestId: string
): Promise<{
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED';
  queuePosition?: number;
  videoUrl?: string;
  error?: string;
}> {
  try {
    const status = await fal.queue.status(FAL_MODEL, {
      requestId,
      logs: true,
    });

    console.log(`[Reel] Status for ${requestId}: ${status.status}`);

    if (status.status === 'COMPLETED') {
      // Fetch the result
      const result: any = await fal.queue.result(FAL_MODEL, { requestId });

      if (result.data?.video?.url) {
        return { status: 'COMPLETED', videoUrl: result.data.video.url };
      } else if (result.video?.url) {
        return { status: 'COMPLETED', videoUrl: result.video.url };
      }

      console.error('[Reel] ❌ Completed but no video URL:', JSON.stringify(result, null, 2));
      return { status: 'COMPLETED', error: 'Video generation completed but no URL was returned.' };
    }

    return {
      status: status.status as 'IN_QUEUE' | 'IN_PROGRESS',
      queuePosition: (status as any).queue_position,
    };
  } catch (error: any) {
    console.error('[Reel] ❌ Status check error:', error.message);
    return { status: 'COMPLETED', error: error.message || 'Error checking video status' };
  }
}
