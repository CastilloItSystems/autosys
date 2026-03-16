FROM node:18
WORKDIR /app
COPY package.json ./
RUN npm install --no-package-lock --force --ignore-scripts
COPY . .

# 👇 CORREGIMOS EL NOMBRE DE LA VARIABLE AQUÍ 👇
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]