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
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RecordProcessor);

    this.shardId = null;
    this.buffer = null;
    this.lastProcessed = null;
    this.logger = null;
    this.options = options;
  }

  _createClass(RecordProcessor, [{
    key: 'initialize',
    value: function initialize(_ref, cb) {
      var shardId = _ref.shardId;

      this.logger = _logger2.default;

      // we only want to create the partitioned buffer if the subclass has defined flushBuffer.
      // some subclasses won't use the partitioned buffer
      if (this.flushBuffer) {
        this.buffer = this.createPartitionedBuffer(this.flushBuffer, this.options);
      }

      this.shardId = shardId;
      this.logger.debug('initialized record processor');
      cb();
    }
  }, {
    key: 'createPartitionedBuffer',
    value: function createPartitionedBuffer(flushBuffer, options) {
      var pb = new _partitionedBuffer2.default(flushBuffer.bind(this), options);
      return pb;
    }
  }, {
    key: 'processRecords',
    value: function processRecords(_ref2, cb) {
      var _this = this;

      var checkpointer = _ref2.checkpointer,
          records = _ref2.records;

      if (!records) {
        return cb();
      }

      this.logger.debug('processing ' + records.length + ' records');

      this.doProcessRecords(records, checkpointer, cb).catch(function (e) {
        _this.logger.error('Error during doProcessrecords.', e);
        cb();
      });
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
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 3;
                _iterator = records[Symbol.iterator]();

              case 5:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context.next = 13;
                  break;
                }

                record = _step.value;
                _context.next = 9;
                return this.processRecord(record);

              case 9:
                this.lastProcessed = record.sequenceNumber;

              case 10:
                _iteratorNormalCompletion = true;
                _context.next = 5;
                break;

              case 13:
                _context.next = 19;
                break;

              case 15:
                _context.prev = 15;
                _context.t0 = _context['catch'](3);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 19:
                _context.prev = 19;
                _context.prev = 20;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 22:
                _context.prev = 22;

                if (!_didIteratorError) {
                  _context.next = 25;
                  break;
                }

                throw _iteratorError;

              case 25:
                return _context.finish(22);

              case 26:
                return _context.finish(19);

              case 27:

                this.checkpoint(checkpointer, cb);

              case 28:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 15, 19, 27], [20,, 22, 26]]);
      }));

      function doProcessRecords(_x2, _x3, _x4) {
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

      function processRecord(_x5) {
        return _ref4.apply(this, arguments);
      }

      return processRecord;
    }()
  }, {
    key: 'checkpoint',
    value: function checkpoint(checkpointer, cb) {
      var _this2 = this;

      // can't checkpoint without a lastProcessed id
      if (!this.lastProcessed) {
        this.logger.debug('No last processed found');
        return cb();
      }

      // If checkpointing, cb should only be called once checkpoint is complete.
      checkpointer.checkpoint(this.lastProcessed, function (err, sequenceNumber) {
        if (err) {
          _this2.logger.info(err);
          return cb();
        }

        _this2.logger.info('checkpointed sequenceNumber ' + sequenceNumber + ' with last record processed ' + _this2.lastProcessed);
        cb();
      });
    }
  }, {
    key: 'shutdown',
    value: function shutdown(_ref5, cb) {
      var _this3 = this;

      var reason = _ref5.reason,
          checkpointer = _ref5.checkpointer;

      // Checkpoint should only be performed when shutdown reason is not TERMINATE.
      if (reason !== 'TERMINATE') {
        return cb();
      }

      if (this.buffer) {
        this.buffer.flushAllBuffers().then(function () {
          _this3.checkpoint(checkpointer, cb);
        });
      } else {
        this.checkpoint(checkpointer, cb);
      }
    }
  }]);

  return RecordProcessor;
}();

exports.default = RecordProcessor;