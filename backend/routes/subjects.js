/**
 * Ders Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Ders oluşturma - Sadece admin erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin']), subjectController.createSubject);

// Ders bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:subjectId', authMiddleware, subjectController.getSubject);

// Tüm dersleri getirme - Kimlik doğrulama gerekli
router.get('/', authMiddleware, subjectController.getAllSubjects);

// Ders bilgilerini güncelleme - Sadece admin erişebilir
router.put('/:subjectId', authMiddleware, roleMiddleware(['admin']), subjectController.updateSubject);

// Ders silme - Sadece admin erişebilir
router.delete('/:subjectId', authMiddleware, roleMiddleware(['admin']), subjectController.deleteSubject);

// Derse öğretmen atama - Sadece admin erişebilir
router.post('/:subjectId/teachers', authMiddleware, roleMiddleware(['admin']), subjectController.assignTeacherToSubject);

// Dersten öğretmen çıkarma - Sadece admin erişebilir
router.delete('/:subjectId/teachers/:teacherId', authMiddleware, roleMiddleware(['admin']), subjectController.removeTeacherFromSubject);

module.exports = router;
