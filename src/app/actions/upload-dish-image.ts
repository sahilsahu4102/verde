'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function uploadDishImageAction(formData: FormData): Promise<{ url: string | null; error: string | null }> {
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
        return { url: null, error: 'Missing file or userId' };
    }

    // Generate a unique filename: userId/timestamp-originalname
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseAdmin.storage
        .from('dish-images')
        .upload(fileName, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading dish image:', error);
        return { url: null, error: error.message };
    }

    const { data: publicData } = supabaseAdmin.storage
        .from('dish-images')
        .getPublicUrl(fileName);

    return { url: publicData.publicUrl, error: null };
}
