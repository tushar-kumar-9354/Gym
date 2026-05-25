Netlify deploy notes

1) Netlify reads `netlify.toml` at the repo root. The build is configured to:

   command: `cd gym-progress && npm install && npm run build`
   publish: `gym-progress/.next`

2) Required environment variables (set in Netlify Site -> Site settings -> Build & deploy -> Environment):

- `NODE_ENV=production`
- `SMTP_SERVICE` (e.g. `gmail`)
- `SMTP_USER` (SMTP email address)
- `SMTP_PASS` (app password or SMTP password)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (if you use Supabase features)

3) Before first deploy, add the env vars above in Netlify. If SMTP is not configured, the app falls back to logging OTPs to the server console.

4) Troubleshooting:
- If the Netlify build fails due to Next.js version incompatibility with the Netlify Next plugin, try deploying on Vercel or pin a compatible plugin version.
