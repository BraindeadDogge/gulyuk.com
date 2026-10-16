# Visit statistics

The site counts visits with [Umami](https://umami.is), self-hosted next to the site, without cookies and without
a consent banner. This page explains what is counted, how to switch it on, and how to add an event.

> The site works without any of this. With no collector configured, no analytics code is loaded and no request is made.

## What is recorded

Pageviews (path only, no query string or fragment), plus a few named events listed below. A visit identifier is
derived by Umami from the IP address, the browser and a periodically changing secret; it is not stored on the visitor's
device. No fingerprinting, no per-person history, and no attempt to find out who a visitor is. The wording shown to
visitors is on the site's [privacy page](../app/pages/privacy.vue).

Tracking is **off** when any of these is true:

- `NUXT_PUBLIC_UMAMI_HOST` or `NUXT_PUBLIC_UMAMI_ID` is not set;
- the browser sends Global Privacy Control or Do Not Track;
- the visitor pressed "stop counting my visits" in the footer (stored as `gulyuk-optout`).

The decision lives in `shared/analytics/gate.ts`; the browser side is `app/plugins/analytics.client.ts`.

## Events

| Event | Properties | When |
|---|---|---|
| (pageview) | `url`, `referrer` | every page and route change (path only) |
| `read-25`, `read-50`, `read-75`, `read-100`, `read-end` | `idea` | an article milestone is reached, once per view |
| `read-time` | `idea`, `seconds` | on leaving an idea page, if it was open 8 seconds or more |
| `essay-chapter` | `idea`, `chapter` | the first view of each essay chapter |
| `figure-used` | `figure` | the first interaction with an essay figure |
| `cv-download` | | a click on the CV PDF link |
| `profile-click` | `site` | a click on LinkedIn, GitHub or another profile link on the CV |
| `outbound` | `host` | a click on any link to another site (hostname only) |
| `landing` | `ref` | the first load with a valid `?ref=label` |

Reading milestones count only after the visitor has scrolled (or the page has been on screen for a few seconds), so a
short page is not reported as read the moment it opens.

### Adding an event

Pick one:

- in a component, call `useTrack()('my-event', { prop: 'value' })`;
- on a link, add `data-track="my-event"` (and optionally `data-site="value"`);
- from plain browser script, run
  `document.dispatchEvent(new CustomEvent('site:track', { detail: { name, props } }))`.

Names are lower-case letters, digits and hyphens (40 characters at most). Strings are cut at 80 characters and URLs lose
their query string. Never put anything about a person in a property. If you add or remove an event or a stored browser
setting, update `app/pages/privacy.vue` as well.

### Tagged links

Add `?ref=short-label` (lower-case letters, digits, hyphens) to a link you send. The label is recorded once as a
`landing` event and then removed from the address bar, so you can see which message brought a visit.

## Switching it on

Do this in your own accounts; none of it needs the code to change.

1. **Run Umami on Railway.** In your Railway project: New, Template, search "Umami", deploy. It creates the app and a
   Postgres database. In the Umami service set `APP_SECRET` to a random string of at least 32 characters and
   `DISABLE_TELEMETRY=1`.
2. **Give it a subdomain.** In the Umami service: Settings, Networking, Custom Domain, `stats.<your-domain>`. Railway
   shows a CNAME target; add that CNAME for `stats` in your DNS and wait for the certificate. The Content Security
   Policy in the `Caddyfile` allows `https://stats.gulyuk.com`; change it if you use another host.
3. **Secure the dashboard.** Open the new address, sign in with Umami's default account (`admin` / `umami`) and change
   the password at once to a long, unique one. The dashboard stays private.
4. **Add the site.** Settings, Websites, Add website; copy its Website ID.
5. **Tell the site.** On the site's Railway service add `NUXT_PUBLIC_UMAMI_HOST=https://stats.<your-domain>`,
   `NUXT_PUBLIC_UMAMI_ID=<the Website ID>` and `NUXT_PUBLIC_UMAMI_DOMAINS=<your-domain>`, then redeploy. They are build
   arguments (see the `Dockerfile`), so the new build bakes them into the pages.
6. **Retention (13 months).** The privacy page promises it. If your Umami version has a data-retention setting, use it.
   If not, run this against the Umami database every month (Railway Postgres, Data tab; confirm the table names with
   `\dt` first) and put a reminder in your calendar:

   ```sql
   DELETE FROM event_data    WHERE created_at < NOW() - INTERVAL '13 months';
   DELETE FROM website_event WHERE created_at < NOW() - INTERVAL '13 months';
   DELETE FROM session       WHERE created_at < NOW() - INTERVAL '13 months';
   ```

## Reading the reports

- **Pages, referrers, countries, devices:** the website's Overview.
- **How far people read:** Events, open `read-50` (or `read-100`), then break down by the `idea` property.
- **Where essay readers drop off:** the `essay-chapter` event, by `chapter`.
- **The CV:** the `/cv` page, plus `cv-download`, `profile-click` by `site` and `outbound` by `host`.
- **Shared links:** the `landing` event, by `ref`.

## Testing

`pnpm generate:test` builds the site with a stub collector address, and `pnpm test:e2e` needs that build: the
Playwright config starts the stub (`tests/e2e/stub-umami.mjs`, port 4174) itself. The end-to-end tests check that
events fire once, that nothing is sent when privacy signals or the opt-out say no, and that no third-party host is
contacted before a visitor asks for one.
