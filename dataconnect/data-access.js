/**
 * Okul Takip Sistemi - Veri Erişim Fonksiyonları
 * 
 * Bu dosya, Firestore veritabanına erişim için temel CRUD fonksiyonlarını içerir.
 * Tüm koleksiyonlar için ortak kullanılabilecek fonksiyonlar sağlar.
 */

// Firestore şeması
const schema = require('./firestore-schema');

/**
 * Belirtilen koleksiyondan bir doküman getirir
 * @param {Object} db - Firestore referansı
 * @param {String} collection - Koleksiyon adı
 * @param {String} id - Doküman ID'si
 * @returns {Promise<Object>} Doküman verisi
 */
const getDocument = async (db, collection, id) => {
  try {
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`Doküman getirme hatası (${collection}/${id}):`, error);
    throw error;
  }
};

/**
 * Belirtilen koleksiyona yeni bir doküman ekler
 * @param {Object} db - Firestore referansı
 * @param {String} collection - Koleksiyon adı
 * @param {Object} data - Doküman verisi
 * @param {String} id - Doküman ID'si (opsiyonel)
 * @returns {Promise<Object>} Eklenen doküman referansı ve ID'si
 */
const addDocument = async (db, collection, data, id = null) => {
  try {
    let docRef;
    
    if (id) {
      docRef = db.collection(collection).doc(id);
      await docRef.set(data);
    } else {
      docRef = await db.collection(collection).add(data);
    }
    
    return { id: docRef.id, ref: docRef };
  } catch (error) {
    console.error(`Doküman ekleme hatası (${collection}):`, error);
    throw error;
  }
};

/**
 * Belirtilen dokümanı günceller
 * @param {Object} db - Firestore referansı
 * @param {String} collection - Koleksiyon adı
 * @param {String} id - Doküman ID'si
 * @param {Object} data - Güncellenecek veriler
 * @param {Boolean} merge - Mevcut verileri koruyarak güncelle
 * @returns {Promise<void>}
 */
const updateDocument = async (db, collection, id, data, merge = true) => {
  try {
    const docRef = db.collection(collection).doc(id);
    await docRef.set(data, { merge });
    return { id, ref: docRef };
  } catch (error) {
    console.error(`Doküman güncelleme hatası (${collection}/${id}):`, error);
    throw error;
  }
};

/**
 * Belirtilen dokümanı siler
 * @param {Object} db - Firestore referansı
 * @param {String} collection - Koleksiyon adı
 * @param {String} id - Doküman ID'si
 * @returns {Promise<void>}
 */
const deleteDocument = async (db, collection, id) => {
  try {
    await db.collection(collection).doc(id).delete();
    return { id };
  } catch (error) {
    console.error(`Doküman silme hatası (${collection}/${id}):`, error);
    throw error;
  }
};

/**
 * Belirtilen koleksiyondan sorgu ile dokümanları getirir
 * @param {Object} db - Firestore referansı
 * @param {String} collection - Koleksiyon adı
 * @param {Array} queries - Sorgu dizisi [['field', 'operator', 'value'], ...]
 * @param {Number} limit - Maksimum doküman sayısı
 * @param {String} orderBy - Sıralama alanı
 * @param {String} orderDir - Sıralama yönü ('asc' veya 'desc')
 * @returns {Promise<Array>} Doküman dizisi
 */
const queryDocuments = async (db, collection, queries = [], limit = 100, orderBy = null, orderDir = 'asc') => {
  try {
    let query = db.collection(collection);
    
    // Sorguları ekle
    queries.forEach(q => {
      const [field, operator, value] = q;
      query = query.where(field, operator, value);
    });
    
    // Sıralama ekle
    if (orderBy) {
      query = query.orderBy(orderBy, orderDir);
    }
    
    // Limit ekle
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  } catch (error) {
    console.error(`Doküman sorgulama hatası (${collection}):`, error);
    throw error;
  }
};

// Kullanıcı işlemleri
const getUser = async (db, userId) => {
  return getDocument(db, 'users', userId);
};

const createUser = async (db, userData, userId = null) => {
  return addDocument(db, 'users', userData, userId);
};

const updateUser = async (db, userId, userData) => {
  return updateDocument(db, 'users', userId, userData);
};

const deleteUser = async (db, userId) => {
  return deleteDocument(db, 'users', userId);
};

const queryUsers = async (db, queries = [], limit = 100, orderBy = 'createdAt', orderDir = 'desc') => {
  return queryDocuments(db, 'users', queries, limit, orderBy, orderDir);
};

// Okul işlemleri
const getSchool = async (db, schoolId) => {
  return getDocument(db, 'schools', schoolId);
};

const createSchool = async (db, schoolData, schoolId = null) => {
  return addDocument(db, 'schools', schoolData, schoolId);
};

const updateSchool = async (db, schoolId, schoolData) => {
  return updateDocument(db, 'schools', schoolId, schoolData);
};

