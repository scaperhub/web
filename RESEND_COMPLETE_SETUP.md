# Complete Resend Setup Guide

## Step 1: Create Resend Account

1. Go to https://resend.com
2. Click **Sign Up** (or **Log In** if you have an account)
3. Sign up with your email or GitHub
4. Verify your email address

## Step 2: Get Your API Key

1. Once logged in, you'll see the Resend Dashboard
2. Click **API Keys** in the left sidebar
3. Click **Create API Key** button
4. Give it a name: `ScaperHub Production` (or any name you prefer)
5. Select permissions: **Full Access** (or just **Sending Access**)
6. Click **Add**
7. **IMPORTANT**: Copy the API key immediately (starts with `re_`)
   - You won't be able to see it again!
   - It looks like: `re_123456789abcdefghijklmnop`

## Step 3: Add API Key to Vercel

1. Go to https://vercel.com/dashboard
2. Click on your **ScaperHub project**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Paste your API key (the `re_...` string)
   - **Environment**: Check all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
6. Click **Save**

## Step 4: Verify Your Domain (IMPORTANT - Prevents Bounces!)

### Option A: Use Your Own Domain (Recommended for Production)

1. In Resend Dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com` or `scaperhub.com`)
4. Click **Add**
5. Resend will show you DNS records to add:
   - **SPF Record** (TXT record)
   - **DKIM Record** (TXT record)
   - **DMARC Record** (optional but recommended)

6. Add these DNS records to your domain:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS settings
   - Add the TXT records Resend provides
   - Wait 5-15 minutes for DNS propagation

7. Check verification status in Resend Dashboard
   - Status should change to "Verified" ✅

8. Add to Vercel environment variables:
   - **Key**: `RESEND_FROM_EMAIL`
   - **Value**: `noreply@yourdomain.com` (use your verified domain)
   - **Environment**: Production only

### Option B: Use Resend Test Domain (Quick Testing Only)

For quick testing without domain verification:

1. In Vercel, add environment variable:
   - **Key**: `RESEND_FROM_EMAIL`
   - **Value**: `delivered@resend.dev`
   - **Environment**: All

**Note**: This only works for testing. For production, you MUST verify your own domain.

## Step 5: Redeploy Your Project

After adding environment variables:

1. Vercel will automatically detect the change
2. Or manually trigger: **Deployments** → **Redeploy**
3. Wait 1-2 minutes for deployment

## Step 6: Test Email Sending

1. Go to your deployed site
2. Try registering a new account
3. Check your email inbox
4. You should receive the OTP code!

## Step 7: Check Resend Dashboard

1. Go to Resend Dashboard → **Logs**
2. You should see:
   - ✅ Successful sends (green)
   - ❌ Any bounces or failures (red)
3. Click on any email to see details

## Troubleshooting

### Emails Still Bouncing?

1. **Check Resend Logs**:
   - Go to Dashboard → Logs
   - Click on the failed email
   - Read the error message

2. **Common Issues**:
   - ❌ "Domain not verified" → Complete Step 4
   - ❌ "Invalid recipient" → Check email address
   - ❌ "SPF not configured" → Add SPF DNS record
   - ❌ "Rate limit exceeded" → Check your usage

3. **Verify DNS Records**:
   - Use a DNS checker tool: https://mxtoolbox.com
   - Enter your domain
   - Check if SPF and DKIM records are present

### Still Not Working?

Use the get-otp endpoint as a temporary workaround:

```javascript
// In browser console after registration
fetch('/api/auth/get-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com' })
})
.then(r => r.json())
.then(d => console.log('OTP:', d.code));
```

## Quick Checklist

- [ ] Resend account created
- [ ] API key generated and copied
- [ ] `RESEND_API_KEY` added to Vercel
- [ ] Domain verified (or using test domain)
- [ ] `RESEND_FROM_EMAIL` set (if using custom domain)
- [ ] Project redeployed
- [ ] Test registration completed
- [ ] Email received successfully

## Free Tier Limits

- **3,000 emails/month** (free tier)
- Check usage in Resend Dashboard → **Usage**
- Upgrade if you need more

## Security Notes

- ✅ Never commit API keys to git
- ✅ Use environment variables only
- ✅ Rotate API keys periodically
- ✅ Use different keys for dev/prod if needed

## That's It!

Once setup is complete, your users will receive OTP codes via email automatically! 🎉


