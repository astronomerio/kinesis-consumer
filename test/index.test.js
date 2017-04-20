const { assert } = require('chai');
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
      const mySpy = spy(Consumer.prototype, 'processRecord')
      myConsumer.processRecords({
        records: [{}],
      }, function () {
        assert.ok(mySpy.calledOnce);
        done();
      });
    });

    it('should call processRecord twice for two records', function (done) {
      const mySpy = spy(Consumer.prototype, 'processRecord')
      myConsumer.processRecords({
        records: [{}, {}],
      }, function () {
        assert.ok(mySpy.calledTwice);
        done();
      });
    });

    it('should call processRecord thrice for three records', function (done) {
      const mySpy = spy(Consumer.prototype, 'processRecord')
      myConsumer.processRecords({
        records: [{}, {}, {}],
      }, function () {
        assert.ok(mySpy.calledThrice);
        done();
      });
    });
  });
});
