# Sarora waitlist: Google Sheet + Web App API

## 1. Create a new Google Sheet

1. Open [Google Sheets](https://sheets.google.com) → **Blank**.
2. Name the spreadsheet (e.g. **Sarora Waitlist**).
3. You do **not** need to add rows by hand — the script creates a tab **Waitlist** and headers on first submission.

## 2. Get the Sheet ID

From the browser address bar:

```text
https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_SHEET_ID/edit
```

Copy **only** the long ID between `/d/` and `/edit`.

## 3. Create the Apps Script project

1. In the same Google account, open [script.google.com](https://script.google.com) → **New project**.
2. Delete any default `Code.gs` content and paste the contents of **`apps-script/Code.gs`** from this repo.
3. Replace `PASTE_YOUR_NEW_GOOGLE_SHEET_ID_HERE` with your **Sheet ID** (step 2).
4. Optional: set `NOTIFY_EMAIL` to your team address if you want an internal copy of each signup.
5. Set `PUBLIC_SITE_URL` in `Code.gs` to your live site (no trailing slash), e.g. `https://www.sarorajewelry.com` or your GitHub Pages URL — used for the logo (`/images/logo.png`) and **Website** link in confirmation emails. Adjust `INSTAGRAM_URL` if needed.
6. **Save** (Ctrl/Cmd + S).

### First-time authorization

1. Run the function **`testDoPost`** once (dropdown → Run).
2. Grant permissions: **Review permissions** → choose account → **Advanced** → **Go to … (unsafe)** if shown → **Allow**.
3. Allow **Gmail** (for confirmation emails) and **Spreadsheet** access when prompted.

Check the **Waitlist** tab in your Sheet — you should see a test row.

## 4. Deploy as a Web App (this is your API URL)

1. Click **Deploy** → **New deployment**.
2. Gear icon → **Web app** (if needed).
3. Settings:
   - **Description**: e.g. `Sarora waitlist v1`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone** (required so the public site can POST without login)
4. **Deploy** → copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`). Prefer this **public** `/macros/s/` URL for a public website. Workspace-only URLs like `script.google.com/a/macros/yourdomain.com/...` often require sign-in and will break anonymous form posts.

## 5. Connect the website

1. Open **`index.html`** in this project.
2. Find `WAITLIST_API_URL` near the waitlist script.
3. Set it to your Web app URL inside the quotes:

   ```javascript
   const WAITLIST_API_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```

4. Deploy your site (GitHub Pages, etc.) and test the form.

If the URL is left empty (`''`), the form keeps the old behavior (localStorage only).

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| **“Load failed” / fetch error in the browser** | The site sends **`application/x-www-form-urlencoded`** (not JSON) so browsers don’t block the request with CORS preflight. Use the latest `index.html` + `Code.gs`. Redeploy the script after updating `Code.gs`. |
| **Script fails to open sheet** | Sheet ID wrong, or Sheet not shared with the Google account that owns the script. |
| **403 / permission** | Redeploy Web App after code changes; use **New deployment** version. |
| **CORS / blocked request** | Ensure deployment is **Anyone**. Try incognito. Some ad blockers block `script.google.com`. |
| **Email not sent** | Gmail quota (daily limits); check spam; verify `GmailApp` authorization. |

## Sheet columns (auto-created)

| Timestamp | First Name | Last Name | Email | Interest | Source |
|-----------|------------|-----------|-------|----------|--------|

`interest` matches the form: `rings`, `necklaces`, `pendants`, `bracelets`, `earrings`, `all`, or empty.
