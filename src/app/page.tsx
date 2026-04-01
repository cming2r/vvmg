import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">VVMG</h1>
          <p className="text-gray-500 mb-8">Welcome</p>
          <Link href="/admin">
            <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
              Go to Admin
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
