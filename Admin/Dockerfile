# develop stage
FROM node:18.1.0-slim  
WORKDIR /app
COPY package*.json ./
RUN yarn global add @quasar/cli
COPY . .
