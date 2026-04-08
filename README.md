# AI Nutrients Checker

India-first AI nutrition tracking MVP built with React, Supabase, and Gemini.

## Architecture

- `client`: React + Vite single-page app
- `supabase/migrations`: Postgres schema and RLS policies
- `supabase/functions/analyze-meal`: Gemini-powered meal analysis function

## Core Features

- Google sign-in through Supabase Auth
- Personalized profile onboarding and daily targets
- Meal logging by text and optional photo upload to Supabase Storage
- Gemini-based meal parsing with editable review before save
- Daily nutrient gap feedback and 90-day history

## Quick Start

1. Install dependencies:
   - `npm install`
2. Copy the client env file:
   - `client/.env.example` -> `client/.env`
3. Create a Supabase project and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Apply the SQL in `supabase/migrations`
5. Deploy the Supabase Edge Function in `supabase/functions/analyze-meal`
6. Set the function secret:
   - `GEMINI_API_KEY`
7. Start the frontend:
   - `npm run dev`

## Supabase Setup Notes

- Enable Google OAuth in Supabase Auth and configure the redirect URL to your frontend origin.
- Create the `meal-photos` bucket using the provided migration.
- The edge function falls back to a deterministic parser if `GEMINI_API_KEY` is not configured, so local UI work can continue before AI wiring is finished.

## Wellness Disclaimer

This app provides informational nutrition estimates and meal guidance. It is not a diagnostic or medical device.
