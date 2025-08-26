'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function KolaPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
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
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
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
              Kola 寶寶日記
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              寶寶成長記錄的最佳夥伴
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              簡單直觀的介面，讓新手父母也能輕鬆上手。從餵食到睡眠，從換尿布到成長追蹤，Kola 寶寶日記陪伴您記錄寶寶成長的每個重要時刻。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#"
                className="inline-block px-8 py-4 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-lg"
              >
                立即下載
              </Link>
              <Link
                href="#features"
                className="inline-block px-8 py-4 bg-white text-orange-500 font-semibold rounded-full border-2 border-orange-500 hover:bg-orange-50 transition-colors"
              >
                了解更多
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
              強大功能，簡單使用
            </h2>
            <p className="text-xl text-gray-600">
              專為忙碌的父母設計育兒助手
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
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
              簡單三步驟
            </h2>
            <p className="text-xl text-gray-600">
              開始記錄寶寶的成長歷程
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">下載應用程式</h3>
              <p className="text-gray-700">
                從 App Store 下載 Kola 應用程式
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">設定寶寶資料</h3>
              <p className="text-gray-700">
                輸入寶寶的基本資訊，開始個人化記錄
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">開始記錄</h3>
              <p className="text-gray-700">
                輕鬆記錄每個重要時刻，追蹤寶寶成長
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            開始記錄寶寶的成長故事
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            使用 Kola 寶寶日記輕鬆管理寶寶的日常照護
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#"
              className="inline-block px-8 py-4 bg-white text-orange-500 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              免費下載
            </Link>
            <Link
              href="#"
              className="inline-block px-8 py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white hover:bg-white hover:text-orange-500 transition-colors"
            >
              聯絡我們
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Kola 寶寶日記. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/kola/privacy-policy" className="hover:text-white transition-colors">
              隱私權政策
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              服務條款
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              支援
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}