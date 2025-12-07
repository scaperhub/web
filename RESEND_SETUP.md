# Resend Email Setup - Quick Guide

## Step 1: Get Your Resend API Key

1. Go to https://resend.com
2. Sign up (free tier: 3,000 emails/month)
3. Go to **API Keys** in the dashboard
4. Click **Create API Key**
5. Give it a name (e.g., "ScaperHub Production")
6. Copy the API key (starts with `re_`)

## Step 2: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add these variables:

### Required:
- **Name**: `RESEND_API_KEY`
- **Value**: Your Resend API key (starts with `re_`)
- **Environment**: Select all (Production, Preview, Development)

### Optional (for custom sender):
- **Name**: `RESEND_FROM_EMAIL`
- **Value**: `noreply@yourdomain.com` (must be verified in Resend)
- **Environment**: Production only

**Note**: By default, it uses `onboarding@resend.dev` which works for testing but you should verify your own domain for production.

## Step 3: Verify Your Domain (Production)

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain
5. Wait for verification (usually a few minutes)
6. Update `RESEND_FROM_EMAIL` to use your verified domain

## Step 4: Redeploy

After adding the environment variable:
1. Vercel will auto-redeploy, or
2. Manually trigger a redeploy from the dashboard

## Step 5: Test

1. Try registering a new account
2. Check your email inbox
3. You should receive the OTP code via email!

## Troubleshooting

### Emails not sending
- ✅ Check `RESEND_API_KEY` is set in Vercel
- ✅ Check Vercel logs for errors
- ✅ Verify API key is correct in Resend dashboard
- ✅ Check Resend dashboard for email logs/delivery status

### Using default sender email
- The default `onboarding@resend.dev` works for testing
- For production, verify your own domain in Resend
- Update `RESEND_FROM_EMAIL` environment variable

### Rate limits
- Free tier: 3,000 emails/month
- Check your usage in Resend dashboard
- Upgrade if needed

## That's it!

Once `RESEND_API_KEY` is set, emails will be sent automatically when users register! 🎉


