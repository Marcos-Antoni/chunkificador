FROM node:18-alpine

WORKDIR /app

COPY package.json .

# Instalamos dependencias
RUN npm install

COPY . .

EXPOSE 5173

# Vite Development Server
CMD ["npm", "run", "dev", "--", "--host"]
