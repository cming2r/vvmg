import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';

/**
 * 外部 API - 健康建議 v1
 * 需要 API Key 驗證，有速率限制
 * 支援綜合分析（血壓、心率、血糖）
 */

// ===== 型別定義 =====

interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  has_hypertension?: boolean;
  has_diabetes?: boolean;
  has_heart_disease?: boolean;
  is_smoker?: boolean;
  exercise_frequency?: 'none' | 'light' | 'moderate' | 'active';
}

interface BloodPressureData {
  latest?: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    timestamp: string;
  };
  avg_systolic_7days?: number;
  avg_diastolic_7days?: number;
  min_systolic_7days?: number;
  max_systolic_7days?: number;
  record_count: number;
}

interface HeartRateData {
  latest?: {
    value: number;
    timestamp: string;
  };
  avg_7days?: number;
  min_7days?: number;
  max_7days?: number;
  record_count: number;
}

interface BloodGlucoseData {
  latest?: {
    value: number;
    type?: 'fasting' | 'postprandial' | 'random';
    timestamp: string;
  };
  avg_7days?: number;
  record_count: number;
}

interface HealthData {
  blood_pressure?: BloodPressureData;
  heart_rate?: HeartRateData;
  blood_glucose?: BloodGlucoseData;
}

interface HealthAdviceRequest {
  device_id: string;
  language: string;
  user_profile?: UserProfile;
  health_data: HealthData;
}

interface StatusResult {
  level: 'normal' | 'elevated' | 'high' | 'critical';
  title: string;
  description: string;
  color: string;
}

interface AdviceResult {
  summary: string;
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
    const { device_id, language, user_profile, health_data } = body as HealthAdviceRequest;

