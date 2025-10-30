import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

// 固定的 bucket 名稱
const BUCKET_NAME = 'health-scan';

/**
 * 初始化 R2 客戶端（延遲初始化以確保環境變數已載入）
 */
function getR2Client() {
  // 檢查環境變數
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error('R2 環境變數缺失:', {
      hasEndpoint: !!endpoint,
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
    });
    throw new Error('R2 credentials not configured');
  }

  // 只在開發環境輸出 debug 資訊
  if (process.env.NODE_ENV === 'development') {
    console.log('[R2] 連接成功');
  }

  return new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/**
 * 生成 6 位數小寫亂碼
 */
function generateRandomCode(): string {
  return randomBytes(3).toString('hex'); // 3 bytes = 6 hex characters
}

/**
 * 將 base64 圖片上傳到 Cloudflare R2
 * @param imageBase64 - Base64 編碼的圖片（可以包含 data URI 前綴）
 * @param countryCode - 國碼（如 TW、HK），如果沒有則使用 XX
 * @returns R2 object key（例如：TW_abc123.png）
 */
export async function uploadImageToR2(
  imageBase64: string,
  countryCode?: string | null
): Promise<string> {
  try {
    // 移除 data URI 前綴（如果有）
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // 從 data URI 中提取圖片類型
    const imageTypeMatch = imageBase64.match(/^data:image\/(\w+);base64,/);
    const imageType = imageTypeMatch ? imageTypeMatch[1] : 'png';
    const contentType = `image/${imageType}`;

    // 轉換為 Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // 生成檔名：[國碼]_[6位數小寫亂碼].[副檔名]
    const country = (countryCode || 'XX').toUpperCase();
    const randomCode = generateRandomCode();
    const fileName = `${country}_${randomCode}.${imageType}`;

    // 上傳到 R2
    const r2Client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // 返回 R2 object key（格式：ocr-health/2025/10/uuid.png）
    return fileName;

  } catch (error) {
    console.error('R2 上傳失敗:', error);
    throw new Error('Failed to upload image to R2');
  }
}
