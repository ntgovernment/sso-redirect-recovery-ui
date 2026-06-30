# SSO Redirect Recovery UI

Recovery interface for failed SSO redirects in Squiz Matrix. Displays a branded fallback page that automatically retries or redirects authenticated users to their destination after a short countdown, with manual navigation links as fallback.

---

## What this does

- Shows a friendly, branded page when SSO redirect hangs
- Starts a 5‑second countdown and then auto‑redirects to the first available link
- Displays manual navigation links (user's agency intranet, NTG Central)
- Uses a fixed NTG Central destination: `https://ntgcentral.nt.gov.au`
- Uses localStorage `intra-user-departmentInfo` to populate agency data
- Provides ARIA announcements and keyboard focus support for accessibility
- Logs warnings/errors to the console to aid debugging

---

## Files

- `sso-redirect-recovery.html` — Main paint layout (HTML) linking to CSS/JS
- `styles.css` — All CSS styling and animations
- `script.js` — Countdown, redirect logic, and localStorage handling
- `LICENSE` — MIT license

---

## Behavior details

- Countdown text now reads: `Redirecting to your [link title] in Xs...` where `[link title]` is the visible title of the first navigation link.
- The page redirects to the `href` of the first visible link after countdown completes.
- Clicking any navigation link cancels the auto‑redirect.
- If no visible links exist, the countdown is hidden and no redirect is attempted.
- The NTG Central link always points to `https://ntgcentral.nt.gov.au`.

---

## Data requirements

The script expects the following object stored in `localStorage` under the key `intra-user-departmentInfo`:

```json
{
  "intranetName": "Department of Health",
  "intranetURL": "https://internal.nt.gov.au/department/",
  "intranetGlobe": "123456",
  "secondaryNavigationNTGCJSON": "[...]"
}
```

Fields:

- `intranetName` (string) — Display name used for link text
- `intranetURL` (string) — Full agency intranet URL used for the agency link
- `intranetGlobe` (string, optional fallback) — Squiz Matrix asset ID used only if `intranetURL` is unavailable (`./?a={assetID}`)
- `secondaryNavigationNTGCJSON` (string, optional) — JSON blob containing secondary navigation items (as exported by Matrix)

Note: the script now avoids appending the word "intranet" if the provided `intranetName` already includes it (case-insensitive). This prevents results like "DCDD Intranet intranet".

If this data is missing or invalid, the agency link will be hidden and the countdown will either target the NTG Central link or be disabled if no valid link exists.

---

## Deployment

Two approaches depending on your Squiz Matrix setup:

1. Recommended — keep files separate
   - Upload `styles.css` and `script.js` as static assets in Matrix (or host them where accessible)
   - Update the `<link>`/`<script>` references in `sso-redirect-recovery.html` to point to the Matrix asset URLs
   - Paste the HTML into your paint layout and publish

2. Single-file paint layout (if required by Matrix)
   - Inline `styles.css` into a `<style>` tag in the document head
   - Inline `script.js` into a `<script>` tag before `</body>`
   - Paste the combined HTML into your paint layout and publish

---

## Testing checklist

- Visual: confirm layout matches Figma (colors, spacing, logo)
- Countdown: displays `Redirecting to your [link title] in 5s...` and updates each second
- Redirect: navigates to the first visible link after countdown
- Click: clicking a link cancels auto-redirect
- localStorage: test with valid, missing, and invalid `intra-user-departmentInfo`
- Accessibility: screen reader announces heading and countdown, keyboard focus visible
- JS disabled: fallback message visible and links available
- Console: warnings/errors appear for missing or invalid data

---

## Quick local test

Open `sso-redirect-recovery.html` in a browser and run in DevTools Console:

```javascript
// Valid data
localStorage.setItem(
  "intra-user-departmentInfo",
  JSON.stringify({
    intranetName: "Department of Health",
    intranetURL: "https://internal.nt.gov.au/department/",
    intranetGlobe: "123456",
  }),
);
location.reload();

// No data
localStorage.removeItem("intra-user-departmentInfo");
location.reload();
```

---

## Customization

- `COUNTDOWN_SECONDS` in `script.js` — change the countdown duration
- `NTG_CENTRAL_URL` in `script.js` — change fallback NTG Central URL
- Colors and typography — edit `styles.css`

---

## Troubleshooting

- If countdown does not start, check browser console for warnings about `intra-user-departmentInfo`.
- If the redirect goes to the wrong place, inspect the first visible `.nav-link` `href` in DevTools.
- If the spinner doesn't animate, ensure `styles.css` is loaded and `@keyframes spin` is available.

---

## License

MIT License — Northern Territory Government 2026
