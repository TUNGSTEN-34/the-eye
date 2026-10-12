# The Eye — Analyst

A responsive, dark-blue public-information website with live World Bank indicators, recent news discovery, learning resources, public articles, and an editorial submission workflow.

## Run locally

Open `index.html` in a browser for the static UI. The Supabase-backed article submission, published-article list, and admin dashboard require the site to be hosted and configured.

## Live data and news

- **World Bank Indicators API** supplies Uganda's latest available observations for GDP growth, inflation, population, and employment in agriculture. Each metric shows the observation year and links to its source.
- **GDELT DOC 2.0** powers `api/news.js`, a Vercel serverless endpoint for recent news discovery. News results are external reports, not independently fact-checked by The Eye.

No API key is required for those public data/news sources.

## Article submissions and editorial dashboard

Article submissions are designed to be stored in Supabase, not in browser memory.

1. Create a Supabase project at https://supabase.com/dashboard.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In `supabase-config.js`, replace `https://YOUR_PROJECT.supabase.co` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with your Supabase project URL and public publishable/anon key.
4. Create the administrator account in Supabase Authentication (Dashboard → Authentication → Users). Use a strong, unique password.
5. Promote only your own account to admin by running this SQL in the Supabase SQL Editor, replacing the email with the exact admin email:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR-ADMIN-EMAIL');
   ```
6. Deploy the repository to Vercel. Visit `/admin.html` and sign in with that account.

Visitors create a subscriber account or sign in from the homepage before submitting. The article form inserts submissions with the signed-in subscriber ID and `status = 'pending'`. Row Level Security prevents anonymous visitors from submitting articles, and prevents subscribers from reading pending/rejected submissions or managing articles. The dashboard checks the signed-in user's profile role and only permits users whose role is `admin` to use editorial controls. Editors can edit submissions, approve, reject, return to review, publish, or delete them. The public Articles section queries only `status = 'published'`. The homepage includes bulletin cards for Uganda, world news, politics, business, education, agriculture, technology, health, sports, society and analysis. Bulletin cards filter the currently loaded news-discovery results; they do not claim to be complete topic-specific feeds.

### Security notes

- The browser config uses only the Supabase public publishable/anon key; this key is designed for public clients when Row Level Security is correctly configured.
- **Never place a Supabase service-role key in browser code or commit it to GitHub.**
- Keep the admin account credentials private. Do not promote ordinary contributor accounts to admin.
- Authenticated subscriber submissions can still attract spam; before a high-traffic launch, add CAPTCHA/rate limiting and moderation alerts.
- This implementation stores the submitted title, topic, summary/article text, author name, and contact email. Tell contributors how their contact information is used.

## Deployment

The repository is `TUNGSTEN-34/the-eye`. If Vercel is connected to its `main` branch, GitHub commits should trigger deployment automatically. Confirm the latest deployment in Vercel after configuration. The News endpoint needs Vercel's serverless runtime; opening the HTML as a local file will not make `/api/news` available.

## Editorial transparency

- World Bank figures show their source observation year and may lag the current year.
- GDELT results are discovery links, not verified claims.
- Only editor-published articles are displayed in the public Articles section.
- If Supabase has not been configured, article submissions are not silently saved; the page displays a setup/unavailable message.
