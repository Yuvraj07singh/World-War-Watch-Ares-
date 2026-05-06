// server/email.js
// ─────────────────────────────────────────────
//  World War Watch — Email Service
//  Sends themed welcome emails on newsletter signup
// ─────────────────────────────────────────────

const nodemailer = require('nodemailer');

// Create reusable transporter (lazy-initialized)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set. Email sending disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Send a welcome/confirmation email to a new subscriber.
 * @param {string} email - The subscriber's email address
 * @returns {Promise<boolean>} - true if sent successfully
 */
async function sendWelcomeEmail(email) {
  const t = getTransporter();
  if (!t) {
    console.log('[email] Transporter not configured — skipping welcome email.');
    return false;
  }

  const mailOptions = {
    from: `"ARES // World War Watch" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔴 INTEL BRIEFING ACTIVATED — Welcome to World War Watch',
    html: buildWelcomeHTML(email),
    text: buildWelcomeText(email),
  };

  try {
    await t.sendMail(mailOptions);
    console.log(`[email] ✓ Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`[email] ✗ Failed to send to ${email}:`, err.message);
    return false;
  }
}

/**
 * Send a news briefing email to a subscriber.
 * @param {string} email - Recipient email
 * @param {object} briefingData - { subject, briefingText, conflicts, updatedAt }
 * @returns {Promise<boolean>}
 */
async function sendBriefingEmail(email, briefingData) {
  const t = getTransporter();
  if (!t) return false;

  const { subject, briefingText, conflicts = [], updatedAt } = briefingData;

  const mailOptions = {
    from: `"ARES // World War Watch" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔴 ${subject || 'INTEL BRIEFING UPDATE'}`,
    html: buildBriefingHTML(briefingText, conflicts, updatedAt),
    text: `WORLD WAR WATCH — INTEL BRIEFING\n\n${briefingText}\n\nGenerated: ${updatedAt || new Date().toISOString()}\n\nhttps://ares-ykga.onrender.com`,
  };

  try {
    await t.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error(`[email] Briefing send failed for ${email}:`, err.message);
    return false;
  }
}

// ── HTML TEMPLATES ─────────────────────────────────────────

function buildWelcomeHTML(email) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',monospace;">
  <div style="max-width:600px;margin:0 auto;background:#0d0d0d;border:1px solid #1a1a1a;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0a0808 0%,#1a0505 100%);padding:30px 25px;border-bottom:2px solid #c01000;">
      <div style="font-size:10px;letter-spacing:0.3em;color:#c01000;margin-bottom:8px;">// CLASSIFIED TRANSMISSION</div>
      <div style="font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:0.05em;font-family:Georgia,serif;">WORLD WAR WATCH</div>
      <div style="font-size:11px;color:#666;letter-spacing:0.15em;margin-top:4px;">ARES INTELLIGENCE NETWORK — SECURE CHANNEL ESTABLISHED</div>
    </div>

    <!-- Status Bar -->
    <div style="background:#080808;padding:12px 25px;border-bottom:1px solid #1a1a1a;display:flex;">
      <span style="color:#28883a;font-size:11px;letter-spacing:0.1em;">● LINK ACTIVE</span>
      <span style="color:#444;font-size:11px;margin-left:15px;">${new Date().toISOString().replace('T', ' ').split('.')[0]} UTC</span>
    </div>

    <!-- Body -->
    <div style="padding:30px 25px;">
      <div style="color:#c01000;font-size:11px;letter-spacing:0.2em;margin-bottom:15px;">// WELCOME OPERATOR</div>
      
      <div style="color:#e8e0d0;font-size:15px;line-height:1.7;margin-bottom:20px;">
        Your secure intelligence feed has been activated. You are now receiving raw, unfiltered AI-generated situation reports on active global conflicts.
      </div>

      <div style="background:#080808;border:1px solid #1a1a1a;border-left:3px solid #c01000;padding:18px;margin:20px 0;">
        <div style="color:#c01000;font-size:10px;letter-spacing:0.2em;margin-bottom:10px;">ACTIVE THEATERS OF OPERATION</div>
        <div style="color:#e8e0d0;font-size:13px;line-height:1.8;">
          🔴 <strong>US + Israel vs Iran</strong> — Strait of Hormuz crisis<br>
          🟠 <strong>India vs Pakistan</strong> — Post-Sindoor tension<br>
          🟠 <strong>Pakistan vs Afghanistan</strong> — Cross-border operations<br>
          🔵 <strong>Russia vs Ukraine</strong> — Year 4 of conflict
        </div>
      </div>

      <div style="color:#e8e0d0;font-size:14px;line-height:1.7;margin-bottom:20px;">
        <strong style="color:#fff;">What you'll receive:</strong><br>
        • AI-synthesized daily intelligence briefings<br>
        • Breaking escalation alerts across all 4 conflict zones<br>
        • Economic war impact analysis (oil, gold, currencies)<br>
        • Nuclear risk status updates
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:30px 0;">
        <a href="https://ares-ykga.onrender.com" style="display:inline-block;background:#c01000;color:#fff;padding:14px 35px;text-decoration:none;font-family:Georgia,serif;font-size:16px;letter-spacing:0.05em;border-radius:3px;">ACCESS LIVE DASHBOARD →</a>
      </div>

      <div style="border-top:1px solid #1a1a1a;padding-top:15px;margin-top:25px;">
        <div style="color:#444;font-size:10px;letter-spacing:0.15em;line-height:1.6;">
          REGISTERED ENDPOINT: ${email}<br>
          CLASSIFICATION: UNCLASSIFIED // OSINT<br>
          ENCRYPTION: TLS 1.3 — END-TO-END SECURED
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#080808;padding:20px 25px;border-top:1px solid #1a1a1a;">
      <div style="color:#333;font-size:10px;letter-spacing:0.1em;text-align:center;line-height:1.6;">
        © 2026 World War Watch — ARES Intelligence Platform<br>
        AI-generated intelligence from public RSS feeds · Not affiliated with any government or military<br>
        <span style="color:#555;">This is an automated transmission. All data is sourced from public news outlets.</span>
      </div>
    </div>

  </div>
