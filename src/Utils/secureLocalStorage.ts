import type { FacturaTempo } from "@/Interfaces/Crm/CartPCGInterface";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/** Permitir objetos tipados (interfaces) mientras sean "object" */
type JsonInput = JsonValue | object;

type EnvelopeV1 = {
  v: 1;
  alg: "AES-GCM";
  iv: string;   // base64
  salt: string; // base64
  ct: string;   // base64
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function toArrayBufferCopy(u8: Uint8Array): ArrayBuffer {
  const out = new Uint8Array(u8.byteLength);
  out.set(u8);
  return out.buffer;
}

async function deriveKey(secret: string, saltU8: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBufferCopy(saltU8),
      iterations: 120_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Aceptar objetos tipados (FacturaTempo) sin exigir index signature.
 * Nota: en runtime igual se serializa con JSON.stringify.
 */
async function encryptJson<T extends JsonInput>(
  value: T,
  secret: string
): Promise<EnvelopeV1> {
  const ivU8 = crypto.getRandomValues(new Uint8Array(12));
  const saltU8 = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(secret, saltU8);

  const plainU8 = enc.encode(JSON.stringify(value));

  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBufferCopy(ivU8) },
    key,
    toArrayBufferCopy(plainU8)
  );

  return {
    v: 1,
    alg: "AES-GCM",
    iv: toBase64(ivU8),
    salt: toBase64(saltU8),
    ct: toBase64(new Uint8Array(cipherBuf)),
  };
}

async function decryptJson<T>(env: EnvelopeV1, secret: string): Promise<T> {
  const ivU8 = fromBase64(env.iv);
  const saltU8 = fromBase64(env.salt);
  const ctU8 = fromBase64(env.ct);

  const key = await deriveKey(secret, saltU8);

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBufferCopy(ivU8) },
    key,
    toArrayBufferCopy(ctU8)
  );

  const json = dec.decode(plainBuf);
  return JSON.parse(json) as T;
}

function getSecret(): string {
  const secret = (import.meta.env.VITE_LS_SECRET ?? "").toString().trim();
  if (!secret) throw new Error("Falta VITE_LS_SECRET en .env");
  return secret;
}

export async function secureSet<T extends FacturaTempo>(
  key: string,
  value: T
): Promise<void> {
  const secret = getSecret();
  const env = await encryptJson(value, secret);
  localStorage.setItem(key, JSON.stringify(env));
}

export async function secureGet<T>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as EnvelopeV1;
    if (!parsed || parsed.v !== 1 || parsed.alg !== "AES-GCM") return null;

    const secret = getSecret();
    return await decryptJson<T>(parsed, secret);
  } catch {
    return null;
  }
}

export function secureRemove(key: string): void {
  localStorage.removeItem(key);
}