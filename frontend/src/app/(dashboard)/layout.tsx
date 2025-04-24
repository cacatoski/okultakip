'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  Bell, 
  MessageSquare, 
  School, 
  Clock, 
  BookMarked, 
  PenTool,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <Calendar className="mr-3 h-5 w-5" /> },
    { name: 'Öğrenciler', href: '/dashboard/ogrenciler', icon: <Users className="mr-3 h-5 w-5" /> },
    { name: 'Sınıflar', href: '/dashboard/siniflar', icon: <School className="mr-3 h-5 w-5" /> },
    { name: 'Dersler', href: '/dashboard/dersler', icon: <BookOpen className="mr-3 h-5 w-5" /> },
    { name: 'Notlar', href: '/dashboard/notlar', icon: <FileText className="mr-3 h-5 w-5" /> },
    { name: 'Duyurular', href: '/dashboard/duyurular', icon: <Bell className="mr-3 h-5 w-5" /> },
    { name: 'Mesajlar', href: '/dashboard/mesajlar', icon: <MessageSquare className="mr-3 h-5 w-5" /> },
    { name: 'Okullar', href: '/dashboard/okullar', icon: <School className="mr-3 h-5 w-5" /> },
    { name: 'Devamsızlık', href: '/dashboard/devamsizlik', icon: <Clock className="mr-3 h-5 w-5" /> },
    { name: 'Ödevler', href: '/dashboard/odevler', icon: <BookMarked className="mr-3 h-5 w-5" /> },
    { name: 'Sınavlar', href: '/dashboard/sinavlar', icon: <PenTool className="mr-3 h-5 w-5" /> },
  ];

  // Kullanıcı rolüne göre menü öğelerini filtrele
  const filteredNavigation = navigation.filter(item => {
    if (!user) return false;
    
    // Admin tüm sayfalara erişebilir
    if (user.role === 'admin') return true;
    
    // Öğretmenler için filtreleme
    if (user.role === 'teacher') {
      return !['okullar'].includes(item.href.split('/').pop() || '');
    }
    
    // Öğrenciler için filtreleme
    if (user.role === 'student') {
      return ['dashboard', 'dersler', 'notlar', 'duyurular', 'mesajlar', 'devamsizlik', 'odevler', 'sinavlar']
        .includes(item.href.split('/').pop() || '');
    }
    
    // Veliler için filtreleme
    if (user.role === 'parent') {
      return ['dashboard', 'notlar', 'duyurular', 'mesajlar', 'devamsizlik', 'odevler', 'sinavlar']
        .includes(item.href.split('/').pop() || '');
    }
    
    return false;
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobil kenar çubuğu */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Menüyü kapat</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-indigo-600">Okul Takip</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Link href="/dashboard/profil" className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div>
                    <div className="inline-block h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.displayName}
                    </p>
                    <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                      {user?.role === 'admin' ? 'Yönetici' : 
                       user?.role === 'teacher' ? 'Öğretmen' : 
                       user?.role === 'student' ? 'Öğrenci' : 'Veli'}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-14"></div>
        </div>
      </div>

      {/* Statik kenar çubuğu (masaüstü) */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-indigo-600">Okul Takip</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <Link href="/dashboard/profil" className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <div className="inline-block h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.displayName}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user?.role === 'admin' ? 'Yönetici' : 
                   user?.role === 'teacher' ? 'Öğretmen' : 
                   user?.role === 'student' ? 'Öğrenci' : 'Veli'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Ana içerik */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Menüyü aç</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1 pb-10">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
