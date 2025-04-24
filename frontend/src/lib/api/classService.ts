import api from './axiosConfig';

// Tüm sınıfları getir
export const getAllClasses = async (params?: { schoolId?: string, grade?: number }) => {
  try {
    const response = await api.get('/classes', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Belirli bir sınıfı getir
export const getClass = async (classId: string) => {
  try {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Yeni sınıf oluştur
export const createClass = async (classData: {
  name: string;
  grade: number;
  section?: string;
  classTeacherId?: string;
  schoolId: string;
  academicYear?: string;
  maxStudents?: number;
  classroom?: string;
}) => {
  try {
    const response = await api.post('/classes', classData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Sınıf bilgilerini güncelle
export const updateClass = async (classId: string, classData: any) => {
  try {
    const response = await api.put(`/classes/${classId}`, classData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Sınıfı sil
export const deleteClass = async (classId: string) => {
  try {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Sınıfa öğrenci ekle
export const addStudentToClass = async (classId: string, studentId: string) => {
  try {
    const response = await api.post(`/classes/${classId}/students`, { studentId });
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Sınıftan öğrenci çıkar
export const removeStudentFromClass = async (classId: string, studentId: string) => {
  try {
    const response = await api.delete(`/classes/${classId}/students/${studentId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
