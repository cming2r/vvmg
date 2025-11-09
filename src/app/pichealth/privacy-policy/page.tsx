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
          content: 'Welcome to "PicHealth" (hereinafter referred to as "the App"). To ensure you can use the App\'s services and features with peace of mind, we hereby explain the App\'s privacy protection policy to safeguard your rights. Please read the following content carefully:'
        },
        {
          title: '1. Scope of Privacy Protection Policy',
          content: 'This privacy protection policy covers how the App handles personally identifiable information collected when you use the service. This policy does not apply to linked applications or websites outside of the App, nor does it apply to personnel not commissioned or managed by the App.'
        },
        {
          title: '2. Collection, Processing, and Use of Personal Data',
          items: [
            'When you use the App, we will request camera permission to photograph health device screens for data recognition.',
            'When you use the App\'s health data sync function, we will request Apple Health permission to sync recognized data to the Apple Health App.',
            'We use Supabase service for image recognition, data backup and synchronization, and store your usage information, including but not limited to photos and data.'
          ]
        },
        {
          title: '3. Data Protection',
          items: [
            'The App uses security mechanisms provided by Supabase to ensure your data is fully protected.',
            'All health data is managed by Apple Health App and protected by iOS system-level security.'
          ]
        },
        {
          title: '4. Third-Party Services',
          content: 'The App uses Supabase service for data storage and analysis. The use of these services is governed by their respective privacy policies. We recommend you also refer to these services\' privacy policies.'
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
            'You can view, modify, or delete your health record data anytime in the Apple Health App.',
            'You can revoke the App\'s camera permission and Apple Health permission at any time.',
            'You can delete the App at any time. All local data will be removed, but data in Apple Health will remain for you to manage.'
          ]
        },
        {
          title: '7. Use of Apple Health Data',
          items: [
            'The App will only write OCR-recognized health data to the Apple Health App.',
            'The App will not read or access other data in Apple Health.',
            'The App complies with Apple\'s health data usage regulations and will not use health data for advertising or data mining purposes.',
            'Your health data is completely managed by the Apple Health App. The App serves only as a data input tool.'
          ]
        },
        {
          title: '8. Amendments to Privacy Protection Policy',
          content: 'The App\'s privacy protection policy may be revised as needed. The revised policy will be updated on this page. If you continue to use the App, it means you agree to the revised privacy protection policy.'
        }
      ],
      backToHome: 'Back to PicHealth'
    },
    zh: {
      title: '隱私權政策',
      sections: [
        {
          title: '',
          content: '非常歡迎您使用「PicHealth」（以下簡稱本 App），為了讓您能夠安心地使用本 App 的各項服務與功能，特此向您說明本 App 的隱私權保護政策，以保障您的權益，請您詳閱下列內容：'
        },
        {
          title: '一、隱私權保護政策的適用範圍',
          content: '本隱私權保護政策內容，包括本 App 如何處理在您使用服務時收集到的個人識別資料。本政策不適用於本 App 以外的相關連結應用程式或網站，也不適用於非本 App 所委託或參與管理的人員。'
        },
        {
          title: '二、個人資料的蒐集、處理及利用方式',
          items: [
            '當您使用本 App 時，我們會請您提供相機權限，以便拍攝健康設備螢幕進行資料識別。',
            '當您使用本 App 的健康數據同步功能時，我們會請您提供 Apple 健康權限，以便將識別後的數據同步到 Apple 健康 App。',
            '我們使用 Supabase 服務進行圖片識別、資料備份和同步，並儲存您記錄的使用資訊，包括但不限於照片、數據等。'
          ]
        },
        {
          title: '三、資料之保護',
          items: [
            '本 App 採用 Supabase 提供的安全機制，確保您的資料受到完善的保護。',
            '所有健康數據由 Apple 健康 App 管理，受到 iOS 系統級的安全保護。'
          ]
        },
        {
          title: '四、第三方服務',
          content: '本 App 使用 Supabase 服務進行資料儲存與分析。這些服務的使用均受到各自的隱私權政策約束，建議您同時參考這些服務的隱私權政策。'
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
            '您可以隨時在 Apple 健康 App 中檢視、修改或刪除您的健康數據。',
            '您可以隨時撤銷本 App 的相機權限和 Apple 健康權限。',
            '您可以隨時刪除本 App，所有本地資料將被移除，但 Apple 健康中的數據將保留，由您自行管理。'
          ]
        },
        {
          title: '七、Apple 健康數據的使用',
          items: [
            '本 App 僅會將 OCR 識別後的健康數據寫入 Apple 健康 App。',
            '本 App 不會讀取或存取 Apple 健康中的其他數據。',
            '本 App 遵循 Apple 的健康數據使用規範，不會將健康數據用於廣告或數據挖掘目的。',
            '您的健康數據完全由 Apple 健康 App 管理，本 App 只是作為數據輸入的工具。'
          ]
        },
        {
          title: '八、隱私權保護政策之修正',
          content: '本 App 隱私權保護政策將因應需求隨時進行修正，修正後的政策將會在本頁面更新。若您繼續使用本 App，即表示您同意修改後的隱私權保護政策。'
        }
      ],
      backToHome: '返回 PicHealth'
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/pichealth"
            className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
          >
            <span className="mr-2">←</span>
            {t.backToHome}
          </Link>

          <button
            onClick={() => handleLanguageChange(language === 'en' ? 'zh' : 'en')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
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
