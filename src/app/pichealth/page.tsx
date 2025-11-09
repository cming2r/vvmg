'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type Language = 'en' | 'zh';

export default function PicHealthPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLocale') as Language;
    if (savedLang === 'en' || savedLang === 'zh') {
      setLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('preferredLocale', newLang);
  };

  const translations = {
    en: {
      hero: {
        title: 'PicHealth',
        subtitle: 'Snap, Record, Done - Health Management Made Effortless',
        description: 'Simply take a photo, AI automatically recognizes blood pressure, weight, and glucose data',
        detail1: 'Sync to Apple Health with one tap, making health management super simple',
        detail2: 'Smart health management tool designed for busy lifestyles',
        detail3: 'Supports blood pressure monitors, weight scales, glucose meters, and more',
        downloadBtn: 'Download Now',
        learnMoreBtn: 'Learn More'
      },
      features: {
        title: 'Core Features',
        subtitle: 'Powerful features to make health management easy and simple',
        items: [
          {
            icon: '🔍',
            title: 'Smart OCR Recognition',
            subtitle: '3 seconds from photo to data',
            description: 'Say goodbye to manual entry! Just point and shoot at your device screen, AI automatically recognizes and extracts values, units, and measurement time.',
            detail: 'Supports common health devices like blood pressure monitors, weight scales, and glucose meters.'
          },
          {
            icon: '💚',
            title: 'One-Tap Health Sync',
            subtitle: 'Seamless Apple Health integration',
            description: 'All data automatically syncs to Apple Health App, perfectly integrating with your health ecosystem.',
            detail: 'Supports blood pressure, weight, height, glucose, heart rate, and more health metrics.'
          },
          {
            icon: '📊',
            title: 'Smart Grouping',
            subtitle: 'Organized by date, easy history viewing',
            description: 'Automatically groups records by "Today", "Yesterday", and dates, with type filtering support.',
            detail: 'Clearly track every piece of health data and monitor health trends anytime.'
          }
        ]
      },
      devices: {
        title: 'Supported Device Types',
        subtitle: 'Compatible with common health devices',
        items: [
          {
            icon: '🩺',
            title: 'Blood Pressure Monitor',
            capabilities: 'Auto-recognizes: Systolic, Diastolic, Pulse',
            scenario: 'Daily monitoring for hypertension patients, family health management'
          },
          {
            icon: '⚖️',
            title: 'Weight Scale / Height Scale',
            capabilities: 'Units: kg, lbs (weight), cm, ft, in (height)',
            scenario: 'Weight loss plans, health management, growth tracking'
          },
          {
            icon: '💉',
            title: 'Glucose Meter',
            capabilities: 'Units: mg/dL, mmol/L',
            scenario: 'Blood glucose monitoring for diabetes patients'
          }
        ]
      },
      useCases: {
        title: 'Use Cases',
        subtitle: 'PicHealth helps you no matter your needs',
        items: [
          {
            icon: '🏥',
            title: 'Health Data Tracking',
            subtitle: 'Regular monitoring, grasp health trends',
            description: 'Diabetes and hypertension patients need regular data measurements. PicHealth makes recording effortless and lets you view long-term trend charts through Apple Health.'
          },
          {
            icon: '📈',
            title: 'Health Data Archiving',
            subtitle: 'Build complete health records',
            description: 'Regularly measure and record various health indicators to build a personal health database. Quickly provide reference to doctors during consultations for more precise medical care.'
          }
        ]
      },
      howItWorks: {
        title: 'Quick Start',
        subtitle: 'Three simple steps to begin your health management journey',
        steps: [
          {
            title: 'Download the App',
            description: 'Download PicHealth for free from the App Store, supports iOS 17 and above'
          },
          {
            title: 'Grant Health Permissions',
            description: 'On first use, grant camera and Apple Health permissions to ensure data syncs correctly'
          },
          {
            title: 'Start Photo Recording',
            description: 'Point at your health device screen and take a photo, AI automatically recognizes and syncs data - it\'s that simple!'
          }
        ]
      },
      whyChoose: {
        title: 'Why Choose PicHealth?',
        subtitle: 'Making health management smarter and simpler',
        items: [
          {
            icon: '⚡',
            title: 'Time-Saving',
            subtitle: '3 seconds vs. 30 seconds manual entry',
            description: 'Traditional manual entry requires: Open App → Select type → Enter values → Confirm time → Save',
            highlight: 'PicHealth only needs: Open App → Take photo → Done!'
          },
          {
            icon: '🎯',
            title: 'Accurate & Reliable',
            subtitle: 'AI recognition accuracy over 95%',
            description: 'Uses advanced OCR technology trained on tens of thousands of data points, achieving recognition accuracy over 95%.',
            highlight: 'Significantly reduces manual entry errors.'
          },
          {
            icon: '🔄',
            title: 'Seamless Integration',
            subtitle: 'Perfectly fits into Apple ecosystem',
            description: 'Data syncs directly to Apple Health, shareable with other health apps.',
            highlight: 'Apple Watch can view, iPhone can analyze, iPad can display.'
          },
          {
            icon: '😊',
            title: 'Simple Operation',
            subtitle: 'Three steps, easy for seniors',
            description: 'No complex operation learning needed, intuitive photo interface.',
            highlight: 'Even seniors unfamiliar with technology can easily use it.'
          }
        ]
      },
      faq: {
        title: 'FAQ',
        subtitle: 'Questions you might have',
        items: [
          {
            question: 'Which health devices does PicHealth support?',
            answer: 'Currently supports common blood pressure monitors, weight scales, glucose meters, and other health devices. As long as the device screen displays clearly, most brands can be recognized.'
          },
          {
            question: 'How accurate is the recognition?',
            answer: 'Under good lighting and clear screen conditions, recognition accuracy can reach over 95%. We recommend ensuring screen content is fully visible and free of strong reflections when taking photos.'
          },
          {
            question: 'Does it cost money?',
            answer: 'PicHealth is free to download with ads included. A paid version to remove ads and provide advanced features may be launched in the future.'
          },
          {
            question: 'Which iOS versions are supported?',
            answer: 'Requires iOS 17 or above. We recommend using iOS 17 or newer for the best experience.'
          },
          {
            question: 'What if recognition is wrong?',
            answer: 'You can check if the data is correct on the confirmation page. If there are errors, you can choose to retake the photo. After saving, you can also manually correct it in Apple Health.'
          }
        ]
      },
      download: {
        title: 'Download PicHealth Now',
        subtitle: 'Start your smart health management journey and make recording health data easy and simple',
        downloadBtn: 'Download on App Store',
        requirements: {
          title: 'System Requirements',
          items: [
            'iOS 17 or above',
            'Camera permission required',
            'Apple Health permission required',
            'Internet connection recommended (for OCR recognition)'
          ]
        }
      },
      footer: {
        copyright: '© 2025 PicHealth. All rights reserved.',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        support: 'Support',
        language: 'Language'
      }
    },
    zh: {
      hero: {
        title: 'PicHealth',
        subtitle: '拍照即記錄，健康管理零負擔',
        description: '只需拍照，AI 自動識別血壓、體重、血糖數據',
        detail1: '一鍵同步到 Apple 健康，讓健康管理變得超簡單',
        detail2: '專為忙碌的您設計的智慧健康管理工具',
        detail3: '支援血壓計、體重計、血糖計等多種健康設備',
        downloadBtn: '立即下載',
        learnMoreBtn: '了解更多'
      },
      features: {
        title: '核心功能',
        subtitle: '強大功能，讓健康管理變得輕鬆簡單',
        items: [
          {
            icon: '🔍',
            title: '智慧 OCR 識別',
            subtitle: '拍照 3 秒，自動識別健康數據',
            description: '告別手動輸入！只需對準設備螢幕拍照，AI 技術自動識別並擷取數值、單位和測量時間。',
            detail: '支援血壓計、體重計、血糖計等常見健康設備。'
          },
          {
            icon: '💚',
            title: '一鍵同步健康',
            subtitle: '無縫整合 Apple 健康生態',
            description: '所有數據自動同步到 Apple 健康 App，與您的健康生態系統完美整合。',
            detail: '支援血壓、體重、身高、血糖、心率等多種健康指標。'
          },
          {
            icon: '📊',
            title: '智慧分組管理',
            subtitle: '按日期分組，輕鬆查看歷史紀錄',
            description: '自動將紀錄按「今天」、「昨天」和日期分組顯示，支援類型篩選。',
            detail: '清楚掌握每一筆健康數據，隨時追蹤健康趨勢。'
          }
        ]
      },
      devices: {
        title: '支援的設備類型',
        subtitle: '相容市面上常見的健康設備',
        items: [
          {
            icon: '🩺',
            title: '血壓計',
            capabilities: '自動識別：收縮壓、舒張壓、脈搏',
            scenario: '高血壓患者日常監測、家庭健康管理'
          },
          {
            icon: '⚖️',
            title: '體重計 / 身高體重計',
            capabilities: '支援單位：kg、lbs（體重）、cm、ft、in（身高）',
            scenario: '減重計畫、健康管理、成長紀錄'
          },
          {
            icon: '💉',
            title: '血糖計',
            capabilities: '支援單位：mg/dL、mmol/L',
            scenario: '糖尿病患者血糖監測'
          }
        ]
      },
      useCases: {
        title: '使用場景',
        subtitle: '無論何種需求，PicHealth 都能幫助您',
        items: [
          {
            icon: '🏥',
            title: '健康數據追蹤',
            subtitle: '定期監測，掌握健康趨勢',
            description: '糖尿病、高血壓患者需要定期測量數據，PicHealth 讓記錄變得輕鬆，還能透過 Apple 健康查看長期趨勢圖表。'
          },
          {
            icon: '📈',
            title: '健康數據建檔',
            subtitle: '建立完整健康紀錄',
            description: '定期測量並記錄各項健康指標，建立個人健康資料庫。看診時可快速提供醫生參考，讓醫療照護更精準。'
          }
        ]
      },
      howItWorks: {
        title: '快速入門',
        subtitle: '簡單三步驟，開始您的健康管理之旅',
        steps: [
          {
            title: '下載應用程式',
            description: '從 App Store 免費下載 PicHealth，支援 iOS 17 以上版本'
          },
          {
            title: '授權健康權限',
            description: '首次使用時，授予相機和 Apple 健康權限，確保數據能正確同步'
          },
          {
            title: '開始拍照記錄',
            description: '對準健康設備螢幕拍照，AI 自動識別並同步數據，就是這麼簡單！'
          }
        ]
      },
      whyChoose: {
        title: '為什麼選擇 PicHealth？',
        subtitle: '讓健康管理變得更智慧、更簡單',
        items: [
          {
            icon: '⚡',
            title: '省時省力',
            subtitle: '3 秒完成 vs. 30 秒手動輸入',
            description: '傳統手動輸入需要：開啟 App → 選擇類型 → 輸入數值 → 確認時間 → 儲存',
            highlight: 'PicHealth 只需：開啟 App → 拍照 → 完成！'
          },
          {
            icon: '🎯',
            title: '精準可靠',
            subtitle: 'AI 識別準確率 95% 以上',
            description: '採用先進的 OCR 技術，經過數萬筆數據訓練，識別準確率高達 95% 以上。',
            highlight: '大幅減少人為輸入錯誤。'
          },
          {
            icon: '🔄',
            title: '無縫整合',
            subtitle: '完美融入 Apple 生態系統',
            description: '數據直接同步到 Apple 健康，可與其他健康 App 共享。',
            highlight: 'Apple Watch 可查看、iPhone 可分析、iPad 可展示。'
          },
          {
            icon: '😊',
            title: '操作簡單',
            subtitle: '三步驟完成，長輩也會用',
            description: '不需要複雜的操作學習，直覺的拍照介面。',
            highlight: '即使是不熟悉科技的長輩也能輕鬆使用。'
          }
        ]
      },
      faq: {
        title: '常見問題',
        subtitle: '您可能想知道的問題',
        items: [
          {
            question: 'PicHealth 支援哪些健康設備？',
            answer: '目前支援市面上常見的血壓計、體重計、血糖計等健康設備。只要設備螢幕顯示清晰，大部分品牌都能識別。'
          },
          {
            question: '識別準確率如何？',
            answer: '在光線充足、螢幕清晰的條件下，識別準確率可達 95% 以上。建議拍照時確保螢幕內容完整可見、無強烈反光。'
          },
          {
            question: '需要付費嗎？',
            answer: 'PicHealth 採用免費下載、內含廣告的模式。未來可能推出付費版本移除廣告並提供進階功能。'
          },
          {
            question: '支援哪些 iOS 版本？',
            answer: '需要 iOS 17 或以上版本。建議使用 iOS 17 或更新版本以獲得最佳體驗。'
          },
          {
            question: '如果識別錯誤怎麼辦？',
            answer: '您可以在確認頁面檢查數據是否正確，如有錯誤可選擇重新拍攝。儲存後也可在 Apple 健康中手動修正。'
          }
        ]
      },
      download: {
        title: '立即下載 PicHealth',
        subtitle: '開始您的智慧健康管理之旅，讓記錄健康數據變得輕鬆簡單',
        downloadBtn: 'App Store 下載',
        requirements: {
          title: '系統需求',
          items: [
            'iOS 17 或以上版本',
            '需要相機權限',
            '需要 Apple 健康權限',
            '建議有網路連線（用於 OCR 識別）'
          ]
        }
      },
      footer: {
        copyright: '© 2025 PicHealth. All rights reserved.',
        privacyPolicy: '隱私權政策',
        termsOfService: '服務條款',
        support: '支援',
        language: '語言'
      }
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t.hero.title}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 mb-4 font-semibold">
              {t.hero.subtitle}
            </p>
            <p className="text-xl text-gray-600 mb-8">
              {t.hero.description}
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              {t.hero.detail1}
              <br />
              {t.hero.detail2}
              <br />
              {t.hero.detail3}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#download"
                className="inline-block px-8 py-4 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors shadow-lg"
              >
                {t.hero.downloadBtn}
              </Link>
              <Link
                href="#features"
                className="inline-block px-8 py-4 bg-white text-green-500 font-semibold rounded-full border-2 border-green-500 hover:bg-green-50 transition-colors"
              >
                {t.hero.learnMoreBtn}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-10 right-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-green-300 rounded-full opacity-20 animate-pulse delay-300"></div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {t.features.items.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeFeature === index
                    ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-green-600 font-medium mb-2">
                  {feature.subtitle}
                </p>
                <p className="text-gray-600 mb-2">{feature.description}</p>
                {activeFeature === index && (
                  <p className="text-sm text-green-700 mt-4 font-medium">
                    {feature.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Devices */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.devices.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.devices.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.devices.items.map((device, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all"
              >
                <div className="text-5xl mb-4 text-center">{device.icon}</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                  {device.title}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{language === 'en' ? 'Capabilities' : '識別能力'}</p>
                    <p className="text-gray-700">{device.capabilities}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{language === 'en' ? 'Use Cases' : '適用場景'}</p>
                    <p className="text-gray-700">{device.scenario}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.useCases.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.useCases.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {t.useCases.items.map((useCase, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-white border-2 border-green-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{useCase.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-green-600 font-medium mb-3">
                      {useCase.subtitle}
                    </p>
                    <p className="text-gray-700">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.howItWorks.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-700">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose PicHealth */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.whyChoose.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.whyChoose.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {t.whyChoose.items.map((item, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-gradient-to-br from-white to-green-50 border-2 border-green-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-green-600 font-medium mb-3">
                      {item.subtitle}
                    </p>
                    <p className="text-gray-700 mb-2">
                      {item.description}
                    </p>
                    <p className="text-green-700 font-medium">
                      {item.highlight}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t.faq.title}
            </h2>
            <p className="text-xl text-gray-600">
              {t.faq.subtitle}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {t.faq.items.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-green-300 transition-all"
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <span className="text-2xl text-green-500 flex-shrink-0">
                    {activeFaq === index ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section id="download" className="py-20 bg-gradient-to-r from-green-500 to-green-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t.download.title}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t.download.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="#"
              className="inline-block px-8 py-4 bg-white text-green-500 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t.download.downloadBtn}
            </Link>
          </div>

          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-left">
            <h3 className="text-2xl font-semibold text-white mb-4">{t.download.requirements.title}</h3>
            <ul className="space-y-2 text-green-100">
              {t.download.requirements.items.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-white">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center">
          <p>{t.footer.copyright}</p>
          <div className="mt-4 flex justify-center gap-6 flex-wrap items-center">
            <Link href="/pichealth/privacy-policy" className="hover:text-white transition-colors">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="/pichealth/privacy-policy" className="hover:text-white transition-colors">
              {t.footer.termsOfService}
            </Link>
            <Link href="#faq" className="hover:text-white transition-colors">
              {t.footer.support}
            </Link>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => handleLanguageChange(language === 'en' ? 'zh' : 'en')}
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <span>🌐</span>
              <span>{language === 'en' ? 'English' : '中文'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
