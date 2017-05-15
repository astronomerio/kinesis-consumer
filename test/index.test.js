/* eslint-disable no-unused-expressions */
const sinon = require('sinon');
const { assert, expect } = require('chai');
const { spy, stub } = require('sinon');
const consumer = require('../lib');

describe('Record Procesor', function () {
  describe('createConsumer', function () {
    it('should fail with no name', function () {
      assert.throws(consumer);
    });

    it('should pass with name', function () {
      assert.doesNotThrow(function () {
        consumer('my-consumer');
      });
    });
  });

  describe('constructor', function () {
    let Consumer;

    beforeEach(function () {
      Consumer = consumer('my-consumer');
    });

    it('should fail with no processRecord defined', function () {
      assert.throws(function () {
        new Consumer();
      });
    });

    it('should succeed with processRecord defined', function () {
      Consumer.prototype.processRecord = function () { };
      assert.doesNotThrow(function () {
        new Consumer();
      });
    });

    it('should have the right properties', function () {
      Consumer.prototype.processRecord = function () { };
      const myConsumer = new Consumer();
      assert.ok(myConsumer.processRecordQueue);
      assert.equal(myConsumer.lastProcessed, null);
      assert.equal(myConsumer.shardId, null);
    });
  });

  describe('initialize', function () {
    let Consumer;
    let myConsumer;

    beforeEach(function () {
      Consumer = consumer('my-consumer');
      Consumer.prototype.processRecord = function () { };
      myConsumer = new Consumer();
    });

    it('should have the right properties', function () {
      const callback = stub();
      myConsumer.initialize({
        shardId: 'my-shard-id',
      }, callback);

      assert.equal(myConsumer.shardId, 'my-shard-id');
      assert.ok(callback.called);
    });
  });

  describe('processRecords', function () {
    let Consumer;
    let myConsumer;

    beforeEach(function () {
      Consumer = consumer('my-consumer');
      Consumer.prototype.processRecord = function (info, cb) { cb(); };
      myConsumer = new Consumer();
    });

    it('should call processRecord once for one record', function (done) {
      const mySpy = spy(Consumer.prototype, 'processRecord');
      myConsumer.processRecords({
        records: [{}],
      }, function () {
        assert.ok(mySpy.calledOnce);
        done();
      });
    });

    it('should call processRecord twice for two records', function (done) {
      const mySpy = spy(Consumer.prototype, 'processRecord');
      myConsumer.processRecords({
        records: [{}, {}],
      }, function () {
        assert.ok(mySpy.calledTwice);
        done();
      });
    });

    it('should call processRecord thrice for three records', function (done) {
      const mySpy = spy(Consumer.prototype, 'processRecord');
      myConsumer.processRecords({
        records: [{}, {}, {}],
      }, function () {
        assert.ok(mySpy.calledThrice);
        done();
      });
    });

    it('should call processRecord thrice for three records even if they throw errors', function (done) {
      const myStub = stub(Consumer.prototype, 'processRecord').throws('Uh oh');
      myConsumer.processRecords({
        records: [{}, {}, {}],
      }, function () {
        assert.ok(myStub.calledThrice);
        done();
      });
    });

    it('should call processRecord thrice for three records even if they reject', function (done) {
      const myStub = stub(Consumer.prototype, 'processRecord').rejects('Uh oh');
      myConsumer.processRecords({
        records: [{}, {}, {}],
      }, function () {
        assert.ok(myStub.calledThrice);
        done();
      });
    });

    it('should work with async processRecord', (done) => {
      Consumer.prototype.processRecord = async function (info, cb) {
        await Promise.resolve();
        cb();
      };

      myConsumer = new Consumer();

      const mySpy = spy(Consumer.prototype, 'processRecord');
      myConsumer.processRecords({
        records: [{}, {}, {}],
      }, function () {
        assert.ok(mySpy.calledThrice);
        done();
      });
    });

    it('should pass the correct value for current record', (done) => {
      const countStub = sinon.stub();
      Consumer.prototype.processRecord = async function (info, cb) {
        countStub(info.currentRecord);
        cb();
      };

      myConsumer = new Consumer();

      myConsumer.processRecords({
        records: [{}, {}, {}],
      }, function () {
        assert.ok(countStub.firstCall.calledWith(1));
        assert.ok(countStub.secondCall.calledWith(2));
        assert.ok(countStub.thirdCall.calledWith(3));
        done();
      });
    });
  });

  describe('checkpoint', () => {
    let Consumer;
    let myConsumer;

    beforeEach(function () {
      Consumer = consumer('my-consumer');
      Consumer.prototype.processRecord = function (info, cb) { cb(); };
      myConsumer = new Consumer();
    });

    it('should succeed if checkpoint succeeds', async () => {
      const checkpointer = {
        checkpoint: (num, cb) => {
          cb(null, num);
        },
      };
      await Consumer.checkpoint(checkpointer, 123456);
    });

    it('should retry if checkpoint fails', async () => {
      const checkpointer = {
        checkpoint: (num, cb) => {
          cb(null, num);
        },
      };
      // first time will error
      const checkpointStub = sinon.stub(checkpointer, 'checkpoint').onFirstCall().callsFake((num, cb) => {
        cb(new Error('Uh oh'));
      });
      // second time will succeed
      checkpointStub.onSecondCall().callsFake((num, cb) => {
        cb(null, num);
      });

      await Consumer.checkpoint(checkpointer, 123456);
      expect(checkpointStub.calledTwice).to.be.true;
    });
  });
});