const deleteSchool = async (db, schoolId) => {
  return deleteDocument(db, 'schools', schoolId);
};

// Sınıf işlemleri
const getClass = async (db, classId) => {
  return getDocument(db, 'classes', classId);
};

const createClass = async (db, classData, classId = null) => {
  return addDocument(db, 'classes', classData, classId);
};

const updateClass = async (db, classId, classData) => {
  return updateDocument(db, 'classes', classId, classData);
};

const deleteClass = async (db, classId) => {
  return deleteDocument(db, 'classes', classId);
};

const queryClasses = async (db, queries = [], limit = 100, orderBy = 'name', orderDir = 'asc') => {
  return queryDocuments(db, 'classes', queries, limit, orderBy, orderDir);
};

// Ders işlemleri
const getSubject = async (db, subjectId) => {
  return getDocument(db, 'subjects', subjectId);
};

const createSubject = async (db, subjectData, subjectId = null) => {
  return addDocument(db, 'subjects', subjectData, subjectId);
};

const updateSubject = async (db, subjectId, subjectData) => {
  return updateDocument(db, 'subjects', subjectId, subjectData);
};

const deleteSubject = async (db, subjectId) => {
  return deleteDocument(db, 'subjects', subjectId);
};

// Not işlemleri
const getGrade = async (db, gradeId) => {
  return getDocument(db, 'grades', gradeId);
};

const createGrade = async (db, gradeData, gradeId = null) => {
  return addDocument(db, 'grades', gradeData, gradeId);
};

const updateGrade = async (db, gradeId, gradeData) => {
  return updateDocument(db, 'grades', gradeId, gradeData);
};

const deleteGrade = async (db, gradeId) => {
  return deleteDocument(db, 'grades', gradeId);
};

const queryGrades = async (db, queries = [], limit = 100, orderBy = 'examDate', orderDir = 'desc') => {
  return queryDocuments(db, 'grades', queries, limit, orderBy, orderDir);
};

// Devamsızlık işlemleri
const getAttendance = async (db, attendanceId) => {
  return getDocument(db, 'attendance', attendanceId);
};

const createAttendance = async (db, attendanceData, attendanceId = null) => {
  return addDocument(db, 'attendance', attendanceData, attendanceId);
};

const updateAttendance = async (db, attendanceId, attendanceData) => {
  return updateDocument(db, 'attendance', attendanceId, attendanceData);
};

const queryAttendance = async (db, queries = [], limit = 100, orderBy = 'date', orderDir = 'desc') => {
  return queryDocuments(db, 'attendance', queries, limit, orderBy, orderDir);
};

// Duyuru işlemleri
const getAnnouncement = async (db, announcementId) => {
  return getDocument(db, 'announcements', announcementId);
};

const createAnnouncement = async (db, announcementData, announcementId = null) => {
  return addDocument(db, 'announcements', announcementData, announcementId);
};

const updateAnnouncement = async (db, announcementId, announcementData) => {
  return updateDocument(db, 'announcements', announcementId, announcementData);
};

const deleteAnnouncement = async (db, announcementId) => {
  return deleteDocument(db, 'announcements', announcementId);
};

const queryAnnouncements = async (db, queries = [], limit = 100, orderBy = 'publishDate', orderDir = 'desc') => {
  return queryDocuments(db, 'announcements', queries, limit, orderBy, orderDir);
};

// Mesaj işlemleri
const getMessage = async (db, messageId) => {
  return getDocument(db, 'messages', messageId);
};

const createMessage = async (db, messageData, messageId = null) => {
  return addDocument(db, 'messages', messageData, messageId);
};

const updateMessage = async (db, messageId, messageData) => {
  return updateDocument(db, 'messages', messageId, messageData);
};

const queryMessages = async (db, queries = [], limit = 100, orderBy = 'createdAt', orderDir = 'desc') => {
  return queryDocuments(db, 'messages', queries, limit, orderBy, orderDir);
};

// Tüm fonksiyonları dışa aktar
module.exports = {
  // Genel CRUD fonksiyonları
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  
  // Kullanıcı işlemleri
  getUser,
  createUser,
  updateUser,
  deleteUser,
  queryUsers,
  
  // Okul işlemleri
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
  
  // Sınıf işlemleri
  getClass,
  createClass,
  updateClass,
  deleteClass,
  queryClasses,
  
  // Ders işlemleri
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  
  // Not işlemleri
  getGrade,
  createGrade,
  updateGrade,
  deleteGrade,
  queryGrades,
  
  // Devamsızlık işlemleri
  getAttendance,
  createAttendance,
  updateAttendance,
  queryAttendance,
  
  // Duyuru işlemleri
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  queryAnnouncements,
  
  // Mesaj işlemleri
  getMessage,
  createMessage,
  updateMessage,
  queryMessages
};
