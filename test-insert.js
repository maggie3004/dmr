const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSingle() {
  const { data: latestEntry, error } = await supabase
      .from('dmr_entries')
      .select('dmr_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
  console.log("Data:", latestEntry);
  console.log("Error:", error);
}

testSingle();
