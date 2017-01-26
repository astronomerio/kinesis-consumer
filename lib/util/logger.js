import bunyan from 'bunyan';
import uuid from 'uuid';
import path from 'path';

const logPath = process.env.LOG_PATH ? path.join(process.env.LOG_PATH, `${uuid.v4()}.log`) : './app.log';

function getDefaultStreams() {
  const streams = [{
    level: 'info',
    path: logPath
  }];

  return streams;
}

const options = {
  name: process.env.BUNYAN_APP_NAME || 'kinesis-record-processor',
  streams: getDefaultStreams(),
};

const log = bunyan.createLogger(options);

process.on('SIGUSR2', function () {
    log.reopenFileStreams();
});

export default log;
