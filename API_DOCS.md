# OCR API 文檔

## 概述

本系統提供兩套 OCR API：
- **內部 API** (`/api/*`) - 供網頁應用直接調用，無需驗證
- **外部 API v1** (`/api/v1/*`) - 供第三方調用，需要 API Key 驗證和速率限制

---

## 外部 API v1

### 基礎資訊

- **Base URL**: `https://your-domain.com/api/v1`
- **認證方式**: API Key (通過 `x-api-key` header)
- **速率限制**: 預設 10 次/分鐘（可配置）
- **內容類型**: `application/json`

### 認證

所有外部 API 請求都需要在 header 中提供 API Key：

```http
x-api-key: your_api_key_here
```

### 速率限制

API 響應會包含以下 headers：

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1234567890
```

---

## 1. 健康設備 OCR API

識別血壓計和身高體重計的螢幕數據。

### 端點

```
POST /api/v1/ocr-health
```

### 請求

#### Headers
```http
Content-Type: application/json
x-api-key: your_api_key_here
```

#### Body
```json
{
  "image": "data:image/png;base64,iVBORw0KG..."
}
```

**參數說明：**
- `image` (required): Base64 編碼的圖片字符串

### 響應

#### 成功 - 血壓計 (200 OK)
```json
{
  "success": true,
  "deviceType": "blood_pressure",
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 75
  },
  "date": "2024-01-15",
  "time": "09:30",
  "rawText": "..."
}
```

#### 成功 - 身高體重計 (200 OK)
```json
{
  "success": true,
  "deviceType": "body_measurement",
  "bodyMeasurement": {
    "height": 170.5,
    "weight": 65.2
  },
  "date": "2024-01-15",
  "time": "09:30",
  "rawText": "..."
}
```

#### 錯誤響應

**401 Unauthorized** - API Key 無效或缺失
```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing API key",
  "message": "Please provide a valid API key in the x-api-key header"
}
```

**429 Too Many Requests** - 超過速率限制
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "resetTime": "2024-01-15T10:30:00.000Z"
}
```

**400 Bad Request** - 缺少圖片
```json
{
  "success": false,
  "deviceType": "unknown",
  "error": "Missing image data",
  "message": "Please provide an image in base64 format",
  "rawText": ""
}
```

---

## 2. 發票 OCR API

識別發票上的商品項目、價格等資訊。

### 端點

```
POST /api/v1/ocr-ai
```

### 請求

#### Headers
```http
Content-Type: application/json
x-api-key: your_api_key_here
```

#### Body
```json
{
  "image": "data:image/png;base64,iVBORw0KG..."
}
```

### 響應

#### 成功 (200 OK)
```json
{
  "success": true,
  "date": "2017-07-04",
  "time": "18:06:16",
  "items": [
    {
      "description": "香氛蠟燭(海洋)",
      "quantity": "2",
      "unitPrice": "20",
      "price": "40"
    },
    {
      "description": "咖啡豆",
      "quantity": "1",
      "unitPrice": "350",
      "price": "350"
    }
  ],
  "rawText": "..."
}
```

#### 錯誤響應

與健康設備 OCR 相同的錯誤格式。

---

## 使用範例

### JavaScript / Node.js

```javascript
const response = await fetch('https://your-domain.com/api/v1/ocr-health', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your_api_key_here'
  },
  body: JSON.stringify({
    image: 'data:image/png;base64,...'
  })
});

const result = await response.json();

// 檢查速率限制
const remaining = response.headers.get('X-RateLimit-Remaining');
console.log(`剩餘請求次數: ${remaining}`);

if (result.success) {
  if (result.deviceType === 'blood_pressure') {
    console.log(`收縮壓: ${result.bloodPressure.systolic}`);
    console.log(`舒張壓: ${result.bloodPressure.diastolic}`);
    console.log(`脈搏: ${result.bloodPressure.pulse}`);
  }
}
```

### Python

```python
import requests
import base64

# 讀取圖片並轉為 base64
with open('blood_pressure.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')
    image_data = f'data:image/jpeg;base64,{image_base64}'

# 發送請求
response = requests.post(
    'https://your-domain.com/api/v1/ocr-health',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'your_api_key_here'
    },
    json={'image': image_data}
)

# 檢查速率限制
print(f"剩餘請求次數: {response.headers.get('X-RateLimit-Remaining')}")

result = response.json()
if result['success']:
    if result['deviceType'] == 'blood_pressure':
        bp = result['bloodPressure']
        print(f"收縮壓: {bp['systolic']}")
        print(f"舒張壓: {bp['diastolic']}")
        print(f"脈搏: {bp['pulse']}")
```

### cURL

```bash
curl -X POST https://your-domain.com/api/v1/ocr-health \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KG..."
  }'
```

---

## 內部 API（無需驗證）

如果您在同一應用內部使用，可以直接調用內部 API：

### 健康設備 OCR
```
POST /api/ocr-health
```

### 發票 OCR
```
POST /api/ocr-ai
```

**注意：** 內部 API 無需 API Key，無速率限制，僅供內部網頁使用。

---

## 環境變數配置

在 `.env.local` 文件中配置：

```env
# AI Gateway API Key
AI_GATEWAY_API_KEY=your_openai_api_key

# 外部 API Keys（逗號分隔）
OCR_API_KEYS=key1,key2,key3

# 速率限制（每分鐘請求次數）
RATE_LIMIT_PER_MINUTE=10

# CORS 允許的來源
ALLOWED_ORIGINS=*
```

---

## 錯誤碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 400 | 請求參數錯誤 |
| 401 | API Key 無效或缺失 |
| 429 | 超過速率限制 |
| 500 | 服務器內部錯誤 |

---

## 支援的圖片格式

- **格式**: JPG, PNG, WEBP
- **大小限制**: 最大 15MB
- **編碼**: Base64
- **建議**: 圖片清晰、光線充足、避免反光

---

## 技術支援

如有問題，請聯繫技術支援團隊。
