import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  ADMIN_COOKIE,
  createSessionValue,
  hashIp,
  isAdminPasswordSet,
  safeEqual,
  verifySessionValue,
} from "@/lib/admin/session";

export async function isAdmin() {
  const store = await cookies();
  return verifySessionValue(store.get(ADMIN_COOKIE)?.value);
}

/** Every admin page and server action calls this first. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function clientIpHash() {
  const list = await headers();
  const ip = list.get("x-real-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return hashIp(ip);
}

/* Throttling: 5 failed attempts per 15 minutes per IP hash, and 30 per 15 minutes overall. */
const WINDOW_MS = 15 * 60_000;
const PER_IP = 5;
const GLOBAL = 30;
const memory: { ip: string; at: number }[] = [];

async function recentFailures(ipHash: string) {
  const since = Date.now() - WINDOW_MS;
  const db = getDb();
  if (db) {
    const iso = new Date(since).toISOString();
    const [{ count: own }, { count: all }] = await Promise.all([
      db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).eq("success", false).gte("created_at", iso),
      db.from("admin_login_attempts").select("id", { count: "exact", head: true }).eq("success", false).gte("created_at", iso),
    ]);
    return { own: own ?? 0, all: all ?? 0 };
  }
  while (memory.length && memory[0]!.at < since) memory.shift();
  return { own: memory.filter((entry) => entry.ip === ipHash).length, all: memory.length };
}

async function record(ipHash: string, success: boolean) {
  const db = getDb();
  if (db) {
    await db.from("admin_login_attempts").insert({ ip_hash: ipHash, success });
    return;
  }
  if (!success) memory.push({ ip: ipHash, at: Date.now() });
}

export type LoginResult = { ok: true } | { ok: false; error: "unconfigured" | "throttled" | "invalid" };

export async function login(password: string): Promise<LoginResult> {
  if (!isAdminPasswordSet()) return { ok: false, error: "unconfigured" };
  const ipHash = await clientIpHash();
  const failures = await recentFailures(ipHash);
  if (failures.own >= PER_IP || failures.all >= GLOBAL) return { ok: false, error: "throttled" };

  // Small fixed delay makes guessing slower without hurting a real login.
  await new Promise((resolve) => setTimeout(resolve, 400));
  const valid = safeEqual(password, process.env.ADMIN_PASSWORD!);
  await record(ipHash, valid);
  if (!valid) return { ok: false, error: "invalid" };

  const session = await createSessionValue();
  const store = await cookies();
  store.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expires,
  });
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
