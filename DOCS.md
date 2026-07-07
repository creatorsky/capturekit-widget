# CaptureKit for Jira — Documentation

CaptureKit lets anyone report bugs and feedback from your website straight into Jira —
with an annotated screenshot, console errors, failed network requests and environment
details attached automatically. Reporters need **no Jira account, no login and no
browser extension**.

## Quick start (2 minutes)

1. Install **CaptureKit** from the Atlassian Marketplace.
2. In Jira, open **Apps → CaptureKit**.
3. Under **Add a widget**, choose a name (e.g. "Marketing site"), the Jira **project**
   and the **issue type** reports should create, then click **Create widget**.
4. Click **Get snippet** and paste the snippet into your website, just before the
   closing `</body>` tag.
5. Open your site — a **Report a bug** button appears in the corner. Click it, annotate
   the screenshot, describe the problem, send. The report appears in your Jira project.

## The snippet

```html
<script>
  (function (w, d) {
    w.CaptureKit = { endpoint: "YOUR_ENDPOINT", token: "YOUR_TOKEN" };
    var s = d.createElement("script");
    s.src = "https://cdn.jsdelivr.net/gh/creatorsky/capturekit-widget@1.0.0/widget.min.js";
    s.defer = true;
    d.head.appendChild(s);
  })(window, document);
</script>
```

Optional settings on `window.CaptureKit`:

| key | default | effect |
|---|---|---|
| `buttonText` | `"Report a bug"` | floating button label |
| `accent` | `"#1868DB"` | brand colour |
| `position` | `"right"` | `"left"` or `"right"` corner |

The widget is open source: https://github.com/creatorsky/capturekit-widget

## What each report contains

- **Annotated screenshot** — the reporter can draw (pen), box, arrow and add text labels
  before sending. Attached to the issue as `capturekit-screenshot.jpg`.
- **Console log** — recent warnings, errors, uncaught exceptions and unhandled promise
  rejections (up to 100 entries).
- **Failed network requests** — fetch/XHR calls that returned HTTP 4xx/5xx or failed
  (up to 50).
- **Environment** — browser + version, OS, viewport, screen, language, timezone,
  page URL, and the reporter's name/email if provided.
- Everything is also attached as `capture-context.json` and rendered in the
  **CaptureKit panel** on the issue (add it via the ⊙ apps button on the issue view).

Severity chosen by the reporter maps to Jira priority (Blocker→Highest, Major→High,
Minor→Low, Feedback→Lowest) when the priority field is available on the create screen.

## Widgets

Create one widget per website (or per environment). Each widget has its own token and
can be **disabled instantly** or removed on the CaptureKit admin page. Options:

- **Label on created issues** — defaults to `capturekit`; useful for boards and JQL.
- **Require the reporter's email** — reject reports without a contact address.

Endpoints are rate-limited (200 reports per widget per hour) to protect your Jira site.

## Security & data flow

- Reports go **directly from the reporter's browser to your Jira site's CaptureKit
  endpoint** (an Atlassian-hosted Forge web trigger). There are no third-party servers.
- The widget script is served from jsDelivr (a public CDN) and is open source.
- Widget tokens only allow *creating* reports in the one project you configured —
  they cannot read, change or delete anything in Jira.
- CaptureKit works in both company-managed and team-managed projects.

## Troubleshooting

- **Button doesn't appear** — check the snippet is present and `endpoint`/`token` are
  set; look for `[CaptureKit]` warnings in the browser console.
- **"Unknown or disabled widget token"** — the widget was removed or disabled in the
  admin page, or the token was edited. Re-copy the snippet.
- **Screenshot looks slightly off** — complex CSS (cross-origin images, some fonts) may
  render imperfectly; the report is still sent with full technical context.
- **Reports rejected with "Rate limit exceeded"** — a widget sent 200+ reports within
  an hour; wait or create a separate widget per site.

## Support

Email **akashparmar1997@gmail.com** — we usually reply within one business day.
