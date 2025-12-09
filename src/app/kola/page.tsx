'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

type Language = 'en' | 'zh';

export default function KolaPage() {
  const [activeFeature, setActiveFeature] = useState(0);
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
        title: 'Kola Baby Diary',
        subtitle: 'Your Best Partner for Baby Growth Records',
        description: 'Simple and intuitive interface, easy for new parents to get started. From feeding to sleep, from diaper changes to growth tracking, Kola Baby Diary accompanies you to record every important moment of your baby\'s growth.',
        downloadBtn: 'Download Now',
        learnMoreBtn: 'Learn More'
      },
      features: {
        title: 'Powerful Features, Simple to Use',
        subtitle: 'Parenting assistant designed for busy parents',
        items: [
          {
            icon: '🍼',
            title: 'Feeding Records',
            description: 'Easily record breastfeeding, formula, solid foods and more',
            detail: 'Track time, amount and type of each feeding to help you understand your baby\'s eating habits'
          },
          {
            icon: '😴',
            title: 'Sleep Tracking',
            description: 'Record your baby\'s sleep time and quality',
            detail: 'Monitor sleep patterns and establish healthy routines'
          },
          {
            icon: '👶',
            title: 'Diaper Change Records',
            description: 'Track diaper change frequency and status',
            detail: 'Record diaper conditions to detect health issues early'
          },
          {
            icon: '📊',
            title: 'Growth Charts',
            description: 'Visual presentation of baby\'s growth trends',
            detail: 'Track important growth indicators like height, weight, and head circumference'
          },
          {
            icon: '👥',
            title: 'Multi-User Collaboration',
            description: 'Invite family members to care and record together',
            detail: 'Support multiple caregivers to sync, ensuring seamless care'
          },
          {
            icon: '🎤',
            title: 'Siri Voice Input',
            description: 'Use voice for quick recording, hands-free',
            detail: 'Quickly add records through Siri shortcuts, easy to record even when busy'
          }
        ]
      },
      howItWorks: {
        title: 'Three Simple Steps',
        subtitle: 'Start recording your baby\'s growth journey',
        steps: [
          {
            title: 'Download the App',
            description: 'Download Kola app from App Store'
          },
          {
            title: 'Set Up Baby Profile',
            description: 'Enter baby\'s basic information to start personalized records'
          },
          {
            title: 'Start Recording',
            description: 'Easily record every important moment and track baby\'s growth'
          }
        ]
      },
      cta: {
        title: 'Start Recording Your Baby\'s Growth Story',
        subtitle: 'Use Kola Baby Diary to easily manage your baby\'s daily care',
        downloadBtn: 'Free Download',
        contactBtn: 'Contact Us'
      },
      footer: {
        copyright: '© 2025 Kola Baby Diary. All rights reserved.',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        support: 'Support'
      }
    },
    zh: {
      hero: {
        title: 'Kola 寶寶日記',
        subtitle: '寶寶成長記錄的最佳夥伴',
        description: '簡單直觀的介面，讓新手父母也能輕鬆上手。從餵食到睡眠，從換尿布到成長追蹤，Kola 寶寶日記陪伴您記錄寶寶成長的每個重要時刻。',
        downloadBtn: '立即下載',
        learnMoreBtn: '了解更多'
      },
      features: {
        title: '強大功能，簡單使用',
        subtitle: '專為忙碌的父母設計育兒助手',
        items: [
          {
            icon: '🍼',
            title: '餵食記錄',
            description: '輕鬆記錄母乳、配方奶、副食品等餵食資訊',
            detail: '追蹤每次餵食的時間、份量和類型，幫助您了解寶寶的飲食習慣'
          },
          {
            icon: '😴',
            title: '睡眠追蹤',
            description: '記錄寶寶的睡眠時間與品質',
            detail: '監控睡眠模式，建立健康的作息規律'
          },
          {
            icon: '👶',
            title: '換尿布記錄',
            description: '追蹤尿布更換頻率與狀態',
            detail: '記錄尿布狀態，及時發現健康問題'
          },
          {
            icon: '📊',
            title: '成長圖表',
            description: '視覺化呈現寶寶的成長趨勢',
            detail: '追蹤身高、體重、頭圍等重要成長指標'
          },
          {
            icon: '👥',
            title: '多人協作',
            description: '邀請家人共同照顧與記錄',
            detail: '支援多位照護者同步使用，確保照護無縫接軌'
          },
          {
            icon: '🎤',
            title: 'Siri 語音輸入',
            description: '使用語音快速記錄，解放雙手',
            detail: '透過 Siri 捷徑快速新增記錄，即使手忙也能輕鬆記錄'
          }
        ]
      },
      howItWorks: {
        title: '簡單三步驟',
        subtitle: '開始記錄寶寶的成長歷程',
        steps: [
          {
            title: '下載應用程式',
            description: '從 App Store 下載 Kola 應用程式'
          },
          {
            title: '設定寶寶資料',
            description: '輸入寶寶的基本資訊，開始個人化記錄'
          },
          {
            title: '開始記錄',
            description: '輕鬆記錄每個重要時刻，追蹤寶寶成長'
          }
        ]
      },
      cta: {
        title: '開始記錄寶寶的成長故事',
        subtitle: '使用 Kola 寶寶日記輕鬆管理寶寶的日常照護',
        downloadBtn: '免費下載',
        contactBtn: '聯絡我們'
      },
      footer: {
        copyright: '© 2025 Kola 寶寶日記. All rights reserved.',
        privacyPolicy: '隱私權政策',
        termsOfService: '服務條款',
        support: '支援'
      }
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-linear-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 inline-block">
              <Image
                src="/kola-app-icon.png"
                alt="Kola App Icon"
                width={96}
                height={96}
                className="rounded-3xl shadow-lg"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              {t.hero.subtitle}
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              {t.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#"
                className="inline-block px-8 py-4 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-lg"
              >
                {t.hero.downloadBtn}
              </Link>
              <Link
                href="#features"
                className="inline-block px-8 py-4 bg-white text-orange-500 font-semibold rounded-full border-2 border-orange-500 hover:bg-orange-50 transition-colors"
              >
                {t.hero.learnMoreBtn}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-10 right-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-orange-300 rounded-full opacity-20 animate-pulse delay-300"></div>
      </section>

      {/* Features Section */}
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
                    ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-2">{feature.description}</p>
                {activeFeature === index && (
                  <p className="text-sm text-orange-600 mt-4">
                    {feature.detail}
                  </p>
                )}
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
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t.cta.title}
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#"
              className="inline-block px-8 py-4 bg-white text-orange-500 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t.cta.downloadBtn}
            </Link>
            <Link
              href="#"
              className="inline-block px-8 py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white hover:bg-white hover:text-orange-500 transition-colors"
            >
              {t.cta.contactBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center">
          <p>{t.footer.copyright}</p>
          <div className="mt-4 flex justify-center gap-6 flex-wrap items-center">
            <Link href="/kola/privacy-policy" className="hover:text-white transition-colors">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              {t.footer.termsOfService}
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
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
