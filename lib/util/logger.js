import bunyan from 'bunyan';
import uuid from 'uuid';

const logPath = process.env.LOG_PATH ? path.join(process.env.LOG_PATH, `${uuid.v4()}.log`) : './app.log';

function getDefaultStreams() {
  const streams = [{
    level: 'info',
    path: logPath
  }];

  // development will log to stdout for easy debugging
  if (process.env.NODE_ENV !== 'production') {
    streams.push({
      level: 'trace',
      stream: process.stdout
    });
  }

  return streams;
}

const options = {
  name: process.env.BUNYAN_APP_NAME || 'kinesis-record-processor',
  streams: getDefaultStreams(),
};

export default bunyan.createLogger(options);
