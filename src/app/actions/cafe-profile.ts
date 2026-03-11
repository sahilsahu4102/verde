'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

type CreateCafeProfileData = {
    userId: string;
    restaurant_name: string;
    description: string;
    address: string;
    image_url: string | null;
    phone: string;
    opening_hours: string;
    closing_hours: string;
    latitude?: number;
    longitude?: number;
};

export async function createCafeProfileAction(data: CreateCafeProfileData): Promise<{ error: string | null }> {
    const upsertData: Record<string, unknown> = {
        id: data.userId,
        name: data.restaurant_name,
        description: data.description,
        address: data.address,
        image_url: data.image_url,
        opening_time: data.opening_hours,
        closing_time: data.closing_hours,
        updated_at: new Date().toISOString(),
    };

    if (data.latitude !== undefined && data.longitude !== undefined) {
        upsertData.location = `SRID=4326;POINT(${data.longitude} ${data.latitude})`;
    }

    const { error } = await supabaseAdmin
        .from('cafe_profiles')
        .upsert(upsertData, { onConflict: 'id' });

    if (error) {
        console.error('Error creating cafe profile (server):', error);
        return { error: error.message };
    }
    return { error: null };
}
