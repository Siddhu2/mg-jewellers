// =============================================
// SUPABASE CONFIGURATION
// Replace these values with your Supabase project credentials
// Get them from: https://supabase.com > Project Settings > API
// =============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';        // e.g. https://abcxyz.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Public anon key

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
