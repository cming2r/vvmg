import { NextResponse } from 'next/server';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';
import { saveContactMessage, ContactMessage } from '@/lib/supabase/contact';

/**
 * 意見回饋 API
 * POST /api/contact
 */

// 請求介面
interface ContactRequest {
  // 回饋內容
  category: 'bug' | 'feature' | 'question' | 'other';
  subject?: string;
  message: string;
  notes?: string;
  contact_email?: string;
  // 來源資訊
  device_id: string;
  app_from: string;
  ip_address?: string;
  country_code?: string;
  client_info?: {
    os?: string;
    device?: string;
    browser?: string;
  };
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
    // 1. API Key 驗證
    const apiKey = req.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. 解析請求
    const body: ContactRequest = await req.json();
    const {
      category,
      subject,
      message,
      notes,
      contact_email,
      device_id,
      app_from,
      ip_address,
      country_code,
      client_info,
    } = body;

    // 3. 驗證必要欄位
    if (!device_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_DEVICE_ID', message: 'device_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!app_from) {
      return NextResponse.json(
        { success: false, error: 'MISSING_APP_FROM', message: 'app_from is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!category || !['bug', 'feature', 'question', 'other'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CATEGORY', message: 'category must be bug, feature, question, or other' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'MISSING_MESSAGE', message: 'message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Rate Limiting（每分鐘最多 5 次）
    const rateLimitPerMinute = 5;
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

    // 5. 儲存到資料庫
    const contactData: ContactMessage = {
      category,
      subject: subject || null,
      message: message.trim(),
      notes: notes || null,
      contact_email: contact_email || null,
      device_id,
      app_from,
      ip_address: ip_address || null,
      country_code: country_code || null,
      client_info: client_info || null,
    };

    await saveContactMessage(contactData);

    console.log(`[Contact API] 收到意見回饋: ${app_from} - ${category}`);

    // 6. 返回成功
    return NextResponse.json(
      { success: true, message: 'Feedback submitted successfully' },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Contact API] 處理錯誤:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
