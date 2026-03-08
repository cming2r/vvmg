import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';
import { logHealthSummary } from '@/lib/supabase/health-scan-logs';

/**
 * 外部 API - 健康摘要 v1
 * 需要 API Key 驗證，有速率限制
 * 支援綜合分析（血壓、心率、血糖）
 */

// ===== 型別定義 =====

interface UserProfile {
  age?: number;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  has_hypertension?: boolean;
  has_diabetes?: boolean;
  has_heart_disease?: boolean;
  has_high_cholesterol?: boolean;
  // 生活習慣（基於國際標準）
  // CDC/SNOMED CT
  smoking_status?: 'never' | 'former' | 'current_occasional' | 'current_light' | 'current_heavy';
  // WHO AUDIT-C
  drinking_frequency?: 'never' | 'monthly_less' | 'monthly_2_4' | 'weekly_2_3' | 'weekly_4_more';
  // WHO 2020
  physical_activity_level?: 'inactive' | 'insufficient' | 'active' | 'highly_active';
}

interface BloodPressureRecord {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: string;
}

interface BloodPressureData {
  record_count: number;
  recent_records?: BloodPressureRecord[];
}

interface HeartRateRecord {
  value: number;
  timestamp: string;
}

interface HeartRateData {
  record_count: number;
  recent_records?: HeartRateRecord[];
}

interface BloodGlucoseRecord {
  value: number;
  type?: 'fasting' | 'postprandial' | 'random';
  timestamp: string;
}

interface BloodGlucoseData {
  record_count: number;
  recent_records?: BloodGlucoseRecord[];
}

interface BodyFatRecord {
  percentage: number;
  timestamp: string;
}

interface BodyFatData {
  record_count: number;
  recent_records?: BodyFatRecord[];
}

interface BloodOxygenRecord {
  saturation: number;
  pulse?: number;
  timestamp: string;
}

interface BloodOxygenData {
  record_count: number;
  recent_records?: BloodOxygenRecord[];
}

interface HealthData {
  blood_pressure?: BloodPressureData;
  heart_rate?: HeartRateData;
  blood_glucose?: BloodGlucoseData;
  body_fat?: BodyFatData;
  blood_oxygen?: BloodOxygenData;
}

interface HealthSummaryRequest {
  device_id: string;
  language: string;
  country_code?: string;
  user_profile?: UserProfile;
  health_data: HealthData;
  custom_note?: string;
}

interface SummaryResult {
  data_recap: {
    title: string;
    items: string[];
  };
  reference_standards: {
    title: string;
    items: string[];
    source: string;
  };
  practical_tips?: {  // Asking 模式專用 - 實用建議
    title: string;
    benefits?: string[];      // 好處/優點
    precautions?: string[];   // 注意事項/缺點
    suggestions?: string[];   // 具體建議（飲用方式、時間等）
    unsuitable_for?: string[]; // 不適合的族群
  };
  critical_alert?: string;  // 危急值警告 - 平時 null，只有危急時才填充
}

