FROM node:16
WORKDIR /usr/src/npm_gameSv

COPY package*.json ./
RUN npm install --force

COPY . .

EXPOSE 8083
CMD [ "node", "server.js" ]
