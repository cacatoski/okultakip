/**
 * Kimlik Doğrulama Middleware'leri
 * 
 * Bu dosya, API rotalarında kimlik doğrulama ve yetkilendirme için kullanılan middleware'leri içerir.
 */

const { auth, firestore } = require('../firebase-admin');

/**
 * Kimlik doğrulama middleware'i
 * 
 * İstek başlığında gelen JWT token'ını doğrular ve kullanıcı bilgilerini req.user'a ekler.
 */
exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Kimlik doğrulama başarısız. Geçerli bir token gerekli.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Token'ı doğrula
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ error: 'Geçersiz token. Lütfen tekrar giriş yapın.' });
    }
    
    // Kullanıcı bilgilerini getir
    const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    const userData = userDoc.data();
    
    // Kullanıcı aktif mi kontrol et
    if (userData.isActive === false) {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.' });
    }
    
    // Kullanıcı bilgilerini req nesnesine ekle
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role,
      displayName: userData.displayName
    };
    
    next();
  } catch (error) {
    console.error('Kimlik doğrulama hatası:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token süresi doldu. Lütfen tekrar giriş yapın.' });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token iptal edildi. Lütfen tekrar giriş yapın.' });
    }
    
    return res.status(500).json({ 
      error: 'Kimlik doğrulama sırasında bir hata oluştu.', 
      details: error.message 
    });
  }
};

/**
 * Rol kontrolü middleware'i
 * 
 * Kullanıcının belirtilen rollerden birine sahip olup olmadığını kontrol eder.
 * @param {Array} allowedRoles - İzin verilen roller dizisi
 */
exports.roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // authMiddleware'den gelen kullanıcı bilgilerini kullan
    const { role } = req.user;
    
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: 'Bu işlemi gerçekleştirmek için yetkiniz yok.', 
        requiredRoles: allowedRoles,
        yourRole: role
      });
    }
    
    next();
  };
};

/**
 * Kullanıcı kendisi mi kontrolü middleware'i
 * 
 * İsteği yapan kullanıcının, istek yapılan kullanıcı ile aynı olup olmadığını kontrol eder.
 * Kullanıcı kendisi veya admin ise işleme devam eder.
 */
exports.isSelfOrAdminMiddleware = (req, res, next) => {
  const { uid, role } = req.user;
  const { userId } = req.params;
  
  if (uid === userId || role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      error: 'Bu işlemi gerçekleştirmek için yetkiniz yok. Sadece kendi bilgilerinizi düzenleyebilirsiniz.' 
    });
  }
};

/**
 * Öğrenci velisi mi kontrolü middleware'i
 * 
 * İsteği yapan kullanıcının, istek yapılan öğrencinin velisi olup olmadığını kontrol eder.
 * Kullanıcı öğrencinin velisi, öğretmeni veya admin ise işleme devam eder.
 */
exports.isParentOrTeacherOrAdminMiddleware = async (req, res, next) => {
  try {
    const { uid, role } = req.user;
    const { studentId } = req.params;
    
    // Admin veya öğretmen ise direkt izin ver
    if (role === 'admin' || role === 'teacher') {
      return next();
    }
    
    // Veli ise öğrencinin velisi mi kontrol et
    if (role === 'parent') {
      const userDoc = await firestore.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      }
      
      const userData = userDoc.data();
      const studentIds = userData.parentInfo?.studentIds || [];
      
      if (studentIds.includes(studentId)) {
        return next();
      }
    }
    
    // Öğrencinin kendisi ise izin ver
    if (role === 'student' && uid === studentId) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Bu işlemi gerçekleştirmek için yetkiniz yok.' 
    });
  } catch (error) {
    console.error('Yetki kontrolü hatası:', error);
    return res.status(500).json({ 
      error: 'Yetki kontrolü sırasında bir hata oluştu.', 
      details: error.message 
    });
  }
};
