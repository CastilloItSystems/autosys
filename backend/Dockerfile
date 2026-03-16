# Usar Node 18
FROM node:18-alpine

# Crear la carpeta de trabajo
WORKDIR /app

# Copiar solo el package.json primero (esto hace que la instalación sea más rápida)
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de tu código del backend
COPY . .

# Exponer el puerto
EXPOSE 4000

# El comando para encenderlo
CMD ["npm", "start"]