'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logDir = process.env.NODE_LOG_DIR !== undefined ? process.env.NODE_LOG_DIR : ".";

var options = {
    name: 'astronomer-kinesis-record-processor',
    streams: [{
        type: 'rotating-file',
        period: '12h',
        count: 3,
        level: 'trace',
        path: logDir + '/app.log'
    }]
};

exports.default = _bunyan2.default.createLogger(options);