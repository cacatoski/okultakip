import api from './axiosConfig';

// Tüm kullanıcıları getir
export const getAllUsers = async (role?: string) => {
  try {
    const params = role ? { role } : {};
    const response = await api.get('/users', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Belirli bir kullanıcıyı getir
export const getUser = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Kullanıcı bilgilerini güncelle
export const updateUser = async (userId: string, userData: any) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Kullanıcı sil
export const deleteUser = async (userId: string) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Şifre sıfırlama isteği gönder
export const sendPasswordReset = async (email: string) => {
  try {
    const response = await api.post('/users/reset-password', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
