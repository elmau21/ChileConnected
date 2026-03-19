import robotsParser from "robots-parser";
import { env } from "../config.js";

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export function withJitter(ms: number, jitterPct = 0.25): number {
  const jitter = ms * jitterPct * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(ms + jitter));
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; baseDelayMs: number; maxDelayMs: number; label?: string },
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = Math.min(opts.maxDelayMs, opts.baseDelayMs * Math.pow(2, attempt));
      await sleep(withJitter(delay));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`retry failed${opts.label ? ` (${opts.label})` : ""}`);
}

export function normalizeText(input: string): string {
  return input
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseMontoCLP(input: string): number | undefined {
  const t = input.replace(/\./g, "").replace(/,/g, "."); // best-effort
  const m = t.match(/\$?\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function parseDateCL(input: string): Date | undefined {
  // Soporta dd/mm/yyyy y dd-mm-yyyy
  const m = input.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return undefined;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

const rp = robotsParser as unknown as (robotsUrl: string, robotsTxt: string) => any;
const robotsCache = new Map<string, any>();

export async function assertRobotsAllowed(url: string): Promise<void> {
  const u = new URL(url);
  const origin = `${u.protocol}//${u.host}`;
  const robotsUrl = `${origin}/robots.txt`;

  let robots = robotsCache.get(origin);
  if (!robots) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10_000);
    const res = await fetch(robotsUrl, {
      headers: { "user-agent": env.SCRAPE_USER_AGENT },
      signal: ac.signal,
    }).finally(() => clearTimeout(t));
    const txt = res.ok ? await res.text() : "";
    robots = rp(robotsUrl, txt);
    robotsCache.set(origin, robots);
  }

  const allowed = robots.isAllowed(url, env.SCRAPE_USER_AGENT);
  if (allowed === false) {
    throw new Error(`Robots.txt bloquea scraping para ${url}`);
  }
}

// Throttle por host para reducir ráfagas (parecer menos "DDoS").
// Funciona serializando las esperas por host con una "cola" interna.
const hostLocks = new Map<string, Promise<void>>();
const hostLastRequest = new Map<string, number>();

export async function throttleByHost(url: string, minIntervalMs: number): Promise<void> {
  const host = new URL(url).host;
  const prev = hostLocks.get(host) ?? Promise.resolve();

  const next = prev.then(async () => {
    const now = Date.now();
    const last = hostLastRequest.get(host) ?? 0;
    const elapsed = now - last;
    const waitMs = minIntervalMs - elapsed;
    if (waitMs > 0) await sleep(withJitter(waitMs));
    hostLastRequest.set(host, Date.now());
  });

  hostLocks.set(host, next);
  await next;
}

