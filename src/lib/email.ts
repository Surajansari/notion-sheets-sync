import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://usesyncflow.com';

// 1. Waitlist Confirmation Email
export async function sendWaitlistEmail(email: string, firstName: string) {
  await resend.emails.send({
    from: 'SyncFlow <hello@usesyncflow.com>',
    to: email,
    subject: "🎉 You're on the SyncFlow VIP Beta Waitlist!",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #090a0f; color: #ededed; padding: 40px; border-radius: 12px;">
        <h2 style="color: #818cf8;">Welcome to the Future of Data Syncing, ${firstName}! 🚀</h2>
        <p>You have successfully secured your spot on the exclusive <b>SyncFlow Beta Waitlist</b>.</p>
        <p>We are rolling out invites in small batches to ensure lightning-fast 2-way synchronization between your Notion databases and Google Sheets.</p>
        <div style="background: #1e1b4b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <h4 style="margin: 0 0 10px 0; color: #a5b4fc;">🎁 What awaits you in Beta:</h4>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Lightning-fast background sync intervals ⚡</li>
            <li>Zero-maintenance error alerts & auto-reconnects 🛡️</li>
            <li>Exclusive lifetime beta pricing when you upgrade 💎</li>
          </ul>
        </div>
        <p>Keep an eye on your inbox—your personal invitation link is coming very soon!</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">SyncFlow — True 2-Way Notion & Google Sheets Sync</p>
      </div>
    `,
  });
}

// 2. Beta Invitation Email (Supabase Invite Hook / Trigger)
export async function sendBetaInviteEmail(email: string, inviteLink: string) {
  await resend.emails.send({
    from: 'SyncFlow <hello@usesyncflow.com>',
    to: email,
    subject: "🔥 Your SyncFlow Beta Invite is Here! (Claim Your Pro Trial)",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #090a0f; color: #ededed; padding: 40px; border-radius: 12px;">
        <h2 style="color: #818cf8;">Your Access Has Been Unlocked! 🔓✨</h2>
        <p>The wait is over. Your spot for the <b>SyncFlow Beta</b> is ready.</p>
        <p>Click the secure button below to set your password, activate your account, and instantly claim your <b>14-Day Free Pro Trial</b>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">Accept Beta Invite & Start Syncing →</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">If you have any questions or feedback as you test out your first sync, simply reply directly to this email—our founders read every message!</p>
      </div>
    `,
  });
}

// 3. Welcome to Trial Period Email
export async function sendTrialWelcomeEmail(email: string, firstName: string) {
  await resend.emails.send({
    from: 'SyncFlow <hello@usesyncflow.com>',
    to: email,
    subject: "🎉 Welcome aboard, Sync-Pioneer! (Your Pro Trial is Active)",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #090a0f; color: #ededed; padding: 40px; border-radius: 12px;">
        <h2 style="color: #818cf8;">Let’s Get Your First Sync Running! ⚡</h2>
        <p>Thank you for joining <b>SyncFlow</b>, ${firstName}. You now have full access to our high-performance, real-time 2-way sync engine connecting your Notion databases and Google Sheets.</p>
        <div style="background: #1e1b4b; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <h4 style="margin: 0 0 10px 0; color: #a5b4fc;">🎁 Your 14-Day Free Pro Trial Includes:</h4>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Lightning-fast 5-minute background sync intervals</li>
            <li>Unlimited Notion databases & Google Sheets</li>
            <li>Automatic token refreshing & error alerts</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${DOMAIN}/dashboard" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Access Your Dashboard & Start Syncing →</a>
        </div>
      </div>
    `,
  });
}

// 4. Trial Expiry Reminder Email (Day 13)
export async function sendTrialReminderEmail(email: string, firstName: string) {
  await resend.emails.send({
    from: 'SyncFlow <hello@usesyncflow.com>',
    to: email,
    subject: "⏰ Action Required: Your SyncFlow Pro Trial Ends Tomorrow!",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #090a0f; color: #ededed; padding: 40px; border-radius: 12px;">
        <h2 style="color: #f59e0b;">Don't Lose Your Speed & Automated Syncs! ⏳</h2>
        <p>Hey ${firstName}, your 14-day free trial of SyncFlow Pro concludes tomorrow.</p>
        <p>To prevent your account from downgrading to standard 15-minute intervals and locking advanced features, upgrade to Pro today for just <b>£15/mo</b>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${DOMAIN}/dashboard?upgrade=true" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Upgrade to SyncFlow Pro (£15/mo) 🚀</a>
        </div>
      </div>
    `,
  });
}

// 5. Welcome to Pro User Email (Post-Stripe Checkout)
export async function sendProWelcomeEmail(email: string, firstName: string) {
  await resend.emails.send({
    from: 'SyncFlow <hello@usesyncflow.com>',
    to: email,
    subject: "💎 Welcome to SyncFlow Pro! (You're All Set)",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #090a0f; color: #ededed; padding: 40px; border-radius: 12px;">
        <h2 style="color: #10b981;">You are officially a SyncFlow Pro Member! 🎉</h2>
        <p>Thank you for backing us, ${firstName}! Your subscription is active, and your sync engine is now operating at maximum speed with priority 5-minute background workers.</p>
        <p>If you ever need help configuring custom formulas or advanced filters, our team is just a reply away.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${DOMAIN}/dashboard" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Go to Pro Dashboard →</a>
        </div>
      </div>
    `,
  });
}