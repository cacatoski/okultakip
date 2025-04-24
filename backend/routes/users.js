/**
 * Kullanıcı Yönetimi Route'ları
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

// Kullanıcı oluşturma - Sadece admin erişebilir
router.post('/', authMiddleware, roleMiddleware(['admin']), userController.createUser);

// Kullanıcı bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:userId', authMiddleware, userController.getUser);

// Tüm kullanıcıları getirme - Sadece admin erişebilir
router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);

// Kullanıcı bilgilerini güncelleme - Kimlik doğrulama gerekli
router.put('/:userId', authMiddleware, userController.updateUser);

// Kullanıcı silme - Sadece admin erişebilir
router.delete('/:userId', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);

// Şifre sıfırlama
router.post('/reset-password', userController.resetPassword);

module.exports = router;
