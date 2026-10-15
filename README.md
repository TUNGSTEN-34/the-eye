# The Eye Solar — Solar Machine Platform

A dark navy and solar-gold catalogue prototype for solar equipment, with browser-only demo accounts and machine assignment workflows.

## Live website

- Production domain: https://the-eye-phi.vercel.app/
- GitHub repository: https://github.com/TUNGSTEN-34/the-eye

## Current pages

- `index.html` — short solar-themed homepage and navigation
- `dashboard.html` — solar machine catalogue with search, category filters, and price sorting
- `account.html` — browser demo of assigned machines and activity history
- `join.html` — browser demo profile and automatically generated invite code
- `admin.html` — public, browser-only admin workflow preview
- `styles.css` — shared dark-blue responsive styling
- `machine-app.js` — sample inventory, demo balance, assignment and illustrative rate calculations
- `referral-app.js` — local-only demo profiles and invite codes
- `catalog-filter.js` — catalogue search, category filtering and price sorting

## Important prototype limitations

This is currently a front-end prototype, not a production-ready marketplace.

- Profiles, invite codes, balances, stock and machine assignments use the visitor's browser storage. They are not shared across devices or users.
- The admin page is not protected by server-side authentication or authorization.
- No payment is processed, no real equipment is delivered, and no real funds are held.
- Catalogue prices are sample values and must be confirmed with suppliers before being treated as offers.
- Daily-rate percentages and estimates are illustrative interface examples only. They are not guaranteed income, investment advice, or a promise that a user will be paid.
- Browser storage can be edited by the visitor and must never be used as the authority for real balances, inventory, purchases or earnings.

## Before a public launch

1. Add a trusted authentication provider and a shared server-side database.
2. Enforce user and admin roles on the server; never rely on hiding a page link.
3. Move inventory, ownership, rate calculations and audit history to server-side logic with database transactions.
4. Validate invite codes on the server and prevent reuse or forgery.
5. Define whether machines are sold, rented or used under another clearly documented arrangement.
6. Obtain appropriate legal and financial review before collecting money or presenting earnings-related terms.
7. Verify supplier pricing, product availability, image permissions and product specifications.

Never commit service-role keys, passwords, or other secrets to this repository.

## Deployment

The Vercel project `the-eye` is connected to this repository. Changes pushed to `main` should trigger a deployment; verify the latest production deployment in Vercel after each change.
