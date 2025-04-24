import axios from 'axios';
import { auth } from '../firebase/config';

// API temel URL'si
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

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
