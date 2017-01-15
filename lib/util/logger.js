import bunyan from 'bunyan';

const logDir = process.env.NODE_LOG_DIR !== undefined ?
    process.env.NODE_LOG_DIR :
    ".";

const options = {
    name: 'astronomer-kinesis-record-processor',
    streams: [{
        type: 'rotating-file',
        period: '6h',
        count: 2,
        level: 'trace',
        path: `${logDir}/app.log`
    }]
};

export default bunyan.createLogger(options);
