'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div>
          <h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">Okul Takip</h1>
          <p className="text-center text-gray-500 mb-8">K12NET benzeri kapsamlı bir okul yönetim sistemi</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link 
            href="/giris" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Giriş Yap
          </Link>
          
          <Link 
            href="/kayit" 
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Kayıt Ol
          </Link>
        </div>
        
        <div className="mt-6">
          <p className="text-center text-sm text-gray-500">
            Öğrenciler, öğretmenler, veliler ve yöneticiler için
            <br />
            tek bir platformda tüm okul yönetimi
          </p>
        </div>
      </div>
    </div>
  );
}
