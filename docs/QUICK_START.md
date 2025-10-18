# OCR API v1 快速開始指南

## 🚀 5 分鐘快速上手

### 1. 獲取 API Key

聯繫管理員獲取您的 API Key。

### 2. 發送第一個請求

```bash
curl -X POST https://your-domain.com/api/v1/ocr-health \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "image": "data:image/jpeg;base64,..."
  }'
```

### 3. 查看結果

**血壓計**:
```json
{
  "success": true,
  "deviceType": "blood_pressure",
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80,
    "pulse": 75
  }
}
```

**身高體重計**:
```json
{
  "success": true,
  "deviceType": "body_measurement",
  "bodyMeasurement": {
    "height": 175.5,
    "heightUnit": "cm",
    "weight": 70.2,
    "weightUnit": "kg"
  }
}
```

---

## 📚 完整文檔

- [健康設備 OCR API v1](./API_OCR_HEALTH_V1.md)
- [發票 OCR API v1](./API_OCR_AI_V1.md)

---

## ⚠️ 重要提醒

1. **認證**: 所有請求必須包含 `x-api-key` header
2. **速率限制**: 預設 10 次/分鐘
3. **圖片大小**: 最大 15MB
4. **圖片格式**: JPG, PNG, WEBP (Base64 編碼)

---

## 💡 常見錯誤

### 401 Unauthorized
- 檢查 API Key 是否正確
- 確認 header 名稱是 `x-api-key`

### 429 Too Many Requests
- 已達速率限制
- 查看 `X-RateLimit-Reset` header 了解何時可再次請求

### 400 Bad Request
- 檢查是否提供了 `image` 參數
- 確認 Base64 編碼格式正確

---

## 🔗 相關連結

- [API 狀態](https://status.example.com)
- [技術支援](mailto:support@example.com)
