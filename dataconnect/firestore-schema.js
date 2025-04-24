/**
 * Okul Takip Sistemi - Firestore Veritabanı Şeması
 * 
 * Bu dosya, Firestore veritabanı için koleksiyon ve doküman yapılarını tanımlar.
 * Her koleksiyon için örnek dokümanlar ve açıklamalar içerir.
 */

// Koleksiyon: users
// Tüm kullanıcı bilgilerini içerir (öğretmen, öğrenci, veli, yönetici)
const userSchema = {
  uid: "string", // Firebase Auth UID
  email: "string",
  displayName: "string",
  photoURL: "string",
  phoneNumber: "string",
  role: "string", // "student", "teacher", "parent", "admin"
  createdAt: "timestamp",
  updatedAt: "timestamp",
  lastLogin: "timestamp",
  isActive: "boolean",
  
  // Role-specific fields
  // Öğrenci için
  studentInfo: {
    studentId: "string", // Okul öğrenci numarası
    classId: "string", // Referans: classes koleksiyonu
    parentIds: ["string"], // Referans: users koleksiyonu (role: parent)
    dateOfBirth: "timestamp",
    address: "string",
    emergencyContact: "string",
  },
  
  // Öğretmen için
  teacherInfo: {
    teacherId: "string", // Öğretmen sicil numarası
    subjects: ["string"], // Referans: subjects koleksiyonu
    classIds: ["string"], // Referans: classes koleksiyonu (sınıf öğretmeni ise)
    branch: "string", // Branş (Matematik, Fizik, vb.)
    startDate: "timestamp", // İşe başlama tarihi
  },
  
  // Veli için
  parentInfo: {
    studentIds: ["string"], // Referans: users koleksiyonu (role: student)
    relation: "string", // "mother", "father", "guardian"
    occupation: "string",
  },
  
  // Yönetici için
  adminInfo: {
    adminType: "string", // "principal", "vice_principal", "it_admin", etc.
    permissions: ["string"], // İzinler listesi
  }
};

// Koleksiyon: schools
// Okul bilgilerini içerir
const schoolSchema = {
  schoolId: "string",
  name: "string",
  address: "string",
  phone: "string",
  email: "string",
  website: "string",
  logo: "string", // URL
  principalId: "string", // Referans: users koleksiyonu (role: admin, adminType: principal)
  createdAt: "timestamp",
  updatedAt: "timestamp",
  isActive: "boolean",
  
  // Okul ayarları
  settings: {
    academicYear: "string", // "2025-2026"
    terms: [
      {
        termId: "string",
        name: "string", // "1. Dönem", "2. Dönem"
        startDate: "timestamp",
        endDate: "timestamp",
      }
    ],
    gradingSystem: "string", // "100", "5", "letter"
    attendanceSystem: "string", // "daily", "hourly"
  }
};

// Koleksiyon: classes
// Sınıf bilgilerini içerir
const classSchema = {
  classId: "string",
  schoolId: "string", // Referans: schools koleksiyonu
  name: "string", // "9-A", "10-B"
  grade: "number", // 9, 10, 11, 12
  section: "string", // "A", "B", "C"
  classTeacherId: "string", // Referans: users koleksiyonu (role: teacher)
  academicYear: "string", // "2025-2026"
  createdAt: "timestamp",
  updatedAt: "timestamp",
  isActive: "boolean",
  
  // Sınıf ayarları
  settings: {
    maxStudents: "number",
    classroom: "string", // Fiziksel sınıf no
    schedule: "string", // Referans: schedules koleksiyonu
  }
};

// Koleksiyon: subjects
// Ders bilgilerini içerir
const subjectSchema = {
  subjectId: "string",
  schoolId: "string", // Referans: schools koleksiyonu
  name: "string", // "Matematik", "Fizik"
  code: "string", // "MAT101", "FIZ101"
  description: "string",
  grade: "number", // 9, 10, 11, 12
  createdAt: "timestamp",
  updatedAt: "timestamp",
  isActive: "boolean",
  
  // Ders ayarları
  settings: {
    weeklyHours: "number", // Haftalık ders saati
    isRequired: "boolean", // Zorunlu mu?
    passingGrade: "number", // Geçme notu
  }
};

