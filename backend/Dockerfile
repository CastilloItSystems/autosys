FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json package-lock.json* ./

RUN npm install --ignore-scripts

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma generate && npm start"]