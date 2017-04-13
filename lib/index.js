const util = require('util');
const assert = require('assert');
const debug = require('debug')('kinesis-consumer');
const async = require('async');

/**
 * Create Consumer constructor with 'name'.
 * @param {String} name Name of the Kinesis consumer
 */

function createConsumer(name) {
  assert(name, 'expected consumer name');

  class Consumer {
    constructor(options = {}) {
      if (!(this instanceof Consumer)) return new Consumer(options);
      assert(this.processRecord, 'Must define processRecord function');

      // kind of a weird workaround to be able to test that this.processRecord is called
      this.processRecordQueue = async.queue(function (info, cb) {
        this.processRecord(info, cb);
      }.bind(this), 1);

      this.shardId = null;
      this.lastProcessed = null;
      this.options = options;
    }

    initialize(initializeInput, completeCallback) {
      const { shardId } = initializeInput;
      this.shardId = shardId;
      completeCallback();
    };

    /**
     * @param {Object} processRecordsInput
     * @param {Object} processRecordsInput.records
     * @param {Object} processRecordsInput.checkpointer
     * @param {Function} callback
     */

    processRecords(processRecordsInput, completeCallback) {
      if (!processRecordsInput || !processRecordsInput.records) return callback();
      const records = processRecordsInput.records;
      const self = this;
      async.series([
        function (done) {
          let processedCount = 0;
          let errorCount = 0;
          let errors;

          const callback = function (err) {
            if (err) {
              errorCount++;
              errors = errors + '\n' + err;
            }

            processedCount++;
            if (processedCount === records.length) {
              done(errors, errorCount);
            }
          };

          records.forEach(function (record) {
            self.processRecordQueue.push({
              record,
              checkpointer: processRecordsInput.checkpointer
            },
              callback);
          });
        }
      ], function (err, errCount) {
        if (err) debug(util.format('%d records processed with %d errors.', records.length, errCount));
        completeCallback();
      });
    };

    /**
     * @param {Object} shutdownInput
     * @param {Object} shutdownInput.checkpointer
     * @param {String} shutdownInput.reason
     */

    shutdown(shutdownInput, completeCallback) {
      completeCallback();
    }
  }

  return Consumer;
}

module.exports = createConsumer;