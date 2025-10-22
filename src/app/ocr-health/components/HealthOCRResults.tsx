'use client';

import { FC, useState } from 'react';
import { Heart, Activity, ChevronDown, ChevronUp, Copy, Check, Scale, Ruler } from 'lucide-react';
import { HealthOCRResult } from './HealthOCRUploadForm';

interface HealthOCRResultsProps {
  result: HealthOCRResult;
}

const HealthOCRResults: FC<HealthOCRResultsProps> = ({ result }) => {
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(result.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  // 血壓狀態評估
  const getBloodPressureStatus = (systolic?: number | null, diastolic?: number | null) => {
    if (!systolic || !diastolic) return { status: '無法判定', color: 'text-gray-600' };

    if (systolic < 120 && diastolic < 80) {
      return { status: '正常', color: 'text-green-600' };
    } else if (systolic < 130 && diastolic < 80) {
      return { status: '血壓偏高', color: 'text-yellow-600' };
    } else if (systolic < 140 || diastolic < 90) {
      return { status: '高血壓前期', color: 'text-orange-600' };
    } else if (systolic < 180 && diastolic < 120) {
      return { status: '高血壓', color: 'text-red-600' };
    } else {
      return { status: '高血壓危症', color: 'text-red-700 font-bold' };
    }
  };

  // BMI 計算（如果有身高體重）
  const calculateBMI = (height?: number | null, weight?: number | null) => {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // BMI 狀態評估
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) {
      return { status: '體重過輕', color: 'text-blue-600' };
    } else if (bmi < 24) {
      return { status: '正常範圍', color: 'text-green-600' };
    } else if (bmi < 27) {
      return { status: '過重', color: 'text-yellow-600' };
    } else if (bmi < 30) {
      return { status: '輕度肥胖', color: 'text-orange-600' };
    } else if (bmi < 35) {
      return { status: '中度肥胖', color: 'text-red-600' };
    } else {
      return { status: '重度肥胖', color: 'text-red-700 font-bold' };
    }
  };

  const bpStatus = result.bloodPressure
    ? getBloodPressureStatus(result.bloodPressure.systolic, result.bloodPressure.diastolic)
    : null;

  const bmi = result.bodyMeasurement
    ? calculateBMI(result.bodyMeasurement.height, result.bodyMeasurement.weight)
    : null;

  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Activity className="h-6 w-6 mr-2 text-green-600" />
          識別結果
        </h2>
        <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
          {result.deviceType === 'blood_pressure' ? '血壓計' :
           result.deviceType === 'body_measurement' ? '身高體重計' :
           result.deviceType === 'blood_glucose' ? '血糖計' :
           '未知設備'}
        </span>
      </div>

      {/* 日期和時間 */}
      {(result.date || result.time) && (
        <div className="flex gap-6 mb-6 pb-4 border-b border-gray-200">
          {result.date && (
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-600 mr-2">日期:</span>
              <span className="text-gray-800">{result.date}</span>
            </div>
          )}
          {result.time && (
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-600 mr-2">時間:</span>
              <span className="text-gray-800">{result.time}</span>
            </div>
          )}
        </div>
      )}

      {/* 血壓數據 */}
      {result.bloodPressure && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">血壓數據</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 收縮壓 */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-600 mb-1">收縮壓 (SYS)</div>
              <div className="text-3xl font-bold text-red-700">
                {result.bloodPressure.systolic || '-'}
                <span className="text-lg ml-1">mmHg</span>
              </div>
            </div>

            {/* 舒張壓 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">舒張壓 (DIA)</div>
              <div className="text-3xl font-bold text-blue-700">
                {result.bloodPressure.diastolic || '-'}
                <span className="text-lg ml-1">mmHg</span>
              </div>
            </div>

            {/* 脈搏 */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-purple-600 mb-1">脈搏 (PULSE)</div>
              <div className="text-3xl font-bold text-purple-700">
                {result.bloodPressure.pulse || '-'}
                <span className="text-lg ml-1">bpm</span>
              </div>
            </div>
          </div>

          {/* 血壓狀態評估 */}
          {bpStatus && (
            <div className={`p-4 rounded-lg ${
              bpStatus.status === '正常' ? 'bg-green-50 border border-green-200' :
              bpStatus.status.includes('高血壓') ? 'bg-red-50 border border-red-200' :
              'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">血壓狀態:</span>
                <span className={`font-semibold ${bpStatus.color}`}>{bpStatus.status}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 身高體重數據 */}
      {result.bodyMeasurement && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Scale className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">身體測量數據</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 身高 */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center text-sm text-indigo-600 mb-1">
                <Ruler className="h-4 w-4 mr-1" />
                身高
              </div>
              <div className="text-3xl font-bold text-indigo-700">
                {result.bodyMeasurement.height || '-'}
                {result.bodyMeasurement.height && (
                  <span className="text-lg ml-1">{result.bodyMeasurement.heightUnit || 'cm'}</span>
                )}
              </div>
            </div>

            {/* 體重 */}
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center text-sm text-teal-600 mb-1">
                <Scale className="h-4 w-4 mr-1" />
                體重
              </div>
              <div className="text-3xl font-bold text-teal-700">
                {result.bodyMeasurement.weight || '-'}
                {result.bodyMeasurement.weight && (
                  <span className="text-lg ml-1">{result.bodyMeasurement.weightUnit || 'kg'}</span>
                )}
              </div>
            </div>
          </div>

          {/* BMI 計算結果 */}
          {bmi && bmiStatus && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">身體質量指數 (BMI)</div>
                    <div className="text-3xl font-bold text-blue-700">{bmi}</div>
                  </div>
                  <div className={`text-right ${bmiStatus.color}`}>
                    <div className="text-sm text-gray-600 mb-1">狀態</div>
                    <div className="text-lg font-semibold">{bmiStatus.status}</div>
                  </div>
                </div>
              </div>

              {/* BMI 參考範圍 */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <div className="font-medium mb-1">BMI 參考範圍:</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>體重過輕: &lt;18.5</div>
                  <div>正常範圍: 18.5-23.9</div>
                  <div>過重: 24-26.9</div>
                  <div>輕度肥胖: 27-29.9</div>
                  <div>中度肥胖: 30-34.9</div>
                  <div>重度肥胖: ≥35</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 血糖數據 */}
      {result.bloodGlucose && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">血糖數據</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* 血糖值 */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-amber-600 mb-1">
                    血糖值
                    {result.bloodGlucose.measurementType && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-100">
                        {result.bloodGlucose.measurementType === 'fasting' ? '空腹' :
                         result.bloodGlucose.measurementType === 'postprandial' ? '餐後' :
                         result.bloodGlucose.measurementType === 'random' ? '隨機' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-amber-700">
                    {result.bloodGlucose.glucose || '-'}
                    {result.bloodGlucose.glucose && result.bloodGlucose.unit && (
                      <span className="text-lg ml-1">{result.bloodGlucose.unit}</span>
                    )}
                  </div>
                </div>
                {result.bloodGlucose.glucose && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">狀態</div>
                    <div className={`text-lg font-semibold ${
                      result.bloodGlucose.unit === 'mg/dL' ? (
                        result.bloodGlucose.glucose < 70 ? 'text-blue-600' :
                        result.bloodGlucose.glucose <= 100 ? 'text-green-600' :
                        result.bloodGlucose.glucose <= 125 ? 'text-yellow-600' :
                        'text-red-600'
                      ) : (
                        result.bloodGlucose.glucose < 3.9 ? 'text-blue-600' :
                        result.bloodGlucose.glucose <= 5.6 ? 'text-green-600' :
                        result.bloodGlucose.glucose <= 7.0 ? 'text-yellow-600' :
                        'text-red-600'
                      )
                    }`}>
                      {result.bloodGlucose.unit === 'mg/dL' ? (
                        result.bloodGlucose.glucose < 70 ? '偏低' :
                        result.bloodGlucose.glucose <= 100 ? '正常' :
                        result.bloodGlucose.glucose <= 125 ? '偏高' :
                        '過高'
                      ) : (
                        result.bloodGlucose.glucose < 3.9 ? '偏低' :
                        result.bloodGlucose.glucose <= 5.6 ? '正常' :
                        result.bloodGlucose.glucose <= 7.0 ? '偏高' :
                        '過高'
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 血糖參考範圍 */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <div className="font-medium mb-1">血糖參考範圍 (空腹):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="font-medium text-gray-700 mb-1">mg/dL:</div>
                  <div>正常: 70-100 | 偏高: 100-125 | 過高: ≥126</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">mmol/L:</div>
                  <div>正常: 3.9-5.6 | 偏高: 5.6-7.0 | 過高: ≥7.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 無數據提示 */}
      {!result.bloodPressure && !result.bodyMeasurement && !result.bloodGlucose && (
        <div className="text-center py-8 text-gray-500">
          未識別到健康數據，請確保圖片清晰並包含設備螢幕顯示
        </div>
      )}

      {/* 原始文本展開/收起 */}
      <div className="mt-6 border-t pt-4">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-2"
        >
          {showRawText ? (
            <>
              <ChevronUp className="h-5 w-5 mr-1" />
              隱藏原始文本
            </>
          ) : (
            <>
              <ChevronDown className="h-5 w-5 mr-1" />
              顯示原始文本
            </>
          )}
        </button>

        {showRawText && (
          <div className="relative">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {result.rawText}
            </div>
            <button
              onClick={handleCopyText}
              className="absolute top-2 right-2 bg-white hover:bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm flex items-center transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  複製文本
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthOCRResults;
