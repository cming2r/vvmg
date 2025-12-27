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

interface StatusResult {
  level: 'normal' | 'elevated' | 'high' | 'critical';
  title: string;
  description: string;
  color: string;
}

interface SummaryResult {
  overview: string;
  details: string[];
  lifestyle: string[];
  dietary: string[];
  warnings: string[];
  should_see_doctor: boolean;
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

    // 2. Rate Limiting 檢查
    const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
    if (isRateLimited(apiKey!, rateLimitPerMinute)) {
      const rateLimitInfo = getRateLimitInfo(apiKey!, rateLimitPerMinute);
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

    // 3. 解析請求內容
    const body = await req.json();
    const { device_id, language, user_profile, health_data, custom_note, remaining_credits, ip_address, country_code, client_info } = body as HealthSummaryRequest & {
      remaining_credits?: number;
      ip_address?: string;
      country_code?: string;
      client_info?: { os?: string; device?: string; browser?: string };
    };

    // 4. 驗證必要欄位
    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_DEVICE_ID', message: 'device_id is required' },
        { status: 400, headers: corsHeaders }
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
    const rateLimitInfo = getRateLimitInfo(apiKey!, rateLimitPerMinute);
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

    return {
      success: true,
      analyzed_types: analyzedTypes,
      ...jsonResponse,
      disclaimer: getDisclaimer(language),
    };

  } catch (error) {
    console.error('健康摘要生成錯誤:', error);
    return {
      success: false,
      error: 'AI_ERROR',
      message: language === 'zh-TW' ? '無法生成健康摘要' : 'Unable to generate health summary',
      disclaimer: getDisclaimer(language),
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

  if (!hasHealthData && customNote) {
    // 只有補充說明，沒有健康數據
    return `你是一位專業的健康諮詢 AI。用戶提出了一個健康相關的問題，請針對性地回答。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 用戶問題
${customNote}
${references}

## 重要原則
1. **聚焦回答**：只回答用戶實際提出的問題，不要延伸到其他健康話題
2. 若用戶問的是簡單的數據查詢（如「我的身高是否正常」），直接回答該問題即可
3. 不要主動分析用戶沒有詢問的指標（如：用戶只問身高，不要主動分析 BMI、體重、運動量等）
4. 只有當用戶明確詢問或描述症狀時，才提供相關的生活/飲食建議
5. 若問題簡單明確，details 只需 1-2 項，lifestyle/dietary/warnings 可為空陣列

## 要求
1. 使用 ${lang} 回覆
2. 評估等級：normal（一般資訊）、elevated（需注意）、high（建議就醫）、critical（緊急）
3. 顏色代碼：normal=#4CAF50, elevated=#FFA500, high=#FF5722, critical=#F44336

## 回覆格式（嚴格 JSON）
{
  "status": {
    "level": "normal|elevated|high|critical",
    "title": "簡潔的回答標題",
    "description": "直接回答用戶的問題",
    "color": "#顏色代碼"
  },
  "summary": {
    "overview": "一句話回答用戶問題",
    "details": ["針對問題的說明（1-3項即可）"],
    "lifestyle": ["只在相關時提供，否則為空陣列"],
    "dietary": ["只在相關時提供，否則為空陣列"],
    "warnings": ["只在必要時提供，否則為空陣列"],
    "should_see_doctor": false
  }
}

只輸出 JSON，不要其他文字。`;
  }

  return `你是一位專業的健康數據分析 AI。請根據以下健康數據提供綜合摘要。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}
${customNoteSection}
## 健康數據
${dataDescriptions.join('\n')}
${references}

## 要求
1. 使用 ${lang} 回覆
2. 綜合評估所有提供的健康數據，注意分析每筆紀錄的時間趨勢變化
3. 評估整體健康狀態等級：normal（正常）、elevated（偏高/需注意）、high（高風險）、critical（危險）
4. 提供具體可行的生活提示
5. 若有任何數據異常或趨勢惡化，在 warnings 中說明並提示考慮就醫
6. 顏色代碼：normal=#4CAF50, elevated=#FFA500, high=#FF5722, critical=#F44336

## 回覆格式（嚴格 JSON）
{
  "status": {
    "level": "normal|elevated|high|critical",
    "title": "整體健康狀態標題",
    "description": "綜合評估說明（包含各項指標的簡要分析）",
    "color": "#顏色代碼"
  },
  "summary": {
    "overview": "簡短摘要（50字內）",
    "details": ["詳細分析1", "詳細分析2", "..."],
    "lifestyle": ["生活提示1", "生活提示2", "..."],
    "dietary": ["飲食提示1", "飲食提示2", "..."],
    "warnings": ["注意事項（若無則為空陣列）"],
    "should_see_doctor": false
  }
}

只輸出 JSON，不要其他文字。`;
}

function parseHealthSummaryResponse(text: string): { status: StatusResult; summary: SummaryResult } {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      return {
        status: {
          level: parsed.status?.level || 'normal',
          title: parsed.status?.title || '',
          description: parsed.status?.description || '',
          color: parsed.status?.color || '#4CAF50',
        },
        summary: {
          overview: parsed.summary?.overview || '',
          details: parsed.summary?.details || [],
          lifestyle: parsed.summary?.lifestyle || [],
          dietary: parsed.summary?.dietary || [],
          warnings: parsed.summary?.warnings || [],
          should_see_doctor: parsed.summary?.should_see_doctor || false,
        },
      };
    }

    const parsed = JSON.parse(text);
    return { status: parsed.status, summary: parsed.summary };

  } catch (parseError) {
    console.error('解析健康摘要回應失敗:', parseError);
    return {
      status: {
        level: 'normal',
        title: '無法分析',
        description: '無法解析健康數據',
        color: '#9E9E9E',
      },
      summary: {
        overview: '無法生成摘要',
        details: [],
        lifestyle: [],
        dietary: [],
        warnings: ['如有疑慮請諮詢醫療專業人員'],
        should_see_doctor: true,
      },
    };
  }
}

function getDisclaimer(language: string): string {
  return language === 'zh-TW'
    ? '此摘要由 AI 生成，僅供參考，不能替代專業醫療診斷。如有健康疑慮，請諮詢醫生。'
    : 'This summary is AI-generated for reference only and cannot replace professional medical diagnosis. Please consult a doctor if you have health concerns.';
}
