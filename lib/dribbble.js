
var Base = require('./base.js');
var Request = require('./request.js');

var Dribbble = function Dribbble(options) {
    Base.call(this, options);
};

Dribbble.CONFIG = {
    LENGTH: 64,
    VERSION: 'v1',
    HOST: 'api.dribbble.com',
    PORT: 443,
    SECURE: true
};

Dribbble.ERROR = {
    'MISSING_ACCESS_TOKEN'      : 'An access token is required for fetching data from dribbble API',
    'INVALID_ACCESS_TOKEN'      : 'Dribbble access token is a {0} length generate string on your applications page, please provide a valid access token',
    'MISSING_CALLBACK'          : 'A callback function is required for http request',
    'INVALID_CALLBACK_FORMAT'   : 'Callback has to be in [function(error, data, ...)] format. ERR: {0}'
};

Dribbble.prototype = Object.create(Base.prototype);
Dribbble.prototype.constructor = Dribbble;

Dribbble.prototype._init = function() {
    this.set('api.defaults.shots', {
        page: 1,
        per_page: 30,
        views: 'popular'
    });
};

Dribbble.prototype._beforeFetch = function() {
    if (typeof this.get('access_token') !== 'string') {
        this.throw(Dribbble.ERROR.MISSING_ACCESS_TOKEN);
    }
    if (typeof this.get('access_token') === 'string' && this.get('access_token').trim().length < Dribbble.CONFIG.LENGTH) {
        this.throw(Dribbble.ERROR.INVALID_ACCESS_TOKEN, Dribbble.CONFIG.LENGTH);
    }
};

Dribbble.prototype._fetch = function(path, query, callback) {
    // action before fetching api
    this._beforeFetch();
    // callback validation
    if (typeof callback === 'function') {
        this._cbParamsCheck(callback);
    } else if (typeof callback === 'undefined') {
        this.throw(Dribbble.ERROR.MISSING_CALLBACK);
    }
    // create a http request
    var req = new Request({
        secure: Dribbble.CONFIG.SECURE,
        hostname: Dribbble.CONFIG.HOST,
        port: Dribbble.CONFIG.PORT,
        path: [ Dribbble.CONFIG.VERSION, path ] .join('/'),
        query: query
    });
    req.then(function(err, res, ms) {
        if (typeof callback === 'function') {
            callback.apply(this, [err, res, ms, req]);
        }
    }.bind(this)).send();
};

Dribbble.prototype._extractCbParams = function(callback) {
    var str = String(callback),
        args = /\(\s*([^)]+?)\s*\)/.exec(str);
    if (args && args[1]) {
        args = args[1].split(/\s*,\s*/);
    } else {
        args = [];
    }
    return args;
};

Dribbble.prototype._cbParamsCheck = function(callback) {
    var args = this._extractCbParams(callback);
    if (args.length < 2) {
        this.throw(Dribbble.ERROR.INVALID_CALLBACK_FORMAT, JSON.stringify(args));
    }
    return this;
};

Dribbble.prototype._mixin = function() {
    var res = {};
    for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'object') {
            for (var d in arguments[i]) {
                res[d] = arguments[i][d];
            }
        }
    }
    return res;
};

Dribbble.prototype._buildQuery = function() {
    var opts = this._mixin.apply(this, arguments);
    opts.access_token = this.get('access_token');
    return opts;
};

Dribbble.prototype.shots = function(arg, cb) {
    this._fetch('shots', this._buildQuery(this.get('api.defaults.shots'), arg), cb || arg);
};

module.exports = exports = Dribbble;
