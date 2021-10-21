FROM node:14-slim

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8 \
    LC_ALL=C.UTF-8

WORKDIR /BT

COPY . .
RUN npm install

CMD ["npm", "start"]
