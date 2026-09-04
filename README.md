# Force Against Something

Force Against Something is a curated directory that helps people turn concern about an issue into concrete action. It brings verified petitions, lawsuits, and campaigns into one focused place, with context about the organization behind each effort and a direct path to participate.

## What it includes

- Browse actions by issue and filter them by petition, lawsuit, or campaign
- View action details and verified organization profiles
- Create an account and bookmark actions
- Submit an action for review
- Manage organization information
- Review and publish submissions through an admin workflow

## Tech stack

- [Next.js](https://nextjs.org/) and React
- TypeScript and Tailwind CSS
- PostgreSQL with Drizzle ORM and the Neon serverless driver
- Better Auth for email-and-password accounts
- Vercel Analytics

## Local development

This project requires Node.js 22.13 or newer and a PostgreSQL database.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide database, authentication, and admin settings:

   ```bash
   cp .env.example .env.local
   ```

3. Apply the database migrations:

   ```bash
   npm run db:migrate
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm start` — run the production build
- `npm run lint` — lint the project
- `npm run db:generate` — generate a Drizzle migration from schema changes
- `npm run db:migrate` — apply pending database migrations
- `npm run auth:generate` — regenerate the Better Auth database schema
