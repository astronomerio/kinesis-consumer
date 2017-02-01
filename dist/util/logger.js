'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _streamroller = require('streamroller');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logPath = process.env.LOG_PATH ? _path2.default.join(process.env.LOG_PATH, _uuid2.default.v4() + '.log') : './app.log';
var rollingStream = new _streamroller.RollingFileStream(logPath, 100000000, 3);

function getDefaultStreams() {
  var streams = [{
    level: 'info',
    stream: rollingStream
  }, {
    level: 'debug',
    stream: process.stdout
  }];

  return streams;
}

var options = {
  name: process.env.BUNYAN_APP_NAME || 'kinesis-record-processor',
  streams: getDefaultStreams()
};

var log = _bunyan2.default.createLogger(options);

exports.default = log;