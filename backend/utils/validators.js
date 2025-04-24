/**
 * Veri Doğrulama Yardımcı Fonksiyonları
 * 
 * Bu dosya, API'ye gelen verilerin doğrulanması için gerekli fonksiyonları içerir.
 */

/**
 * E-posta adresini doğrular
 * @param {string} email - Doğrulanacak e-posta adresi
 * @returns {boolean} - E-posta geçerli mi?
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Şifre karmaşıklığını doğrular
 * @param {string} password - Doğrulanacak şifre
 * @returns {boolean} - Şifre geçerli mi?
 */
const isValidPassword = (password) => {
  // En az 6 karakter, en az bir harf ve bir rakam içermeli
  return password && password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};

/**
 * Kullanıcı verilerini doğrular
 * @param {Object} userData - Doğrulanacak kullanıcı verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateUserData = (userData) => {
  const { email, password, role } = userData;
  
  if (!email) {
    return { isValid: false, error: 'E-posta adresi gereklidir' };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Geçerli bir e-posta adresi giriniz' };
  }
  
  if (password && !isValidPassword(password)) {
    return { isValid: false, error: 'Şifre en az 6 karakter uzunluğunda olmalı ve en az bir harf ve bir rakam içermelidir' };
  }
  
  if (!role) {
    return { isValid: false, error: 'Kullanıcı rolü gereklidir' };
  }
  
  const validRoles = ['student', 'teacher', 'parent', 'admin'];
  if (!validRoles.includes(role)) {
    return { isValid: false, error: 'Geçersiz kullanıcı rolü. Geçerli roller: student, teacher, parent, admin' };
  }
  
  return { isValid: true };
};

/**
 * Sınıf verilerini doğrular
 * @param {Object} classData - Doğrulanacak sınıf verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateClassData = (classData) => {
  const { name, grade, schoolId } = classData;
  
  if (!name) {
    return { isValid: false, error: 'Sınıf adı gereklidir' };
  }
  
  if (!grade) {
    return { isValid: false, error: 'Sınıf seviyesi gereklidir' };
  }
  
  if (isNaN(parseInt(grade))) {
    return { isValid: false, error: 'Sınıf seviyesi sayısal bir değer olmalıdır' };
  }
  
  if (!schoolId) {
    return { isValid: false, error: 'Okul ID gereklidir' };
  }
  
  return { isValid: true };
};

/**
 * Ders verilerini doğrular
 * @param {Object} subjectData - Doğrulanacak ders verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateSubjectData = (subjectData) => {
  const { name, code, schoolId } = subjectData;
  
  if (!name) {
    return { isValid: false, error: 'Ders adı gereklidir' };
  }
  
  if (code && code.length < 2) {
    return { isValid: false, error: 'Ders kodu en az 2 karakter olmalıdır' };
  }
  
  if (!schoolId) {
    return { isValid: false, error: 'Okul ID gereklidir' };
  }
  
  return { isValid: true };
};

/**
 * Not verilerini doğrular
 * @param {Object} gradeData - Doğrulanacak not verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateGradeData = (gradeData) => {
  const { studentId, subjectId, examType, score } = gradeData;
  
  if (!studentId) {
    return { isValid: false, error: 'Öğrenci ID gereklidir' };
  }
  
  if (!subjectId) {
    return { isValid: false, error: 'Ders ID gereklidir' };
  }
  
  if (!examType) {
    return { isValid: false, error: 'Sınav türü gereklidir' };
  }
  
  if (score === undefined || score === null) {
    return { isValid: false, error: 'Not değeri gereklidir' };
  }
  
  const scoreValue = parseFloat(score);
  if (isNaN(scoreValue)) {
    return { isValid: false, error: 'Not değeri sayısal olmalıdır' };
  }
  
  if (scoreValue < 0 || scoreValue > 100) {
    return { isValid: false, error: 'Not değeri 0-100 arasında olmalıdır' };
  }
  
  return { isValid: true };
};

/**
 * Duyuru verilerini doğrular
 * @param {Object} announcementData - Doğrulanacak duyuru verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateAnnouncementData = (announcementData) => {
  const { title, content, targetGroups } = announcementData;
  
  if (!title) {
    return { isValid: false, error: 'Duyuru başlığı gereklidir' };
  }
  
  if (!content) {
    return { isValid: false, error: 'Duyuru içeriği gereklidir' };
  }
  
  if (targetGroups && !Array.isArray(targetGroups)) {
    return { isValid: false, error: 'Hedef gruplar bir dizi olmalıdır' };
  }
  
  return { isValid: true };
};

/**
 * Mesaj verilerini doğrular
 * @param {Object} messageData - Doğrulanacak mesaj verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateMessageData = (messageData) => {
  const { receiverId, subject, content } = messageData;
  
  if (!receiverId) {
    return { isValid: false, error: 'Alıcı ID gereklidir' };
  }
  
  if (!subject) {
    return { isValid: false, error: 'Mesaj konusu gereklidir' };
  }
  
  if (!content) {
    return { isValid: false, error: 'Mesaj içeriği gereklidir' };
  }
  
  return { isValid: true };
};

/**
 * Okul verilerini doğrular
 * @param {Object} schoolData - Doğrulanacak okul verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateSchoolData = (schoolData) => {
  const { name, address, city, phone } = schoolData;
  
  if (!name) {
    return { isValid: false, error: 'Okul adı gereklidir' };
  }
  
  if (!address) {
    return { isValid: false, error: 'Okul adresi gereklidir' };
  }
  
  if (!city) {
    return { isValid: false, error: 'Şehir bilgisi gereklidir' };
  }
  
  if (!phone) {
    return { isValid: false, error: 'Telefon numarası gereklidir' };
  }
  
  return { isValid: true };
};

/**
 * Devamsızlık verilerini doğrular
 * @param {Object} attendanceData - Doğrulanacak devamsızlık verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateAttendanceData = (attendanceData) => {
  const { studentId, date, status } = attendanceData;
  
  if (!studentId) {
    return { isValid: false, error: 'Öğrenci ID gereklidir' };
  }
  
  if (!date) {
    return { isValid: false, error: 'Tarih gereklidir' };
  }
  
  if (!status) {
    return { isValid: false, error: 'Devamsızlık durumu gereklidir' };
  }
  
  const validStatuses = ['present', 'absent', 'excused', 'late'];
  if (!validStatuses.includes(status)) {
    return { isValid: false, error: 'Geçersiz devamsızlık durumu. Geçerli durumlar: present, absent, excused, late' };
  }
  
  return { isValid: true };
};

/**
 * Ödev verilerini doğrular
 * @param {Object} homeworkData - Doğrulanacak ödev verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateHomeworkData = (homeworkData) => {
  const { title, description, subjectId, classId, dueDate } = homeworkData;
  
  if (!title) {
    return { isValid: false, error: 'Ödev başlığı gereklidir' };
  }
  
  if (!description) {
    return { isValid: false, error: 'Ödev açıklaması gereklidir' };
  }
  
  if (!subjectId) {
    return { isValid: false, error: 'Ders ID gereklidir' };
  }
  
  if (!classId) {
    return { isValid: false, error: 'Sınıf ID gereklidir' };
  }
  
  if (!dueDate) {
    return { isValid: false, error: 'Son teslim tarihi gereklidir' };
  }
  
  return { isValid: true };
};

/**
 * Sınav verilerini doğrular
 * @param {Object} examData - Doğrulanacak sınav verileri
 * @returns {Object} - Doğrulama sonucu
 */
exports.validateExamData = (examData) => {
  const { title, subjectId, examDate, classId } = examData;
  
  if (!title) {
    return { isValid: false, error: 'Sınav başlığı gereklidir' };
  }
  
  if (!subjectId) {
    return { isValid: false, error: 'Ders ID gereklidir' };
  }
  
  if (!examDate) {
    return { isValid: false, error: 'Sınav tarihi gereklidir' };
  }
  
  if (!classId) {
    return { isValid: false, error: 'Sınıf ID gereklidir' };
  }
  
  return { isValid: true };
};
