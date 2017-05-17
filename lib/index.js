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
      assert(this.processRecord, 'Must define processRecord function');
      assert(options.logger, 'Must pass an instance of bunyan to options.logger');

      // kind of a weird workaround to be able to test that this.processRecord is called
      this.processRecordQueue = async.queue(async (info) => {
        const result = await this.processRecord(info);
        return result;
      }, 1);

      this.shardId = null;
      this.lastProcessed = null;
      this.options = options;
      this.logger = options.logger;
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

          const callback = (err, result) => {
            if (err) {
              this.logger.error(err);
            }

            processedCount += 1;
            if (processedCount === records.length) {
              done();
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
      ], () => {
        completeCallback();
      });
    }

    /**
     * @param {Object} shutdownInput
     * @param {Object} shutdownInput.checkpointer
     * @param {String} shutdownInput.reason
     */

    shutdown(shutdownInput, completeCallback) {
      if (shutdownInput.reason !== 'TERMINATE') {
        return completeCallback();
      }

      shutdownInput.checkpointer.checkpoint((err) => {
        if (err) this.logger.err(err);
        completeCallback();
      });
    }

    /**
     * Checkpoints with Kinesis.
     */

    async checkpoint(checkpointer, sequenceNumber) {
      // thenify the checkpoint method so we can promise retry it
      const checkpoint = thenify(checkpointer.checkpoint).bind(checkpointer);
      // eslint-disable-next-line arrow-body-style
      await promiseRetry({ retries: 1 }, (retry) => {
        return checkpoint(sequenceNumber)
          .catch((err) => {
            if (err) {
              this.logger.error(err);
            }

            retry();
          });
      });
    }
  }

  return Consumer;
}

module.exports = createConsumer;
