const { createClient } = require('/Users/shababtahmid/Downloads/wayfinder-app/node_modules/@supabase/supabase-js');
const supabaseUrl = 'https://fowizgcwpmllsxdllwvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvd2l6Z2N3cG1sbHN4ZGxsd3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjk5MjMsImV4cCI6MjA5MTgwNTkyM30.iBYLE5VXjsAi4hlAuBwKxEF_ipASzZGp1tfAmBGJOp4';

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const channel = supabase.channel('convoy:test1234');
channel
  .on('presence', { event: 'sync' }, () => {
    console.log('Presence sync:', channel.presenceState());
  })
  .subscribe((status, err) => {
    console.log('Subscription status changed:', status);
    if (err) {
      console.error('Subscription error:', err);
    }
    if (status === 'SUBSCRIBED') {
      console.log('Successfully connected to Realtime channel!');
      process.exit(0);
    }
  });

setTimeout(() => {
  console.log('Timed out waiting for connection.');
  process.exit(1);
}, 10000);
