import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getCorsHeaders } from '@/lib/api/security';

/**
 * 發票/收據 OCR API
 * 用於旅遊記帳 App 的發票識別
 */

export interface ReceiptOCRResult {
  success: boolean;
  amount: number | null;
  currency: string | null;
  date: string | null;
  time: string | null;
  merchantName: string | null;
  items: ReceiptItem[];
  rawText: string;
  confidence: number;
  error?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

// 處理 OPTIONS 請求（CORS preflight）
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
    const { image, language = 'zh-Hant' } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing image data',
          message: 'Please provide an image in base64 format',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // 使用 Gemini 進行發票 OCR 識別
    const { text } = await generateText({
      model: 'google/gemini-2.5-flash-image',
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
5. **商家名稱** (merchantName) - 店名或公司名
6. **消費明細** (items) - 每個品項包含：
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
  "merchantName": "全家便利商店",
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
            {
              type: 'image',
              image: image
            }
          ]
        }
      ],
      temperature: 0.1,
    });

    // 解析 AI 返回的 JSON
    const result = parseReceiptOCRResponse(text);

    return NextResponse.json(result, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('[Receipt OCR] 處理錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        amount: null,
        currency: null,
        date: null,
        time: null,
        merchantName: null,
        items: [],
        rawText: '',
        confidence: 0,
        error: 'Internal server error',
      } as ReceiptOCRResult,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

function parseReceiptOCRResponse(text: string): ReceiptOCRResult {
  try {
    // 提取 JSON 部分（處理可能的 markdown 包裝）
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
    items: [],
    rawText: text,
    confidence: 0,
    error: 'Failed to parse response',
  };
}
