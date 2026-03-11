import { supabase } from './supabase';

// ─── Auth Helper ───

async function getCurrentUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
}

// ─── Types ───

export type CafeProfile = {
    id: string;
    restaurant_name: string;
    description: string;
    image_url: string | null;
    address: string;
    opening_hours: string;
    closing_hours: string;
    accepting_delivery: boolean;
    phone: string;
    created_at: string;
    updated_at: string;
};

export type Dish = {
    id: string;
    name: string;
    user_id: string;
};

export type Order = {
    id: string;
    cafe_id: string;
    user_id: string;
    status: 'placed' | 'pending' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rejected';
    subtotal: number;
    delivery_fee: number;
    total: number;
    delivery_address: string | null;
    payment_method: string | null;
    special_instructions: string | null;
    created_at: string;
    order_items?: OrderItem[];
};

export type OrderItem = {
    id: string;
    order_id: string;
    dish_id: string | null;
    dish_name: string;
    quantity: number;
    unit_price: number;
    created_at: string;
};

export type Reservation = {
    id: string;
    cafe_id: string;
    consumer_id: string;
    consumer_name: string;
    consumer_phone: string;
    reservation_date: string;
    reservation_time: string;
    guest_count: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    notes: string;
    created_at: string;
    updated_at: string;
};

export type Review = {
    id: string;
    user_id: string;
    user_name: string;
    cafe_id: string;
    dish_id: string | null;
    rating: number;
    taste_rating: number | null;
    texture_rating: number | null;
    review_text: string;
    suggestions: string;
    review_type: 'dish' | 'cafe';
    helpful_count: number;
    owner_reply: string | null;
    created_at: string;
    updated_at: string;
};

// ─── Cafe Profile CRUD ───

export async function fetchCafeProfile(): Promise<CafeProfile | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('cafe_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;
    return data as CafeProfile;
}

export async function upsertCafeProfile(
    profile: Partial<CafeProfile>,
    latitude?: number,
    longitude?: number,
    userId?: string
): Promise<{ error: string | null }> {
    const resolvedUserId = userId ?? await getCurrentUserId();
    if (!resolvedUserId) return { error: 'Not authenticated' };

    const upsertData: Record<string, unknown> = {
        id: resolvedUserId,
        ...profile,
        updated_at: new Date().toISOString(),
    };

    // If lat/lng provided, store as PostGIS geography point
    if (latitude !== undefined && longitude !== undefined) {
        upsertData.location = `POINT(${longitude} ${latitude})`;
    }

    const { error } = await supabase
        .from('cafe_profiles')
        .upsert(upsertData, { onConflict: 'id' });

    if (error) {
        console.error('Error upserting cafe profile:', error);
        return { error: error.message };
    }
    return { error: null };
}

// ─── Dishes CRUD ───

export async function fetchCafeDishes(): Promise<Dish[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('dishes')
        .select('id, name, user_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching cafe dishes:', error);
        return [];
    }
    return (data || []) as Dish[];
}

// ─── Orders CRUD ───

export async function fetchOrders(): Promise<Order[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('cafe_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return (data || []) as Order[];
}

export async function updateOrderStatus(
    orderId: string,
    status: Order['status']
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating order status:', error);
        return { error: error.message };
    }
    return { error: null };
}

// ─── Reservations CRUD ───

export async function fetchReservations(): Promise<Reservation[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('cafe_id', userId)
        .order('reservation_date', { ascending: true });

    if (error) {
        console.error('Error fetching reservations:', error);
        return [];
    }

    return (data || []) as Reservation[];
}

export async function updateReservationStatus(
    reservationId: string,
    status: Reservation['status']
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', reservationId);

    if (error) {
        console.error('Error updating reservation status:', error);
        return { error: error.message };
    }
    return { error: null };
}

// ─── Reviews CRUD ───

export async function fetchAllReviews(): Promise<Review[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return (data || []) as Review[];
}

export async function fetchCafeReviews(): Promise<Review[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', userId)
        .eq('review_type', 'cafe')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching cafe reviews:', error);
        return [];
    }

    return (data || []) as Review[];
}

export async function fetchDishReviews(dishId?: string): Promise<Review[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    let query = supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', userId)
        .eq('review_type', 'dish')
        .order('created_at', { ascending: false });

    if (dishId) {
        query = query.eq('dish_id', dishId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching dish reviews:', error);
        return [];
    }

    return (data || []) as Review[];
}

export async function replyToReview(
    reviewId: string,
    reply: string
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('reviews')
        .update({ owner_reply: reply, updated_at: new Date().toISOString() })
        .eq('id', reviewId);

    if (error) {
        console.error('Error replying to review:', error);
        return { error: error.message };
    }
    return { error: null };
}

