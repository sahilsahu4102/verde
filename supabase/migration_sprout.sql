-- ============================================
-- Migration: Sprout Integration Tables
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Cafe Profiles (public restaurant info visible to Sprout users)
CREATE TABLE IF NOT EXISTS cafe_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  logo_url TEXT,
  banner_url TEXT,
  address TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours TEXT DEFAULT '09:00',
  closing_hours TEXT DEFAULT '22:00',
  accepting_delivery BOOLEAN DEFAULT true,
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Orders (placed by Sprout consumers)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafe_profiles(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumer_name TEXT NOT NULL DEFAULT 'Guest',
  consumer_address TEXT DEFAULT '',
  consumer_phone TEXT DEFAULT '',
  special_instructions TEXT DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Order Items (line items for each order)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id TEXT REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Reservations (table bookings from Sprout users)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafe_profiles(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumer_name TEXT NOT NULL DEFAULT 'Guest',
  consumer_phone TEXT DEFAULT '',
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Reviews (consumer ratings/feedback)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafe_profiles(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumer_name TEXT NOT NULL DEFAULT 'Anonymous',
  dish_id TEXT REFERENCES dishes(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT '',
  owner_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE cafe_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: cafe_profiles
-- ============================================
-- Owners can manage their own profile
CREATE POLICY "Owners can view own profile" ON cafe_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Owners can insert own profile" ON cafe_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Owners can update own profile" ON cafe_profiles FOR UPDATE USING (auth.uid() = id);
-- Sprout users can read all cafe profiles (public)
CREATE POLICY "Anyone can view cafe profiles" ON cafe_profiles FOR SELECT USING (true);

-- ============================================
-- RLS Policies: orders
-- ============================================
-- Cafe owners can view orders for their cafe
CREATE POLICY "Cafe owners can view their orders" ON orders FOR SELECT USING (auth.uid() = cafe_id);
-- Cafe owners can update order status
CREATE POLICY "Cafe owners can update their orders" ON orders FOR UPDATE USING (auth.uid() = cafe_id);
-- Consumers can insert orders
CREATE POLICY "Consumers can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = consumer_id);
-- Consumers can view their own orders
CREATE POLICY "Consumers can view own orders" ON orders FOR SELECT USING (auth.uid() = consumer_id);

-- ============================================
-- RLS Policies: order_items
-- ============================================
CREATE POLICY "Order items visible to order participants" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.cafe_id = auth.uid() OR orders.consumer_id = auth.uid()))
);
CREATE POLICY "Consumers can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.consumer_id = auth.uid())
);

-- ============================================
-- RLS Policies: reservations
-- ============================================
CREATE POLICY "Cafe owners can view their reservations" ON reservations FOR SELECT USING (auth.uid() = cafe_id);
CREATE POLICY "Cafe owners can update their reservations" ON reservations FOR UPDATE USING (auth.uid() = cafe_id);
CREATE POLICY "Consumers can insert reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Consumers can view own reservations" ON reservations FOR SELECT USING (auth.uid() = consumer_id);

-- ============================================
-- RLS Policies: reviews
-- ============================================
CREATE POLICY "Cafe owners can view their reviews" ON reviews FOR SELECT USING (auth.uid() = cafe_id);
CREATE POLICY "Cafe owners can reply to reviews" ON reviews FOR UPDATE USING (auth.uid() = cafe_id);
CREATE POLICY "Consumers can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Consumers can view own reviews" ON reviews FOR SELECT USING (auth.uid() = consumer_id);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_cafe_id ON orders(cafe_id);
CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON orders(consumer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_cafe_id ON reservations(cafe_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reviews_cafe_id ON reviews(cafe_id);
CREATE INDEX IF NOT EXISTS idx_reviews_consumer_id ON reviews(consumer_id);
