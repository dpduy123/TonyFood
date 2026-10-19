This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Configure Supabase

The browser sign-in used by `/admin` needs the Supabase project URL and
publishable key. From the project root, copy the example environment file:

```bash
cp .env.example .env.local
```

In `.env.local`, replace the placeholder values for:

- `NEXT_PUBLIC_SUPABASE_URL` with the **Project URL** from Supabase Dashboard
  → **Project Settings → API**.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the project's **publishable key**
  from the API keys section. If the project only shows the legacy `anon` key,
  use that value for this variable.
- `SUPABASE_SERVICE_ROLE_KEY` with the server-side secret/service-role key.
  Keep this key private; never rename it with a `NEXT_PUBLIC_` prefix or put it
  in browser code.

Save `.env.local`, then restart the Next.js development server so it reads the
new environment variables. Do not commit `.env.local`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

If the page still reports that Supabase browser configuration is missing,
check that `.env.local` is in the `tonyfood` project root, that both
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` have
non-placeholder values, and that you restarted the development server.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# TonyFood
