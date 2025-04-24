/**
 * Okul Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Okul oluşturma - Sadece admin erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin']), schoolController.createSchool);

// Okul bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:schoolId', authMiddleware, schoolController.getSchool);

// Tüm okulları getirme - Kimlik doğrulama gerekli
router.get('/', authMiddleware, schoolController.getAllSchools);

// Okul bilgilerini güncelleme - Sadece admin erişebilir
router.put('/:schoolId', authMiddleware, roleMiddleware(['admin']), schoolController.updateSchool);

// Okul silme - Sadece admin erişebilir
router.delete('/:schoolId', authMiddleware, roleMiddleware(['admin']), schoolController.deleteSchool);

// Okula admin ekleme - Sadece admin erişebilir
router.post('/:schoolId/admins', authMiddleware, roleMiddleware(['admin']), schoolController.addAdminToSchool);

// Okuldan admin çıkarma - Sadece admin erişebilir
router.delete('/:schoolId/admins/:adminId', authMiddleware, roleMiddleware(['admin']), schoolController.removeAdminFromSchool);

module.exports = router;
