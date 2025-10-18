import { NextResponse } from 'next/server';
import { processHealthOCR, HealthOCRResult } from '@/services/ocr/health-ocr';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          deviceType: 'unknown',
          error: '缺少圖片數據',
          rawText: ''
        } as HealthOCRResult,
        { status: 400 }
      );
    }

    // 調用核心處理邏輯
    const result = await processHealthOCR(image);

    return NextResponse.json(result);

  } catch (error) {
    console.error('健康設備 OCR 處理錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        deviceType: 'unknown',
        error: '處理圖片時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
        rawText: ''
      } as HealthOCRResult,
      { status: 500 }
    );
  }
}
