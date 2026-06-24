import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export type StaffRole = "admin" | "maintain";
export type StaffSession = {
  username: string;
  role: StaffRole;
  exp: number;
};

const tokenMaxAgeSeconds = 8 * 60 * 60;
const passwordIterations = 120_000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest).toString("hex");
  return `${passwordIterations}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [iterationsText, salt, hash] = storedHash.split(":");
  const iterations = Number(iterationsText);

  if (!Number.isInteger(iterations) || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, iterations, passwordKeyLength, passwordDigest);
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

function getTokenSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET or Supabase service secret");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
}

export function createStaffToken(username: string, role: StaffRole) {
  const session: StaffSession = {
    username,
    role,
    exp: Math.floor(Date.now() / 1000) + tokenMaxAgeSeconds
  };
  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}.${signPayload(payload)}`;
}

export function verifyStaffToken(token: string): StaffSession | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload)) as StaffSession;
    if (!session.username || !["admin", "maintain"].includes(session.role) || session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return request.headers.get("x-admin-token") ?? "";
}

export function requireStaff(request: NextRequest, roles: StaffRole[]) {
  const session = verifyStaffToken(getTokenFromRequest(request));

  if (!session || !roles.includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function authenticateStaff(username: string, password: string) {
  const adminUsername = process.env.ADMIN_USERNAME ?? process.env.ADMIN_USER ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? process.env.ADMIN_PIN;

  if (adminPassword && username === adminUsername && password === adminPassword) {
    return { username, role: "admin" as const };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("username, password_hash, role, active")
    .eq("username", username)
    .eq("role", "maintain")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.active || !verifyPassword(password, data.password_hash)) {
    return null;
  }

  return { username: data.username as string, role: "maintain" as const };
}
