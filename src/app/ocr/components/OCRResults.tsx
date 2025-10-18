'use client';

import { FC, useState } from 'react';
import { Receipt, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { OCRResult } from './OCRUploadForm';

interface OCRResultsProps {
  result: OCRResult;
}

const OCRResults: FC<OCRResultsProps> = ({ result }) => {
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

  // 計算總價（只計算有有效價格的項目）
  const calculateTotal = (): number => {
    return result.items.reduce((sum, item) => {
      if (item.price) {
        const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericPrice)) {
          return sum + numericPrice;
        }
      }
      return sum;
    }, 0);
  };

  const total = calculateTotal();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      {/* 標題 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Receipt className="h-6 w-6 mr-2 text-green-600" />
          識別結果
        </h2>
        <span className="text-sm text-gray-600">
          找到 {result.items.length} 個項目
        </span>
      </div>

      {/* 日期和時間 */}
      {(result.date || result.time) && (
        <div className="flex gap-6 mb-4 pb-4 border-b border-gray-200">
          {result.date && (
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-600 mr-2">
                日期:
              </span>
              <span className="text-gray-800">{result.date}</span>
            </div>
          )}
          {result.time && (
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-600 mr-2">
                時間:
              </span>
              <span className="text-gray-800">{result.time}</span>
            </div>
          )}
        </div>
      )}

      {result.items.length === 0 ? (
        // 沒有識別到項目
        <div className="text-center py-8 text-gray-500">
          未識別到任何項目，請嘗試上傳更清晰的圖片
        </div>
      ) : (
        <>
          {/* 項目列表 */}
          <div className="space-y-2 mb-4 overflow-x-auto">
            {/* 表頭 */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b-2 border-gray-300 font-semibold text-gray-700 min-w-[600px]">
              <div className="col-span-5 text-left">
                項目
              </div>
              <div className="col-span-2 text-center">
                數量
              </div>
              <div className="col-span-2 text-right">
                單價
              </div>
              <div className="col-span-3 text-right">
                總價
              </div>
            </div>

            {/* 項目行 */}
            {result.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors min-w-[600px]"
              >
                <div className="col-span-5 text-gray-800">
                  {item.description || `項目 ${index + 1}`}
                </div>
                <div className="col-span-2 text-center text-gray-700">
                  {item.quantity || '-'}
                </div>
                <div className="col-span-2 text-right text-gray-700">
                  {item.unitPrice || '-'}
                </div>
                <div className="col-span-3 text-right font-medium text-gray-900">
                  {item.price || '-'}
                </div>
              </div>
            ))}

            {/* 總計 */}
            {total > 0 && (
              <div className="grid grid-cols-12 gap-2 pt-3 mt-2 border-t-2 border-gray-300 font-bold text-lg min-w-[600px]">
                <div className="col-span-9 text-right text-gray-800">
                  總計
                </div>
                <div className="col-span-3 text-right text-blue-600">
                  {total.toFixed(2)}
                </div>
              </div>
            )}
          </div>

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
        </>
      )}
    </div>
  );
};

export default OCRResults;
