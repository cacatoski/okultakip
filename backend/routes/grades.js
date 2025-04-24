/**
 * Not Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Not oluşturma - Sadece admin ve öğretmen erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), gradeController.createGrade);

// Not bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:gradeId', authMiddleware, gradeController.getGrade);

// Öğrencinin tüm notlarını getirme - Kimlik doğrulama gerekli
router.get('/students/:studentId', authMiddleware, gradeController.getStudentGrades);

// Sınıfın tüm notlarını getirme - Sadece admin ve öğretmen erişebilir
router.get('/classes/:classId', authMiddleware, roleMiddleware(['admin', 'teacher']), gradeController.getClassGrades);

// Not bilgilerini güncelleme - Sadece admin ve öğretmen erişebilir
router.put('/:gradeId', authMiddleware, roleMiddleware(['admin', 'teacher']), gradeController.updateGrade);

// Not silme - Sadece admin ve öğretmen erişebilir
router.delete('/:gradeId', authMiddleware, roleMiddleware(['admin', 'teacher']), gradeController.deleteGrade);

// Toplu not girişi - Sadece admin ve öğretmen erişebilir
router.post('/bulk', authMiddleware, roleMiddleware(['admin', 'teacher']), gradeController.bulkCreateGrades);

module.exports = router;
