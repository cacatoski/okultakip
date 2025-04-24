'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter, usePathname } from 'next/navigation';

// Kimlik doğrulama gerektirmeyen sayfalar
const publicRoutes = ['/giris', '/kayit', '/sifremi-unuttum'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, loadUserData, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Firebase Authentication durumunu dinle
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Kullanıcı oturum açmışsa, kullanıcı verilerini yükle
        await loadUserData();
      }
    });

    // Temizleme işlevi
    return () => unsubscribe();
  }, [setFirebaseUser, loadUserData]);

  useEffect(() => {
    // Yönlendirme mantığı
    if (!isLoading) {
      const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
      
      if (!isAuthenticated && !isPublicRoute) {
        // Kullanıcı oturum açmamışsa ve korumalı bir sayfaya erişmeye çalışıyorsa, giriş sayfasına yönlendir
        router.push('/giris');
      } else if (isAuthenticated && isPublicRoute) {
        // Kullanıcı oturum açmışsa ve giriş/kayıt gibi sayfalara erişmeye çalışıyorsa, dashboard'a yönlendir
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Yükleme durumunda basit bir yükleme göstergesi göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