// Koleksiyon: schedules
// Ders programlarını içerir
const scheduleSchema = {
  scheduleId: "string",
  classId: "string", // Referans: classes koleksiyonu
  academicYear: "string", // "2025-2026"
  termId: "string", // Referans: schools.settings.terms
  createdAt: "timestamp",
  updatedAt: "timestamp",
  isActive: "boolean",
  
  // Haftalık program
  weeklySchedule: {
    monday: [
      {
        period: "number", // 1, 2, 3, ...
        startTime: "string", // "08:30"
        endTime: "string", // "09:20"
        subjectId: "string", // Referans: subjects koleksiyonu
        teacherId: "string", // Referans: users koleksiyonu (role: teacher)
      }
    ],
    tuesday: [/* ... */],
    wednesday: [/* ... */],
    thursday: [/* ... */],
    friday: [/* ... */],
  }
};

// Koleksiyon: attendance
// Devamsızlık kayıtlarını içerir
const attendanceSchema = {
  attendanceId: "string",
  studentId: "string", // Referans: users koleksiyonu (role: student)
  classId: "string", // Referans: classes koleksiyonu
  date: "timestamp",
  createdAt: "timestamp",
  updatedAt: "timestamp",
  createdBy: "string", // Referans: users koleksiyonu (role: teacher/admin)
  
  // Devamsızlık bilgileri
  status: "string", // "present", "absent", "excused", "late"
  reason: "string", // Mazeret
  
  // Ders bazlı devamsızlık (saatlik yoklama sistemi için)
  periodAttendance: [
    {
      period: "number", // 1, 2, 3, ...
      subjectId: "string", // Referans: subjects koleksiyonu
      status: "string", // "present", "absent", "excused", "late"
    }
  ]
};

// Koleksiyon: grades
// Not kayıtlarını içerir
const gradeSchema = {
  gradeId: "string",
  studentId: "string", // Referans: users koleksiyonu (role: student)
  subjectId: "string", // Referans: subjects koleksiyonu
  classId: "string", // Referans: classes koleksiyonu
  academicYear: "string", // "2025-2026"
  termId: "string", // Referans: schools.settings.terms
  createdAt: "timestamp",
  updatedAt: "timestamp",
  createdBy: "string", // Referans: users koleksiyonu (role: teacher)
  
  // Not bilgileri
  examType: "string", // "midterm", "final", "quiz", "project", "homework"
  examDate: "timestamp",
  score: "number", // 0-100
  outOf: "number", // 100
  weight: "number", // 0.3, 0.4, 0.5 (ağırlık)
  comment: "string",
  
  // Kazanım bazlı değerlendirme
  learningOutcomes: [
    {
      outcomeId: "string",
      description: "string",
      score: "number", // 0-100
    }
  ]
};

// Koleksiyon: behaviors
// Davranış kayıtlarını içerir
const behaviorSchema = {
  behaviorId: "string",
  studentId: "string", // Referans: users koleksiyonu (role: student)
  classId: "string", // Referans: classes koleksiyonu
  date: "timestamp",
  createdAt: "timestamp",
  updatedAt: "timestamp",
  createdBy: "string", // Referans: users koleksiyonu (role: teacher/admin)
  
  // Davranış bilgileri
  type: "string", // "positive", "negative", "neutral"
  description: "string",
  actionTaken: "string", // Alınan önlem
  parentNotified: "boolean", // Veli bilgilendirildi mi?
  
  // İlgili kişiler
  relatedTeachers: ["string"], // Referans: users koleksiyonu (role: teacher)
  relatedStudents: ["string"], // Referans: users koleksiyonu (role: student)
};

// Koleksiyon: announcements
// Duyuruları içerir
const announcementSchema = {
  announcementId: "string",
  schoolId: "string", // Referans: schools koleksiyonu
  title: "string",
  content: "string",
  attachments: ["string"], // URL listesi
  createdAt: "timestamp",
  updatedAt: "timestamp",
  createdBy: "string", // Referans: users koleksiyonu
  publishDate: "timestamp",
  expiryDate: "timestamp",
  isActive: "boolean",
  
  // Hedef kitle
  targetAudience: {
    roles: ["string"], // "student", "teacher", "parent", "admin"
    classes: ["string"], // Referans: classes koleksiyonu
    grades: ["number"], // 9, 10, 11, 12
    specificUsers: ["string"], // Referans: users koleksiyonu
  }
};

