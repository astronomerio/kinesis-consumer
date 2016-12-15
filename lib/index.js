import PartitionedBuffer from '@astronomerio/partitioned-buffer';
import logger from './util/logger';

/**
 * The simplest implementation of a Kinesis Stream consumer must be an object that implements
 * the functions initialize, processRecords, and shutdown.
 */

export default class RecordProcessor {
    constructor() {
        this.shardId = null;
        this.buffer = null;
        this.lastProcessed = null;
        this.logger = null;
    }

    initialize({ shardId }, cb) {
        this.logger = logger;
        this.buffer = this.createPartitionedBuffer(this.flushBuffer);
        this.shardId = shardId;
        this.logger.info('initialized record processor');
        cb();
    }

    createPartitionedBuffer(flushBuffer) {
        const pb = new PartitionedBuffer(flushBuffer.bind(this));
        return pb;
    }

    processRecords({ checkpointer, records }, cb) {
        if (!records) { return cb(); }

        this.logger.info(`processing ${records.length} records`);

        this.doProcessRecords(records, checkpointer, cb);
    }

    async doProcessRecords(records, checkpointer, cb) {
        try {
            for (let record of records) {
                await this.processRecord(record);
                this.lastProcessed = record.sequenceNumber;
            }
        } catch (e) {
            this.logger.info(e);
        }

        this.checkpoint(checkpointer, cb);
    }

    async processRecord(record) {
        throw new Error('Must implement processRecord');
    }

    checkpoint(checkpointer, cb) {
        // can't checkpoint without a lastProcessed id
        if (!this.lastProcessed) {
            this.logger.info('no last processed found');
            return cb();
        }

        // If checkpointing, cb should only be called once checkpoint is complete.
        checkpointer.checkpoint(this.lastProcessed, (err, sequenceNumber) => {
            if (err) {
                return logger.info(err);
            }

            this.logger.info(`checkpointed sequenceNumber ${sequenceNumber} with last record processed ${this.lastProcessed}`);
            cb();
        });
    }

    shutdown({ reason, checkpointer }, cb) {
        // Checkpoint should only be performed when shutdown reason is TERMINATE.
        if (reason !== 'TERMINATE') {
            return cb();
        }

        this.buffer.flushAllBuffers().then(() => {
            // Whenever checkpointing, cb should only be invoked once checkpoint is complete.
            checkpointer.checkpoint((err) => {
                cb();
            });
        }).catch((e) => {
            cb();
        });
    }
}
