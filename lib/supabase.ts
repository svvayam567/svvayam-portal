import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://sanfgppsurbfjkiasctg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbmZncHBzdXJiZmpraWFzY3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTk4NzEsImV4cCI6MjA5MzA5NTg3MX0.wzQIJ-FJwzUqiMFPmz6lHIfkHjk1DRIj-v7DqWcQL4M"
);

export default supabase;