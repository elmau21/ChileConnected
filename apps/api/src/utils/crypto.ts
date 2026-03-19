/**
 * Cifrado y hash para datos sensibles (RUT, etc.).
 * Usa AES-256-GCM (estándar, seguro) y SHA-256 para lookup sin revelar el valor.
 * No implementamos criptografía propia: solo la API estándar de Node.
 */

import crypto from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

/**
 * Obtiene la clave de cifrado desde env (32 bytes).
 * Formato esperado: 64 caracteres hex (32 bytes) o 44 caracteres base64 (32 bytes).
 */
export function getEncryptionKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return Buffer.from(raw, "base64");
  } catch {
    return null;
  }
}

/**
 * Cifra con AES-256-GCM (IV aleatorio por mensaje).
 * Formato guardado: base64( iv (12) || authTag (16) || ciphertext ).
 */
export function encrypt(plaintext: string): string | null {
  const key = getEncryptionKey();
  if (!key || key.length !== KEY_LEN) return null;
  try {
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALG, key, iv, { authTagLength: TAG_LEN });
    const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString("base64");
  } catch {
    return null;
  }
}

/**
 * Descifra un blob producido por encrypt().
 */
export function decrypt(ciphertext: string): string | null {
  const key = getEncryptionKey();
  if (!key || key.length !== KEY_LEN) return null;
  try {
    const buf = Buffer.from(ciphertext, "base64");
    if (buf.length < IV_LEN + TAG_LEN) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALG, key, iv, { authTagLength: TAG_LEN });
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final("utf8");
  } catch {
    return null;
  }
}

/** Salt fijo para hash de RUT (no es secreto; solo evita tablas precomputadas por servicio). */
const RUT_HASH_PEPPER = "ChileConnected-rut-v1";

/**
 * Hash determinista del RUT normalizado para búsqueda en BD sin almacenar el RUT en claro.
 * SHA-256(pepper + rut). No reversible.
 */
export function hashForLookup(rutNormalized: string): string {
  return crypto.createHash("sha256").update(RUT_HASH_PEPPER + rutNormalized, "utf8").digest("hex");
}

export const isEncryptionAvailable = (): boolean => getEncryptionKey() !== null;
