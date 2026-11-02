# Latars

Latars is a product studio. Projects:

- **Neighbourly** ([neighbourly.ng](https://neighbourly.ng)): an AI guide and business directory for Redemption Camp.
- **Bak Network** ([baknetwork.com](https://baknetwork.com)): a community for the people behind the scenes in the creator economy.
- **Event Connect** ([events.latars.xyz](https://events.latars.xyz)): meet the right people at events like Moonshot by TechCabal.
- **AdsSim** ([ads.latars.xyz](https://ads.latars.xyz)): an ad-buying flight simulator for practising campaigns on Meta, TikTok, Google, X and ChatGPT ads without spending money.

This is a static site with no build step, deployed on Railway. To preview locally:

```sh
python3 -m http.server 8000
```

- `index.html`: page content
- `styles.css`: layout and theme
- `script.js`: reactive wordmark, cursor, hover previews, WAT clock
- `assets/`: preview screenshots of each project, shown on hover
- `adminx/index.html`: `latars.xyz/adminx`, the one link to every admin (Event Connect and AdsSim). It forwards to the admin home served by the events app at `events.latars.xyz/adminx`, which asks for the admin sign-in.
