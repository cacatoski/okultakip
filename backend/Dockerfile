FROM node:18-alpine

WORKDIR /app

# Önce bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install --production

# Sonra kaynak kodları kopyala
COPY . .

# Uygulama portunu belirt
EXPOSE 8000

# Uygulamayı başlat
CMD ["npm", "start"]
