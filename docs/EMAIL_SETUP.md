# Email Setup with SendGrid

**Last Updated:** December 4, 2025

This document covers SendGrid configuration for TixPeer, including API setup, domain authentication, and troubleshooting.

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Domain Authentication](#domain-authentication)
3. [Email Templates](#email-templates)
4. [Development Mode](#development-mode)
5. [Troubleshooting](#troubleshooting)
6. [API Endpoints](#api-endpoints)
7. [Technical Details](#technical-details)

---

## Quick Setup

### 1. Create a SendGrid Account (Free)
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day included)
3. Verify your email address

### 2. Get Your API Key
1. Go to [https://app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys)
2. Click "Create API Key"
3. Give it a name (e.g., "TixPeer Dev")
4. Select "Full Access" or "Restricted Access" with Mail Send permissions
5. Copy the API key (it starts with `SG.`)

### 3. Add API Key to .env File
Open `.env` in the project root and add your API key:

```bash
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=your-verified-email@example.com
```

### 4. Configure "From" Email Address

**For Development/Testing:**
- You can use any email address, but it must be verified in SendGrid first
- Go to [Sender Authentication](https://app.sendgrid.com/settings/sender_auth) to verify a single sender

**For Production:**
- Verify your domain (see Domain Authentication section below)
- Use a domain email: `noreply@tixpeer.com`

---

## Domain Authentication

**Important:** Without domain authentication, emails may go to spam folders.

### Why Domain Authentication Matters

Without domain authentication, emails:
- Show "via sendgrid.net" in Gmail
- Have no DKIM cryptographic signature
- Have no SPF record authorizing SendGrid to send for your domain
- Are flagged as potentially suspicious by spam filters

### Step-by-Step Setup

#### Step 1: Access SendGrid Sender Authentication
1. Go to SendGrid dashboard: https://app.sendgrid.com/settings/sender_auth
2. Click **"Authenticate Your Domain"** button

#### Step 2: Configure Domain Settings
1. Select your DNS provider from the dropdown (GoDaddy, Namecheap, Cloudflare, AWS Route 53, etc.)
2. Enter your root domain: `tixpeer.com`
3. **Leave "Automated Security" enabled** (recommended)
4. Click **"Next"**

#### Step 3: Get DNS Records
SendGrid will generate DNS records. You'll typically receive:
- 3 CNAME records (for DKIM and automated security)
- 1 TXT record (for SPF)

Example format:
```
Type: CNAME
Host: s1._domainkey.tixpeer.com
Value: s1.domainkey.u12345.wl.sendgrid.net

Type: CNAME
Host: s2._domainkey.tixpeer.com
Value: s2.domainkey.u12345.wl.sendgrid.net

Type: CNAME
Host: em1234.tixpeer.com
Value: u12345.wl.sendgrid.net

Type: TXT
Host: tixpeer.com
Value: v=spf1 include:sendgrid.net ~all
```

#### Step 4: Add Records to Your DNS Provider
1. Log in to your domain registrar
2. Navigate to DNS settings or DNS management
3. Add each record exactly as provided by SendGrid
4. Save changes

#### Step 5: Verify in SendGrid
1. Return to SendGrid dashboard
2. Click **"Verify"** button
3. Wait for verification (can take up to 48 hours for DNS propagation)
4. Once verified, you'll see a green checkmark

### After Authentication

Once domain authentication is complete:
- Emails will show as coming directly from `tixpeer.com` (no "via sendgrid.net")
- DKIM signature will cryptographically prove email authenticity
- SPF record will authorize SendGrid to send emails for your domain
- Significantly better inbox placement (emails won't go to spam)

---

## Email Templates

The system sends two types of emails:

### 1. Verification Email
- Sent immediately after registration
- Contains a verification link (expires in 24 hours)
- Styled with TixPeer branding

### 2. Welcome Email
- Sent after email verification is complete
- Welcome message with getting started tips

---

## Development Mode

If you leave `SENDGRID_API_KEY` empty in `.env`, the system will log emails to the console instead of sending them:

```bash
SENDGRID_API_KEY=   # Leave empty for console logging
```

The verification link will appear in your backend console logs.

---

## Troubleshooting

### Emails Not Sending
- Check that `SENDGRID_API_KEY` is set in `.env` and starts with `SG.`
- Restart your backend server after adding the API key
- Check backend console for error messages
- Verify your SendGrid account is active and not suspended
- Check that your API key has "Mail Send" permissions

### Emails Going to Spam
- Verify your sender email address in SendGrid
- Complete domain authentication (see above)
- Avoid using generic email addresses like `test@test.com`

### "403 Forbidden" or Sender Authentication Error
- Your FROM_EMAIL must be verified in SendGrid
- Go to Settings → Sender Authentication → Verify Single Sender
- Add and verify the email address you're using in FROM_EMAIL

### Token Expired
- Verification tokens expire after 24 hours
- Use the "Resend Verification Email" button on the registration success page

---

## API Endpoints

The email verification system provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/verify-email?token=xxx` | GET | Verify email with token |
| `/auth/resend-verification` | POST | Resend verification email |

**Resend Verification Request:**
```json
{
  "email": "user@example.com"
}
```

---

## Technical Details

### What is SPF?
Sender Policy Framework (SPF) is a DNS record that specifies which mail servers are allowed to send email on behalf of your domain. It prevents email spoofing.

### What is DKIM?
DomainKeys Identified Mail (DKIM) adds a cryptographic signature to your emails that proves they weren't tampered with and actually came from your domain.

### What is DMARC?
Domain-based Message Authentication, Reporting & Conformance (DMARC) tells receiving mail servers what to do if SPF or DKIM checks fail. This can be added later for additional security.

---

## Configuration Reference

**Environment Variables (`.env`):**
```bash
FROM_EMAIL=tixpeer.service@tixpeer.com
SENDGRID_API_KEY=<your-sendgrid-api-key>
```

> **IMPORTANT:** Never commit API keys to version control. Store them only in `.env` which is in `.gitignore`.

**Backend Email Service:**
- Location: `backend/src/email/email.service.ts`
- Reads `FROM_EMAIL` from environment variables
- Sends verification emails via SendGrid API

---

## Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Sender Authentication Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [API Keys](https://app.sendgrid.com/settings/api_keys)
- [Email Activity](https://app.sendgrid.com/email_activity) - View sent emails and delivery status
