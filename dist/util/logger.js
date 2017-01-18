'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logPath = process.env.LOG_PATH ? path.join(process.env.LOG_PATH, _uuid2.default.v4() + '.log') : './app.log';

function getDefaultStreams() {
  var streams = [{
    level: 'info',
    path: logPath
  }];

  return streams;
}

var options = {
  name: process.env.BUNYAN_APP_NAME || 'kinesis-record-processor',
  streams: getDefaultStreams()
};

exports.default = _bunyan2.default.createLogger(options);