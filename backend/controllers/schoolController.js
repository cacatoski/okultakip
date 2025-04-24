/**
 * Okul Yönetimi Controller'ı
 * 
 * Bu dosya, okul yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateSchoolData } = require('../utils/validators');

/**
 * Yeni okul oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createSchool = async (req, res) => {
  try {
    const { name, address, city, phone, email, type } = req.body;
    
    // Okul verilerini doğrula
    const validationResult = validateSchoolData({ name, address, city, phone });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Okul verilerini hazırla
    const schoolData = {
      name,
      address,
      city,
      phone,
      email: email || '',
      type: type || 'public', // public, private
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      adminIds: [req.user.uid], // Oluşturan kullanıcıyı admin olarak ekle
      settings: {
        logo: req.body.logo || '',
        website: req.body.website || '',
        colors: req.body.colors || { primary: '#3f51b5', secondary: '#f50057' },
        academicYear: req.body.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      }
    };
    
    // Firestore'a okul verilerini kaydet
    const schoolRef = await firestore.collection('schools').add(schoolData);
    const schoolId = schoolRef.id;
    
    // Kullanıcının okul listesini güncelle
    await firestore.collection('users').doc(req.user.uid).update({
      'adminInfo.schoolIds': firestore.FieldValue.arrayUnion(schoolId)
    });
    
    return res.status(201).json({
      message: 'Okul başarıyla oluşturuldu',
      schoolId,
      name
    });
  } catch (error) {
    console.error('Okul oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Okul oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Okul bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Okul verilerini getir
    const schoolDoc = await firestore.collection('schools').doc(schoolId).get();
    
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: 'Okul bulunamadı' });
    }
    
    const schoolData = schoolDoc.data();
    
    // Okul adminlerini getir
    const adminIds = schoolData.adminIds || [];
    const admins = [];
    
    for (const adminId of adminIds) {
      const adminDoc = await firestore.collection('users').doc(adminId).get();
      if (adminDoc.exists) {
        admins.push({
          id: adminDoc.id,
          displayName: adminDoc.data().displayName,
          email: adminDoc.data().email
        });
      }
    }
    
    // Okuldaki sınıf sayısını getir
    const classesSnapshot = await firestore.collection('classes')
      .where('schoolId', '==', schoolId)
      .where('isActive', '==', true)
      .get();
    
    // Okuldaki öğrenci sayısını getir
    const studentsSnapshot = await firestore.collection('users')
      .where('role', '==', 'student')
      .where('studentInfo.schoolId', '==', schoolId)
      .where('isActive', '==', true)
      .get();
    
    // Okuldaki öğretmen sayısını getir
    const teachersSnapshot = await firestore.collection('users')
      .where('role', '==', 'teacher')
      .where('teacherInfo.schoolId', '==', schoolId)
      .where('isActive', '==', true)
      .get();
    
    return res.status(200).json({
      id: schoolId,
      ...schoolData,
      admins,
      stats: {
        classCount: classesSnapshot.size,
        studentCount: studentsSnapshot.size,
        teacherCount: teachersSnapshot.size
      }
    });
  } catch (error) {
    console.error('Okul getirme hatası:', error);
    return res.status(500).json({
      error: 'Okul bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Tüm okulları getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllSchools = async (req, res) => {
  try {
    const { city, type, isActive, limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('schools');
    
    // Şehre göre filtreleme
    if (city) {
      query = query.where('city', '==', city);
    }
    
    // Okul türüne göre filtreleme
    if (type) {
      query = query.where('type', '==', type);
    }
    
    // Aktif okullara göre filtreleme
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }
    
    // Oluşturma tarihine göre sırala (en yeniden en eskiye)
    query = query.orderBy('createdAt', 'desc');
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const schools = [];
    
    snapshot.forEach(doc => {
      schools.push({
        id: doc.id,
        name: doc.data().name,
        city: doc.data().city,
        type: doc.data().type,
        isActive: doc.data().isActive,
        createdAt: doc.data().createdAt,
        settings: doc.data().settings
      });
    });
    
    return res.status(200).json({
      schools,
      count: schools.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Okulları getirme hatası:', error);
    return res.status(500).json({
      error: 'Okullar getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Okul bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, address, city, phone, email, type, ...otherData } = req.body;
    
    // Okul dokümanını kontrol et
    const schoolRef = firestore.collection('schools').doc(schoolId);
    const schoolDoc = await schoolRef.get();
    
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: 'Okul bulunamadı' });
    }
    
    // Kullanıcının okul admini olup olmadığını kontrol et
    const schoolData = schoolDoc.data();
    const adminIds = schoolData.adminIds || [];
    
    if (!adminIds.includes(req.user.uid) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu okulu güncelleme yetkiniz yok' });
    }
    
    // Okul verilerini güncelle
    const updateData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (type) updateData.type = type;
    
    // Ayarları güncelle
    if (req.body.settings) {
      const oldSettings = schoolData.settings || {};
      updateData.settings = {
        ...oldSettings,
        ...req.body.settings
      };
    }
    
    await schoolRef.update(updateData);
    
    return res.status(200).json({
      message: 'Okul başarıyla güncellendi',
      schoolId
    });
  } catch (error) {
    console.error('Okul güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Okul güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Okulu siler (soft delete)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Okul dokümanını kontrol et
    const schoolRef = firestore.collection('schools').doc(schoolId);
    const schoolDoc = await schoolRef.get();
    
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: 'Okul bulunamadı' });
    }
    
    // Kullanıcının okul admini olup olmadığını kontrol et
    const schoolData = schoolDoc.data();
    const adminIds = schoolData.adminIds || [];
    
    if (!adminIds.includes(req.user.uid) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu okulu silme yetkiniz yok' });
    }
    
    // Okulu pasif yap (soft delete)
    await schoolRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Okul başarıyla silindi',
      schoolId
    });
  } catch (error) {
    console.error('Okul silme hatası:', error);
    return res.status(500).json({
      error: 'Okul silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Okula admin ekler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.addAdminToSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { adminId } = req.body;
    
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID gereklidir' });
    }
    
    // Okul dokümanını kontrol et
    const schoolRef = firestore.collection('schools').doc(schoolId);
    const schoolDoc = await schoolRef.get();
    
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: 'Okul bulunamadı' });
    }
    
    // Kullanıcının okul admini olup olmadığını kontrol et
    const schoolData = schoolDoc.data();
    const adminIds = schoolData.adminIds || [];
    
    if (!adminIds.includes(req.user.uid) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu okula admin ekleme yetkiniz yok' });
    }
    
    // Admin dokümanını kontrol et
    const adminRef = firestore.collection('users').doc(adminId);
    const adminDoc = await adminRef.get();
    
    if (!adminDoc.exists) {
      return res.status(404).json({ error: 'Admin kullanıcı bulunamadı' });
    }
    
    const adminData = adminDoc.data();
    
    if (adminData.role !== 'admin') {
      return res.status(400).json({ error: 'Kullanıcı bir admin değil' });
    }
    
    // Admin zaten eklenmiş mi kontrol et
    if (adminIds.includes(adminId)) {
      return res.status(400).json({ error: 'Kullanıcı zaten bu okulun admini' });
    }
    
    // Okula admin ekle
    await schoolRef.update({
      adminIds: [...adminIds, adminId],
      updatedAt: new Date().toISOString()
    });
    
    // Adminin okul listesini güncelle
    await adminRef.update({
      'adminInfo.schoolIds': firestore.FieldValue.arrayUnion(schoolId)
    });
    
    return res.status(200).json({
      message: 'Admin okula başarıyla eklendi',
      schoolId,
      adminId
    });
  } catch (error) {
    console.error('Admin ekleme hatası:', error);
    return res.status(500).json({
      error: 'Admin okula eklenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Okuldan admin çıkarır
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.removeAdminFromSchool = async (req, res) => {
  try {
    const { schoolId, adminId } = req.params;
    
    // Okul dokümanını kontrol et
    const schoolRef = firestore.collection('schools').doc(schoolId);
    const schoolDoc = await schoolRef.get();
    
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: 'Okul bulunamadı' });
    }
    
    // Kullanıcının okul admini olup olmadığını kontrol et
    const schoolData = schoolDoc.data();
    const adminIds = schoolData.adminIds || [];
    
    if (!adminIds.includes(req.user.uid) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu okuldan admin çıkarma yetkiniz yok' });
    }
    
    // Admin dokümanını kontrol et
    const adminRef = firestore.collection('users').doc(adminId);
    const adminDoc = await adminRef.get();
    
    if (!adminDoc.exists) {
      return res.status(404).json({ error: 'Admin kullanıcı bulunamadı' });
    }
    
    // Admin okulun admini mi kontrol et
    if (!adminIds.includes(adminId)) {
      return res.status(400).json({ error: 'Kullanıcı bu okulun admini değil' });
    }
    
    // Son admin mi kontrol et
    if (adminIds.length === 1 && adminIds[0] === adminId) {
      return res.status(400).json({ error: 'Okulun son adminini çıkaramazsınız' });
    }
    
    // Okuldan admin çıkar
    await schoolRef.update({
      adminIds: adminIds.filter(id => id !== adminId),
      updatedAt: new Date().toISOString()
    });
    
    // Adminin okul listesini güncelle
    await adminRef.update({
      'adminInfo.schoolIds': firestore.FieldValue.arrayRemove(schoolId)
    });
    
    return res.status(200).json({
      message: 'Admin okuldan başarıyla çıkarıldı',
      schoolId,
      adminId
    });
  } catch (error) {
    console.error('Admin çıkarma hatası:', error);
    return res.status(500).json({
      error: 'Admin okuldan çıkarılırken bir hata oluştu',
      details: error.message
    });
  }
};
