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

// 健康 OCR 結果介面
export interface HealthOCRResult {
  success: boolean;
  deviceType: 'blood_pressure' | 'body_measurement' | 'unknown';
  bloodPressure?: BloodPressureData;
  bodyMeasurement?: BodyMeasurementData;
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
    // 使用 GPT-5 進行健康設備 OCR 識別
    const { text } = await generateText({
      model: 'openai/gpt-5',
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

識別指示：
1. 首先判斷設備類型
2. 仔細識別螢幕上顯示的數字
3. 提取測量日期和時間（如果有）
4. **重要：識別並返回單位**
   - 血壓：通常是 mmHg
   - 脈搏：通常是 bpm (次/分鐘)
   - 身高：可能是 cm、ft（英尺）或 in（英寸）
   - 體重：可能是 kg 或 lbs（磅）
5. 支援的單位：
   - heightUnit: "cm" | "ft" | "in"
   - weightUnit: "kg" | "lbs"

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
 * 解析 AI 回應並驗證數據
 */
function parseHealthOCRResponse(text: string): HealthOCRResult {
  let deviceType: 'blood_pressure' | 'body_measurement' | 'unknown' = 'unknown';
  let bloodPressure: BloodPressureData | undefined;
  let bodyMeasurement: BodyMeasurementData | undefined;
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
      date = parsed.date || null;
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
      }
    } else {
      // 如果沒有 JSON 格式，嘗試直接解析
      const parsed = JSON.parse(text);
      deviceType = parsed.deviceType || 'unknown';
      date = parsed.date || null;
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

  return {
    success: true,
    deviceType,
    bloodPressure,
    bodyMeasurement,
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
