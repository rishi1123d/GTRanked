const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values from .env.local
const supabaseUrl = 'https://qbzwhueywwpqkucwfnsb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiendodWV5d3dwcWt1Y3dmbnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDk4MzEsImV4cCI6MjA1OTM4NTgzMX0.YiZec-9dg4z32pqCuSGGB3uyqrEZs5zm-b_unS_2czs';

console.log('Supabase URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? '✓ Found' : '✗ Missing');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Test a simple query
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Received data:', data ? `✓ Got ${data.length} records` : '✗ No data');
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

testConnection(); 