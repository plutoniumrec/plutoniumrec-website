# Plutonium website

Static site for plutoniumrec.net. No build step. It runs in preview mode (preset rooms, photos and players, local-only login) until you connect it to your servers.

## Files

- `index.html`, `styles.css`, `app.js`: the site
- `config.js`: the only file to edit to connect your servers
- `assets/`: logos and images
- `functions/api/[[path]].js`: optional forwarder (see "If the browser is blocked")

## Put it online with Cloudflare Pages

1. In the Cloudflare dashboard go to Workers & Pages, then Create, then Pages.
2. Upload this folder, or connect a Git repo that contains it.
3. In the Pages project open Custom domains and add `plutoniumrec.net` (or `www.plutoniumrec.net`).

Dashboard drag-and-drop uploads do not include the `functions` folder. If you want the forwarder, deploy with Git or with the command line instead:

    npx wrangler pages deploy . --project-name plutonium

## Connect it to the servers

Do this once your friend has the servers running.

1. Open `config.js`.
2. Confirm `domain` is `plutoniumrec.net` and each value in `services` matches the subdomain your server uses (RecFlare's default is `auth`, `accounts`, and so on).
3. Fill in `endpoints.rooms`, `players`, `photos` and `me` with the service and path that return that data. Leave one as `null` to keep presets for it.
4. Under `login`, match the request your auth service expects. The site sends a standard form request to `/connect/token` with `grant_type`, `username` and `password`. If your server wants other fields (a client ID, for example), set `clientId`, `scope` or `extraFields`.
5. Set `useServer` to `true` and redeploy.

To find the right paths and fields, open RecFlare's admin panel in Chrome, press F12, open the Network tab, log in, and look at the requests it makes. Copy the addresses and the fields it sends.

The site reads common field names for rooms, players and photos (`id`, `name`, `creatorName`, `tags`, `imageUrl`, and similar). If a room or photo does not show up, look at what the server returns and tell whoever maintains `normRoom`, `normPlayer` or `normPhoto` in `app.js` which names it uses.

## If the browser is blocked

Browsers only let a site call another server when that server allows it (CORS). If login or loading fails with "Could not reach the server":

- Best fix: have the server allow `https://plutoniumrec.net` (and `https://www.plutoniumrec.net` if you use it) in its CORS settings.
- Other fix: set `useProxy: true` in `config.js`. The site then calls `/api/<service>/...` on itself and the forwarder passes it on. This needs the Git or command line deploy above. If Cloudflare returns error 1042, your servers are Workers on the same zone; use a service binding instead, or fix CORS on the server.

## What is saved where

- The login token is kept for the browser tab only and cleared on log out. Passwords are never stored.
- Cheers, likes and comments are saved in each visitor's own browser. They are not shared between people unless your server has endpoints for them, which this site does not use yet.
