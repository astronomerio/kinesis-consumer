FROM java:8

MAINTAINER Alois Barreras <alois@astronomer.io>

# grab tini for signal processing and zombie killing
ENV TINI_VERSION v0.9.0
RUN set -x \
	&& wget -O /usr/local/bin/tini "https://github.com/krallin/tini/releases/download/$TINI_VERSION/tini" \
	&& wget -O /usr/local/bin/tini.asc "https://github.com/krallin/tini/releases/download/$TINI_VERSION/tini.asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --keyserver ha.pool.sks-keyservers.net --recv-keys 6380DC428747F6C393FEACA59A84159D7001A4E5 \
	&& gpg --batch --verify /usr/local/bin/tini.asc /usr/local/bin/tini \
	&& rm -r "$GNUPGHOME" /usr/local/bin/tini.asc \
	&& chmod +x /usr/local/bin/tini \
	&& tini -h


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

ENTRYPOINT ["tini", "--"]
CMD ["npm", "start"]
