FROM java:8

MAINTAINER Alois Barreras <alois@astronomer.io>

RUN curl -sL https://deb.nodesource.com/setup_7.x | bash && apt-get install -y nodejs

RUN mkdir -p /usr/src/app

RUN mkdir -p /usr/src/app/log
ENV LOG_PATH /usr/src/app/log

# Bundle app source
ONBUILD COPY package.json /usr/src/app
ONBUILD WORKDIR /usr/src/app
ONBUILD RUN npm install --production
ONBUILD COPY dist /usr/src/app/dist
ONBUILD COPY properties /usr/src/app/properties
ONBUILD COPY bin /usr/src/app/bin

CMD ["/usr/src/app/node_modules/.bin/kcl-bootstrap", "-e", "-p", "properties/prod.properties", "-j", "/usr/bin/java"]
