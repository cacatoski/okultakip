'use client';

import { useEffect, useState } from 'react';
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
  PenTool 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    subjects: 0,
    announcements: 0,
    messages: 0,
    attendance: 0,
    homework: 0,
    exams: 0
  });

  useEffect(() => {
    // Gerçek uygulamada burada API'den istatistikleri çekebilirsiniz
    // Şimdilik örnek veriler kullanıyoruz
    setStats({
      students: 250,
      classes: 12,
      subjects: 24,
      announcements: 15,
      messages: 8,
      attendance: 95, // yüzde
      homework: 18,
      exams: 6
    });
  }, []);

  // Kullanıcı rolüne göre gösterilecek kartları belirle
  const getCards = () => {
    if (!user) return [];

    // Tüm kartlar
    const allCards = [
      {
        title: 'Öğrenciler',
        value: stats.students,
        icon: <Users className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/ogrenciler',
        roles: ['admin', 'teacher']
      },
      {
        title: 'Sınıflar',
        value: stats.classes,
        icon: <School className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/siniflar',
        roles: ['admin', 'teacher']
      },
      {
        title: 'Dersler',
        value: stats.subjects,
        icon: <BookOpen className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/dersler',
        roles: ['admin', 'teacher', 'student', 'parent']
      },
      {
        title: 'Duyurular',
        value: stats.announcements,
        icon: <Bell className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/duyurular',
        roles: ['admin', 'teacher', 'student', 'parent']
      },
      {
        title: 'Mesajlar',
        value: stats.messages,
        icon: <MessageSquare className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/mesajlar',
        roles: ['admin', 'teacher', 'student', 'parent']
      },
      {
        title: 'Devamsızlık',
        value: `%${stats.attendance}`,
        icon: <Clock className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/devamsizlik',
        roles: ['admin', 'teacher', 'student', 'parent']
      },
      {
        title: 'Ödevler',
        value: stats.homework,
        icon: <BookMarked className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/odevler',
        roles: ['admin', 'teacher', 'student', 'parent']
      },
      {
        title: 'Sınavlar',
        value: stats.exams,
        icon: <PenTool className="h-8 w-8 text-indigo-600" />,
        link: '/dashboard/sinavlar',
        roles: ['admin', 'teacher', 'student', 'parent']
      }
    ];

    // Kullanıcı rolüne göre filtrele
    return allCards.filter(card => card.roles.includes(user.role));
  };

  const cards = getCards();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Hoş geldiniz, {user?.displayName}! İşte okul takip sisteminizin genel durumu.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Link 
            key={card.title} 
            href={card.link}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {card.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{card.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Son Aktiviteler */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Son Aktiviteler</h2>
      <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((item) => (
            <li key={item}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    Örnek Aktivite {item}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Yeni
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      Kullanıcı Adı
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <p>
                      {new Date().toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
