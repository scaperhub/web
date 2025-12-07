# Email Setup for OTP

Currently, OTP codes are stored in the database but not sent via email. Here are options to set up email sending:

## Quick Solution: Get OTP from Database (Development)

For testing, you can retrieve the OTP code:

1. After registering, the OTP is stored in the database
2. In development mode, the registration page will try to show the OTP
3. Or use the API endpoint:

```javascript
// In browser console
fetch('/api/auth/get-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com' })
})
.then(r => r.json())
.then(d => console.log('OTP Code:', d.code));
```

## Production Email Solutions

### Option 1: Resend (Recommended - Easiest)

1. Sign up at https://resend.com
2. Get your API key
3. Add to Vercel environment variables:
   - `RESEND_API_KEY=your-api-key`
4. Install Resend:
   ```bash
   npm install resend
   ```
5. Uncomment and configure the Resend code in `lib/otp.ts`

### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Create API key
3. Add to Vercel:
   - `SENDGRID_API_KEY=your-api-key`
4. Install SendGrid:
   ```bash
   npm install @sendgrid/mail
   ```
5. Update `lib/otp.ts` to use SendGrid

### Option 3: AWS SES

1. Set up AWS SES
2. Get credentials
3. Add to Vercel:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
4. Install AWS SDK:
   ```bash
   npm install @aws-sdk/client-ses
   ```

### Option 4: Supabase Auth (Alternative)

If you want to use Supabase's built-in authentication instead of custom OTP:
- Use Supabase Auth for email verification
- Simpler but less control over the flow

## Quick Implementation with Resend

1. **Sign up**: https://resend.com (free tier: 3,000 emails/month)

2. **Get API key**: Dashboard → API Keys → Create

3. **Add to Vercel**:
   - Settings → Environment Variables
   - `RESEND_API_KEY` = your-api-key

4. **Update code**:
   ```bash
   npm install resend
   ```

5. **Uncomment Resend code in `lib/otp.ts`** and update the `from` email

6. **Verify your domain** in Resend (for production)

## Testing

After setting up email:
1. Register a new account
2. Check your email inbox
3. Use the OTP code to verify

## Current Status

- ✅ OTP is generated and stored
- ✅ OTP can be retrieved via API (development)
- ❌ Email sending not implemented (needs email service)

