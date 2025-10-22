'use client';

import { FC, useState } from 'react';
import { Activity, Heart, Scale } from 'lucide-react';
import HealthOCRUploadForm from './components/HealthOCRUploadForm';
import HealthOCRResults from './components/HealthOCRResults';
import { HealthOCRResult } from './components/HealthOCRUploadForm';

const HealthOCRPage: FC = () => {
  const [ocrResult, setOCRResult] = useState<HealthOCRResult | null>(null);

  const handleOCRComplete = (result: HealthOCRResult) => {
    setOCRResult(result);
  };

  const handleReset = () => {
    setOCRResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-12 w-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              健康設備 OCR 識別
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            上傳血壓計、身高體重計或血糖計照片，自動識別健康數據
          </p>
        </div>

        {/* 支援設備說明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 血壓計 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
            <div className="flex items-center mb-3">
              <Heart className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="font-semibold text-gray-800">血壓計</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 收縮壓 (SYS)</li>
              <li>• 舒張壓 (DIA)</li>
              <li>• 脈搏 (PULSE)</li>
              <li>• 自動評估血壓狀態</li>
            </ul>
          </div>

          {/* 身高體重計 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center mb-3">
              <Scale className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-800">身高體重計</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 身高 (cm)</li>
              <li>• 體重 (kg)</li>
              <li>• 自動計算 BMI</li>
              <li>• BMI 狀態評估</li>
            </ul>
          </div>

          {/* 血糖計 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-amber-500">
            <div className="flex items-center mb-3">
              <Activity className="h-6 w-6 text-amber-500 mr-2" />
              <h3 className="font-semibold text-gray-800">血糖計</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 血糖值 (mg/dL 或 mmol/L)</li>
              <li>• 測量類型 (空腹/餐後)</li>
              <li>• 自動評估血糖狀態</li>
              <li>• 參考範圍對照</li>
            </ul>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-green-600 rounded-r-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            使用說明
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>1. 拍攝設備螢幕照片（確保數字清晰可見）</li>
            <li>2. 上傳或拖曳照片到上傳區域</li>
            <li>3. 點擊「開始 AI 識別」按鈕</li>
            <li>4. 查看識別結果和健康狀態評估</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600 italic">
            提示：為了獲得最佳識別效果，請確保照片清晰、光線充足，避免反光和陰影
          </p>
        </div>

        {/* 上傳表單 */}
        <HealthOCRUploadForm onOCRComplete={handleOCRComplete} onReset={handleReset} />

        {/* 識別結果 */}
        {ocrResult && <HealthOCRResults result={ocrResult} />}
      </div>
    </div>
  );
};

export default HealthOCRPage;
