/**
 * Devamsızlık Takibi Route'ları
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware, roleMiddleware, isParentOrTeacherOrAdminMiddleware } = require('../middlewares/auth');

// Devamsızlık kaydı oluşturma - Sadece admin ve öğretmen erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), attendanceController.createAttendance);

// Devamsızlık bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:attendanceId', authMiddleware, attendanceController.getAttendance);

// Öğrencinin tüm devamsızlık kayıtlarını getirme - Öğrenci, veli, öğretmen veya admin erişebilir
router.get('/students/:studentId', authMiddleware, isParentOrTeacherOrAdminMiddleware, attendanceController.getStudentAttendance);

// Sınıfın tüm devamsızlık kayıtlarını getirme - Sadece admin ve öğretmen erişebilir
router.get('/classes/:classId', authMiddleware, roleMiddleware(['admin', 'teacher']), attendanceController.getClassAttendance);

// Devamsızlık bilgilerini güncelleme - Sadece admin ve öğretmen erişebilir
router.put('/:attendanceId', authMiddleware, roleMiddleware(['admin', 'teacher']), attendanceController.updateAttendance);

// Devamsızlık kaydını silme - Sadece admin erişebilir
router.delete('/:attendanceId', authMiddleware, roleMiddleware(['admin']), attendanceController.deleteAttendance);

// Toplu devamsızlık girişi - Sadece admin ve öğretmen erişebilir
router.post('/bulk', authMiddleware, roleMiddleware(['admin', 'teacher']), attendanceController.bulkCreateAttendance);

module.exports = router;
