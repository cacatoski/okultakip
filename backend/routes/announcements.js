/**
 * Duyuru Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Duyuru oluşturma - Sadece admin ve öğretmen erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin', 'teacher']), announcementController.createAnnouncement);

// Duyuru bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:announcementId', authMiddleware, announcementController.getAnnouncement);

// Tüm duyuruları getirme - Kimlik doğrulama gerekli
router.get('/', authMiddleware, announcementController.getAllAnnouncements);

// Kullanıcıya özel duyuruları getirme - Kimlik doğrulama gerekli
router.get('/user/me', authMiddleware, announcementController.getUserAnnouncements);

// Duyuru bilgilerini güncelleme - Sadece admin ve öğretmen erişebilir
router.put('/:announcementId', authMiddleware, roleMiddleware(['admin', 'teacher']), announcementController.updateAnnouncement);

// Duyuru silme - Sadece admin ve öğretmen erişebilir
router.delete('/:announcementId', authMiddleware, roleMiddleware(['admin', 'teacher']), announcementController.deleteAnnouncement);

module.exports = router;
