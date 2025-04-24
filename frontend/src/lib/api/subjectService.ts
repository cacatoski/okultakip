import api from './axiosConfig';

// Tüm dersleri getir
export const getAllSubjects = async (params?: { classId?: string, teacherId?: string }) => {
  try {
    const response = await api.get('/subjects', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Belirli bir dersi getir
export const getSubject = async (subjectId: string) => {
  try {
    const response = await api.get(`/subjects/${subjectId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Yeni ders oluştur
export const createSubject = async (subjectData: {
  name: string;
  code?: string;
  description?: string;
  teacherId?: string;
  classId?: string;
  weeklyHours?: number;
  semester?: string;
}) => {
  try {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Ders bilgilerini güncelle
export const updateSubject = async (subjectId: string, subjectData: any) => {
  try {
    const response = await api.put(`/subjects/${subjectId}`, subjectData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Dersi sil
export const deleteSubject = async (subjectId: string) => {
  try {
    const response = await api.delete(`/subjects/${subjectId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Derse öğretmen ata
export const assignTeacherToSubject = async (subjectId: string, teacherId: string) => {
  try {
    const response = await api.post(`/subjects/${subjectId}/teacher`, { teacherId });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
