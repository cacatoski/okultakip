/**
 * Devamsızlık Takibi Controller'ı
 * 
 * Bu dosya, devamsızlık takibi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateAttendanceData } = require('../utils/validators');

/**
 * Yeni devamsızlık kaydı oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createAttendance = async (req, res) => {
  try {
    const { studentId, date, status, classId, subjectId } = req.body;
    
    // Devamsızlık verilerini doğrula
    const validationResult = validateAttendanceData({ studentId, date, status });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Öğrenci dokümanını kontrol et
    const studentDoc = await firestore.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    // Devamsızlık verilerini hazırla
    const attendanceData = {
      studentId,
      date,
      status,
      classId: classId || studentDoc.data().studentInfo?.classId || '',
      subjectId: subjectId || '',
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reason: req.body.reason || '',
      isExcused: status === 'excused',
      metadata: {
        notes: req.body.notes || '',
        reportedBy: req.body.reportedBy || req.user.displayName,
        excuseDocument: req.body.excuseDocument || ''
      }
    };
    
    // Aynı gün için kayıt var mı kontrol et
    const existingAttendanceQuery = await firestore.collection('attendance')
      .where('studentId', '==', studentId)
      .where('date', '==', date)
      .get();
    
    if (!existingAttendanceQuery.empty) {
      // Varsa güncelle
      const existingAttendanceDoc = existingAttendanceQuery.docs[0];
      await firestore.collection('attendance').doc(existingAttendanceDoc.id).update({
        status,
        updatedAt: new Date().toISOString(),
        reason: req.body.reason || '',
        isExcused: status === 'excused',
        metadata: attendanceData.metadata
      });
      
      return res.status(200).json({
        message: 'Devamsızlık kaydı başarıyla güncellendi',
        attendanceId: existingAttendanceDoc.id
      });
    }
    
    // Firestore'a devamsızlık verilerini kaydet
    const attendanceRef = await firestore.collection('attendance').add(attendanceData);
    const attendanceId = attendanceRef.id;
    
    return res.status(201).json({
      message: 'Devamsızlık kaydı başarıyla oluşturuldu',
      attendanceId,
      status
    });
  } catch (error) {
    console.error('Devamsızlık oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Devamsızlık kaydı oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Devamsızlık bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    
    // Devamsızlık verilerini getir
    const attendanceDoc = await firestore.collection('attendance').doc(attendanceId).get();
    
    if (!attendanceDoc.exists) {
      return res.status(404).json({ error: 'Devamsızlık kaydı bulunamadı' });
    }
    
    const attendanceData = attendanceDoc.data();
    
    // Öğrenci bilgilerini getir
    const studentDoc = await firestore.collection('users').doc(attendanceData.studentId).get();
    let studentData = null;
    
    if (studentDoc.exists) {
      studentData = {
        id: studentDoc.id,
        displayName: studentDoc.data().displayName,
        email: studentDoc.data().email,
        studentId: studentDoc.data().studentInfo?.studentId || ''
      };
    }
    
    // Sınıf bilgilerini getir
    let classData = null;
    if (attendanceData.classId) {
      const classDoc = await firestore.collection('classes').doc(attendanceData.classId).get();
      if (classDoc.exists) {
        classData = {
          id: classDoc.id,
          name: classDoc.data().name,
          grade: classDoc.data().grade
        };
      }
    }
    
    // Ders bilgilerini getir
    let subjectData = null;
    if (attendanceData.subjectId) {
      const subjectDoc = await firestore.collection('subjects').doc(attendanceData.subjectId).get();
      if (subjectDoc.exists) {
        subjectData = {
          id: subjectDoc.id,
          name: subjectDoc.data().name,
          code: subjectDoc.data().code
        };
      }
    }
    
    return res.status(200).json({
      id: attendanceId,
      ...attendanceData,
      student: studentData,
      class: classData,
      subject: subjectData
    });
  } catch (error) {
    console.error('Devamsızlık getirme hatası:', error);
    return res.status(500).json({
      error: 'Devamsızlık bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Öğrencinin tüm devamsızlık kayıtlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, status } = req.query;
    
    // Öğrenci dokümanını kontrol et
    const studentDoc = await firestore.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    let query = firestore.collection('attendance').where('studentId', '==', studentId);
    
    // Tarih aralığına göre filtreleme
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    
    // Duruma göre filtreleme
    if (status) {
      query = query.where('status', '==', status);
    }
    
    // Tarihe göre sırala
    query = query.orderBy('date', 'desc');
    
    const snapshot = await query.get();
    const attendanceRecords = [];
    
    snapshot.forEach(doc => {
      attendanceRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // İstatistikleri hesapla
    const totalDays = attendanceRecords.length;
    const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
    const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
    const excusedDays = attendanceRecords.filter(record => record.status === 'excused').length;
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    
    return res.status(200).json({
      studentId,
      studentName: studentDoc.data().displayName,
      attendanceRecords,
      stats: {
        totalDays,
        absentDays,
        lateDays,
        excusedDays,
        presentDays,
        attendanceRate: totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(2) : 100
      }
    });
  } catch (error) {
    console.error('Öğrenci devamsızlık getirme hatası:', error);
    return res.status(500).json({
      error: 'Öğrenci devamsızlık bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıfın tüm devamsızlık kayıtlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, subjectId } = req.query;
    
    // Sınıf dokümanını kontrol et
    const classDoc = await firestore.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    // Sınıftaki öğrencileri getir
    const studentsSnapshot = await firestore.collection('users')
      .where('role', '==', 'student')
      .where('studentInfo.classId', '==', classId)
      .get();
    
    const studentIds = studentsSnapshot.docs.map(doc => doc.id);
    const studentData = {};
    
    studentsSnapshot.forEach(doc => {
      studentData[doc.id] = {
        id: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email,
        studentId: doc.data().studentInfo?.studentId || ''
      };
    });
    
    // Belirli bir tarih için devamsızlık kayıtlarını getir
    let attendanceRecords = [];
    
    if (date) {
      // Belirli bir tarih için tüm öğrencilerin devamsızlık kayıtlarını getir
      const attendanceSnapshot = await firestore.collection('attendance')
        .where('classId', '==', classId)
        .where('date', '==', date)
        .get();
      
      attendanceSnapshot.forEach(doc => {
        attendanceRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Kayıt olmayan öğrenciler için varsayılan 'present' durumu oluştur
      const recordedStudentIds = attendanceRecords.map(record => record.studentId);
      
      studentIds.forEach(studentId => {
        if (!recordedStudentIds.includes(studentId)) {
          attendanceRecords.push({
            id: null,
            studentId,
            date,
            status: 'present',
            classId,
            subjectId: subjectId || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isExcused: false,
            reason: '',
            metadata: {}
          });
        }
      });
    } else {
      // Tarih belirtilmemişse son 30 günlük devamsızlık kayıtlarını getir
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const attendanceSnapshot = await firestore.collection('attendance')
        .where('classId', '==', classId)
        .where('date', '>=', thirtyDaysAgoStr)
        .get();
      
      attendanceSnapshot.forEach(doc => {
        attendanceRecords.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    
    // Öğrencilere göre grupla
    const groupedAttendance = {};
    
    attendanceRecords.forEach(record => {
      const studentId = record.studentId;
      
      if (!groupedAttendance[studentId]) {
        groupedAttendance[studentId] = {
          student: studentData[studentId],
          records: []
        };
      }
      
      groupedAttendance[studentId].records.push({
        id: record.id,
        date: record.date,
        status: record.status,
        reason: record.reason,
        isExcused: record.isExcused,
        subjectId: record.subjectId
      });
    });
    
    // İstatistikleri hesapla
    const stats = {
      totalStudents: studentIds.length,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0
    };
    
    if (date) {
      attendanceRecords.forEach(record => {
        if (record.status === 'present') stats.presentCount++;
        else if (record.status === 'absent') stats.absentCount++;
        else if (record.status === 'late') stats.lateCount++;
        else if (record.status === 'excused') stats.excusedCount++;
      });
    }
    
    return res.status(200).json({
      classId,
      className: classDoc.data().name,
      date: date || null,
      students: Object.values(groupedAttendance),
      stats
    });
  } catch (error) {
    console.error('Sınıf devamsızlık getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf devamsızlık bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Devamsızlık bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, reason } = req.body;
    
    // Devamsızlık dokümanını kontrol et
    const attendanceRef = firestore.collection('attendance').doc(attendanceId);
    const attendanceDoc = await attendanceRef.get();
    
    if (!attendanceDoc.exists) {
      return res.status(404).json({ error: 'Devamsızlık kaydı bulunamadı' });
    }
    
    // Devamsızlık verilerini güncelle
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (status) {
      updateData.status = status;
      updateData.isExcused = status === 'excused';
    }
    
    if (reason !== undefined) {
      updateData.reason = reason;
    }
    
    // Metadata güncelle
    if (req.body.metadata) {
      const oldMetadata = attendanceDoc.data().metadata || {};
      updateData.metadata = {
        ...oldMetadata,
        ...req.body.metadata
      };
    }
    
    await attendanceRef.update(updateData);
    
    return res.status(200).json({
      message: 'Devamsızlık kaydı başarıyla güncellendi',
      attendanceId
    });
  } catch (error) {
    console.error('Devamsızlık güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Devamsızlık kaydı güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Devamsızlık kaydını siler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    
    // Devamsızlık dokümanını kontrol et
    const attendanceRef = firestore.collection('attendance').doc(attendanceId);
    const attendanceDoc = await attendanceRef.get();
    
    if (!attendanceDoc.exists) {
      return res.status(404).json({ error: 'Devamsızlık kaydı bulunamadı' });
    }
    
    // Devamsızlık kaydını sil
    await attendanceRef.delete();
    
    return res.status(200).json({
      message: 'Devamsızlık kaydı başarıyla silindi',
      attendanceId
    });
  } catch (error) {
    console.error('Devamsızlık silme hatası:', error);
    return res.status(500).json({
      error: 'Devamsızlık kaydı silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Toplu devamsızlık girişi yapar
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.bulkCreateAttendance = async (req, res) => {
  try {
    const { attendanceRecords, date, classId, subjectId } = req.body;
    
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ error: 'Geçerli devamsızlık listesi gereklidir' });
    }
    
    if (!date) {
      return res.status(400).json({ error: 'Tarih gereklidir' });
    }
    
    if (!classId) {
      return res.status(400).json({ error: 'Sınıf ID gereklidir' });
    }
    
    // Sınıf dokümanını kontrol et
    const classDoc = await firestore.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    const batch = firestore.batch();
    const createdRecords = [];
    const updatedRecords = [];
    const errors = [];
    
    for (const record of attendanceRecords) {
      const { studentId, status } = record;
      
      if (!studentId || !status) {
        errors.push({ studentId, error: 'Öğrenci ID ve durum gereklidir' });
        continue;
      }
      
      // Öğrenci dokümanını kontrol et
      const studentDoc = await firestore.collection('users').doc(studentId).get();
      if (!studentDoc.exists) {
        errors.push({ studentId, error: 'Öğrenci bulunamadı' });
        continue;
      }
      
      // Aynı gün için kayıt var mı kontrol et
      const existingAttendanceQuery = await firestore.collection('attendance')
        .where('studentId', '==', studentId)
        .where('date', '==', date)
        .get();
      
      if (!existingAttendanceQuery.empty) {
        // Varsa güncelle
        const existingAttendanceDoc = existingAttendanceQuery.docs[0];
        const attendanceRef = firestore.collection('attendance').doc(existingAttendanceDoc.id);
        
        batch.update(attendanceRef, {
          status,
          updatedAt: new Date().toISOString(),
          reason: record.reason || '',
          isExcused: status === 'excused',
          metadata: {
            notes: record.notes || '',
            reportedBy: record.reportedBy || req.user.displayName,
            excuseDocument: record.excuseDocument || ''
          }
        });
        
        updatedRecords.push({
          id: existingAttendanceDoc.id,
          studentId,
          status
        });
      } else {
        // Yoksa yeni kayıt oluştur
        const attendanceData = {
          studentId,
          date,
          status,
          classId,
          subjectId: subjectId || '',
          createdBy: req.user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reason: record.reason || '',
          isExcused: status === 'excused',
          metadata: {
            notes: record.notes || '',
            reportedBy: record.reportedBy || req.user.displayName,
            excuseDocument: record.excuseDocument || ''
          }
        };
        
        const attendanceRef = firestore.collection('attendance').doc();
        batch.set(attendanceRef, attendanceData);
        
        createdRecords.push({
          id: attendanceRef.id,
          studentId,
          status
        });
      }
    }
    
    await batch.commit();
    
    return res.status(201).json({
      message: 'Devamsızlık kayıtları başarıyla oluşturuldu',
      createdRecords,
      updatedRecords,
      totalCreated: createdRecords.length,
      totalUpdated: updatedRecords.length,
      errors,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Toplu devamsızlık oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Devamsızlık kayıtları oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};
