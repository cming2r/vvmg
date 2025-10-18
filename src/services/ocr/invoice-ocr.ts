import { generateText } from 'ai';

// 發票項目介面
export interface InvoiceItem {
  description: string;
  quantity: string | null;
  unitPrice: string | null;
  price: string | null;
}

// OCR 結果介面
export interface InvoiceOCRResult {
  success: boolean;
  date?: string | null;
  time?: string | null;
  items: InvoiceItem[];
  rawText: string;
  error?: string;
}

/**
 * 處理發票 OCR 識別
 * @param imageBase64 - Base64 編碼的圖片
 * @returns 發票數據識別結果
 */
export async function processInvoiceOCR(imageBase64: string): Promise<InvoiceOCRResult> {
  try {
    // 使用 GPT-5 進行圖片 OCR 識別
    const { text } = await generateText({
      model: 'openai/gpt-5',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `請仔細分析這張發票圖片，準確提取以下信息：

1. **發票日期和時間**（在頂部區域）
2. **所有商品的完整信息**：項目名稱、數量、單價、總價

重要指示：
1. **仔細識別每個中文字**，特別注意字形相似的字（如：氛/魚/煎、蠟/臘）
2. 閱讀上下文來確認商品名稱是否合理
3. 提取發票基本信息：
   - date: 日期（格式：YYYY-MM-DD，例如 2017-07-04）
   - time: 時間（格式：HH:MM:SS 或 HH:MM，例如 18:06:16）
4. 提取每個商品的：
   - description: 商品名稱（完整，包含規格）
   - quantity: 數量（只提取數字，如果看到 "20*2" 表示數量是 2）
   - unitPrice: 單價（只提取數字）
   - price: 總價（只提取數字，去掉 TX、元、$ 等符號）
5. 只提取商品項目行，忽略：
   - 標題、表頭（品名、單價、數量、金額等）
   - 店家資訊、統編、電話
   - 總計、小計、合計（不要包含在 items 中）

返回格式（純 JSON，不要 markdown 包裝）：
{
  "date": "2017-07-04",
  "time": "18:06:16",
  "items": [
    {"description": "商品名稱", "quantity": "2", "unitPrice": "20", "price": "40"},
    {"description": "另一個商品", "quantity": "1", "unitPrice": "50", "price": "50"}
  ]
}

範例：
如果看到：
- 日期行："2017-07-04 18:06:16"
  → date: "2017-07-04", time: "18:06:16"

- 商品行："香氛蠟燭(海洋) 20*2 40 TX"
  → {"description": "香氛蠟燭(海洋)", "quantity": "2", "unitPrice": "20", "price": "40"}

如果某個字段找不到，設為 null。

請只返回 JSON，不要任何其他文字或解釋。`
            },
            {
              type: 'image',
              image: imageBase64
            }
          ]
        }
      ],
      temperature: 0.1,
    });

    // 解析 AI 返回的 JSON
    return parseInvoiceOCRResponse(text);

  } catch (error) {
    console.error('發票 OCR 處理錯誤:', error);
    throw error;
  }
}

/**
 * 解析發票 OCR 回應並驗證數據
 */
function parseInvoiceOCRResponse(text: string): InvoiceOCRResult {
  let items: InvoiceItem[] = [];
  let date: string | null = null;
  let time: string | null = null;
  const rawText = text;

  try {
    // 提取 JSON 部分（處理可能的 markdown 包裝）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      items = parsed.items || [];
      date = parsed.date || null;
      time = parsed.time || null;
    } else {
      // 如果沒有 JSON 格式，嘗試直接解析
      const parsed = JSON.parse(text);
      items = parsed.items || [];
      date = parsed.date || null;
      time = parsed.time || null;
    }
  } catch (parseError) {
    console.error('解析 AI 回應失敗:', parseError);
    // rawText 已經初始化為 text，不需要重新賦值
    items = [];
  }

  // 驗證和清理數據
  const validItems = items.filter((item: InvoiceItem) =>
    item.description &&
    item.description.trim().length > 0 &&
    item.description.length < 100
  );

  return {
    success: true,
    date,
    time,
    items: validItems,
    rawText,
  };
}
