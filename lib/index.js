const util = require('util');
const assert = require('assert');
const debug = require('debug')('kinesis-consumer');
const async = require('async');

/**
 * Create KinesisConsumer constructor with 'name' and a function to process records.
 * @param {String} name Name of the Kinesis consumer
 */

function createConsumer(name) {
  assert(name, 'expected consumer name');

  let processRecordQueue = null;

  function Consumer(options = {}) {
    if (!(this instanceof Consumer)) return new Consumer(options);
    assert(this.processRecord, 'Must define processRecord function');

    processRecordQueue = async.queue(this.processRecord, 1);
    this.shardId = null;
    this.lastProcessed = null;
    this.options = options;
  }

  Consumer.prototype.initialize = function (initializeInput, completeCallback) {
    const shardId = initializeInput.shardId;
    this.shardId = shardId;
    debug(`Initialized record processor. Shard id is: ${shardId}`);
    completeCallback();
  };

  /**
   * @param {Object} processRecordsInput
   * @param {Object} processRecordsInput.records
   * @param {Object} processRecordsInput.checkpointer
   * @param {Function} callback
   */

  Consumer.prototype.processRecords = function (processRecordsInput, completeCallback) {
    if (!processRecordsInput || !processRecordsInput.records) return callback();
    const records = processRecordsInput.records;
    debug(`Processing ${records.length} records`);
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
          processRecordQueue.push({
            record,
            checkpointer: processRecordsInput.checkpointer
          },
            callback);
        }, this);
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

  Consumer.prototype.shutdown = function (shutdownInput, completeCallback) {
    completeCallback();
  }

  return Consumer;
}

module.exports = createConsumer;