    // 4. 驗證必要欄位
    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_DEVICE_ID', message: 'device_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!health_data) {
      return NextResponse.json(
        { success: false, error: 'MISSING_HEALTH_DATA', message: 'health_data is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 檢查是否有任何可分析的數據
    const hasBloodPressure = health_data.blood_pressure && health_data.blood_pressure.record_count > 0;
    const hasHeartRate = health_data.heart_rate && health_data.heart_rate.record_count > 0;
    const hasBloodGlucose = health_data.blood_glucose && health_data.blood_glucose.record_count > 0;

    if (!hasBloodPressure && !hasHeartRate && !hasBloodGlucose) {
      return NextResponse.json(
        { success: false, error: 'NO_ANALYZABLE_DATA', message: 'No blood pressure, heart rate, or blood glucose data provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. 生成健康建議
    const result = await generateHealthAdvice({
      device_id,
      language: language || 'zh-TW',
      user_profile,
      health_data,
    });

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
    console.error('[API v1] 健康建議處理錯誤:', error);
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

async function generateHealthAdvice(request: HealthAdviceRequest) {
  const { language, user_profile, health_data } = request;

  try {
    const prompt = buildHealthPrompt(language, user_profile, health_data);

    const { text } = await generateText({
      model: 'google/gemini-3-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const jsonResponse = parseHealthAdviceResponse(text);

    // 確定分析了哪些類型
    const analyzedTypes: string[] = [];
    if (health_data.blood_pressure?.record_count) analyzedTypes.push('blood_pressure');
    if (health_data.heart_rate?.record_count) analyzedTypes.push('heart_rate');
    if (health_data.blood_glucose?.record_count) analyzedTypes.push('blood_glucose');

    return {
      success: true,
      analyzed_types: analyzedTypes,
      ...jsonResponse,
      disclaimer: getDisclaimer(language),
    };

  } catch (error) {
    console.error('健康建議生成錯誤:', error);
    return {
      success: false,
      error: 'AI_ERROR',
      message: language === 'zh-TW' ? '無法生成健康建議' : 'Unable to generate health advice',
      disclaimer: getDisclaimer(language),
    };
  }
}

function buildHealthPrompt(
  language: string,
  userProfile: UserProfile | undefined,
  healthData: HealthData
): string {
  const lang = language === 'zh-TW' ? '繁體中文' : 'English';

  // 動態生成數據描述
  const dataDescriptions: string[] = [];

  if (healthData.blood_pressure?.record_count) {
    const bp = healthData.blood_pressure;
    let bpDesc = `### 血壓數據 (${bp.record_count} 筆紀錄)\n`;
    if (bp.latest) {
      bpDesc += `- 最新測量: ${bp.latest.systolic}/${bp.latest.diastolic} mmHg`;
      if (bp.latest.pulse) bpDesc += `，脈搏 ${bp.latest.pulse} bpm`;
      bpDesc += ` (${bp.latest.timestamp})\n`;
    }
    if (bp.avg_systolic_7days) {
      bpDesc += `- 7日平均: ${bp.avg_systolic_7days.toFixed(0)}/${bp.avg_diastolic_7days?.toFixed(0)} mmHg\n`;
    }
    if (bp.min_systolic_7days && bp.max_systolic_7days) {
      bpDesc += `- 7日收縮壓範圍: ${bp.min_systolic_7days} ~ ${bp.max_systolic_7days} mmHg\n`;
    }
    dataDescriptions.push(bpDesc);
  }

  if (healthData.heart_rate?.record_count) {
    const hr = healthData.heart_rate;
    let hrDesc = `### 心率數據 (${hr.record_count} 筆紀錄)\n`;
    if (hr.latest) {
      hrDesc += `- 最新測量: ${hr.latest.value} bpm (${hr.latest.timestamp})\n`;
    }
    if (hr.avg_7days) {
      hrDesc += `- 7日平均: ${hr.avg_7days.toFixed(0)} bpm\n`;
    }
    if (hr.min_7days && hr.max_7days) {
      hrDesc += `- 7日範圍: ${hr.min_7days} ~ ${hr.max_7days} bpm\n`;
    }
    dataDescriptions.push(hrDesc);
  }

  if (healthData.blood_glucose?.record_count) {
    const bg = healthData.blood_glucose;
    let bgDesc = `### 血糖數據 (${bg.record_count} 筆紀錄)\n`;
    if (bg.latest) {
      const typeLabel = bg.latest.type === 'fasting' ? '空腹' :
                        bg.latest.type === 'postprandial' ? '餐後' :
                        bg.latest.type === 'random' ? '隨機' : '';
      bgDesc += `- 最新測量: ${bg.latest.value} mg/dL${typeLabel ? ` (${typeLabel})` : ''} (${bg.latest.timestamp})\n`;
    }
    if (bg.avg_7days) {
      bgDesc += `- 7日平均: ${bg.avg_7days.toFixed(0)} mg/dL\n`;
    }
    dataDescriptions.push(bgDesc);
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
| 餐後血糖 | < 140   | 140-199   | ≥ 200    |`;

  return `你是一位專業的健康顧問 AI。請根據以下健康數據提供綜合建議。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 健康數據
${dataDescriptions.join('\n')}
${references}

## 要求
1. 使用 ${lang} 回覆
2. 綜合評估所有提供的健康數據
3. 評估整體健康狀態等級：normal（正常）、elevated（偏高/需注意）、high（高風險）、critical（危險）
4. 提供具體可行的建議
5. 若有任何數據異常，在 warnings 中說明並建議就醫
6. 顏色代碼：normal=#4CAF50, elevated=#FFA500, high=#FF5722, critical=#F44336

## 回覆格式（嚴格 JSON）
{
  "status": {
    "level": "normal|elevated|high|critical",
    "title": "整體健康狀態標題",
    "description": "綜合評估說明（包含各項指標的簡要分析）",
    "color": "#顏色代碼"
  },
  "advice": {
    "summary": "簡短摘要（50字內）",
    "details": ["詳細分析1", "詳細分析2", "..."],
    "lifestyle": ["生活建議1", "生活建議2", "..."],
    "dietary": ["飲食建議1", "飲食建議2", "..."],
    "warnings": ["警告事項（若無則為空陣列）"],
    "should_see_doctor": false
  }
}

只輸出 JSON，不要其他文字。`;
}

function parseHealthAdviceResponse(text: string): { status: StatusResult; advice: AdviceResult } {
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
        advice: {
          summary: parsed.advice?.summary || '',
          details: parsed.advice?.details || [],
          lifestyle: parsed.advice?.lifestyle || [],
          dietary: parsed.advice?.dietary || [],
          warnings: parsed.advice?.warnings || [],
          should_see_doctor: parsed.advice?.should_see_doctor || false,
        },
      };
    }

    const parsed = JSON.parse(text);
    return { status: parsed.status, advice: parsed.advice };

  } catch (parseError) {
    console.error('解析健康建議回應失敗:', parseError);
    return {
      status: {
        level: 'normal',
        title: '無法分析',
        description: '無法解析健康數據',
        color: '#9E9E9E',
      },
      advice: {
        summary: '無法生成建議',
        details: [],
        lifestyle: [],
        dietary: [],
        warnings: ['建議諮詢醫療專業人員'],
        should_see_doctor: true,
      },
    };
  }
}

function getDisclaimer(language: string): string {
  return language === 'zh-TW'
    ? '此建議由 AI 生成，僅供參考，不能替代專業醫療診斷。如有健康疑慮，請諮詢醫生。'
    : 'This advice is AI-generated for reference only and cannot replace professional medical diagnosis. Please consult a doctor if you have health concerns.';
}
