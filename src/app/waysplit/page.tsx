'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type Language = 'en' | 'zh';

export default function WaySplitPage() {
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
        title: 'WaySplit',
        subtitle: 'Split Travel Expenses, Effortlessly',
        description: 'Track every expense on the go, auto-split costs among travelers',
        detail1: 'See who owes what at a glance when the trip is over',
        detail2: 'Smart expense splitting designed for group travel',
        detail3: 'Supports OCR receipt scanning, multiple currencies, and custom labels',
        downloadBtn: 'Download Now',
        learnMoreBtn: 'Learn More'
      },
      features: {
        title: 'Core Features',
        subtitle: 'Everything you need for hassle-free trip expense splitting',
        items: [
          {
            icon: '📸',
            title: 'Smart Receipt Scanning',
            subtitle: 'Snap a photo, expenses auto-filled',
            description: 'Just take a photo of your receipt, AI automatically recognizes the amount, items, and details.',
            detail: 'Supports receipts in multiple languages and formats.'
          },
          {
            icon: '💰',
            title: 'Flexible Splitting',
            subtitle: 'Custom groups and labels',
            description: 'Create participant groups with labels. Assign expenses to the right people with one tap.',
            detail: 'Supports per-person, equal split, and custom ratio splitting.'
          },
          {
            icon: '💱',
            title: 'Multi-Currency Support',
            subtitle: 'Real-time exchange rates',
            description: 'Travel across countries? No problem. Add expenses in any currency with automatic conversion.',
            detail: 'Supports all major currencies with live exchange rate updates.'
          }
        ]
      },
      useCases: {
        title: 'Use Cases',
        subtitle: 'WaySplit helps you no matter the trip',
        items: [
          {
            icon: '✈️',
            title: 'Group Travel',
            subtitle: 'Split costs fairly among friends',
            description: 'Track meals, transport, accommodation, and activities. See the final settlement at the end of the trip — no more awkward money conversations.'
          },
          {
            icon: '🏠',
            title: 'Shared Living',
            subtitle: 'Manage household expenses together',
            description: 'Rent, groceries, utilities — keep track of shared costs and settle up easily at the end of each month.'
          }
        ]
      },
      howItWorks: {
        title: 'Quick Start',
        subtitle: 'Three simple steps to start splitting',
        steps: [
          {
            title: 'Create a Trip',
            description: 'Set the trip name, dates, currency, and add participants'
          },
          {
            title: 'Add Expenses',
            description: 'Scan receipts or manually enter expenses, assign who paid and who shares'
          },
          {
            title: 'View Settlement',
            description: 'See exactly who owes whom and how much — settle up with ease'
          }
        ]
      },
      whyChoose: {
        title: 'Why Choose WaySplit?',
        subtitle: 'Making expense splitting smarter and simpler',
        items: [
          {
            icon: '⚡',
            title: 'Fast Entry',
            subtitle: 'OCR scanning saves time',
            description: 'No more typing numbers manually. Just scan the receipt and confirm.',
            highlight: 'From photo to record in seconds!'
          },
          {
            icon: '🎯',
            title: 'Clear Settlement',
            subtitle: 'Know exactly who owes what',
            description: 'Automatic calculation of each person\'s share based on expenses and payments.',
            highlight: 'No more spreadsheets or mental math.'
          },
          {
            icon: '🌍',
            title: 'Travel-Ready',
            subtitle: 'Built for international trips',
            description: 'Multi-currency support with real-time exchange rates.',
            highlight: 'Works seamlessly across borders.'
          },
          {
            icon: '😊',
            title: 'Simple & Clean',
            subtitle: 'Intuitive design, zero learning curve',
            description: 'Clean interface designed for quick use during trips.',
            highlight: 'Focus on the trip, not the app.'
          }
        ]
      },
      faq: {
        title: 'FAQ',
        subtitle: 'Questions you might have',
        items: [
          {
            question: 'Is WaySplit free?',
            answer: 'WaySplit is free to download and use. All core features including receipt scanning, expense splitting, and settlement are available for free.'
          },
          {
            question: 'Do all trip members need the app?',
            answer: 'No! Only the person tracking expenses needs the app. You can add participants by name and share the settlement results with them.'
          },
          {
            question: 'Which currencies are supported?',
            answer: 'WaySplit supports all major world currencies including USD, EUR, GBP, JPY, TWD, KRW, and many more with real-time exchange rate updates.'
          },
          {
            question: 'Can I edit expenses after adding them?',
            answer: 'Yes! You can edit, delete, or re-assign any expense at any time. The settlement will update automatically.'
          }
        ]
      },
      download: {
        title: 'Download WaySplit Now',
        subtitle: 'Start splitting expenses the smart way — focus on the journey, not the math',
        downloadBtn: 'Download on App Store',
        requirements: {
          title: 'System Requirements',
          items: [
            'iOS 17 or above',
            'Camera permission (for receipt scanning)',
            'Internet connection required'
          ]
        }
      },
      footer: {
        copyright: '© 2026 WaySplit. All rights reserved.',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        support: 'Support',
        language: 'Language'
      }
    },
    zh: {
      hero: {
        title: 'WaySplit',
        subtitle: '旅行分帳，輕鬆搞定',
        description: '隨手記錄每筆花費，自動分攤旅伴費用',
        detail1: '旅途結束後一目了然誰該付多少錢',
        detail2: '專為團體旅行設計的智慧分帳工具',
        detail3: '支援 OCR 掃描發票、多幣種、自訂標籤',
        downloadBtn: '立即下載',
        learnMoreBtn: '了解更多'
      },
      features: {
        title: '核心功能',
        subtitle: '旅行分帳所需的一切功能',
        items: [
          {
            icon: '📸',
            title: '智慧掃描發票',
            subtitle: '拍照即記錄，省去手動輸入',
            description: '只需拍攝發票或收據照片，AI 自動識別金額、品項和明細。',
            detail: '支援多種語言和格式的發票。'
          },
          {
            icon: '💰',
            title: '靈活分帳',
            subtitle: '自訂群組與標籤',
            description: '建立參與者群組並加上標籤，一鍵將費用分配給對的人。',
            detail: '支援均分、自訂比例等多種分帳方式。'
          },
          {
            icon: '💱',
            title: '多幣種支援',
            subtitle: '即時匯率換算',
            description: '跨國旅行？沒問題。以任何幣種記錄費用，自動換算匯率。',
            detail: '支援全球主要貨幣，即時更新匯率。'
          }
        ]
      },
      useCases: {
        title: '使用場景',
        subtitle: '無論什麼旅行，WaySplit 都能幫到你',
        items: [
          {
            icon: '✈️',
            title: '團體旅行',
            subtitle: '公平分攤旅伴費用',
            description: '記錄餐飲、交通、住宿和活動費用。旅途結束後直接看結算結果，不再有尷尬的金錢對話。'
          },
          {
            icon: '🏠',
            title: '合租生活',
            subtitle: '一起管理共同開銷',
            description: '房租、日用品、水電費 — 追蹤共同開支，每月底輕鬆結算。'
          }
        ]
      },
      howItWorks: {
        title: '快速入門',
        subtitle: '簡單三步驟，開始分帳',
        steps: [
          {
            title: '建立旅程',
            description: '設定旅程名稱、日期、幣種，新增參與者'
          },
          {
            title: '記錄花費',
            description: '掃描發票或手動輸入費用，指定誰付錢、誰分攤'
          },
          {
            title: '查看結算',
            description: '清楚看到誰欠誰多少錢，輕鬆結清'
          }
        ]
      },
      whyChoose: {
        title: '為什麼選擇 WaySplit？',
        subtitle: '讓分帳變得更聰明、更簡單',
        items: [
          {
            icon: '⚡',
            title: '快速記帳',
            subtitle: 'OCR 掃描省時省力',
            description: '不用再手動輸入數字，掃描發票後確認即可。',
            highlight: '從拍照到記錄只要幾秒鐘！'
          },
          {
            icon: '🎯',
            title: '清楚結算',
            subtitle: '精確知道誰欠多少',
            description: '根據花費和付款紀錄，自動計算每個人的分攤金額。',
            highlight: '不再需要 Excel 或心算。'
          },
          {
            icon: '🌍',
            title: '旅行就緒',
            subtitle: '專為跨國旅行打造',
            description: '多幣種支援搭配即時匯率。',
            highlight: '跨國旅行無縫銜接。'
          },
          {
            icon: '😊',
            title: '簡潔好用',
            subtitle: '直覺設計，零學習成本',
            description: '乾淨的介面，專為旅途中快速使用而設計。',
            highlight: '專注旅程，而非 app 操作。'
          }
        ]
      },
      faq: {
        title: '常見問題',
        subtitle: '您可能想知道的問題',
        items: [
          {
            question: 'WaySplit 免費嗎？',
            answer: 'WaySplit 免費下載和使用。所有核心功能包括發票掃描、分帳和結算都是免費的。'
          },
          {
            question: '旅伴都需要安裝 app 嗎？',
            answer: '不需要！只有記帳的人需要安裝 app。你可以用名字新增參與者，再分享結算結果給他們。'
          },
          {
            question: '支援哪些幣種？',
            answer: 'WaySplit 支援全球主要貨幣，包括美元、歐元、英鎊、日幣、台幣、韓元等，並提供即時匯率更新。'
          },
          {
            question: '新增後可以修改費用嗎？',
            answer: '當然！你可以隨時編輯、刪除或重新分配任何費用，結算會自動更新。'
          }
        ]
      },
      download: {
        title: '立即下載 WaySplit',
        subtitle: '用更聰明的方式分帳 — 專注旅程，不用算數學',
        downloadBtn: 'App Store 下載',
        requirements: {
          title: '系統需求',
          items: [
            'iOS 17 或以上版本',
            '需要相機權限（用於掃描發票）',
            '需要網路連線'
          ]
        }
      },
      footer: {
        copyright: '© 2026 WaySplit. All rights reserved.',
        privacyPolicy: '隱私權政策',
        termsOfService: '服務條款',
        support: '支援',
        language: '語言'
      }
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white">
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
                className="inline-block px-8 py-4 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-colors shadow-lg"
              >
                {t.hero.downloadBtn}
              </Link>
              <Link
                href="#features"
                className="inline-block px-8 py-4 bg-white text-blue-500 font-semibold rounded-full border-2 border-blue-500 hover:bg-blue-50 transition-colors"
              >
                {t.hero.learnMoreBtn}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-10 right-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-300 rounded-full opacity-20 animate-pulse delay-300"></div>
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
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-blue-600 font-medium mb-2">
                  {feature.subtitle}
                </p>
                <p className="text-gray-600 mb-2">{feature.description}</p>
                {activeFeature === index && (
                  <p className="text-sm text-blue-700 mt-4 font-medium">
                    {feature.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-linear-to-b from-gray-50 to-white">
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
                className="p-8 rounded-2xl bg-linear-to-br from-blue-50 to-white border-2 border-blue-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{useCase.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-blue-600 font-medium mb-3">
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
      <section className="py-20 bg-white">
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
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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

      {/* Why Choose WaySplit */}
      <section className="py-20 bg-gray-50">
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
                className="p-8 rounded-2xl bg-linear-to-br from-white to-blue-50 border-2 border-blue-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-blue-600 font-medium mb-3">
                      {item.subtitle}
                    </p>
                    <p className="text-gray-700 mb-2">
                      {item.description}
                    </p>
                    <p className="text-blue-700 font-medium">
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
      <section id="faq" className="py-20 bg-white">
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
                className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all"
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <span className="text-2xl text-blue-500 shrink-0">
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
      <section id="download" className="py-20 bg-linear-to-r from-blue-500 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t.download.title}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t.download.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="#"
              className="inline-block px-8 py-4 bg-white text-blue-500 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t.download.downloadBtn}
            </Link>
          </div>

          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-left">
            <h3 className="text-2xl font-semibold text-white mb-4">{t.download.requirements.title}</h3>
            <ul className="space-y-2 text-blue-100">
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
            <Link href="/waysplit/privacy-policy" className="hover:text-white transition-colors">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="/waysplit/privacy-policy" className="hover:text-white transition-colors">
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
