// Vercel serverless function — serves Supabase config from environment variables.
// Set these in Vercel → Project → Settings → Environment Variables:
//   SUPABASE_URL       = https://<your-project>.supabase.co   (project URL, no /rest/v1)
//   SUPABASE_ANON_KEY  = sb_publishable_...                     (publishable/anon key)
// The publishable key is designed to be client-visible; this only keeps it out of
// the committed source and lets you rotate it without a code change.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_ANON_KEY || ''
  });
}
