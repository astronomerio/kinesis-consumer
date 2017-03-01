import { assert } from 'chai';
import { spy, stub } from 'sinon';
import RecordProcessor from '../lib';

describe('Record Procesor', function () {
    let rp;
    const shardId = 'my_shard';
    const records = [{ foo: 'bar' }, { hello: 'world', sequenceNumber: '12345' }];

    beforeEach(function () {
        rp = new RecordProcessor();
    });

    describe('constructor', function () {
        it('should have the correct settings', function () {
            const expectedRp = { logger: null, shardId: null, buffer: null, lastProcessed: null, options: {} };
            assert.deepEqual(rp, expectedRp);
        });
    });

    describe('#initialize', function () {
        it('should create a logger, shardId, create a partitioned buffer, and call the callback', function () {
            const cbSpy = spy();
            const flushBufferSpy = spy();
            rp.flushBuffer = flushBufferSpy;
            const createPartitionedBufferSpy = spy(rp, 'createPartitionedBuffer');

            rp.initialize({ shardId: shardId }, cbSpy);

            assert.equal(rp.shardId, shardId);
            assert.ok(rp.logger);
            assert.ok(cbSpy.called);
            assert.ok(createPartitionedBufferSpy.calledWith(flushBufferSpy));
        });
    });

    describe('#processRecords', function () {
        beforeEach(function () {
            rp.flushBuffer = () => {};
            rp.initialize({ shardId: shardId }, () => {});
        });

        it('should not call doProcessRecords when there are no records', function () {
            const input = { records: null };
            const cbSpy = spy();
            const doProcessStub = stub();
            rp.doProcessRecords = doProcessStub;

            rp.processRecords(input, cbSpy);
            assert.ok(cbSpy.called);
            assert.isFalse(doProcessStub.called);
        });

        it('should call doProcessRecords', function () {
            const doProcessStub = stub(rp, 'doProcessRecords').returns(Promise.resolve());
            const input = { records: records };

            rp.processRecords(input);
            assert.ok(doProcessStub.called);
        });
    });

    describe('#doProcessRecords', function () {
        beforeEach(function () {
            rp.flushBuffer = () => {};
            rp.initialize({ shardId: shardId }, () => {});
        });

        it('should call processRecord', async function () {
            const processRecordStub = stub(rp, 'processRecord');
            await rp.doProcessRecords(records, null);
            assert.ok(processRecordStub.calledTwice);
            assert.equal(rp.lastProcessed, '12345');
        });
    });

    describe('#checkpoint', function () {
        beforeEach(function () {
            rp.flushBuffer = () => {};
            rp.initialize({ shardId: shardId }, () => {});
        });

        it('should call callback and not call checkpoint when there is no lastProcessed', function () {
            const checkpointer = spy();
            const cbSpy = spy();
            const input = { checkpoint: checkpointer };

            rp.checkpoint(input, cbSpy)
            assert.ok(cbSpy.called);
            assert.isFalse(checkpointer.called);
        });

        it('should call callback and checkpoint when there is lastProcessed', function () {
            const checkpointer = spy();
            const cbSpy = spy();
            const input = { checkpoint: (lastProcessed, callback) => { callback(null, 45); } };

            rp.lastProcessed = 55;
            rp.checkpoint(input, cbSpy);
            assert.ok(cbSpy.called);
        });
    });

    describe('#shutdown', function () {
        beforeEach(function () {
            rp.flushBuffer = () => {};
            rp.initialize({ shardId: shardId }, () => {});
        });

        it('should not flush buffer when reason is not TERMINATE', function () {
            const cbSpy = spy();
            const checkpointer = stub();
            const input = { reason: 'notTerminate', checkpointer: checkpointer };

            const flushSpy = spy();
            rp.buffer = { flushAllBuffers: flushSpy };

            rp.shutdown(input, cbSpy);
            assert.ok(cbSpy.called);
            assert.isFalse(flushSpy.called);
        });
    });
});
