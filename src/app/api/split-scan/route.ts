import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getCorsHeaders } from '@/lib/api/security';
import { uploadReceiptToR2 } from '@/lib/r2/split-upload';

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
    const { action = 'scan', image } = body;

    // Support both `image` (single) and `images` (array)
    const images: string[] = body.images ?? (image ? [image] : []);

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing image data' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { country_code, currency_code } = body;

    // ── Upload only（手動加照片，不需 OCR）──
    if (action === 'upload') {
      const urls = await Promise.all(
        images.map((img) => uploadReceiptToR2(img, country_code, currency_code))
      );
      return NextResponse.json({ success: true, image_urls: urls }, { headers: corsHeaders });
    }

    // ── Scan: OCR + 上傳 R2 一次完成 ──
    const { language = 'zh-Hant' } = body;

    // Build image content parts for Gemini
    const imageContentParts = images.map((img) => ({
      type: 'image' as const,
      image: img,
    }));

    const multiImageHint = images.length > 1
      ? `\n\n注意：以下有 ${images.length} 張同一筆消費的收據/發票照片，請合併分析所有照片的資訊，整合為一筆結果。`
      : '';

    const [ocrResponse, ...imageUrls] = await Promise.all([
      generateText({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `請仔細分析這${images.length > 1 ? '些' : '張'}發票或收據照片，提取以下資訊。
發票語言提示：${language}${multiImageHint}

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

請開始分析圖片：`
              },
              ...imageContentParts,
            ]
          }
        ],
        temperature: 0.1,
      }),
      // 上傳所有圖片到 R2（失敗不影響 OCR 結果）
      ...images.map((img) => {
        return uploadReceiptToR2(img, country_code, currency_code).catch((err) => {
          console.error(`[Split Scan] R2 上傳失敗（不影響 OCR）:`, err);
          return null;
        });
      }),
    ]);

    const result = parseReceiptOCRResponse(ocrResponse.text);
    const validUrls = imageUrls.filter((u): u is string => u !== null);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Split Scan] OCR 結果:', ocrResponse.text);
    } else {
      console.log('[Split Scan] OCR 完成');
    }

    return NextResponse.json(
      { ...result, image_urls: validUrls },
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
