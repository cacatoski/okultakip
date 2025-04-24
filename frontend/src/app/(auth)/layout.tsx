'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <header className="bg-white shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-indigo-600">Okul Takip</h1>
          </div>
        </header>
        <main className="flex-grow">{children}</main>
        <footer className="bg-white py-4 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Okul Takip. Tüm hakları saklıdır.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
