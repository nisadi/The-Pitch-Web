const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = '';
let serviceRoleKey = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error("Could not read .env.local file");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not configured!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function runTest() {
  console.log("\n--- Testing event_inquiries Table Insert with Admin Bypass (service_role) ---");
  const { data, error } = await supabaseAdmin
    .from('event_inquiries')
    .insert([
      {
        organization_name: 'Test Admin Bypass Org',
        contact_person: 'Admin Bypass Person',
        email: 'admin_bypass@example.com',
        phone: '1234567890',
        event_category: 'Corporate Team Building',
        guest_count: 100,
        preferred_date: '2026-07-01',
        requirements: 'Testing admin bypass capability'
      }
    ])
    .select();

  if (error) {
    console.error("Error inserting inquiry with Admin bypass:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS! Inquiry inserted under admin bypass:", data);
    // Cleanup
    await supabaseAdmin.from('event_inquiries').delete().eq('email', 'admin_bypass@example.com');
    console.log("Cleanup complete!");
  }
}

runTest();
