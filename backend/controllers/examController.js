/**
 * Sınav Yönetimi Controller'ı
 * 
 * Bu dosya, sınav yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateExamData } = require('../utils/validators');

/**
 * Yeni sınav oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createExam = async (req, res) => {
  try {
    const { title, subjectId, examDate, classId, duration, totalPoints } = req.body;
    
    // Sınav verilerini doğrula
    const validationResult = validateExamData({ title, subjectId, examDate, classId });
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
    
    // Sınav verilerini hazırla
    const examData = {
      title,
      subjectId,
      examDate,
      classId,
      teacherId: req.user.uid,
      duration: duration || 40, // Dakika cinsinden
      totalPoints: totalPoints || 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      isPublished: req.body.isPublished || false,
      examType: req.body.examType || 'written', // written, oral, project, etc.
      description: req.body.description || '',
      topics: req.body.topics || [],
      metadata: {
        location: req.body.location || '',
        notes: req.body.notes || '',
        weightInAverage: req.body.weightInAverage || 1
      }
    };
    
    // Firestore'a sınav verilerini kaydet
    const examRef = await firestore.collection('exams').add(examData);
    const examId = examRef.id;
    
    return res.status(201).json({
      message: 'Sınav başarıyla oluşturuldu',
      examId,
      title
    });
  } catch (error) {
    console.error('Sınav oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Sınav oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınav bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getExam = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Sınav verilerini getir
    const examDoc = await firestore.collection('exams').doc(examId).get();
    
    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Sınav bulunamadı' });
    }
    
    const examData = examDoc.data();
    
    // Sınıf bilgilerini getir
    const classDoc = await firestore.collection('classes').doc(examData.classId).get();
    let classData = null;
    
    if (classDoc.exists) {
      classData = {
        id: classDoc.id,
        name: classDoc.data().name,
        grade: classDoc.data().grade
      };
    }
    
    // Ders bilgilerini getir
    const subjectDoc = await firestore.collection('subjects').doc(examData.subjectId).get();
    let subjectData = null;
    
    if (subjectDoc.exists) {
      subjectData = {
        id: subjectDoc.id,
        name: subjectDoc.data().name,
        code: subjectDoc.data().code
      };
    }
    
    // Öğretmen bilgilerini getir
    const teacherDoc = await firestore.collection('users').doc(examData.teacherId).get();
    let teacherData = null;
    
    if (teacherDoc.exists) {
      teacherData = {
        id: teacherDoc.id,
        displayName: teacherDoc.data().displayName,
        email: teacherDoc.data().email
      };
    }
    
    // Sınav sonuçlarını getir (eğer varsa ve kullanıcı yetkili ise)
    let results = [];
    
    if (req.user.role === 'admin' || req.user.uid === examData.teacherId) {
      const resultsSnapshot = await firestore.collection('examResults')
        .where('examId', '==', examId)
        .get();
      
      resultsSnapshot.forEach(doc => {
        results.push({
          id: doc.id,
          studentId: doc.data().studentId,
          score: doc.data().score,
          status: doc.data().status
        });
      });
      
      // Öğrenci bilgilerini ekle
      for (const result of results) {
        const studentDoc = await firestore.collection('users').doc(result.studentId).get();
        if (studentDoc.exists) {
          result.student = {
            displayName: studentDoc.data().displayName,
            studentId: studentDoc.data().studentInfo?.studentId || ''
          };
        }
      }
    }
    
    return res.status(200).json({
      id: examId,
      ...examData,
      class: classData,
      subject: subjectData,
      teacher: teacherData,
      results: results.length > 0 ? results : undefined
    });
  } catch (error) {
    console.error('Sınav getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınav bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıfın tüm sınavlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getClassExams = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId, startDate, endDate, isPublished } = req.query;
    
    // Sınıf dokümanını kontrol et
    const classDoc = await firestore.collection('classes').doc(classId).get();
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    let query = firestore.collection('exams').where('classId', '==', classId);
    
    // Derse göre filtreleme
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    
    // Tarih aralığına göre filtreleme
    if (startDate) {
      query = query.where('examDate', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('examDate', '<=', endDate);
    }
    
    // Yayınlanma durumuna göre filtreleme
    if (isPublished !== undefined) {
      query = query.where('isPublished', '==', isPublished === 'true');
    }
    
    // Aktif sınavlara göre filtreleme
    query = query.where('isActive', '==', true);
    
    // Sınav tarihine göre sırala
    query = query.orderBy('examDate', 'asc');
    
    const snapshot = await query.get();
    const exams = [];
    
    // Sınav verilerini topla
    for (const doc of snapshot.docs) {
      const examData = doc.data();
      
      // Ders bilgilerini getir
      const subjectDoc = await firestore.collection('subjects').doc(examData.subjectId).get();
      let subjectData = null;
      
      if (subjectDoc.exists) {
        subjectData = {
          id: subjectDoc.id,
          name: subjectDoc.data().name,
          code: subjectDoc.data().code
        };
      }
      
      // Öğretmen bilgilerini getir
      const teacherDoc = await firestore.collection('users').doc(examData.teacherId).get();
      let teacherData = null;
      
      if (teacherDoc.exists) {
        teacherData = {
          id: teacherDoc.id,
          displayName: teacherDoc.data().displayName
        };
      }
      
      exams.push({
        id: doc.id,
        title: examData.title,
        examDate: examData.examDate,
        duration: examData.duration,
        examType: examData.examType,
        isPublished: examData.isPublished,
        subject: subjectData,
        teacher: teacherData
      });
    }
    
    return res.status(200).json({
      classId,
      className: classDoc.data().name,
      exams,
      count: exams.length
    });
  } catch (error) {
    console.error('Sınıf sınavları getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf sınavları getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Öğrencinin tüm sınavlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getStudentExams = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId, includeResults } = req.query;
    
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
    
    // Sınıfın sınavlarını getir
    let query = firestore.collection('exams')
      .where('classId', '==', classId)
      .where('isActive', '==', true)
      .where('isPublished', '==', true);
    
    // Derse göre filtreleme
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    
    // Sınav tarihine göre sırala
    query = query.orderBy('examDate', 'asc');
    
    const snapshot = await query.get();
    const exams = [];
    const examIds = [];
    
    // Sınav verilerini topla
    for (const doc of snapshot.docs) {
      const examData = doc.data();
      examIds.push(doc.id);
      
      // Ders bilgilerini getir
      const subjectDoc = await firestore.collection('subjects').doc(examData.subjectId).get();
      let subjectData = null;
      
      if (subjectDoc.exists) {
        subjectData = {
          id: subjectDoc.id,
          name: subjectDoc.data().name,
          code: subjectDoc.data().code
        };
      }
      
      exams.push({
        id: doc.id,
        title: examData.title,
        examDate: examData.examDate,
        duration: examData.duration,
        examType: examData.examType,
        totalPoints: examData.totalPoints,
        subject: subjectData
      });
    }
    
    // Sınav sonuçlarını getir (eğer istenirse)
    if (includeResults === 'true' && examIds.length > 0) {
      // Firestore'da in operatörü en fazla 10 değer alabilir, bu yüzden parçalara ayırıyoruz
      const chunks = [];
      for (let i = 0; i < examIds.length; i += 10) {
        chunks.push(examIds.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        const resultsSnapshot = await firestore.collection('examResults')
          .where('examId', 'in', chunk)
          .where('studentId', '==', studentId)
          .get();
        
        resultsSnapshot.forEach(doc => {
          const resultData = doc.data();
          const examIndex = exams.findIndex(exam => exam.id === resultData.examId);
          
          if (examIndex !== -1) {
            exams[examIndex].result = {
              id: doc.id,
              score: resultData.score,
              status: resultData.status,
              feedback: resultData.feedback,
              submittedAt: resultData.submittedAt
            };
          }
        });
      }
    }
    
    // Sınavları tarihe göre sırala (yaklaşan sınavlar önce)
    exams.sort((a, b) => {
      const dateA = new Date(a.examDate);
      const dateB = new Date(b.examDate);
      const now = new Date();
      
      // Geçmiş sınavlar
      const isPastA = dateA < now;
      const isPastB = dateB < now;
      
      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      
      // İki sınav da gelecekte veya geçmişte
      return dateA - dateB;
    });
    
    return res.status(200).json({
      studentId,
      studentName: studentData.displayName,
      exams,
      count: exams.length,
      upcomingCount: exams.filter(exam => new Date(exam.examDate) > new Date()).length
    });
  } catch (error) {
    console.error('Öğrenci sınavları getirme hatası:', error);
    return res.status(500).json({
      error: 'Öğrenci sınavları getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınav bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { title, examDate, duration, isPublished, isActive, ...otherData } = req.body;
    
    // Sınav dokümanını kontrol et
    const examRef = firestore.collection('exams').doc(examId);
    const examDoc = await examRef.get();
    
    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Sınav bulunamadı' });
    }
    
    const examData = examDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== examData.teacherId) {
      return res.status(403).json({ error: 'Bu sınavı güncelleme yetkiniz yok' });
    }
    
    // Sınav verilerini güncelle
    const updateData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (title) updateData.title = title;
    if (examDate) updateData.examDate = examDate;
    if (duration) updateData.duration = parseInt(duration);
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Metadata güncelle
    if (req.body.metadata) {
      const oldMetadata = examData.metadata || {};
      updateData.metadata = {
        ...oldMetadata,
        ...req.body.metadata
      };
    }
    
    await examRef.update(updateData);
    
    return res.status(200).json({
      message: 'Sınav başarıyla güncellendi',
      examId
    });
  } catch (error) {
    console.error('Sınav güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Sınav güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınavı siler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Sınav dokümanını kontrol et
    const examRef = firestore.collection('exams').doc(examId);
    const examDoc = await examRef.get();
    
    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Sınav bulunamadı' });
    }
    
    const examData = examDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== examData.teacherId) {
      return res.status(403).json({ error: 'Bu sınavı silme yetkiniz yok' });
    }
    
    // Sınav sonuçlarını getir
    const resultsSnapshot = await firestore.collection('examResults')
      .where('examId', '==', examId)
      .get();
    
    // Sonuçlar varsa sınavı silme, pasif yap
    if (!resultsSnapshot.empty) {
      await examRef.update({
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      
      return res.status(200).json({
        message: 'Sınav pasif hale getirildi (sonuçlar olduğu için silinemedi)',
        examId
      });
    }
    
    // Sonuç yoksa sınavı sil
    await examRef.delete();
    
    return res.status(200).json({
      message: 'Sınav başarıyla silindi',
      examId
    });
  } catch (error) {
    console.error('Sınav silme hatası:', error);
    return res.status(500).json({
      error: 'Sınav silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınav sonucu ekler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.addExamResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, score, status, feedback } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Öğrenci ID gereklidir' });
    }
    
    if (score === undefined) {
      return res.status(400).json({ error: 'Not değeri gereklidir' });
    }
    
    // Sınav dokümanını kontrol et
    const examDoc = await firestore.collection('exams').doc(examId).get();
    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Sınav bulunamadı' });
    }
    
    const examData = examDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== examData.teacherId) {
      return res.status(403).json({ error: 'Bu sınava sonuç ekleme yetkiniz yok' });
    }
    
    // Öğrenci dokümanını kontrol et
    const studentDoc = await firestore.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    const studentData = studentDoc.data();
    if (studentData.role !== 'student') {
      return res.status(400).json({ error: 'Kullanıcı bir öğrenci değil' });
    }
    
    // Öğrencinin sınıfını kontrol et
    if (studentData.studentInfo?.classId !== examData.classId) {
      return res.status(400).json({ error: 'Öğrenci bu sınavın yapıldığı sınıfta değil' });
    }
    
    // Not değerini kontrol et
    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > examData.totalPoints) {
      return res.status(400).json({ 
        error: `Not değeri 0 ile ${examData.totalPoints} arasında olmalıdır` 
      });
    }
    
    // Mevcut sonucu kontrol et
    const existingResultQuery = await firestore.collection('examResults')
      .where('examId', '==', examId)
      .where('studentId', '==', studentId)
      .get();
    
    if (!existingResultQuery.empty) {
      // Varsa güncelle
      const existingResultDoc = existingResultQuery.docs[0];
      await firestore.collection('examResults').doc(existingResultDoc.id).update({
        score: scoreValue,
        status: status || 'completed',
        feedback: feedback || '',
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.uid
      });
      
      return res.status(200).json({
        message: 'Sınav sonucu başarıyla güncellendi',
        resultId: existingResultDoc.id
      });
    }
    
    // Yoksa yeni sonuç oluştur
    const resultData = {
      examId,
      studentId,
      score: scoreValue,
      status: status || 'completed',
      feedback: feedback || '',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.uid
    };
    
    const resultRef = await firestore.collection('examResults').add(resultData);
    
    return res.status(201).json({
      message: 'Sınav sonucu başarıyla eklendi',
      resultId: resultRef.id
    });
  } catch (error) {
    console.error('Sınav sonucu ekleme hatası:', error);
    return res.status(500).json({
      error: 'Sınav sonucu eklenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Toplu sınav sonucu ekler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.bulkAddExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { results } = req.body;
    
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Geçerli sonuç listesi gereklidir' });
    }
    
    // Sınav dokümanını kontrol et
    const examDoc = await firestore.collection('exams').doc(examId).get();
    if (!examDoc.exists) {
      return res.status(404).json({ error: 'Sınav bulunamadı' });
    }
    
    const examData = examDoc.data();
    
    // Kullanıcının öğretmen veya admin olup olmadığını kontrol et
    if (req.user.role !== 'admin' && req.user.uid !== examData.teacherId) {
      return res.status(403).json({ error: 'Bu sınava sonuç ekleme yetkiniz yok' });
    }
    
    const batch = firestore.batch();
    const createdResults = [];
    const updatedResults = [];
    const errors = [];
    
    for (const result of results) {
      const { studentId, score } = result;
      
      if (!studentId || score === undefined) {
        errors.push({ studentId, error: 'Öğrenci ID ve not değeri gereklidir' });
        continue;
      }
      
      // Öğrenci dokümanını kontrol et
      const studentDoc = await firestore.collection('users').doc(studentId).get();
      if (!studentDoc.exists) {
        errors.push({ studentId, error: 'Öğrenci bulunamadı' });
        continue;
      }
      
      const studentData = studentDoc.data();
      if (studentData.role !== 'student') {
        errors.push({ studentId, error: 'Kullanıcı bir öğrenci değil' });
        continue;
      }
      
      // Öğrencinin sınıfını kontrol et
      if (studentData.studentInfo?.classId !== examData.classId) {
        errors.push({ studentId, error: 'Öğrenci bu sınavın yapıldığı sınıfta değil' });
        continue;
      }
      
      // Not değerini kontrol et
      const scoreValue = parseFloat(score);
      if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > examData.totalPoints) {
        errors.push({ 
          studentId, 
          error: `Not değeri 0 ile ${examData.totalPoints} arasında olmalıdır` 
        });
        continue;
      }
      
      // Mevcut sonucu kontrol et
      const existingResultQuery = await firestore.collection('examResults')
        .where('examId', '==', examId)
        .where('studentId', '==', studentId)
        .get();
      
      if (!existingResultQuery.empty) {
        // Varsa güncelle
        const existingResultDoc = existingResultQuery.docs[0];
        const resultRef = firestore.collection('examResults').doc(existingResultDoc.id);
        
        batch.update(resultRef, {
          score: scoreValue,
          status: result.status || 'completed',
          feedback: result.feedback || '',
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.uid
        });
        
        updatedResults.push({
          id: existingResultDoc.id,
          studentId,
          score: scoreValue
        });
      } else {
        // Yoksa yeni sonuç oluştur
        const resultData = {
          examId,
          studentId,
          score: scoreValue,
          status: result.status || 'completed',
          feedback: result.feedback || '',
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: req.user.uid
        };
        
        const resultRef = firestore.collection('examResults').doc();
        batch.set(resultRef, resultData);
        
        createdResults.push({
          id: resultRef.id,
          studentId,
          score: scoreValue
        });
      }
    }
    
    await batch.commit();
    
    return res.status(200).json({
      message: 'Sınav sonuçları başarıyla eklendi',
      createdResults,
      updatedResults,
      totalCreated: createdResults.length,
      totalUpdated: updatedResults.length,
      errors,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Toplu sınav sonucu ekleme hatası:', error);
    return res.status(500).json({
      error: 'Sınav sonuçları eklenirken bir hata oluştu',
      details: error.message
    });
  }
};
