FROM node:20-alpine

WORKDIR /server
COPY package.json .
COPY package-lock.json .

COPY . .

RUN npm i

EXPOSE 3001
ENTRYPOINT ["npm", "run", "start"]
