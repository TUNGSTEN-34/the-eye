# Analyst — Elvis's Personal Website

A dark-blue personal website and learning/project portal.

## Live site

https://analyst-tungsten-34.vercel.app/

## Pages

- `index.html` — homepage
- `about.html` — about page
- `dashboard.html` — projects and live-data concepts
- `news.html` — learning/news page
- `resources.html` — resources
- `account.html` — UGX account-ledger simulation
- `admin.html` — admin-workflow prototype

## UGX ledger prototype: important limitations

The account and admin pages are **demo simulations only**. They use browser `localStorage`, so entries stay in the current browser and are not shared between visitors or devices. The admin demo page is publicly accessible and is not protected by real authentication or server-side authorization.

- No real deposits are accepted.
- No real funds are held.
- Withdrawal actions only update the simulated balance; they do not send money.
- Do not enter real personal or financial information.

## Before launching real accounts or payments

A production version needs a server-side database, a trusted authentication provider, server-enforced user/admin roles, server-side balance and transaction validation, an audit trail, and a legitimate payment provider. Never rely on hidden links, client-side code, or browser storage for financial security.

## Deploy

This site is intended to be hosted on Vercel from this GitHub repository. If the repository is connected to the Vercel project, commits to `main` can trigger production deployments. Check the Vercel deployment status after pushing changes.

## Backend setup (next development stage)

The `supabase/` folder contains a reviewed starting schema and setup notes for server-side accounts, user/admin roles, UGX ledger entries, and withdrawal requests:

- [Supabase setup guide](supabase/README.md)
- [Database schema](supabase/schema.sql)

These files are not yet connected to the live website. The current account and admin pages are still browser-only simulations. Create a Supabase project and run the SQL in its SQL Editor before wiring up real authentication. Never commit service-role keys or database passwords.
