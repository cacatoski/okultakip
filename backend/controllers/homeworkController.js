/**
 * Ödev Yönetimi Controller'ı
 * 
 * Bu dosya, ödev yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateHomeworkData } = require('../utils/validators');

/**
 * Yeni ödev oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createHomework = async (req, res) => {
  try {
    const { title, description, subjectId, classId, dueDate } = req.body;
    
    // Ödev verilerini doğrula
    const validationResult = validateHomeworkData({ title, description, subjectId, classId, dueDate });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Sınıf dokümanını kontrol et
    const classDoc = await firestore.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    // Ders dokümanını kontrol et
    const subjectDoc = await firestore.collection('subjects').doc(subjectId).get();
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    // Ödev verilerini hazırla
    const homeworkData = {
      title,
      description,
      subjectId,
      classId,
      dueDate,
      teacherId: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: req.body.attachments || [],
      maxPoints: req.body.maxPoints || 100,
      isActive: true,
      metadata: {
        notes: req.body.notes || '',
        estimatedTime: req.body.estimatedTime || '',
        difficulty: req.body.difficulty || 'medium' // easy, medium, hard
      }
    };
    
    // Firestore'a ödev verilerini kaydet
    const homeworkRef = await firestore.collection('homework').add(homeworkData);
    const homeworkId = homeworkRef.id;
    
    // Sınıftaki öğrencileri getir
    const studentsSnapshot = await firestore.collection('users')
      .where('role', '==', 'student')
      .where('studentInfo.classId', '==', classId)
      .get();
    
    // Öğrenciler için ödev durumlarını oluştur
    const batch = firestore.batch();
    
    studentsSnapshot.forEach(doc => {
      const studentId = doc.id;
      const homeworkStatusRef = firestore.collection('homeworkStatus').doc();
      
      batch.set(homeworkStatusRef, {
        homeworkId,
        studentId,
        status: 'assigned', // assigned, in_progress, submitted, graded
        submissionDate: null,
        grade: null,
        feedback: '',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    
    return res.status(201).json({
      message: 'Ödev başarıyla oluşturuldu',
      homeworkId,
      title
    });
  } catch (error) {
    console.error('Ödev oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Ödev oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ödev bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    
    // Ödev verilerini getir
    const homeworkDoc = await firestore.collection('homework').doc(homeworkId).get();
    
    if (!homeworkDoc.exists) {
      return res.status(404).json({ error: 'Ödev bulunamadı' });
    }
    
    const homeworkData = homeworkDoc.data();
    
    // Sınıf bilgilerini getir
    const classDoc = await firestore.collection('classes').doc(homeworkData.classId).get();
    let classData = null;
    
    if (classDoc.exists) {
      classData = {
        id: classDoc.id,
        name: classDoc.data().name,
        grade: classDoc.data().grade
      };
    }
    
    // Ders bilgilerini getir
    const subjectDoc = await firestore.collection('subjects').doc(homeworkData.subjectId).get();
    let subjectData = null;
    
    if (subjectDoc.exists) {
      subjectData = {
        id: subjectDoc.id,
        name: subjectDoc.data().name,
        code: subjectDoc.data().code
      };
    }
    
    // Öğretmen bilgilerini getir
    const teacherDoc = await firestore.collection('users').doc(homeworkData.teacherId).get();
    let teacherData = null;
    
    if (teacherDoc.exists) {
      teacherData = {
        id: teacherDoc.id,
        displayName: teacherDoc.data().displayName,
        email: teacherDoc.data().email
      };
    }
    
    // Ödev durumlarını getir
    const statusSnapshot = await firestore.collection('homeworkStatus')
      .where('homeworkId', '==', homeworkId)
      .get();
    
    const statusCounts = {
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      graded: 0,
      total: statusSnapshot.size
    };
    
    statusSnapshot.forEach(doc => {
      const status = doc.data().status;
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });
    
    return res.status(200).json({
      id: homeworkId,
      ...homeworkData,
      class: classData,
      subject: subjectData,
      teacher: teacherData,
      statusCounts
    });
  } catch (error) {
    console.error('Ödev getirme hatası:', error);
    return res.status(500).json({
      error: 'Ödev bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıfın tüm ödevlerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getClassHomework = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId, active, startDate, endDate } = req.query;
    
    // Sınıf dokümanını kontrol et
    const classDoc = await firestore.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    let query = firestore.collection('homework').where('classId', '==', classId);
    
    // Derse göre filtreleme
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    
    // Aktif ödevlere göre filtreleme
    if (active !== undefined) {
      query = query.where('isActive', '==', active === 'true');
    }
    
    // Tarih aralığına göre filtreleme
    if (startDate) {
      query = query.where('dueDate', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('dueDate', '<=', endDate);
    }
    
    // Oluşturma tarihine göre sırala (en yeniden en eskiye)
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    const homeworks = [];
    
    // Ödev verilerini topla
    for (const doc of snapshot.docs) {
      const homeworkData = doc.data();
      
      // Ders bilgilerini getir
      const subjectDoc = await firestore.collection('subjects').doc(homeworkData.subjectId).get();
      let subjectData = null;
      
      if (subjectDoc.exists) {
        subjectData = {
          id: subjectDoc.id,
          name: subjectDoc.data().name,
          code: subjectDoc.data().code
        };
      }
      
      // Öğretmen bilgilerini getir
      const teacherDoc = await firestore.collection('users').doc(homeworkData.teacherId).get();
      let teacherData = null;
      
      if (teacherDoc.exists) {
        teacherData = {
          id: teacherDoc.id,
          displayName: teacherDoc.data().displayName
        };
      }
      
      homeworks.push({
        id: doc.id,
        title: homeworkData.title,
        description: homeworkData.description,
        dueDate: homeworkData.dueDate,
        createdAt: homeworkData.createdAt,
        isActive: homeworkData.isActive,
        subject: subjectData,
        teacher: teacherData
      });
    }
    
    return res.status(200).json({
      classId,
      className: classDoc.data().name,
      homeworks,
      count: homeworks.length
    });
  } catch (error) {
    console.error('Sınıf ödevleri getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf ödevleri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Öğrencinin tüm ödevlerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getStudentHomework = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, subjectId } = req.query;
    
    // Öğrenci dokümanını kontrol et
    const studentDoc = await firestore.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    const studentData = studentDoc.data();
    if (studentData.role !== 'student') {
      return res.status(400).json({ error: 'Kullanıcı bir öğrenci değil' });
    }
    
    const classId = studentData.studentInfo?.classId;
    if (!classId) {
      return res.status(400).json({ error: 'Öğrenci herhangi bir sınıfa atanmamış' });
    }
    
    // Ödev durumlarını getir
    let statusQuery = firestore.collection('homeworkStatus').where('studentId', '==', studentId);
    
    // Duruma göre filtreleme
    if (status) {
      statusQuery = statusQuery.where('status', '==', status);
    }
    
    const statusSnapshot = await statusQuery.get();
    const homeworkIds = statusSnapshot.docs.map(doc => doc.data().homeworkId);
    const homeworkStatus = {};
    
    statusSnapshot.forEach(doc => {
      homeworkStatus[doc.data().homeworkId] = {
        id: doc.id,
        status: doc.data().status,
        submissionDate: doc.data().submissionDate,
        grade: doc.data().grade,
        feedback: doc.data().feedback,
        attachments: doc.data().attachments
      };
    });
    
    // Ödevleri getir
    const homeworks = [];
    
    if (homeworkIds.length > 0) {
      // Firestore'da in operatörü en fazla 10 değer alabilir, bu yüzden parçalara ayırıyoruz
      const chunks = [];
      for (let i = 0; i < homeworkIds.length; i += 10) {
        chunks.push(homeworkIds.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        let homeworkQuery = firestore.collection('homework').where(firestore.FieldPath.documentId(), 'in', chunk);
        
        // Derse göre filtreleme
        if (subjectId) {
          // Bu filtreleme sonradan yapılacak çünkü where ile in operatörünü birlikte kullanamıyoruz
          homeworkQuery = homeworkQuery.where('subjectId', '==', subjectId);
        }
        
        const homeworkSnapshot = await homeworkQuery.get();
        
        for (const doc of homeworkSnapshot.docs) {
          const homeworkData = doc.data();
          
          // Derse göre filtreleme (in operatörü ile birlikte kullanılamadığı için)
          if (subjectId && homeworkData.subjectId !== subjectId) {
            continue;
          }
          
          // Ders bilgilerini getir
          const subjectDoc = await firestore.collection('subjects').doc(homeworkData.subjectId).get();
          let subjectData = null;
          
          if (subjectDoc.exists) {
            subjectData = {
              id: subjectDoc.id,
              name: subjectDoc.data().name,
              code: subjectDoc.data().code
            };
          }
          
          homeworks.push({
            id: doc.id,
            title: homeworkData.title,
            description: homeworkData.description,
            dueDate: homeworkData.dueDate,
            createdAt: homeworkData.createdAt,
            subject: subjectData,
            status: homeworkStatus[doc.id]
          });
        }
      }
    }
    
    // Duruma göre sırala
    homeworks.sort((a, b) => {
      // Önce teslim edilmemiş ve süresi yaklaşanlar
      if (a.status.status === 'assigned' && b.status.status !== 'assigned') {
        return -1;
      }
      if (a.status.status !== 'assigned' && b.status.status === 'assigned') {
        return 1;
      }
      
      // Sonra teslim tarihi yaklaşanlar
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    return res.status(200).json({
      studentId,
      studentName: studentData.displayName,
      homeworks,
      count: homeworks.length,
      stats: {
        assigned: homeworks.filter(h => h.status.status === 'assigned').length,
        in_progress: homeworks.filter(h => h.status.status === 'in_progress').length,
        submitted: homeworks.filter(h => h.status.status === 'submitted').length,
        graded: homeworks.filter(h => h.status.status === 'graded').length
      }
    });
  } catch (error) {
    console.error('Öğrenci ödevleri getirme hatası:', error);
    return res.status(500).json({
      error: 'Öğrenci ödevleri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ödev bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { title, description, dueDate, isActive, ...otherData } = req.body;
    
    // Ödev dokümanını kontrol et
    const homeworkRef = firestore.collection('homework').doc(homeworkId);
    const homeworkDoc = await homeworkRef.get();
    
    if (!homeworkDoc.exists) {
      return res.status(404).json({ error: 'Ödev bulunamadı' });
    }
    
    const homeworkData = homeworkDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== homeworkData.teacherId) {
      return res.status(403).json({ error: 'Bu ödevi güncelleme yetkiniz yok' });
    }
    
    // Ödev verilerini güncelle
    const updateData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate) updateData.dueDate = dueDate;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Metadata güncelle
    if (req.body.metadata) {
      const oldMetadata = homeworkData.metadata || {};
      updateData.metadata = {
        ...oldMetadata,
        ...req.body.metadata
      };
    }
    
    await homeworkRef.update(updateData);
    
    return res.status(200).json({
      message: 'Ödev başarıyla güncellendi',
      homeworkId
    });
  } catch (error) {
    console.error('Ödev güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Ödev güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ödevi siler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    
    // Ödev dokümanını kontrol et
    const homeworkRef = firestore.collection('homework').doc(homeworkId);
    const homeworkDoc = await homeworkRef.get();
    
    if (!homeworkDoc.exists) {
      return res.status(404).json({ error: 'Ödev bulunamadı' });
    }
    
    const homeworkData = homeworkDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== homeworkData.teacherId) {
      return res.status(403).json({ error: 'Bu ödevi silme yetkiniz yok' });
    }
    
    // Ödev durumlarını getir
    const statusSnapshot = await firestore.collection('homeworkStatus')
      .where('homeworkId', '==', homeworkId)
      .get();
    
    // Batch işlemi başlat
    const batch = firestore.batch();
    
    // Ödev durumlarını sil
    statusSnapshot.forEach(doc => {
      batch.delete(firestore.collection('homeworkStatus').doc(doc.id));
    });
    
    // Ödevi sil
    batch.delete(homeworkRef);
    
    await batch.commit();
    
    return res.status(200).json({
      message: 'Ödev başarıyla silindi',
      homeworkId
    });
  } catch (error) {
    console.error('Ödev silme hatası:', error);
    return res.status(500).json({
      error: 'Ödev silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ödev durumunu günceller (öğrenci tarafından)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.submitHomework = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { attachments, content } = req.body;
    const studentId = req.user.uid;
    
    // Ödev dokümanını kontrol et
    const homeworkDoc = await firestore.collection('homework').doc(homeworkId).get();
    if (!homeworkDoc.exists) {
      return res.status(404).json({ error: 'Ödev bulunamadı' });
    }
    
    const homeworkData = homeworkDoc.data();
    
    // Ödevin aktif olup olmadığını kontrol et
    if (!homeworkData.isActive) {
      return res.status(400).json({ error: 'Bu ödev artık aktif değil' });
    }
    
    // Ödev durumunu getir
    const statusSnapshot = await firestore.collection('homeworkStatus')
      .where('homeworkId', '==', homeworkId)
      .where('studentId', '==', studentId)
      .get();
    
    if (statusSnapshot.empty) {
      return res.status(404).json({ error: 'Ödev durumu bulunamadı' });
    }
    
    const statusDoc = statusSnapshot.docs[0];
    const statusData = statusDoc.data();
    
    // Ödevin zaten notlandırılmış olup olmadığını kontrol et
    if (statusData.status === 'graded') {
      return res.status(400).json({ error: 'Bu ödev zaten notlandırılmış' });
    }
    
    // Ödev durumunu güncelle
    await firestore.collection('homeworkStatus').doc(statusDoc.id).update({
      status: 'submitted',
      submissionDate: new Date().toISOString(),
      attachments: attachments || [],
      content: content || '',
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Ödev başarıyla teslim edildi',
      homeworkId,
      statusId: statusDoc.id
    });
  } catch (error) {
    console.error('Ödev teslim hatası:', error);
    return res.status(500).json({
      error: 'Ödev teslim edilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Ödev notlandırır (öğretmen tarafından)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.gradeHomework = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { grade, feedback } = req.body;
    
    if (grade === undefined) {
      return res.status(400).json({ error: 'Not değeri gereklidir' });
    }
    
    // Ödev durumunu kontrol et
    const statusRef = firestore.collection('homeworkStatus').doc(statusId);
    const statusDoc = await statusRef.get();
    
    if (!statusDoc.exists) {
      return res.status(404).json({ error: 'Ödev durumu bulunamadı' });
    }
    
    const statusData = statusDoc.data();
    
    // Ödev dokümanını kontrol et
    const homeworkDoc = await firestore.collection('homework').doc(statusData.homeworkId).get();
    if (!homeworkDoc.exists) {
      return res.status(404).json({ error: 'Ödev bulunamadı' });
    }
    
    const homeworkData = homeworkDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== homeworkData.teacherId) {
      return res.status(403).json({ error: 'Bu ödevi notlandırma yetkiniz yok' });
    }
    
    // Ödevin teslim edilmiş olup olmadığını kontrol et
    if (statusData.status !== 'submitted') {
      return res.status(400).json({ error: 'Bu ödev henüz teslim edilmemiş' });
    }
    
    // Not değerini kontrol et
    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > homeworkData.maxPoints) {
      return res.status(400).json({ 
        error: `Not değeri 0 ile ${homeworkData.maxPoints} arasında olmalıdır` 
      });
    }
    
    // Ödev durumunu güncelle
    await statusRef.update({
      status: 'graded',
      grade: gradeValue,
      feedback: feedback || '',
      gradedBy: req.user.uid,
      gradedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Ödev başarıyla notlandırıldı',
      statusId,
      grade: gradeValue
    });
  } catch (error) {
    console.error('Ödev notlandırma hatası:', error);
    return res.status(500).json({
      error: 'Ödev notlandırılırken bir hata oluştu',
      details: error.message
    });
  }
};
