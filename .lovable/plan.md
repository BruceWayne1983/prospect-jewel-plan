# Demo Mode — Silent Auto-Login as Emma

## Why auto-login (not "no login")

The app's features are tightly coupled to a real authenticated user:
- ~15 edge functions (Discovery, Emma Assistant, Companies House, Voice-to-CRM, Reports analysis, Geocoding, etc.) reject calls without a valid JWT.
- Pages like Current Accounts, Prospect Discovery, Dashboard, Data Hub, My Reports, Brand Hub all read `user.id` and run `ensureSession()`.
- RLS policies on every table key off `auth.uid()`.

Simply hiding the login screen (current state) will leave the dashboard visible but every action — discovery, AI, voice notes, billing, reports, retailer profiles — will fail silently with 401s or empty data.

The proper demo solution: **auto-sign-in as Emma in the background** whenever no session exists. The user never sees a login screen, and every feature works exactly as it does in production.

## What changes

### 1. `src/hooks/useAuth.tsx` — silent auto-login
- After `getSession()` returns no session, call `supabase.auth.signInWithPassword()` using Emma's credentials baked in for demo mode.
- Show the loader until either the existing session resolves or the auto-login completes.
- If auto-login fails (e.g. wrong password), surface a small toast but still render the app so the cause is visible.

Credentials used for the silent sign-in:
- Email: `emmalouisegregory@yahoo.com`
- Password: `JuneMum43` (the password set earlier this session)

### 2. `src/App.tsx` — re-enable the auth gate
- Restore the `if (!user)` block so the app waits for a real session before rendering routes.
- Because `useAuth` now auto-logs-in, the gate effectively never shows the Auth page during demo.
- `/reset-password` stays public.

### 3. Keep `Auth.tsx` as-is
- Login form still exists as a fallback if auto-login ever fails or the demo creds change.
- Sign-up remains removed.

## Result

- Open the app → brief loader → fully signed-in as Emma → every page, edge function, AI feature, and RLS-protected query works normally.
- No login screen, no manual step.
- Easy to switch back to real login later: remove the auto-sign-in block in `useAuth.tsx`.

## Security note

The demo password will live in the client bundle. That's acceptable here because (per earlier message) the app is already private to your circle and not publicly linked. When you're ready to ship publicly, we remove the auto-login block and the credentials go with it.
