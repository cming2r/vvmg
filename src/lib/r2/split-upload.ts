import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

const BUCKET_NAME = 'whosplit';
const PUBLIC_R2_URL = 'https://pub-9c07bd3fb8fc467280e276ebfdbfd8c8.r2.dev';

function getR2Client() {
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

function generateRandomCode(): string {
  return randomBytes(3).toString('hex');
}

/**
 * 上傳收據圖片到 R2 whosplit bucket
 * 檔名格式：{countryCode}_{currencyCode}_{randomId}.jpg
 * @param imageBase64 - Base64 編碼的圖片（可含 data URI 前綴）
 * @param countryCode - 裝置國碼（如 TW）
 * @param currencyCode - 消費幣種（如 JPY）
 * @returns 完整的公開 URL
 */
export async function uploadReceiptToR2(
  imageBase64: string,
  countryCode?: string | null,
  currencyCode?: string | null
): Promise<string> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const country = (countryCode || 'XX').toUpperCase();
    const currency = (currencyCode || 'XXX').toUpperCase();
    const randomCode = generateRandomCode();
    const fileName = `${country}_${currency}_${randomCode}.jpg`;

    const r2Client = getR2Client();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/jpeg',
    });

    await r2Client.send(command);

    return `${PUBLIC_R2_URL}/${fileName}`;
  } catch (error) {
    console.error('R2 收據上傳失敗:', error);
    throw new Error('Failed to upload receipt image to R2');
  }
}
