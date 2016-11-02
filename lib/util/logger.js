const bunyan = require('bunyan');

const logDir = process.env.NODE_LOG_DIR !== undefined ?
    process.env.NODE_LOG_DIR :
    ".";

const options = {
    name: 'astronomer-kinesis-record-processor',
    streams: [{
        level: 'trace',
        path: `${logDir}/app.log`
    }]
};

module.exports = bunyan.createLogger(options);
