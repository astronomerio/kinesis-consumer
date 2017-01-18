FROM java:8

MAINTAINER Alois Barreras <alois@astronomer.io>

RUN curl -sL https://deb.nodesource.com/setup_7.4.x | bash && apt-get install -y nodejs

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production

RUN mkdir -p /usr/src/app/log
ENV LOG_PATH /usr/src/app/log

# Bundle app source
ONBUILD COPY ./dist /usr/src/app
ONBUILD COPY ./properties /usr/src/app

EXPOSE 8080
CMD ["npm", "start"]
