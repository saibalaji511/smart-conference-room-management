// ===== SUPABASE CLIENT =====
// Replace these with your Supabase project credentials
// Get them from: https://supabase.com/dashboard → Project Settings → API

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://lazdmxmwbxvytbenscne.supabase.co';        // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemRteG13Ynh2eXRiZW5zY25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTE5NTUsImV4cCI6MjA4ODM4Nzk1NX0.al6gcf1JOMMitsYsyf8IMX_6_4sRSygR0dNT2hCVxkU'; // e.g. eyJhbGciOiJIUzI1NiIs...

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
