import bunyan from 'bunyan';
import uuid from 'uuid';
import path from 'path';
import { RollingFileStream } from 'streamroller';

const logPath = process.env.LOG_PATH ? path.join(process.env.LOG_PATH, `${uuid.v4()}.log`) : './app.log';
const rollingStream = new RollingFileStream(logPath, 100000000, 3);

function getDefaultStreams() {
  const streams = [
    {
      level: 'info',
      stream: rollingStream,
    },
    {
      level: 'debug',
      stream: process.stdout
    }
  ];

  return streams;
}

const options = {
  name: process.env.BUNYAN_APP_NAME || 'kinesis-record-processor',
  streams: getDefaultStreams(),
};

const log = bunyan.createLogger(options);

export default log;
