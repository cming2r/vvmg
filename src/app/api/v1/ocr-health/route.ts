import { NextResponse } from 'next/server';
import { processHealthOCR, HealthOCRResult } from '@/services/ocr/health-ocr';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';
import { uploadImageToR2 } from '@/lib/r2/upload';
import { logOCRHealth } from '@/lib/supabase/ocr-logs';

/**
 * 外部 API - 健康設備 OCR v1
 * 需要 API Key 驗證，有速率限制
 */

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
    // 1. API Key 驗證
    const apiKey = req.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Invalid or missing API key',
          message: 'Please provide a valid API key in the x-api-key header',
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // 2. Rate Limiting 檢查
    const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
    if (isRateLimited(apiKey!, rateLimitPerMinute)) {
      const rateLimitInfo = getRateLimitInfo(apiKey!, rateLimitPerMinute);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again later.`,
          resetTime: new Date(rateLimitInfo.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: corsHeaders,
        }
      );
    }

    // 3. 驗證請求內容
    const body = await req.json();
    const { image, country_code, device_type, add_from, ip_address } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          deviceType: 'unknown',
          error: 'Missing image data',
          message: 'Please provide an image in base64 format',
          rawText: ''
        } as HealthOCRResult,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // 4. 調用核心處理邏輯（與內部 API 使用相同邏輯）
    const result = await processHealthOCR(image);

    // 5. 上傳圖片到 R2 並記錄到 Supabase
    try {
      // 上傳圖片到 R2（傳入國碼）
      const imageUrl = await uploadImageToR2(image, country_code);

      // 記錄到 Supabase
      await logOCRHealth({
        image_url: imageUrl,
        ocr_result: result,
        country_code: country_code || null,
        device_type: device_type || null,
        add_from: add_from || null,
        ip_address: ip_address || null,
      });

      console.log('[External API v1] OCR 記錄已保存:', imageUrl);
    } catch (logError) {
      // 記錄錯誤但不影響主流程回應
      console.error('[External API v1] 記錄保存失敗:', logError);
      // 即使記錄失敗，仍然返回 OCR 結果給用戶
    }

    // 6. 返回結果
    return NextResponse.json(result, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('[External API v1] 健康設備 OCR 處理錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        deviceType: 'unknown',
        error: 'Internal server error',
        message: 'An error occurred while processing your request',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined,
        rawText: ''
      } as HealthOCRResult,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
