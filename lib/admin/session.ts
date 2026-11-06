/*
 * Admin session cookie, signed with HMAC-SHA256 through Web Crypto so the same code
 * runs in proxy.ts and in server components / actions.
 * Cookie value: "<expiresAtMs>.<base64url signature>".
 */

export const ADMIN_COOKIE = "rp_admin";
export const SESSION_HOURS = 12;
export const SESSION_MS = SESSION_HOURS * 3_600_000;

const encoder = new TextEncoder();

function secret() {
  // A dedicated secret is better; falling back to the password keeps setup to one variable.
  // Changing either value signs every admin out.
  const value = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  return value ? `roma-pack-admin:${value}` : null;
}

export function isAdminPasswordSet() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8);
}

function toBase64Url(bytes: ArrayBuffer) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(key: string, message: string) {
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message)));
}

/** Length-safe constant-time comparison. */
export function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  return diff === 0;
}

export async function createSessionValue(now = Date.now()) {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD is not set");
  const expires = now + SESSION_MS;
  return { value: `${expires}.${await hmac(key, `session:${expires}`)}`, expires: new Date(expires) };
}

export async function verifySessionValue(value: string | undefined | null, now = Date.now()) {
  const key = secret();
  if (!key || !value) return false;
  const [expiresRaw, signature] = value.split(".");
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires < now || expires > now + SESSION_MS + 60_000) return false;
  return safeEqual(signature, await hmac(key, `session:${expires}`));
}

/** One-way hash used for login throttling and visitor bans. The raw IP is never stored. */
export async function hashIp(ip: string) {
  const key = secret() ?? "roma-pack";
  return (await hmac(`ip:${key}`, ip)).slice(0, 32);
}
