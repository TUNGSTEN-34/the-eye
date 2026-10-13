# Supabase setup for Analyst

This folder is the backend foundation for adding separate accounts and server-side ledger records to the static Analyst site.

## Current status

The live website is still a static website and its existing account/admin pages remain browser-only demos. Adding this SQL file to GitHub does **not** connect the website to a database and does not create real authentication or payments.

## 1. Create a Supabase project

1. Sign in to Supabase and create a new project for Analyst.
2. Save the database password privately. Do not commit it to GitHub or share it in chat.
3. In the Supabase dashboard, open **SQL Editor**.
4. Review and run `schema.sql` in the new project's SQL Editor.
5. In **Authentication → URL Configuration**, add your Vercel production URL as the site URL and add the account page and any future auth callback URL to the allowed redirect URLs.

## 2. Create the first administrator safely

1. Register your own account through Supabase Auth after a real signup page has been connected.
2. In Supabase **SQL Editor**, look up your account's UUID in `auth.users`.
3. Run this statement using your real UUID after checking it carefully:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'YOUR-AUTH-USER-UUID';
   ```

Do not make a public signup form accept a role value. The schema intentionally does not allow users to update their own role.

## 3. Configure the website

The frontend will need the Supabase project URL and the **publishable/anon key**. Those are intended for browser use when Row Level Security is correctly configured. Never put a database password, service-role key, or secret API key in browser code, GitHub, or a public environment variable.

Before wiring the website, configure the project URL/key in Vercel environment variables and then add a small frontend integration. The current static account pages do not yet use Supabase.

## 4. What the schema provides

- A profile and UGX account record for new Auth users.
- Row Level Security so users can read only their own account, ledger, and withdrawal requests, while authorized admins can review records.
- Server-side functions for admin balance adjustments, withdrawal requests, and admin review.
- Positive whole-number UGX validation and checks that pending/approved withdrawal amounts are reserved from the available balance.

## 5. Before any real-money launch

This is a starting database schema, not a payment system or a compliance review. Test it in a separate project first. Review the SQL, test Row Level Security with separate user/admin accounts, add monitoring and audit procedures, and integrate a legitimate payment provider before representing any withdrawal as paid. The `paid` status must only be set after a real payment has been verified outside this database function.

Never promise returns, accept deposits, or show simulated funds as real funds. Do not store payment card details or banking credentials in this application.
