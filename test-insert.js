const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function promoteAdmin() {
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'Admin' })
    .eq('email', 'admin@gmail.com');
  console.log("Error:", error);
  console.log("Updated to Admin");
}

promoteAdmin();
