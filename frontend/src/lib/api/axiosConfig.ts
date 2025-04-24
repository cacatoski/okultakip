import axios from 'axios';
import { auth } from '../firebase/config';

// API temel URL'si
// Tarayıcı ortamında çalışırken localhost'u kullan
// Docker içinde çalışırken backend servis adını kullan
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';

// Tarayıcı ortamında çalışıyorsa, URL'yi localhost'a çevir
if (typeof window !== 'undefined') {
  // Docker içindeki backend servis adını localhost ile değiştir
  API_URL = API_URL.replace('http://backend:', 'http://localhost:');
  console.log('API URL (tarayıcı):', API_URL);
} else {
  console.log('API URL (sunucu):', API_URL);
}

// Axios örneği oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor'ı - her istekte token ekle
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı - hataları yönet
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Token süresi dolmuşsa yenile ve tekrar dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const user = auth.currentUser;
      if (user) {
        try {
          await user.getIdToken(true); // Token'ı yenile
          const token = await user.getIdToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Token yenileme hatası:', refreshError);
          // Kullanıcıyı oturum açma sayfasına yönlendir
          window.location.href = '/giris';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
