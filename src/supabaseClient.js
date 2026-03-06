import { createClient } from '@supabase/supabase-js'

// Replace these with the URL and Anon Key from Step 2
const supabaseUrl = 'https://gwyvqioqhazcjnbzvskh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXZxaW9xaGF6Y2puYnp2c2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTQzNDUsImV4cCI6MjA4ODM5MDM0NX0.nYqAaGGIZbVE0jIXqk3pyI46f1QQ2sxCQYr8O5HECOE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
