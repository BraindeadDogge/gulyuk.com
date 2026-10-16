# Deploying gulyuk.com: Railway, Cloudflare and the domain

Goal: `https://gulyuk.com` is the one real address. `www.gulyuk.com`, `http://gulyuk.com` and
`http://www.gulyuk.com` all end up there with a single permanent redirect, and everything is served over HTTPS.

The site is a static build served by Caddy in a container (see `Dockerfile` and `Caddyfile`). Railway builds it
from this repository on every push to `main`. It needs no environment variables and no database.

## 1. Railway service

1. In the Railway dashboard create a project and choose **Deploy from GitHub repo**, then pick
   `BraindeadDogge/gulyuk.com` (Railway asks to install its GitHub app the first time).
2. Railway finds the `Dockerfile` and builds it. The first build takes a few minutes.
3. In the service, open **Settings > Networking**. If asked for a port, use the one Railway detects. The container
   listens on `$PORT`, which Railway sets itself.
4. Click **Generate Domain** once to get a `*.up.railway.app` address, and open it to check the site works.
   Keep this address: it is a handy fallback and a way to test before DNS changes.

## 2. Put the domain on Cloudflare

1. Add `gulyuk.com` to Cloudflare (**Add a domain**, Free plan is enough).
2. Cloudflare shows two nameservers. At your domain registrar, replace the current nameservers with those two.
   This can take from minutes to a day.
3. Before changing nameservers, copy any DNS records the domain currently needs (for example `MX` and `TXT`
   records for email) into Cloudflare. Cloudflare usually imports them; check the list.
4. Delete any old `A`, `AAAA` or `CNAME` records for `@` and `www` that point at a previous host.

## 3. Connect the domain to Railway

1. In Railway, **Settings > Networking > Custom Domain**, add `gulyuk.com` (the bare domain, nothing else).
2. Railway shows a **CNAME target** (like `abc123.up.railway.app`) and a **TXT verification record**
   (named like `_railway-verify`). Treat both as the source of truth: copy the exact values from Railway.
3. In Cloudflare **DNS > Records** add:

   | Type  | Name              | Content                          | Proxy status |
   |-------|-------------------|----------------------------------|--------------|
   | CNAME | `@`               | the CNAME target from Railway    | **DNS only** (grey cloud) |
   | TXT   | the name Railway shows | the value Railway shows     | n/a          |

   Cloudflare allows a CNAME on the bare domain; it flattens it automatically.
4. Wait until Railway shows the domain as verified and the certificate as issued (a few minutes). The grey cloud
   matters here: Railway has to reach the domain directly to get its certificate.

## 4. Turn the Cloudflare proxy on (recommended)

Once the Railway certificate is active:

1. In **DNS > Records**, switch the `@` record to **Proxied** (orange cloud).
2. **SSL/TLS > Overview**: set the encryption mode to **Full (strict)**. Never use *Flexible*: it makes
   Cloudflare talk to Railway over plain HTTP and causes redirect loops.
3. **SSL/TLS > Edge Certificates**: turn on **Always Use HTTPS** and **Automatic HTTPS Rewrites**.
   Leave **Minimum TLS Version** at 1.2.
4. Optional but sensible: turn on **HSTS** here once you have confirmed everything works over HTTPS. The site
   already sends `Strict-Transport-Security` itself (see `Caddyfile`), so this is a second layer.

## 5. Make `www.gulyuk.com` go to `gulyuk.com`

Railway only needs the bare domain. Cloudflare does the `www` redirect, before the request ever reaches Railway.

1. **DNS > Records**, add a record so `www` exists and is proxied (a redirect rule only runs for a name that
   resolves through Cloudflare):

   | Type | Name  | Content       | Proxy status |
   |------|-------|---------------|--------------|
   | A    | `www` | `192.0.2.1`   | **Proxied** (orange cloud) |

   `192.0.2.1` is a reserved placeholder address. Traffic never reaches it because the redirect answers first.
2. **Rules > Redirect Rules > Create rule** (choose "Custom filter expression"):
   - Name: `www to apex`
   - **When incoming requests match:** Hostname equals `www.gulyuk.com`
     (or, in the expression editor: `http.host eq "www.gulyuk.com"`)
   - **Then:** Type **Dynamic**, expression `concat("https://gulyuk.com", http.request.uri.path)`,
     status code **301**, and tick **Preserve query string**.
   - Deploy the rule.
3. With **Always Use HTTPS** on, `http://gulyuk.com` goes to `https://gulyuk.com`, and `http://www.gulyuk.com`
   goes through the redirect rule to `https://gulyuk.com`.

## 6. Check it

Run these once DNS has settled (each should print a single `301` or `200`, and the final address must be
`https://gulyuk.com/`):

```bash
curl -sIL http://gulyuk.com        | grep -iE "^(HTTP|location)"
curl -sIL https://www.gulyuk.com   | grep -iE "^(HTTP|location)"
curl -sIL http://www.gulyuk.com/cv | grep -iE "^(HTTP|location)"
curl -sI  https://gulyuk.com/not-a-page | head -1     # expect 404
```

Also open `https://gulyuk.com`, `/cv`, an idea page and `/rss.xml` in a browser. In Cloudflare, under
**SSL/TLS > Overview** the encryption mode should read **Full (strict)**.

## 7. After the first deploy

- Every push to `main` redeploys automatically. Hashed build files are cached for a year, and HTML is always
  revalidated, so a new deploy shows up immediately without purging the Cloudflare cache.
- Submit `https://gulyuk.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- If you use email on this domain, check the `MX`, `SPF` (`TXT`), `DKIM` and `DMARC` records survived the move.
- Optional: enable **DNSSEC** in Cloudflare and add the DS record it shows at your registrar.

## If something looks wrong

| Symptom | Likely cause |
|---------|--------------|
| Redirect loop on `https://` | SSL mode is *Flexible*; set it to *Full (strict)* |
| Railway says the certificate is pending for a long time | the `@` record is proxied too early, or the TXT record is missing; set it to DNS only and re-check |
| `www` shows a Cloudflare error instead of redirecting | the `www` record is missing or grey-clouded; it must be proxied for the rule to run |
| Old site still appears | old `A` or `AAAA` records for `@` are still there, or nameservers have not changed yet |
