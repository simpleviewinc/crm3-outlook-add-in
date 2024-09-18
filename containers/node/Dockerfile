FROM node:22.8.0

RUN yarn global add pm2

COPY package.json /app/package.json
COPY .eslintrc.json /app/.eslintrc.json
COPY pm2.yml /app/pm2.yml

RUN cd /app && yarn install

COPY lib /app/lib/

WORKDIR /app/lib

EXPOSE 80

CMD ["pm2-runtime", "/app/pm2.yml"]