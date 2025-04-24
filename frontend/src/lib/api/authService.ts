import api from './axiosConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Kullanıcı kayıt işlemi
export const register = async (email: string, password: string, role: string, displayName: string) => {
  try {
    // Firebase Authentication'da kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Backend API'ye kullanıcı bilgilerini gönder
    const response = await api.post('/users', {
      email,
      displayName,
      role,
      uid: user.uid
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Kullanıcı girişi
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Kullanıcı bilgilerini getir
    const response = await api.get(`/users/${user.uid}`);
    
    return {
      user: response.data,
      token: await user.getIdToken()
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Kullanıcı çıkışı
export const logout = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Şifre sıfırlama
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Mevcut kullanıcı bilgilerini getir
export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }
    
    const response = await api.get(`/users/${user.uid}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
