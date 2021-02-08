FROM node
WORKDIR /coherent-server

COPY ["package.json", "package-lock.json", "tsconfig.json", "./"]
COPY src/ src/

RUN npm install
RUN npm run build

EXPOSE ${HTTP_PORT}
CMD ["node", "lib/index.js"]
