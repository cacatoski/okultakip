/**
 * Mesajlaşma Sistemi Route'ları
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth');

// Mesaj gönderme - Kimlik doğrulama gerekli
router.post('/', authMiddleware, messageController.sendMessage);

// Mesaj bilgilerini getirme - Kimlik doğrulama gerekli
router.get('/:messageId', authMiddleware, messageController.getMessage);

// Gelen kutusu - Kimlik doğrulama gerekli
router.get('/inbox/me', authMiddleware, messageController.getInbox);

// Giden kutusu - Kimlik doğrulama gerekli
router.get('/sent/me', authMiddleware, messageController.getSentMessages);

// Mesaj silme - Kimlik doğrulama gerekli
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

// Toplu mesaj gönderme - Kimlik doğrulama gerekli
router.post('/bulk', authMiddleware, messageController.sendBulkMessage);

// Mesajları okundu olarak işaretleme - Kimlik doğrulama gerekli
router.post('/mark-as-read', authMiddleware, messageController.markAsRead);

module.exports = router;
