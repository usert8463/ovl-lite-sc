FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Ainz-fo/NEO-BOT-MD.git /neo_bot

WORKDIR /neo_bot

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
