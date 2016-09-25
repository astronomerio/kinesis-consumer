'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _partitionedBuffer = require('@astronomerio/partitioned-buffer');

var _partitionedBuffer2 = _interopRequireDefault(_partitionedBuffer);

var _logger = require('./util/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The simplest implementation of a Kinesis Stream consumer must be an object that implements
 * the functions initialize, processRecords, and shutdown.
 */

var RecordProcessor = function () {
    function RecordProcessor() {
        _classCallCheck(this, RecordProcessor);

        this.shardId = null;
        this.buffer = null;
        this.lastProcessed = null;
        this.logger = null;
    }

    _createClass(RecordProcessor, [{
        key: 'initialize',
        value: function initialize(_ref, cb) {
            var shardId = _ref.shardId;

            this.logger = _logger2.default;
            this.buffer = this.createPartitionedBuffer(this.flushBuffer);
            this.shardId = shardId;
            this.logger.info('initialized record processor');
            cb();
        }
    }, {
        key: 'createPartitionedBuffer',
        value: function createPartitionedBuffer(flushBuffer) {
            var pb = new _partitionedBuffer2.default(flushBuffer.bind(this));
            return pb;
        }
    }, {
        key: 'processRecords',
        value: function processRecords(_ref2, cb) {
            var _this = this;

            var checkpointer = _ref2.checkpointer;
            var records = _ref2.records;

            if (!records) {
                return cb();
            }

            this.logger.info('processing ' + records.length + ' records');

            this.doProcessRecords(records, function (e) {
                if (e) {
                    return cb();
                };
                _this.checkpoint(checkpointer, cb);
            });
        }
    }, {
        key: 'checkpoint',
        value: function checkpoint(checkpointer, cb) {
            var _this2 = this;

            // can't checkpoint without a lastProcessed id
            if (!this.lastProcessed) {
                this.logger.info('no last processed found');
                return cb();
            }

            // If checkpointing, cb should only be called once checkpoint is complete.
            checkpointer.checkpoint(this.lastProcessed, function (err, sequenceNumber) {
                if (err) {
                    return _logger2.default.info(err);
                }

                _this2.logger.info('checkpointed sequenceNumber ' + sequenceNumber + ' with last record processed ' + _this2.lastProcessed);
                cb();
            });
        }
    }, {
        key: 'shutdown',
        value: function shutdown(_ref3, cb) {
            var reason = _ref3.reason;
            var checkpointer = _ref3.checkpointer;

            // Checkpoint should only be performed when shutdown reason is TERMINATE.
            if (reason !== 'TERMINATE') {
                return cb();
            }

            this.buffer.flushAllBuffers().then(function () {
                // Whenever checkpointing, cb should only be invoked once checkpoint is complete.
                checkpointer.checkpoint(function (err) {
                    cb();
                });
            });
        }
    }]);

    return RecordProcessor;
}();

exports.default = RecordProcessor;
;