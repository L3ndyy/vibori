import crypto from "crypto";

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Validates the authentication payload from Telegram Login Widget
 */
export function verifyTelegramLogin(data: TelegramAuthData, botToken: string): boolean {
  if (!botToken) {
    // If bot token is not configured (e.g. dev mode), allow if explicitly permitted
    return false;
  }

  const { hash, ...rest } = data;
  if (!hash) return false;

  // Build data-check-string (alphabetically sorted key=value lines)
  const checkArr: string[] = [];
  const keys = Object.keys(rest).sort();
  for (const key of keys) {
    const val = (rest as Record<string, unknown>)[key];
    if (val !== undefined && val !== null) {
      checkArr.push(`${key}=${val}`);
    }
  }
  const dataCheckString = checkArr.join("\n");

  // Secret key = SHA256(botToken)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // HMAC-SHA256
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return hmac === hash;
}

/**
 * Validates Telegram Mini App initData string
 */
export function verifyTelegramWebApp(initData: string, botToken: string): boolean {
  if (!botToken || !initData) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) return false;

  urlParams.delete("hash");
  const params: string[] = [];
  Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, val]) => {
      params.push(`${key}=${val}`);
    });
  const dataCheckString = params.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}
