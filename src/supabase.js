// ===== SUPABASE CLIENT =====
// Replace these with your Supabase project credentials
// Get them from: https://supabase.com/dashboard → Project Settings → API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://gwyvqioqhazcjnbzvskh.supabase.co';        // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXZxaW9xaGF6Y2puYnp2c2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTQzNDUsImV4cCI6MjA4ODM5MDM0NX0.nYqAaGGIZbVE0jIXqk3pyI46f1QQ2sxCQYr8O5HECOE'; // e.g. eyJhbGciOiJIUzI1NiIs...

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
