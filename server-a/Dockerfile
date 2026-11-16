FROM node:22-alpine

WORKDIR /app

# kopioidaan ensin pelkkä package.json, niin npm install ei aja joka kerta uudestaan
# jos vain koodi muuttuu
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
