// Sign-in of the parent (cloud-sync.md 4.1, 5.1): Better Auth, its tables live in the same database.
//   e-mail and password; a forgotten password is reset with a 6-digit code from a letter (sent through Resend).
//   No Google, no Apple (decided by the owner 2026-11-15: a simple sign-in, no SSO).
//   On the site the session is a cookie; the native apps send it as a bearer token (the bearer plugin).
import { betterAuth } from 'better-auth';
import { emailOTP, bearer } from 'better-auth/plugins';
import { Pool } from '@neondatabase/serverless';
import { PRODUCTION, DB_URL } from './_db.js';

const env = process.env;
export { PRODUCTION };

// who may call the API from a browser or a web view: the site, the two native shells, the game's first address
export const ORIGINS = [
  'https://stickandplay.kids', 'https://www.stickandplay.kids', 'https://stick-and-play.vercel.app',
  'capacitor://localhost', 'https://localhost',
  ...(PRODUCTION ? [] : ['http://localhost:3000', 'http://localhost:3210', 'http://127.0.0.1:3210']),
];

// What the sign-in screen may offer. In production the account is shown only with the Resend key: without letters a
// forgotten password could not be reset. Without any way to sign in the app does not show the account at all.
export const PROVIDERS = env.RESEND_API_KEY || !PRODUCTION ? ['email'] : [];
export const MIN_PASSWORD = 8;

// The letter with a code: the one that sets a new password (type 'forget-password'). The code is never logged in
// production (cloud-sync.md 5.5); on a developer's machine without a Resend key (or with AUTH_DEV_CODES=on) it is
// printed to the console, so a reset can be tried without mail.
const letterOf = (type, otp) => type === 'forget-password'
  ? [`${otp} is your Stick & Play code`, `Your code to set a new password for Stick & Play: ${otp}\n\nIt works for 10 minutes. If you did not ask for it, ignore this letter: your password stays as it is.`]
  : [`${otp} is your Stick & Play code`, `Your code for Stick & Play: ${otp}\n\nIt works for 10 minutes. If you did not ask for it, ignore this letter.`];
async function sendCode({ email, otp, type }) {
  if (!env.RESEND_API_KEY || (!PRODUCTION && env.AUTH_DEV_CODES === 'on')) {
    if (PRODUCTION) throw new Error('RESEND_API_KEY is not set');
    console.log(`[dev] ${type} code for ${email}: ${otp}`);
    return;
  }
  const [subject, text] = letterOf(type, otp);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM || 'Stick & Play <login@stickandplay.kids>', to: [email], subject, text }),
  });
  if (!res.ok) throw new Error('Resend answered ' + res.status);
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL || undefined,   // production: https://stickandplay.kids; otherwise taken from the request
  secret: env.BETTER_AUTH_SECRET,
  database: new Pool({ connectionString: DB_URL }),   // `main` in production, `dev` elsewhere (_db.js)
  trustedOrigins: ORIGINS,
  // The address is not confirmed at sign-up (a simple sign-in). Whoever owns the mailbox can always take the account
  // back with "Forgot password?", and a reset signs out every other session.
  emailAndPassword: { enabled: true, minPasswordLength: MIN_PASSWORD, maxPasswordLength: 128, autoSignIn: true, revokeSessionsOnPasswordReset: true },
  // attempts are counted in the database: a function keeps nothing in memory between requests
  // (AUTH_RATE_LIMIT=off switches it off on a developer's machine, where every request comes from one address)
  rateLimit: { enabled: PRODUCTION || env.AUTH_RATE_LIMIT !== 'off', storage: 'database', window: 60, max: 60 },
  plugins: [
    // the codes set a new password; the sign-in by a code alone makes no new accounts (disableSignUp), and the app
    // does not offer it
    emailOTP({ otpLength: 6, expiresIn: 600, allowedAttempts: 5, storeOTP: 'hashed', sendVerificationOTP: sendCode, disableSignUp: true }),
    bearer(),
  ],
});

// the signed-in parent of a request, or null
export async function accountOf(request) {
  const s = await auth.api.getSession({ headers: request.headers });
  return s && s.user ? { id: s.user.id, email: s.user.email } : null;
}