</body>
</html>`;
}

function buildWelcomeText(email) {
  return `WORLD WAR WATCH — ARES INTELLIGENCE NETWORK
═══════════════════════════════════════════════

// CLASSIFIED TRANSMISSION
// SECURE CHANNEL ESTABLISHED

Welcome, Operator.

Your intelligence feed has been activated. You are now receiving raw, unfiltered AI-generated situation reports on active global conflicts.

ACTIVE THEATERS:
• US + Israel vs Iran — Strait of Hormuz crisis
• India vs Pakistan — Post-Sindoor tension
• Pakistan vs Afghanistan — Cross-border operations
• Russia vs Ukraine — Year 4 of conflict

WHAT YOU'LL RECEIVE:
• AI-synthesized daily intelligence briefings
• Breaking escalation alerts across all 4 conflict zones
• Economic war impact analysis (oil, gold, currencies)
• Nuclear risk status updates

ACCESS LIVE DASHBOARD: https://ares-ykga.onrender.com

Registered: ${email}
Classification: UNCLASSIFIED // OSINT

─────────────────────────────────────────────
© 2026 World War Watch — AI-generated intelligence from public RSS feeds
Not affiliated with any government or military agency.`;
}

function buildBriefingHTML(briefingText, conflicts, updatedAt) {
  const conflictRows = conflicts.map(c => `
    <div style="background:#080808;border:1px solid #1a1a1a;padding:12px;margin:6px 0;">
      <div style="color:#c01000;font-size:12px;font-weight:bold;">${c.name || 'Unknown'}</div>
      <div style="color:#888;font-size:11px;margin-top:4px;">${c.summary || ''}</div>
      ${c.tension ? `<div style="color:#cc5500;font-size:10px;margin-top:4px;">TENSION: ${c.tension}%</div>` : ''}
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',monospace;">
  <div style="max-width:600px;margin:0 auto;background:#0d0d0d;border:1px solid #1a1a1a;">
    
    <div style="background:linear-gradient(135deg,#0a0808 0%,#1a0505 100%);padding:25px;border-bottom:2px solid #c01000;">
      <div style="font-size:10px;letter-spacing:0.3em;color:#c01000;margin-bottom:6px;">// INTEL BRIEFING — ${updatedAt || new Date().toISOString().split('T')[0]}</div>
      <div style="font-size:24px;font-weight:bold;color:#ffffff;letter-spacing:0.05em;font-family:Georgia,serif;">WORLD WAR WATCH</div>
      <div style="font-size:10px;color:#666;letter-spacing:0.15em;margin-top:3px;">AUTOMATED SITUATION REPORT</div>
    </div>

    <div style="padding:25px;">
      <div style="color:#e8e0d0;font-size:14px;line-height:1.8;white-space:pre-wrap;margin-bottom:20px;">${briefingText}</div>
      
      ${conflictRows ? `
        <div style="color:#c01000;font-size:10px;letter-spacing:0.2em;margin:20px 0 10px;">CONFLICT STATUS</div>
        ${conflictRows}
      ` : ''}
      
      <div style="text-align:center;margin:25px 0;">
        <a href="https://ares-ykga.onrender.com" style="display:inline-block;background:#c01000;color:#fff;padding:12px 30px;text-decoration:none;font-family:Georgia,serif;font-size:14px;letter-spacing:0.05em;border-radius:3px;">VIEW FULL DASHBOARD →</a>
      </div>
    </div>

    <div style="background:#080808;padding:15px 25px;border-top:1px solid #1a1a1a;">
      <div style="color:#333;font-size:10px;letter-spacing:0.1em;text-align:center;line-height:1.6;">
        © 2026 World War Watch — AI-generated from public RSS feeds<br>
        <span style="color:#555;">Not affiliated with any government or military agency.</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { sendWelcomeEmail, sendBriefingEmail };
