# CaptureKit for Jira — Privacy Policy

*Last updated: 7 July 2026*

CaptureKit ("the app") is published by **ReadyGate Labs**. This policy explains what
data the app processes and where it lives.

## The short version

Your data stays in Atlassian. CaptureKit is built on **Atlassian Forge** and runs
entirely on Atlassian-hosted infrastructure. We (the vendor) operate **no servers**,
and we **cannot access, read, or export** your Jira content or your reporters' data.

## What the app processes

**Bug reports submitted through the widget.** When someone submits a report on your
website, their browser sends the following directly to your Jira site's CaptureKit
endpoint (an Atlassian-hosted Forge web trigger):

- the report title, description and severity they typed,
- a screenshot of the page as shown in their browser (with their annotations),
- recent console errors/warnings and failed network requests from that page,
- technical environment details (browser, OS, viewport, screen size, language,
  timezone, page URL),
- optionally, the reporter's **name and email address** — only if they enter them, or
  if the site owner configured the widget to require an email.

This data is stored **inside your Jira site** as a Jira issue, its attachments and an
issue property — governed by your own Jira permissions and Atlassian's
[privacy policy](https://www.atlassian.com/legal/privacy-policy) and
[cloud security practices](https://www.atlassian.com/trust).

**App configuration.** Widget names, target projects/issue types, widget tokens, a
recent-reports list, and hourly usage counters are stored in **Forge app storage**
(Atlassian-hosted, scoped to your installation).

## What we do NOT do

- No data leaves Atlassian to us or to any third party. The app makes no external
  network calls.
- No analytics, no tracking, no cookies are added by the app or the widget.
- We cannot see your issues, screenshots, reporters' emails, or any other content.

## The widget on your website

The widget script itself is open source
(https://github.com/creatorsky/capturekit-widget) and is served from the public
**jsDelivr** CDN. Loading a file from a CDN discloses the requester's IP address to
that CDN, as with any script on the web (see jsDelivr's privacy policy). The widget
records console/network/environment data **only in the page's memory** and transmits it
**only when the reporter clicks send** — directly to your Jira site.

## Data retention & deletion

Reports live as Jira issues in your project — delete them like any issue, at any time.
Uninstalling the app deletes its Forge storage (widget configs, counters) per
Atlassian's Forge data lifecycle.

## Your responsibilities as a site owner

If you deploy the widget on a website subject to privacy laws (GDPR, CCPA, etc.), you
are the controller of the data your reporters submit. Mention CaptureKit in your own
privacy notice if required, and enable "require email" only when you have a lawful
basis to collect it.

## Contact

Questions or data requests: **akashparmar1997@gmail.com**
