FROM node:18-alpine AS base

# Çalışma dizini oluştur
WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json package-lock.json* ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Geliştirme ortamı için
FROM base AS development
ENV NODE_ENV=development
# ESLint kontrolünü atla ve doğrudan geliştirme modunda çalıştır
CMD ["npm", "run", "dev"]

# Üretim ortamı için build aşaması
FROM base AS build
ENV NODE_ENV=production
RUN npm run build

# Üretim ortamı için çalıştırma aşaması
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Sadece gerekli dosyaları kopyala
COPY --from=build /app/next.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Uygulamayı başlat
CMD ["npm", "run", "start"]
