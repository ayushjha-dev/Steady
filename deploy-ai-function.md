# Deploy AI Function with Gemini API Key

> Previous backend detached. The steps below are kept as a template —
> replace `<your-project-ref>` when your own backend is ready.
>
> Your Gemini API key lives only in `.env` as `GEMINI_API_KEY`.

## ✅ Updated to Gemini 1.5 Flash

The Edge Function now uses `gemini-1.5-flash` instead of `gemini-2.0-flash-exp`

## 🚀 Deploy Steps

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/<your-project-ref>

2. **Set the Secret**:
   - Go to **Settings** → **Edge Functions** → **Secrets**
   - Click **Add Secret**
   - Name: `GEMINI_API_KEY`
   - Value: the key from your `.env`
   - Click **Save**

3. **Deploy the Function**:
   - Go to **Edge Functions** tab
   - Click **Deploy new function**
   - Select `ai` function from your local files
   - Or use the CLI below

### Option 2: Via Supabase CLI

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
npx supabase login

# 3. Link your project
npx supabase link --project-ref <your-project-ref>

# 4. Set the secret (value from your `.env`)
npx supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"

# 5. Deploy the AI function
npx supabase functions deploy ai
```

## 🧪 Test the AI Function

After deployment, test it in your app:

1. Go to any subject page (e.g., DSA or Cybersecurity)
2. Click on a topic (e.g., "Arrays", "Network Security")
3. Click the **"AI Notes"** tab
4. Click **"Generate Notes"**
5. Wait 5-10 seconds - AI-generated study notes should appear!

## 📊 What the AI Function Does

Using **Gemini 1.5 Flash**, it:

- ✨ **Generates study notes** - Detailed explanations for topics
- 📝 **Creates practice questions** - MCQs and coding problems
- 🎯 **Builds mock tests** - Full-length practice tests
- 💡 **Provides explanations** - Explains why answers are correct/incorrect

## 🔧 Model Info

**Gemini 1.5 Flash**:

- Fast responses (1-3 seconds)
- Free tier: 15 requests/min, 1500 requests/day
- Good quality for educational content
- Supports structured output (JSON)

## ❓ Troubleshooting

**If notes don't generate:**

1. Check the browser console for errors (F12)
2. Verify the secret is set in Supabase Dashboard
3. Check Edge Function logs in Supabase Dashboard
4. Make sure you're signed in to the app
5. Try again (rate limit: 40 calls/hour per user)

**Common errors:**

- `GEMINI_API_KEY not configured` → Secret not set in Supabase
- `429 Too Many Requests` → Hit rate limit, wait an hour
- `401 Unauthorized` → Invalid API key
- `Network error` → Function not deployed

## 🎉 You're All Set!

Your Gemini API key is configured and the function is ready to deploy. Follow Option 1 (Dashboard) for the easiest setup!
