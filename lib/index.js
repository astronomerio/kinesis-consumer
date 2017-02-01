import PartitionedBuffer from '@astronomerio/partitioned-buffer';
import logger from './util/logger';

/**
 * The simplest implementation of a Kinesis Stream consumer must be an object that implements
 * the functions initialize, processRecords, and shutdown.
 */

export default class RecordProcessor {
  constructor(options = {}) {
    this.shardId = null;
    this.buffer = null;
    this.lastProcessed = null;
    this.logger = null;
    this.options = options;
  }

  initialize({ shardId }, cb) {
    this.logger = logger;

    // we only want to create the partitioned buffer if the subclass has defined flushBuffer.
    // some subclasses won't use the partitioned buffer
    if (this.flushBuffer) {
      this.buffer = this.createPartitionedBuffer(this.flushBuffer, this.options);
    }

    this.shardId = shardId;
    this.logger.debug('initialized record processor');
    cb();
  }

  createPartitionedBuffer(flushBuffer, options) {
    const pb = new PartitionedBuffer(flushBuffer.bind(this), options);
    return pb;
  }

  processRecords({ checkpointer, records }, cb) {
    if (!records) { return cb(); }

    this.logger.debug(`processing ${records.length} records`);

    this.doProcessRecords(records, checkpointer, cb).catch((e) => {
      this.logger.error('Error during doProcessrecords.', e);
      cb();
    });
  }

  async doProcessRecords(records, checkpointer, cb) {
    for (let record of records) {
      await this.processRecord(record);
      this.lastProcessed = record.sequenceNumber;
    }

    this.checkpoint(checkpointer, cb);
  }

  async processRecord(record) {
    throw new Error('Must implement processRecord');
  }

  checkpoint(checkpointer, cb) {
    // can't checkpoint without a lastProcessed id
    if (!this.lastProcessed) {
      this.logger.debug('No last processed found');
      return cb();
    }

    // If checkpointing, cb should only be called once checkpoint is complete.
    checkpointer.checkpoint(this.lastProcessed, (err, sequenceNumber) => {
      if (err) {
        this.logger.error({ err: err });
        return cb();
      }

      this.logger.debug(`checkpointed sequenceNumber ${sequenceNumber} with last record processed ${this.lastProcessed}`);
      cb();
    });
  }

  shutdown({ reason, checkpointer }, cb) {
    // Checkpoint should only be performed when shutdown reason is not TERMINATE.
    if (reason !== 'TERMINATE') {
      return cb();
    }

    if (this.buffer) {
      this.buffer.flushAllBuffers().then(() => {
        this.checkpoint(checkpointer, cb);
      });
    } else {
      this.checkpoint(checkpointer, cb);
    }
  }
}
