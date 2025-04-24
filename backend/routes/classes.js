/**
 * Sınıf Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Sınıf oluşturma - Sadece admin ve öğretmen erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), classController.createClass);

// Sınıf bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:classId', authMiddleware, classController.getClass);

// Tüm sınıfları getirme - Kimlik doğrulama gerekli
router.get('/', authMiddleware, classController.getAllClasses);

// Sınıf bilgilerini güncelleme - Sadece admin ve öğretmen erişebilir
router.put('/:classId', authMiddleware, roleMiddleware(['admin', 'teacher']), classController.updateClass);

// Sınıf silme - Sadece admin erişebilir
router.delete('/:classId', authMiddleware, roleMiddleware(['admin']), classController.deleteClass);

// Sınıfa öğrenci ekleme - Sadece admin ve öğretmen erişebilir
router.post('/:classId/students', authMiddleware, roleMiddleware(['admin', 'teacher']), classController.addStudentToClass);

// Sınıftan öğrenci çıkarma - Sadece admin ve öğretmen erişebilir
router.delete('/:classId/students/:studentId', authMiddleware, roleMiddleware(['admin', 'teacher']), classController.removeStudentFromClass);

module.exports = router;
