const assert = require('assert');
const async = require('async');
const { promisify } = require('util');
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

      const tasks = records.map((record, idx) => async () => {
        try {
          await this.processRecord({
            record,
            checkpointer: processRecordsInput.checkpointer,
            currentRecord: idx + 1,
            totalRecords: records.length,
          });
        } catch (e) {
          this.logger.error(e);
        }
      });

      async.series(tasks, () => {
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
      const checkpoint = promisify(checkpointer.checkpoint).bind(checkpointer);
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
