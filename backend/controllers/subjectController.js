/**
 * Ders Yönetimi Controller'ı
 * 
 * Bu dosya, ders yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateSubjectData } = require('../utils/validators');

/**
 * Yeni ders oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createSubject = async (req, res) => {
  try {
    const { name, code, description, grade, schoolId } = req.body;
    
    // Ders verilerini doğrula
    const validationResult = validateSubjectData({ name, code, schoolId });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Ders verilerini hazırla
    const subjectData = {
      name,
      code: code || name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 900 + 100),
      description: description || '',
      grade: grade ? parseInt(grade) : null,
      schoolId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      settings: {
        weeklyHours: req.body.weeklyHours || 4,
        isRequired: req.body.isRequired !== undefined ? req.body.isRequired : true,
        passingGrade: req.body.passingGrade || 60
      }
    };
    
    // Firestore'a ders verilerini kaydet
    const subjectRef = await firestore.collection('subjects').add(subjectData);
    const subjectId = subjectRef.id;
    
    return res.status(201).json({
      message: 'Ders başarıyla oluşturuldu',
      subjectId,
      name,
      code: subjectData.code
    });
  } catch (error) {
    console.error('Ders oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Ders oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ders bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Ders verilerini getir
    const subjectDoc = await firestore.collection('subjects').doc(subjectId).get();
    
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    const subjectData = subjectDoc.data();
    
    // Dersi veren öğretmenleri getir
    const teachersSnapshot = await firestore.collection('users')
      .where('role', '==', 'teacher')
      .where('teacherInfo.subjects', 'array-contains', subjectId)
      .get();
    
    const teachers = [];
    teachersSnapshot.forEach(doc => {
      teachers.push({
        id: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email,
        branch: doc.data().teacherInfo?.branch || ''
      });
    });
    
    return res.status(200).json({
      id: subjectId,
      ...subjectData,
      teachers,
      teacherCount: teachers.length
    });
  } catch (error) {
    console.error('Ders getirme hatası:', error);
    return res.status(500).json({
      error: 'Ders bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Tüm dersleri getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllSubjects = async (req, res) => {
  try {
    const { schoolId, grade, limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('subjects');
    
    // Okula göre filtreleme
    if (schoolId) {
      query = query.where('schoolId', '==', schoolId);
    }
    
    // Sınıf seviyesine göre filtreleme
    if (grade) {
      query = query.where('grade', '==', parseInt(grade));
    }
    
    // Aktif dersleri getir
    query = query.where('isActive', '==', true);
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const subjects = [];
    
    snapshot.forEach(doc => {
      subjects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      subjects,
      count: subjects.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Dersleri getirme hatası:', error);
    return res.status(500).json({
      error: 'Dersler getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ders bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { name, code, description, grade, ...otherData } = req.body;
    
    // Ders dokümanını kontrol et
    const subjectRef = firestore.collection('subjects').doc(subjectId);
    const subjectDoc = await subjectRef.get();
    
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    // Ders verilerini güncelle
    const subjectData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (name) subjectData.name = name;
    if (code) subjectData.code = code;
    if (description !== undefined) subjectData.description = description;
    if (grade) subjectData.grade = parseInt(grade);
    
    // Ayarları güncelle
    if (req.body.settings) {
      const oldSettings = subjectDoc.data().settings || {};
      subjectData.settings = {
        ...oldSettings,
        ...req.body.settings
      };
    }
    
    await subjectRef.update(subjectData);
    
    return res.status(200).json({
      message: 'Ders başarıyla güncellendi',
      subjectId
    });
  } catch (error) {
    console.error('Ders güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Ders güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Dersi siler (soft delete)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Ders dokümanını kontrol et
    const subjectRef = firestore.collection('subjects').doc(subjectId);
    const subjectDoc = await subjectRef.get();
    
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    // Dersi pasif yap (soft delete)
    await subjectRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    
    // Öğretmenlerin ders listesinden çıkar
    const teachersSnapshot = await firestore.collection('users')
      .where('role', '==', 'teacher')
      .where('teacherInfo.subjects', 'array-contains', subjectId)
      .get();
    
    const batch = firestore.batch();
    
    teachersSnapshot.forEach(doc => {
      const teacherRef = firestore.collection('users').doc(doc.id);
      const teacherData = doc.data();
      const subjects = teacherData.teacherInfo?.subjects || [];
      
      batch.update(teacherRef, {
        'teacherInfo.subjects': subjects.filter(id => id !== subjectId),
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    
    return res.status(200).json({
      message: 'Ders başarıyla silindi',
      subjectId
    });
  } catch (error) {
    console.error('Ders silme hatası:', error);
    return res.status(500).json({
      error: 'Ders silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Derse öğretmen atar
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.assignTeacherToSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { teacherId } = req.body;
    
    if (!teacherId) {
      return res.status(400).json({ error: 'Öğretmen ID gereklidir' });
    }
    
    // Ders dokümanını kontrol et
    const subjectRef = firestore.collection('subjects').doc(subjectId);
    const subjectDoc = await subjectRef.get();
    
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    // Öğretmen dokümanını kontrol et
    const teacherRef = firestore.collection('users').doc(teacherId);
    const teacherDoc = await teacherRef.get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({ error: 'Öğretmen bulunamadı' });
    }
    
    const teacherData = teacherDoc.data();
    
    if (teacherData.role !== 'teacher') {
      return res.status(400).json({ error: 'Kullanıcı bir öğretmen değil' });
    }
    
    // Öğretmenin ders listesini güncelle
    const subjects = teacherData.teacherInfo?.subjects || [];
    
    if (!subjects.includes(subjectId)) {
      await teacherRef.update({
        'teacherInfo.subjects': [...subjects, subjectId],
        updatedAt: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      message: 'Öğretmen derse başarıyla atandı',
      subjectId,
      teacherId
    });
  } catch (error) {
    console.error('Öğretmen atama hatası:', error);
    return res.status(500).json({
      error: 'Öğretmen derse atanırken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Dersten öğretmeni çıkarır
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.removeTeacherFromSubject = async (req, res) => {
  try {
    const { subjectId, teacherId } = req.params;
    
    // Öğretmen dokümanını kontrol et
    const teacherRef = firestore.collection('users').doc(teacherId);
    const teacherDoc = await teacherRef.get();
    
    if (!teacherDoc.exists) {
      return res.status(404).json({ error: 'Öğretmen bulunamadı' });
    }
    
    const teacherData = teacherDoc.data();
    
    if (teacherData.role !== 'teacher') {
      return res.status(400).json({ error: 'Kullanıcı bir öğretmen değil' });
    }
    
    const subjects = teacherData.teacherInfo?.subjects || [];
    
    if (!subjects.includes(subjectId)) {
      return res.status(400).json({ error: 'Öğretmen bu dersi vermiyor' });
    }
    
    // Öğretmenin ders listesini güncelle
    await teacherRef.update({
      'teacherInfo.subjects': subjects.filter(id => id !== subjectId),
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Öğretmen dersten başarıyla çıkarıldı',
      subjectId,
      teacherId
    });
  } catch (error) {
    console.error('Öğretmen çıkarma hatası:', error);
    return res.status(500).json({
      error: 'Öğretmen dersten çıkarılırken bir hata oluştu',
      details: error.message
    });
  }
};
