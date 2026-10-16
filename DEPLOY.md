# Deploying gulyuk.com: Railway, Cloudflare and the domain

Goal: `https://gulyuk.com` is the one real address. `www.gulyuk.com`, `http://gulyuk.com` and
`http://www.gulyuk.com` all end up there with a single permanent redirect, and everything is served over HTTPS.

The site is a static build served by Caddy in a container (see `Dockerfile` and `Caddyfile`). Railway builds it
from this repository on every push to `main`. It needs no environment variables and no database.

## Your actual values (checked 16 Oct 2026)

- Railway project `gulyuk-com`, service `gulyuk-com`, temporary address
  `https://gulyuk-com-production.up.railway.app`.
- Railway custom domain `gulyuk.com` is already added. The DNS record it asks for is
  **`CNAME  @  wxrkhi9q.up.railway.app`**. If Railway ever shows a different value, trust Railway.
- Domain registrar: **Namecheap**. DNS is currently Namecheap's own (`dns1/dns2.registrar-servers.com`) and the
  domain shows a parking page: `A @ 192.64.119.191` and `www` pointing at `parkingpage.namecheap.com`.
  Both go away in step 2.
- Namecheap **email forwarding** is on. It depends on Namecheap's DNS, so when nameservers move to Cloudflare
  these records must be recreated in Cloudflare (step 2, item 5) or forwarded mail stops arriving.

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
2. Cloudflare assigned this zone the nameservers **`audrey.ns.cloudflare.com`** and
   **`conrad.ns.cloudflare.com`** (use whatever the Cloudflare dashboard shows if they ever differ). At
   **Namecheap**: **Domain List > Manage > Nameservers**, choose **Custom DNS**, enter those two, and save
   with the green tick. This can take from minutes to a day. Cloudflare emails you when the domain is active.
3. Cloudflare scans the old DNS and offers to import the records it finds. Accept the import, then review the list.
4. **Delete** the Namecheap parking records for `@` and `www`: `A @ 192.64.119.191` and
   `CNAME www parkingpage.namecheap.com` (they would fight with Railway).
5. **Keep email forwarding working.** Make sure these records exist in Cloudflare (all set to **DNS only**,
   email records can never be proxied):

   | Type | Name | Content | Priority |
   |------|------|---------|----------|
   | MX  | `@` | `eforward1.registrar-servers.com` | 10 |
   | MX  | `@` | `eforward2.registrar-servers.com` | 10 |
   | MX  | `@` | `eforward3.registrar-servers.com` | 10 |
   | MX  | `@` | `eforward4.registrar-servers.com` | 15 |
   | MX  | `@` | `eforward5.registrar-servers.com` | 20 |
   | TXT | `@` | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | n/a |

   These are the values Namecheap's forwarding uses today. In Namecheap, **Domain List > Manage > Email
   Forwarding** lists the same records if you want to compare. Send yourself a test mail after the switch.

## 3. Connect the domain to Railway

1. In Railway, **Settings > Networking > Custom Domain**, add `gulyuk.com` (the bare domain, nothing else).
2. Railway shows a **CNAME target** (currently `wxrkhi9q.up.railway.app`) and, in some cases, a **TXT
   verification record**. Treat what the Railway dashboard shows as the source of truth.
3. In Cloudflare **DNS > Records** add:

   | Type  | Name | Content                    | Proxy status |
   |-------|------|----------------------------|--------------|
   | CNAME | `@`  | `wxrkhi9q.up.railway.app`  | **DNS only** (grey cloud) |
   | TXT   | only if Railway lists one | the value Railway shows | n/a |

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
