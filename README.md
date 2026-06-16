# KIOSQ Study Cafe OS

Production-ready Next.js 15 application for operating a premium self-service study cafe in South Korea.

## Stack

- Next.js 15 App Router, React, TypeScript, Tailwind CSS, ShadCN-style UI, Framer Motion
- Prisma ORM with PostgreSQL
- Clerk authentication with Kakao and Naver OAuth providers enabled in Clerk
- Toss Payments checkout, confirmation route, and webhook route
- PostHog analytics
- Supabase PostgreSQL and Supabase Storage

## Install

```bash
npm ci
cp .env.example .env
npx prisma generate
```

## Local database

```bash
docker compose up -d postgres
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open http://localhost:3000.

## Required environment variables

Set these in `.env` locally and in Vercel for production:

```bash
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/customer
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/customer
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
```

## Production deployment

1. Create a Supabase PostgreSQL project.
2. Set `DATABASE_URL` to the Supabase pooled PostgreSQL URL.
3. Configure Clerk and enable Kakao and Naver OAuth providers.
4. Configure Toss Payments keys and webhook endpoint:
   - `https://your-domain.com/api/payments/webhook`
5. Configure Clerk webhook endpoint:
   - `https://your-domain.com/api/clerk/webhook`
6. Configure PostHog project key and host.
7. Deploy to Vercel:

```bash
npm run build
npx prisma migrate deploy
npx prisma db seed
```

## Useful commands

```bash
npm run dev
npm run build
npm run typecheck
npx prisma studio
```
