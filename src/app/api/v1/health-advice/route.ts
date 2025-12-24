import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';

/**
 * 外部 API - 健康建議 v1
 * 需要 API Key 驗證，有速率限制
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

interface HealthData {
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  blood_glucose?: number | null;
  glucose_type?: 'fasting' | 'postprandial' | 'random' | null;
  measurement_time?: string;
  avg_systolic_7days?: number | null;
  avg_diastolic_7days?: number | null;
  avg_heart_rate_7days?: number | null;
  min_systolic_7days?: number | null;
  max_systolic_7days?: number | null;
}

interface HealthAdviceRequest {
  device_id: string;
  language: string;
  analysis_type: 'blood_pressure' | 'blood_glucose' | 'heart_rate';
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
    const { device_id, language, analysis_type, user_profile, health_data } = body as HealthAdviceRequest;

    // 4. 驗證必要欄位
    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_DEVICE_ID', message: 'device_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!analysis_type || !['blood_pressure', 'blood_glucose', 'heart_rate'].includes(analysis_type)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ANALYSIS_TYPE', message: 'analysis_type must be one of: blood_pressure, blood_glucose, heart_rate' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!health_data) {
      return NextResponse.json(
        { success: false, error: 'MISSING_HEALTH_DATA', message: 'health_data is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. 生成健康建議
    const result = await generateHealthAdvice({
      device_id,
      language: language || 'zh-TW',
      analysis_type,
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
  const { language, user_profile, health_data, analysis_type } = request;

  try {
    const prompt = buildHealthPrompt(language, user_profile, health_data, analysis_type);

    const { text } = await generateText({
      model: 'google/gemini-3-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const jsonResponse = parseHealthAdviceResponse(text);

    return {
      success: true,
      analysis_type,
      ...jsonResponse,
      disclaimer: getDisclaimer(language),
    };

  } catch (error) {
    console.error('健康建議生成錯誤:', error);
    return {
      success: false,
      analysis_type,
      error: 'AI_ERROR',
      message: language === 'zh-TW' ? '無法生成健康建議' : 'Unable to generate health advice',
      disclaimer: getDisclaimer(language),
    };
  }
}

function buildHealthPrompt(
  language: string,
  userProfile: UserProfile | undefined,
  healthData: HealthData,
  analysisType: string
): string {
  const lang = language === 'zh-TW' ? '繁體中文' : 'English';

  const bloodPressureReference = `
## 血壓標準參考
| 等級         | 收縮壓  | 舒張壓 | level    |
|--------------|---------|--------|----------|
| 正常         | < 120   | < 80   | normal   |
| 偏高         | 120-129 | < 80   | elevated |
| 高血壓第一期 | 130-139 | 80-89  | high     |
| 高血壓第二期 | ≥ 140   | ≥ 90   | high     |
| 高血壓危象   | > 180   | > 120  | critical |`;

  const bloodGlucoseReference = `
## 血糖標準參考 (mg/dL)
| 類型     | 正常    | 偏高      | 糖尿病   |
|----------|---------|-----------|----------|
| 空腹血糖 | < 100   | 100-125   | ≥ 126    |
| 餐後血糖 | < 140   | 140-199   | ≥ 200    |`;

  const reference = analysisType === 'blood_pressure' ? bloodPressureReference :
                    analysisType === 'blood_glucose' ? bloodGlucoseReference : '';

  return `你是一位專業的健康顧問 AI。請根據以下健康數據提供建議。

## 用戶資料
${userProfile ? JSON.stringify(userProfile, null, 2) : '未提供'}

## 健康數據
${JSON.stringify(healthData, null, 2)}

## 分析類型
${analysisType}
${reference}

## 要求
1. 使用 ${lang} 回覆
2. 評估健康狀態等級：normal（正常）、elevated（偏高）、high（高）、critical（危險）
3. 提供具體可行的建議
4. 若數據異常，建議就醫
5. 顏色代碼：normal=#4CAF50, elevated=#FFA500, high=#FF5722, critical=#F44336

## 回覆格式（嚴格 JSON）
{
  "status": {
    "level": "normal|elevated|high|critical",
    "title": "狀態標題",
    "description": "詳細描述",
    "color": "#顏色代碼"
  },
  "advice": {
    "summary": "簡短摘要（50字內）",
    "details": ["詳細分析1", "詳細分析2"],
    "lifestyle": ["生活建議1", "生活建議2"],
    "dietary": ["飲食建議1", "飲食建議2"],
    "warnings": ["警告事項"],
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
