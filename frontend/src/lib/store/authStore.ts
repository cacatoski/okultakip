import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getCurrentUser } from '../api/authService';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  schoolId?: string;
  classId?: string;
  photoURL?: string | null;
}

interface AuthState {
  user: UserData | null;
  firebaseUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserData | null) => void;
  setFirebaseUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  loadUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setFirebaseUser: (firebaseUser) => set({ 
        firebaseUser, 
        isAuthenticated: !!firebaseUser 
      }),
      
      setError: (error) => set({ error }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: async () => {
        try {
          await auth.signOut();
          set({ 
            user: null, 
            firebaseUser: null, 
            isAuthenticated: false 
          });
        } catch (error) {
          console.error('Çıkış yapılırken hata oluştu:', error);
        }
      },
      
      loadUserData: async () => {
        try {
          set({ isLoading: true, error: null });
          const userData = await getCurrentUser();
          
          if (userData) {
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error: any) {
          console.error('Kullanıcı verileri yüklenirken hata oluştu:', error);
          set({ 
            error: error.message, 
            isLoading: false, 
            isAuthenticated: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
