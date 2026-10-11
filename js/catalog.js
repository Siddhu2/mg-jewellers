// Database-backed product categories and optional subcategories.
// Loaded after config.js, which provides the Supabase client and legacy CATEGORIES array.
var SUBCATEGORIES = [];

async function loadCatalogTaxonomy() {
  const [categoryResult, subcategoryResult] = await Promise.all([
    supabaseClient.from('categories').select('*').order('sort_order').order('label'),
    supabaseClient.from('subcategories').select('*').order('sort_order').order('label'),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (subcategoryResult.error) throw subcategoryResult.error;
  CATEGORIES.splice(0, CATEGORIES.length, ...(categoryResult.data || []));
  SUBCATEGORIES.splice(0, SUBCATEGORIES.length, ...(subcategoryResult.data || []));
  return CATEGORIES;
}
