'use client';

import { FC, useState, useRef, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Sparkles } from 'lucide-react';

// OCR 項目介面
export interface InvoiceItem {
  description: string;
  quantity: string | null;
  unitPrice: string | null;
  price: string | null;
  confidence?: number;
}

// OCR 結果介面
export interface OCRResult {
  success: boolean;
  date?: string | null;
  time?: string | null;
  items: InvoiceItem[];
  rawText: string;
  error?: string;
}

interface OCRUploadFormProps {
  onOCRComplete: (result: OCRResult) => void;
}

const OCRUploadForm: FC<OCRUploadFormProps> = ({ onOCRComplete }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File): void => {
    // 檢查文件是否為圖片
    if (!file.type.startsWith('image/')) {
      setError('請上傳圖片文件');
      return;
    }

    // 檢查文件大小 (不超過15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('圖片大小不能超過15MB');
      return;
    }

    setError('');
    setImageFile(file);

    // 創建預覽 URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleOCRRecognition = async (): Promise<void> => {
    if (!imageFile || !previewUrl) return;

    setIsProcessing(true);
    setError('');

    try {
      // 調用後端 API 使用 GPT-5-nano 進行 OCR
      const response = await fetch('/api/ocr-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: previewUrl, // base64 格式
        }),
      });

      const result: OCRResult = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'OCR 識別失敗，請嘗試使用更清晰的圖片');
        onOCRComplete({
          success: false,
          items: [],
          rawText: '',
          error: result.error || 'OCR 識別失敗，請嘗試使用更清晰的圖片'
        });
        return;
      }

      // 回調函數，傳遞 OCR 結果
      onOCRComplete(result);

    } catch (err) {
      console.error('OCR 識別錯誤:', err);
      const errorMessage = err instanceof Error ? err.message : 'OCR 識別失敗，請嘗試使用更清晰的圖片';
      setError(errorMessage);
      onOCRComplete({
        success: false,
        items: [],
        rawText: '',
        error: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = (): void => {
    setImageFile(null);
    setPreviewUrl('');
    setError('');
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Upload className="h-6 w-6 mr-2 text-blue-600" />
          上傳發票圖片
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          由 GPT-5 提供支援
        </div>
      </div>

      {!previewUrl ? (
        // 上傳區域
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 text-center"
        >
          <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-base text-gray-600 mb-2">
            拖曳圖片到這裡 或 點擊上傳
          </p>
          <p className="text-sm text-gray-500">
            支援 JPG, PNG, WEBP 等格式，最大15MB
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        // 預覽區域
        <div className="space-y-4">
          <div className="relative w-full h-96 border rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={previewUrl}
              alt="圖片預覽"
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleOCRRecognition}
              disabled={isProcessing}
              className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  AI 識別中，請稍候...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  開始 AI 識別
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              重新上傳
            </button>
          </div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default OCRUploadForm;
