/**
 * API 安全工具函數
 * 包含 API Key 驗證、Rate Limiting、CORS 等
 */

// Rate Limiting 儲存（簡單的內存存儲，生產環境建議使用 Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 驗證 API Key 是否有效
 * @param apiKey - 來自請求的 API Key
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;

  // 從環境變數獲取允許的 API Keys（支援逗號分隔多個 key）
  const validKeys = process.env.OCR_API_KEY?.split(',') || [];

  return validKeys.includes(apiKey.trim());
}

/**
 * 檢查是否超過速率限制
 * @param identifier - 識別符（可以是 API Key、device_id 等）
 * @param limitPerMinute - 每分鐘允許的請求數（默認 10）
 * @returns 是否超過限制
 */
export function isRateLimited(identifier: string, limitPerMinute: number = 10): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分鐘

  const record = rateLimitStore.get(identifier);

  // 如果沒有記錄或已過期，創建新記錄
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  // 檢查是否超過限制
  if (record.count >= limitPerMinute) {
    return true;
  }

  // 增加計數
  record.count += 1;
  rateLimitStore.set(identifier, record);

  return false;
}

/**
 * 獲取剩餘請求次數和重置時間
 * @param identifier - 識別符（可以是 API Key、device_id 等）
 * @param limitPerMinute - 每分鐘限制
 * @returns 剩餘次數和重置時間
 */
export function getRateLimitInfo(identifier: string, limitPerMinute: number = 10): {
  remaining: number;
  resetTime: number;
} {
  const record = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      remaining: limitPerMinute,
      resetTime: now + 60 * 1000,
    };
  }

  return {
    remaining: Math.max(0, limitPerMinute - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * 清理過期的 Rate Limit 記錄（定期調用）
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 每 5 分鐘清理一次過期記錄
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * CORS 檢查（檢查來源是否允許）
 * @param origin - 請求來源
 * @returns 是否允許
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // 從環境變數獲取允許的來源
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  // 如果設定為 '*'，允許所有來源（不建議生產環境使用）
  if (allowedOrigins.includes('*')) return true;

  return allowedOrigins.some(allowed => {
    // 支援通配符匹配，例如 *.example.com
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });
}

/**
 * 設定 CORS 標頭
 * @param origin - 請求來源
 * @returns CORS 標頭對象
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Max-Age': '86400', // 24 小時
  };

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
