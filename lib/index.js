const util = require('util');
const assert = require('assert');
const debug = require('debug')('kinesis-consumer');
const async = require('async');
const thenify = require('thenify');
const promiseRetry = require('promise-retry');

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
      this.processRecordQueue = async.queue((info, cb) => {
        try {
          this.processRecord(info, cb);
        } catch (e) {
          // TODO: do something if an error happens in processRecord
          cb();
        }
      }, 1);

      this.shardId = null;
      this.lastProcessed = null;
      this.options = options;
    }

    initialize(initializeInput, completeCallback) {
      const { shardId } = initializeInput;
      this.shardId = shardId;
      completeCallback();
    }

    /**
     * @param {Object} processRecordsInput
     * @param {Object} processRecordsInput.records
     * @param {Object} processRecordsInput.checkpointer
     * @param {Function} callback
     */

    processRecords(processRecordsInput, completeCallback) {
      if (!processRecordsInput || !processRecordsInput.records) {
        completeCallback();
        return;
      }
      const records = processRecordsInput.records;
      const self = this;
      async.series([
        (done) => {
          let processedCount = 0;
          let errorCount = 0;
          let errors;

          const callback = (err) => {
            if (err) {
              errorCount += 1;
              // eslint-disable-next-line prefer-template
              errors = errors + '\n' + err;
            }

            processedCount += 1;
            if (processedCount === records.length) {
              done(errors, errorCount);
            }
          };

          records.forEach((record, idx) => {
            self.processRecordQueue.push({
              record,
              checkpointer: processRecordsInput.checkpointer,
              currentRecord: idx + 1,
              totalRecords: records.length,
            },
              callback);
          });
        },
      ], (err, errCount) => {
        if (err) debug(util.format('%d records processed with %d errors.', records.length, errCount));
        completeCallback();
      });
    }

    /**
     * @param {Object} shutdownInput
     * @param {Object} shutdownInput.checkpointer
     * @param {String} shutdownInput.reason
     */

    shutdown(shutdownInput, completeCallback) {
      completeCallback();
    }

    /**
     * Checkpoints with Kinesis.
     */

    static async checkpoint(checkpointer, sequenceNumber) {
      // thenify the checkpoint method so we can promise retry it
      const checkpoint = thenify(checkpointer.checkpoint).bind(checkpointer);
      // eslint-disable-next-line arrow-body-style
      await promiseRetry({ retries: 1 }, (retry) => {
        return checkpoint(sequenceNumber)
          .catch((err) => {
            if (err) {
              // TODO: do something with error
            }

            retry();
          });
      });
    }
  }

  return Consumer;
}

module.exports = createConsumer;
