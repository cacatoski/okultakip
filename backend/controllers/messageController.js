/**
 * Mesajlaşma Sistemi Controller'ı
 * 
 * Bu dosya, mesajlaşma sistemi ile ilgili tüm işlemleri (CRUD) içerir.
 */

const { firestore } = require('../firebase-admin');
const { validateMessageData } = require('../utils/validators');

/**
 * Yeni mesaj gönderir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, subject, content } = req.body;
    const senderId = req.user.uid;
    
    // Mesaj verilerini doğrula
    const validationResult = validateMessageData({ receiverId, subject, content });
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }
    
    // Alıcı kullanıcıyı kontrol et
    const receiverDoc = await firestore.collection('users').doc(receiverId).get();
    if (!receiverDoc.exists) {
      return res.status(404).json({ error: 'Alıcı kullanıcı bulunamadı' });
    }
    
    // Gönderen kullanıcıyı kontrol et
    const senderDoc = await firestore.collection('users').doc(senderId).get();
    if (!senderDoc.exists) {
      return res.status(404).json({ error: 'Gönderen kullanıcı bulunamadı' });
    }
    
    // Mesaj verilerini hazırla
    const messageData = {
      senderId,
      receiverId,
      subject,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDeleted: {
        sender: false,
        receiver: false
      },
      attachments: req.body.attachments || [],
      parentMessageId: req.body.parentMessageId || null,
      metadata: {
        senderName: senderDoc.data().displayName,
        senderRole: senderDoc.data().role,
        receiverName: receiverDoc.data().displayName,
        receiverRole: receiverDoc.data().role
      }
    };
    
    // Firestore'a mesaj verilerini kaydet
    const messageRef = await firestore.collection('messages').add(messageData);
    const messageId = messageRef.id;
    
    return res.status(201).json({
      message: 'Mesaj başarıyla gönderildi',
      messageId,
      subject
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    return res.status(500).json({
      error: 'Mesaj gönderilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Mesaj bilgilerini getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.uid;
    
    // Mesaj verilerini getir
    const messageDoc = await firestore.collection('messages').doc(messageId).get();
    
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }
    
    const messageData = messageDoc.data();
    
    // Kullanıcının mesajı görüntüleme yetkisi var mı kontrol et
    if (messageData.senderId !== userId && messageData.receiverId !== userId) {
      return res.status(403).json({ error: 'Bu mesajı görüntüleme yetkiniz yok' });
    }
    
    // Kullanıcı mesajı silmiş mi kontrol et
    if ((messageData.senderId === userId && messageData.isDeleted.sender) || 
        (messageData.receiverId === userId && messageData.isDeleted.receiver)) {
      return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }
    
    // Alıcı ise mesajı okundu olarak işaretle
    if (messageData.receiverId === userId && !messageData.isRead) {
      await firestore.collection('messages').doc(messageId).update({
        isRead: true
      });
      messageData.isRead = true;
    }
    
    // Yanıt mesajlarını getir
    let replies = [];
    if (!messageData.parentMessageId) {
      const repliesSnapshot = await firestore.collection('messages')
        .where('parentMessageId', '==', messageId)
        .orderBy('createdAt', 'asc')
        .get();
      
      repliesSnapshot.forEach(doc => {
        // Kullanıcının sildiği yanıtları filtrele
        const replyData = doc.data();
        if ((replyData.senderId === userId && !replyData.isDeleted.sender) || 
            (replyData.receiverId === userId && !replyData.isDeleted.receiver)) {
          replies.push({
            id: doc.id,
            ...replyData
          });
        }
      });
    }
    
    // Üst mesajı getir
    let parentMessage = null;
    if (messageData.parentMessageId) {
      const parentDoc = await firestore.collection('messages').doc(messageData.parentMessageId).get();
      if (parentDoc.exists) {
        const parentData = parentDoc.data();
        // Kullanıcının sildiği üst mesajı filtrele
        if ((parentData.senderId === userId && !parentData.isDeleted.sender) || 
            (parentData.receiverId === userId && !parentData.isDeleted.receiver)) {
          parentMessage = {
            id: parentDoc.id,
            ...parentData
          };
        }
      }
    }
    
    return res.status(200).json({
      id: messageId,
      ...messageData,
      replies,
      parentMessage
    });
  } catch (error) {
    console.error('Mesaj getirme hatası:', error);
    return res.status(500).json({
      error: 'Mesaj bilgileri getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcının gelen kutusunu getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { isRead, limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('messages')
      .where('receiverId', '==', userId)
      .where('isDeleted.receiver', '==', false)
      .where('parentMessageId', '==', null); // Sadece ana mesajları getir
    
    // Okunma durumuna göre filtreleme
    if (isRead !== undefined) {
      query = query.where('isRead', '==', isRead === 'true');
    }
    
    // Oluşturma tarihine göre sırala (en yeniden en eskiye)
    query = query.orderBy('createdAt', 'desc');
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const messages = [];
    
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Okunmamış mesaj sayısını getir
    const unreadQuery = firestore.collection('messages')
      .where('receiverId', '==', userId)
      .where('isDeleted.receiver', '==', false)
      .where('isRead', '==', false);
    
    const unreadSnapshot = await unreadQuery.get();
    
    return res.status(200).json({
      messages,
      count: messages.length,
      total: snapshot.size,
      unreadCount: unreadSnapshot.size
    });
  } catch (error) {
    console.error('Gelen kutusu getirme hatası:', error);
    return res.status(500).json({
      error: 'Gelen kutusu getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Kullanıcının giden kutusunu getirir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.getSentMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 50, offset = 0 } = req.query;
    
    let query = firestore.collection('messages')
      .where('senderId', '==', userId)
      .where('isDeleted.sender', '==', false)
      .where('parentMessageId', '==', null); // Sadece ana mesajları getir
    
    // Oluşturma tarihine göre sırala (en yeniden en eskiye)
    query = query.orderBy('createdAt', 'desc');
    
    // Limit ve sayfalama
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const snapshot = await query.get();
    const messages = [];
    
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({
      messages,
      count: messages.length,
      total: snapshot.size
    });
  } catch (error) {
    console.error('Giden kutusu getirme hatası:', error);
    return res.status(500).json({
      error: 'Giden kutusu getirilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Mesajı siler (soft delete)
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.uid;
    
    // Mesaj dokümanını kontrol et
    const messageRef = firestore.collection('messages').doc(messageId);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }
    
    const messageData = messageDoc.data();
    
    // Kullanıcının mesajı silme yetkisi var mı kontrol et
    if (messageData.senderId !== userId && messageData.receiverId !== userId) {
      return res.status(403).json({ error: 'Bu mesajı silme yetkiniz yok' });
    }
    
    // Mesajı sil (soft delete)
    const updateData = {};
    
    if (messageData.senderId === userId) {
      updateData['isDeleted.sender'] = true;
    }
    
    if (messageData.receiverId === userId) {
      updateData['isDeleted.receiver'] = true;
    }
    
    await messageRef.update(updateData);
    
    return res.status(200).json({
      message: 'Mesaj başarıyla silindi',
      messageId
    });
  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    return res.status(500).json({
      error: 'Mesaj silinirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Toplu mesaj gönderir
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.sendBulkMessage = async (req, res) => {
  try {
    const { receiverIds, subject, content } = req.body;
    const senderId = req.user.uid;
    
    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ error: 'Geçerli alıcı listesi gereklidir' });
    }
    
    if (!subject || !content) {
      return res.status(400).json({ error: 'Konu ve içerik gereklidir' });
    }
    
    // Gönderen kullanıcıyı kontrol et
    const senderDoc = await firestore.collection('users').doc(senderId).get();
    if (!senderDoc.exists) {
      return res.status(404).json({ error: 'Gönderen kullanıcı bulunamadı' });
    }
    
    const senderData = {
      name: senderDoc.data().displayName,
      role: senderDoc.data().role
    };
    
    // Alıcı kullanıcıları kontrol et
    const validReceiverIds = [];
    const invalidReceiverIds = [];
    const receiverData = {};
    
    for (const receiverId of receiverIds) {
      const receiverDoc = await firestore.collection('users').doc(receiverId).get();
      if (receiverDoc.exists) {
        validReceiverIds.push(receiverId);
        receiverData[receiverId] = {
          name: receiverDoc.data().displayName,
          role: receiverDoc.data().role
        };
      } else {
        invalidReceiverIds.push(receiverId);
      }
    }
    
    if (validReceiverIds.length === 0) {
      return res.status(400).json({ error: 'Geçerli alıcı bulunamadı' });
    }
    
    // Mesajları gönder
    const batch = firestore.batch();
    const sentMessages = [];
    
    for (const receiverId of validReceiverIds) {
      // Mesaj verilerini hazırla
      const messageData = {
        senderId,
        receiverId,
        subject,
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDeleted: {
          sender: false,
          receiver: false
        },
        attachments: req.body.attachments || [],
        parentMessageId: null,
        metadata: {
          senderName: senderData.name,
          senderRole: senderData.role,
          receiverName: receiverData[receiverId].name,
          receiverRole: receiverData[receiverId].role,
          isBulkMessage: true
        }
      };
      
      // Yeni mesaj dokümanı oluştur
      const messageRef = firestore.collection('messages').doc();
      batch.set(messageRef, messageData);
      
      sentMessages.push({
        id: messageRef.id,
        receiverId,
        receiverName: receiverData[receiverId].name
      });
    }
    
    await batch.commit();
    
    return res.status(201).json({
      message: 'Mesajlar başarıyla gönderildi',
      sentMessages,
      totalSent: sentMessages.length,
      invalidReceiverIds,
      totalInvalid: invalidReceiverIds.length
    });
  } catch (error) {
    console.error('Toplu mesaj gönderme hatası:', error);
    return res.status(500).json({
      error: 'Mesajlar gönderilirken bir hata oluştu',
      details: error.message
    });
  }
};

/**
 * Mesajları okundu olarak işaretler
 * @param {Object} req - Express request nesnesi
 * @param {Object} res - Express response nesnesi
 */
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.uid;
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'Geçerli mesaj listesi gereklidir' });
    }
    
    const batch = firestore.batch();
    const updatedMessageIds = [];
    const errorMessageIds = [];
    
    for (const messageId of messageIds) {
      const messageRef = firestore.collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists) {
        errorMessageIds.push({ messageId, error: 'Mesaj bulunamadı' });
        continue;
      }
      
      const messageData = messageDoc.data();
      
      // Kullanıcının alıcı olup olmadığını kontrol et
      if (messageData.receiverId !== userId) {
        errorMessageIds.push({ messageId, error: 'Bu mesajı işaretleme yetkiniz yok' });
        continue;
      }
      
      // Mesaj zaten okundu mu kontrol et
      if (messageData.isRead) {
        continue;
      }
      
      // Mesajı okundu olarak işaretle
      batch.update(messageRef, { isRead: true });
      updatedMessageIds.push(messageId);
    }
    
    await batch.commit();
    
    return res.status(200).json({
      message: 'Mesajlar başarıyla okundu olarak işaretlendi',
      updatedMessageIds,
      totalUpdated: updatedMessageIds.length,
      errors: errorMessageIds,
      totalErrors: errorMessageIds.length
    });
  } catch (error) {
    console.error('Mesaj işaretleme hatası:', error);
    return res.status(500).json({
      error: 'Mesajlar işaretlenirken bir hata oluştu',
      details: error.message
    });
  }
};
