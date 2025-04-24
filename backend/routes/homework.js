/**
 * Ödev Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { authMiddleware, roleMiddleware, isParentOrTeacherOrAdminMiddleware } = require('../middlewares/auth');

// Ödev oluşturma - Sadece admin ve öğretmen erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), homeworkController.createHomework);

// Ödev bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:homeworkId', authMiddleware, homeworkController.getHomework);

// Sınıfın tüm ödevlerini getirme - Kimlik doğrulama gerekli
router.get('/classes/:classId', authMiddleware, homeworkController.getClassHomework);

// Öğrencinin tüm ödevlerini getirme - Öğrenci, veli, öğretmen veya admin erişebilir
router.get('/students/:studentId', authMiddleware, isParentOrTeacherOrAdminMiddleware, homeworkController.getStudentHomework);

// Ödev bilgilerini güncelleme - Sadece admin ve öğretmen erişebilir
router.put('/:homeworkId', authMiddleware, roleMiddleware(['admin', 'teacher']), homeworkController.updateHomework);

// Ödev silme - Sadece admin ve öğretmen erişebilir
router.delete('/:homeworkId', authMiddleware, roleMiddleware(['admin', 'teacher']), homeworkController.deleteHomework);

// Ödev teslim etme - Sadece öğrenci erişebilir
router.post('/:homeworkId/submit', authMiddleware, roleMiddleware(['student']), homeworkController.submitHomework);

// Ödev notlandırma - Sadece admin ve öğretmen erişebilir
router.post('/status/:statusId/grade', authMiddleware, roleMiddleware(['admin', 'teacher']), homeworkController.gradeHomework);

module.exports = router;
