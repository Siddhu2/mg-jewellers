// =============================================
// SUPABASE CONFIGURATION
// Replace these values with your Supabase project credentials
// Get them from: https://supabase.com > Project Settings > API
// =============================================

const SUPABASE_URL = 'https://sgrnrikdimyeucemhwif.supabase.co';        // e.g. https://abcxyz.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncm5yaWtkaW15ZXVjZW1od2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTE4OTUsImV4cCI6MjA5MDI4Nzg5NX0.R2H4zKqVP4AFN4r4AW3g1qrqPlrQKkwUxeiFla9qn_o'; // Public anon key

// Jewellery categories configuration
const CATEGORIES = [
  { id: 'rings',              label: 'Rings',                 icon: '💍', description: 'Elegant rings for every occasion' },
  { id: 'earrings',           label: 'Earrings',              icon: '✨', description: 'Beautiful earrings to complement your style' },
  { id: 'pendants',           label: 'Pendants',              icon: '🔮', description: 'Exquisite pendants with timeless appeal' },
  { id: 'necklaces',          label: 'Necklaces',             icon: '📿', description: 'Stunning necklaces for a graceful look' },
  { id: 'bangles-bracelets',  label: 'Bangles & Bracelets',   icon: '🌟', description: 'Charming bangles and bracelets' },
  { id: 'chains',             label: 'Chains',                icon: '⛓️', description: 'Fine chains in various styles' },
  { id: 'nosepins',           label: 'Nosepins',              icon: '🌸', description: 'Delicate nosepins and nose rings' },
  { id: 'special-ornaments',  label: 'Special Ornaments',     icon: '👑', description: 'Unique and special ornament pieces' },
];

// Initialize Supabase client
// Use a different variable name to avoid clash with window.supabase from CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
