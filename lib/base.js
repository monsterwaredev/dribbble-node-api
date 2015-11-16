
var EventEmitter = require('events').EventEmitter;

/**
 * Base Class
 *
 * @params Object::options
 * @return Base::Instance
 */
var Base = function Base(options) {
    'use strict';
    // Set options to an empty object if passed options is empty
    if (typeof options !== 'object') {
        options = {};
    }
    // Create a new instance if object is not a instance of Base
    if (!(this instanceof Base)) {
        return new Base(options);
    }
    // Defined pre-default values
    this.attributes = {};
    this.opts = {};
    // Set options to `this.opts` object
    for (var i in options) {
        this.opts[i] = options[i];
    }
    // Init EventEmitter
    EventEmitter.call(this);
    if (typeof this._init === 'function') {
        this._init();
    }
    return this;
};

Base.prototype = Object.create(EventEmitter.prototype);
Base.prototype.constructor = Base;

/**
 * Load or return library
 *
 * @params
 *
 */
Base.prototype.require = function(opts, obj) {
    if (typeof this.attributes.libs !== 'object') {
        this.attributes.libs = {};
    }
    if (opts instanceof Array) {
        for (var i in opts) {
            if (typeof opts[i] === 'string') {
                this.attributes.libs[opts[i]] = require(opts[i]);
            } else if (typeof opts[i] === 'object' && typeof opts[i].id === 'string' && typeof opts[i].ref === 'string') {
                if (opts[i].new === true) {
                    if (opts[i].args instanceof Array) {
                        this.attributes.libs[opts[i].id] = new (require(opts[i].name).bind.apply(require(opts[i].name), opts[i].args))();
                    } else {
                        this.attributes.libs[opts[i].id] = new (require(opts[i].ref))();
                    }
                } else {
                    this.attributes.libs[opts[i].id] = require(opts[i].ref);
                }
            }
        }
    } else if (typeof opts === 'string') {
        if (typeof obj !== 'undefined') {
            this.attributes.libs[opts] = obj;
        } else if (typeof this.attributes.libs[opts] !== 'undefined') {
            return this.attributes.libs[opts];
        }
    }
    return this;
};

Base.prototype.get = function(key) {
    if (typeof key === 'string') {
        return this.attributes[key];
    }
    return this.attributes;
};

Base.prototype.set = function(key, value) {
    if (typeof key === 'string') {
        this.attributes[key] = value;
    }
    return value;
};

Base.prototype.unset = function(key) {
    delete this.attributes[key];
    return this;
};

Base.prototype.log = function(str) {
    var args;
    if ((typeof str === 'string' && str.indexOf('{0}') == -1) || (typeof str !== 'string')) {
        args = ['[' + this.constructor.name + ']'];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        console.log.apply(undefined, args);
    } else if (typeof str === 'string' && str.indexOf('{0}') > -1) {
        args = arguments;
        str = str.replace(/\{([0-9]+)\}/g, function (match, index) {
            return args[parseInt(index) + 1];
        });
        console.log('[' + this.constructor.name + ']', str);
    }
    return this;
};

Base.prototype.throw = function() {
    this.log.apply(this, arguments);
    process.exit(1);
};

module.exports = exports = Base;
