import { NextResponse } from 'next/server';
import { processInvoiceOCR, InvoiceOCRResult } from '@/services/ocr/invoice-ocr';
import { validateApiKey, isRateLimited, getRateLimitInfo, getCorsHeaders } from '@/lib/api/security';

/**
 * 外部 API - 發票 OCR v1
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
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': rateLimitPerMinute.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
          },
        }
      );
    }

    // 3. 驗證請求內容
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing image data',
          message: 'Please provide an image in base64 format',
          items: [],
          rawText: ''
        } as InvoiceOCRResult,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // 4. 調用核心處理邏輯（與內部 API 使用相同邏輯）
    const result = await processInvoiceOCR(image);

    // 5. 獲取速率限制信息
    const rateLimitInfo = getRateLimitInfo(apiKey!, rateLimitPerMinute);

    // 6. 返回結果，附帶 Rate Limit 標頭
    return NextResponse.json(result, {
      headers: {
        ...corsHeaders,
        'X-RateLimit-Limit': rateLimitPerMinute.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
      },
    });

  } catch (error) {
    console.error('[External API v1] 發票 OCR 處理錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while processing your request',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined,
        items: [],
        rawText: ''
      } as InvoiceOCRResult,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
