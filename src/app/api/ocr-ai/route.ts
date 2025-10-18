import { NextResponse } from 'next/server';
import { processInvoiceOCR, InvoiceOCRResult } from '@/services/ocr/invoice-ocr';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少圖片數據',
          items: [],
          rawText: ''
        } as InvoiceOCRResult,
        { status: 400 }
      );
    }

    // 調用核心處理邏輯
    const result = await processInvoiceOCR(image);

    return NextResponse.json(result);

  } catch (error) {
    console.error('發票 OCR 處理錯誤:', error);

    return NextResponse.json(
      {
        success: false,
        error: '處理圖片時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
        items: [],
        rawText: ''
      } as InvoiceOCRResult,
      { status: 500 }
    );
  }
}
