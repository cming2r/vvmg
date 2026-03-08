'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type Language = 'en' | 'zh';

export default function PrivacyPolicyPage() {
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
      title: 'Privacy Policy',
      sections: [
        {
          title: '',
          content: 'Welcome to "WaySplit" (hereinafter referred to as "the App"). To ensure you can use the App\'s services and features with peace of mind, we hereby explain the App\'s privacy protection policy to safeguard your rights. Please read the following content carefully:'
        },
        {
          title: '1. Scope of Privacy Protection Policy',
          content: 'This privacy protection policy covers how the App handles personally identifiable information collected when you use the service. This policy does not apply to linked applications or websites outside of the App, nor does it apply to personnel not commissioned or managed by the App.'
        },
        {
          title: '2. Collection, Processing, and Use of Personal Data',
          items: [
            'When you use the App, we collect a device identifier to associate your trip and expense data.',
            'When you sign in with Apple or Google, we collect your email address and authentication token to create your account.',
            'We use camera permission to scan receipts for automatic expense entry via OCR.',
            'We use third-party services for data storage, backup, and synchronization, including trip details, expenses, and receipt images.'
          ]
        },
        {
          title: '3. Data Protection',
          items: [
            'The App uses industry-standard security mechanisms to ensure your data is fully protected.',
            'Authentication is handled through industry-standard protocols (Apple Sign In, Google Sign In).',
            'Your data is transmitted over encrypted connections (HTTPS).'
          ]
        },
        {
          title: '4. Third-Party Services',
          content: 'The App uses third-party services provided by Supabase, Google, and Cloudflare for data storage, authentication, image recognition, and content delivery. The use of these services is governed by their respective privacy policies. We recommend you refer to their policies for more details.'
        },
        {
          title: '5. Policy on Sharing Personal Data with Third Parties',
          content: 'The App will never provide, exchange, rent, or sell any of your personal data to other individuals, groups, private enterprises, or public agencies, except in the following circumstances:',
          items: [
            'With your written consent.',
            'As explicitly required by law.',
            'To prevent danger to your life, body, freedom, or property.',
            'When your usage behavior violates the terms of service.'
          ]
        },
        {
          title: '6. Data Access and Control',
          items: [
            'You can view, edit, or delete your trips and expenses at any time within the App.',
            'You can sign out at any time to disconnect your account.',
            'You can delete the App at any time. Locally cached data will be removed.',
            'To request complete deletion of your account data, please contact us through the in-app feedback feature.'
          ]
        },
        {
          title: '7. Account and Data Claiming',
          items: [
            'You can use the App without an account. Data is associated with your device identifier.',
            'When you sign in, existing device data is automatically claimed by your account.',
            'When you sign out, you will only see unclaimed data created on this device.',
            'Your account data remains accessible when you sign in again on any device.'
          ]
        },
        {
          title: '8. Amendments to Privacy Protection Policy',
          content: 'The App\'s privacy protection policy may be revised as needed. The revised policy will be updated on this page. If you continue to use the App, it means you agree to the revised privacy protection policy.'
        }
      ],
      backToHome: 'Back to WaySplit'
    },
    zh: {
      title: '隱私權政策',
      sections: [
        {
          title: '',
          content: '非常歡迎您使用「WaySplit」（以下簡稱本 App），為了讓您能夠安心地使用本 App 的各項服務與功能，特此向您說明本 App 的隱私權保護政策，以保障您的權益，請您詳閱下列內容：'
        },
        {
          title: '一、隱私權保護政策的適用範圍',
          content: '本隱私權保護政策內容，包括本 App 如何處理在您使用服務時收集到的個人識別資料。本政策不適用於本 App 以外的相關連結應用程式或網站，也不適用於非本 App 所委託或參與管理的人員。'
        },
        {
          title: '二、個人資料的蒐集、處理及利用方式',
          items: [
            '當您使用本 App 時，我們會收集裝置識別碼以關聯您的旅程和費用資料。',
            '當您透過 Apple 或 Google 登入時，我們會收集您的電子郵件地址和驗證令牌以建立帳號。',
            '我們使用相機權限掃描發票，透過 OCR 自動輸入費用。',
            '我們使用第三方服務進行資料儲存、備份和同步，包括旅程詳情、費用和發票圖片。'
          ]
        },
        {
          title: '三、資料之保護',
          items: [
            '本 App 採用業界標準的安全機制，確保您的資料受到完善的保護。',
            '身份驗證透過業界標準協議處理（Apple 登入、Google 登入）。',
            '您的資料透過加密連線（HTTPS）傳輸。'
          ]
        },
        {
          title: '四、第三方服務',
          content: '本 App 使用 Supabase、Google 及 Cloudflare 提供的第三方服務，用於資料儲存、身份驗證、圖片識別及內容傳遞。這些服務的使用均受到各自的隱私權政策約束，建議您同時參考其相關政策。'
        },
        {
          title: '五、與第三人共用個人資料之政策',
          content: '本 App 絕不會提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有下列情形者除外：',
          items: [
            '經由您書面同意。',
            '法律明文規定。',
            '為免除您生命、身體、自由或財產上之危險。',
            '當您的使用行為違反服務條款時。'
          ]
        },
        {
          title: '六、資料存取與控制',
          items: [
            '您可以隨時在 App 中查看、編輯或刪除您的旅程和費用。',
            '您可以隨時登出以斷開帳號連結。',
            '您可以隨時刪除本 App，本機快取資料將被移除。',
            '如需完整刪除帳號資料，請透過 App 內的意見回饋功能聯繫我們。'
          ]
        },
        {
          title: '七、帳號與資料認領',
          items: [
            '您可以不用帳號使用本 App，資料會透過裝置識別碼關聯。',
            '登入後，現有的裝置資料會自動認領到您的帳號。',
            '登出後，您只會看到此裝置上建立的未認領資料。',
            '重新登入後，您的帳號資料可在任何裝置上存取。'
          ]
        },
        {
          title: '八、隱私權保護政策之修正',
          content: '本 App 隱私權保護政策將因應需求隨時進行修正，修正後的政策將會在本頁面更新。若您繼續使用本 App，即表示您同意修改後的隱私權保護政策。'
        }
      ],
      backToHome: '返回 WaySplit'
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/waysplit"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span className="mr-2">←</span>
            {t.backToHome}
          </Link>

          <button
            onClick={() => handleLanguageChange(language === 'en' ? 'zh' : 'en')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-colors"
          >
            <span>🌐</span>
            <span>{language === 'en' ? 'English' : '中文'}</span>
          </button>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">{t.title}</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {t.sections.map((section, index) => (
            <section key={index}>
              {section.title && (
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
              )}
              {section.content && (
                <p className="text-gray-700 leading-relaxed mb-3">{section.content}</p>
              )}
              {section.items && (
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
