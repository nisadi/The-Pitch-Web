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

const statuses = [
  'unread', 'read', 'replied',
  'pending', 'Pending',
  'open', 'closed', 'Open', 'Closed',
  'active', 'resolved', 'Active', 'Resolved',
  'new', 'New', 'answered', 'Answered',
  'received', 'Received'
];

async function runTest() {
  console.log("\n--- Testing contact_messages Table Status Check Constraint ---");
  
  for (const status of statuses) {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          full_name: 'Test Full Name',
          email: 'test@example.com',
          subject: 'Facility Inquiry',
          message: 'Test message body',
          phone: '1234567890',
          location: 'General',
          reference_code: 'MSG-TEST-' + status.toUpperCase(),
          status: status,
          thread_key: 'thread-test-' + status,
          replies: [],
        }
      ])
      .select();
      
    if (error) {
      if (error.message.includes('violates check constraint')) {
        // Discard check constraint failures
      } else {
        console.log(`Failed for status "${status}" with different error: ${error.message}`);
      }
    } else {
      console.log(`🎉 SUCCESS: Status "${status}" is ALLOWED!`);
      // Clean up the test row
      await supabase.from('contact_messages').delete().eq('reference_code', 'MSG-TEST-' + status.toUpperCase());
    }
  }
}

runTest();
