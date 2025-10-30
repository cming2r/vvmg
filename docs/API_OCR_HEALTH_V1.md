# 健康設備 OCR API v1 文檔

## 📋 概述

健康設備 OCR API 能夠識別血壓計、身高體重計和血糖計的螢幕數據，自動提取測量數值。

- **端點**: `https://vvmg.cc/api/v1/ocr-health`
- **版本**: v1
- **認證**: API Key (必需)

---

## 🔐 認證

所有請求必須在 HTTP Header 中提供有效的 API Key：

```http
x-api-key: your_api_key_here
```

### 獲取 API Key

請聯繫系統管理員獲取您的專屬 API Key。

---

## 📤 請求格式

### 端點 URL
```
POST https://vvmg.cc/api/v1/ocr-health
```

### Headers

| Header | 值 | 必需 | 說明 |
|--------|-----|------|------|
| `Content-Type` | `application/json` | ✅ | 內容類型 |
| `x-api-key` | `string` | ✅ | 您的 API Key |

### Request Body

```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "country_code": "TW",
  "device_type": "mobile",
  "add_from": "iOS App",
  "ip_address": "203.0.113.1"
}
```

#### 參數說明

| 參數 | 類型 | 必需 | 說明 |
|------|------|------|------|
| `image` | `string` | ✅ | Base64 編碼的圖片字符串，需包含 data URI 前綴 |
| `country_code` | `string` | ❌ | 國碼（如 TW、HK、US 等） |
| `device_type` | `string` | ❌ | 設備類型（如 mobile、tablet、desktop） |
| `add_from` | `string` | ❌ | 來源（如 iOS App、Android App、Web） |
| `ip_address` | `string` | ❌ | 用戶 IP 位置 |

#### 圖片要求

- **格式**: JPG, PNG, WEBP
- **大小**: 最大 15MB
- **編碼**: Base64
- **建議**: 圖片清晰、光線充足、避免反光和陰影

---

## 📥 響應格式

### 成功響應 - 血壓計

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "deviceType": "blood_pressure",
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 75
  },
  "year": "2024",
  "monthday": "01-15",
  "time": "09:30",
  "rawText": "原始 OCR 文本..."
}
```

#### 血壓數據說明

| 欄位 | 類型 | 單位 | 說明 |
|------|------|------|------|
| `systolic` | `number \| null` | mmHg | 收縮壓 (正常範圍: 90-120) |
| `diastolic` | `number \| null` | mmHg | 舒張壓 (正常範圍: 60-80) |
| `pulse` | `number \| null` | bpm | 脈搏/心率 (正常範圍: 60-100) |

#### 日期時間欄位說明

| 欄位 | 類型 | 格式 | 說明 |
|------|------|------|------|
| `year` | `string \| null` | YYYY | 年份（如：2024），如果設備未顯示則為 null |
| `monthday` | `string \| null` | MM-DD | 月日（如：01-15），如果設備未顯示則為 null |
| `time` | `string \| null` | HH:mm | 時間，**24小時制**（如：13:00 表示下午1點），如果設備未顯示則為 null |

**時間格式說明**：
- 統一使用 24 小時制（00:00 ~ 23:59）
- 如果設備顯示 12 小時制（AM/PM），系統會自動轉換
- 範例：01:00 PM → "13:00"，08:30 PM → "20:30"

### 成功響應 - 身高體重計

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "deviceType": "body_measurement",
  "bodyMeasurement": {
    "height": 175.5,
    "heightUnit": "cm",
    "weight": 70.2,
    "weightUnit": "kg"
  },
  "year": "2024",
  "monthday": "01-15",
  "time": "09:30",
  "rawText": "原始 OCR 文本..."
}
```

#### 身高體重數據說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| `height` | `number \| null` | 身高數值 |
| `heightUnit` | `"cm" \| "ft" \| "in" \| null` | 身高單位 |
| `weight` | `number \| null` | 體重數值 |
| `weightUnit` | `"kg" \| "lbs" \| null` | 體重單位 |

#### 支援的單位

**身高單位**:
- `cm` - 公分 (台灣、中國、歐洲)
- `ft` - 英尺 (美國)
- `in` - 英寸 (美國)

**體重單位**:
- `kg` - 公斤 (台灣、中國、歐洲)
- `lbs` - 磅 (美國)

