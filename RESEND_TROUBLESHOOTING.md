# Resend Email Bounce Troubleshooting

## Common Reasons for Email Bounces

### 1. Using Default Sender Email
**Problem**: `onboarding@resend.dev` is often blocked or marked as spam

**Solution**: Verify your own domain in Resend
1. Go to Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually 5-15 minutes)
6. Update Vercel environment variable:
   - `RESEND_FROM_EMAIL=noreply@yourdomain.com`

### 2. Invalid Recipient Email
**Problem**: The email address you're sending to doesn't exist or is invalid

**Solution**: 
- Verify the email address is correct
- Try with a different email address
- Check Resend dashboard → **Logs** to see bounce reason

### 3. Domain Not Verified
**Problem**: Using a custom domain that isn't verified

**Solution**: Complete domain verification in Resend dashboard

### 4. Rate Limiting
**Problem**: Exceeded free tier limits (3,000 emails/month)

**Solution**: Check usage in Resend dashboard

## Quick Fixes

### Option 1: Use Resend's Test Domain (Temporary)
For testing, you can use Resend's test domain:
- Set `RESEND_FROM_EMAIL=delivered@resend.dev`
- This only works for testing, not production

### Option 2: Check Resend Dashboard
1. Go to Resend Dashboard → **Logs**
2. Find the failed email
3. Check the bounce reason
4. Common reasons:
   - "Invalid recipient"
   - "Domain not verified"
   - "SPF/DKIM not configured"

### Option 3: Use Get-OTP Endpoint (Temporary Workaround)
Until email is fixed, users can retrieve OTP:

```javascript
// In browser console
fetch('/api/auth/get-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
})
.then(r => r.json())
.then(d => console.log('OTP:', d.code));
```

## Recommended Setup for Production

1. **Verify Your Domain**:
   - Add domain in Resend
   - Add DNS records
   - Wait for verification

2. **Set Environment Variable**:
   ```
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Test**:
   - Send a test email
   - Check Resend logs
   - Verify it arrives in inbox (not spam)

## Alternative: Use Supabase Auth

If Resend continues to have issues, consider using Supabase's built-in email service:
- Supabase handles email delivery
- No additional setup needed
- Uses Supabase's verified domains

## Check Bounce Details

1. Go to Resend Dashboard
2. Click **Logs**
3. Find the bounced email
4. Click on it to see:
   - Bounce reason
   - Error code
   - Recipient email
   - Timestamp

This will tell you exactly why it bounced!

