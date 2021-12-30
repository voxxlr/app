FROM alpine

WORKDIR /root
ADD . /root

RUN apk add --update nodejs npm

RUN npm install 

EXPOSE 4000

CMD ["/bin/sh", "-c", "node server.js 0.0.0.0 > server.log"]