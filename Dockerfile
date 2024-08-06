FROM node:20-alpine

WORKDIR /client
COPY package.json .
COPY package-lock.json .

COPY . .

RUN npm i

EXPOSE 5173
ENTRYPOINT ["npm", "run", "dev"]
