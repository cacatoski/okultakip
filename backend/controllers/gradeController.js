/**
 * Not Yönetimi Controller'ı
 * 
 * Bu dosya, not yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateGradeData } = require('../utils/validators');

/**
 * Yeni not kaydı oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createGrade = async (req, res) => {
  try {
    const { studentId, subjectId, examType, score, term, academicYear, teacherId } = req.body;
    
    // Not verilerini doğrula
    const validationResult = validateGradeData({ studentId, subjectId, examType, score });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Öğrenci dokümanını kontrol et
    const studentDoc = await firestore.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    // Ders dokümanını kontrol et
    const subjectDoc = await firestore.collection('subjects').doc(subjectId).get();
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    // Not verilerini hazırla
    const gradeData = {
      studentId,
      subjectId,
      examType,
      score: parseFloat(score),
      term: term || '1',
      academicYear: academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      teacherId: teacherId || req.user.uid, // Giriş yapan öğretmenin ID'si
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: req.body.comments || '',
      metadata: {
        maxScore: req.body.maxScore || 100,
        weight: req.body.weight || 1,
        examDate: req.body.examDate || new Date().toISOString().split('T')[0]
      }
    };
    
    // Firestore'a not verilerini kaydet
    const gradeRef = await firestore.collection('grades').add(gradeData);
    const gradeId = gradeRef.id;
    
    return res.status(201).json({
      message: 'Not başarıyla kaydedildi',
      gradeId,
      score: gradeData.score
    });
  } catch (error) {
    console.error('Not oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Not kaydedilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Not bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    // Not verilerini getir
    const gradeDoc = await firestore.collection('grades').doc(gradeId).get();
    
    if (!gradeDoc.exists) {
      return res.status(404).json({ error: 'Not bulunamadı' });
    }
    
    const gradeData = gradeDoc.data();
    
    // Öğrenci bilgilerini getir
    const studentDoc = await firestore.collection('users').doc(gradeData.studentId).get();
    let studentData = null;
    
    if (studentDoc.exists) {
      studentData = {
        id: studentDoc.id,
        displayName: studentDoc.data().displayName,
        email: studentDoc.data().email,
        studentId: studentDoc.data().studentInfo?.studentId || ''
      };
    }
    
    // Ders bilgilerini getir
    const subjectDoc = await firestore.collection('subjects').doc(gradeData.subjectId).get();
    let subjectData = null;
    
    if (subjectDoc.exists) {
      subjectData = {
        id: subjectDoc.id,
        name: subjectDoc.data().name,
        code: subjectDoc.data().code
      };
    }
    
    // Öğretmen bilgilerini getir
    let teacherData = null;
    if (gradeData.teacherId) {
      const teacherDoc = await firestore.collection('users').doc(gradeData.teacherId).get();
      if (teacherDoc.exists) {
        teacherData = {
          id: teacherDoc.id,
          displayName: teacherDoc.data().displayName,
          email: teacherDoc.data().email
        };
      }
    }
    
    return res.status(200).json({
      id: gradeId,
      ...gradeData,
      student: studentData,
      subject: subjectData,
      teacher: teacherData
    });
  } catch (error) {
    console.error('Not getirme hatası:', error);
    return res.status(500).json({
      error: 'Not bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Öğrencinin tüm notlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId, term, academicYear } = req.query;
    
    // Öğrenci dokümanını kontrol et
    const studentDoc = await firestore.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    let query = firestore.collection('grades').where('studentId', '==', studentId);
    
    // Derse göre filtreleme
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    
    // Döneme göre filtreleme
    if (term) {
      query = query.where('term', '==', term);
    }
    
    // Akademik yıla göre filtreleme
    if (academicYear) {
      query = query.where('academicYear', '==', academicYear);
    }
    
    const snapshot = await query.get();
    const grades = [];
    
    // Not verilerini topla
    for (const doc of snapshot.docs) {
      const gradeData = doc.data();
      
      // Ders bilgilerini getir
      const subjectDoc = await firestore.collection('subjects').doc(gradeData.subjectId).get();
      let subjectData = null;
      
      if (subjectDoc.exists) {
        subjectData = {
          id: subjectDoc.id,
          name: subjectDoc.data().name,
          code: subjectDoc.data().code
        };
      }
      
      grades.push({
        id: doc.id,
        ...gradeData,
        subject: subjectData
      });
    }
    
    // Derslere göre notları grupla
    const groupedGrades = {};
    grades.forEach(grade => {
      const subjectId = grade.subjectId;
      if (!groupedGrades[subjectId]) {
        groupedGrades[subjectId] = {
          subject: grade.subject,
          grades: []
        };
      }
      
      groupedGrades[subjectId].grades.push({
        id: grade.id,
        examType: grade.examType,
        score: grade.score,
        term: grade.term,
        academicYear: grade.academicYear,
        createdAt: grade.createdAt,
        comments: grade.comments,
        metadata: grade.metadata
      });
    });
    
    // Ortalama hesapla
    Object.keys(groupedGrades).forEach(subjectId => {
      const subjectGrades = groupedGrades[subjectId].grades;
      let totalScore = 0;
      let totalWeight = 0;
      
      subjectGrades.forEach(grade => {
        const weight = grade.metadata?.weight || 1;
        totalScore += grade.score * weight;
        totalWeight += weight;
      });
      
      groupedGrades[subjectId].average = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;
    });
    
    return res.status(200).json({
      studentId,
      studentName: studentDoc.data().displayName,
      subjects: Object.values(groupedGrades),
      totalSubjects: Object.keys(groupedGrades).length,
      totalGrades: grades.length
    });
  } catch (error) {
    console.error('Öğrenci notları getirme hatası:', error);
    return res.status(500).json({
      error: 'Öğrenci notları getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıfın tüm notlarını getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getClassGrades = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId, term, academicYear } = req.query;
    
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
    
    if (studentIds.length === 0) {
      return res.status(200).json({
        classId,
        className: classDoc.data().name,
        students: [],
        totalStudents: 0
      });
    }
    
    // Not verilerini getir
    let query = firestore.collection('grades').where('studentId', 'in', studentIds);
    
    // Derse göre filtreleme
    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }
    
    // Döneme göre filtreleme
    if (term) {
      query = query.where('term', '==', term);
    }
    
    // Akademik yıla göre filtreleme
    if (academicYear) {
      query = query.where('academicYear', '==', academicYear);
    }
    
    const gradesSnapshot = await query.get();
    
    // Öğrenci notlarını grupla
    const studentGrades = {};
    
    for (const student of studentsSnapshot.docs) {
      studentGrades[student.id] = {
        id: student.id,
        displayName: student.data().displayName,
        studentId: student.data().studentInfo?.studentId || '',
        subjects: {}
      };
    }
    
    // Ders bilgilerini getir
    const subjectIds = [...new Set(gradesSnapshot.docs.map(doc => doc.data().subjectId))];
    const subjectDocs = await Promise.all(
      subjectIds.map(id => firestore.collection('subjects').doc(id).get())
    );
    
    const subjects = {};
    subjectDocs.forEach(doc => {
      if (doc.exists) {
        subjects[doc.id] = {
          id: doc.id,
          name: doc.data().name,
          code: doc.data().code
        };
      }
    });
    
    // Not verilerini öğrencilere dağıt
    gradesSnapshot.forEach(doc => {
      const gradeData = doc.data();
      const studentId = gradeData.studentId;
      const subjectId = gradeData.subjectId;
      
      if (studentGrades[studentId] && subjects[subjectId]) {
        if (!studentGrades[studentId].subjects[subjectId]) {
          studentGrades[studentId].subjects[subjectId] = {
            subject: subjects[subjectId],
            grades: []
          };
        }
        
        studentGrades[studentId].subjects[subjectId].grades.push({
          id: doc.id,
          examType: gradeData.examType,
          score: gradeData.score,
          term: gradeData.term,
          academicYear: gradeData.academicYear,
          metadata: gradeData.metadata
        });
      }
    });
    
    // Ortalama hesapla
    Object.values(studentGrades).forEach(student => {
      Object.keys(student.subjects).forEach(subjectId => {
        const subjectGrades = student.subjects[subjectId].grades;
        let totalScore = 0;
        let totalWeight = 0;
        
        subjectGrades.forEach(grade => {
          const weight = grade.metadata?.weight || 1;
          totalScore += grade.score * weight;
          totalWeight += weight;
        });
        
        student.subjects[subjectId].average = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0;
      });
    });
    
    return res.status(200).json({
      classId,
      className: classDoc.data().name,
      students: Object.values(studentGrades),
      totalStudents: Object.keys(studentGrades).length,
      subjects: Object.values(subjects)
    });
  } catch (error) {
    console.error('Sınıf notları getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf notları getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Not bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { score, examType, comments, ...otherData } = req.body;
    
    // Not dokümanını kontrol et
    const gradeRef = firestore.collection('grades').doc(gradeId);
    const gradeDoc = await gradeRef.get();
    
    if (!gradeDoc.exists) {
      return res.status(404).json({ error: 'Not bulunamadı' });
    }
    
    // Not verilerini güncelle
    const gradeData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (score !== undefined) gradeData.score = parseFloat(score);
    if (examType) gradeData.examType = examType;
    if (comments !== undefined) gradeData.comments = comments;
    
    // Metadata güncelle
    if (req.body.metadata) {
      const oldMetadata = gradeDoc.data().metadata || {};
      gradeData.metadata = {
        ...oldMetadata,
        ...req.body.metadata
      };
    }
    
    await gradeRef.update(gradeData);
    
    return res.status(200).json({
      message: 'Not başarıyla güncellendi',
      gradeId
    });
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Not güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Notu siler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    
    // Not dokümanını kontrol et
    const gradeRef = firestore.collection('grades').doc(gradeId);
    const gradeDoc = await gradeRef.get();
    
    if (!gradeDoc.exists) {
      return res.status(404).json({ error: 'Not bulunamadı' });
    }
    
    // Notu sil
    await gradeRef.delete();
    
    return res.status(200).json({
      message: 'Not başarıyla silindi',
      gradeId
    });
  } catch (error) {
    console.error('Not silme hatası:', error);
    return res.status(500).json({
      error: 'Not silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Toplu not girişi yapar
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.bulkCreateGrades = async (req, res) => {
  try {
    const { grades, subjectId, examType, term, academicYear } = req.body;
    
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ error: 'Geçerli not listesi gereklidir' });
    }
    
    if (!subjectId) {
      return res.status(400).json({ error: 'Ders ID gereklidir' });
    }
    
    if (!examType) {
      return res.status(400).json({ error: 'Sınav türü gereklidir' });
    }
    
    // Ders dokümanını kontrol et
    const subjectDoc = await firestore.collection('subjects').doc(subjectId).get();
    if (!subjectDoc.exists) {
      return res.status(404).json({ error: 'Ders bulunamadı' });
    }
    
    const batch = firestore.batch();
    const createdGrades = [];
    const errors = [];
    
    for (const grade of grades) {
      const { studentId, score } = grade;
      
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
      
      // Not verilerini hazırla
      const gradeData = {
        studentId,
        subjectId,
        examType,
        score: parseFloat(score),
        term: term || '1',
        academicYear: academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        teacherId: req.user.uid, // Giriş yapan öğretmenin ID'si
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: grade.comments || '',
        metadata: {
          maxScore: grade.maxScore || 100,
          weight: grade.weight || 1,
          examDate: grade.examDate || new Date().toISOString().split('T')[0]
        }
      };
      
      // Yeni not dokümanı oluştur
      const gradeRef = firestore.collection('grades').doc();
      batch.set(gradeRef, gradeData);
      
      createdGrades.push({
        id: gradeRef.id,
        studentId,
        score: gradeData.score
      });
    }
    
    await batch.commit();
    
    return res.status(201).json({
      message: 'Notlar başarıyla kaydedildi',
      createdGrades,
      totalCreated: createdGrades.length,
      errors,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('Toplu not oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Notlar kaydedilirken bir hata oluştu',
      details: error.message
    });
  }
};
