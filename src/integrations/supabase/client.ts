// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gjwuabvhfsqxodgwbjdp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqd3VhYnZoZnNxeG9kZ3diamRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTgwMzQsImV4cCI6MjA2MDQ5NDAzNH0.5dGNinLkFKo-wZw6Vzef0JxHC85cMAfOSuen-Fi9Xo0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);