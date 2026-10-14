# SyncFlow Daily Startup Guide (Step-by-Step)

This guide walks you through starting up the entire **SyncFlow** production system from scratch after powering on your PC.

## Quick System Architecture Overview

To run SyncFlow, three components must be active simultaneously:

1. **Next.js Production App** (`npm run start` in Terminal 1)
2. **Cloudflare Public Tunnel** (`npx cloudflared` in Terminal 2)
3. **Automated Cron Trigger** (`cron-job.org` calling `/api/cron/sync`)

## Step A: Power \& System Configuration Checklist

Before opening terminals, ensure your PC will not go to sleep while running automated syncs:

1. **Disable Sleep Mode**:

   * Open **Windows Settings** $\\rightarrow$ **System** $\\rightarrow$ **Power \& battery**.
   * Under **Screen and sleep**, set *When plugged in, turn off my device after* to **Never**.

## Step B: Start the Next.js Production Server (Terminal #1)

1. Open **Command Prompt** or **PowerShell**.
2. Navigate to your project directory:

```
   cd C:\\\\\\\\\\\\\\\\Users\\\\\\\\\\\\\\\\SurajAli\\\\\\\\\\\\\\\\OneDrive\\\\\\\\\\\\\\\\Desktop\\\\\\\\\\\\\\\\notion-sheets-sync
   
   ```

3. Start the Next.js production server:

```
   npm run start
   
   ```

4. Verify the output displays:

```
   - Local: http://localhost:3000
   - Ready in XXms
   
   ```

> \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Note:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* Leave Terminal #1 open in the background.

## Step C: Launch the Cloudflare Tunnel (Terminal #2)

1. Open a **second** terminal window or tab.
2. Run the Cloudflare Tunnel command:

```
   npx cloudflared tunnel --url http://localhost:3000
   
   ```

3. Wait 5 seconds for the tunnel to initialize. Look for the `.trycloudflare.com` URL in the output logs:

```
   +--------------------------------------------------------------------------------------------+
   | Your quick Tunnel has been created! Visit it at (links may take some time to load):        |
   | https://your-active-tunnel-name.trycloudflare.com                                          |
   +--------------------------------------------------------------------------------------------+
   
   ```

4. **Copy the unique URL** (e.g., `https://your-active-tunnel-name.trycloudflare.com`).

> \\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\*Note:\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\* Leave Terminal #2 open in the background.

## Step D: Update `cron-job.org` Endpoint

Because Cloudflare quick tunnels generate a new URL each time they restart, update your cron job:

1. Go to [**cron-job.org**](https://cron-job.org) and log in.
2. Locate **SyncFlow 5-Min Sync** and click **EDIT**.
3. In the **URL** field, paste your new Cloudflare URL followed by `/api/cron/sync`:

```
   https://your-active-tunnel-name.trycloudflare.com/api/cron/sync
   
   ```

4. Click the **ADVANCED** tab and confirm your headers are set:

   * **Header Name**: `Authorization`
   * **Header Value**: `Bearer YOUR\\\\\\\\\\\\\\\_CRON\\\\\\\\\\\\\\\_SECRET`
5. Click **SAVE** at the bottom right.
6. Click **TEST RUN** to verify.

### Success Verification

* **Status**: `200 OK`
* **Response Body**: `{"success": true, ...}`
* **Terminal #1 Log**: `POST /api/cron/sync 200`

## Step E: Verify Public Landing Page \& Waitlist Pipeline

1. Open your browser and visit your live Cloudflare URL:
`https://your-active-tunnel-name.trycloudflare.com`
2. Test the waitlist submission:

   * Enter a test email in the **Join Waitlist** form.
   * Click **Join Waitlist →**.
3. Check **Supabase Dashboard** $\\rightarrow$ **Table Editor** $\\rightarrow$ `waitlist` to confirm the new lead appears.
4. Check your inbox to confirm the automated **Resend welcome email** arrives.

## Troubleshooting Quick Reference

|Symptom / Error|Root Cause|Fix Action|
|-|-|-|
|**`408 Request Timeout`**|Cloudflare tunnel dropped or not running in Terminal 2.|Restart Terminal #2 command and update URL in `cron-job.org`.|
|**`401 Unauthorized`**|Missing or invalid `Authorization` header.|Verify `Bearer YOUR\\\\\\\\\\\\\\\_CRON\\\\\\\\\\\\\\\_SECRET` in `cron-job.org` Advanced Headers tab.|
|**`500 Internal Error`**|Missing `.env.local` keys or Supabase connection issue.|Check `.env.local` for `SUPABASE\\\\\\\\\\\\\\\_SERVICE\\\\\\\\\\\\\\\_ROLE\\\\\\\\\\\\\\\_KEY` and `RESEND\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\_KEY`.|
|**Waitlist email not received**|Resend API key missing or unverified email domain.|Verify `RESEND\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\_KEY` in `.env.local` and check Resend Dashboard logs.|

## System Active Checklist Summary

* \[ ] Terminal 1: `npm run start` running on `http://localhost:3000`
* \[ ] Terminal 2: `npx cloudflared tunnel --url http://localhost:3000` active
* \[ ] `cron-job.org` updated with current `.trycloudflare.com/api/cron/sync` URL
* \[ ] Test Run returns **`200 OK`**
* \[ ] PC sleep mode disabled

*Your SyncFlow engine is now fully active and ready to onboard waitlist users!*

