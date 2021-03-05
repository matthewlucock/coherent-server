FROM node
WORKDIR /coherent-server

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

EXPOSE ${HTTP_PORT}
CMD ["node", "lib/index.js"]
