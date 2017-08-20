var nock = require('nock');
var finalizeEach = require('mocha-finalize-each');

var nockSandbox = module.exports = function(constructorFunction, options) {
    var nocks = [];
    var nockFactory = function () {
        var args = Array.prototype.slice.call(arguments);
        var nockScope = nock.apply(nock, args);
        nocks.push(nockScope);
        return nockScope;
    };

    nockFactory.begin = function () {
        nock.disableNetConnect();
        nock.enableNetConnect(/127\.0\.0\.1|localhost/);
    };

    if (!(options && options.noAutoBegin)) {
        nockFactory.begin();
    }

    nockFactory.cleanAll = function() {
        nocks.forEach(function(nockScope) {
            nockScope.interceptors.forEach(function(interceptor) {
                nock.removeInterceptor(interceptor);
            });
        });
    };
    nockFactory.done = function() {
        try {
            nocks.forEach(function (nockScope) {
                // will throw if nock is not resolved
                nockScope.done();
            });
        } finally {
            nockFactory.cleanAll();
            nock.enableNetConnect();
        }
    };

    if(typeof constructorFunction === 'function') {
        constructorFunction.call(null, nockFactory);
    }

    return nockFactory;
};

nockSandbox.createConstructor = function(constructorFunction) {
    return function() {
        return module.exports(constructorFunction);
    };
};

nockSandbox.setupForMocha = function(mochaContext) {
    var nocks = nockSandbox(null, { noAutoBegin: true });

    mochaContext.beforeEach(function() {
       nocks.begin();
    });

    finalizeEach(mochaContext, function(promise) {
      return promise.then(function() { return nocks.done(); });
    });

    mochaContext.afterEach(function() {
        nocks.cleanAll();
        nock.enableNetConnect();
    });

    return nocks;
};