// Koleksiyon: messages
// Mesajları içerir
const messageSchema = {
  messageId: "string",
  senderId: "string", // Referans: users koleksiyonu
  receiverId: "string", // Referans: users koleksiyonu
  subject: "string",
  content: "string",
  attachments: ["string"], // URL listesi
  createdAt: "timestamp",
  isRead: "boolean",
  readAt: "timestamp",
  
  // Mesaj ayarları
  priority: "string", // "high", "medium", "low"
  category: "string", // "academic", "behavioral", "administrative"
};

// Koleksiyon: exams
// Sınavları içerir
const examSchema = {
  examId: "string",
  schoolId: "string", // Referans: schools koleksiyonu
  title: "string",
  description: "string",
  subjectId: "string", // Referans: subjects koleksiyonu
  createdAt: "timestamp",
  updatedAt: "timestamp",
  createdBy: "string", // Referans: users koleksiyonu (role: teacher/admin)
  
  // Sınav bilgileri
  examType: "string", // "midterm", "final", "quiz", "mock"
  startDate: "timestamp",
  endDate: "timestamp",
  duration: "number", // Dakika cinsinden
  totalPoints: "number",
  passingScore: "number",
  
  // Sınav içeriği
  questions: [
    {
      questionId: "string",
      questionType: "string", // "multiple_choice", "true_false", "essay", "matching"
      questionText: "string",
      options: ["string"], // Çoktan seçmeli için
      correctAnswer: "string", // veya ["string"] çoklu doğru cevap için
      points: "number",
    }
  ],
  
  // Hedef sınıflar
  targetClasses: ["string"], // Referans: classes koleksiyonu
};

// Koleksiyon: homework
// Ödevleri içerir
const homeworkSchema = {
  homeworkId: "string",
  title: "string",
  description: "string",
  subjectId: "string", // Referans: subjects koleksiyonu
  classId: "string", // Referans: classes koleksiyonu
  teacherId: "string", // Referans: users koleksiyonu (role: teacher)
  createdAt: "timestamp",
  updatedAt: "timestamp",
  
  // Ödev bilgileri
  assignedDate: "timestamp",
  dueDate: "timestamp",
  attachments: ["string"], // URL listesi
  
  // Ödev durumu
  status: "string", // "active", "completed", "archived"
  
  // Öğrenci teslim durumları
  submissions: [
    {
      studentId: "string", // Referans: users koleksiyonu (role: student)
      submissionDate: "timestamp",
      status: "string", // "submitted", "late", "not_submitted"
      attachments: ["string"], // URL listesi
      grade: "number",
      feedback: "string",
    }
  ]
};

// Koleksiyon: finances
// Finansal işlemleri içerir
const financeSchema = {
  transactionId: "string",
  schoolId: "string", // Referans: schools koleksiyonu
  studentId: "string", // Referans: users koleksiyonu (role: student)
  createdAt: "timestamp",
  updatedAt: "timestamp",
  createdBy: "string", // Referans: users koleksiyonu (role: admin)
  
  // İşlem bilgileri
  type: "string", // "tuition", "transportation", "meal", "activity", "other"
  amount: "number",
  currency: "string", // "TRY", "USD", "EUR"
  description: "string",
  dueDate: "timestamp",
  
  // Ödeme bilgileri
  paymentStatus: "string", // "paid", "pending", "overdue", "cancelled"
  paymentDate: "timestamp",
  paymentMethod: "string", // "cash", "credit_card", "bank_transfer", "online"
  receiptNumber: "string",
  
  // Taksit bilgileri (varsa)
  installments: [
    {
      installmentNumber: "number",
      amount: "number",
      dueDate: "timestamp",
      paymentStatus: "string", // "paid", "pending", "overdue"
      paymentDate: "timestamp",
    }
  ]
};

// Tüm şemaları dışa aktar
module.exports = {
  userSchema,
  schoolSchema,
  classSchema,
  subjectSchema,
  scheduleSchema,
  attendanceSchema,
  gradeSchema,
  behaviorSchema,
  announcementSchema,
  messageSchema,
  examSchema,
  homeworkSchema,
  financeSchema
};
