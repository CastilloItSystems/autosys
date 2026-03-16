FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Recibir la variable desde el docker-compose
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]