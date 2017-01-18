FROM java:8

MAINTAINER Alois Barreras <alois@astronomer.io>

RUN curl -sL https://deb.nodesource.com/setup_7.x | bash && apt-get install -y nodejs

RUN mkdir -p /usr/src/app

RUN mkdir -p /usr/src/app/log
ENV LOG_PATH /usr/src/app/log

# Bundle app source
ONBUILD COPY dist /usr/src/app
ONBUILD COPY properties /usr/src/app/properties
ONBUILD COPY package.json /usr/src/app
ONBUILD WORKDIR /usr/src/app
ONBUILD RUN npm install --production

EXPOSE 8080
CMD ["npm", "start"]
