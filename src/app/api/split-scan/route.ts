import { NextResponse, after } from 'next/server';
import { generateText } from 'ai';
import { getCorsHeaders } from '@/lib/api/security';
import { uploadReceiptToR2 } from '@/lib/r2/split-upload';
import { logSplitScan } from '@/lib/supabase/split-scan-logs';

export const maxDuration = 60;

/**
 * 收據處理 API
 * - action: "scan"   → OCR 辨識 + 上傳圖片到 R2（預設）
 * - action: "upload" → 僅上傳圖片到 R2（手動加照片用）
 */

export interface ReceiptOCRResult {
  success: boolean;
  amount: number | null;
  currency: string | null;
  date: string | null;
  time: string | null;
  merchantName: string | null;
  subtitle: string | null;
  address: string | null;
  items: ReceiptItem[];
  rawText: string;
  confidence: number;
  image_urls: string[];
  error?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await req.json();
    const { action = 'scan' } = body;

    // ── Delete images（刪除帳號時清理 R2 圖片）──
    if (action === 'delete-images') {
      const fileNames: string[] = body.file_names ?? [];
      if (fileNames.length > 0) {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const { getR2Client, BUCKET_NAME } = await import('@/lib/r2/split-upload');
        const r2Client = getR2Client();
        await Promise.all(
          fileNames.map((name: string) =>
            r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: name })).catch(() => {})
          )
        );
      }
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // 單張圖片：支援 images[0] 或 image
    const image: string | undefined = body.images?.[0] ?? body.image;
    const imageUrlInput: string | undefined = body.image_urls?.[0];

    if (!image && !imageUrlInput) {
      return NextResponse.json(
        { success: false, error: 'Missing image data' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { country_code, currency_code } = body;

    // ── Upload only（手動加照片，不需 OCR）──
    if (action === 'upload') {
      if (!image) {
        return NextResponse.json(
          { success: false, error: 'Missing image data' },
          { status: 400, headers: corsHeaders }
        );
      }
      const url = await uploadReceiptToR2(image, country_code, currency_code);
      return NextResponse.json({ success: true, image_urls: [url] }, { headers: corsHeaders });
    }

    // ── Scan: OCR + 上傳 R2 ──
    const { language = 'zh-Hant' } = body;

    let resolvedUrl: string;
    if (imageUrlInput) {
      resolvedUrl = imageUrlInput;
    } else {
      resolvedUrl = await uploadReceiptToR2(image!, country_code, currency_code);
    }

    const ocrResponse = await generateText({
        model: 'google/gemini-3.1-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `請仔細分析這張發票或收據照片，提取以下資訊。
發票語言提示：${language}

**需要提取的資訊：**
1. **總金額** (amount) - 最終需付金額，找 "總計"、"合計"、"Total"、"應付金額" 等
2. **幣種** (currency) - 識別幣種代碼：
   - NT$, TWD, 元 → "TWD"
   - $, USD → "USD"
   - ¥, JPY, 円 → "JPY"
   - ¥, CNY, 人民币 → "CNY"
   - €, EUR → "EUR"
   - ₩, KRW → "KRW"
   - 其他請返回對應的 ISO 4217 代碼
3. **日期** (date) - 格式 YYYY-MM-DD
4. **時間** (time) - 格式 HH:mm（24小時制）
5. **商家名稱** (merchantName) - 品牌名或公司名（如 UNIQLO、全家、星巴克）
6. **分店名** (subtitle) - 分店名或門市名（如 次郎店、信義門市、台北101店）
7. **地址** (address) - 商家地址
8. **消費明細** (items) - 每個品項包含：
   - name: 品名
   - quantity: 數量
   - unitPrice: 單價
   - totalPrice: 小計

**識別優先順序：**
1. 先找總金額（通常在發票底部，字體較大）
2. 再識別幣種符號
3. 提取日期和時間（可能在頂部或底部）
4. 識別商家名稱（通常在發票頂部）
5. 最後提取明細項目

**返回格式（純 JSON，不要 markdown 包裝）：**
{
  "amount": 1234.56,
  "currency": "TWD",
  "date": "2024-01-15",
  "time": "14:30",
  "merchantName": "全家",
  "subtitle": "信義門市",
  "address": "台北市信義區信義路五段7號",
  "items": [
    {"name": "咖啡", "quantity": 2, "unitPrice": 45, "totalPrice": 90},
    {"name": "三明治", "quantity": 1, "unitPrice": 65, "totalPrice": 65}
  ],
  "confidence": 0.95
}

**重要規則：**
- amount 必須是數字類型，不含幣種符號
- 如果找不到某個欄位，設為 null
- confidence 為 0-1 之間的信心分數
- items 如果無法識別則返回空陣列 []
- 只返回 JSON，不要任何其他文字
- **務必包含所有折扣、優惠、回饋、折讓行**（如「會員折扣 -50」、「滿額折抵」、「紅利折抵」等），這些項目的 totalPrice 為負數
- **items 的 totalPrice 加總必須等於 amount**，如果不一致請重新檢查是否遺漏了折扣或優惠項目

請開始分析這張圖片：`
              },
              {
                type: 'image' as const,
                image: new URL(resolvedUrl),
              },
            ]
          }
        ],
        temperature: 0.1,
      });

    const result = parseReceiptOCRResponse(ocrResponse.text);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Split Scan] OCR 結果:', ocrResponse.text);
    } else {
      console.log('[Split Scan] OCR 完成');
    }

    // 先回傳結果，背景記錄到 Supabase
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    after(async () => {
      try {
        await logSplitScan({
          image_urls: [resolvedUrl],
          ocr_result: { ...result, rawText: undefined },
          device_id: body.device_id || null,
          country_code: country_code || null,
          currency_code: currency_code || null,
          add_from: body.add_from || null,
          ip_address,
        });
      } catch (logError) {
        console.error('[Split Scan] 記錄保存失敗:', logError);
      }
    });

    return NextResponse.json(
      { ...result, image_urls: [resolvedUrl] },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Split Scan] 處理錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        amount: null,
        currency: null,
        date: null,
        time: null,
        merchantName: null,
        subtitle: null,
        address: null,
        items: [],
        rawText: '',
        confidence: 0,
        image_urls: [],
        error: 'Internal server error',
      } as ReceiptOCRResult,
      { status: 500, headers: corsHeaders }
    );
  }
}

function parseReceiptOCRResponse(text: string): Omit<ReceiptOCRResult, 'image_urls'> {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        success: true,
        amount: parsed.amount ?? null,
        currency: parsed.currency ?? null,
        date: parsed.date ?? null,
        time: parsed.time ?? null,
        merchantName: parsed.merchantName ?? null,
        subtitle: parsed.subtitle ?? null,
        address: parsed.address ?? null,
        items: parsed.items ?? [],
        rawText: text,
        confidence: parsed.confidence ?? 0.8,
      };
    }
  } catch (parseError) {
    console.error('解析 AI 回應失敗:', parseError);
  }

  return {
    success: false,
    amount: null,
    currency: null,
    date: null,
    time: null,
    merchantName: null,
    subtitle: null,
    address: null,
    items: [],
    rawText: text,
    confidence: 0,
    error: 'Failed to parse response',
  };
}
