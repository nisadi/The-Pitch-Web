const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error("Could not read .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  // Query table columns using a dynamic postgres function or checking properties on a mock select
  // A simple way in supabase is to select a single row (or limit 0) and look at the keys of the object
  console.log("\n--- Checking Table Columns ---");
  
  const { data: sports } = await supabase.from('sports').select('*').limit(1);
  if (sports && sports.length > 0) {
    console.log("sports columns:", Object.keys(sports[0]));
  } else {
    console.log("sports table is empty");
  }

  const { data: locations } = await supabase.from('locations').select('*').limit(1);
  if (locations && locations.length > 0) {
    console.log("locations columns:", Object.keys(locations[0]));
  } else {
    console.log("locations table is empty");
  }

  // If gallery is empty, we can't see the columns this way.
  // But we can try to query information_schema if the user's API role has access.
  // Actually, we can run an RPC or raw SQL if we have a direct client, but we don't.
  // Let's see if we can guess from what gets fetched or what error we get if we select a non-existent column.
  // Let's try selecting 'src' vs 'image_url' from gallery
  const { error: srcErr } = await supabase.from('gallery').select('src').limit(1);
  const { error: urlErr } = await supabase.from('gallery').select('image_url').limit(1);
  console.log("gallery has 'src'?:", !srcErr);
  console.log("gallery has 'image_url'?:", !urlErr);
}

runTest();
