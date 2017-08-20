var nockSandbox = require('./');
var nativeNock = require('nock');
var expect = require('chai').expect;
var sinon = require('sinon');
var finalizeEach = require('mocha-finalize-each');

describe('nock-sandbox', function() {
    var sinonSandbox;
    beforeEach(function() {
        sinonSandbox = sinon.sandbox.create();
    });
    afterEach(function() {
        sinonSandbox.reset();
    });

    it('should create a nock factory', function() {
        var nock = nockSandbox();
        expect(nock).to.be.instanceOf(Function);
        expect(nock).to.have.property('cleanAll');
        expect(nock).to.have.property('done');
        var handle1 = nock('foo');
        var handle2 = nativeNock('foo');
        expect(handle1).to.be.instanceOf(handle2.constructor);
    });

    it('should clean up scope after .done', function() {
        var nock = nockSandbox();
        var nockScope = nock('foo');
        sinon.stub(nockScope, 'done').callsFake(function() {});
        sinon.stub(nock, 'cleanAll').callsFake(function() {});

        nock.done();

        sinon.assert.calledOnce(nockScope.done);
        sinon.assert.calledOnce(nock.cleanAll);
    });

    it('should throw on .done if nock was not used', function() {
        var nock = nockSandbox();
        var nockScope = nock('http://foo/bar').get('.').reply(200);
        expect(function() {
            nock.done();
        }).to.throw('Mocks not yet satisfied:');
    });

    it('should disable netConnect and re-enable it', function() {
        sinon.stub(nativeNock, 'disableNetConnect').callsFake(function() {})
        var nock = nockSandbox();
        sinon.assert.calledOnce(nativeNock.disableNetConnect);
        sinon.stub(nativeNock, 'enableNetConnect').callsFake(function() {});
        nock.done();
        sinon.assert.calledOnce(nativeNock.enableNetConnect);
    });

    it('should clean up all interceptors after cleanAll', function() {
        var nock = nockSandbox();
        var scope = nock('http://localhost:5555');
        scope.get('/').reply('foo');
        scope.get('/').reply('bar');
        expect(scope.interceptors).to.have.length(2);
        expect(scope.isDone()).to.be.false;
        nock.cleanAll();
        expect(scope.isDone()).to.be.true;
    });

    describe('setupForMocha', function() {
        var nock = nockSandbox.setupForMocha(this);
        var beginSpy = sinon.spy(nock, 'begin');
        var endSpy = sinon.spy(nock, 'done');

        // NOTE: these two tests are dependent on each other
        it('calls nock.begin before test', function() {
            sinon.assert.calledOnce(beginSpy);
        });
        it('calls nock.begin every test and nock.done', function() {
            sinon.assert.calledTwice(beginSpy);
            sinon.assert.calledOnce(endSpy);
        });        
    })
    
    describe('setupForMocha lets each test fail independently', function() {
      var nock = nockSandbox.setupForMocha(this);
      var finalizeError;
      finalizeEach(this, promise => {
        return promise.catch(err => {
          finalizeError = err;
        });
      });
      
      it('#1 is failing and error recorded', function() {
        nock('http://foo.com').get('/').reply('foo');
      });
      
      it('#2 is failing and error recorded', function() {
        nock('http://foo.com').get('/').reply('bar');
      });
      
      afterEach(function() {
        expect(finalizeError.message).to.contain('Mocks not yet satisfied:');
      });
    })
    
});
