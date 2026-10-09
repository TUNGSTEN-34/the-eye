# The Eye — Analyst

A responsive, dark-blue public-information website with live public indicators, recent news discovery, learning resources, and editorial transparency notes.

## Run locally

Open `index.html` in a browser. No build step or package installation is required.

## Live data

The dashboard requests the latest non-empty observations for Uganda from the public **World Bank Indicators API**:

- GDP growth: `NY.GDP.MKTP.KD.ZG`
- Consumer-price inflation: `FP.CPI.TOTL.ZG`
- Total population: `SP.POP.TOTL`
- Employment in agriculture: `SL.AGR.EMPL.ZS`

Each indicator links to its World Bank source page. The page shows the observation year returned by the source, because the latest available data can lag behind the current year. Values are not hard-coded, and a failed request is shown as unavailable.

API documentation: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

## News discovery

The News section queries the GDELT DOC 2.0 API for recent coverage mentioning Uganda or East Africa, then links directly to the original publisher. The site labels these as **external, unverified reports**: appearing in a search index is not proof that a story or claim is accurate. Editors should independently review sources before republishing or describing claims as verified.

GDELT documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

## Credentials and setup

- **No API keys or paid credentials are required** for the World Bank indicators API or the GDELT DOC API used by this static front end.
- The browser must be online, and each external service must allow the request from the visitor's browser. If a source is unavailable or blocks a request, the site shows an error/fallback instead of fabricating results.
- These calls run in the visitor's browser. A future server-side cache/proxy could improve reliability and control request volume, but it is not required for this first integration.
- The article submission form remains a local preview only. It does not send or store submissions; connect a secure backend before collecting real submissions or personal information.

## Deploy

Vercel can deploy this static site from the repository root without a build command. When the repository is connected to Vercel, commits to `main` should trigger a deployment automatically.

## Transparency and editorial safeguards

- Data is sourced from the World Bank API and includes the observation year.
- News results are discovered by GDELT and linked to the publisher; they are **not independently fact-checked** by this site.
- External headlines and publisher metadata are inserted as text rather than interpreted as HTML.
- Article submission is not operational until a secure backend is configured.
