import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';
import { logHealthSummary } from '@/lib/supabase/ocr-logs';

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
  avg_systolic?: number;
  avg_diastolic?: number;
  min_systolic?: number;
  max_systolic?: number;
  record_count: number;
  recent_records?: BloodPressureRecord[];
}

interface HeartRateRecord {
  value: number;
  timestamp: string;
}

interface HeartRateData {
  avg?: number;
  min?: number;
  max?: number;
  record_count: number;
  recent_records?: HeartRateRecord[];
}

interface BloodGlucoseRecord {
  value: number;
  type?: 'fasting' | 'postprandial' | 'random';
  timestamp: string;
}

interface BloodGlucoseData {
  avg?: number;
  record_count: number;
  recent_records?: BloodGlucoseRecord[];
}

interface BodyFatRecord {
  percentage: number;
  timestamp: string;
}

interface BodyFatData {
  avg?: number;
  min?: number;
  max?: number;
  record_count: number;
  recent_records?: BodyFatRecord[];
}

interface BloodOxygenRecord {
  saturation: number;
  pulse?: number;
  timestamp: string;
}

interface BloodOxygenData {
  avg?: number;
  min?: number;
  max?: number;
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
  next_steps: {
    title: string;
    items: string[];
  };
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
      user_profile,
      health_data,
      custom_note,
    });

    // Log 請求資訊
    const analyzedTypes = [
      hasBloodPressure && 'blood_pressure',
      hasHeartRate && 'heart_rate',
      hasBloodGlucose && 'blood_glucose',
      hasBodyFat && 'body_fat',
      hasBloodOxygen && 'blood_oxygen',
    ].filter(Boolean) as string[];

    // 記錄到 Supabase
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
      console.log(`[External API v1] 健康摘要已生成並記錄 (${analyzedTypes.join('+')})`);
    } catch (logError) {
      // 記錄錯誤但不影響主流程回應
      console.error('[External API v1] 健康摘要記錄保存失敗:', logError);
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
  const { language, user_profile, health_data, custom_note } = request;

  try {
    const prompt = buildHealthPrompt(language, user_profile, health_data, custom_note);

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

    // 覆寫 source 為固定來源（避免 AI 幻覺）
    const officialSource = getOfficialSource(language, analyzedTypes);
    jsonResponse.reference_standards.source = officialSource;

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
  userProfile: UserProfile | undefined,
  healthData: HealthData | undefined,
  customNote?: string
): string {
  const lang = language === 'zh-TW' ? '繁體中文' : 'English';

  // 動態生成數據描述（包含統計和每筆紀錄）
  const dataDescriptions: string[] = [];

  if (healthData?.blood_pressure?.record_count) {
    const bp = healthData.blood_pressure;
    let bpDesc = `### 血壓數據 (${bp.record_count} 筆紀錄)\n`;
    bpDesc += `**統計摘要:**\n`;
    if (bp.avg_systolic) {
      bpDesc += `- 平均: ${bp.avg_systolic.toFixed(0)}/${bp.avg_diastolic?.toFixed(0)} mmHg\n`;
    }
    if (bp.min_systolic && bp.max_systolic) {
      bpDesc += `- 收縮壓範圍: ${bp.min_systolic} ~ ${bp.max_systolic} mmHg\n`;
    }
    if (bp.recent_records && bp.recent_records.length > 0) {
      bpDesc += `\n**最近紀錄（從新到舊）:**\n`;
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
    hrDesc += `**統計摘要:**\n`;
    if (hr.avg) {
      hrDesc += `- 平均: ${hr.avg.toFixed(0)} bpm\n`;
    }
    if (hr.min && hr.max) {
      hrDesc += `- 範圍: ${hr.min} ~ ${hr.max} bpm\n`;
    }
    if (hr.recent_records && hr.recent_records.length > 0) {
      hrDesc += `\n**最近紀錄（從新到舊）:**\n`;
      hr.recent_records.forEach((r, i) => {
        hrDesc += `${i + 1}. ${r.value} bpm (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(hrDesc);
  }

  if (healthData?.blood_glucose?.record_count) {
    const bg = healthData.blood_glucose;
    let bgDesc = `### 血糖數據 (${bg.record_count} 筆紀錄)\n`;
    bgDesc += `**統計摘要:**\n`;
    if (bg.avg) {
      bgDesc += `- 平均: ${bg.avg.toFixed(0)} mg/dL\n`;
    }
    if (bg.recent_records && bg.recent_records.length > 0) {
      bgDesc += `\n**最近紀錄（從新到舊）:**\n`;
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
    bfDesc += `**統計摘要:**\n`;
    if (bf.avg) {
      bfDesc += `- 平均: ${bf.avg.toFixed(1)}%\n`;
    }
    if (bf.min !== undefined && bf.max !== undefined) {
      bfDesc += `- 範圍: ${bf.min.toFixed(1)}% ~ ${bf.max.toFixed(1)}%\n`;
    }
    if (bf.recent_records && bf.recent_records.length > 0) {
      bfDesc += `\n**最近紀錄（從新到舊）:**\n`;
      bf.recent_records.forEach((r, i) => {
        bfDesc += `${i + 1}. ${r.percentage.toFixed(1)}% (${r.timestamp})\n`;
      });
    }
    dataDescriptions.push(bfDesc);
  }

  if (healthData?.blood_oxygen?.record_count) {
    const bo = healthData.blood_oxygen;
    let boDesc = `### 血氧數據 (${bo.record_count} 筆紀錄)\n`;
    boDesc += `**統計摘要:**\n`;
    if (bo.avg) {
      boDesc += `- 平均: ${bo.avg.toFixed(1)}%\n`;
    }
    if (bo.min !== undefined && bo.max !== undefined) {
      boDesc += `- 範圍: ${bo.min.toFixed(0)}% ~ ${bo.max.toFixed(0)}%\n`;
    }
    if (bo.recent_records && bo.recent_records.length > 0) {
      boDesc += `\n**最近紀錄（從新到舊）:**\n`;
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

  // 用戶補充說明
  const customNoteSection = customNote
    ? `\n## 用戶補充說明\n${customNote}\n`
    : '';

  // 根據是否有健康數據調整提示詞
  const hasHealthData = dataDescriptions.length > 0;

  const outputFormat = `
## 回覆格式（嚴格 JSON）
{
  "data_recap": {
    "title": "您提供的數據",
    "items": ["數據項目1", "數據項目2", "..."]
  },
  "reference_standards": {
    "title": "參考標準",
    "items": ["根據○○指引，標準範圍為...", "..."],
    "source": "資料來源（如：衛生福利部國民健康署、WHO、AHA 等）"
  },
  "next_steps": {
    "title": "下一步建議",
    "items": ["建議將此摘要提供給您的醫師參考", "..."]
  }
}

只輸出 JSON，不要其他文字。`;

  if (!hasHealthData && customNote) {
    // 只有補充說明，沒有健康數據
    return `你是一位健康衛教 AI 助手。用戶提出了健康相關問題，請以衛教角度回答。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 用戶問題
${customNote}
${references}

## 重要原則（法律安全）
1. **不做診斷**：絕對不能說「你有○○症」、「你過重」、「你的血壓偏高」等診斷性用語
2. **只陳述事實**：例如「您的 BMI 計算結果為 25.3」，不說「您過重」
3. **引用官方標準**：提供參考範圍時，務必註明來源（WHO、衛福部、AHA 等）
4. **永遠導向專業**：next_steps 必須包含「建議諮詢醫師/營養師/專業人員」
5. **聚焦回答**：只回答用戶實際提出的問題，不延伸到其他話題

## 要求
1. 使用 ${lang} 回覆
2. data_recap：整理用戶提供的數據（純客觀陳述）
3. reference_standards：引用官方標準，讓用戶自行比對
4. next_steps：永遠指向專業人士
${outputFormat}`;
  }

  return `你是一位健康衛教 AI 助手。請根據以下健康數據提供衛教資訊。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}
${customNoteSection}
## 健康數據（最近 30 天內的紀錄）
${dataDescriptions.join('\n')}
${references}

## 重要原則（法律安全）
1. **不做診斷**：絕對不能說「你有高血壓」、「你過重」、「你的血糖偏高」等診斷性用語
2. **只陳述事實**：例如「您的平均收縮壓為 135 mmHg」，不說「您血壓偏高」
3. **引用官方標準**：提供參考範圍時，務必註明來源（WHO、衛福部、AHA 等）
4. **永遠導向專業**：next_steps 必須包含「建議將此摘要提供給您的醫師參考」
5. **不給具體建議**：不說「你應該少吃鹽」，改說「如需飲食建議，請諮詢營養師」
6. **說明時效性**：在 data_recap 中註明這些是「最近 30 天內」的紀錄

## 要求
1. 使用 ${lang} 回覆
2. data_recap：整理用戶上傳的數值（含計算值如 BMI），純客觀陳述
3. reference_standards：引用官方健康標準，讓用戶自行比對，務必註明來源
4. next_steps：永遠指向專業人士（醫師、營養師等）
${outputFormat}`;
}

function parseHealthSummaryResponse(text: string): SummaryResult {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        data_recap: {
          title: parsed.data_recap?.title || '您提供的數據',
          items: parsed.data_recap?.items || [],
        },
        reference_standards: {
          title: parsed.reference_standards?.title || '參考標準',
          items: parsed.reference_standards?.items || [],
          source: parsed.reference_standards?.source || '',
        },
        next_steps: {
          title: parsed.next_steps?.title || '下一步建議',
          items: parsed.next_steps?.items || ['建議諮詢專業醫療人員'],
        },
      };
    }

    const parsed = JSON.parse(text);
    return {
      data_recap: parsed.data_recap,
      reference_standards: parsed.reference_standards,
      next_steps: parsed.next_steps,
    };

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
      next_steps: {
        title: '下一步建議',
        items: ['如有健康疑慮，請諮詢專業醫療人員'],
      },
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
  if (analyzedTypes.includes('custom_note')) {
    sources.push(language === 'zh-TW' ? '衛生福利部國民健康署' : 'Health Promotion Administration, Ministry of Health and Welfare');
  }

  // 去重
  const uniqueSources = [...new Set(sources)];

  if (uniqueSources.length === 0) {
    return language === 'zh-TW' ? '衛生福利部國民健康署' : 'Health Promotion Administration';
  }

  return uniqueSources.join('、');
}
