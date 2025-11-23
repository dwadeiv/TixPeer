# Email Verification Setup with SendGrid

The email verification system is now configured to send real emails using [SendGrid](https://sendgrid.com).

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
```

### 4. Configure "From" Email Address

**For Development/Testing:**
- You can use any email address, but it must be verified in SendGrid first
- Go to [Sender Authentication](https://app.sendgrid.com/settings/sender_auth) to verify a single sender
- Update the `.env` file:
```bash
FROM_EMAIL=your-verified-email@example.com
```

**For Production:**
1. Verify your domain in SendGrid dashboard (Settings → Sender Authentication)
2. Configure DNS records (SPF, DKIM) as instructed by SendGrid
3. Update the `.env` file:
```bash
FROM_EMAIL=noreply@yourdomain.com
```

## Testing the Email Flow

1. Start your backend server (if not already running):
```bash
npm run dev
```

2. Register a new user at `http://localhost:3000/register` using **your real email address**

3. Check your inbox for the verification email from your configured FROM_EMAIL address

4. Click the verification link in the email

5. You'll be redirected to the success page and then to login

## Development Mode (No Email)

If you leave `SENDGRID_API_KEY` empty in `.env`, the system will log emails to the console instead of sending them. This is useful for development when you don't want to send real emails:

```bash
SENDGRID_API_KEY=   # Leave empty for console logging
```

The verification link will appear in your backend console logs.

## Email Templates

The system sends two types of emails:

### 1. Verification Email
- Sent immediately after registration
- Contains a verification link (expires in 24 hours)
- Styled with your TixPeer branding

### 2. Welcome Email
- Sent after email verification is complete
- Welcome message with getting started tips

## Troubleshooting

### Emails Not Sending
- Check that `SENDGRID_API_KEY` is set in `.env` and starts with `SG.`
- Restart your backend server after adding the API key
- Check backend console for error messages
- Verify your SendGrid account is active and not suspended
- Check that your API key has "Mail Send" permissions

### Emails Going to Spam
- Verify your sender email address in SendGrid
- For production, verify your domain and configure SPF/DKIM records
- Avoid using generic email addresses like `test@test.com`

### "403 Forbidden" or Sender Authentication Error
- Your FROM_EMAIL must be verified in SendGrid
- Go to Settings → Sender Authentication → Verify Single Sender
- Add and verify the email address you're using in FROM_EMAIL

### Token Expired
- Verification tokens expire after 24 hours
- Use the "Resend Verification Email" button on the registration success page

## Production Deployment

For production, make sure to:
1. Verify your domain in SendGrid (Settings → Sender Authentication → Domain Authentication)
2. Configure DNS records (SPF, DKIM, DMARC) for your domain
3. Set `FROM_EMAIL` to your domain email (e.g., `noreply@yourdomain.com`)
4. Set `FRONTEND_URL` to your production domain
5. Keep `SENDGRID_API_KEY` secret (don't commit to git)
6. Consider upgrading your SendGrid plan if you need more than 100 emails/day

## API Documentation

The email verification system adds these endpoints:

- `GET /auth/verify-email?token=xxx` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email
  ```json
  {
    "email": "user@example.com"
  }
  ```

## SendGrid Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Sender Authentication Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [API Keys](https://app.sendgrid.com/settings/api_keys)
- [Email Activity](https://app.sendgrid.com/email_activity) - View sent emails and delivery status
