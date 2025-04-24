/**
 * Kullanıcı Yönetimi Controller'ı
 * 
 * Bu dosya, kullanıcı yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { auth, firestore } = require('../firebase-admin');
const { validateUserData } = require('../utils/validators');

/**
 * Yeni kullanıcı oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createUser = async (req, res) => {
  try {
    const { email, password, displayName, role, phoneNumber } = req.body;
    
    // Kullanıcı verilerini doğrula
    const validationResult = validateUserData({ email, password, role });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Firebase Auth'da kullanıcı oluştur
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      phoneNumber
    });
    
    const uid = userRecord.uid;
    
    // Kullanıcı rolüne göre ek bilgiler
    let userData = {
      email,
      displayName: displayName || email.split('@')[0],
      phoneNumber,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    // Role göre ek bilgiler ekle
    if (role === 'student') {
      userData.studentInfo = {
        studentId: req.body.studentId || '',
        classId: req.body.classId || '',
        parentIds: req.body.parentIds || []
      };
    } else if (role === 'teacher') {
      userData.teacherInfo = {
        teacherId: req.body.teacherId || '',
        subjects: req.body.subjects || [],
        classIds: req.body.classIds || [],
        branch: req.body.branch || ''
      };
    } else if (role === 'parent') {
      userData.parentInfo = {
        studentIds: req.body.studentIds || [],
        relation: req.body.relation || 'parent'
      };
    } else if (role === 'admin') {
      userData.adminInfo = {
        adminType: req.body.adminType || 'school_admin',
        permissions: req.body.permissions || ['users:read', 'users:write']
      };
    }
    
    // Firestore'a kullanıcı verilerini kaydet
    await firestore.collection('users').doc(uid).set(userData);
    
    return res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      uid,
      role
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Kullanıcı oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcı bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcı kimlik bilgilerini getir
    const userRecord = await auth.getUser(userId);
    
    // Kullanıcı verilerini getir
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const userData = userDoc.data();
    
    return res.status(200).json({
      id: userId,
      email: userRecord.email,
      displayName: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber,
      emailVerified: userRecord.emailVerified,
      ...userData
    });
  } catch (error) {
    console.error('Kullanıcı getirme hatası:', error);
    return res.status(500).json({
      error: 'Kullanıcı bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Tüm kullanıcıları getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('users');
    
    // Role göre filtreleme
    if (role) {
      query = query.where('role', '==', role);
    }
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      users,
      count: users.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    return res.status(500).json({
      error: 'Kullanıcılar getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcı bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, phoneNumber, role, ...otherData } = req.body;
    
    // Auth bilgilerini güncelle
    const updateAuthData = {};
    if (displayName) updateAuthData.displayName = displayName;
    if (phoneNumber) updateAuthData.phoneNumber = phoneNumber;
    
    if (Object.keys(updateAuthData).length > 0) {
      await auth.updateUser(userId, updateAuthData);
    }
    
    // Firestore verilerini güncelle
    const userData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (displayName) userData.displayName = displayName;
    if (phoneNumber) userData.phoneNumber = phoneNumber;
    
    // Role özgü bilgileri güncelle
    if (role === 'student' && req.body.studentInfo) {
      userData.studentInfo = req.body.studentInfo;
    } else if (role === 'teacher' && req.body.teacherInfo) {
      userData.teacherInfo = req.body.teacherInfo;
    } else if (role === 'parent' && req.body.parentInfo) {
      userData.parentInfo = req.body.parentInfo;
    } else if (role === 'admin' && req.body.adminInfo) {
      userData.adminInfo = req.body.adminInfo;
    }
    
    await firestore.collection('users').doc(userId).update(userData);
    
    return res.status(200).json({
      message: 'Kullanıcı başarıyla güncellendi',
      userId
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Kullanıcı güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcıyı siler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Firebase Auth'dan kullanıcıyı sil
    await auth.deleteUser(userId);
    
    // Firestore'dan kullanıcı verilerini sil
    await firestore.collection('users').doc(userId).delete();
    
    return res.status(200).json({
      message: 'Kullanıcı başarıyla silindi',
      userId
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return res.status(500).json({
      error: 'Kullanıcı silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcı şifresini sıfırlar
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'E-posta adresi gereklidir' });
    }
    
    // Şifre sıfırlama bağlantısı gönder
    const actionCodeSettings = {
      url: process.env.PASSWORD_RESET_URL || 'https://okultakip.com/login',
      handleCodeInApp: true
    };
    
    await auth.generatePasswordResetLink(email, actionCodeSettings);
    
    return res.status(200).json({
      message: 'Şifre sıfırlama bağlantısı e-posta adresine gönderildi'
    });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return res.status(500).json({
      error: 'Şifre sıfırlanırken bir hata oluştu',
      details: error.message
    });
  }
};
