const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const app = express();

// Route'ları import et
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const classRoutes = require("./routes/classes");
const subjectRoutes = require("./routes/subjects");
const gradeRoutes = require("./routes/grades");
const announcementRoutes = require("./routes/announcements");
const messageRoutes = require("./routes/messages");
const schoolRoutes = require("./routes/schools");
const attendanceRoutes = require("./routes/attendance");
const homeworkRoutes = require("./routes/homework");
const examRoutes = require("./routes/exams");

// Middleware'leri ayarla
app.use(cors());
app.use(express.json());
app.use(helmet()); // Güvenlik başlıkları
app.use(morgan('dev')); // İstek günlüğü

// API rate limiting
const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 15 dakikada maksimum 100 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin."
  }
});

// API rotalarını ayarla
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/exams", examRoutes);

// API limitleme middleware'ini uygula
app.use("/api", apiLimiter);

// Ana sayfa
app.get("/", (req, res) => res.send("Okul Takip Sistemi API'si aktif! 🚀"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Sayfa bulunamadı" });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Sunucu hatası",
    message: process.env.NODE_ENV === 'development' ? err.message : "Bir hata oluştu"
  });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda çalışıyor!`));
