FROM ghcr.io/puppeteer/puppeteer:19.7.2

RUN --mount=type=secret,id=_env,dst=.env cat .env

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "serve"]