### 成功響應 - 血糖計

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "deviceType": "blood_glucose",
  "bloodGlucose": {
    "glucose": 95,
    "unit": "mg/dL",
    "measurementType": "fasting"
  },
  "year": "2024",
  "monthday": "01-15",
  "time": "09:30",
  "rawText": "原始 OCR 文本..."
}
```

#### 血糖數據說明

| 欄位 | 類型 | 單位 | 說明 |
|------|------|------|------|
| `glucose` | `number \| null` | mg/dL 或 mmol/L | 血糖值 |
| `unit` | `"mg/dL" \| "mmol/L" \| null` | - | 血糖單位 |
| `measurementType` | `"fasting" \| "postprandial" \| "random" \| null` | - | 測量類型：空腹/餐後/隨機 |

#### 血糖正常範圍 (空腹)

**mg/dL (毫克/分升)**:
- 正常: 70-100
- 偏高: 100-125
- 糖尿病: ≥126

**mmol/L (毫摩爾/升)**:
- 正常: 3.9-5.6
- 偏高: 5.6-7.0
- 糖尿病: ≥7.0

### 成功響應 - 無法識別設備

**HTTP Status**: `200 OK`

```json
{
  "success": true,
  "deviceType": "unknown",
  "rawText": "原始 OCR 文本..."
}
```

### Response Headers

所有成功響應會包含速率限制資訊：

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705305600000
```

| Header | 說明 |
|--------|------|
| `X-RateLimit-Limit` | 每分鐘允許的請求總數 |
| `X-RateLimit-Remaining` | 當前窗口剩餘請求次數 |
| `X-RateLimit-Reset` | 速率限制重置時間 (Unix timestamp) |

---

## ❌ 錯誤響應

### 401 Unauthorized - API Key 無效

```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing API key",
  "message": "Please provide a valid API key in the x-api-key header"
}
```

**可能原因**:
- API Key 遺失
- API Key 無效
- API Key 已過期

### 429 Too Many Requests - 超過速率限制

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "resetTime": "2024-01-15T10:30:00.000Z"
}
```

**Response Headers**:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705305600000
```

**解決方法**:
- 等待直到 `resetTime` 後再發送請求
- 考慮實作請求佇列機制
- 聯繫管理員提升速率限制

### 400 Bad Request - 請求參數錯誤

```json
{
  "success": false,
  "deviceType": "unknown",
  "error": "Missing image data",
  "message": "Please provide an image in base64 format",
  "rawText": ""
}
```

**可能原因**:
- 缺少 `image` 參數
- Base64 編碼格式錯誤
- 圖片過大 (>15MB)

### 500 Internal Server Error - 服務器錯誤

```json
{
  "success": false,
  "deviceType": "unknown",
  "error": "Internal server error",
  "message": "An error occurred while processing your request",
  "rawText": ""
}
```

**可能原因**:
- AI 服務暫時不可用
- 圖片處理失敗
- 服務器內部錯誤

---

## 💡 使用範例

### JavaScript / Node.js

```javascript
async function recognizeHealthDevice(imageBase64, metadata = {}) {
  try {
    const response = await fetch('https://vvmg.cc/api/v1/ocr-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your_api_key_here'
      },
      body: JSON.stringify({
        image: imageBase64,
        country_code: metadata.country_code,    // 可選：如 'TW', 'HK', 'US'
        device_type: metadata.device_type,      // 可選：如 'mobile', 'tablet'
        add_from: metadata.add_from,            // 可選：如 'iOS App', 'Android App'
        ip_address: metadata.ip_address         // 可選：用戶 IP
      })
    });

    // 檢查速率限制
    const remaining = response.headers.get('X-RateLimit-Remaining');
    console.log(`剩餘請求次數: ${remaining}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '請求失敗');
    }

    const result = await response.json();

    if (result.success) {
      if (result.deviceType === 'blood_pressure') {
        console.log('血壓數據:');
        console.log(`收縮壓: ${result.bloodPressure.systolic} mmHg`);
        console.log(`舒張壓: ${result.bloodPressure.diastolic} mmHg`);
        console.log(`脈搏: ${result.bloodPressure.pulse} bpm`);
      } else if (result.deviceType === 'body_measurement') {
        console.log('身體測量數據:');
        console.log(`身高: ${result.bodyMeasurement.height} ${result.bodyMeasurement.heightUnit}`);
        console.log(`體重: ${result.bodyMeasurement.weight} ${result.bodyMeasurement.weightUnit}`);
      } else if (result.deviceType === 'blood_glucose') {
        console.log('血糖數據:');
        console.log(`血糖值: ${result.bloodGlucose.glucose} ${result.bloodGlucose.unit}`);
        console.log(`測量類型: ${result.bloodGlucose.measurementType}`);
      }
    }

    return result;

  } catch (error) {
    console.error('OCR 識別失敗:', error.message);
    throw error;
  }
}

// 使用範例
const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

// 基本使用（不含 metadata）
recognizeHealthDevice(imageBase64);

// 完整使用（含 metadata）
recognizeHealthDevice(imageBase64, {
  country_code: 'TW',
  device_type: 'mobile',
  add_from: 'iOS App',
  ip_address: '203.0.113.1'
});
```

### cURL

```bash
# 基本請求
curl -X POST https://vvmg.cc/api/v1/ocr-health \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KG...",
    "country_code": "TW",
    "device_type": "mobile",
    "add_from": "iOS App",
    "ip_address": "203.0.113.1"
  }'

