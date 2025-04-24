/**
 * Sınav Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware, roleMiddleware, isParentOrTeacherOrAdminMiddleware } = require('../middlewares/auth');

// Sınav oluşturma - Sadece admin ve öğretmen erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), examController.createExam);

// Sınav bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:examId', authMiddleware, examController.getExam);

// Sınıfın tüm sınavlarını getirme - Kimlik doğrulama gerekli
router.get('/classes/:classId', authMiddleware, examController.getClassExams);

// Öğrencinin tüm sınavlarını getirme - Öğrenci, veli, öğretmen veya admin erişebilir
router.get('/students/:studentId', authMiddleware, isParentOrTeacherOrAdminMiddleware, examController.getStudentExams);

// Sınav bilgilerini güncelleme - Sadece admin ve öğretmen erişebilir
router.put('/:examId', authMiddleware, roleMiddleware(['admin', 'teacher']), examController.updateExam);

// Sınav silme - Sadece admin ve öğretmen erişebilir
router.delete('/:examId', authMiddleware, roleMiddleware(['admin', 'teacher']), examController.deleteExam);

// Sınav sonucu ekleme - Sadece admin ve öğretmen erişebilir
router.post('/:examId/results', authMiddleware, roleMiddleware(['admin', 'teacher']), examController.addExamResult);

// Toplu sınav sonucu ekleme - Sadece admin ve öğretmen erişebilir
router.post('/:examId/results/bulk', authMiddleware, roleMiddleware(['admin', 'teacher']), examController.bulkAddExamResults);

module.exports = router;
