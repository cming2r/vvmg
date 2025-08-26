export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">隱私權政策</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed">
              非常歡迎您使用「Kola 寶寶日記」（以下簡稱本 App），為了讓您能夠安心地使用本 App 的各項服務與功能，特此向您說明本 App 的隱私權保護政策，以保障您的權益，請您詳閱下列內容：
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">一、隱私權保護政策的適用範圍</h2>
            <p className="text-gray-700 leading-relaxed">
              本隱私權保護政策內容，包括本 App 如何處理在您使用服務時收集到的個人識別資料。本政策不適用於本 App 以外的相關連結應用程式或網站，也不適用於非本 App 所委託或參與管理的人員。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">二、個人資料的蒐集、處理及利用方式</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>當您註冊使用本 App 時，我們會請您提供電子郵件作為帳戶識別。</li>
              <li>當您使用本 App 的寶寶記錄功能時，我們會請您提供寶寶的基本資訊，包括姓名、出生日期、性別等。</li>
              <li>本 App 會儲存您記錄的育兒資訊，包括但不限於餵食、睡眠、成長數據等。</li>
              <li>我們使用 Supabase 服務進行資料備份和同步，您的育兒記錄將安全地儲存在 Supabase 雲端服務中。</li>
              <li>若您選擇使用照片功能，我們會請您提供相機或相簿存取權限，以便儲存寶寶的成長照片。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">三、資料之保護</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>本 App 採用 Supabase 提供的安全機制，確保您的資料受到完善的保護。</li>
              <li>所有育兒記錄資料均經過加密處理後才會傳輸及儲存。</li>
              <li>只有經過您授權的照護者與觀察者才能存取您的寶寶資料。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">四、第三方服務</h2>
            <p className="text-gray-700 leading-relaxed">
              本 App 使用 Supabase 服務進行資料儲存與分析。這些服務的使用均受到各自的隱私權政策約束，建議您同時參考這些服務的隱私權政策。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">五、與第三人共用個人資料之政策</h2>
            <p className="text-gray-700 mb-3">
              本 App 絕不會提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有下列情形者除外：
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>經過您授權的照護者或觀察者可以存取您的寶寶資料。</li>
              <li>經由您書面同意。</li>
              <li>法律明文規定。</li>
              <li>為免除您生命、身體、自由或財產上之危險。</li>
              <li>當您的使用行為違反服務條款時。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">六、資料存取與控制</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>您可以隨時在 App 中檢視、修改或刪除您儲存的寶寶記錄資料。</li>
              <li>您可以要求我們刪除您的帳號及所有相關資料。</li>
              <li>您可以取得寶寶記錄資料，以便備份或轉移到其他服務。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">七、隱私權保護政策之修正</h2>
            <p className="text-gray-700 leading-relaxed">
              本 App 隱私權保護政策將因應需求隨時進行修正，若您繼續使用本 App，即表示您同意修改後的隱私權保護政策。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}