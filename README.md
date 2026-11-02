# Latars

Latars is a product studio. Projects:

- **Neighbourly** ([neighbourly.ng](https://neighbourly.ng)): an AI guide and business directory for Redemption Camp.
- **Bak Network** ([baknetwork.com](https://baknetwork.com)): a community for the people behind the scenes in the creator economy.
- **Event Connect** ([events.latars.xyz](https://events.latars.xyz)): meet the right people at events like Moonshot by TechCabal.
- **AdsSim** ([ads.latars.xyz](https://ads.latars.xyz)): an ad-buying flight simulator for practising campaigns on Meta, TikTok, Google, X and ChatGPT ads without spending money.

The site is plain static files, served by a small dependency-free Node server (`server.js`) that also forwards the admin to the events app (see **Admin** below). Deployed on Railway with `npm start`. To preview locally:

```sh
npm start   # http://localhost:8000
npm test
```

- `index.html`: page content
- `styles.css`: layout and theme
- `script.js`: reactive wordmark, cursor, hover previews, WAT clock
- `assets/`: preview screenshots of each project, shown on hover
- `server.js`: serves the files above (only those) and forwards the admin paths (`/adminx`, `/admin`, and the app's `/_next`, `/api` and photo paths) to the events app, so **`latars.xyz/adminx` is the one link to every admin** and the address stays on latars.xyz. `ADMIN_UPSTREAM` sets where the admin runs (default `https://events.latars.xyz`).

## Admin

`latars.xyz/adminx` shows the admin sign-in and, once signed in, Event Connect and AdsSim in one place. Sign in with the admin key there. (Admin accounts that sign in by email do so at `events.latars.xyz/adminx`, because that login's cookie belongs to that address.) Nothing else on the events app is reachable through `latars.xyz`.

On Railway this service must run `npm start` (Node); the folder no longer needs a static-site setting.
