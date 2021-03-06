
var Base = require('./base.js');

var Request = function Request(options) {
    Base.call(this, options);
};

Request.METHOD = {
    POST    : 'POST',
    GET     : 'GET',
    PUT     : 'PUT',
    DELETE  : 'DELETE'
};

Request.EVENT = {
    REQ_COMPLETE: 'REQUEST_COMPLETE',
    REQ_ERROR   : 'REQUEST_ERROR',
    RES_COMPLETE: 'RESPONSE_COMPLETE',
    RES_RECEIVE : 'RESPONSE_RECEIVE',
    RES_ERROR   : 'RESPONSE_ERROR'
};

Request.ERROR = {
    'MISSING_CALLBACK': 'A callback is required for function [{0}]'
};

Request.prototype = Object.create(Base.prototype);
Request.prototype.constructor = Request;

Request.prototype._init = function() {
    this.require([
        { id: 'http' , ref: 'http' },
        { id: 'https', ref: 'https' }
    ]);
};

Request.prototype._getopts = function() {
    var options = {
        secure: false,
        hostname: '127.0.0.1',
        port: 80,
        path: '/',
        method: Request.METHOD.GET
    };
    if (this.opts.hasOwnProperty('secure') && typeof this.opts.secure === 'boolean') {
        options.secure = this.opts.secure;
        options.port = 443;
    }
    if (this.opts.hasOwnProperty('hostname')) {
        options.hostname = this.opts.hostname;
    }
    if (this.opts.hasOwnProperty('port')) {
        options.port = this.opts.port;
    }
    if (typeof options.port !== 'number') {
        try {
            options.port = parseInt(options.port);
        } catch(e) {
            options.port = 80;
        }
    }
    if (this.opts.hasOwnProperty('path') && typeof this.opts.path === 'string') {
        options.path = this.opts.path;
    }
    if (options.path.substring(0, 1) !== '/') {
        options.path = '/' + options.path;
    }
    if (this.opts.hasOwnProperty('method') && Request.METHOD.hasOwnProperty(this.opts.method)) {
        options.method = this.opts.method;
    }
    if (this.opts.hasOwnProperty('query') && typeof this.opts.query === 'object' && this.opts.method !== Request.METHOD.POST) {
        var buildQuery = this._buildQuery(this.opts.query);
        if (buildQuery.trim().length > 0) {
            options.path += ('?' + buildQuery);
        }
    }
    return options;
};

Request.prototype._buildQuery = function(obj) {
    var query = [];
    for (var d in obj) {
        query.push(encodeURIComponent(d) + '=' + encodeURIComponent(obj[d]));
    }
    return query.join('&');
};

Request.prototype._responseDataHandler = function(data) {
    if (typeof this.get('received_data') === 'undefined') {
        this.set('received_data', '');
        this._requestStartHandler();
    }
    this.append('received_data', data);
    this.emit(Request.EVENT.RES_RECEIVE, data);
};

Request.prototype._responseEndHandler = function() {
    var data = this.get('received_data'),
        err  = this.get('error'),
        reqStartDate = this.get('req_date'),
        reqEndDate = new Date(),
        reqMilliSeconds = reqEndDate - reqStartDate;
    try {
        data = JSON.parse(data);
        this.set('json', true);
    } catch(e) {
        this.set('json', false);
    }
    this.unset('received_data');
    this.set('data', data);
    this.set('req_ms', reqMilliSeconds);
    this.emit(Request.EVENT.RES_COMPLETE, err, data, reqMilliSeconds);
};

Request.prototype._responseErrorHandler = function(e) {
    this.emit(Request.EVENT.REQ_ERROR, this.set('error', e));
};

Request.prototype._requestStartHandler = function() {
    this.emit(Request.EVENT.REQ_START, this.set('req_date', new Date()));
};

Request.prototype._requestErrorHandler = function(e) {
    this.emit(Request.EVENT.RES_ERROR, this.set('error', e));
};

Request.prototype.send = function() {
    // get options
    var options = this._getopts();
    // create http request
    var req = this.require(options.secure ? 'https' : 'http').request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', this._responseDataHandler.bind(this));
        res.on('end', this._responseEndHandler.bind(this));
        res.on('error', this._responseErrorHandler.bind(this));
    }.bind(this));
    // catch request error
    req.on('error', this._requestErrorHandler.bind(this));
    // if method is post, write data to request
    if (this._getopts().method === Request.METHOD.POST) {
        req.write(this._buildQuery(this.opts.query));
    }
    req.end();
    return this;
};

Request.prototype.then = function(cb) {
    if (typeof cb !== 'function') {
        this.throw(Request.ERROR.MISSING_CALLBACK, 'then');
    }
    if (typeof this.get('data') !== 'undefined') {
        cb.call(this, this.get('error'), this.get('data'), this.get('req_ms'));
    } else if (typeof this.get('data') === 'undefined') {
        this.once(Request.EVENT.RES_COMPLETE, cb.bind(this));
    }
    return this;
};

module.exports = exports = Request;

