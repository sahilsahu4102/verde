/**
 * Seed script — previously used to insert hardcoded menu data into Supabase.
 *
 * NOTE: menuData has been removed from src/lib/data.ts since dishes are now
 * managed entirely through the application UI and stored directly in Supabase.
 * To add dishes, log into the app and use the "Add Item" button on the dashboard.
 *
 * This file is kept for reference. No action is needed.
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log('ℹ️  This seed script is no longer needed.');
    console.log('   Dishes are managed through the app UI at the dashboard.');
    console.log('   Log in and use the "Add Item" button to create dishes.');
}

seed().catch(console.error);