# 使用文件（需先轉換為 base64）
IMAGE_BASE64=$(base64 -i blood_pressure.jpg)
curl -X POST https://vvmg.cc/api/v1/ocr-health \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d "{
    \"image\": \"data:image/jpeg;base64,${IMAGE_BASE64}\"
  }" | jq

# 查看速率限制資訊
curl -i -X POST https://vvmg.cc/api/v1/ocr-health \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{"image": "..."}' | grep "X-RateLimit"
```

---

## 🎯 最佳實踐

### 1. 錯誤處理

始終檢查 HTTP 狀態碼和 `success` 欄位：

```javascript
if (!response.ok || !result.success) {
  // 處理錯誤
  console.error(result.error, result.message);
}
```

### 2. 速率限制管理

監控 `X-RateLimit-Remaining` 並實作退避策略：

```javascript
const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
if (remaining <= 2) {
  console.warn('即將達到速率限制');
  // 實作延遲或佇列機制
}
```

### 3. 圖片優化

- 壓縮圖片大小
- 確保圖片清晰
- 裁剪至設備螢幕區域
- 調整光線和對比度

### 4. 重試機制

對於暫時性錯誤（500, 503），實作指數退避重試：

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

### 5. 數據驗證

檢查返回的數值是否在合理範圍內：

```javascript
function validateBloodPressure(bp) {
  if (bp.systolic < 70 || bp.systolic > 250) {
    console.warn('收縮壓異常');
  }
  if (bp.diastolic < 40 || bp.diastolic > 150) {
    console.warn('舒張壓異常');
  }
}
```

---

## 📊 支援的設備類型

### 血壓計 (blood_pressure)

**識別內容**:
- 收縮壓 (SYS)
- 舒張壓 (DIA)
- 脈搏 (PULSE)
- 測量日期時間

**設備品牌** (常見):
- Omron (歐姆龍)
- Microlife
- Beurer
- iHealth
- 其他符合標準顯示格式的血壓計

### 身高體重計 (body_measurement)

**識別內容**:
- 身高 (支援 cm, ft, in)
- 體重 (支援 kg, lbs)
- 測量日期時間

**設備品牌** (常見):
- Tanita
- Xiaomi (小米)
- Withings
- Omron
- 其他符合標準顯示格式的體重計

### 血糖計 (blood_glucose)

**識別內容**:
- 血糖值 (支援 mg/dL, mmol/L)
- 測量類型 (空腹/餐後/隨機)
- 測量日期時間

**設備品牌** (常見):
- Accu-Chek (羅氏)
- OneTouch (強生)
- Freestyle (亞培)
- Contour (拜耳)
- 其他符合標準顯示格式的血糖計

---

## 🔄 版本歷史

### v1.1.0 (當前版本)

**新增功能**:
- ✅ 血糖計數據識別
- ✅ 血糖單位支援 (mg/dL, mmol/L)
- ✅ 血糖測量類型識別 (空腹/餐後/隨機)

**既有功能**:
- ✅ 血壓計數據識別
- ✅ 身高體重計數據識別
- ✅ 多單位支援 (cm/ft/in, kg/lbs)
- ✅ API Key 認證
- ✅ CORS 支援

**限制**:
- 單次請求圖片大小限制 15MB
- 僅支援常見設備的標準顯示格式
- 不支援手寫數字

### v1.0.0

**初始版本**:
- ✅ 血壓計數據識別
- ✅ 身高體重計數據識別
- ✅ 多單位支援 (cm/ft/in, kg/lbs)

---

## 🆘 常見問題

### Q: 為什麼識別結果不準確？

**A**: 請確保：
1. 圖片清晰，無模糊
2. 光線充足，無強烈反光
3. 螢幕顯示完整可見
4. 圖片未經過度壓縮

### Q: 支援哪些圖片格式？

**A**: 支援 JPG, PNG, WEBP 格式，需使用 Base64 編碼並包含 data URI 前綴。

### Q: 速率限制能否調整？

**A**: 可以。請聯繫系統管理員根據您的使用需求調整配額。

### Q: 是否支援批量處理？

**A**: 當前版本每次請求處理一張圖片。如需批量處理，請在應用層面實作並遵守速率限制。

### Q: 數據如何收費？

**A**: 請聯繫銷售部門了解定價方案。

---

## 📞 技術支援

如有問題，請聯繫：

- **技術支援郵箱**: support@example.com
- **文檔**: https://docs.example.com
- **狀態頁**: https://status.example.com

---

**最後更新**: 2024-01-15
**API 版本**: v1.0.0
