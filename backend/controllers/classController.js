/**
 * Sınıf Yönetimi Controller'ı
 * 
 * Bu dosya, sınıf yönetimi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateClassData } = require('../utils/validators');

/**
 * Yeni sınıf oluşturur
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.createClass = async (req, res) => {
  try {
    const { name, grade, section, classTeacherId, schoolId, academicYear } = req.body;
    
    // Sınıf verilerini doğrula
    const validationResult = validateClassData({ name, grade, schoolId });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Sınıf verilerini hazırla
    const classData = {
      name,
      grade: parseInt(grade),
      section: section || '',
      classTeacherId: classTeacherId || '',
      schoolId,
      academicYear: academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      settings: {
        maxStudents: req.body.maxStudents || 30,
        classroom: req.body.classroom || '',
      }
    };
    
    // Firestore'a sınıf verilerini kaydet
    const classRef = await firestore.collection('classes').add(classData);
    const classId = classRef.id;
    
    // Öğretmen varsa, öğretmenin sınıf listesini güncelle
    if (classTeacherId) {
      const teacherRef = firestore.collection('users').doc(classTeacherId);
      const teacherDoc = await teacherRef.get();
      
      if (teacherDoc.exists) {
        const teacherData = teacherDoc.data();
        const classIds = teacherData.teacherInfo?.classIds || [];
        
        if (!classIds.includes(classId)) {
          await teacherRef.update({
            'teacherInfo.classIds': [...classIds, classId]
          });
        }
      }
    }
    
    return res.status(201).json({
      message: 'Sınıf başarıyla oluşturuldu',
      classId,
      name
    });
  } catch (error) {
    console.error('Sınıf oluşturma hatası:', error);
    return res.status(500).json({
      error: 'Sınıf oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıf bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Sınıf verilerini getir
    const classDoc = await firestore.collection('classes').doc(classId).get();
    
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    const classData = classDoc.data();
    
    // Sınıf öğretmeni bilgilerini getir
    let teacherData = null;
    if (classData.classTeacherId) {
      const teacherDoc = await firestore.collection('users').doc(classData.classTeacherId).get();
      if (teacherDoc.exists) {
        teacherData = {
          id: teacherDoc.id,
          displayName: teacherDoc.data().displayName,
          email: teacherDoc.data().email,
          branch: teacherDoc.data().teacherInfo?.branch || ''
        };
      }
    }
    
    // Sınıf öğrencilerini getir
    const studentsSnapshot = await firestore.collection('users')
      .where('role', '==', 'student')
      .where('studentInfo.classId', '==', classId)
      .get();
    
    const students = [];
    studentsSnapshot.forEach(doc => {
      students.push({
        id: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email,
        studentId: doc.data().studentInfo?.studentId || ''
      });
    });
    
    return res.status(200).json({
      id: classId,
      ...classData,
      teacher: teacherData,
      students,
      studentCount: students.length
    });
  } catch (error) {
    console.error('Sınıf getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Tüm sınıfları getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getAllClasses = async (req, res) => {
  try {
    const { schoolId, grade, academicYear, limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('classes');
    
    // Okula göre filtreleme
    if (schoolId) {
      query = query.where('schoolId', '==', schoolId);
    }
    
    // Sınıf seviyesine göre filtreleme
    if (grade) {
      query = query.where('grade', '==', parseInt(grade));
    }
    
    // Akademik yıla göre filtreleme
    if (academicYear) {
      query = query.where('academicYear', '==', academicYear);
    }
    
    // Aktif sınıfları getir
    query = query.where('isActive', '==', true);
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const classes = [];
    
    snapshot.forEach(doc => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      classes,
      count: classes.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Sınıfları getirme hatası:', error);
    return res.status(500).json({
      error: 'Sınıflar getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıf bilgilerini günceller
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, grade, section, classTeacherId, ...otherData } = req.body;
    
    // Sınıf dokümanını kontrol et
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();
    
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    const oldClassData = classDoc.data();
    const oldTeacherId = oldClassData.classTeacherId;
    
    // Sınıf verilerini güncelle
    const classData = {
      ...otherData,
      updatedAt: new Date().toISOString()
    };
    
    if (name) classData.name = name;
    if (grade) classData.grade = parseInt(grade);
    if (section) classData.section = section;
    if (classTeacherId) classData.classTeacherId = classTeacherId;
    
    await classRef.update(classData);
    
    // Öğretmen değiştiyse, eski ve yeni öğretmenin sınıf listesini güncelle
    if (classTeacherId && classTeacherId !== oldTeacherId) {
      // Eski öğretmenin sınıf listesinden çıkar
      if (oldTeacherId) {
        const oldTeacherRef = firestore.collection('users').doc(oldTeacherId);
        const oldTeacherDoc = await oldTeacherRef.get();
        
        if (oldTeacherDoc.exists) {
          const oldTeacherData = oldTeacherDoc.data();
          const oldClassIds = oldTeacherData.teacherInfo?.classIds || [];
          
          await oldTeacherRef.update({
            'teacherInfo.classIds': oldClassIds.filter(id => id !== classId)
          });
        }
      }
      
      // Yeni öğretmenin sınıf listesine ekle
      const newTeacherRef = firestore.collection('users').doc(classTeacherId);
      const newTeacherDoc = await newTeacherRef.get();
      
      if (newTeacherDoc.exists) {
        const newTeacherData = newTeacherDoc.data();
        const newClassIds = newTeacherData.teacherInfo?.classIds || [];
        
        if (!newClassIds.includes(classId)) {
          await newTeacherRef.update({
            'teacherInfo.classIds': [...newClassIds, classId]
          });
        }
      }
    }
    
    return res.status(200).json({
      message: 'Sınıf başarıyla güncellendi',
      classId
    });
  } catch (error) {
    console.error('Sınıf güncelleme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf güncellenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıfı siler (soft delete)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Sınıf dokümanını kontrol et
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();
    
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    const classData = classDoc.data();
    const teacherId = classData.classTeacherId;
    
    // Sınıfı pasif yap (soft delete)
    await classRef.update({
      isActive: false,
      updatedAt: new Date().toISOString()
    });
    
    // Öğretmenin sınıf listesinden çıkar
    if (teacherId) {
      const teacherRef = firestore.collection('users').doc(teacherId);
      const teacherDoc = await teacherRef.get();
      
      if (teacherDoc.exists) {
        const teacherData = teacherDoc.data();
        const classIds = teacherData.teacherInfo?.classIds || [];
        
        await teacherRef.update({
          'teacherInfo.classIds': classIds.filter(id => id !== classId)
        });
      }
    }
    
    // Öğrencilerin sınıf bilgisini güncelle
    const studentsSnapshot = await firestore.collection('users')
      .where('role', '==', 'student')
      .where('studentInfo.classId', '==', classId)
      .get();
    
    const batch = firestore.batch();
    
    studentsSnapshot.forEach(doc => {
      const studentRef = firestore.collection('users').doc(doc.id);
      batch.update(studentRef, {
        'studentInfo.classId': '',
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    
    return res.status(200).json({
      message: 'Sınıf başarıyla silindi',
      classId
    });
  } catch (error) {
    console.error('Sınıf silme hatası:', error);
    return res.status(500).json({
      error: 'Sınıf silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıfa öğrenci ekler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.addStudentToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Öğrenci ID gereklidir' });
    }
    
    // Sınıf dokümanını kontrol et
    const classRef = firestore.collection('classes').doc(classId);
    const classDoc = await classRef.get();
    
    if (!classDoc.exists) {
      return res.status(404).json({ error: 'Sınıf bulunamadı' });
    }
    
    // Öğrenci dokümanını kontrol et
    const studentRef = firestore.collection('users').doc(studentId);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    const studentData = studentDoc.data();
    
    if (studentData.role !== 'student') {
      return res.status(400).json({ error: 'Kullanıcı bir öğrenci değil' });
    }
    
    // Öğrencinin sınıf bilgisini güncelle
    await studentRef.update({
      'studentInfo.classId': classId,
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Öğrenci sınıfa başarıyla eklendi',
      classId,
      studentId
    });
  } catch (error) {
    console.error('Öğrenci ekleme hatası:', error);
    return res.status(500).json({
      error: 'Öğrenci sınıfa eklenirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Sınıftan öğrenci çıkarır
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    
    // Öğrenci dokümanını kontrol et
    const studentRef = firestore.collection('users').doc(studentId);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    
    const studentData = studentDoc.data();
    
    if (studentData.role !== 'student') {
      return res.status(400).json({ error: 'Kullanıcı bir öğrenci değil' });
    }
    
    if (studentData.studentInfo?.classId !== classId) {
      return res.status(400).json({ error: 'Öğrenci bu sınıfta değil' });
    }
    
    // Öğrencinin sınıf bilgisini güncelle
    await studentRef.update({
      'studentInfo.classId': '',
      updatedAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      message: 'Öğrenci sınıftan başarıyla çıkarıldı',
      classId,
      studentId
    });
  } catch (error) {
    console.error('Öğrenci çıkarma hatası:', error);
    return res.status(500).json({
      error: 'Öğrenci sınıftan çıkarılırken bir hata oluştu',
      details: error.message
    });
  }
};
