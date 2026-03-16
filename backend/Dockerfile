FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./

# Instalamos dependencias sin ejecutar scripts
RUN npm install --ignore-scripts

# Copiamos todo el proyecto, incluida la carpeta prisma
COPY . .

EXPOSE 4000

# Generamos Prisma al iniciar y luego arrancamos la app
CMD ["sh", "-c", "npx prisma generate && npm start"]