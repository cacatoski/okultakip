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
    console.log('Backend API isteği gönderiliyor...');
    const response = await api.post('/auth/registerUser', {
      email,
      password, // Bu aslında güvenlik açısından ideal değil, sadece test için
      displayName,
      role,
      uid: user.uid
    });
    
    console.log('Kayıt başarılı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Kayıt hatası:', error);
    throw new Error(error.message);
  }
};

// Kullanıcı girişi
export const login = async (email: string, password: string) => {
  try {
    console.log(`Giriş deneniyor: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    
    // Backend'den kullanıcı bilgilerini getir - en fazla 3 kez deneme yap
    let retryCount = 0;
    const maxRetries = 3;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Token doğrulanıyor... (Deneme ${retryCount + 1}/${maxRetries})`);
        
        // Önce verifyToken endpoint'ini dene
        try {
          const response = await api.post('/auth/verifyToken', { idToken });
          console.log('Giriş başarılı:', response.data);
          return {
            user: response.data.user,
            token: idToken
          };
        } catch (verifyTokenError) {
          console.log('verifyToken endpoint hatası, verify-token deneniyor...');
          // verifyToken başarısız olursa, verify-token endpoint'ini dene
          const response = await api.post('/auth/verify-token', { idToken });
          console.log('Giriş başarılı (verify-token):', response.data);
          return {
            user: response.data.user,
            token: idToken
          };
        }
      } catch (backendError) {
        lastError = backendError;
        console.error(`Backend doğrulama hatası (Deneme ${retryCount + 1}/${maxRetries}):`, backendError);
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Bir sonraki denemeden önce kısa bir bekleme süresi
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Tüm denemeler başarısız olduğunda, Firebase'den aldığımız temel bilgilerle devam et
    console.log('Backend doğrulama başarısız, temel kullanıcı bilgileri kullanılıyor');
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        role: 'student', // Varsayılan rol
        authSource: 'firebase-only' // Backend doğrulaması olmadan sadece Firebase'den geldiğini belirt
      },
      token: idToken
    };
  } catch (error: any) {
    console.error('Giriş hatası:', error);
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
