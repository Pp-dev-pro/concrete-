# Concrete Strength Studio

A modern, responsive frontend for predicting concrete compressive strength with two Zoho Catalyst QuickML endpoints. Includes a splash screen, animated parameter cards, prediction comparison, and a results/analysis view.

## Requirements
- Node.js 18+
- Zoho Catalyst QuickML endpoint keys and a valid Zoho OAuth access token

## Run locally
1. Unzip the project.
2. Copy `.env.example` to `.env`.
3. Add your real credentials to `.env`. **Do not paste API keys into `public/app.js` or commit `.env`.**
4. Run `npm start`
5. Open http://localhost:3000

No npm dependencies are required.

## Model endpoint setup
The server sends the request body in this format:
```json
{
  "data": {
    "Cement (component 1)(kg in a m^3 mixture)": 475,
    "Blast Furnace Slag (component 2)(kg in a m^3 mixture)": 0,
    "Fly Ash (component 3)(kg in a m^3 mixture)": 59,
    "Water  (component 4)(kg in a m^3 mixture)": 142,
    "Superplasticizer (component 5)(kg in a m^3 mixture)": 1.9,
    "Coarse Aggregate  (component 6)(kg in a m^3 mixture)": 1098,
    "Fine Aggregate (component 7)(kg in a m^3 mixture)": 641,
    "Age (day)": 28
  }
}
```
The server calls the same URL twice, once with `XGBOOST_ENDPOINT_KEY` and once with `NEXT_REGRESSION_ENDPOINT_KEY`, then compares the returned `result` values. If your second endpoint is not a regression model, rename its display label in `public/app.js`.

## Important security notes
- The keys in your message should be considered exposed. Rotate/regenerate them in Zoho before deploying.
- The browser never receives endpoint keys or the OAuth token; calls are proxied through `server.js`.
- The server uses environment variables. Do not expose `.env` or deploy the project with real credentials in source control.
- This is a frontend/API integration starter, not a validated engineering design tool. Confirm predictions and model suitability before using results for structural decisions.
