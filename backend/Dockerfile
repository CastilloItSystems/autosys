# Usamos el Node estándar (sin alpine) para evitar errores de compilación
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --force

COPY . .

# Si usas Prisma, necesitamos generar el cliente antes de arrancar
# (Si no usas prisma, puedes borrar esta línea)
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "start"]