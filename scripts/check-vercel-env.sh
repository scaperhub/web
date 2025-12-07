#!/bin/bash
# Quick script to check if environment variables are set in Vercel
# Note: This requires Vercel CLI to be installed and logged in

echo "🔍 Checking Vercel Environment Variables..."
echo ""

if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI not found. Install it with: npm i -g vercel"
  echo ""
  echo "Or check manually in Vercel Dashboard:"
  echo "   Settings → Environment Variables"
  exit 1
fi

echo "Checking environment variables..."
vercel env ls 2>/dev/null | grep -E "SUPABASE|USE_SUPABASE" || echo "⚠️  No Supabase variables found. Make sure you're in the right project directory."

echo ""
echo "✅ If you see the variables above, they're set!"
echo "⚠️  If not, add them in Vercel Dashboard → Settings → Environment Variables"
