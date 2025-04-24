'use client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Test ortamında basitleştirilmiş bir AuthProvider
  // Geliştirme aşamasında kimlik doğrulama kontrolünü devre dışı bırakıyoruz
  return <>{children}</>;
}
