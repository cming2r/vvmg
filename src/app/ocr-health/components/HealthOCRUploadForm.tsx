'use client';

import { FC, useState, useRef, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Activity } from 'lucide-react';

// 血壓數據介面
export interface BloodPressureData {
  systolic: number | null;      // 收縮壓
  diastolic: number | null;     // 舒張壓
  pulse: number | null;         // 脈搏
}

// 身高體重數據介面
export interface BodyMeasurementData {
  height: number | null;                      // 身高數值
  heightUnit: 'cm' | 'ft' | 'in' | null;      // 身高單位
  weight: number | null;                      // 體重數值
  weightUnit: 'kg' | 'lbs' | null;            // 體重單位
}

// 血糖數據介面
export interface BloodGlucoseData {
  glucose: number | null;                               // 血糖值
  unit: 'mg/dL' | 'mmol/L' | null;                     // 血糖單位
  measurementType?: 'fasting' | 'postprandial' | 'random' | null;  // 測量類型：空腹/餐後/隨機
}

// 健康 OCR 結果介面
export interface HealthOCRResult {
  success: boolean;
  deviceType: 'blood_pressure' | 'body_measurement' | 'blood_glucose' | 'unknown';
  bloodPressure?: BloodPressureData;
  bodyMeasurement?: BodyMeasurementData;
  bloodGlucose?: BloodGlucoseData;
  date?: string | null;
  time?: string | null;
  rawText: string;
  error?: string;
}

interface HealthOCRUploadFormProps {
  onOCRComplete: (result: HealthOCRResult) => void;
  onReset?: () => void;
}

const HealthOCRUploadForm: FC<HealthOCRUploadFormProps> = ({ onOCRComplete, onReset }) => {
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
      // 調用後端 API 使用 GPT-5 進行健康設備 OCR
      const response = await fetch('/api/ocr-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: previewUrl, // base64 格式
        }),
      });

      const result: HealthOCRResult = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'OCR 識別失敗，請嘗試使用更清晰的圖片');
        onOCRComplete({
          success: false,
          deviceType: 'unknown',
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
        deviceType: 'unknown',
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
    // 清空父組件的識別結果
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Upload className="h-6 w-6 mr-2 text-blue-600" />
          上傳健康設備照片
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 text-green-500" />
          AI 健康數據識別
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
            支援血壓計、身高體重計、血糖計螢幕照片
          </p>
          <p className="text-xs text-gray-400 mt-1">
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
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  AI 識別中，請稍候...
                </>
              ) : (
                <>
                  <Activity className="h-5 w-5 mr-2" />
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

export default HealthOCRUploadForm;
