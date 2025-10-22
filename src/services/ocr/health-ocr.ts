import { generateText } from 'ai';

// 血壓數據介面
export interface BloodPressureData {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
}

// 身高體重數據介面
export interface BodyMeasurementData {
  height: number | null;
  heightUnit: 'cm' | 'ft' | 'in' | null;  // 身高單位
  weight: number | null;
  weightUnit: 'kg' | 'lbs' | null;        // 體重單位
}

// 血糖數據介面
export interface BloodGlucoseData {
  glucose: number | null;                 // 血糖值
  unit: 'mg/dL' | 'mmol/L' | null;       // 血糖單位
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

/**
 * 處理健康設備 OCR 識別
 * @param imageBase64 - Base64 編碼的圖片
 * @returns 健康數據識別結果
 */
export async function processHealthOCR(imageBase64: string): Promise<HealthOCRResult> {
  try {
    // 使用 Gemini 2.5 Flash Image 進行健康設備 OCR 識別
    const { text } = await generateText({
      model: 'google/gemini-2.5-flash-image',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `請仔細分析這張健康設備照片，識別設備類型並提取數據。

支援的設備類型：
1. **血壓計** - 顯示收縮壓(SYS)、舒張壓(DIA)、脈搏(PULSE)
2. **身高體重計** - 顯示身高(cm)、體重(kg)
3. **血糖計** - 顯示血糖值（mg/dL 或 mmol/L）

識別指示：
1. 首先判斷設備類型
2. 仔細識別螢幕上顯示的數字
3. 提取測量日期和時間（如果有）
   - 日期格式：YYYY-MM-DD
   - 如果圖片只顯示月日（如 01/15），請使用當前年份 ${new Date().getFullYear()}
   - 如果完全沒有日期，則不返回 date 欄位
4. **重要：識別並返回單位**
   - 血壓：通常是 mmHg
   - 脈搏：通常是 bpm (次/分鐘)
   - 身高：可能是 cm、ft（英尺）或 in（英寸）
   - 體重：可能是 kg 或 lbs（磅）
   - 血糖：可能是 mg/dL（毫克/分升）或 mmol/L（毫摩爾/升）
5. 支援的單位：
   - heightUnit: "cm" | "ft" | "in"
   - weightUnit: "kg" | "lbs"
   - glucoseUnit: "mg/dL" | "mmol/L"

返回格式（純 JSON，不要 markdown 包裝）：

**如果是血壓計：**
{
  "deviceType": "blood_pressure",
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 75
  },
  "date": "2024-01-15",
  "time": "09:30"
}

**如果是身高體重計：**
{
  "deviceType": "body_measurement",
  "bodyMeasurement": {
    "height": 170.5,
    "heightUnit": "cm",
    "weight": 65.2,
    "weightUnit": "kg"
  },
  "date": "2024-01-15",
  "time": "09:30"
}

**如果是血糖計：**
{
  "deviceType": "blood_glucose",
  "bloodGlucose": {
    "glucose": 95,
    "unit": "mg/dL",
    "measurementType": "fasting"
  },
  "date": "2024-01-15",
  "time": "09:30"
}

**如果無法識別：**
{
  "deviceType": "unknown"
}

範例：
- 血壓計螢幕顯示 "SYS 130 DIA 85 PULSE 72"
  → {"deviceType": "blood_pressure", "bloodPressure": {"systolic": 130, "diastolic": 85, "pulse": 72}}

- 體重計顯示 "身高 175cm 體重 70.5kg"
  → {"deviceType": "body_measurement", "bodyMeasurement": {"height": 175, "heightUnit": "cm", "weight": 70.5, "weightUnit": "kg"}}

- 體重計顯示 "Height 5.7 ft Weight 154 lbs"
  → {"deviceType": "body_measurement", "bodyMeasurement": {"height": 5.7, "heightUnit": "ft", "weight": 154, "weightUnit": "lbs"}}

- 血糖計顯示 "95 mg/dL" 或 "空腹血糖 95"
  → {"deviceType": "blood_glucose", "bloodGlucose": {"glucose": 95, "unit": "mg/dL", "measurementType": "fasting"}}

- 血糖計顯示 "5.3 mmol/L" 或 "餐後血糖 5.3"
  → {"deviceType": "blood_glucose", "bloodGlucose": {"glucose": 5.3, "unit": "mmol/L", "measurementType": "postprandial"}}

重要：
- 數值必須是數字類型（number），不要加引號
- 如果某個數值找不到，設為 null
- 只返回 JSON，不要任何其他文字

請開始分析圖片：`
            },
            {
              type: 'image',
              image: imageBase64
            }
          ]
        }
      ],
      temperature: 0.1,
    });

    // 解析 AI 返回的 JSON
    return parseHealthOCRResponse(text);

  } catch (error) {
    console.error('健康設備 OCR 處理錯誤:', error);
    throw error;
  }
}

/**
 * 處理日期格式，如果沒有年份則補上當前年份
 */
