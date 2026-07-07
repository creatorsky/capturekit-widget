# CaptureKit widget

The embeddable widget for **CaptureKit — visual bug reports & feedback for Jira**
(Atlassian Marketplace app). One paste, and anyone on your site can send annotated
screenshots with console errors, failed network requests and environment info straight
into your Jira project — no account, no login.

## Install

Get your personalised snippet from **Jira → Apps → CaptureKit**. It looks like this:

```html
<script>
  (function (w, d) {
    w.CaptureKit = { endpoint: "YOUR_ENDPOINT", token: "YOUR_TOKEN" };
    var s = d.createElement("script");
    s.src = "https://cdn.jsdelivr.net/gh/creatorsky/capturekit-widget@1/widget.min.js";
    s.defer = true;
    d.head.appendChild(s);
  })(window, document);
</script>
```

Optional settings on `window.CaptureKit`:

| key | default | what it does |
|---|---|---|
| `buttonText` | `"Report a bug"` | label of the floating button |
| `accent` | `"#1868DB"` | brand colour for button + UI |
| `position` | `"right"` | `"left"` or `"right"` corner |

## What it captures

- Screenshot of the current view (annotate with pen / box / arrow / text before sending)
- Console warnings & errors, uncaught exceptions, unhandled rejections (last 100)
- Failed network requests — fetch & XHR with status codes (last 50)
- Browser, OS, viewport, screen, language, timezone, page URL
- Reporter name/email (optional or required — your choice)

Everything is sent **only** to your own Jira site's CaptureKit endpoint. No third-party
servers, no analytics, no tracking.

## Files

- `widget.js` — readable source
- `widget.min.js` — minified build served via jsDelivr (pin `@1` for the v1 line)

MIT licensed.
