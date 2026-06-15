// Web Push (RFC 8291 aes128gcm + VAPID ES256) implemented with WebCrypto.
// Worker-compatible — no Node crypto dependencies.

import { VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./vapid";

const enc = new TextEncoder();

function b64uEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64uDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

// Build the aes128gcm-encrypted body per RFC 8291.
async function encryptPayload(
  payload: Uint8Array,
  uaPublicRaw: Uint8Array, // 65 bytes uncompressed (client p256dh)
  authSecret: Uint8Array,
): Promise<{ body: Uint8Array; asPublicRaw: Uint8Array }> {
  // 1) Ephemeral server (application server) ECDH keypair
  const asKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));

  // 2) Import UA public key
  const uaPublicKey = await crypto.subtle.importKey(
    "raw",
    uaPublicRaw as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // 3) ECDH -> shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: uaPublicKey },
    asKeyPair.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedBits);

  // 4) PRK_key = HKDF(auth, shared_secret, "WebPush: info\0" || ua || as, 32)
  const info1 = concat(enc.encode("WebPush: info\0"), uaPublicRaw, asPublicRaw);
  const ikm = await hkdf(authSecret, sharedSecret, info1, 32);

  // 5) Salt (16 random bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 6) CEK = HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  // 7) Nonce = HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  // 8) Pad payload: payload || 0x02 (final record delimiter)
  const padded = concat(payload, new Uint8Array([0x02]));

  // 9) AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, [
    "encrypt",
  ]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource },
      aesKey,
      padded as BufferSource,
    ),
  );

  // 10) Header: salt(16) || rs(4 BE = 4096) || idlen(1 = 65) || keyid(65)
  const rs = new Uint8Array([0, 0, 0x10, 0x00]); // 4096
  const header = concat(
    salt,
    rs,
    new Uint8Array([uaPublicRaw.length === 65 ? 65 : asPublicRaw.length]),
    asPublicRaw,
  );
  const body = concat(header, ciphertext);
  return { body, asPublicRaw };
}

// Build a VAPID ES256 JWT for the given audience (origin of endpoint).
async function buildVapidJwt(audience: string): Promise<string> {
  const privRaw = process.env.VAPID_PRIVATE_KEY;
  if (!privRaw) throw new Error("VAPID_PRIVATE_KEY not configured");

  const header = { typ: "JWT", alg: "ES256" };
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  const payload = { aud: audience, exp, sub: VAPID_SUBJECT };

  const encHeader = b64uEncode(enc.encode(JSON.stringify(header)));
  const encPayload = b64uEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${encHeader}.${encPayload}`;

  // Reconstruct JWK from raw private d and the known public key (x, y)
  const pubRaw = b64uDecode(VAPID_PUBLIC_KEY); // 0x04 || X || Y
  const x = pubRaw.slice(1, 33);
  const y = pubRaw.slice(33, 65);
  const d = b64uDecode(privRaw);

  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: b64uEncode(x),
      y: b64uEncode(y),
      d: b64uEncode(d),
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      enc.encode(signingInput) as BufferSource,
    ),
  );
  return `${signingInput}.${b64uEncode(sig)}`;
}

export interface PushSub {
  endpoint: string;
  p256dh: string; // base64url
  auth: string; // base64url
}

export async function sendWebPush(
  sub: PushSub,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    data?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const audience = new URL(sub.endpoint).origin;
  const jwt = await buildVapidJwt(audience);

  const payloadBytes = enc.encode(JSON.stringify(payload));
  const { body } = await encryptPayload(payloadBytes, b64uDecode(sub.p256dh), b64uDecode(sub.auth));

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: body as BodyInit,
  });

  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
