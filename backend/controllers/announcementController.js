/**
 * Duyuru Yönetimi Controller'ı
 * 
 * Bu dosya, duyuru yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateAnnouncementData } = require('../utils/validators');

/**
 * Yeni duyuru oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetGroups, schoolId, expiryDate } = req.body;
    
    // Duyuru verilerini doğrula
    const validationResult = validateAnnouncementData({ title, content, targetGroups });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Duyuru verilerini hazırla
    const announcementData = {
      title,
      content,
      targetGroups: targetGroups || ['all'],
      schoolId,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün sonra
      isActive: true,
      isImportant: req.body.isImportant || false,
      attachments: req.body.attachments || [],
      targetClasses: req.body.targetClasses || [],
      targetUsers: req.body.targetUsers || []
    };
    
    // Firestore'a duyuru verilerini kaydet
    const announcementRef = await firestore.collection('announcements').add(announcementData);
    const announcementId = announcementRef.id;
    
    return res.status(201).json({
      message: 'Duyuru başarıyla oluşturuldu',
      announcementId,
      title
    });
  } catch (error) {
    console.error('Duyuru oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Duyuru oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Duyuru bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // Duyuru verilerini getir
    const announcementDoc = await firestore.collection('announcements').doc(announcementId).get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Duyuru bulunamadı' });
    }
    
    const announcementData = announcementDoc.data();
    
    // Oluşturan kullanıcı bilgilerini getir
    let creatorData = null;
    if (announcementData.createdBy) {
      const creatorDoc = await firestore.collection('users').doc(announcementData.createdBy).get();
      if (creatorDoc.exists) {
        creatorData = {
          id: creatorDoc.id,
          displayName: creatorDoc.data().displayName,
          role: creatorDoc.data().role
        };
      }
    }
    
    return res.status(200).json({
      id: announcementId,
      ...announcementData,
      creator: creatorData
    });
  } catch (error) {
    console.error('Duyuru getirme hatası:', error);
    return res.status(500).json({
      error: 'Duyuru bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Tüm duyuruları getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { schoolId, targetGroup, isActive, isImportant, limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('announcements');
    
    // Okula göre filtreleme
    if (schoolId) {
      query = query.where('schoolId', '==', schoolId);
    }
    
    // Hedef gruba göre filtreleme
    if (targetGroup) {
      query = query.where('targetGroups', 'array-contains', targetGroup);
    }
    
    // Aktif duyurulara göre filtreleme
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    } else {
      query = query.where('isActive', '==', true);
    }
    
    // Önemli duyurulara göre filtreleme
    if (isImportant !== undefined) {
      query = query.where('isImportant', '==', isImportant === 'true');
    }
    
    // Süresi geçmemiş duyuruları getir
    const now = new Date().toISOString();
    query = query.where('expiryDate', '>=', now);
    
    // Oluşturma tarihine göre sırala (en yeniden en eskiye)
    query = query.orderBy('createdAt', 'desc');
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const announcements = [];
    
    // Duyuru verilerini topla
    for (const doc of snapshot.docs) {
      const announcementData = doc.data();
      
      // Oluşturan kullanıcı bilgilerini getir
      let creatorData = null;
      if (announcementData.createdBy) {
        const creatorDoc = await firestore.collection('users').doc(announcementData.createdBy).get();
        if (creatorDoc.exists) {
          creatorData = {
            id: creatorDoc.id,
            displayName: creatorDoc.data().displayName,
            role: creatorDoc.data().role
          };
        }
      }
      
      announcements.push({
        id: doc.id,
        ...announcementData,
        creator: creatorData
      });
    }
    
    return res.status(200).json({
      announcements,
      count: announcements.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Duyuruları getirme hatası:', error);
    return res.status(500).json({
      error: 'Duyurular getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcıya özel duyuruları getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getUserAnnouncements = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 50, offset = 0 } = req.query;
    
    // Kullanıcı bilgilerini getir
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const userData = userDoc.data();
    const userRole = userData.role;
    const userGroups = [userRole, 'all'];
    
    // Öğrenci ise sınıf ID'sini ekle
    let classId = null;
    if (userRole === 'student' && userData.studentInfo?.classId) {
      classId = userData.studentInfo.classId;
    }
    
    // Duyuruları getir
    let query = firestore.collection('announcements');
    
    // Aktif ve süresi geçmemiş duyuruları getir
    const now = new Date().toISOString();
    query = query.where('isActive', '==', true)
                .where('expiryDate', '>=', now);
    
    // Oluşturma tarihine göre sırala (en yeniden en eskiye)
    query = query.orderBy('createdAt', 'desc');
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const announcements = [];
    
    // Duyuru verilerini filtrele ve topla
    for (const doc of snapshot.docs) {
      const announcementData = doc.data();
      
      // Kullanıcının hedef gruplarında olup olmadığını kontrol et
      const isTargetGroup = announcementData.targetGroups.some(group => userGroups.includes(group));
      
      // Kullanıcının hedef kullanıcılarında olup olmadığını kontrol et
      const isTargetUser = announcementData.targetUsers.includes(userId);
      
      // Kullanıcının sınıfının hedef sınıflarda olup olmadığını kontrol et
      const isTargetClass = classId && announcementData.targetClasses.includes(classId);
      
      if (isTargetGroup || isTargetUser || isTargetClass) {
        // Oluşturan kullanıcı bilgilerini getir
        let creatorData = null;
        if (announcementData.createdBy) {
          const creatorDoc = await firestore.collection('users').doc(announcementData.createdBy).get();
          if (creatorDoc.exists) {
            creatorData = {
              id: creatorDoc.id,
              displayName: creatorDoc.data().displayName,
              role: creatorDoc.data().role
            };
          }
        }
        
        announcements.push({
          id: doc.id,
          ...announcementData,
          creator: creatorData
        });
      }
    }
    
    return res.status(200).json({
      announcements,
      count: announcements.length
    });
  } catch (error) {
    console.error('Kullanıcı duyuruları getirme hatası:', error);
    return res.status(500).json({
      error: 'Kullanıcı duyuruları getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Duyuru bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { title, content, targetGroups, expiryDate, ...otherData } = req.body;
    
    // Duyuru dokümanını kontrol et
    const announcementRef = firestore.collection('announcements').doc(announcementId);
    const announcementDoc = await announcementRef.get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Duyuru bulunamadı' });
    }
    
    // Duyuru verilerini güncelle
    const announcementData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (title) announcementData.title = title;
    if (content) announcementData.content = content;
    if (targetGroups) announcementData.targetGroups = targetGroups;
    if (expiryDate) announcementData.expiryDate = expiryDate;
    
    await announcementRef.update(announcementData);
    
    return res.status(200).json({
      message: 'Duyuru başarıyla güncellendi',
      announcementId
    });
  } catch (error) {
    console.error('Duyuru güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Duyuru güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Duyuruyu siler (soft delete)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // Duyuru dokümanını kontrol et
    const announcementRef = firestore.collection('announcements').doc(announcementId);
    const announcementDoc = await announcementRef.get();
    
    if (!announcementDoc.exists) {
      return res.status(404).json({ error: 'Duyuru bulunamadı' });
    }
    
    // Duyuruyu pasif yap (soft delete)
    await announcementRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Duyuru başarıyla silindi',
      announcementId
    });
  } catch (error) {
    console.error('Duyuru silme hatası:', error);
    return res.status(500).json({
      error: 'Duyuru silinirken bir hata oluştu',
      details: error.message
    });
  }
};
