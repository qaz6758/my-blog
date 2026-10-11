// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://kupsztclcilcygstbuya.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_UZmrLV1qfM9seRqP563KsA_x4TB1C2m";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);