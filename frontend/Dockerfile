# Usar Node 18
FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Construir Next.js para producción (vital)
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# El comando para encenderlo
CMD ["npm", "start"]