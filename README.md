# Sungmanito

Sungmanito is an app for tracking bills between multiple users to verify payment has been completed of shared bills.

Sungmanito pulls its name from the Lakota wolf god associated with hunting and tracking.

This repo contains all of the Sungmanito codebase, provided under MIT license. My only ask is that if you end up doing something cool with any derivate works that you contribute it back to the project!

## Shape of the Repo

### apps

The `apps` directory is for any websites that we populate. Currently there is only one website.

The website is stored in the `apps/website` directory. This is the whole of the Sungmanito app. It is possible this gets split out in the future to allow for separate operating domains, but for now they are a singular entity.
`apps/website` is a SvelteKit 2 application utilizing Drizzle and ArkType

### packages

Packages are Sungmanito specific things I found myself using that don't really belong in the main `apps/website` code.

Currently this is simple our Drizzle ORM config, and our [Skeleton](https://skeleton.dev) theme.

## Running locally

Sungmanito uses [Supabase](https://supabase.com) for its backend, largely because it has built in auth and storage. Sungmanito is currently hosted on Vercel and utilizes Edge Config. To run the project you will need to create a `.env` file in `apps/website` with the following keys

```
DB_URL=<DB URL FROM SUPABASE>
PUBLIC_SUPABASE_URL=<PUBLIC SUPABASE URL>
PUBLIC_SAPABASE_ANON_KEY=<SUPABASE ANON KEY>
SUPABASE_SERVICE_ROLE=<SERVICE ROLE VALUE FROM SUPABASE>
EDGE_CONFIG_TOKEN=<EDGE CONFIG TOKEN FROM VERCEL>
EDGE_CONFIG=<EDGE CONFIG URL FROM VERCEL>
PAYMENT_BUCKET_NAME=<string, can be customized a bit, but I use 'payment-proof'>
```
