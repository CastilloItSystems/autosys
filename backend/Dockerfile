FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json package-lock.json* ./

RUN npm install --ignore-scripts

COPY . .

RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN node --max-old-space-size=4096 node_modules/.bin/tsc

EXPOSE 4000

CMD ["node", "dist/index.js"]
