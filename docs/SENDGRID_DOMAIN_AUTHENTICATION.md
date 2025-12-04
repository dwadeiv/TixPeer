# SendGrid Domain Authentication Setup

## Problem
Verification emails from TixPeer are going to Gmail spam folders because the domain `tixpeer.com` is not authenticated with SendGrid.

## Why This Happens
Without domain authentication, emails:
- Show "via sendgrid.net" in Gmail
- Have no DKIM cryptographic signature
- Have no SPF record authorizing SendGrid to send for tixpeer.com
- Are flagged as potentially suspicious by spam filters

## Solution: Authenticate Your Domain

### Step 1: Access SendGrid Sender Authentication
1. Go to SendGrid dashboard: https://app.sendgrid.com/settings/sender_auth
2. Click **"Authenticate Your Domain"** button

### Step 2: Configure Domain Settings
1. Select your DNS provider from the dropdown
   - Common providers: GoDaddy, Namecheap, Cloudflare, AWS Route 53
2. Enter your root domain: `tixpeer.com`
3. **Leave "Automated Security" enabled** (recommended)
   - This allows SendGrid to manage DKIM and SPF via CNAME records
4. Click **"Next"**

### Step 3: Get DNS Records
SendGrid will generate DNS records for you to add. You'll typically receive:
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

### Step 4: Add Records to Your DNS Provider
1. Log in to your domain registrar (where you purchased tixpeer.com)
2. Navigate to DNS settings or DNS management
3. Add each record exactly as provided by SendGrid
4. Save changes

### Step 5: Verify in SendGrid
1. Return to SendGrid dashboard
2. Click **"Verify"** button
3. Wait for verification (can take up to 48 hours for DNS propagation)
4. Once verified, you'll see a green checkmark

## After Authentication

Once domain authentication is complete:
- ✅ Emails will show as coming directly from `tixpeer.com` (no "via sendgrid.net")
- ✅ DKIM signature will cryptographically prove email authenticity
- ✅ SPF record will authorize SendGrid to send emails for your domain
- ✅ Significantly better inbox placement (emails won't go to spam)
- ✅ Improved trust and deliverability rates

## Temporary Workaround (For Testing Only)

While waiting for domain authentication, you can:
1. Mark emails as "Not Spam" in Gmail
2. Add `tixpeer.service@tixpeer.com` to your Gmail contacts
3. This helps future emails from this address reach your inbox

**Note:** This only works for your personal inbox. Other users will still see emails in spam until domain authentication is complete.

## Technical Details

### What is SPF?
Sender Policy Framework (SPF) is a DNS record that specifies which mail servers are allowed to send email on behalf of your domain. It prevents email spoofing.

### What is DKIM?
DomainKeys Identified Mail (DKIM) adds a cryptographic signature to your emails that proves they weren't tampered with and actually came from your domain.

### What is DMARC?
Domain-based Message Authentication, Reporting & Conformance (DMARC) tells receiving mail servers what to do if SPF or DKIM checks fail. This can be added later for additional security.

## Resources

- SendGrid Domain Authentication Docs: https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication
- SendGrid Dashboard: https://app.sendgrid.com/
- Sender Authentication Settings: https://app.sendgrid.com/settings/sender_auth

## Current Configuration

**Environment Variable (`.env`):**
```
FROM_EMAIL=tixpeer.service@tixpeer.com
SENDGRID_API_KEY=<your-sendgrid-api-key>
```

> **IMPORTANT:** Never commit API keys to version control. Store them only in `.env` which is in `.gitignore`.

**Backend Email Service:**
- Location: `backend/src/email/email.service.ts`
- Reads `FROM_EMAIL` from environment variables
- Sends verification emails via SendGrid API
