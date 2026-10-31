# Homey
1. **Supabase:** create a free project → SQL Editor → paste and run `schema.sql`. Then Authentication → Providers → Email → turn OFF "Confirm email" (easier for demos).
2. **Env:** copy `.env.example` to `.env`, fill in Project URL and anon key (Project Settings → API).
3. **Run locally:** `npm install && npm run dev`
4. **Deploy:** push to GitHub → import in Vercel (Framework: Vite) → add the same two env vars → Deploy. Netlify: build `npm run build`, publish `dist`, same env vars.
