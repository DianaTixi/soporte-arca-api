const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION = "v1";

const getSecretKey = () => {
  const raw =
    process.env.IA_CONFIG_SECRET ||
    process.env.IA_CONFIG_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "";
  if (!raw) return null;
  return crypto.createHash("sha256").update(String(raw)).digest();
};

const encryptSecret = (plainText) => {
  const text = String(plainText || "").trim();
  if (!text) return null;

  const key = getSecretKey();
  if (!key) {
    throw new Error("No hay clave de cifrado configurada (IA_CONFIG_SECRET o JWT_SECRET).");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

const decryptSecret = (encryptedText) => {
  if (!encryptedText) return null;
  const raw = String(encryptedText);

  // Compatibilidad con valores antiguos en texto plano
  if (!raw.startsWith(`${VERSION}:`)) return raw;

  const key = getSecretKey();
  if (!key) {
    throw new Error("No hay clave de cifrado configurada para descifrar secretos.");
  }

  const parts = raw.split(":");
  if (parts.length !== 4) {
    throw new Error("Formato de secreto cifrado inválido.");
  }

  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const data = Buffer.from(parts[3], "base64");

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
};

const maskSecret = (plainText) => {
  const text = String(plainText || "").trim();
  if (!text) return null;
  if (text.length <= 8) return `${text[0]}***${text[text.length - 1] || ""}`;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
};

module.exports = {
  encryptSecret,
  decryptSecret,
  maskSecret,
};
