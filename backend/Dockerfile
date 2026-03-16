FROM node:20-alpine

WORKDIR /app

COPY package.json ./

# Mantenemos el ignore-scripts para que pase la instalación
RUN npm install --ignore-scripts

# Copiamos todo tu código (incluyendo la carpeta prisma)
COPY . .

EXPOSE 4000

# 👇 LA MAGIA: Movemos la generación de Prisma al momento de encender el contenedor 👇
CMD ["sh", "-c", "npx prisma generate && npm start"]