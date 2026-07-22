const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const defaultMaterials = [
  { material_name: 'Cement', default_unit: 'Bags' },
  { material_name: 'Steel', default_unit: 'Kg' },
  { material_name: 'Sand', default_unit: 'Brass' },
  { material_name: 'Aggregate', default_unit: 'Brass' },
  { material_name: 'Bricks', default_unit: 'Nos' },
  { material_name: 'Paint', default_unit: 'Cans' },
  { material_name: 'Tiles', default_unit: 'Boxes' },
  { material_name: 'Pipes', default_unit: 'Pieces' },
  { material_name: 'Electrical', default_unit: 'Pieces' },
  { material_name: 'Plumbing', default_unit: 'Pieces' }
];

async function seed() {
  const { error } = await supabase.from('materials').insert(defaultMaterials);
  if (error) {
    console.error('Error seeding materials:', error);
  } else {
    console.log('Successfully seeded materials');
  }
}

seed();