function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  // 如果已經是完整的 YYYY-MM-DD 格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // 如果是 MM-DD 或 MM/DD 格式，補上當前年份
  const currentYear = new Date().getFullYear();

  // 處理 MM-DD 格式
  if (/^\d{2}-\d{2}$/.test(dateStr)) {
    return `${currentYear}-${dateStr}`;
  }

  // 處理 MM/DD 格式
  if (/^\d{2}\/\d{2}$/.test(dateStr)) {
    return `${currentYear}-${dateStr.replace('/', '-')}`;
  }

  // 處理 M-D 或 M/D 格式（單數字月日）
  const monthDayMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (monthDayMatch) {
    const month = monthDayMatch[1].padStart(2, '0');
    const day = monthDayMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * 解析 AI 回應並驗證數據
 */
function parseHealthOCRResponse(text: string): HealthOCRResult {
  let deviceType: 'blood_pressure' | 'body_measurement' | 'blood_glucose' | 'unknown' = 'unknown';
  let bloodPressure: BloodPressureData | undefined;
  let bodyMeasurement: BodyMeasurementData | undefined;
  let bloodGlucose: BloodGlucoseData | undefined;
  let date: string | null = null;
  let time: string | null = null;
  const rawText = text;

  try {
    // 提取 JSON 部分（處理可能的 markdown 包裝）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      deviceType = parsed.deviceType || 'unknown';
      date = normalizeDate(parsed.date || null);
      time = parsed.time || null;

      // 根據設備類型提取數據
      if (deviceType === 'blood_pressure' && parsed.bloodPressure) {
        bloodPressure = {
          systolic: parsed.bloodPressure.systolic || null,
          diastolic: parsed.bloodPressure.diastolic || null,
          pulse: parsed.bloodPressure.pulse || null,
        };
      } else if (deviceType === 'body_measurement' && parsed.bodyMeasurement) {
        bodyMeasurement = {
          height: parsed.bodyMeasurement.height || null,
          heightUnit: parsed.bodyMeasurement.heightUnit || null,
          weight: parsed.bodyMeasurement.weight || null,
          weightUnit: parsed.bodyMeasurement.weightUnit || null,
        };
      } else if (deviceType === 'blood_glucose' && parsed.bloodGlucose) {
        bloodGlucose = {
          glucose: parsed.bloodGlucose.glucose || null,
          unit: parsed.bloodGlucose.unit || null,
          measurementType: parsed.bloodGlucose.measurementType || null,
        };
      }
    } else {
      // 如果沒有 JSON 格式，嘗試直接解析
      const parsed = JSON.parse(text);
      deviceType = parsed.deviceType || 'unknown';
      date = normalizeDate(parsed.date || null);
      time = parsed.time || null;

      if (deviceType === 'blood_pressure' && parsed.bloodPressure) {
        bloodPressure = {
          systolic: parsed.bloodPressure.systolic || null,
          diastolic: parsed.bloodPressure.diastolic || null,
          pulse: parsed.bloodPressure.pulse || null,
        };
      } else if (deviceType === 'body_measurement' && parsed.bodyMeasurement) {
        bodyMeasurement = {
          height: parsed.bodyMeasurement.height || null,
          heightUnit: parsed.bodyMeasurement.heightUnit || null,
          weight: parsed.bodyMeasurement.weight || null,
          weightUnit: parsed.bodyMeasurement.weightUnit || null,
        };
      } else if (deviceType === 'blood_glucose' && parsed.bloodGlucose) {
        bloodGlucose = {
          glucose: parsed.bloodGlucose.glucose || null,
          unit: parsed.bloodGlucose.unit || null,
          measurementType: parsed.bloodGlucose.measurementType || null,
        };
      }
    }
  } catch (parseError) {
    console.error('解析 AI 回應失敗:', parseError);
    deviceType = 'unknown';
  }

  // 驗證數據合理性
  if (bloodPressure) {
    bloodPressure = validateBloodPressure(bloodPressure);
  }

  if (bodyMeasurement) {
    bodyMeasurement = validateBodyMeasurement(bodyMeasurement);
  }

  if (bloodGlucose) {
    bloodGlucose = validateBloodGlucose(bloodGlucose);
  }

  return {
    success: true,
    deviceType,
    bloodPressure,
    bodyMeasurement,
    bloodGlucose,
    date,
    time,
    rawText,
  };
}

/**
 * 驗證血壓數據合理性
 */
function validateBloodPressure(data: BloodPressureData): BloodPressureData {
  // 血壓範圍驗證 (一般範圍：收縮壓 70-250, 舒張壓 40-150, 脈搏 40-200)
  if (data.systolic && (data.systolic < 70 || data.systolic > 250)) {
    data.systolic = null;
  }
  if (data.diastolic && (data.diastolic < 40 || data.diastolic > 150)) {
    data.diastolic = null;
  }
  if (data.pulse && (data.pulse < 40 || data.pulse > 200)) {
    data.pulse = null;
  }
  return data;
}

/**
 * 驗證身高體重數據合理性
 */
function validateBodyMeasurement(data: BodyMeasurementData): BodyMeasurementData {
  // 身高體重範圍驗證 (身高 50-250cm, 體重 10-300kg)
  if (data.height && (data.height < 50 || data.height > 250)) {
    data.height = null;
  }
  if (data.weight && (data.weight < 10 || data.weight > 300)) {
    data.weight = null;
  }
  return data;
}

/**
 * 驗證血糖數據合理性
 */
function validateBloodGlucose(data: BloodGlucoseData): BloodGlucoseData {
  // 血糖範圍驗證
  if (data.glucose && data.unit === 'mg/dL') {
    // mg/dL 單位：一般範圍 40-400
    if (data.glucose < 40 || data.glucose > 400) {
      data.glucose = null;
    }
  } else if (data.glucose && data.unit === 'mmol/L') {
    // mmol/L 單位：一般範圍 2.2-22.2 (相當於 40-400 mg/dL)
    if (data.glucose < 2.2 || data.glucose > 22.2) {
      data.glucose = null;
    }
  }
  return data;
}