// ===== API Routes =====

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
    // 1. API Key 驗證
    const apiKey = req.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. 解析請求內容（需要先取得 device_id）
    const body = await req.json();
    const { device_id, language, user_profile, health_data, custom_note, remaining_credits, ip_address, country_code, client_info } = body as HealthSummaryRequest & {
      remaining_credits?: number;
      ip_address?: string;
      country_code?: string;
      client_info?: { os?: string; device?: string; browser?: string };
    };

    // 3. 驗證必要欄位
    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_DEVICE_ID', message: 'device_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Rate Limiting 檢查（per device_id，非 per API key）
    const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '5');
    if (isRateLimited(device_id, rateLimitPerMinute)) {
      const rateLimitInfo = getRateLimitInfo(device_id, rateLimitPerMinute);
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          resetTime: new Date(rateLimitInfo.resetTime).toISOString(),
        },
        { status: 429, headers: corsHeaders }
      );
    }


    // 檢查是否有任何可分析的數據
    const hasBloodPressure = health_data?.blood_pressure && health_data.blood_pressure.record_count > 0;
    const hasHeartRate = health_data?.heart_rate && health_data.heart_rate.record_count > 0;
    const hasBloodGlucose = health_data?.blood_glucose && health_data.blood_glucose.record_count > 0;
    const hasBodyFat = health_data?.body_fat && health_data.body_fat.record_count > 0;
    const hasBloodOxygen = health_data?.blood_oxygen && health_data.blood_oxygen.record_count > 0;
    const hasCustomNote = custom_note && custom_note.trim().length > 0;

    if (!hasBloodPressure && !hasHeartRate && !hasBloodGlucose && !hasBodyFat && !hasBloodOxygen && !hasCustomNote) {
      return NextResponse.json(
        { success: false, error: 'NO_ANALYZABLE_DATA', message: 'No health data or custom note provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. 生成健康摘要
    const result = await generateHealthSummary({
      device_id,
      language: language || 'zh-TW',
      country_code: country_code || 'TW',
      user_profile,
      health_data,
      custom_note,
    });

    // 記錄到 Supabase
    const mode = hasCustomNote ? 'asking' : 'summary';
    try {
      await logHealthSummary({
        // 輸入
        health_data: health_data || null,
        user_profile: user_profile || null,
        custom_note: custom_note || null,
        // 輸出
        summary_result: result,
        // 用戶資料
        device_id: device_id || null,
        remaining_credits: remaining_credits ?? null,
        ip_address: ip_address || null,
        country_code: country_code || null,
        client_info: client_info || null,
      });
      console.log(`[External API] (${mode}) 已生成並記錄`);
    } catch (logError) {
      // 記錄錯誤但不影響主流程回應
      console.error('[External API] 健康摘要記錄保存失敗:', logError);
    }

    // 6. 返回結果
    const rateLimitInfo = getRateLimitInfo(device_id, rateLimitPerMinute);
    return NextResponse.json(result, {
      headers: {
        ...corsHeaders,
        'X-RateLimit-Limit': rateLimitPerMinute.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
      },
    });

  } catch (error) {
    console.error('[API v1] 健康摘要處理錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ===== 業務邏輯 =====

async function generateHealthSummary(request: HealthSummaryRequest) {
  const { language, country_code, user_profile, health_data, custom_note } = request;

  try {
    const prompt = buildHealthPrompt(language, country_code, user_profile, health_data, custom_note);

    const { text } = await generateText({
      model: 'google/gemini-3-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const jsonResponse = parseHealthSummaryResponse(text);

    // 確定分析了哪些類型
    const analyzedTypes: string[] = [];
    if (health_data?.blood_pressure?.record_count) analyzedTypes.push('blood_pressure');
    if (health_data?.heart_rate?.record_count) analyzedTypes.push('heart_rate');
    if (health_data?.blood_glucose?.record_count) analyzedTypes.push('blood_glucose');
    if (health_data?.body_fat?.record_count) analyzedTypes.push('body_fat');
    if (health_data?.blood_oxygen?.record_count) analyzedTypes.push('blood_oxygen');
    if (custom_note && custom_note.trim().length > 0 && analyzedTypes.length === 0) {
      analyzedTypes.push('custom_note');
    }

    // Summary 模式：覆寫 source 為固定來源（避免 AI 幻覺）
    // Asking 模式：讓 AI 自行決定來源（因為問題範圍廣泛）
    const isAskingMode = custom_note && custom_note.trim().length > 0;
    if (!isAskingMode) {
      const officialSource = getOfficialSource(language, analyzedTypes);
      jsonResponse.reference_standards.source = officialSource;
    }

    return {
      success: true,
      analyzed_types: analyzedTypes,
      summary: jsonResponse,
    };

  } catch (error) {
    console.error('健康摘要生成錯誤:', error);
    return {
      success: false,
      error: 'AI_ERROR',
      message: language === 'zh-TW' ? '無法生成健康摘要' : 'Unable to generate health summary',
    };
  }
}

function buildHealthPrompt(
  language: string,
  countryCode: string | undefined,
  userProfile: UserProfile | undefined,
  healthData: HealthData | undefined,
  customNote?: string
): string {
  const lang = language === 'zh-TW' ? '繁體中文' : 'English';

  // 判斷是否為亞洲地區（使用亞洲 BMI 標準）
  const asianCountries = ['TW', 'HK', 'JP', 'KR', 'SG', 'CN', 'MY', 'TH', 'VN', 'PH', 'ID', 'MO'];
  const isAsianRegion = asianCountries.includes(countryCode || 'TW');
  const bmiStandardNote = isAsianRegion
    ? '用戶來自亞洲地區，BMI 評估請使用 WHO 亞洲標準（正常：18.5-22.9，過重：≥23，肥胖：≥25）'
    : '用戶來自非亞洲地區，BMI 評估請使用 WHO 全球標準（正常：18.5-24.9，過重：≥25，肥胖：≥30）';

  // 動態生成數據描述（每筆紀錄）
  const dataDescriptions: string[] = [];

  if (healthData?.blood_pressure?.record_count) {
    const bp = healthData.blood_pressure;
    let bpDesc = `### 血壓數據 (${bp.record_count} 筆紀錄)\n`;
    if (bp.recent_records && bp.recent_records.length > 0) {
      bp.recent_records.forEach((r, i) => {
        bpDesc += `${i + 1}. ${r.systolic}/${r.diastolic} mmHg`;
        if (r.pulse) bpDesc += `，脈搏 ${r.pulse} bpm`;
        bpDesc += ` (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(bpDesc);
  }

  if (healthData?.heart_rate?.record_count) {
    const hr = healthData.heart_rate;
    let hrDesc = `### 心率數據 (${hr.record_count} 筆紀錄)\n`;
    if (hr.recent_records && hr.recent_records.length > 0) {
      hr.recent_records.forEach((r, i) => {
        hrDesc += `${i + 1}. ${r.value} bpm (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(hrDesc);
  }

  if (healthData?.blood_glucose?.record_count) {
    const bg = healthData.blood_glucose;
    let bgDesc = `### 血糖數據 (${bg.record_count} 筆紀錄)\n`;
    if (bg.recent_records && bg.recent_records.length > 0) {
      bg.recent_records.forEach((r, i) => {
        const typeLabel = r.type === 'fasting' ? '空腹' :
                          r.type === 'postprandial' ? '餐後' :
                          r.type === 'random' ? '隨機' : '';
        bgDesc += `${i + 1}. ${r.value} mg/dL${typeLabel ? ` (${typeLabel})` : ''} (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(bgDesc);
  }

  if (healthData?.body_fat?.record_count) {
    const bf = healthData.body_fat;
    let bfDesc = `### 體脂肪數據 (${bf.record_count} 筆紀錄)\n`;
    if (bf.recent_records && bf.recent_records.length > 0) {
      bf.recent_records.forEach((r, i) => {
        bfDesc += `${i + 1}. ${r.percentage.toFixed(1)}% (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(bfDesc);
  }

  if (healthData?.blood_oxygen?.record_count) {
    const bo = healthData.blood_oxygen;
    let boDesc = `### 血氧數據 (${bo.record_count} 筆紀錄)\n`;
    if (bo.recent_records && bo.recent_records.length > 0) {
      bo.recent_records.forEach((r, i) => {
        boDesc += `${i + 1}. ${r.saturation.toFixed(0)}%`;
        if (r.pulse) boDesc += `，脈搏 ${r.pulse.toFixed(0)} bpm`;
        boDesc += ` (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(boDesc);
  }

  const references = `
## 健康標準參考

### 血壓標準 (mmHg)
| 等級         | 收縮壓  | 舒張壓 | level    |
|--------------|---------|--------|----------|
| 正常         | < 120   | < 80   | normal   |
| 偏高         | 120-129 | < 80   | elevated |
| 高血壓第一期 | 130-139 | 80-89  | high     |
| 高血壓第二期 | ≥ 140   | ≥ 90   | high     |
| 高血壓危象   | > 180   | > 120  | critical |

### 心率標準 (bpm)
| 等級   | 範圍      | level    |
|--------|-----------|----------|
| 過低   | < 60      | elevated |
| 正常   | 60-100    | normal   |
| 偏高   | 100-120   | elevated |
| 過高   | > 120     | high     |

### 血糖標準 (mg/dL)
| 類型     | 正常    | 偏高      | 糖尿病   |
|----------|---------|-----------|----------|
| 空腹血糖 | < 100   | 100-125   | ≥ 126    |
| 餐後血糖 | < 140   | 140-199   | ≥ 200    |

### 體脂肪標準 (%)
| 等級     | 男性      | 女性      | level    |
|----------|-----------|-----------|----------|
| 過低     | < 6       | < 14      | elevated |
| 運動員   | 6-13      | 14-20     | normal   |
| 健康     | 14-17     | 21-24     | normal   |
| 可接受   | 18-24     | 25-31     | elevated |
| 過高     | > 25      | > 32      | high     |

### 血氧標準 (SpO2 %)
| 等級     | 範圍      | level    |
|----------|-----------|----------|
| 正常     | 95-100    | normal   |
| 偏低     | 90-94     | elevated |
| 低血氧   | < 90      | high     |
| 嚴重低血氧 | < 85    | critical |`;

  // 根據是否有健康數據調整提示詞
  const hasHealthData = dataDescriptions.length > 0;

  // 危急值判斷規則
  const criticalAlertRule = `
## 危急值警告規則
若偵測到以下任一情況，必須在 JSON 中加入 "critical_alert" 欄位：
- 收縮壓 > 180 mmHg 或舒張壓 > 120 mmHg（高血壓危象）
- 血氧 SpO2 < 90%（低血氧）
- 空腹血糖 > 400 mg/dL 或 < 50 mg/dL（血糖危急值）
- 心率 > 150 bpm 或 < 40 bpm（心律異常）

critical_alert 內容範例：「偵測到危急數值，請立即聯繫您的醫師或前往急診就醫。」
若無危急情況，則不要包含此欄位。`;

  // Summary 模式的回覆格式
  const outputFormatSummary = `
## 回覆格式（嚴格 JSON）
{
  "data_recap": {
    "title": "您提供的數據",
    "items": ["數據項目1", "數據項目2", "..."]
  },
  "reference_standards": {
    "title": "參考標準",
    "items": ["根據○○指引，標準範圍為...", "..."],
    "source": "資料來源（如：WHO、AHA、ADA 等）"
  },
  "critical_alert": "（僅在危急值時才加入此欄位）"
}
${criticalAlertRule}
只輸出 JSON，不要其他文字。`;

  // Asking 模式的回覆格式
  const outputFormatAsking = `
## 回覆格式（嚴格 JSON）
{
  "data_recap": {
    "title": "您的問題",
    "items": ["問題摘要或重點整理"]
  },
  "reference_standards": {
    "title": "健康參考資訊",
    "items": ["相關的健康知識或研究結果..."],
    "source": "資料來源（如有明確來源則填寫，否則可填『一般健康知識』）"
  },
  "practical_tips": {
    "title": "實用建議",
    "benefits": ["好處1", "好處2"],
    "precautions": ["注意事項1", "注意事項2"],
    "suggestions": ["具體建議1（如：時間、方式、份量等）"],
    "unsuitable_for": ["不適合的族群1", "不適合的族群2"]
  },
  "critical_alert": "（僅在涉及危急健康狀況時才加入此欄位）"
}

## 欄位說明
- data_recap：整理用戶問題的重點
- reference_standards：提供相關的健康知識背景（不需要每條都引用官方標準，一般健康知識也可以）
- practical_tips：最重要！提供實用、可執行的建議
  - benefits：這樣做的好處（2-4 項）
  - precautions：需要注意的事項或潛在缺點（2-4 項）
  - suggestions：具體的執行建議（時間、份量、方式等，1-3 項）
  - unsuitable_for：哪些人不適合（1-4 項，如沒有則可省略此欄位）
- critical_alert：只有危急情況才加入

${criticalAlertRule}
只輸出 JSON，不要其他文字。`;

  // ===== Asking 模式（有問題）=====
  if (customNote) {
    if (hasHealthData) {
      // Asking 模式 + 有健康數據作為輔助
      return `你是一位親切、專業的健康顧問。用戶提出了健康相關問題，並提供了個人健康數據作為參考。請像朋友一樣給出實用的回答。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 用戶問題
${customNote}

## 用戶健康數據（最近 30 天內，作為參考）
${dataDescriptions.join('\n')}
${references}

## 回答原則
1. **實用優先**：給出具體、可執行的建議（時間、份量、方式等）
2. **優缺點並陳**：說明好處，也提醒注意事項
3. **考量個人狀況**：結合用戶提供的健康數據給出更個人化的建議
4. **標註不適合族群**：明確指出哪些人不適合（如糖尿病患者、孕婦等）
5. **友善語氣**：像朋友給建議一樣自然，不要太生硬
6. **BMI 標準**：${bmiStandardNote}

## 安全底線
- 不做醫療診斷（不說「你有○○病」）
- 涉及嚴重疾病時提醒就醫
- 在 practical_tips 最後一條 suggestions 加上「如有特殊疾病或疑慮，建議諮詢醫師」

## 要求
1. 使用 ${lang} 回覆
2. data_recap：簡要整理問題重點
3. reference_standards：提供相關健康知識背景（1-3 條即可，不用太多）
4. practical_tips：**重點！** 提供實用建議，包含好處、注意事項、具體做法、不適合族群
${outputFormatAsking}`;
    } else {
      // Asking 模式，沒有健康數據
      return `你是一位親切、專業的健康顧問。用戶提出了健康相關問題，請像朋友一樣給出實用的回答。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 用戶問題
${customNote}

## 回答原則
1. **實用優先**：給出具體、可執行的建議（時間、份量、方式等）
2. **優缺點並陳**：說明好處，也提醒注意事項
3. **標註不適合族群**：明確指出哪些人不適合（如糖尿病患者、孕婦等）
4. **友善語氣**：像朋友給建議一樣自然，不要太生硬
5. **BMI 標準**：${bmiStandardNote}

## 安全底線
- 不做醫療診斷（不說「你有○○病」）
- 涉及嚴重疾病時提醒就醫
- 在 practical_tips 最後一條 suggestions 加上「如有特殊疾病或疑慮，建議諮詢醫師」

## 要求
1. 使用 ${lang} 回覆
2. data_recap：簡要整理問題重點（1-2 條）
3. reference_standards：提供相關健康知識背景（1-3 條即可，不用太多）
4. practical_tips：**重點！** 提供實用建議，包含好處、注意事項、具體做法、不適合族群
${outputFormatAsking}`;
    }
  }

  // ===== Summary 模式（只分析健康數據）=====
  return `你是一位健康衛教 AI 助手。請根據以下健康數據提供具有洞察力的衛教摘要。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 健康數據（最近 30 天內的紀錄）
${dataDescriptions.join('\n')}
${references}

## 分析指令（產出更有價值的摘要）
1. **趨勢分析**：計算數據的平均值與區間，指出是否有明顯波動
2. **標準比對**：直接陳述數據落在參考標準的哪個級別（例如：「屬於高血壓第一期範圍」），但不做疾病診斷
3. **綜合觀察**：結合用戶的 BMI、運動量、飲酒習慣等，提供整體的衛教觀察
4. **異常點標註**：若有任何單次數值達到危急等級，請特別標註

## 重要原則（法律安全）
1. **不做診斷**：絕對不能說「你有高血壓」、「你過重」，改說「屬於○○範圍」
2. **只陳述事實**：例如「平均血壓 138/82 mmHg，有 2 次落在高血壓第一期範圍」
3. **引用官方標準**：提供參考範圍時，務必註明來源（WHO、AHA、ADA 等國際標準）
4. **不給具體建議**：不說「你應該少吃鹽」，改說「如需飲食建議，請諮詢營養師」
5. **BMI 標準**：${bmiStandardNote}

## data_recap 輸出範例
- 「過去 30 天內，平均血壓為 138/82 mmHg，共有 2 次紀錄落在『高血壓第一期』範圍」
- 「BMI 為 25.3，根據 WHO 亞洲標準，屬於肥胖（Obese）範圍」
- 「血氧飽和度穩定維持在 99%，處於正常範圍」
- 「活動量為『不足』，且 BMI 屬於肥胖範圍，建議與醫師討論運動計畫」
- 「飲酒頻率為每月 2-4 次，需注意酒精攝取對血壓的潛在影響」

## 要求
1. 使用 ${lang} 回覆
2. data_recap：整理用戶數據，包含平均值、趨勢、標準分類、生活習慣關聯
3. reference_standards：引用官方健康標準，讓用戶自行比對
${outputFormatSummary}`;
}

function parseHealthSummaryResponse(text: string): SummaryResult {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      const result: SummaryResult = {
        data_recap: {
          title: parsed.data_recap?.title || '您提供的數據',
          items: parsed.data_recap?.items || [],
        },
        reference_standards: {
          title: parsed.reference_standards?.title || '參考標準',
          items: parsed.reference_standards?.items || [],
          source: parsed.reference_standards?.source || '',
        },
      };

      // practical_tips（Asking 模式專用）
      if (parsed.practical_tips && typeof parsed.practical_tips === 'object') {
        result.practical_tips = {
          title: parsed.practical_tips.title || '實用建議',
          benefits: Array.isArray(parsed.practical_tips.benefits) ? parsed.practical_tips.benefits : undefined,
          precautions: Array.isArray(parsed.practical_tips.precautions) ? parsed.practical_tips.precautions : undefined,
          suggestions: Array.isArray(parsed.practical_tips.suggestions) ? parsed.practical_tips.suggestions : undefined,
          unsuitable_for: Array.isArray(parsed.practical_tips.unsuitable_for) ? parsed.practical_tips.unsuitable_for : undefined,
        };
      }

      // 危急值警告（只在 AI 有返回時才包含）
      if (parsed.critical_alert && typeof parsed.critical_alert === 'string' && parsed.critical_alert.trim()) {
        result.critical_alert = parsed.critical_alert.trim();
      }

      return result;
    }

    const parsed = JSON.parse(text);
    const result: SummaryResult = {
      data_recap: parsed.data_recap,
      reference_standards: parsed.reference_standards,
    };

    // practical_tips（Asking 模式專用）
    if (parsed.practical_tips && typeof parsed.practical_tips === 'object') {
      result.practical_tips = {
        title: parsed.practical_tips.title || '實用建議',
        benefits: Array.isArray(parsed.practical_tips.benefits) ? parsed.practical_tips.benefits : undefined,
        precautions: Array.isArray(parsed.practical_tips.precautions) ? parsed.practical_tips.precautions : undefined,
        suggestions: Array.isArray(parsed.practical_tips.suggestions) ? parsed.practical_tips.suggestions : undefined,
        unsuitable_for: Array.isArray(parsed.practical_tips.unsuitable_for) ? parsed.practical_tips.unsuitable_for : undefined,
      };
    }

    if (parsed.critical_alert && typeof parsed.critical_alert === 'string' && parsed.critical_alert.trim()) {
      result.critical_alert = parsed.critical_alert.trim();
    }

    return result;

  } catch (parseError) {
    console.error('解析健康摘要回應失敗:', parseError);
    return {
      data_recap: {
        title: '您提供的數據',
        items: ['無法解析數據'],
      },
      reference_standards: {
        title: '參考標準',
        items: [],
        source: '',
      },
      // 錯誤情況不包含 critical_alert 和 practical_tips，前端會顯示固定免責聲明
    };
  }
}

/**
 * 根據分析的數據類型返回官方來源（固定值，避免 AI 幻覺）
 */
function getOfficialSource(language: string, analyzedTypes: string[]): string {
  const sources: string[] = [];

  if (analyzedTypes.includes('blood_pressure')) {
    sources.push(language === 'zh-TW' ? '美國心臟協會 (AHA)' : 'American Heart Association (AHA)');
  }
  if (analyzedTypes.includes('heart_rate')) {
    sources.push(language === 'zh-TW' ? '美國心臟協會 (AHA)' : 'American Heart Association (AHA)');
  }
  if (analyzedTypes.includes('blood_glucose')) {
    sources.push(language === 'zh-TW' ? '美國糖尿病協會 (ADA)' : 'American Diabetes Association (ADA)');
  }
  if (analyzedTypes.includes('body_fat')) {
    sources.push(language === 'zh-TW' ? '美國運動醫學會 (ACSM)' : 'American College of Sports Medicine (ACSM)');
  }
  if (analyzedTypes.includes('blood_oxygen')) {
    sources.push(language === 'zh-TW' ? '世界衛生組織 (WHO)' : 'World Health Organization (WHO)');
  }

  // 去重
  const uniqueSources = [...new Set(sources)];

  if (uniqueSources.length === 0) {
    return language === 'zh-TW' ? '世界衛生組織 (WHO)' : 'World Health Organization (WHO)';
  }

  return uniqueSources.join('、');
}
