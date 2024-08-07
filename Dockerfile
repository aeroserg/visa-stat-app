FROM node:20-slim

WORKDIR /client
COPY package.json .
COPY package-lock.json .

RUN npm i
COPY . .

EXPOSE 4173
ENTRYPOINT ["npm", "run", "start"]
