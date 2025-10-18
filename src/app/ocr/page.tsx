'use client';

import { FC, useState } from 'react';
import { FileText } from 'lucide-react';
import OCRUploadForm from './components/OCRUploadForm';
import OCRResults from './components/OCRResults';
import { OCRResult } from './components/OCRUploadForm';

const OCRPage: FC = () => {
  const [ocrResult, setOCRResult] = useState<OCRResult | null>(null);

  const handleOCRComplete = (result: OCRResult) => {
    setOCRResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              發票 OCR 識別工具
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            上傳發票圖片，自動識別項目和價格
          </p>
        </div>

        {/* 使用說明 */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            使用說明
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li>1. 上傳或拖曳發票圖片</li>
            <li>2. 點擊「開始識別」按鈕</li>
            <li>3. 查看識別結果，系統會自動提取項目和價格</li>
          </ul>
          <p className="mt-4 text-sm text-blue-700 italic">
            提示：為了獲得最佳識別效果，請確保圖片清晰，光線充足，並避免模糊或傾斜
          </p>
        </div>

        {/* 上傳表單 */}
        <OCRUploadForm onOCRComplete={handleOCRComplete} />

        {/* 識別結果 */}
        {ocrResult && <OCRResults result={ocrResult} />}
      </div>
    </div>
  );
};

export default OCRPage;
