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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
            var checkpointer = _ref2.checkpointer;
            var records = _ref2.records;

            if (!records) {
                return cb();
            }

            this.logger.info('processing ' + records.length + ' records');

            this.doProcessRecords(records, checkpointer, cb);
        }
    }, {
        key: 'doProcessRecords',
        value: function () {
            var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(records, checkpointer, cb) {
                var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, record;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.prev = 0;
                                _iteratorNormalCompletion = true;
                                _didIteratorError = false;
                                _iteratorError = undefined;
                                _context.prev = 4;
                                _iterator = records[Symbol.iterator]();

                            case 6:
                                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                    _context.next = 14;
                                    break;
                                }

                                record = _step.value;
                                _context.next = 10;
                                return this.processRecord(record);

                            case 10:
                                this.lastProcessed = record.sequenceNumber;

                            case 11:
                                _iteratorNormalCompletion = true;
                                _context.next = 6;
                                break;

                            case 14:
                                _context.next = 20;
                                break;

                            case 16:
                                _context.prev = 16;
                                _context.t0 = _context['catch'](4);
                                _didIteratorError = true;
                                _iteratorError = _context.t0;

                            case 20:
                                _context.prev = 20;
                                _context.prev = 21;

                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }

                            case 23:
                                _context.prev = 23;

                                if (!_didIteratorError) {
                                    _context.next = 26;
                                    break;
                                }

                                throw _iteratorError;

                            case 26:
                                return _context.finish(23);

                            case 27:
                                return _context.finish(20);

                            case 28:
                                _context.next = 33;
                                break;

                            case 30:
                                _context.prev = 30;
                                _context.t1 = _context['catch'](0);

                                this.logger.info(_context.t1);

                            case 33:

                                this.checkpoint(checkpointer, cb);

                            case 34:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[0, 30], [4, 16, 20, 28], [21,, 23, 27]]);
            }));

            function doProcessRecords(_x, _x2, _x3) {
                return _ref3.apply(this, arguments);
            }

            return doProcessRecords;
        }()
    }, {
        key: 'processRecord',
        value: function () {
            var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(record) {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                throw new Error('Must implement processRecord');

                            case 1:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function processRecord(_x4) {
                return _ref4.apply(this, arguments);
            }

            return processRecord;
        }()
    }, {
        key: 'checkpoint',
        value: function checkpoint(checkpointer, cb) {
            var _this = this;

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

                _this.logger.info('checkpointed sequenceNumber ' + sequenceNumber + ' with last record processed ' + _this.lastProcessed);
                cb();
            });
        }
    }, {
        key: 'shutdown',
        value: function shutdown(_ref5, cb) {
            var reason = _ref5.reason;
            var checkpointer = _ref5.checkpointer;

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