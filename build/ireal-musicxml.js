var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/asap/browser-raw.js
var require_browser_raw = __commonJS({
  "node_modules/asap/browser-raw.js"(exports, module) {
    "use strict";
    module.exports = rawAsap;
    function rawAsap(task) {
      if (!queue.length) {
        requestFlush();
        flushing = true;
      }
      queue[queue.length] = task;
    }
    var queue = [];
    var flushing = false;
    var requestFlush;
    var index = 0;
    var capacity = 1024;
    function flush() {
      while (index < queue.length) {
        var currentIndex = index;
        index = index + 1;
        queue[currentIndex].call();
        if (index > capacity) {
          for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
            queue[scan] = queue[scan + index];
          }
          queue.length -= index;
          index = 0;
        }
      }
      queue.length = 0;
      index = 0;
      flushing = false;
    }
    var scope = typeof global !== "undefined" ? global : self;
    var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;
    if (typeof BrowserMutationObserver === "function") {
      requestFlush = makeRequestCallFromMutationObserver(flush);
    } else {
      requestFlush = makeRequestCallFromTimer(flush);
    }
    rawAsap.requestFlush = requestFlush;
    function makeRequestCallFromMutationObserver(callback) {
      var toggle = 1;
      var observer = new BrowserMutationObserver(callback);
      var node = document.createTextNode("");
      observer.observe(node, { characterData: true });
      return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
      };
    }
    function makeRequestCallFromTimer(callback) {
      return function requestCall() {
        var timeoutHandle = setTimeout(handleTimer, 0);
        var intervalHandle = setInterval(handleTimer, 50);
        function handleTimer() {
          clearTimeout(timeoutHandle);
          clearInterval(intervalHandle);
          callback();
        }
      };
    }
    rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;
  }
});

// node_modules/promise/lib/core.js
var require_core = __commonJS({
  "node_modules/promise/lib/core.js"(exports, module) {
    "use strict";
    var asap = require_browser_raw();
    function noop() {
    }
    var LAST_ERROR = null;
    var IS_ERROR = {};
    function getThen(obj) {
      try {
        return obj.then;
      } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
      }
    }
    function tryCallOne(fn, a) {
      try {
        return fn(a);
      } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
      }
    }
    function tryCallTwo(fn, a, b) {
      try {
        fn(a, b);
      } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
      }
    }
    module.exports = Promise3;
    function Promise3(fn) {
      if (typeof this !== "object") {
        throw new TypeError("Promises must be constructed via new");
      }
      if (typeof fn !== "function") {
        throw new TypeError("Promise constructor's argument is not a function");
      }
      this._x = 0;
      this._y = 0;
      this._z = null;
      this._A = null;
      if (fn === noop) return;
      doResolve(fn, this);
    }
    Promise3._B = null;
    Promise3._C = null;
    Promise3._D = noop;
    Promise3.prototype.then = function(onFulfilled, onRejected) {
      if (this.constructor !== Promise3) {
        return safeThen(this, onFulfilled, onRejected);
      }
      var res = new Promise3(noop);
      handle(this, new Handler(onFulfilled, onRejected, res));
      return res;
    };
    function safeThen(self2, onFulfilled, onRejected) {
      return new self2.constructor(function(resolve2, reject2) {
        var res = new Promise3(noop);
        res.then(resolve2, reject2);
        handle(self2, new Handler(onFulfilled, onRejected, res));
      });
    }
    function handle(self2, deferred) {
      while (self2._y === 3) {
        self2 = self2._z;
      }
      if (Promise3._B) {
        Promise3._B(self2);
      }
      if (self2._y === 0) {
        if (self2._x === 0) {
          self2._x = 1;
          self2._A = deferred;
          return;
        }
        if (self2._x === 1) {
          self2._x = 2;
          self2._A = [self2._A, deferred];
          return;
        }
        self2._A.push(deferred);
        return;
      }
      handleResolved(self2, deferred);
    }
    function handleResolved(self2, deferred) {
      asap(function() {
        var cb = self2._y === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
          if (self2._y === 1) {
            resolve(deferred.promise, self2._z);
          } else {
            reject(deferred.promise, self2._z);
          }
          return;
        }
        var ret = tryCallOne(cb, self2._z);
        if (ret === IS_ERROR) {
          reject(deferred.promise, LAST_ERROR);
        } else {
          resolve(deferred.promise, ret);
        }
      });
    }
    function resolve(self2, newValue) {
      if (newValue === self2) {
        return reject(
          self2,
          new TypeError("A promise cannot be resolved with itself.")
        );
      }
      if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
        var then = getThen(newValue);
        if (then === IS_ERROR) {
          return reject(self2, LAST_ERROR);
        }
        if (then === self2.then && newValue instanceof Promise3) {
          self2._y = 3;
          self2._z = newValue;
          finale(self2);
          return;
        } else if (typeof then === "function") {
          doResolve(then.bind(newValue), self2);
          return;
        }
      }
      self2._y = 1;
      self2._z = newValue;
      finale(self2);
    }
    function reject(self2, newValue) {
      self2._y = 2;
      self2._z = newValue;
      if (Promise3._C) {
        Promise3._C(self2, newValue);
      }
      finale(self2);
    }
    function finale(self2) {
      if (self2._x === 1) {
        handle(self2, self2._A);
        self2._A = null;
      }
      if (self2._x === 2) {
        for (var i = 0; i < self2._A.length; i++) {
          handle(self2, self2._A[i]);
        }
        self2._A = null;
      }
    }
    function Handler(onFulfilled, onRejected, promise) {
      this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
      this.onRejected = typeof onRejected === "function" ? onRejected : null;
      this.promise = promise;
    }
    function doResolve(fn, promise) {
      var done = false;
      var res = tryCallTwo(fn, function(value) {
        if (done) return;
        done = true;
        resolve(promise, value);
      }, function(reason) {
        if (done) return;
        done = true;
        reject(promise, reason);
      });
      if (!done && res === IS_ERROR) {
        done = true;
        reject(promise, LAST_ERROR);
      }
    }
  }
});

// node_modules/promise/lib/done.js
var require_done = __commonJS({
  "node_modules/promise/lib/done.js"(exports, module) {
    "use strict";
    var Promise3 = require_core();
    module.exports = Promise3;
    Promise3.prototype.done = function(onFulfilled, onRejected) {
      var self2 = arguments.length ? this.then.apply(this, arguments) : this;
      self2.then(null, function(err) {
        setTimeout(function() {
          throw err;
        }, 0);
      });
    };
  }
});

// node_modules/promise/lib/finally.js
var require_finally = __commonJS({
  "node_modules/promise/lib/finally.js"(exports, module) {
    "use strict";
    var Promise3 = require_core();
    module.exports = Promise3;
    Promise3.prototype.finally = function(f) {
      return this.then(function(value) {
        return Promise3.resolve(f()).then(function() {
          return value;
        });
      }, function(err) {
        return Promise3.resolve(f()).then(function() {
          throw err;
        });
      });
    };
  }
});

// node_modules/promise/lib/es6-extensions.js
var require_es6_extensions = __commonJS({
  "node_modules/promise/lib/es6-extensions.js"(exports, module) {
    "use strict";
    var Promise3 = require_core();
    module.exports = Promise3;
    var TRUE = valuePromise(true);
    var FALSE = valuePromise(false);
    var NULL = valuePromise(null);
    var UNDEFINED = valuePromise(void 0);
    var ZERO = valuePromise(0);
    var EMPTYSTRING = valuePromise("");
    function valuePromise(value) {
      var p = new Promise3(Promise3._D);
      p._y = 1;
      p._z = value;
      return p;
    }
    Promise3.resolve = function(value) {
      if (value instanceof Promise3) return value;
      if (value === null) return NULL;
      if (value === void 0) return UNDEFINED;
      if (value === true) return TRUE;
      if (value === false) return FALSE;
      if (value === 0) return ZERO;
      if (value === "") return EMPTYSTRING;
      if (typeof value === "object" || typeof value === "function") {
        try {
          var then = value.then;
          if (typeof then === "function") {
            return new Promise3(then.bind(value));
          }
        } catch (ex) {
          return new Promise3(function(resolve, reject) {
            reject(ex);
          });
        }
      }
      return valuePromise(value);
    };
    var iterableToArray = function(iterable) {
      if (typeof Array.from === "function") {
        iterableToArray = Array.from;
        return Array.from(iterable);
      }
      iterableToArray = function(x) {
        return Array.prototype.slice.call(x);
      };
      return Array.prototype.slice.call(iterable);
    };
    Promise3.all = function(arr) {
      var args = iterableToArray(arr);
      return new Promise3(function(resolve, reject) {
        if (args.length === 0) return resolve([]);
        var remaining = args.length;
        function res(i2, val) {
          if (val && (typeof val === "object" || typeof val === "function")) {
            if (val instanceof Promise3 && val.then === Promise3.prototype.then) {
              while (val._y === 3) {
                val = val._z;
              }
              if (val._y === 1) return res(i2, val._z);
              if (val._y === 2) reject(val._z);
              val.then(function(val2) {
                res(i2, val2);
              }, reject);
              return;
            } else {
              var then = val.then;
              if (typeof then === "function") {
                var p = new Promise3(then.bind(val));
                p.then(function(val2) {
                  res(i2, val2);
                }, reject);
                return;
              }
            }
          }
          args[i2] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        }
        for (var i = 0; i < args.length; i++) {
          res(i, args[i]);
        }
      });
    };
    function onSettledFulfill(value) {
      return { status: "fulfilled", value };
    }
    function onSettledReject(reason) {
      return { status: "rejected", reason };
    }
    function mapAllSettled(item) {
      if (item && (typeof item === "object" || typeof item === "function")) {
        if (item instanceof Promise3 && item.then === Promise3.prototype.then) {
          return item.then(onSettledFulfill, onSettledReject);
        }
        var then = item.then;
        if (typeof then === "function") {
          return new Promise3(then.bind(item)).then(onSettledFulfill, onSettledReject);
        }
      }
      return onSettledFulfill(item);
    }
    Promise3.allSettled = function(iterable) {
      return Promise3.all(iterableToArray(iterable).map(mapAllSettled));
    };
    Promise3.reject = function(value) {
      return new Promise3(function(resolve, reject) {
        reject(value);
      });
    };
    Promise3.race = function(values) {
      return new Promise3(function(resolve, reject) {
        iterableToArray(values).forEach(function(value) {
          Promise3.resolve(value).then(resolve, reject);
        });
      });
    };
    Promise3.prototype["catch"] = function(onRejected) {
      return this.then(null, onRejected);
    };
    function getAggregateError(errors) {
      if (typeof AggregateError === "function") {
        return new AggregateError(errors, "All promises were rejected");
      }
      var error = new Error("All promises were rejected");
      error.name = "AggregateError";
      error.errors = errors;
      return error;
    }
    Promise3.any = function promiseAny(values) {
      return new Promise3(function(resolve, reject) {
        var promises = iterableToArray(values);
        var hasResolved = false;
        var rejectionReasons = [];
        function resolveOnce(value) {
          if (!hasResolved) {
            hasResolved = true;
            resolve(value);
          }
        }
        function rejectionCheck(reason) {
          rejectionReasons.push(reason);
          if (rejectionReasons.length === promises.length) {
            reject(getAggregateError(rejectionReasons));
          }
        }
        if (promises.length === 0) {
          reject(getAggregateError(rejectionReasons));
        } else {
          promises.forEach(function(value) {
            Promise3.resolve(value).then(resolveOnce, rejectionCheck);
          });
        }
      });
    };
  }
});

// node_modules/asap/browser-asap.js
var require_browser_asap = __commonJS({
  "node_modules/asap/browser-asap.js"(exports, module) {
    "use strict";
    var rawAsap = require_browser_raw();
    var freeTasks = [];
    var pendingErrors = [];
    var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);
    function throwFirstError() {
      if (pendingErrors.length) {
        throw pendingErrors.shift();
      }
    }
    module.exports = asap;
    function asap(task) {
      var rawTask;
      if (freeTasks.length) {
        rawTask = freeTasks.pop();
      } else {
        rawTask = new RawTask();
      }
      rawTask.task = task;
      rawAsap(rawTask);
    }
    function RawTask() {
      this.task = null;
    }
    RawTask.prototype.call = function() {
      try {
        this.task.call();
      } catch (error) {
        if (asap.onerror) {
          asap.onerror(error);
        } else {
          pendingErrors.push(error);
          requestErrorThrow();
        }
      } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
      }
    };
  }
});

// node_modules/promise/lib/node-extensions.js
var require_node_extensions = __commonJS({
  "node_modules/promise/lib/node-extensions.js"(exports, module) {
    "use strict";
    var Promise3 = require_core();
    var asap = require_browser_asap();
    module.exports = Promise3;
    Promise3.denodeify = function(fn, argumentCount) {
      if (typeof argumentCount === "number" && argumentCount !== Infinity) {
        return denodeifyWithCount(fn, argumentCount);
      } else {
        return denodeifyWithoutCount(fn);
      }
    };
    var callbackFn = "function (err, res) {if (err) { rj(err); } else { rs(res); }}";
    function denodeifyWithCount(fn, argumentCount) {
      var args = [];
      for (var i = 0; i < argumentCount; i++) {
        args.push("a" + i);
      }
      var body = [
        "return function (" + args.join(",") + ") {",
        "var self = this;",
        "return new Promise(function (rs, rj) {",
        "var res = fn.call(",
        ["self"].concat(args).concat([callbackFn]).join(","),
        ");",
        "if (res &&",
        '(typeof res === "object" || typeof res === "function") &&',
        'typeof res.then === "function"',
        ") {rs(res);}",
        "});",
        "};"
      ].join("");
      return Function(["Promise", "fn"], body)(Promise3, fn);
    }
    function denodeifyWithoutCount(fn) {
      var fnLength = Math.max(fn.length - 1, 3);
      var args = [];
      for (var i = 0; i < fnLength; i++) {
        args.push("a" + i);
      }
      var body = [
        "return function (" + args.join(",") + ") {",
        "var self = this;",
        "var args;",
        "var argLength = arguments.length;",
        "if (arguments.length > " + fnLength + ") {",
        "args = new Array(arguments.length + 1);",
        "for (var i = 0; i < arguments.length; i++) {",
        "args[i] = arguments[i];",
        "}",
        "}",
        "return new Promise(function (rs, rj) {",
        "var cb = " + callbackFn + ";",
        "var res;",
        "switch (argLength) {",
        args.concat(["extra"]).map(function(_, index) {
          return "case " + index + ":res = fn.call(" + ["self"].concat(args.slice(0, index)).concat("cb").join(",") + ");break;";
        }).join(""),
        "default:",
        "args[argLength] = cb;",
        "res = fn.apply(self, args);",
        "}",
        "if (res &&",
        '(typeof res === "object" || typeof res === "function") &&',
        'typeof res.then === "function"',
        ") {rs(res);}",
        "});",
        "};"
      ].join("");
      return Function(
        ["Promise", "fn"],
        body
      )(Promise3, fn);
    }
    Promise3.nodeify = function(fn) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = typeof args[args.length - 1] === "function" ? args.pop() : null;
        var ctx = this;
        try {
          return fn.apply(this, arguments).nodeify(callback, ctx);
        } catch (ex) {
          if (callback === null || typeof callback == "undefined") {
            return new Promise3(function(resolve, reject) {
              reject(ex);
            });
          } else {
            asap(function() {
              callback.call(ctx, ex);
            });
          }
        }
      };
    };
    Promise3.prototype.nodeify = function(callback, ctx) {
      if (typeof callback != "function") return this;
      this.then(function(value) {
        asap(function() {
          callback.call(ctx, null, value);
        });
      }, function(err) {
        asap(function() {
          callback.call(ctx, err);
        });
      });
    };
  }
});

// node_modules/promise/lib/synchronous.js
var require_synchronous = __commonJS({
  "node_modules/promise/lib/synchronous.js"(exports, module) {
    "use strict";
    var Promise3 = require_core();
    module.exports = Promise3;
    Promise3.enableSynchronous = function() {
      Promise3.prototype.isPending = function() {
        return this.getState() == 0;
      };
      Promise3.prototype.isFulfilled = function() {
        return this.getState() == 1;
      };
      Promise3.prototype.isRejected = function() {
        return this.getState() == 2;
      };
      Promise3.prototype.getValue = function() {
        if (this._y === 3) {
          return this._z.getValue();
        }
        if (!this.isFulfilled()) {
          throw new Error("Cannot get a value of an unfulfilled promise.");
        }
        return this._z;
      };
      Promise3.prototype.getReason = function() {
        if (this._y === 3) {
          return this._z.getReason();
        }
        if (!this.isRejected()) {
          throw new Error("Cannot get a rejection reason of a non-rejected promise.");
        }
        return this._z;
      };
      Promise3.prototype.getState = function() {
        if (this._y === 3) {
          return this._z.getState();
        }
        if (this._y === -1 || this._y === -2) {
          return 0;
        }
        return this._y;
      };
    };
    Promise3.disableSynchronous = function() {
      Promise3.prototype.isPending = void 0;
      Promise3.prototype.isFulfilled = void 0;
      Promise3.prototype.isRejected = void 0;
      Promise3.prototype.getValue = void 0;
      Promise3.prototype.getReason = void 0;
      Promise3.prototype.getState = void 0;
    };
  }
});

// node_modules/promise/lib/index.js
var require_lib = __commonJS({
  "node_modules/promise/lib/index.js"(exports, module) {
    "use strict";
    module.exports = require_core();
    require_done();
    require_finally();
    require_es6_extensions();
    require_node_extensions();
    require_synchronous();
  }
});

// node_modules/promise/index.js
var require_promise = __commonJS({
  "node_modules/promise/index.js"(exports, module) {
    "use strict";
    module.exports = require_lib();
  }
});

// node_modules/fast-diff/diff.js
var require_diff = __commonJS({
  "node_modules/fast-diff/diff.js"(exports, module) {
    var DIFF_DELETE = -1;
    var DIFF_INSERT = 1;
    var DIFF_EQUAL = 0;
    function diff_main(text1, text2, cursor_pos, cleanup, _fix_unicode) {
      if (text1 === text2) {
        if (text1) {
          return [[DIFF_EQUAL, text1]];
        }
        return [];
      }
      if (cursor_pos != null) {
        var editdiff = find_cursor_edit_diff(text1, text2, cursor_pos);
        if (editdiff) {
          return editdiff;
        }
      }
      var commonlength = diff_commonPrefix(text1, text2);
      var commonprefix = text1.substring(0, commonlength);
      text1 = text1.substring(commonlength);
      text2 = text2.substring(commonlength);
      commonlength = diff_commonSuffix(text1, text2);
      var commonsuffix = text1.substring(text1.length - commonlength);
      text1 = text1.substring(0, text1.length - commonlength);
      text2 = text2.substring(0, text2.length - commonlength);
      var diffs = diff_compute_(text1, text2);
      if (commonprefix) {
        diffs.unshift([DIFF_EQUAL, commonprefix]);
      }
      if (commonsuffix) {
        diffs.push([DIFF_EQUAL, commonsuffix]);
      }
      diff_cleanupMerge(diffs, _fix_unicode);
      if (cleanup) {
        diff_cleanupSemantic(diffs);
      }
      return diffs;
    }
    function diff_compute_(text1, text2) {
      var diffs;
      if (!text1) {
        return [[DIFF_INSERT, text2]];
      }
      if (!text2) {
        return [[DIFF_DELETE, text1]];
      }
      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      var i = longtext.indexOf(shorttext);
      if (i !== -1) {
        diffs = [
          [DIFF_INSERT, longtext.substring(0, i)],
          [DIFF_EQUAL, shorttext],
          [DIFF_INSERT, longtext.substring(i + shorttext.length)]
        ];
        if (text1.length > text2.length) {
          diffs[0][0] = diffs[2][0] = DIFF_DELETE;
        }
        return diffs;
      }
      if (shorttext.length === 1) {
        return [
          [DIFF_DELETE, text1],
          [DIFF_INSERT, text2]
        ];
      }
      var hm = diff_halfMatch_(text1, text2);
      if (hm) {
        var text1_a = hm[0];
        var text1_b = hm[1];
        var text2_a = hm[2];
        var text2_b = hm[3];
        var mid_common = hm[4];
        var diffs_a = diff_main(text1_a, text2_a);
        var diffs_b = diff_main(text1_b, text2_b);
        return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
      }
      return diff_bisect_(text1, text2);
    }
    function diff_bisect_(text1, text2) {
      var text1_length = text1.length;
      var text2_length = text2.length;
      var max_d = Math.ceil((text1_length + text2_length) / 2);
      var v_offset = max_d;
      var v_length = 2 * max_d;
      var v1 = new Array(v_length);
      var v2 = new Array(v_length);
      for (var x = 0; x < v_length; x++) {
        v1[x] = -1;
        v2[x] = -1;
      }
      v1[v_offset + 1] = 0;
      v2[v_offset + 1] = 0;
      var delta = text1_length - text2_length;
      var front = delta % 2 !== 0;
      var k1start = 0;
      var k1end = 0;
      var k2start = 0;
      var k2end = 0;
      for (var d = 0; d < max_d; d++) {
        for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
          var k1_offset = v_offset + k1;
          var x1;
          if (k1 === -d || k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1]) {
            x1 = v1[k1_offset + 1];
          } else {
            x1 = v1[k1_offset - 1] + 1;
          }
          var y1 = x1 - k1;
          while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) === text2.charAt(y1)) {
            x1++;
            y1++;
          }
          v1[k1_offset] = x1;
          if (x1 > text1_length) {
            k1end += 2;
          } else if (y1 > text2_length) {
            k1start += 2;
          } else if (front) {
            var k2_offset = v_offset + delta - k1;
            if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
              var x2 = text1_length - v2[k2_offset];
              if (x1 >= x2) {
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }
        for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
          var k2_offset = v_offset + k2;
          var x2;
          if (k2 === -d || k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1]) {
            x2 = v2[k2_offset + 1];
          } else {
            x2 = v2[k2_offset - 1] + 1;
          }
          var y2 = x2 - k2;
          while (x2 < text1_length && y2 < text2_length && text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)) {
            x2++;
            y2++;
          }
          v2[k2_offset] = x2;
          if (x2 > text1_length) {
            k2end += 2;
          } else if (y2 > text2_length) {
            k2start += 2;
          } else if (!front) {
            var k1_offset = v_offset + delta - k2;
            if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
              var x1 = v1[k1_offset];
              var y1 = v_offset + x1 - k1_offset;
              x2 = text1_length - x2;
              if (x1 >= x2) {
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }
      }
      return [
        [DIFF_DELETE, text1],
        [DIFF_INSERT, text2]
      ];
    }
    function diff_bisectSplit_(text1, text2, x, y) {
      var text1a = text1.substring(0, x);
      var text2a = text2.substring(0, y);
      var text1b = text1.substring(x);
      var text2b = text2.substring(y);
      var diffs = diff_main(text1a, text2a);
      var diffsb = diff_main(text1b, text2b);
      return diffs.concat(diffsb);
    }
    function diff_commonPrefix(text1, text2) {
      if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
        return 0;
      }
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerstart = 0;
      while (pointermin < pointermid) {
        if (text1.substring(pointerstart, pointermid) == text2.substring(pointerstart, pointermid)) {
          pointermin = pointermid;
          pointerstart = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      if (is_surrogate_pair_start(text1.charCodeAt(pointermid - 1))) {
        pointermid--;
      }
      return pointermid;
    }
    function diff_commonOverlap_(text1, text2) {
      var text1_length = text1.length;
      var text2_length = text2.length;
      if (text1_length == 0 || text2_length == 0) {
        return 0;
      }
      if (text1_length > text2_length) {
        text1 = text1.substring(text1_length - text2_length);
      } else if (text1_length < text2_length) {
        text2 = text2.substring(0, text1_length);
      }
      var text_length = Math.min(text1_length, text2_length);
      if (text1 == text2) {
        return text_length;
      }
      var best = 0;
      var length = 1;
      while (true) {
        var pattern = text1.substring(text_length - length);
        var found = text2.indexOf(pattern);
        if (found == -1) {
          return best;
        }
        length += found;
        if (found == 0 || text1.substring(text_length - length) == text2.substring(0, length)) {
          best = length;
          length++;
        }
      }
    }
    function diff_commonSuffix(text1, text2) {
      if (!text1 || !text2 || text1.slice(-1) !== text2.slice(-1)) {
        return 0;
      }
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerend = 0;
      while (pointermin < pointermid) {
        if (text1.substring(text1.length - pointermid, text1.length - pointerend) == text2.substring(text2.length - pointermid, text2.length - pointerend)) {
          pointermin = pointermid;
          pointerend = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      if (is_surrogate_pair_end(text1.charCodeAt(text1.length - pointermid))) {
        pointermid--;
      }
      return pointermid;
    }
    function diff_halfMatch_(text1, text2) {
      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
        return null;
      }
      function diff_halfMatchI_(longtext2, shorttext2, i) {
        var seed = longtext2.substring(i, i + Math.floor(longtext2.length / 4));
        var j = -1;
        var best_common = "";
        var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
        while ((j = shorttext2.indexOf(seed, j + 1)) !== -1) {
          var prefixLength = diff_commonPrefix(
            longtext2.substring(i),
            shorttext2.substring(j)
          );
          var suffixLength = diff_commonSuffix(
            longtext2.substring(0, i),
            shorttext2.substring(0, j)
          );
          if (best_common.length < suffixLength + prefixLength) {
            best_common = shorttext2.substring(j - suffixLength, j) + shorttext2.substring(j, j + prefixLength);
            best_longtext_a = longtext2.substring(0, i - suffixLength);
            best_longtext_b = longtext2.substring(i + prefixLength);
            best_shorttext_a = shorttext2.substring(0, j - suffixLength);
            best_shorttext_b = shorttext2.substring(j + prefixLength);
          }
        }
        if (best_common.length * 2 >= longtext2.length) {
          return [
            best_longtext_a,
            best_longtext_b,
            best_shorttext_a,
            best_shorttext_b,
            best_common
          ];
        } else {
          return null;
        }
      }
      var hm1 = diff_halfMatchI_(
        longtext,
        shorttext,
        Math.ceil(longtext.length / 4)
      );
      var hm2 = diff_halfMatchI_(
        longtext,
        shorttext,
        Math.ceil(longtext.length / 2)
      );
      var hm;
      if (!hm1 && !hm2) {
        return null;
      } else if (!hm2) {
        hm = hm1;
      } else if (!hm1) {
        hm = hm2;
      } else {
        hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
      }
      var text1_a, text1_b, text2_a, text2_b;
      if (text1.length > text2.length) {
        text1_a = hm[0];
        text1_b = hm[1];
        text2_a = hm[2];
        text2_b = hm[3];
      } else {
        text2_a = hm[0];
        text2_b = hm[1];
        text1_a = hm[2];
        text1_b = hm[3];
      }
      var mid_common = hm[4];
      return [text1_a, text1_b, text2_a, text2_b, mid_common];
    }
    function diff_cleanupSemantic(diffs) {
      var changes = false;
      var equalities = [];
      var equalitiesLength = 0;
      var lastequality = null;
      var pointer = 0;
      var length_insertions1 = 0;
      var length_deletions1 = 0;
      var length_insertions2 = 0;
      var length_deletions2 = 0;
      while (pointer < diffs.length) {
        if (diffs[pointer][0] == DIFF_EQUAL) {
          equalities[equalitiesLength++] = pointer;
          length_insertions1 = length_insertions2;
          length_deletions1 = length_deletions2;
          length_insertions2 = 0;
          length_deletions2 = 0;
          lastequality = diffs[pointer][1];
        } else {
          if (diffs[pointer][0] == DIFF_INSERT) {
            length_insertions2 += diffs[pointer][1].length;
          } else {
            length_deletions2 += diffs[pointer][1].length;
          }
          if (lastequality && lastequality.length <= Math.max(length_insertions1, length_deletions1) && lastequality.length <= Math.max(length_insertions2, length_deletions2)) {
            diffs.splice(equalities[equalitiesLength - 1], 0, [
              DIFF_DELETE,
              lastequality
            ]);
            diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
            equalitiesLength--;
            equalitiesLength--;
            pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
            length_insertions1 = 0;
            length_deletions1 = 0;
            length_insertions2 = 0;
            length_deletions2 = 0;
            lastequality = null;
            changes = true;
          }
        }
        pointer++;
      }
      if (changes) {
        diff_cleanupMerge(diffs);
      }
      diff_cleanupSemanticLossless(diffs);
      pointer = 1;
      while (pointer < diffs.length) {
        if (diffs[pointer - 1][0] == DIFF_DELETE && diffs[pointer][0] == DIFF_INSERT) {
          var deletion = diffs[pointer - 1][1];
          var insertion = diffs[pointer][1];
          var overlap_length1 = diff_commonOverlap_(deletion, insertion);
          var overlap_length2 = diff_commonOverlap_(insertion, deletion);
          if (overlap_length1 >= overlap_length2) {
            if (overlap_length1 >= deletion.length / 2 || overlap_length1 >= insertion.length / 2) {
              diffs.splice(pointer, 0, [
                DIFF_EQUAL,
                insertion.substring(0, overlap_length1)
              ]);
              diffs[pointer - 1][1] = deletion.substring(
                0,
                deletion.length - overlap_length1
              );
              diffs[pointer + 1][1] = insertion.substring(overlap_length1);
              pointer++;
            }
          } else {
            if (overlap_length2 >= deletion.length / 2 || overlap_length2 >= insertion.length / 2) {
              diffs.splice(pointer, 0, [
                DIFF_EQUAL,
                deletion.substring(0, overlap_length2)
              ]);
              diffs[pointer - 1][0] = DIFF_INSERT;
              diffs[pointer - 1][1] = insertion.substring(
                0,
                insertion.length - overlap_length2
              );
              diffs[pointer + 1][0] = DIFF_DELETE;
              diffs[pointer + 1][1] = deletion.substring(overlap_length2);
              pointer++;
            }
          }
          pointer++;
        }
        pointer++;
      }
    }
    var nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
    var whitespaceRegex_ = /\s/;
    var linebreakRegex_ = /[\r\n]/;
    var blanklineEndRegex_ = /\n\r?\n$/;
    var blanklineStartRegex_ = /^\r?\n\r?\n/;
    function diff_cleanupSemanticLossless(diffs) {
      function diff_cleanupSemanticScore_(one, two) {
        if (!one || !two) {
          return 6;
        }
        var char1 = one.charAt(one.length - 1);
        var char2 = two.charAt(0);
        var nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
        var nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
        var whitespace1 = nonAlphaNumeric1 && char1.match(whitespaceRegex_);
        var whitespace2 = nonAlphaNumeric2 && char2.match(whitespaceRegex_);
        var lineBreak1 = whitespace1 && char1.match(linebreakRegex_);
        var lineBreak2 = whitespace2 && char2.match(linebreakRegex_);
        var blankLine1 = lineBreak1 && one.match(blanklineEndRegex_);
        var blankLine2 = lineBreak2 && two.match(blanklineStartRegex_);
        if (blankLine1 || blankLine2) {
          return 5;
        } else if (lineBreak1 || lineBreak2) {
          return 4;
        } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
          return 3;
        } else if (whitespace1 || whitespace2) {
          return 2;
        } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
          return 1;
        }
        return 0;
      }
      var pointer = 1;
      while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] == DIFF_EQUAL && diffs[pointer + 1][0] == DIFF_EQUAL) {
          var equality1 = diffs[pointer - 1][1];
          var edit = diffs[pointer][1];
          var equality2 = diffs[pointer + 1][1];
          var commonOffset = diff_commonSuffix(equality1, edit);
          if (commonOffset) {
            var commonString = edit.substring(edit.length - commonOffset);
            equality1 = equality1.substring(0, equality1.length - commonOffset);
            edit = commonString + edit.substring(0, edit.length - commonOffset);
            equality2 = commonString + equality2;
          }
          var bestEquality1 = equality1;
          var bestEdit = edit;
          var bestEquality2 = equality2;
          var bestScore = diff_cleanupSemanticScore_(equality1, edit) + diff_cleanupSemanticScore_(edit, equality2);
          while (edit.charAt(0) === equality2.charAt(0)) {
            equality1 += edit.charAt(0);
            edit = edit.substring(1) + equality2.charAt(0);
            equality2 = equality2.substring(1);
            var score = diff_cleanupSemanticScore_(equality1, edit) + diff_cleanupSemanticScore_(edit, equality2);
            if (score >= bestScore) {
              bestScore = score;
              bestEquality1 = equality1;
              bestEdit = edit;
              bestEquality2 = equality2;
            }
          }
          if (diffs[pointer - 1][1] != bestEquality1) {
            if (bestEquality1) {
              diffs[pointer - 1][1] = bestEquality1;
            } else {
              diffs.splice(pointer - 1, 1);
              pointer--;
            }
            diffs[pointer][1] = bestEdit;
            if (bestEquality2) {
              diffs[pointer + 1][1] = bestEquality2;
            } else {
              diffs.splice(pointer + 1, 1);
              pointer--;
            }
          }
        }
        pointer++;
      }
    }
    function diff_cleanupMerge(diffs, fix_unicode) {
      diffs.push([DIFF_EQUAL, ""]);
      var pointer = 0;
      var count_delete = 0;
      var count_insert = 0;
      var text_delete = "";
      var text_insert = "";
      var commonlength;
      while (pointer < diffs.length) {
        if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
          diffs.splice(pointer, 1);
          continue;
        }
        switch (diffs[pointer][0]) {
          case DIFF_INSERT:
            count_insert++;
            text_insert += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_DELETE:
            count_delete++;
            text_delete += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_EQUAL:
            var previous_equality = pointer - count_insert - count_delete - 1;
            if (fix_unicode) {
              if (previous_equality >= 0 && ends_with_pair_start(diffs[previous_equality][1])) {
                var stray = diffs[previous_equality][1].slice(-1);
                diffs[previous_equality][1] = diffs[previous_equality][1].slice(
                  0,
                  -1
                );
                text_delete = stray + text_delete;
                text_insert = stray + text_insert;
                if (!diffs[previous_equality][1]) {
                  diffs.splice(previous_equality, 1);
                  pointer--;
                  var k = previous_equality - 1;
                  if (diffs[k] && diffs[k][0] === DIFF_INSERT) {
                    count_insert++;
                    text_insert = diffs[k][1] + text_insert;
                    k--;
                  }
                  if (diffs[k] && diffs[k][0] === DIFF_DELETE) {
                    count_delete++;
                    text_delete = diffs[k][1] + text_delete;
                    k--;
                  }
                  previous_equality = k;
                }
              }
              if (starts_with_pair_end(diffs[pointer][1])) {
                var stray = diffs[pointer][1].charAt(0);
                diffs[pointer][1] = diffs[pointer][1].slice(1);
                text_delete += stray;
                text_insert += stray;
              }
            }
            if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
              diffs.splice(pointer, 1);
              break;
            }
            if (text_delete.length > 0 || text_insert.length > 0) {
              if (text_delete.length > 0 && text_insert.length > 0) {
                commonlength = diff_commonPrefix(text_insert, text_delete);
                if (commonlength !== 0) {
                  if (previous_equality >= 0) {
                    diffs[previous_equality][1] += text_insert.substring(
                      0,
                      commonlength
                    );
                  } else {
                    diffs.splice(0, 0, [
                      DIFF_EQUAL,
                      text_insert.substring(0, commonlength)
                    ]);
                    pointer++;
                  }
                  text_insert = text_insert.substring(commonlength);
                  text_delete = text_delete.substring(commonlength);
                }
                commonlength = diff_commonSuffix(text_insert, text_delete);
                if (commonlength !== 0) {
                  diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
                  text_insert = text_insert.substring(
                    0,
                    text_insert.length - commonlength
                  );
                  text_delete = text_delete.substring(
                    0,
                    text_delete.length - commonlength
                  );
                }
              }
              var n = count_insert + count_delete;
              if (text_delete.length === 0 && text_insert.length === 0) {
                diffs.splice(pointer - n, n);
                pointer = pointer - n;
              } else if (text_delete.length === 0) {
                diffs.splice(pointer - n, n, [DIFF_INSERT, text_insert]);
                pointer = pointer - n + 1;
              } else if (text_insert.length === 0) {
                diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete]);
                pointer = pointer - n + 1;
              } else {
                diffs.splice(
                  pointer - n,
                  n,
                  [DIFF_DELETE, text_delete],
                  [DIFF_INSERT, text_insert]
                );
                pointer = pointer - n + 2;
              }
            }
            if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
              diffs[pointer - 1][1] += diffs[pointer][1];
              diffs.splice(pointer, 1);
            } else {
              pointer++;
            }
            count_insert = 0;
            count_delete = 0;
            text_delete = "";
            text_insert = "";
            break;
        }
      }
      if (diffs[diffs.length - 1][1] === "") {
        diffs.pop();
      }
      var changes = false;
      pointer = 1;
      while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {
          if (diffs[pointer][1].substring(
            diffs[pointer][1].length - diffs[pointer - 1][1].length
          ) === diffs[pointer - 1][1]) {
            diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(
              0,
              diffs[pointer][1].length - diffs[pointer - 1][1].length
            );
            diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
            diffs.splice(pointer - 1, 1);
            changes = true;
          } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) == diffs[pointer + 1][1]) {
            diffs[pointer - 1][1] += diffs[pointer + 1][1];
            diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
            diffs.splice(pointer + 1, 1);
            changes = true;
          }
        }
        pointer++;
      }
      if (changes) {
        diff_cleanupMerge(diffs, fix_unicode);
      }
    }
    function is_surrogate_pair_start(charCode) {
      return charCode >= 55296 && charCode <= 56319;
    }
    function is_surrogate_pair_end(charCode) {
      return charCode >= 56320 && charCode <= 57343;
    }
    function starts_with_pair_end(str) {
      return is_surrogate_pair_end(str.charCodeAt(0));
    }
    function ends_with_pair_start(str) {
      return is_surrogate_pair_start(str.charCodeAt(str.length - 1));
    }
    function remove_empty_tuples(tuples) {
      var ret = [];
      for (var i = 0; i < tuples.length; i++) {
        if (tuples[i][1].length > 0) {
          ret.push(tuples[i]);
        }
      }
      return ret;
    }
    function make_edit_splice(before, oldMiddle, newMiddle, after) {
      if (ends_with_pair_start(before) || starts_with_pair_end(after)) {
        return null;
      }
      return remove_empty_tuples([
        [DIFF_EQUAL, before],
        [DIFF_DELETE, oldMiddle],
        [DIFF_INSERT, newMiddle],
        [DIFF_EQUAL, after]
      ]);
    }
    function find_cursor_edit_diff(oldText, newText, cursor_pos) {
      var oldRange = typeof cursor_pos === "number" ? { index: cursor_pos, length: 0 } : cursor_pos.oldRange;
      var newRange = typeof cursor_pos === "number" ? null : cursor_pos.newRange;
      var oldLength = oldText.length;
      var newLength = newText.length;
      if (oldRange.length === 0 && (newRange === null || newRange.length === 0)) {
        var oldCursor = oldRange.index;
        var oldBefore = oldText.slice(0, oldCursor);
        var oldAfter = oldText.slice(oldCursor);
        var maybeNewCursor = newRange ? newRange.index : null;
        editBefore: {
          var newCursor = oldCursor + newLength - oldLength;
          if (maybeNewCursor !== null && maybeNewCursor !== newCursor) {
            break editBefore;
          }
          if (newCursor < 0 || newCursor > newLength) {
            break editBefore;
          }
          var newBefore = newText.slice(0, newCursor);
          var newAfter = newText.slice(newCursor);
          if (newAfter !== oldAfter) {
            break editBefore;
          }
          var prefixLength = Math.min(oldCursor, newCursor);
          var oldPrefix = oldBefore.slice(0, prefixLength);
          var newPrefix = newBefore.slice(0, prefixLength);
          if (oldPrefix !== newPrefix) {
            break editBefore;
          }
          var oldMiddle = oldBefore.slice(prefixLength);
          var newMiddle = newBefore.slice(prefixLength);
          return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldAfter);
        }
        editAfter: {
          if (maybeNewCursor !== null && maybeNewCursor !== oldCursor) {
            break editAfter;
          }
          var cursor = oldCursor;
          var newBefore = newText.slice(0, cursor);
          var newAfter = newText.slice(cursor);
          if (newBefore !== oldBefore) {
            break editAfter;
          }
          var suffixLength = Math.min(oldLength - cursor, newLength - cursor);
          var oldSuffix = oldAfter.slice(oldAfter.length - suffixLength);
          var newSuffix = newAfter.slice(newAfter.length - suffixLength);
          if (oldSuffix !== newSuffix) {
            break editAfter;
          }
          var oldMiddle = oldAfter.slice(0, oldAfter.length - suffixLength);
          var newMiddle = newAfter.slice(0, newAfter.length - suffixLength);
          return make_edit_splice(oldBefore, oldMiddle, newMiddle, oldSuffix);
        }
      }
      if (oldRange.length > 0 && newRange && newRange.length === 0) {
        replaceRange: {
          var oldPrefix = oldText.slice(0, oldRange.index);
          var oldSuffix = oldText.slice(oldRange.index + oldRange.length);
          var prefixLength = oldPrefix.length;
          var suffixLength = oldSuffix.length;
          if (newLength < prefixLength + suffixLength) {
            break replaceRange;
          }
          var newPrefix = newText.slice(0, prefixLength);
          var newSuffix = newText.slice(newLength - suffixLength);
          if (oldPrefix !== newPrefix || oldSuffix !== newSuffix) {
            break replaceRange;
          }
          var oldMiddle = oldText.slice(prefixLength, oldLength - suffixLength);
          var newMiddle = newText.slice(prefixLength, newLength - suffixLength);
          return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldSuffix);
        }
      }
      return null;
    }
    function diff2(text1, text2, cursor_pos, cleanup) {
      return diff_main(text1, text2, cursor_pos, cleanup, true);
    }
    diff2.INSERT = DIFF_INSERT;
    diff2.DELETE = DIFF_DELETE;
    diff2.EQUAL = DIFF_EQUAL;
    module.exports = diff2;
  }
});

// node_modules/jstoxml/dist/jstoxml.js
var require_jstoxml = __commonJS({
  "node_modules/jstoxml/dist/jstoxml.js"(exports) {
    (function(global2, factory) {
      if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
      } else if (typeof exports !== "undefined") {
        factory(exports);
      } else {
        var mod = {
          exports: {}
        };
        factory(mod.exports);
        global2.jstoxml = mod.exports;
      }
    })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports, function(_exports) {
      "use strict";
      Object.defineProperty(_exports, "__esModule", {
        value: true
      });
      _exports.toXML = _exports.default = void 0;
      function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
      }
      function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _iterableToArray(iter) {
        if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
      }
      function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr)) return _arrayLikeToArray(arr);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) {
          arr2[i] = arr[i];
        }
        return arr2;
      }
      function ownKeys(object, enumerableOnly) {
        var keys = Object.keys(object);
        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(object);
          enumerableOnly && (symbols = symbols.filter(function(sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })), keys.push.apply(keys, symbols);
        }
        return keys;
      }
      function _objectSpread(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = null != arguments[i] ? arguments[i] : {};
          i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
            _defineProperty(target, key, source[key]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
        return target;
      }
      function _defineProperty(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _typeof(obj) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
          return typeof obj2;
        } : function(obj2) {
          return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        }, _typeof(obj);
      }
      var ARRAY = "array";
      var BOOLEAN = "boolean";
      var DATE = "date";
      var NULL = "null";
      var NUMBER = "number";
      var OBJECT = "object";
      var SPECIAL_OBJECT = "special-object";
      var STRING = "string";
      var PRIVATE_VARS = ["_selfCloseTag", "_attrs"];
      var PRIVATE_VARS_REGEXP = new RegExp(PRIVATE_VARS.join("|"), "g");
      var getIndentStr = function getIndentStr2() {
        var indent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
        var depth = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
        return indent.repeat(depth);
      };
      var getType = function getType2(val) {
        return Array.isArray(val) && ARRAY || _typeof(val) === OBJECT && val !== null && val._name && SPECIAL_OBJECT || val instanceof Date && DATE || val === null && NULL || _typeof(val);
      };
      var filterStr = function filterStr2() {
        var inputStr = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
        var filter = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        if (typeof inputStr !== "string") {
          return inputStr;
        }
        var regexp = new RegExp("(".concat(Object.keys(filter).join("|"), ")(?!(\\w|#)*;)"), "g");
        return String(inputStr).replace(regexp, function(str, entity) {
          return filter[entity] || "";
        });
      };
      var getAttributeKeyVals = function getAttributeKeyVals2() {
        var attributes = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        var filter = arguments.length > 1 ? arguments[1] : void 0;
        var keyVals = [];
        if (Array.isArray(attributes)) {
          keyVals = attributes.map(function(attr) {
            var key = Object.keys(attr)[0];
            var val = attr[key];
            var filteredVal = filter ? filterStr(val, filter) : val;
            var valStr = filteredVal === true ? "" : '="'.concat(filteredVal, '"');
            return "".concat(key).concat(valStr);
          });
        } else {
          var keys = Object.keys(attributes);
          keyVals = keys.map(function(key) {
            var filteredVal = filter ? filterStr(attributes[key], filter) : attributes[key];
            var valStr = attributes[key] === true ? "" : '="'.concat(filteredVal, '"');
            return "".concat(key).concat(valStr);
          });
        }
        return keyVals;
      };
      var formatAttributes = function formatAttributes2() {
        var attributes = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        var filter = arguments.length > 1 ? arguments[1] : void 0;
        var keyVals = getAttributeKeyVals(attributes, filter);
        if (keyVals.length === 0) return "";
        var keysValsJoined = keyVals.join(" ");
        return " ".concat(keysValsJoined);
      };
      var objToArray = function objToArray2() {
        var obj = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        return Object.keys(obj).map(function(key) {
          return {
            _name: key,
            _content: obj[key]
          };
        });
      };
      var PRIMITIVE_TYPES = [STRING, NUMBER, BOOLEAN];
      var isPrimitive = function isPrimitive2(val) {
        return PRIMITIVE_TYPES.includes(getType(val));
      };
      var SIMPLE_TYPES = [].concat(PRIMITIVE_TYPES, [DATE, SPECIAL_OBJECT]);
      var isSimpleType = function isSimpleType2(val) {
        return SIMPLE_TYPES.includes(getType(val));
      };
      var isSimpleXML = function isSimpleXML2(xmlStr) {
        return !xmlStr.match("<");
      };
      var DEFAULT_XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
      var getHeaderString = function getHeaderString2(_ref) {
        var header = _ref.header, indent = _ref.indent, isOutputStart = _ref.isOutputStart;
        var shouldOutputHeader = header && isOutputStart;
        if (!shouldOutputHeader) return "";
        var shouldUseDefaultHeader = _typeof(header) === BOOLEAN;
        return shouldUseDefaultHeader ? DEFAULT_XML_HEADER : header;
      };
      var defaultEntityFilter = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;"
      };
      var toXML = function toXML2() {
        var obj = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        var config = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var _config$depth = config.depth, depth = _config$depth === void 0 ? 0 : _config$depth, indent = config.indent, _isFirstItem = config._isFirstItem, _config$_isOutputStar = config._isOutputStart, _isOutputStart = _config$_isOutputStar === void 0 ? true : _config$_isOutputStar, header = config.header, _config$attributesFil = config.attributesFilter, rawAttributesFilter = _config$attributesFil === void 0 ? {} : _config$attributesFil, _config$filter = config.filter, rawFilter = _config$filter === void 0 ? {} : _config$filter;
        var shouldTurnOffAttributesFilter = typeof rawAttributesFilter === "boolean" && !rawAttributesFilter;
        var attributesFilter = shouldTurnOffAttributesFilter ? {} : _objectSpread(_objectSpread(_objectSpread({}, defaultEntityFilter), {
          '"': "&quot;"
        }), rawAttributesFilter);
        var shouldTurnOffFilter = typeof rawFilter === "boolean" && !rawFilter;
        var filter = shouldTurnOffFilter ? {} : _objectSpread(_objectSpread({}, defaultEntityFilter), rawFilter);
        var indentStr = getIndentStr(indent, depth);
        var valType = getType(obj);
        var headerStr = getHeaderString({
          header,
          indent,
          depth,
          isOutputStart: _isOutputStart
        });
        var isOutputStart = _isOutputStart && !headerStr && _isFirstItem && depth === 0;
        var outputStr = "";
        switch (valType) {
          case "special-object": {
            var _name = obj._name, _content = obj._content;
            if (_content === null) {
              outputStr = _name;
              break;
            }
            var isArrayOfPrimitives = Array.isArray(_content) && _content.every(isPrimitive);
            if (isArrayOfPrimitives) {
              var primitives = _content.map(function(a) {
                return toXML2({
                  _name,
                  _content: a
                }, _objectSpread(_objectSpread({}, config), {}, {
                  depth,
                  _isOutputStart: false
                }));
              });
              return primitives.join("");
            }
            if (_name.match(PRIVATE_VARS_REGEXP)) break;
            var newVal = toXML2(_content, _objectSpread(_objectSpread({}, config), {}, {
              depth: depth + 1,
              _isOutputStart: isOutputStart
            }));
            var newValType = getType(newVal);
            var isNewValSimple = isSimpleXML(newVal);
            var preIndentStr = indent && !isOutputStart ? "\n" : "";
            var preTag = "".concat(preIndentStr).concat(indentStr);
            if (_name === "_comment") {
              outputStr += "".concat(preTag, "<!-- ").concat(_content, " -->");
              break;
            }
            var valIsEmpty = newValType === "undefined" || newVal === "";
            var shouldSelfClose = _typeof(obj._selfCloseTag) === BOOLEAN ? valIsEmpty && obj._selfCloseTag : valIsEmpty;
            var selfCloseStr = shouldSelfClose ? "/" : "";
            var attributesString = formatAttributes(obj._attrs, attributesFilter);
            var tag = "<".concat(_name).concat(attributesString).concat(selfCloseStr, ">");
            var preTagCloseStr = indent && !isNewValSimple ? "\n".concat(indentStr) : "";
            var postTag = !shouldSelfClose ? "".concat(newVal).concat(preTagCloseStr, "</").concat(_name, ">") : "";
            outputStr += "".concat(preTag).concat(tag).concat(postTag);
            break;
          }
          case "object": {
            var keys = Object.keys(obj);
            var outputArr = keys.map(function(key, index) {
              var newConfig = _objectSpread(_objectSpread({}, config), {}, {
                _isFirstItem: index === 0,
                _isLastItem: index + 1 === keys.length,
                _isOutputStart: isOutputStart
              });
              var outputObj = {
                _name: key
              };
              if (getType(obj[key]) === "object") {
                PRIVATE_VARS.forEach(function(privateVar) {
                  var val = obj[key][privateVar];
                  if (typeof val !== "undefined") {
                    outputObj[privateVar] = val;
                    delete obj[key][privateVar];
                  }
                });
                var hasContent = typeof obj[key]._content !== "undefined";
                if (hasContent) {
                  if (Object.keys(obj[key]).length > 1) {
                    var newContentObj = Object.assign({}, obj[key]);
                    delete newContentObj._content;
                    outputObj._content = [].concat(_toConsumableArray(objToArray(newContentObj)), [obj[key]._content]);
                  }
                }
              }
              if (typeof outputObj._content === "undefined") outputObj._content = obj[key];
              var xml = toXML2(outputObj, newConfig, key);
              return xml;
            }, config);
            outputStr = outputArr.join("");
            break;
          }
          case "function": {
            var fnResult = obj(config);
            outputStr = toXML2(fnResult, config);
            break;
          }
          case "array": {
            var _outputArr = obj.map(function(singleVal, index) {
              var newConfig = _objectSpread(_objectSpread({}, config), {}, {
                _isFirstItem: index === 0,
                _isLastItem: index + 1 === obj.length,
                _isOutputStart: isOutputStart
              });
              return toXML2(singleVal, newConfig);
            });
            outputStr = _outputArr.join("");
            break;
          }
          // number, string, boolean, date, null, etc
          default: {
            outputStr = filterStr(obj, filter);
            break;
          }
        }
        return "".concat(headerStr).concat(outputStr);
      };
      _exports.toXML = toXML;
      var _default = {
        toXML
      };
      _exports.default = _default;
    });
  }
});

// node_modules/chord-symbol/lib/chord-symbol.js
var require_chord_symbol = __commonJS({
  "node_modules/chord-symbol/lib/chord-symbol.js"(exports, module) {
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports === "object" && typeof module === "object")
        module.exports = factory();
      else if (typeof define === "function" && define.amd)
        define([], factory);
      else if (typeof exports === "object")
        exports["chord-symbol"] = factory();
      else
        root["chord-symbol"] = factory();
    })(typeof self !== "undefined" ? self : exports, function() {
      return (
        /******/
        (() => {
          var __webpack_modules__ = {
            /***/
            8552: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852), root = __webpack_require__2(5639);
                var DataView = getNative(root, "DataView");
                module2.exports = DataView;
              }
            ),
            /***/
            1989: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var hashClear = __webpack_require__2(1789), hashDelete = __webpack_require__2(401), hashGet = __webpack_require__2(7667), hashHas = __webpack_require__2(1327), hashSet = __webpack_require__2(1866);
                function Hash(entries) {
                  var index = -1, length = entries == null ? 0 : entries.length;
                  this.clear();
                  while (++index < length) {
                    var entry = entries[index];
                    this.set(entry[0], entry[1]);
                  }
                }
                Hash.prototype.clear = hashClear;
                Hash.prototype["delete"] = hashDelete;
                Hash.prototype.get = hashGet;
                Hash.prototype.has = hashHas;
                Hash.prototype.set = hashSet;
                module2.exports = Hash;
              }
            ),
            /***/
            8407: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var listCacheClear = __webpack_require__2(7040), listCacheDelete = __webpack_require__2(4125), listCacheGet = __webpack_require__2(2117), listCacheHas = __webpack_require__2(7518), listCacheSet = __webpack_require__2(4705);
                function ListCache(entries) {
                  var index = -1, length = entries == null ? 0 : entries.length;
                  this.clear();
                  while (++index < length) {
                    var entry = entries[index];
                    this.set(entry[0], entry[1]);
                  }
                }
                ListCache.prototype.clear = listCacheClear;
                ListCache.prototype["delete"] = listCacheDelete;
                ListCache.prototype.get = listCacheGet;
                ListCache.prototype.has = listCacheHas;
                ListCache.prototype.set = listCacheSet;
                module2.exports = ListCache;
              }
            ),
            /***/
            7071: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852), root = __webpack_require__2(5639);
                var Map2 = getNative(root, "Map");
                module2.exports = Map2;
              }
            ),
            /***/
            3369: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var mapCacheClear = __webpack_require__2(4785), mapCacheDelete = __webpack_require__2(1285), mapCacheGet = __webpack_require__2(6e3), mapCacheHas = __webpack_require__2(9916), mapCacheSet = __webpack_require__2(5265);
                function MapCache(entries) {
                  var index = -1, length = entries == null ? 0 : entries.length;
                  this.clear();
                  while (++index < length) {
                    var entry = entries[index];
                    this.set(entry[0], entry[1]);
                  }
                }
                MapCache.prototype.clear = mapCacheClear;
                MapCache.prototype["delete"] = mapCacheDelete;
                MapCache.prototype.get = mapCacheGet;
                MapCache.prototype.has = mapCacheHas;
                MapCache.prototype.set = mapCacheSet;
                module2.exports = MapCache;
              }
            ),
            /***/
            3818: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852), root = __webpack_require__2(5639);
                var Promise3 = getNative(root, "Promise");
                module2.exports = Promise3;
              }
            ),
            /***/
            8525: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852), root = __webpack_require__2(5639);
                var Set = getNative(root, "Set");
                module2.exports = Set;
              }
            ),
            /***/
            8668: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var MapCache = __webpack_require__2(3369), setCacheAdd = __webpack_require__2(619), setCacheHas = __webpack_require__2(2385);
                function SetCache(values) {
                  var index = -1, length = values == null ? 0 : values.length;
                  this.__data__ = new MapCache();
                  while (++index < length) {
                    this.add(values[index]);
                  }
                }
                SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
                SetCache.prototype.has = setCacheHas;
                module2.exports = SetCache;
              }
            ),
            /***/
            6384: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var ListCache = __webpack_require__2(8407), stackClear = __webpack_require__2(7465), stackDelete = __webpack_require__2(3779), stackGet = __webpack_require__2(7599), stackHas = __webpack_require__2(4758), stackSet = __webpack_require__2(4309);
                function Stack(entries) {
                  var data = this.__data__ = new ListCache(entries);
                  this.size = data.size;
                }
                Stack.prototype.clear = stackClear;
                Stack.prototype["delete"] = stackDelete;
                Stack.prototype.get = stackGet;
                Stack.prototype.has = stackHas;
                Stack.prototype.set = stackSet;
                module2.exports = Stack;
              }
            ),
            /***/
            2705: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var root = __webpack_require__2(5639);
                var Symbol2 = root.Symbol;
                module2.exports = Symbol2;
              }
            ),
            /***/
            1149: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var root = __webpack_require__2(5639);
                var Uint8Array2 = root.Uint8Array;
                module2.exports = Uint8Array2;
              }
            ),
            /***/
            577: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852), root = __webpack_require__2(5639);
                var WeakMap = getNative(root, "WeakMap");
                module2.exports = WeakMap;
              }
            ),
            /***/
            6874: (
              /***/
              (module2) => {
                function apply(func, thisArg, args) {
                  switch (args.length) {
                    case 0:
                      return func.call(thisArg);
                    case 1:
                      return func.call(thisArg, args[0]);
                    case 2:
                      return func.call(thisArg, args[0], args[1]);
                    case 3:
                      return func.call(thisArg, args[0], args[1], args[2]);
                  }
                  return func.apply(thisArg, args);
                }
                module2.exports = apply;
              }
            ),
            /***/
            7412: (
              /***/
              (module2) => {
                function arrayEach(array, iteratee) {
                  var index = -1, length = array == null ? 0 : array.length;
                  while (++index < length) {
                    if (iteratee(array[index], index, array) === false) {
                      break;
                    }
                  }
                  return array;
                }
                module2.exports = arrayEach;
              }
            ),
            /***/
            4963: (
              /***/
              (module2) => {
                function arrayFilter(array, predicate) {
                  var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
                  while (++index < length) {
                    var value = array[index];
                    if (predicate(value, index, array)) {
                      result[resIndex++] = value;
                    }
                  }
                  return result;
                }
                module2.exports = arrayFilter;
              }
            ),
            /***/
            7443: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIndexOf = __webpack_require__2(2118);
                function arrayIncludes(array, value) {
                  var length = array == null ? 0 : array.length;
                  return !!length && baseIndexOf(array, value, 0) > -1;
                }
                module2.exports = arrayIncludes;
              }
            ),
            /***/
            1196: (
              /***/
              (module2) => {
                function arrayIncludesWith(array, value, comparator) {
                  var index = -1, length = array == null ? 0 : array.length;
                  while (++index < length) {
                    if (comparator(value, array[index])) {
                      return true;
                    }
                  }
                  return false;
                }
                module2.exports = arrayIncludesWith;
              }
            ),
            /***/
            4636: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseTimes = __webpack_require__2(2545), isArguments = __webpack_require__2(5694), isArray = __webpack_require__2(1469), isBuffer = __webpack_require__2(4144), isIndex = __webpack_require__2(5776), isTypedArray = __webpack_require__2(6719);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function arrayLikeKeys(value, inherited) {
                  var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
                  for (var key in value) {
                    if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
                    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
                    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
                    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
                    isIndex(key, length)))) {
                      result.push(key);
                    }
                  }
                  return result;
                }
                module2.exports = arrayLikeKeys;
              }
            ),
            /***/
            9932: (
              /***/
              (module2) => {
                function arrayMap(array, iteratee) {
                  var index = -1, length = array == null ? 0 : array.length, result = Array(length);
                  while (++index < length) {
                    result[index] = iteratee(array[index], index, array);
                  }
                  return result;
                }
                module2.exports = arrayMap;
              }
            ),
            /***/
            2488: (
              /***/
              (module2) => {
                function arrayPush(array, values) {
                  var index = -1, length = values.length, offset = array.length;
                  while (++index < length) {
                    array[offset + index] = values[index];
                  }
                  return array;
                }
                module2.exports = arrayPush;
              }
            ),
            /***/
            2908: (
              /***/
              (module2) => {
                function arraySome(array, predicate) {
                  var index = -1, length = array == null ? 0 : array.length;
                  while (++index < length) {
                    if (predicate(array[index], index, array)) {
                      return true;
                    }
                  }
                  return false;
                }
                module2.exports = arraySome;
              }
            ),
            /***/
            4865: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseAssignValue = __webpack_require__2(9465), eq = __webpack_require__2(7813);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function assignValue(object, key, value) {
                  var objValue = object[key];
                  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
                    baseAssignValue(object, key, value);
                  }
                }
                module2.exports = assignValue;
              }
            ),
            /***/
            8470: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var eq = __webpack_require__2(7813);
                function assocIndexOf(array, key) {
                  var length = array.length;
                  while (length--) {
                    if (eq(array[length][0], key)) {
                      return length;
                    }
                  }
                  return -1;
                }
                module2.exports = assocIndexOf;
              }
            ),
            /***/
            4037: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var copyObject = __webpack_require__2(8363), keys = __webpack_require__2(3674);
                function baseAssign(object, source) {
                  return object && copyObject(source, keys(source), object);
                }
                module2.exports = baseAssign;
              }
            ),
            /***/
            3886: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var copyObject = __webpack_require__2(8363), keysIn = __webpack_require__2(1704);
                function baseAssignIn(object, source) {
                  return object && copyObject(source, keysIn(source), object);
                }
                module2.exports = baseAssignIn;
              }
            ),
            /***/
            9465: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var defineProperty = __webpack_require__2(8777);
                function baseAssignValue(object, key, value) {
                  if (key == "__proto__" && defineProperty) {
                    defineProperty(object, key, {
                      "configurable": true,
                      "enumerable": true,
                      "value": value,
                      "writable": true
                    });
                  } else {
                    object[key] = value;
                  }
                }
                module2.exports = baseAssignValue;
              }
            ),
            /***/
            5990: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Stack = __webpack_require__2(6384), arrayEach = __webpack_require__2(7412), assignValue = __webpack_require__2(4865), baseAssign = __webpack_require__2(4037), baseAssignIn = __webpack_require__2(3886), cloneBuffer = __webpack_require__2(4626), copyArray = __webpack_require__2(278), copySymbols = __webpack_require__2(8805), copySymbolsIn = __webpack_require__2(1911), getAllKeys = __webpack_require__2(8234), getAllKeysIn = __webpack_require__2(6904), getTag = __webpack_require__2(4160), initCloneArray = __webpack_require__2(3824), initCloneByTag = __webpack_require__2(9148), initCloneObject = __webpack_require__2(8517), isArray = __webpack_require__2(1469), isBuffer = __webpack_require__2(4144), isMap = __webpack_require__2(6688), isObject = __webpack_require__2(3218), isSet = __webpack_require__2(2928), keys = __webpack_require__2(3674), keysIn = __webpack_require__2(1704);
                var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
                var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", weakMapTag = "[object WeakMap]";
                var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
                var cloneableTags = {};
                cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
                cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
                function baseClone(value, bitmask, customizer, key, object, stack) {
                  var result, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
                  if (customizer) {
                    result = object ? customizer(value, key, object, stack) : customizer(value);
                  }
                  if (result !== void 0) {
                    return result;
                  }
                  if (!isObject(value)) {
                    return value;
                  }
                  var isArr = isArray(value);
                  if (isArr) {
                    result = initCloneArray(value);
                    if (!isDeep) {
                      return copyArray(value, result);
                    }
                  } else {
                    var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
                    if (isBuffer(value)) {
                      return cloneBuffer(value, isDeep);
                    }
                    if (tag == objectTag || tag == argsTag || isFunc && !object) {
                      result = isFlat || isFunc ? {} : initCloneObject(value);
                      if (!isDeep) {
                        return isFlat ? copySymbolsIn(value, baseAssignIn(result, value)) : copySymbols(value, baseAssign(result, value));
                      }
                    } else {
                      if (!cloneableTags[tag]) {
                        return object ? value : {};
                      }
                      result = initCloneByTag(value, tag, isDeep);
                    }
                  }
                  stack || (stack = new Stack());
                  var stacked = stack.get(value);
                  if (stacked) {
                    return stacked;
                  }
                  stack.set(value, result);
                  if (isSet(value)) {
                    value.forEach(function(subValue) {
                      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
                    });
                  } else if (isMap(value)) {
                    value.forEach(function(subValue, key2) {
                      result.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
                    });
                  }
                  var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys;
                  var props = isArr ? void 0 : keysFunc(value);
                  arrayEach(props || value, function(subValue, key2) {
                    if (props) {
                      key2 = subValue;
                      subValue = value[key2];
                    }
                    assignValue(result, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
                  });
                  return result;
                }
                module2.exports = baseClone;
              }
            ),
            /***/
            3118: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isObject = __webpack_require__2(3218);
                var objectCreate = Object.create;
                var baseCreate = /* @__PURE__ */ function() {
                  function object() {
                  }
                  return function(proto) {
                    if (!isObject(proto)) {
                      return {};
                    }
                    if (objectCreate) {
                      return objectCreate(proto);
                    }
                    object.prototype = proto;
                    var result = new object();
                    object.prototype = void 0;
                    return result;
                  };
                }();
                module2.exports = baseCreate;
              }
            ),
            /***/
            731: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var SetCache = __webpack_require__2(8668), arrayIncludes = __webpack_require__2(7443), arrayIncludesWith = __webpack_require__2(1196), arrayMap = __webpack_require__2(9932), baseUnary = __webpack_require__2(1717), cacheHas = __webpack_require__2(4757);
                var LARGE_ARRAY_SIZE = 200;
                function baseDifference(array, values, iteratee, comparator) {
                  var index = -1, includes = arrayIncludes, isCommon = true, length = array.length, result = [], valuesLength = values.length;
                  if (!length) {
                    return result;
                  }
                  if (iteratee) {
                    values = arrayMap(values, baseUnary(iteratee));
                  }
                  if (comparator) {
                    includes = arrayIncludesWith;
                    isCommon = false;
                  } else if (values.length >= LARGE_ARRAY_SIZE) {
                    includes = cacheHas;
                    isCommon = false;
                    values = new SetCache(values);
                  }
                  outer:
                    while (++index < length) {
                      var value = array[index], computed = iteratee == null ? value : iteratee(value);
                      value = comparator || value !== 0 ? value : 0;
                      if (isCommon && computed === computed) {
                        var valuesIndex = valuesLength;
                        while (valuesIndex--) {
                          if (values[valuesIndex] === computed) {
                            continue outer;
                          }
                        }
                        result.push(value);
                      } else if (!includes(values, computed, comparator)) {
                        result.push(value);
                      }
                    }
                  return result;
                }
                module2.exports = baseDifference;
              }
            ),
            /***/
            1848: (
              /***/
              (module2) => {
                function baseFindIndex(array, predicate, fromIndex, fromRight) {
                  var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
                  while (fromRight ? index-- : ++index < length) {
                    if (predicate(array[index], index, array)) {
                      return index;
                    }
                  }
                  return -1;
                }
                module2.exports = baseFindIndex;
              }
            ),
            /***/
            1078: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var arrayPush = __webpack_require__2(2488), isFlattenable = __webpack_require__2(7285);
                function baseFlatten(array, depth, predicate, isStrict, result) {
                  var index = -1, length = array.length;
                  predicate || (predicate = isFlattenable);
                  result || (result = []);
                  while (++index < length) {
                    var value = array[index];
                    if (depth > 0 && predicate(value)) {
                      if (depth > 1) {
                        baseFlatten(value, depth - 1, predicate, isStrict, result);
                      } else {
                        arrayPush(result, value);
                      }
                    } else if (!isStrict) {
                      result[result.length] = value;
                    }
                  }
                  return result;
                }
                module2.exports = baseFlatten;
              }
            ),
            /***/
            8483: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var createBaseFor = __webpack_require__2(5063);
                var baseFor = createBaseFor();
                module2.exports = baseFor;
              }
            ),
            /***/
            7816: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseFor = __webpack_require__2(8483), keys = __webpack_require__2(3674);
                function baseForOwn(object, iteratee) {
                  return object && baseFor(object, iteratee, keys);
                }
                module2.exports = baseForOwn;
              }
            ),
            /***/
            7786: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var castPath = __webpack_require__2(1811), toKey = __webpack_require__2(327);
                function baseGet(object, path) {
                  path = castPath(path, object);
                  var index = 0, length = path.length;
                  while (object != null && index < length) {
                    object = object[toKey(path[index++])];
                  }
                  return index && index == length ? object : void 0;
                }
                module2.exports = baseGet;
              }
            ),
            /***/
            8866: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var arrayPush = __webpack_require__2(2488), isArray = __webpack_require__2(1469);
                function baseGetAllKeys(object, keysFunc, symbolsFunc) {
                  var result = keysFunc(object);
                  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
                }
                module2.exports = baseGetAllKeys;
              }
            ),
            /***/
            4239: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Symbol2 = __webpack_require__2(2705), getRawTag = __webpack_require__2(9607), objectToString = __webpack_require__2(2333);
                var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
                var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
                function baseGetTag(value) {
                  if (value == null) {
                    return value === void 0 ? undefinedTag : nullTag;
                  }
                  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
                }
                module2.exports = baseGetTag;
              }
            ),
            /***/
            13: (
              /***/
              (module2) => {
                function baseHasIn(object, key) {
                  return object != null && key in Object(object);
                }
                module2.exports = baseHasIn;
              }
            ),
            /***/
            2118: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseFindIndex = __webpack_require__2(1848), baseIsNaN = __webpack_require__2(2722), strictIndexOf = __webpack_require__2(2351);
                function baseIndexOf(array, value, fromIndex) {
                  return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
                }
                module2.exports = baseIndexOf;
              }
            ),
            /***/
            8975: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseForOwn = __webpack_require__2(7816);
                function baseInverter(object, setter, iteratee, accumulator) {
                  baseForOwn(object, function(value, key, object2) {
                    setter(accumulator, iteratee(value), key, object2);
                  });
                  return accumulator;
                }
                module2.exports = baseInverter;
              }
            ),
            /***/
            9454: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGetTag = __webpack_require__2(4239), isObjectLike = __webpack_require__2(7005);
                var argsTag = "[object Arguments]";
                function baseIsArguments(value) {
                  return isObjectLike(value) && baseGetTag(value) == argsTag;
                }
                module2.exports = baseIsArguments;
              }
            ),
            /***/
            939: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsEqualDeep = __webpack_require__2(2492), isObjectLike = __webpack_require__2(7005);
                function baseIsEqual(value, other, bitmask, customizer, stack) {
                  if (value === other) {
                    return true;
                  }
                  if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
                    return value !== value && other !== other;
                  }
                  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
                }
                module2.exports = baseIsEqual;
              }
            ),
            /***/
            2492: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Stack = __webpack_require__2(6384), equalArrays = __webpack_require__2(7114), equalByTag = __webpack_require__2(8351), equalObjects = __webpack_require__2(6096), getTag = __webpack_require__2(4160), isArray = __webpack_require__2(1469), isBuffer = __webpack_require__2(4144), isTypedArray = __webpack_require__2(6719);
                var COMPARE_PARTIAL_FLAG = 1;
                var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
                  var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
                  objTag = objTag == argsTag ? objectTag : objTag;
                  othTag = othTag == argsTag ? objectTag : othTag;
                  var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
                  if (isSameTag && isBuffer(object)) {
                    if (!isBuffer(other)) {
                      return false;
                    }
                    objIsArr = true;
                    objIsObj = false;
                  }
                  if (isSameTag && !objIsObj) {
                    stack || (stack = new Stack());
                    return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
                  }
                  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
                    var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
                    if (objIsWrapped || othIsWrapped) {
                      var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
                      stack || (stack = new Stack());
                      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
                    }
                  }
                  if (!isSameTag) {
                    return false;
                  }
                  stack || (stack = new Stack());
                  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
                }
                module2.exports = baseIsEqualDeep;
              }
            ),
            /***/
            5588: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getTag = __webpack_require__2(4160), isObjectLike = __webpack_require__2(7005);
                var mapTag = "[object Map]";
                function baseIsMap(value) {
                  return isObjectLike(value) && getTag(value) == mapTag;
                }
                module2.exports = baseIsMap;
              }
            ),
            /***/
            2958: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Stack = __webpack_require__2(6384), baseIsEqual = __webpack_require__2(939);
                var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
                function baseIsMatch(object, source, matchData, customizer) {
                  var index = matchData.length, length = index, noCustomizer = !customizer;
                  if (object == null) {
                    return !length;
                  }
                  object = Object(object);
                  while (index--) {
                    var data = matchData[index];
                    if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
                      return false;
                    }
                  }
                  while (++index < length) {
                    data = matchData[index];
                    var key = data[0], objValue = object[key], srcValue = data[1];
                    if (noCustomizer && data[2]) {
                      if (objValue === void 0 && !(key in object)) {
                        return false;
                      }
                    } else {
                      var stack = new Stack();
                      if (customizer) {
                        var result = customizer(objValue, srcValue, key, object, source, stack);
                      }
                      if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
                        return false;
                      }
                    }
                  }
                  return true;
                }
                module2.exports = baseIsMatch;
              }
            ),
            /***/
            2722: (
              /***/
              (module2) => {
                function baseIsNaN(value) {
                  return value !== value;
                }
                module2.exports = baseIsNaN;
              }
            ),
            /***/
            8458: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isFunction = __webpack_require__2(3560), isMasked = __webpack_require__2(5346), isObject = __webpack_require__2(3218), toSource = __webpack_require__2(346);
                var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
                var reIsHostCtor = /^\[object .+?Constructor\]$/;
                var funcProto = Function.prototype, objectProto = Object.prototype;
                var funcToString = funcProto.toString;
                var hasOwnProperty = objectProto.hasOwnProperty;
                var reIsNative = RegExp(
                  "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
                );
                function baseIsNative(value) {
                  if (!isObject(value) || isMasked(value)) {
                    return false;
                  }
                  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
                  return pattern.test(toSource(value));
                }
                module2.exports = baseIsNative;
              }
            ),
            /***/
            9221: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getTag = __webpack_require__2(4160), isObjectLike = __webpack_require__2(7005);
                var setTag = "[object Set]";
                function baseIsSet(value) {
                  return isObjectLike(value) && getTag(value) == setTag;
                }
                module2.exports = baseIsSet;
              }
            ),
            /***/
            8749: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGetTag = __webpack_require__2(4239), isLength = __webpack_require__2(1780), isObjectLike = __webpack_require__2(7005);
                var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", weakMapTag = "[object WeakMap]";
                var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
                var typedArrayTags = {};
                typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
                typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
                function baseIsTypedArray(value) {
                  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
                }
                module2.exports = baseIsTypedArray;
              }
            ),
            /***/
            7206: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseMatches = __webpack_require__2(1573), baseMatchesProperty = __webpack_require__2(6432), identity = __webpack_require__2(6557), isArray = __webpack_require__2(1469), property = __webpack_require__2(9601);
                function baseIteratee(value) {
                  if (typeof value == "function") {
                    return value;
                  }
                  if (value == null) {
                    return identity;
                  }
                  if (typeof value == "object") {
                    return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
                  }
                  return property(value);
                }
                module2.exports = baseIteratee;
              }
            ),
            /***/
            280: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isPrototype = __webpack_require__2(5726), nativeKeys = __webpack_require__2(6916);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function baseKeys(object) {
                  if (!isPrototype(object)) {
                    return nativeKeys(object);
                  }
                  var result = [];
                  for (var key in Object(object)) {
                    if (hasOwnProperty.call(object, key) && key != "constructor") {
                      result.push(key);
                    }
                  }
                  return result;
                }
                module2.exports = baseKeys;
              }
            ),
            /***/
            313: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isObject = __webpack_require__2(3218), isPrototype = __webpack_require__2(5726), nativeKeysIn = __webpack_require__2(3498);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function baseKeysIn(object) {
                  if (!isObject(object)) {
                    return nativeKeysIn(object);
                  }
                  var isProto = isPrototype(object), result = [];
                  for (var key in object) {
                    if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
                      result.push(key);
                    }
                  }
                  return result;
                }
                module2.exports = baseKeysIn;
              }
            ),
            /***/
            1573: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsMatch = __webpack_require__2(2958), getMatchData = __webpack_require__2(1499), matchesStrictComparable = __webpack_require__2(2634);
                function baseMatches(source) {
                  var matchData = getMatchData(source);
                  if (matchData.length == 1 && matchData[0][2]) {
                    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
                  }
                  return function(object) {
                    return object === source || baseIsMatch(object, source, matchData);
                  };
                }
                module2.exports = baseMatches;
              }
            ),
            /***/
            6432: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsEqual = __webpack_require__2(939), get = __webpack_require__2(7361), hasIn = __webpack_require__2(9095), isKey = __webpack_require__2(5403), isStrictComparable = __webpack_require__2(9162), matchesStrictComparable = __webpack_require__2(2634), toKey = __webpack_require__2(327);
                var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
                function baseMatchesProperty(path, srcValue) {
                  if (isKey(path) && isStrictComparable(srcValue)) {
                    return matchesStrictComparable(toKey(path), srcValue);
                  }
                  return function(object) {
                    var objValue = get(object, path);
                    return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
                  };
                }
                module2.exports = baseMatchesProperty;
              }
            ),
            /***/
            371: (
              /***/
              (module2) => {
                function baseProperty(key) {
                  return function(object) {
                    return object == null ? void 0 : object[key];
                  };
                }
                module2.exports = baseProperty;
              }
            ),
            /***/
            9152: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGet = __webpack_require__2(7786);
                function basePropertyDeep(path) {
                  return function(object) {
                    return baseGet(object, path);
                  };
                }
                module2.exports = basePropertyDeep;
              }
            ),
            /***/
            5976: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var identity = __webpack_require__2(6557), overRest = __webpack_require__2(5357), setToString = __webpack_require__2(61);
                function baseRest(func, start) {
                  return setToString(overRest(func, start, identity), func + "");
                }
                module2.exports = baseRest;
              }
            ),
            /***/
            6560: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var constant = __webpack_require__2(5703), defineProperty = __webpack_require__2(8777), identity = __webpack_require__2(6557);
                var baseSetToString = !defineProperty ? identity : function(func, string) {
                  return defineProperty(func, "toString", {
                    "configurable": true,
                    "enumerable": false,
                    "value": constant(string),
                    "writable": true
                  });
                };
                module2.exports = baseSetToString;
              }
            ),
            /***/
            2545: (
              /***/
              (module2) => {
                function baseTimes(n, iteratee) {
                  var index = -1, result = Array(n);
                  while (++index < n) {
                    result[index] = iteratee(index);
                  }
                  return result;
                }
                module2.exports = baseTimes;
              }
            ),
            /***/
            531: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Symbol2 = __webpack_require__2(2705), arrayMap = __webpack_require__2(9932), isArray = __webpack_require__2(1469), isSymbol = __webpack_require__2(3448);
                var INFINITY = 1 / 0;
                var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
                function baseToString(value) {
                  if (typeof value == "string") {
                    return value;
                  }
                  if (isArray(value)) {
                    return arrayMap(value, baseToString) + "";
                  }
                  if (isSymbol(value)) {
                    return symbolToString ? symbolToString.call(value) : "";
                  }
                  var result = value + "";
                  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
                }
                module2.exports = baseToString;
              }
            ),
            /***/
            7561: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var trimmedEndIndex = __webpack_require__2(7990);
                var reTrimStart = /^\s+/;
                function baseTrim(string) {
                  return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
                }
                module2.exports = baseTrim;
              }
            ),
            /***/
            1717: (
              /***/
              (module2) => {
                function baseUnary(func) {
                  return function(value) {
                    return func(value);
                  };
                }
                module2.exports = baseUnary;
              }
            ),
            /***/
            5652: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var SetCache = __webpack_require__2(8668), arrayIncludes = __webpack_require__2(7443), arrayIncludesWith = __webpack_require__2(1196), cacheHas = __webpack_require__2(4757), createSet = __webpack_require__2(3593), setToArray = __webpack_require__2(1814);
                var LARGE_ARRAY_SIZE = 200;
                function baseUniq(array, iteratee, comparator) {
                  var index = -1, includes = arrayIncludes, length = array.length, isCommon = true, result = [], seen = result;
                  if (comparator) {
                    isCommon = false;
                    includes = arrayIncludesWith;
                  } else if (length >= LARGE_ARRAY_SIZE) {
                    var set = iteratee ? null : createSet(array);
                    if (set) {
                      return setToArray(set);
                    }
                    isCommon = false;
                    includes = cacheHas;
                    seen = new SetCache();
                  } else {
                    seen = iteratee ? [] : result;
                  }
                  outer:
                    while (++index < length) {
                      var value = array[index], computed = iteratee ? iteratee(value) : value;
                      value = comparator || value !== 0 ? value : 0;
                      if (isCommon && computed === computed) {
                        var seenIndex = seen.length;
                        while (seenIndex--) {
                          if (seen[seenIndex] === computed) {
                            continue outer;
                          }
                        }
                        if (iteratee) {
                          seen.push(computed);
                        }
                        result.push(value);
                      } else if (!includes(seen, computed, comparator)) {
                        if (seen !== result) {
                          seen.push(computed);
                        }
                        result.push(value);
                      }
                    }
                  return result;
                }
                module2.exports = baseUniq;
              }
            ),
            /***/
            4757: (
              /***/
              (module2) => {
                function cacheHas(cache, key) {
                  return cache.has(key);
                }
                module2.exports = cacheHas;
              }
            ),
            /***/
            1811: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isArray = __webpack_require__2(1469), isKey = __webpack_require__2(5403), stringToPath = __webpack_require__2(5514), toString = __webpack_require__2(9833);
                function castPath(value, object) {
                  if (isArray(value)) {
                    return value;
                  }
                  return isKey(value, object) ? [value] : stringToPath(toString(value));
                }
                module2.exports = castPath;
              }
            ),
            /***/
            4318: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Uint8Array2 = __webpack_require__2(1149);
                function cloneArrayBuffer(arrayBuffer) {
                  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
                  new Uint8Array2(result).set(new Uint8Array2(arrayBuffer));
                  return result;
                }
                module2.exports = cloneArrayBuffer;
              }
            ),
            /***/
            4626: (
              /***/
              (module2, exports2, __webpack_require__2) => {
                module2 = __webpack_require__2.nmd(module2);
                var root = __webpack_require__2(5639);
                var freeExports = exports2 && !exports2.nodeType && exports2;
                var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
                var moduleExports = freeModule && freeModule.exports === freeExports;
                var Buffer2 = moduleExports ? root.Buffer : void 0, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : void 0;
                function cloneBuffer(buffer, isDeep) {
                  if (isDeep) {
                    return buffer.slice();
                  }
                  var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
                  buffer.copy(result);
                  return result;
                }
                module2.exports = cloneBuffer;
              }
            ),
            /***/
            7157: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var cloneArrayBuffer = __webpack_require__2(4318);
                function cloneDataView(dataView, isDeep) {
                  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
                  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
                }
                module2.exports = cloneDataView;
              }
            ),
            /***/
            3147: (
              /***/
              (module2) => {
                var reFlags = /\w*$/;
                function cloneRegExp(regexp) {
                  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
                  result.lastIndex = regexp.lastIndex;
                  return result;
                }
                module2.exports = cloneRegExp;
              }
            ),
            /***/
            419: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Symbol2 = __webpack_require__2(2705);
                var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
                function cloneSymbol(symbol) {
                  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
                }
                module2.exports = cloneSymbol;
              }
            ),
            /***/
            7133: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var cloneArrayBuffer = __webpack_require__2(4318);
                function cloneTypedArray(typedArray, isDeep) {
                  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
                  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
                }
                module2.exports = cloneTypedArray;
              }
            ),
            /***/
            278: (
              /***/
              (module2) => {
                function copyArray(source, array) {
                  var index = -1, length = source.length;
                  array || (array = Array(length));
                  while (++index < length) {
                    array[index] = source[index];
                  }
                  return array;
                }
                module2.exports = copyArray;
              }
            ),
            /***/
            8363: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var assignValue = __webpack_require__2(4865), baseAssignValue = __webpack_require__2(9465);
                function copyObject(source, props, object, customizer) {
                  var isNew = !object;
                  object || (object = {});
                  var index = -1, length = props.length;
                  while (++index < length) {
                    var key = props[index];
                    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
                    if (newValue === void 0) {
                      newValue = source[key];
                    }
                    if (isNew) {
                      baseAssignValue(object, key, newValue);
                    } else {
                      assignValue(object, key, newValue);
                    }
                  }
                  return object;
                }
                module2.exports = copyObject;
              }
            ),
            /***/
            8805: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var copyObject = __webpack_require__2(8363), getSymbols = __webpack_require__2(9551);
                function copySymbols(source, object) {
                  return copyObject(source, getSymbols(source), object);
                }
                module2.exports = copySymbols;
              }
            ),
            /***/
            1911: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var copyObject = __webpack_require__2(8363), getSymbolsIn = __webpack_require__2(1442);
                function copySymbolsIn(source, object) {
                  return copyObject(source, getSymbolsIn(source), object);
                }
                module2.exports = copySymbolsIn;
              }
            ),
            /***/
            4429: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var root = __webpack_require__2(5639);
                var coreJsData = root["__core-js_shared__"];
                module2.exports = coreJsData;
              }
            ),
            /***/
            5063: (
              /***/
              (module2) => {
                function createBaseFor(fromRight) {
                  return function(object, iteratee, keysFunc) {
                    var index = -1, iterable = Object(object), props = keysFunc(object), length = props.length;
                    while (length--) {
                      var key = props[fromRight ? length : ++index];
                      if (iteratee(iterable[key], key, iterable) === false) {
                        break;
                      }
                    }
                    return object;
                  };
                }
                module2.exports = createBaseFor;
              }
            ),
            /***/
            7740: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIteratee = __webpack_require__2(7206), isArrayLike = __webpack_require__2(8612), keys = __webpack_require__2(3674);
                function createFind(findIndexFunc) {
                  return function(collection, predicate, fromIndex) {
                    var iterable = Object(collection);
                    if (!isArrayLike(collection)) {
                      var iteratee = baseIteratee(predicate, 3);
                      collection = keys(collection);
                      predicate = function(key) {
                        return iteratee(iterable[key], key, iterable);
                      };
                    }
                    var index = findIndexFunc(collection, predicate, fromIndex);
                    return index > -1 ? iterable[iteratee ? collection[index] : index] : void 0;
                  };
                }
                module2.exports = createFind;
              }
            ),
            /***/
            7779: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseInverter = __webpack_require__2(8975);
                function createInverter(setter, toIteratee) {
                  return function(object, iteratee) {
                    return baseInverter(object, setter, toIteratee(iteratee), {});
                  };
                }
                module2.exports = createInverter;
              }
            ),
            /***/
            3593: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Set = __webpack_require__2(8525), noop = __webpack_require__2(308), setToArray = __webpack_require__2(1814);
                var INFINITY = 1 / 0;
                var createSet = !(Set && 1 / setToArray(new Set([, -0]))[1] == INFINITY) ? noop : function(values) {
                  return new Set(values);
                };
                module2.exports = createSet;
              }
            ),
            /***/
            8777: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852);
                var defineProperty = function() {
                  try {
                    var func = getNative(Object, "defineProperty");
                    func({}, "", {});
                    return func;
                  } catch (e) {
                  }
                }();
                module2.exports = defineProperty;
              }
            ),
            /***/
            7114: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var SetCache = __webpack_require__2(8668), arraySome = __webpack_require__2(2908), cacheHas = __webpack_require__2(4757);
                var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
                function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
                  var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
                  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
                    return false;
                  }
                  var arrStacked = stack.get(array);
                  var othStacked = stack.get(other);
                  if (arrStacked && othStacked) {
                    return arrStacked == other && othStacked == array;
                  }
                  var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
                  stack.set(array, other);
                  stack.set(other, array);
                  while (++index < arrLength) {
                    var arrValue = array[index], othValue = other[index];
                    if (customizer) {
                      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
                    }
                    if (compared !== void 0) {
                      if (compared) {
                        continue;
                      }
                      result = false;
                      break;
                    }
                    if (seen) {
                      if (!arraySome(other, function(othValue2, othIndex) {
                        if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                          return seen.push(othIndex);
                        }
                      })) {
                        result = false;
                        break;
                      }
                    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                      result = false;
                      break;
                    }
                  }
                  stack["delete"](array);
                  stack["delete"](other);
                  return result;
                }
                module2.exports = equalArrays;
              }
            ),
            /***/
            8351: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Symbol2 = __webpack_require__2(2705), Uint8Array2 = __webpack_require__2(1149), eq = __webpack_require__2(7813), equalArrays = __webpack_require__2(7114), mapToArray = __webpack_require__2(8776), setToArray = __webpack_require__2(1814);
                var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
                var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
                var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]";
                var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
                function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
                  switch (tag) {
                    case dataViewTag:
                      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
                        return false;
                      }
                      object = object.buffer;
                      other = other.buffer;
                    case arrayBufferTag:
                      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
                        return false;
                      }
                      return true;
                    case boolTag:
                    case dateTag:
                    case numberTag:
                      return eq(+object, +other);
                    case errorTag:
                      return object.name == other.name && object.message == other.message;
                    case regexpTag:
                    case stringTag:
                      return object == other + "";
                    case mapTag:
                      var convert2 = mapToArray;
                    case setTag:
                      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
                      convert2 || (convert2 = setToArray);
                      if (object.size != other.size && !isPartial) {
                        return false;
                      }
                      var stacked = stack.get(object);
                      if (stacked) {
                        return stacked == other;
                      }
                      bitmask |= COMPARE_UNORDERED_FLAG;
                      stack.set(object, other);
                      var result = equalArrays(convert2(object), convert2(other), bitmask, customizer, equalFunc, stack);
                      stack["delete"](object);
                      return result;
                    case symbolTag:
                      if (symbolValueOf) {
                        return symbolValueOf.call(object) == symbolValueOf.call(other);
                      }
                  }
                  return false;
                }
                module2.exports = equalByTag;
              }
            ),
            /***/
            6096: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getAllKeys = __webpack_require__2(8234);
                var COMPARE_PARTIAL_FLAG = 1;
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
                  var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
                  if (objLength != othLength && !isPartial) {
                    return false;
                  }
                  var index = objLength;
                  while (index--) {
                    var key = objProps[index];
                    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
                      return false;
                    }
                  }
                  var objStacked = stack.get(object);
                  var othStacked = stack.get(other);
                  if (objStacked && othStacked) {
                    return objStacked == other && othStacked == object;
                  }
                  var result = true;
                  stack.set(object, other);
                  stack.set(other, object);
                  var skipCtor = isPartial;
                  while (++index < objLength) {
                    key = objProps[index];
                    var objValue = object[key], othValue = other[key];
                    if (customizer) {
                      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
                    }
                    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
                      result = false;
                      break;
                    }
                    skipCtor || (skipCtor = key == "constructor");
                  }
                  if (result && !skipCtor) {
                    var objCtor = object.constructor, othCtor = other.constructor;
                    if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
                      result = false;
                    }
                  }
                  stack["delete"](object);
                  stack["delete"](other);
                  return result;
                }
                module2.exports = equalObjects;
              }
            ),
            /***/
            1957: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var freeGlobal = typeof __webpack_require__2.g == "object" && __webpack_require__2.g && __webpack_require__2.g.Object === Object && __webpack_require__2.g;
                module2.exports = freeGlobal;
              }
            ),
            /***/
            8234: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGetAllKeys = __webpack_require__2(8866), getSymbols = __webpack_require__2(9551), keys = __webpack_require__2(3674);
                function getAllKeys(object) {
                  return baseGetAllKeys(object, keys, getSymbols);
                }
                module2.exports = getAllKeys;
              }
            ),
            /***/
            6904: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGetAllKeys = __webpack_require__2(8866), getSymbolsIn = __webpack_require__2(1442), keysIn = __webpack_require__2(1704);
                function getAllKeysIn(object) {
                  return baseGetAllKeys(object, keysIn, getSymbolsIn);
                }
                module2.exports = getAllKeysIn;
              }
            ),
            /***/
            5050: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isKeyable = __webpack_require__2(7019);
                function getMapData(map, key) {
                  var data = map.__data__;
                  return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
                }
                module2.exports = getMapData;
              }
            ),
            /***/
            1499: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isStrictComparable = __webpack_require__2(9162), keys = __webpack_require__2(3674);
                function getMatchData(object) {
                  var result = keys(object), length = result.length;
                  while (length--) {
                    var key = result[length], value = object[key];
                    result[length] = [key, value, isStrictComparable(value)];
                  }
                  return result;
                }
                module2.exports = getMatchData;
              }
            ),
            /***/
            852: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsNative = __webpack_require__2(8458), getValue = __webpack_require__2(7801);
                function getNative(object, key) {
                  var value = getValue(object, key);
                  return baseIsNative(value) ? value : void 0;
                }
                module2.exports = getNative;
              }
            ),
            /***/
            5924: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var overArg = __webpack_require__2(5569);
                var getPrototype = overArg(Object.getPrototypeOf, Object);
                module2.exports = getPrototype;
              }
            ),
            /***/
            9607: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Symbol2 = __webpack_require__2(2705);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                var nativeObjectToString = objectProto.toString;
                var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
                function getRawTag(value) {
                  var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
                  try {
                    value[symToStringTag] = void 0;
                    var unmasked = true;
                  } catch (e) {
                  }
                  var result = nativeObjectToString.call(value);
                  if (unmasked) {
                    if (isOwn) {
                      value[symToStringTag] = tag;
                    } else {
                      delete value[symToStringTag];
                    }
                  }
                  return result;
                }
                module2.exports = getRawTag;
              }
            ),
            /***/
            9551: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var arrayFilter = __webpack_require__2(4963), stubArray = __webpack_require__2(479);
                var objectProto = Object.prototype;
                var propertyIsEnumerable = objectProto.propertyIsEnumerable;
                var nativeGetSymbols = Object.getOwnPropertySymbols;
                var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
                  if (object == null) {
                    return [];
                  }
                  object = Object(object);
                  return arrayFilter(nativeGetSymbols(object), function(symbol) {
                    return propertyIsEnumerable.call(object, symbol);
                  });
                };
                module2.exports = getSymbols;
              }
            ),
            /***/
            1442: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var arrayPush = __webpack_require__2(2488), getPrototype = __webpack_require__2(5924), getSymbols = __webpack_require__2(9551), stubArray = __webpack_require__2(479);
                var nativeGetSymbols = Object.getOwnPropertySymbols;
                var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
                  var result = [];
                  while (object) {
                    arrayPush(result, getSymbols(object));
                    object = getPrototype(object);
                  }
                  return result;
                };
                module2.exports = getSymbolsIn;
              }
            ),
            /***/
            4160: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var DataView = __webpack_require__2(8552), Map2 = __webpack_require__2(7071), Promise3 = __webpack_require__2(3818), Set = __webpack_require__2(8525), WeakMap = __webpack_require__2(577), baseGetTag = __webpack_require__2(4239), toSource = __webpack_require__2(346);
                var mapTag = "[object Map]", objectTag = "[object Object]", promiseTag = "[object Promise]", setTag = "[object Set]", weakMapTag = "[object WeakMap]";
                var dataViewTag = "[object DataView]";
                var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise3), setCtorString = toSource(Set), weakMapCtorString = toSource(WeakMap);
                var getTag = baseGetTag;
                if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise3 && getTag(Promise3.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
                  getTag = function(value) {
                    var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
                    if (ctorString) {
                      switch (ctorString) {
                        case dataViewCtorString:
                          return dataViewTag;
                        case mapCtorString:
                          return mapTag;
                        case promiseCtorString:
                          return promiseTag;
                        case setCtorString:
                          return setTag;
                        case weakMapCtorString:
                          return weakMapTag;
                      }
                    }
                    return result;
                  };
                }
                module2.exports = getTag;
              }
            ),
            /***/
            7801: (
              /***/
              (module2) => {
                function getValue(object, key) {
                  return object == null ? void 0 : object[key];
                }
                module2.exports = getValue;
              }
            ),
            /***/
            222: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var castPath = __webpack_require__2(1811), isArguments = __webpack_require__2(5694), isArray = __webpack_require__2(1469), isIndex = __webpack_require__2(5776), isLength = __webpack_require__2(1780), toKey = __webpack_require__2(327);
                function hasPath(object, path, hasFunc) {
                  path = castPath(path, object);
                  var index = -1, length = path.length, result = false;
                  while (++index < length) {
                    var key = toKey(path[index]);
                    if (!(result = object != null && hasFunc(object, key))) {
                      break;
                    }
                    object = object[key];
                  }
                  if (result || ++index != length) {
                    return result;
                  }
                  length = object == null ? 0 : object.length;
                  return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
                }
                module2.exports = hasPath;
              }
            ),
            /***/
            1789: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var nativeCreate = __webpack_require__2(4536);
                function hashClear() {
                  this.__data__ = nativeCreate ? nativeCreate(null) : {};
                  this.size = 0;
                }
                module2.exports = hashClear;
              }
            ),
            /***/
            401: (
              /***/
              (module2) => {
                function hashDelete(key) {
                  var result = this.has(key) && delete this.__data__[key];
                  this.size -= result ? 1 : 0;
                  return result;
                }
                module2.exports = hashDelete;
              }
            ),
            /***/
            7667: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var nativeCreate = __webpack_require__2(4536);
                var HASH_UNDEFINED = "__lodash_hash_undefined__";
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function hashGet(key) {
                  var data = this.__data__;
                  if (nativeCreate) {
                    var result = data[key];
                    return result === HASH_UNDEFINED ? void 0 : result;
                  }
                  return hasOwnProperty.call(data, key) ? data[key] : void 0;
                }
                module2.exports = hashGet;
              }
            ),
            /***/
            1327: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var nativeCreate = __webpack_require__2(4536);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function hashHas(key) {
                  var data = this.__data__;
                  return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
                }
                module2.exports = hashHas;
              }
            ),
            /***/
            1866: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var nativeCreate = __webpack_require__2(4536);
                var HASH_UNDEFINED = "__lodash_hash_undefined__";
                function hashSet(key, value) {
                  var data = this.__data__;
                  this.size += this.has(key) ? 0 : 1;
                  data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
                  return this;
                }
                module2.exports = hashSet;
              }
            ),
            /***/
            3824: (
              /***/
              (module2) => {
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                function initCloneArray(array) {
                  var length = array.length, result = new array.constructor(length);
                  if (length && typeof array[0] == "string" && hasOwnProperty.call(array, "index")) {
                    result.index = array.index;
                    result.input = array.input;
                  }
                  return result;
                }
                module2.exports = initCloneArray;
              }
            ),
            /***/
            9148: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var cloneArrayBuffer = __webpack_require__2(4318), cloneDataView = __webpack_require__2(7157), cloneRegExp = __webpack_require__2(3147), cloneSymbol = __webpack_require__2(419), cloneTypedArray = __webpack_require__2(7133);
                var boolTag = "[object Boolean]", dateTag = "[object Date]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
                var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
                function initCloneByTag(object, tag, isDeep) {
                  var Ctor = object.constructor;
                  switch (tag) {
                    case arrayBufferTag:
                      return cloneArrayBuffer(object);
                    case boolTag:
                    case dateTag:
                      return new Ctor(+object);
                    case dataViewTag:
                      return cloneDataView(object, isDeep);
                    case float32Tag:
                    case float64Tag:
                    case int8Tag:
                    case int16Tag:
                    case int32Tag:
                    case uint8Tag:
                    case uint8ClampedTag:
                    case uint16Tag:
                    case uint32Tag:
                      return cloneTypedArray(object, isDeep);
                    case mapTag:
                      return new Ctor();
                    case numberTag:
                    case stringTag:
                      return new Ctor(object);
                    case regexpTag:
                      return cloneRegExp(object);
                    case setTag:
                      return new Ctor();
                    case symbolTag:
                      return cloneSymbol(object);
                  }
                }
                module2.exports = initCloneByTag;
              }
            ),
            /***/
            8517: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseCreate = __webpack_require__2(3118), getPrototype = __webpack_require__2(5924), isPrototype = __webpack_require__2(5726);
                function initCloneObject(object) {
                  return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
                }
                module2.exports = initCloneObject;
              }
            ),
            /***/
            7285: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Symbol2 = __webpack_require__2(2705), isArguments = __webpack_require__2(5694), isArray = __webpack_require__2(1469);
                var spreadableSymbol = Symbol2 ? Symbol2.isConcatSpreadable : void 0;
                function isFlattenable(value) {
                  return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
                }
                module2.exports = isFlattenable;
              }
            ),
            /***/
            5776: (
              /***/
              (module2) => {
                var MAX_SAFE_INTEGER = 9007199254740991;
                var reIsUint = /^(?:0|[1-9]\d*)$/;
                function isIndex(value, length) {
                  var type = typeof value;
                  length = length == null ? MAX_SAFE_INTEGER : length;
                  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
                }
                module2.exports = isIndex;
              }
            ),
            /***/
            5403: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isArray = __webpack_require__2(1469), isSymbol = __webpack_require__2(3448);
                var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
                function isKey(value, object) {
                  if (isArray(value)) {
                    return false;
                  }
                  var type = typeof value;
                  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
                    return true;
                  }
                  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
                }
                module2.exports = isKey;
              }
            ),
            /***/
            7019: (
              /***/
              (module2) => {
                function isKeyable(value) {
                  var type = typeof value;
                  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
                }
                module2.exports = isKeyable;
              }
            ),
            /***/
            5346: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var coreJsData = __webpack_require__2(4429);
                var maskSrcKey = function() {
                  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
                  return uid ? "Symbol(src)_1." + uid : "";
                }();
                function isMasked(func) {
                  return !!maskSrcKey && maskSrcKey in func;
                }
                module2.exports = isMasked;
              }
            ),
            /***/
            5726: (
              /***/
              (module2) => {
                var objectProto = Object.prototype;
                function isPrototype(value) {
                  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
                  return value === proto;
                }
                module2.exports = isPrototype;
              }
            ),
            /***/
            9162: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isObject = __webpack_require__2(3218);
                function isStrictComparable(value) {
                  return value === value && !isObject(value);
                }
                module2.exports = isStrictComparable;
              }
            ),
            /***/
            7040: (
              /***/
              (module2) => {
                function listCacheClear() {
                  this.__data__ = [];
                  this.size = 0;
                }
                module2.exports = listCacheClear;
              }
            ),
            /***/
            4125: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var assocIndexOf = __webpack_require__2(8470);
                var arrayProto = Array.prototype;
                var splice = arrayProto.splice;
                function listCacheDelete(key) {
                  var data = this.__data__, index = assocIndexOf(data, key);
                  if (index < 0) {
                    return false;
                  }
                  var lastIndex = data.length - 1;
                  if (index == lastIndex) {
                    data.pop();
                  } else {
                    splice.call(data, index, 1);
                  }
                  --this.size;
                  return true;
                }
                module2.exports = listCacheDelete;
              }
            ),
            /***/
            2117: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var assocIndexOf = __webpack_require__2(8470);
                function listCacheGet(key) {
                  var data = this.__data__, index = assocIndexOf(data, key);
                  return index < 0 ? void 0 : data[index][1];
                }
                module2.exports = listCacheGet;
              }
            ),
            /***/
            7518: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var assocIndexOf = __webpack_require__2(8470);
                function listCacheHas(key) {
                  return assocIndexOf(this.__data__, key) > -1;
                }
                module2.exports = listCacheHas;
              }
            ),
            /***/
            4705: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var assocIndexOf = __webpack_require__2(8470);
                function listCacheSet(key, value) {
                  var data = this.__data__, index = assocIndexOf(data, key);
                  if (index < 0) {
                    ++this.size;
                    data.push([key, value]);
                  } else {
                    data[index][1] = value;
                  }
                  return this;
                }
                module2.exports = listCacheSet;
              }
            ),
            /***/
            4785: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var Hash = __webpack_require__2(1989), ListCache = __webpack_require__2(8407), Map2 = __webpack_require__2(7071);
                function mapCacheClear() {
                  this.size = 0;
                  this.__data__ = {
                    "hash": new Hash(),
                    "map": new (Map2 || ListCache)(),
                    "string": new Hash()
                  };
                }
                module2.exports = mapCacheClear;
              }
            ),
            /***/
            1285: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getMapData = __webpack_require__2(5050);
                function mapCacheDelete(key) {
                  var result = getMapData(this, key)["delete"](key);
                  this.size -= result ? 1 : 0;
                  return result;
                }
                module2.exports = mapCacheDelete;
              }
            ),
            /***/
            6e3: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getMapData = __webpack_require__2(5050);
                function mapCacheGet(key) {
                  return getMapData(this, key).get(key);
                }
                module2.exports = mapCacheGet;
              }
            ),
            /***/
            9916: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getMapData = __webpack_require__2(5050);
                function mapCacheHas(key) {
                  return getMapData(this, key).has(key);
                }
                module2.exports = mapCacheHas;
              }
            ),
            /***/
            5265: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getMapData = __webpack_require__2(5050);
                function mapCacheSet(key, value) {
                  var data = getMapData(this, key), size = data.size;
                  data.set(key, value);
                  this.size += data.size == size ? 0 : 1;
                  return this;
                }
                module2.exports = mapCacheSet;
              }
            ),
            /***/
            8776: (
              /***/
              (module2) => {
                function mapToArray(map) {
                  var index = -1, result = Array(map.size);
                  map.forEach(function(value, key) {
                    result[++index] = [key, value];
                  });
                  return result;
                }
                module2.exports = mapToArray;
              }
            ),
            /***/
            2634: (
              /***/
              (module2) => {
                function matchesStrictComparable(key, srcValue) {
                  return function(object) {
                    if (object == null) {
                      return false;
                    }
                    return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
                  };
                }
                module2.exports = matchesStrictComparable;
              }
            ),
            /***/
            4523: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var memoize = __webpack_require__2(8306);
                var MAX_MEMOIZE_SIZE = 500;
                function memoizeCapped(func) {
                  var result = memoize(func, function(key) {
                    if (cache.size === MAX_MEMOIZE_SIZE) {
                      cache.clear();
                    }
                    return key;
                  });
                  var cache = result.cache;
                  return result;
                }
                module2.exports = memoizeCapped;
              }
            ),
            /***/
            4536: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var getNative = __webpack_require__2(852);
                var nativeCreate = getNative(Object, "create");
                module2.exports = nativeCreate;
              }
            ),
            /***/
            6916: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var overArg = __webpack_require__2(5569);
                var nativeKeys = overArg(Object.keys, Object);
                module2.exports = nativeKeys;
              }
            ),
            /***/
            3498: (
              /***/
              (module2) => {
                function nativeKeysIn(object) {
                  var result = [];
                  if (object != null) {
                    for (var key in Object(object)) {
                      result.push(key);
                    }
                  }
                  return result;
                }
                module2.exports = nativeKeysIn;
              }
            ),
            /***/
            1167: (
              /***/
              (module2, exports2, __webpack_require__2) => {
                module2 = __webpack_require__2.nmd(module2);
                var freeGlobal = __webpack_require__2(1957);
                var freeExports = exports2 && !exports2.nodeType && exports2;
                var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
                var moduleExports = freeModule && freeModule.exports === freeExports;
                var freeProcess = moduleExports && freeGlobal.process;
                var nodeUtil = function() {
                  try {
                    var types = freeModule && freeModule.require && freeModule.require("util").types;
                    if (types) {
                      return types;
                    }
                    return freeProcess && freeProcess.binding && freeProcess.binding("util");
                  } catch (e) {
                  }
                }();
                module2.exports = nodeUtil;
              }
            ),
            /***/
            2333: (
              /***/
              (module2) => {
                var objectProto = Object.prototype;
                var nativeObjectToString = objectProto.toString;
                function objectToString(value) {
                  return nativeObjectToString.call(value);
                }
                module2.exports = objectToString;
              }
            ),
            /***/
            5569: (
              /***/
              (module2) => {
                function overArg(func, transform) {
                  return function(arg) {
                    return func(transform(arg));
                  };
                }
                module2.exports = overArg;
              }
            ),
            /***/
            5357: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var apply = __webpack_require__2(6874);
                var nativeMax = Math.max;
                function overRest(func, start, transform) {
                  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
                  return function() {
                    var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
                    while (++index < length) {
                      array[index] = args[start + index];
                    }
                    index = -1;
                    var otherArgs = Array(start + 1);
                    while (++index < start) {
                      otherArgs[index] = args[index];
                    }
                    otherArgs[start] = transform(array);
                    return apply(func, this, otherArgs);
                  };
                }
                module2.exports = overRest;
              }
            ),
            /***/
            5639: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var freeGlobal = __webpack_require__2(1957);
                var freeSelf = typeof self == "object" && self && self.Object === Object && self;
                var root = freeGlobal || freeSelf || Function("return this")();
                module2.exports = root;
              }
            ),
            /***/
            619: (
              /***/
              (module2) => {
                var HASH_UNDEFINED = "__lodash_hash_undefined__";
                function setCacheAdd(value) {
                  this.__data__.set(value, HASH_UNDEFINED);
                  return this;
                }
                module2.exports = setCacheAdd;
              }
            ),
            /***/
            2385: (
              /***/
              (module2) => {
                function setCacheHas(value) {
                  return this.__data__.has(value);
                }
                module2.exports = setCacheHas;
              }
            ),
            /***/
            1814: (
              /***/
              (module2) => {
                function setToArray(set) {
                  var index = -1, result = Array(set.size);
                  set.forEach(function(value) {
                    result[++index] = value;
                  });
                  return result;
                }
                module2.exports = setToArray;
              }
            ),
            /***/
            61: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseSetToString = __webpack_require__2(6560), shortOut = __webpack_require__2(1275);
                var setToString = shortOut(baseSetToString);
                module2.exports = setToString;
              }
            ),
            /***/
            1275: (
              /***/
              (module2) => {
                var HOT_COUNT = 800, HOT_SPAN = 16;
                var nativeNow = Date.now;
                function shortOut(func) {
                  var count = 0, lastCalled = 0;
                  return function() {
                    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
                    lastCalled = stamp;
                    if (remaining > 0) {
                      if (++count >= HOT_COUNT) {
                        return arguments[0];
                      }
                    } else {
                      count = 0;
                    }
                    return func.apply(void 0, arguments);
                  };
                }
                module2.exports = shortOut;
              }
            ),
            /***/
            7465: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var ListCache = __webpack_require__2(8407);
                function stackClear() {
                  this.__data__ = new ListCache();
                  this.size = 0;
                }
                module2.exports = stackClear;
              }
            ),
            /***/
            3779: (
              /***/
              (module2) => {
                function stackDelete(key) {
                  var data = this.__data__, result = data["delete"](key);
                  this.size = data.size;
                  return result;
                }
                module2.exports = stackDelete;
              }
            ),
            /***/
            7599: (
              /***/
              (module2) => {
                function stackGet(key) {
                  return this.__data__.get(key);
                }
                module2.exports = stackGet;
              }
            ),
            /***/
            4758: (
              /***/
              (module2) => {
                function stackHas(key) {
                  return this.__data__.has(key);
                }
                module2.exports = stackHas;
              }
            ),
            /***/
            4309: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var ListCache = __webpack_require__2(8407), Map2 = __webpack_require__2(7071), MapCache = __webpack_require__2(3369);
                var LARGE_ARRAY_SIZE = 200;
                function stackSet(key, value) {
                  var data = this.__data__;
                  if (data instanceof ListCache) {
                    var pairs = data.__data__;
                    if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
                      pairs.push([key, value]);
                      this.size = ++data.size;
                      return this;
                    }
                    data = this.__data__ = new MapCache(pairs);
                  }
                  data.set(key, value);
                  this.size = data.size;
                  return this;
                }
                module2.exports = stackSet;
              }
            ),
            /***/
            2351: (
              /***/
              (module2) => {
                function strictIndexOf(array, value, fromIndex) {
                  var index = fromIndex - 1, length = array.length;
                  while (++index < length) {
                    if (array[index] === value) {
                      return index;
                    }
                  }
                  return -1;
                }
                module2.exports = strictIndexOf;
              }
            ),
            /***/
            5514: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var memoizeCapped = __webpack_require__2(4523);
                var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
                var reEscapeChar = /\\(\\)?/g;
                var stringToPath = memoizeCapped(function(string) {
                  var result = [];
                  if (string.charCodeAt(0) === 46) {
                    result.push("");
                  }
                  string.replace(rePropName, function(match, number, quote, subString) {
                    result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
                  });
                  return result;
                });
                module2.exports = stringToPath;
              }
            ),
            /***/
            327: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isSymbol = __webpack_require__2(3448);
                var INFINITY = 1 / 0;
                function toKey(value) {
                  if (typeof value == "string" || isSymbol(value)) {
                    return value;
                  }
                  var result = value + "";
                  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
                }
                module2.exports = toKey;
              }
            ),
            /***/
            346: (
              /***/
              (module2) => {
                var funcProto = Function.prototype;
                var funcToString = funcProto.toString;
                function toSource(func) {
                  if (func != null) {
                    try {
                      return funcToString.call(func);
                    } catch (e) {
                    }
                    try {
                      return func + "";
                    } catch (e) {
                    }
                  }
                  return "";
                }
                module2.exports = toSource;
              }
            ),
            /***/
            7990: (
              /***/
              (module2) => {
                var reWhitespace = /\s/;
                function trimmedEndIndex(string) {
                  var index = string.length;
                  while (index-- && reWhitespace.test(string.charAt(index))) {
                  }
                  return index;
                }
                module2.exports = trimmedEndIndex;
              }
            ),
            /***/
            6678: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseClone = __webpack_require__2(5990);
                var CLONE_SYMBOLS_FLAG = 4;
                function clone(value) {
                  return baseClone(value, CLONE_SYMBOLS_FLAG);
                }
                module2.exports = clone;
              }
            ),
            /***/
            361: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseClone = __webpack_require__2(5990);
                var CLONE_DEEP_FLAG = 1, CLONE_SYMBOLS_FLAG = 4;
                function cloneDeep(value) {
                  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
                }
                module2.exports = cloneDeep;
              }
            ),
            /***/
            5703: (
              /***/
              (module2) => {
                function constant(value) {
                  return function() {
                    return value;
                  };
                }
                module2.exports = constant;
              }
            ),
            /***/
            1966: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseDifference = __webpack_require__2(731), baseFlatten = __webpack_require__2(1078), baseRest = __webpack_require__2(5976), isArrayLikeObject = __webpack_require__2(9246);
                var difference = baseRest(function(array, values) {
                  return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true)) : [];
                });
                module2.exports = difference;
              }
            ),
            /***/
            7813: (
              /***/
              (module2) => {
                function eq(value, other) {
                  return value === other || value !== value && other !== other;
                }
                module2.exports = eq;
              }
            ),
            /***/
            3311: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var createFind = __webpack_require__2(7740), findIndex = __webpack_require__2(998);
                var find = createFind(findIndex);
                module2.exports = find;
              }
            ),
            /***/
            998: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseFindIndex = __webpack_require__2(1848), baseIteratee = __webpack_require__2(7206), toInteger = __webpack_require__2(554);
                var nativeMax = Math.max;
                function findIndex(array, predicate, fromIndex) {
                  var length = array == null ? 0 : array.length;
                  if (!length) {
                    return -1;
                  }
                  var index = fromIndex == null ? 0 : toInteger(fromIndex);
                  if (index < 0) {
                    index = nativeMax(length + index, 0);
                  }
                  return baseFindIndex(array, baseIteratee(predicate, 3), index);
                }
                module2.exports = findIndex;
              }
            ),
            /***/
            7361: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGet = __webpack_require__2(7786);
                function get(object, path, defaultValue) {
                  var result = object == null ? void 0 : baseGet(object, path);
                  return result === void 0 ? defaultValue : result;
                }
                module2.exports = get;
              }
            ),
            /***/
            9095: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseHasIn = __webpack_require__2(13), hasPath = __webpack_require__2(222);
                function hasIn(object, path) {
                  return object != null && hasPath(object, path, baseHasIn);
                }
                module2.exports = hasIn;
              }
            ),
            /***/
            6557: (
              /***/
              (module2) => {
                function identity(value) {
                  return value;
                }
                module2.exports = identity;
              }
            ),
            /***/
            3137: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var constant = __webpack_require__2(5703), createInverter = __webpack_require__2(7779), identity = __webpack_require__2(6557);
                var objectProto = Object.prototype;
                var nativeObjectToString = objectProto.toString;
                var invert = createInverter(function(result, value, key) {
                  if (value != null && typeof value.toString != "function") {
                    value = nativeObjectToString.call(value);
                  }
                  result[value] = key;
                }, constant(identity));
                module2.exports = invert;
              }
            ),
            /***/
            5694: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsArguments = __webpack_require__2(9454), isObjectLike = __webpack_require__2(7005);
                var objectProto = Object.prototype;
                var hasOwnProperty = objectProto.hasOwnProperty;
                var propertyIsEnumerable = objectProto.propertyIsEnumerable;
                var isArguments = baseIsArguments(/* @__PURE__ */ function() {
                  return arguments;
                }()) ? baseIsArguments : function(value) {
                  return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
                };
                module2.exports = isArguments;
              }
            ),
            /***/
            1469: (
              /***/
              (module2) => {
                var isArray = Array.isArray;
                module2.exports = isArray;
              }
            ),
            /***/
            8612: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isFunction = __webpack_require__2(3560), isLength = __webpack_require__2(1780);
                function isArrayLike(value) {
                  return value != null && isLength(value.length) && !isFunction(value);
                }
                module2.exports = isArrayLike;
              }
            ),
            /***/
            9246: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var isArrayLike = __webpack_require__2(8612), isObjectLike = __webpack_require__2(7005);
                function isArrayLikeObject(value) {
                  return isObjectLike(value) && isArrayLike(value);
                }
                module2.exports = isArrayLikeObject;
              }
            ),
            /***/
            4144: (
              /***/
              (module2, exports2, __webpack_require__2) => {
                module2 = __webpack_require__2.nmd(module2);
                var root = __webpack_require__2(5639), stubFalse = __webpack_require__2(5062);
                var freeExports = exports2 && !exports2.nodeType && exports2;
                var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
                var moduleExports = freeModule && freeModule.exports === freeExports;
                var Buffer2 = moduleExports ? root.Buffer : void 0;
                var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
                var isBuffer = nativeIsBuffer || stubFalse;
                module2.exports = isBuffer;
              }
            ),
            /***/
            8446: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsEqual = __webpack_require__2(939);
                function isEqual(value, other) {
                  return baseIsEqual(value, other);
                }
                module2.exports = isEqual;
              }
            ),
            /***/
            3560: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGetTag = __webpack_require__2(4239), isObject = __webpack_require__2(3218);
                var asyncTag = "[object AsyncFunction]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
                function isFunction(value) {
                  if (!isObject(value)) {
                    return false;
                  }
                  var tag = baseGetTag(value);
                  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
                }
                module2.exports = isFunction;
              }
            ),
            /***/
            1780: (
              /***/
              (module2) => {
                var MAX_SAFE_INTEGER = 9007199254740991;
                function isLength(value) {
                  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
                }
                module2.exports = isLength;
              }
            ),
            /***/
            6688: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsMap = __webpack_require__2(5588), baseUnary = __webpack_require__2(1717), nodeUtil = __webpack_require__2(1167);
                var nodeIsMap = nodeUtil && nodeUtil.isMap;
                var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
                module2.exports = isMap;
              }
            ),
            /***/
            3218: (
              /***/
              (module2) => {
                function isObject(value) {
                  var type = typeof value;
                  return value != null && (type == "object" || type == "function");
                }
                module2.exports = isObject;
              }
            ),
            /***/
            7005: (
              /***/
              (module2) => {
                function isObjectLike(value) {
                  return value != null && typeof value == "object";
                }
                module2.exports = isObjectLike;
              }
            ),
            /***/
            2928: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsSet = __webpack_require__2(9221), baseUnary = __webpack_require__2(1717), nodeUtil = __webpack_require__2(1167);
                var nodeIsSet = nodeUtil && nodeUtil.isSet;
                var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
                module2.exports = isSet;
              }
            ),
            /***/
            3448: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseGetTag = __webpack_require__2(4239), isObjectLike = __webpack_require__2(7005);
                var symbolTag = "[object Symbol]";
                function isSymbol(value) {
                  return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
                }
                module2.exports = isSymbol;
              }
            ),
            /***/
            6719: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseIsTypedArray = __webpack_require__2(8749), baseUnary = __webpack_require__2(1717), nodeUtil = __webpack_require__2(1167);
                var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
                var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
                module2.exports = isTypedArray;
              }
            ),
            /***/
            3674: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var arrayLikeKeys = __webpack_require__2(4636), baseKeys = __webpack_require__2(280), isArrayLike = __webpack_require__2(8612);
                function keys(object) {
                  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
                }
                module2.exports = keys;
              }
            ),
            /***/
            1704: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var arrayLikeKeys = __webpack_require__2(4636), baseKeysIn = __webpack_require__2(313), isArrayLike = __webpack_require__2(8612);
                function keysIn(object) {
                  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
                }
                module2.exports = keysIn;
              }
            ),
            /***/
            8306: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var MapCache = __webpack_require__2(3369);
                var FUNC_ERROR_TEXT = "Expected a function";
                function memoize(func, resolver) {
                  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
                    throw new TypeError(FUNC_ERROR_TEXT);
                  }
                  var memoized = function() {
                    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
                    if (cache.has(key)) {
                      return cache.get(key);
                    }
                    var result = func.apply(this, args);
                    memoized.cache = cache.set(key, result) || cache;
                    return result;
                  };
                  memoized.cache = new (memoize.Cache || MapCache)();
                  return memoized;
                }
                memoize.Cache = MapCache;
                module2.exports = memoize;
              }
            ),
            /***/
            308: (
              /***/
              (module2) => {
                function noop() {
                }
                module2.exports = noop;
              }
            ),
            /***/
            9601: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseProperty = __webpack_require__2(371), basePropertyDeep = __webpack_require__2(9152), isKey = __webpack_require__2(5403), toKey = __webpack_require__2(327);
                function property(path) {
                  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
                }
                module2.exports = property;
              }
            ),
            /***/
            479: (
              /***/
              (module2) => {
                function stubArray() {
                  return [];
                }
                module2.exports = stubArray;
              }
            ),
            /***/
            5062: (
              /***/
              (module2) => {
                function stubFalse() {
                  return false;
                }
                module2.exports = stubFalse;
              }
            ),
            /***/
            8601: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var toNumber = __webpack_require__2(4841);
                var INFINITY = 1 / 0, MAX_INTEGER = 17976931348623157e292;
                function toFinite(value) {
                  if (!value) {
                    return value === 0 ? value : 0;
                  }
                  value = toNumber(value);
                  if (value === INFINITY || value === -INFINITY) {
                    var sign = value < 0 ? -1 : 1;
                    return sign * MAX_INTEGER;
                  }
                  return value === value ? value : 0;
                }
                module2.exports = toFinite;
              }
            ),
            /***/
            554: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var toFinite = __webpack_require__2(8601);
                function toInteger(value) {
                  var result = toFinite(value), remainder = result % 1;
                  return result === result ? remainder ? result - remainder : result : 0;
                }
                module2.exports = toInteger;
              }
            ),
            /***/
            4841: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseTrim = __webpack_require__2(7561), isObject = __webpack_require__2(3218), isSymbol = __webpack_require__2(3448);
                var NAN = 0 / 0;
                var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
                var reIsBinary = /^0b[01]+$/i;
                var reIsOctal = /^0o[0-7]+$/i;
                var freeParseInt = parseInt;
                function toNumber(value) {
                  if (typeof value == "number") {
                    return value;
                  }
                  if (isSymbol(value)) {
                    return NAN;
                  }
                  if (isObject(value)) {
                    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
                    value = isObject(other) ? other + "" : other;
                  }
                  if (typeof value != "string") {
                    return value === 0 ? value : +value;
                  }
                  value = baseTrim(value);
                  var isBinary = reIsBinary.test(value);
                  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
                }
                module2.exports = toNumber;
              }
            ),
            /***/
            9833: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseToString = __webpack_require__2(531);
                function toString(value) {
                  return value == null ? "" : baseToString(value);
                }
                module2.exports = toString;
              }
            ),
            /***/
            4908: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseUniq = __webpack_require__2(5652);
                function uniq(array) {
                  return array && array.length ? baseUniq(array) : [];
                }
                module2.exports = uniq;
              }
            ),
            /***/
            2569: (
              /***/
              (module2, __unused_webpack_exports, __webpack_require__2) => {
                var baseDifference = __webpack_require__2(731), baseRest = __webpack_require__2(5976), isArrayLikeObject = __webpack_require__2(9246);
                var without = baseRest(function(array, values) {
                  return isArrayLikeObject(array) ? baseDifference(array, values) : [];
                });
                module2.exports = without;
              }
            )
            /******/
          };
          var __webpack_module_cache__ = {};
          function __webpack_require__(moduleId) {
            var cachedModule = __webpack_module_cache__[moduleId];
            if (cachedModule !== void 0) {
              return cachedModule.exports;
            }
            var module2 = __webpack_module_cache__[moduleId] = {
              /******/
              id: moduleId,
              /******/
              loaded: false,
              /******/
              exports: {}
              /******/
            };
            __webpack_modules__[moduleId](module2, module2.exports, __webpack_require__);
            module2.loaded = true;
            return module2.exports;
          }
          (() => {
            __webpack_require__.n = (module2) => {
              var getter = module2 && module2.__esModule ? (
                /******/
                () => module2["default"]
              ) : (
                /******/
                () => module2
              );
              __webpack_require__.d(getter, { a: getter });
              return getter;
            };
          })();
          (() => {
            __webpack_require__.d = (exports2, definition) => {
              for (var key in definition) {
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports2, key)) {
                  Object.defineProperty(exports2, key, { enumerable: true, get: definition[key] });
                }
              }
            };
          })();
          (() => {
            __webpack_require__.g = function() {
              if (typeof globalThis === "object") return globalThis;
              try {
                return this || new Function("return this")();
              } catch (e) {
                if (typeof window === "object") return window;
              }
            }();
          })();
          (() => {
            __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
          })();
          (() => {
            __webpack_require__.r = (exports2) => {
              if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
              }
              Object.defineProperty(exports2, "__esModule", { value: true });
            };
          })();
          (() => {
            __webpack_require__.nmd = (module2) => {
              module2.paths = [];
              if (!module2.children) module2.children = [];
              return module2;
            };
          })();
          var __webpack_exports__ = {};
          (() => {
            "use strict";
            __webpack_require__.r(__webpack_exports__);
            __webpack_require__.d(__webpack_exports__, {
              "chordParserFactory": () => (
                /* reexport */
                parser_chordParserFactory
              ),
              "chordRendererFactory": () => (
                /* reexport */
                renderer_chordRendererFactory
              )
            });
            ;
            function chain(allFunctions, input) {
              return allFunctions.reduce(function(value, fn) {
                return value ? fn(value) : null;
              }, input);
            }
            var cloneDeep = __webpack_require__(361);
            var cloneDeep_default = /* @__PURE__ */ __webpack_require__.n(cloneDeep);
            ;
            var checkCustomFilters = function checkCustomFilters2(customFilters) {
              if (!Array.isArray(customFilters)) {
                throw new TypeError("customFilters should be given as an array");
              }
              if (customFilters.some(function(filter) {
                return typeof filter !== "function";
              })) {
                throw new TypeError("The given filter is not a function");
              }
              return true;
            };
            const helpers_checkCustomFilters = checkCustomFilters;
            ;
            function ownKeys(object, enumerableOnly) {
              var keys = Object.keys(object);
              if (Object.getOwnPropertySymbols) {
                var symbols = Object.getOwnPropertySymbols(object);
                enumerableOnly && (symbols = symbols.filter(function(sym) {
                  return Object.getOwnPropertyDescriptor(object, sym).enumerable;
                })), keys.push.apply(keys, symbols);
              }
              return keys;
            }
            function _objectSpread(target) {
              for (var i = 1; i < arguments.length; i++) {
                var source = null != arguments[i] ? arguments[i] : {};
                i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
                  _defineProperty(target, key, source[key]);
                }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
                  Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
                });
              }
              return target;
            }
            function _defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            var notes = {
              AFlat: "Ab",
              A: "A",
              ASharp: "A#",
              BFlat: "Bb",
              B: "B",
              C: "C",
              CSharp: "C#",
              DFlat: "Db",
              D: "D",
              DSharp: "D#",
              EFlat: "Eb",
              E: "E",
              F: "F",
              FSharp: "F#",
              GFlat: "Gb",
              G: "G",
              GSharp: "G#"
            };
            var english = {
              Ab: notes.AFlat,
              A: notes.A,
              "A#": notes.ASharp,
              Bb: notes.BFlat,
              B: notes.B,
              "B#": notes.C,
              Cb: notes.B,
              C: notes.C,
              "C#": notes.CSharp,
              Db: notes.DFlat,
              D: notes.D,
              "D#": notes.DSharp,
              Eb: notes.EFlat,
              E: notes.E,
              "E#": notes.F,
              Fb: notes.E,
              F: notes.F,
              "F#": notes.FSharp,
              Gb: notes.GFlat,
              G: notes.G,
              "G#": notes.GSharp
            };
            var latin = {
              Lab: notes.AFlat,
              La: notes.A,
              "La#": notes.ASharp,
              Sib: notes.BFlat,
              Si: notes.B,
              "Si#": notes.C,
              Dob: notes.B,
              Do: notes.C,
              "Do#": notes.CSharp,
              Reb: notes.DFlat,
              R\u00E9b: notes.DFlat,
              Re: notes.D,
              R\u00E9: notes.D,
              "Re#": notes.DSharp,
              "R\xE9#": notes.DSharp,
              Mib: notes.EFlat,
              Mi: notes.E,
              "Mi#": notes.F,
              Fab: notes.E,
              Fa: notes.F,
              "Fa#": notes.FSharp,
              Solb: notes.GFlat,
              Sol: notes.G,
              "Sol#": notes.GSharp
            };
            var german = {
              As: notes.AFlat,
              A: notes.A,
              Ais: notes.ASharp,
              Hes: notes.BFlat,
              H: notes.B,
              His: notes.C,
              Ces: notes.B,
              C: notes.C,
              Cis: notes.CSharp,
              Des: notes.DFlat,
              D: notes.D,
              Dis: notes.DSharp,
              Es: notes.EFlat,
              E: notes.E,
              Eis: notes.F,
              Fes: notes.E,
              F: notes.F,
              Fis: notes.FSharp,
              Ges: notes.GFlat,
              G: notes.G,
              Gis: notes.GSharp
            };
            function getAccidentalsVariation(source) {
              var variant;
              return Object.keys(source).reduce(function(acc, curr) {
                if (curr.match(/.[b|#]$/)) {
                  variant = curr.replace("#", "\u266F").replace("b", "\u266D");
                  acc[variant] = source[curr];
                }
                return acc;
              }, {});
            }
            var englishVariantsToNotes = _objectSpread(_objectSpread({}, english), getAccidentalsVariation(english));
            var latinVariantsToNotes = _objectSpread(_objectSpread({}, latin), getAccidentalsVariation(latin));
            var germanVariantsToNotes = _objectSpread({}, german);
            var allVariantsToNotes = _objectSpread(_objectSpread(_objectSpread({}, englishVariantsToNotes), latinVariantsToNotes), germanVariantsToNotes);
            var allVariants = Object.keys(allVariantsToNotes).sort(function(a, b) {
              return b.length - a.length;
            });
            var englishVariants = Object.keys(englishVariantsToNotes).sort(function(a, b) {
              return b.length - a.length;
            });
            var latinVariants = Object.keys(latinVariantsToNotes).sort(function(a, b) {
              return b.length - a.length;
            });
            var germanVariants = Object.keys(germanVariantsToNotes).sort(function(a, b) {
              return b.length - a.length;
            });
            var allVariantsPerGroup = [{
              name: "english",
              notes: englishVariants
            }, {
              name: "german",
              notes: germanVariants
            }, {
              name: "latin",
              notes: latinVariants
            }];
            ;
            function _typeof(obj) {
              "@babel/helpers - typeof";
              return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
                return typeof obj2;
              } : function(obj2) {
                return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
              }, _typeof(obj);
            }
            function _defineProperties(target, props) {
              for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
              }
            }
            function _createClass(Constructor, protoProps, staticProps) {
              if (protoProps) _defineProperties(Constructor.prototype, protoProps);
              if (staticProps) _defineProperties(Constructor, staticProps);
              Object.defineProperty(Constructor, "prototype", { writable: false });
              return Constructor;
            }
            function _classCallCheck(instance, Constructor) {
              if (!(instance instanceof Constructor)) {
                throw new TypeError("Cannot call a class as a function");
              }
            }
            function _inherits(subClass, superClass) {
              if (typeof superClass !== "function" && superClass !== null) {
                throw new TypeError("Super expression must either be null or a function");
              }
              subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });
              Object.defineProperty(subClass, "prototype", { writable: false });
              if (superClass) _setPrototypeOf(subClass, superClass);
            }
            function _createSuper(Derived) {
              var hasNativeReflectConstruct = _isNativeReflectConstruct();
              return function _createSuperInternal() {
                var Super = _getPrototypeOf(Derived), result;
                if (hasNativeReflectConstruct) {
                  var NewTarget = _getPrototypeOf(this).constructor;
                  result = Reflect.construct(Super, arguments, NewTarget);
                } else {
                  result = Super.apply(this, arguments);
                }
                return _possibleConstructorReturn(this, result);
              };
            }
            function _possibleConstructorReturn(self2, call) {
              if (call && (_typeof(call) === "object" || typeof call === "function")) {
                return call;
              } else if (call !== void 0) {
                throw new TypeError("Derived constructors may only return object or undefined");
              }
              return _assertThisInitialized(self2);
            }
            function _assertThisInitialized(self2) {
              if (self2 === void 0) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
              }
              return self2;
            }
            function _wrapNativeSuper(Class) {
              var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
              _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
                if (Class2 === null || !_isNativeFunction(Class2)) return Class2;
                if (typeof Class2 !== "function") {
                  throw new TypeError("Super expression must either be null or a function");
                }
                if (typeof _cache !== "undefined") {
                  if (_cache.has(Class2)) return _cache.get(Class2);
                  _cache.set(Class2, Wrapper);
                }
                function Wrapper() {
                  return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
                }
                Wrapper.prototype = Object.create(Class2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } });
                return _setPrototypeOf(Wrapper, Class2);
              };
              return _wrapNativeSuper(Class);
            }
            function _construct(Parent, args, Class) {
              if (_isNativeReflectConstruct()) {
                _construct = Reflect.construct;
              } else {
                _construct = function _construct2(Parent2, args2, Class2) {
                  var a = [null];
                  a.push.apply(a, args2);
                  var Constructor = Function.bind.apply(Parent2, a);
                  var instance = new Constructor();
                  if (Class2) _setPrototypeOf(instance, Class2.prototype);
                  return instance;
                };
              }
              return _construct.apply(null, arguments);
            }
            function _isNativeReflectConstruct() {
              if (typeof Reflect === "undefined" || !Reflect.construct) return false;
              if (Reflect.construct.sham) return false;
              if (typeof Proxy === "function") return true;
              try {
                Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
                }));
                return true;
              } catch (e) {
                return false;
              }
            }
            function _isNativeFunction(fn) {
              return Function.toString.call(fn).indexOf("[native code]") !== -1;
            }
            function _setPrototypeOf(o, p) {
              _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
                o2.__proto__ = p2;
                return o2;
              };
              return _setPrototypeOf(o, p);
            }
            function _getPrototypeOf(o) {
              _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o2) {
                return o2.__proto__ || Object.getPrototypeOf(o2);
              };
              return _getPrototypeOf(o);
            }
            var InvalidInputError = /* @__PURE__ */ function(_Error) {
              _inherits(InvalidInputError2, _Error);
              var _super = _createSuper(InvalidInputError2);
              function InvalidInputError2() {
                var _this;
                _classCallCheck(this, InvalidInputError2);
                _this = _super.call(this, "The given symbol is not a valid string");
                _this.name = "InvalidInput";
                return _this;
              }
              return _createClass(InvalidInputError2);
            }(/* @__PURE__ */ _wrapNativeSuper(Error));
            var UnexpectedError = /* @__PURE__ */ function(_Error2) {
              _inherits(UnexpectedError2, _Error2);
              var _super2 = _createSuper(UnexpectedError2);
              function UnexpectedError2() {
                var _this2;
                _classCallCheck(this, UnexpectedError2);
                var message = "An unexpected error happened. Maybe a custom filter returned null instead of throwing an exception?";
                _this2 = _super2.call(this, message);
                _this2.name = "UnexpectedError";
                return _this2;
              }
              return _createClass(UnexpectedError2);
            }(/* @__PURE__ */ _wrapNativeSuper(Error));
            var ChordSymbolError = /* @__PURE__ */ function(_Error3) {
              _inherits(ChordSymbolError2, _Error3);
              var _super3 = _createSuper(ChordSymbolError2);
              function ChordSymbolError2(message, chord, errorName) {
                var _this3;
                _classCallCheck(this, ChordSymbolError2);
                _this3 = _super3.call(this, message);
                _this3.name = errorName;
                _this3.chord = chord;
                return _this3;
              }
              return _createClass(ChordSymbolError2);
            }(/* @__PURE__ */ _wrapNativeSuper(Error));
            var NoSymbolFoundError = /* @__PURE__ */ function(_ChordSymbolError) {
              _inherits(NoSymbolFoundError2, _ChordSymbolError);
              var _super4 = _createSuper(NoSymbolFoundError2);
              function NoSymbolFoundError2(chord) {
                _classCallCheck(this, NoSymbolFoundError2);
                var message = '"'.concat(chord.input.symbol, '" does not seems to be a chord');
                return _super4.call(this, message, chord, "NoSymbolFound");
              }
              return _createClass(NoSymbolFoundError2);
            }(ChordSymbolError);
            var InvalidModifierError = /* @__PURE__ */ function(_ChordSymbolError2) {
              _inherits(InvalidModifierError2, _ChordSymbolError2);
              var _super5 = _createSuper(InvalidModifierError2);
              function InvalidModifierError2(chord, invalidChars) {
                _classCallCheck(this, InvalidModifierError2);
                var message = 'The chord descriptor "'.concat(chord.input.descriptor, '" contains unknown or duplicated modifiers: "').concat(invalidChars, '"');
                return _super5.call(this, message, chord, "InvalidModifier");
              }
              return _createClass(InvalidModifierError2);
            }(ChordSymbolError);
            var InvalidIntervalsError = /* @__PURE__ */ function(_ChordSymbolError3) {
              _inherits(InvalidIntervalsError2, _ChordSymbolError3);
              var _super6 = _createSuper(InvalidIntervalsError2);
              function InvalidIntervalsError2(chord, forbiddenCombo) {
                _classCallCheck(this, InvalidIntervalsError2);
                var message = '"'.concat(chord.input.symbol, '" describes a chord with an invalid intervals combo: ') + forbiddenCombo.join(" and ");
                return _super6.call(this, message, chord, "InvalidIntervals");
              }
              return _createClass(InvalidIntervalsError2);
            }(ChordSymbolError);
            var isArray = __webpack_require__(1469);
            var isArray_default = /* @__PURE__ */ __webpack_require__.n(isArray);
            var isEqual = __webpack_require__(8446);
            var isEqual_default = /* @__PURE__ */ __webpack_require__.n(isEqual);
            ;
            function hasExactly(allIntervals, search) {
              var arraySearch = isArray_default()(search) ? search : [search];
              return isEqual_default()(allIntervals, arraySearch);
            }
            function hasOneOf(allIntervals, search) {
              return has(allIntervals, search, "oneOf");
            }
            function hasAll(allIntervals, search) {
              return has(allIntervals, search, "all");
            }
            function hasNoneOf(allIntervals, search) {
              return has(allIntervals, search, "none");
            }
            function has(allIntervals, search, require2) {
              var arraySearch = isArray_default()(search) ? search : [search];
              var lookupMethod = require2 === "oneOf" ? "some" : "every";
              return arraySearch[lookupMethod](function(interval) {
                return require2 === "none" ? !allIntervals.includes(interval) : allIntervals.includes(interval);
              });
            }
            ;
            var allForbiddenCombos = [
              ["2", "3"],
              ["2", "9"],
              ["3", "b3"],
              //['3',  '4'], // valid in the Real Book: F#7SUS(add 3)
              ["4", "11"],
              ["5", "b5"],
              ["5", "#5"],
              ["b6", "#5"],
              ["b6", "6"],
              ["b6", "13"],
              ["6", "13"],
              ["b7", "bb7"],
              ["7", "b7"],
              ["9", "b9"],
              ["9", "#9"],
              ["11", "#11"],
              ["13", "b13"]
            ];
            function checkIntervalsConsistency(chord) {
              var intervals = chord.normalized.intervals;
              var forbiddenCombo = allForbiddenCombos.find(function(combo) {
                return hasAll(intervals, combo);
              });
              if (forbiddenCombo) {
                throw new InvalidIntervalsError(chord, forbiddenCombo);
              }
              return chord;
            }
            ;
            function formatSymbol(chord) {
              var _chord$formatted = chord.formatted, rootNote = _chord$formatted.rootNote, bassNote = _chord$formatted.bassNote, descriptor = _chord$formatted.descriptor, chordChanges = _chord$formatted.chordChanges;
              var symbol = rootNote;
              if (descriptor) {
                symbol += descriptor;
              }
              if (chordChanges && chordChanges.length) {
                symbol += "(" + chordChanges.join(",") + ")";
              }
              if (bassNote) {
                symbol += "/" + bassNote;
              }
              chord.formatted.symbol = symbol;
              return chord;
            }
            ;
            var qualities = {
              ma: "major",
              ma6: "major6",
              ma7: "major7",
              dom7: "dominant7",
              mi: "minor",
              mi6: "minor6",
              mi7: "minor7",
              miMa7: "minorMajor7",
              aug: "augmented",
              dim: "diminished",
              dim7: "diminished7",
              power: "power",
              bass: "bass"
            };
            var majorQualities = [qualities.ma, qualities.ma6, qualities.ma7, qualities.dom7, qualities.aug];
            var minorQualities = [qualities.mi, qualities.mi6, qualities.mi7, qualities.miMa7, qualities.dim, qualities.dim7];
            ;
            var _qualityToDescriptor;
            function _toConsumableArray(arr) {
              return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
            }
            function _nonIterableSpread() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function _unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return _arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
            }
            function _iterableToArray(iter) {
              if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
            }
            function _arrayWithoutHoles(arr) {
              if (Array.isArray(arr)) return _arrayLikeToArray(arr);
            }
            function _arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
              }
              return arr2;
            }
            function formatSymbolParts_defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            var qualityToDescriptor = (_qualityToDescriptor = {}, formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.ma, function() {
              return "";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.ma6, function(chord) {
              return chord.normalized.intervals.includes("9") ? "69" : "6";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.ma7, function(chord) {
              return "ma" + getHighestExtension(chord);
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.dom7, function(chord) {
              return chord.normalized.intents.alt ? "7alt" : getHighestExtension(chord);
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.mi, function() {
              return "mi";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.mi6, function(chord) {
              return chord.normalized.intervals.includes("9") ? "mi69" : "mi6";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.mi7, function(chord) {
              return "mi" + getHighestExtension(chord);
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.miMa7, function(chord) {
              return "miMa" + getHighestExtension(chord);
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.aug, function() {
              return "+";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.dim, function() {
              return "dim";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.dim7, function() {
              return "dim7";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.power, function() {
              return "5";
            }), formatSymbolParts_defineProperty(_qualityToDescriptor, qualities.bass, function() {
              return " bass";
            }), _qualityToDescriptor);
            var chordChangesDescriptors = {
              add: "add",
              add7: "Ma7",
              omit: "omit",
              sus: "sus"
            };
            function formatSymbolParts(chord) {
              chord.formatted = {
                rootNote: chord.normalized.rootNote,
                bassNote: chord.normalized.bassNote,
                descriptor: getDescriptor(chord),
                chordChanges: getChordChanges(chord)
              };
              return chord;
            }
            function getDescriptor(chord) {
              var descriptor = qualityToDescriptor[chord.normalized.quality](chord);
              if (chord.normalized.isSuspended) {
                descriptor += chordChangesDescriptors.sus;
              }
              return descriptor;
            }
            function getHighestExtension(chord) {
              var extensions = chord.normalized.extensions;
              var highestExtension = extensions[extensions.length - 1];
              if (highestExtension === "11" && chord.normalized.intents.major) {
                highestExtension = hasNoneOf(chord.normalized.alterations, ["b9", "#9"]) ? "9" : "7";
              }
              return highestExtension || "7";
            }
            function getChordChanges(chord) {
              var formattedOmits = formatOmits(chord.normalized.omits);
              if (isAltered(chord)) {
                return formattedOmits;
              }
              var formattedAdds = formatAdds(chord.normalized.quality, chord.normalized.adds);
              return [].concat(_toConsumableArray(chord.normalized.alterations), _toConsumableArray(formattedAdds), _toConsumableArray(formattedOmits));
            }
            function isAltered(chord) {
              return chord.normalized.intents.alt && chord.normalized.quality === qualities.dom7;
            }
            function formatAdds(quality, adds) {
              return adds.filter(function(add) {
                return !([qualities.ma6, qualities.mi6].includes(quality) && add === "9");
              }).map(function(add, index) {
                var formatted = "";
                if (index === 0) {
                  formatted += chordChangesDescriptors.add;
                  if (["b", "#"].includes(add[0])) {
                    formatted += " ";
                  }
                }
                formatted += add === "7" ? chordChangesDescriptors.add7 : add;
                return formatted;
              });
            }
            function formatOmits(omits) {
              return omits.map(function(omitted, index) {
                var formatted = "";
                if (index === 0) {
                  formatted += chordChangesDescriptors.omit;
                }
                formatted += omitted === "b3" ? "3" : omitted;
                return formatted;
              });
            }
            ;
            function getParsableDescriptor(chord) {
              var allFilters = [toLowerCaseExceptMajorM, removeSpaces, addDisambiguators, addMissingVerbs];
              if (chord.input.descriptor) {
                chord.input.parsableDescriptor = chain(allFilters, chord.input.descriptor);
              }
              return chord;
            }
            function toLowerCaseExceptMajorM(descriptor) {
              return descriptor.replace(/[A-LN-Za-z]+/g, function(match) {
                return match.toLowerCase();
              }).replace("oMit", "omit").replace("diM", "dim").replace("augMented", "augmented");
            }
            function removeSpaces(descriptor) {
              return descriptor.replace(/ /g, "");
            }
            function addDisambiguators(descriptor) {
              return descriptor.replace(/(7?dim)(alt|add)/g, "$1 $2").replace(/([m|M])(alt|add)/g, "$1 $2").replace(/i(no[35])/g, "i $1").replace(/([b♭#♯]9)6/g, "$1 6").replace(/(9\/?6)/g, " $1");
            }
            function addMissingVerbs(descriptor) {
              var allTokensWithVerbs;
              var currentVerb;
              var hasVerb;
              return descriptor.replace(/\((.*?)\)/g, function(match, parenthesis) {
                allTokensWithVerbs = [];
                currentVerb = "";
                parenthesis.split(",").forEach(function(token) {
                  hasVerb = true;
                  if (token.startsWith("add")) {
                    currentVerb = "add";
                  } else if (token.startsWith("omit")) {
                    currentVerb = "omit";
                  } else if (token.startsWith("no")) {
                    currentVerb = "no";
                  } else {
                    hasVerb = false;
                  }
                  if (hasVerb) {
                    allTokensWithVerbs.push(token);
                  } else {
                    allTokensWithVerbs.push(currentVerb + token);
                  }
                });
                return " " + allTokensWithVerbs.join(" ") + " ";
              });
            }
            ;
            function initChord() {
              var parserConfiguration = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
              var symbol = arguments.length > 1 ? arguments[1] : void 0;
              return {
                input: {
                  symbol
                },
                normalized: {},
                formatted: {},
                parserConfiguration: cloneDeep_default()(parserConfiguration)
              };
            }
            ;
            var _rootNoteToScaleAccid;
            function nameIndividualChordNotes_toConsumableArray(arr) {
              return nameIndividualChordNotes_arrayWithoutHoles(arr) || nameIndividualChordNotes_iterableToArray(arr) || nameIndividualChordNotes_unsupportedIterableToArray(arr) || nameIndividualChordNotes_nonIterableSpread();
            }
            function nameIndividualChordNotes_nonIterableSpread() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function nameIndividualChordNotes_unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return nameIndividualChordNotes_arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return nameIndividualChordNotes_arrayLikeToArray(o, minLen);
            }
            function nameIndividualChordNotes_iterableToArray(iter) {
              if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
            }
            function nameIndividualChordNotes_arrayWithoutHoles(arr) {
              if (Array.isArray(arr)) return nameIndividualChordNotes_arrayLikeToArray(arr);
            }
            function nameIndividualChordNotes_arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
              }
              return arr2;
            }
            function nameIndividualChordNotes_defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            var notesSharp = [notes.A, notes.ASharp, notes.B, notes.C, notes.CSharp, notes.D, notes.DSharp, notes.E, notes.F, notes.FSharp, notes.G, notes.GSharp];
            var notesFlat = [notes.A, notes.BFlat, notes.B, notes.C, notes.DFlat, notes.D, notes.EFlat, notes.E, notes.F, notes.GFlat, notes.G, notes.AFlat];
            var rootNoteToScaleAccidentals = (_rootNoteToScaleAccid = {}, nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.C, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.CSharp, {
              maj: "sharp",
              min: "sharp"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.DFlat, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.D, {
              maj: "sharp",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.DSharp, {
              maj: "sharp",
              min: "sharp"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.EFlat, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.E, {
              maj: "sharp",
              min: "sharp"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.F, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.FSharp, {
              maj: "sharp",
              min: "sharp"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.GFlat, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.G, {
              maj: "sharp",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.GSharp, {
              maj: "sharp",
              min: "sharp"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.AFlat, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.A, {
              maj: "sharp",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.ASharp, {
              maj: "sharp",
              min: "sharp"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.BFlat, {
              maj: "flat",
              min: "flat"
            }), nameIndividualChordNotes_defineProperty(_rootNoteToScaleAccid, notes.B, {
              maj: "sharp",
              min: "sharp"
            }), _rootNoteToScaleAccid);
            function nameIndividualChordNotes(chord) {
              var rootNote = chord.normalized.rootNote;
              var semitones = chord.normalized.semitones;
              var quality = chord.normalized.quality;
              var minMaj = majorQualities.includes(quality) ? "maj" : "min";
              var refNotes = rootNoteToScaleAccidentals[rootNote][minMaj] === "sharp" ? notesSharp : notesFlat;
              var rootNoteIndex = refNotes.indexOf(rootNote);
              var indexedNotes = [].concat(nameIndividualChordNotes_toConsumableArray(refNotes.slice(rootNoteIndex)), nameIndividualChordNotes_toConsumableArray(refNotes.slice(0, rootNoteIndex)), nameIndividualChordNotes_toConsumableArray(refNotes.slice(rootNoteIndex)), nameIndividualChordNotes_toConsumableArray(refNotes.slice(0, rootNoteIndex)));
              var chordNotes = semitones.map(function(i) {
                return indexedNotes[i];
              });
              chord.normalized.notes = chordNotes;
              return chord;
            }
            ;
            function normalizeNotes(chord) {
              chord.normalized.rootNote = allVariantsToNotes[chord.input.rootNote];
              if (chord.input.bassNote) {
                chord.normalized.bassNote = allVariantsToNotes[chord.input.bassNote];
              }
              return chord;
            }
            var clone = __webpack_require__(6678);
            var clone_default = /* @__PURE__ */ __webpack_require__.n(clone);
            var find = __webpack_require__(3311);
            var find_default = /* @__PURE__ */ __webpack_require__.n(find);
            var uniq = __webpack_require__(4908);
            var uniq_default = /* @__PURE__ */ __webpack_require__.n(uniq);
            var without = __webpack_require__(2569);
            var without_default = /* @__PURE__ */ __webpack_require__.n(without);
            ;
            function normalizeDescriptor_ownKeys(object, enumerableOnly) {
              var keys = Object.keys(object);
              if (Object.getOwnPropertySymbols) {
                var symbols = Object.getOwnPropertySymbols(object);
                enumerableOnly && (symbols = symbols.filter(function(sym) {
                  return Object.getOwnPropertyDescriptor(object, sym).enumerable;
                })), keys.push.apply(keys, symbols);
              }
              return keys;
            }
            function normalizeDescriptor_objectSpread(target) {
              for (var i = 1; i < arguments.length; i++) {
                var source = null != arguments[i] ? arguments[i] : {};
                i % 2 ? normalizeDescriptor_ownKeys(Object(source), true).forEach(function(key) {
                  normalizeDescriptor_defineProperty(target, key, source[key]);
                }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : normalizeDescriptor_ownKeys(Object(source)).forEach(function(key) {
                  Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
                });
              }
              return target;
            }
            function normalizeDescriptor_defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            function normalizeDescriptor_toConsumableArray(arr) {
              return normalizeDescriptor_arrayWithoutHoles(arr) || normalizeDescriptor_iterableToArray(arr) || normalizeDescriptor_unsupportedIterableToArray(arr) || normalizeDescriptor_nonIterableSpread();
            }
            function normalizeDescriptor_nonIterableSpread() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function normalizeDescriptor_unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return normalizeDescriptor_arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return normalizeDescriptor_arrayLikeToArray(o, minLen);
            }
            function normalizeDescriptor_iterableToArray(iter) {
              if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
            }
            function normalizeDescriptor_arrayWithoutHoles(arr) {
              if (Array.isArray(arr)) return normalizeDescriptor_arrayLikeToArray(arr);
            }
            function normalizeDescriptor_arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
              }
              return arr2;
            }
            function normalizeDescriptor(chord) {
              var chordIntervals = clone_default()(chord.normalized.intervals);
              var normalized = {
                quality: "",
                isSuspended: false,
                extensions: [],
                alterations: [],
                adds: [],
                omits: []
              };
              if (isPowerChord(chordIntervals)) {
                normalized.quality = qualities.power;
              } else if (isBass(chordIntervals)) {
                normalized.quality = qualities.bass;
              } else {
                var omits = getOmits(chordIntervals, chord.normalized.intents.major);
                var isSuspended = getIsSuspended(chordIntervals, chord.normalized.intents.major);
                var _getChordQuality = getChordQuality(chordIntervals, chord, isSuspended, omits), qualityIntervals = _getChordQuality.qualityIntervals, quality = _getChordQuality.quality;
                var extensions = getExtensions(chordIntervals, quality);
                var baseIntervals = ["1"].concat(normalizeDescriptor_toConsumableArray(qualityIntervals), normalizeDescriptor_toConsumableArray(extensions));
                var _getAddsAndAlteration = getAddsAndAlterations(chordIntervals, baseIntervals, quality), adds = _getAddsAndAlteration.adds, alterations = _getAddsAndAlteration.alterations;
                normalized = normalizeDescriptor_objectSpread(normalizeDescriptor_objectSpread({}, normalized), {}, {
                  quality,
                  isSuspended,
                  extensions,
                  alterations,
                  adds,
                  omits
                });
              }
              return normalizeDescriptor_objectSpread(normalizeDescriptor_objectSpread({}, chord), {}, {
                normalized: normalizeDescriptor_objectSpread(normalizeDescriptor_objectSpread({}, chord.normalized), normalized)
              });
            }
            function isPowerChord(intervals) {
              return hasExactly(intervals, ["1", "5"]);
            }
            function isBass(intervals) {
              return hasExactly(intervals, ["1"]);
            }
            function getIsSuspended(intervals, hasMajorIntent2) {
              return intervals.includes("4") || intervals.includes("11") && hasMajorIntent2 && !intervals.includes("3");
            }
            function getOmits(intervals, hasMajorIntent2) {
              var omits = [];
              if (hasNoneOf(intervals, ["b3", "3", "4", "11"]) || !hasMajorIntent2 && hasNoneOf(intervals, ["b3", "4"])) {
                omits.push(hasMajorIntent2 ? "3" : "b3");
              }
              if (hasNoneOf(intervals, ["b5", "5", "#5", "b13"])) {
                omits.push("5");
              }
              return omits;
            }
            function getChordQuality(allIntervals, chord, isSuspended, omits) {
              var intervalsForQualityDetection = getIntervalsForQualityDetection(allIntervals, chord, isSuspended, omits);
              var intervalsToQualities = [
                // !!! do not change order without a good reason
                {
                  qualityIntervals: ["b3"],
                  quality: qualities.mi
                },
                {
                  qualityIntervals: ["b3", "6"],
                  quality: qualities.mi6
                },
                {
                  qualityIntervals: ["b3", "7"],
                  quality: qualities.miMa7
                },
                {
                  qualityIntervals: ["b3", "b7"],
                  quality: qualities.mi7
                },
                {
                  qualityIntervals: ["3"],
                  quality: qualities.ma
                },
                {
                  qualityIntervals: ["3", "6"],
                  quality: qualities.ma6
                },
                {
                  qualityIntervals: ["3", "7"],
                  quality: qualities.ma7
                },
                {
                  qualityIntervals: ["3", "b7"],
                  quality: qualities.dom7
                },
                {
                  qualityIntervals: ["3", "#5"],
                  quality: qualities.aug
                },
                {
                  qualityIntervals: ["b3", "b5"],
                  quality: qualities.dim
                },
                {
                  qualityIntervals: ["b3", "b5", "bb7"],
                  quality: qualities.dim7
                }
              ].sort(function(a, b) {
                return b.qualityIntervals.length - a.qualityIntervals.length;
              });
              return find_default()(intervalsToQualities, function(o) {
                return hasAll(intervalsForQualityDetection, o.qualityIntervals);
              });
            }
            function getIntervalsForQualityDetection(allIntervals, chord, isSuspended, omits) {
              var allFilters = [undoOmit3.bind(null, omits), undoSuspension.bind(null, isSuspended, chord.normalized.intents.major), undoAlt5.bind(null, chord.normalized.intents.alt), uniq_default()];
              return chain(allFilters, clone_default()(allIntervals));
            }
            function undoOmit3(omits, allIntervals) {
              var with3rd = clone_default()(allIntervals);
              if (omits.includes("3")) {
                with3rd.push("3");
              } else if (omits.includes("b3")) {
                with3rd.push("b3");
              }
              return with3rd;
            }
            function undoSuspension(isSuspended, hasMajorIntent2, allIntervals) {
              if (isSuspended) {
                var unSuspended = without_default()(allIntervals, "4");
                unSuspended.push(hasMajorIntent2 ? "3" : "b3");
                return unSuspended;
              }
              return allIntervals;
            }
            function undoAlt5(isAlt, allIntervals) {
              if (isAlt) {
                var unaltered = without_default()(allIntervals, "b5", "#5");
                unaltered.push("5");
                return unaltered;
              }
              return allIntervals;
            }
            function getExtensions(allIntervals, quality) {
              var extensions = [];
              if (canBeExtended(quality)) {
                if (isMinorExtended13th(allIntervals, quality)) {
                  extensions.push("9", "11", "13");
                } else if (isMajorExtended13th(allIntervals, quality)) {
                  extensions.push("9", "13");
                } else if (isExtended11th(allIntervals)) {
                  extensions.push("9", "11");
                } else if (isExtended9th(allIntervals)) {
                  extensions.push("9");
                }
              }
              return extensions;
            }
            function canBeExtended(quality) {
              return [qualities.ma7, qualities.dom7, qualities.mi7, qualities.miMa7].includes(quality);
            }
            function canHave11th(quality) {
              return [qualities.mi7, qualities.miMa7].includes(quality);
            }
            function isMinorExtended13th(allIntervals, quality) {
              return canHave11th(quality) && hasOneOf(allIntervals, "13") && hasOneOf(allIntervals, ["11", "#11"]) && hasOneOf(allIntervals, ["b9", "9", "#9"]);
            }
            function isMajorExtended13th(allIntervals, quality) {
              return !canHave11th(quality) && hasOneOf(allIntervals, "13") && hasOneOf(allIntervals, ["b9", "9", "#9"]);
            }
            function isExtended11th(allIntervals) {
              return hasOneOf(allIntervals, "11") && hasOneOf(allIntervals, ["b9", "9", "#9"]);
            }
            function isExtended9th(allIntervals) {
              return allIntervals.includes("9");
            }
            function getAddsAndAlterations(chordIntervals, baseIntervals, quality) {
              var adds = [];
              var alterations = [];
              chordIntervals.filter(function(interval) {
                return interval !== "5" && interval !== "4";
              }).forEach(function(interval) {
                if (!baseIntervals.includes(interval)) {
                  if (isAlteration(quality, interval)) {
                    alterations.push(interval);
                  } else {
                    adds.push(interval);
                  }
                }
              });
              if (hasAdd3(chordIntervals)) {
                adds.push("3");
              }
              return {
                adds: sortIntervals(adds),
                alterations: sortIntervals(alterations)
              };
            }
            function isAlteration(quality, interval) {
              var _qualityAlterations;
              var qualityAlterations = (_qualityAlterations = {}, normalizeDescriptor_defineProperty(_qualityAlterations, qualities.ma, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.ma6, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.ma7, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.dom7, ["b5", "#5", "b9", "#9", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.mi, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.mi6, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.mi7, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.miMa7, ["b5", "#5", "#11", "b13"]), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.aug, []), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.dim, []), normalizeDescriptor_defineProperty(_qualityAlterations, qualities.dim7, []), _qualityAlterations);
              return qualityAlterations[quality].includes(interval);
            }
            function hasAdd3(allIntervals) {
              return hasAll(allIntervals, ["3", "4"]);
            }
            function sortIntervals(intervals) {
              return intervals.sort(function(a, b) {
                var sortableA = Number.parseInt(a.replace(/[b#]/, ""));
                var sortableB = Number.parseInt(b.replace(/[b#]/, ""));
                return sortableA - sortableB;
              });
            }
            ;
            function parseBase(noteVariants, chord) {
              var symbol = chord.input.symbol;
              var notesRegex = noteVariants.join("|");
              var notesAndDescriptorRegex = new RegExp("^(" + notesRegex + ")(.*?)(/(" + notesRegex + "))?$");
              var result = symbol.match(notesAndDescriptorRegex);
              if (result && result[1]) {
                chord.input.rootNote = result[1];
                if (result[2]) {
                  chord.input.descriptor = result[2];
                }
                if (result[4]) {
                  chord.input.bassNote = result[4];
                }
                return chord;
              } else {
                throw new NoSymbolFoundError(chord);
              }
            }
            ;
            function modifiers_ownKeys(object, enumerableOnly) {
              var keys = Object.keys(object);
              if (Object.getOwnPropertySymbols) {
                var symbols = Object.getOwnPropertySymbols(object);
                enumerableOnly && (symbols = symbols.filter(function(sym) {
                  return Object.getOwnPropertyDescriptor(object, sym).enumerable;
                })), keys.push.apply(keys, symbols);
              }
              return keys;
            }
            function modifiers_objectSpread(target) {
              for (var i = 1; i < arguments.length; i++) {
                var source = null != arguments[i] ? arguments[i] : {};
                i % 2 ? modifiers_ownKeys(Object(source), true).forEach(function(key) {
                  modifiers_defineProperty(target, key, source[key]);
                }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : modifiers_ownKeys(Object(source)).forEach(function(key) {
                  Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
                });
              }
              return target;
            }
            function modifiers_defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            var allModifiers = {
              // base
              ma: "ma",
              mi: "mi",
              dim: "dim",
              halfDim: "halfDim",
              aug: "aug",
              seventh: "seventh",
              // suspended
              sus: "sus",
              sus2: "sus2",
              // extensions
              ninth: "ninth",
              eleventh: "eleventh",
              thirteenth: "thirteenth",
              // alterations
              fifthFlat: "b5",
              fifthSharp: "#5",
              ninthFlat: "b9",
              ninthSharp: "#9",
              eleventhSharp: "#11",
              thirteenthFlat: "b13",
              // added
              add3: "add3",
              add4: "add4",
              addb6: "addb6",
              add6: "add6",
              add69: "add69",
              add7: "add7",
              add9: "add9",
              add11: "add11",
              add13: "add13",
              // special
              bass: "bass",
              omit3: "omit3",
              omit5: "omit5",
              power: "power",
              alt: "alt"
            };
            var major = {
              "^": [allModifiers.ma, allModifiers.add7],
              \u0394: [allModifiers.ma, allModifiers.add7],
              M: allModifiers.ma,
              Ma: allModifiers.ma,
              Maj: allModifiers.ma,
              Major: allModifiers.ma,
              ma: allModifiers.ma,
              maj: allModifiers.ma,
              major: allModifiers.ma
            };
            var major7th = getDerivedModifiers(major, allModifiers.add7, function(symbol) {
              return symbol + "7";
            });
            var add7 = getDerivedModifiers(major, allModifiers.add7, function(symbol) {
              return "add" + symbol + "7";
            });
            var allSymbols = modifiers_objectSpread(modifiers_objectSpread(modifiers_objectSpread(modifiers_objectSpread({}, major), major7th), {}, {
              // minor
              "-": allModifiers.mi,
              m: allModifiers.mi,
              Mi: allModifiers.mi,
              Min: allModifiers.mi,
              Minor: allModifiers.mi,
              mi: allModifiers.mi,
              min: allModifiers.mi,
              minor: allModifiers.mi,
              // diminished / augmented
              "\xB0": allModifiers.dim,
              o: allModifiers.dim,
              0: allModifiers.dim,
              dim: allModifiers.dim,
              "dim.": allModifiers.dim,
              diminished: allModifiers.dim,
              \u00D8: allModifiers.halfDim,
              \u00F8: allModifiers.halfDim,
              h: allModifiers.halfDim,
              "+": allModifiers.aug,
              aug: allModifiers.aug,
              augmented: allModifiers.aug,
              // seventh
              7: allModifiers.seventh,
              // suspended
              4: allModifiers.sus,
              sus: allModifiers.sus,
              sus4: allModifiers.sus,
              suspended: allModifiers.sus,
              suspended4: allModifiers.sus,
              sus2: allModifiers.sus2,
              suspended2: allModifiers.sus2,
              // extensions
              9: allModifiers.ninth,
              11: allModifiers.eleventh,
              13: allModifiers.thirteenth,
              // alterations
              b3: allModifiers.mi,
              b5: allModifiers.fifthFlat,
              "\u266D5": allModifiers.fifthFlat,
              "#5": allModifiers.fifthSharp,
              "\u266F5": allModifiers.fifthSharp,
              b9: allModifiers.ninthFlat,
              "\u266D9": allModifiers.ninthFlat,
              addb9: allModifiers.ninthFlat,
              "add\u266D9": allModifiers.ninthFlat,
              "#9": allModifiers.ninthSharp,
              "\u266F9": allModifiers.ninthSharp,
              "add#9": allModifiers.ninthSharp,
              "add\u266F9": allModifiers.ninthSharp,
              "#11": allModifiers.eleventhSharp,
              "\u266F11": allModifiers.eleventhSharp,
              "add#11": allModifiers.eleventhSharp,
              b13: allModifiers.thirteenthFlat,
              "\u266D13": allModifiers.thirteenthFlat,
              addb13: allModifiers.thirteenthFlat,
              "add\u266D13": allModifiers.thirteenthFlat
            }, add7), {}, {
              2: allModifiers.add9,
              add2: allModifiers.add9,
              add3: allModifiers.add3,
              add4: allModifiers.add4,
              addb6: allModifiers.addb6,
              b6: allModifiers.addb6,
              6: allModifiers.add6,
              add6: allModifiers.add6,
              "6/9": allModifiers.add69,
              69: allModifiers.add69,
              96: allModifiers.add69,
              "9/6": allModifiers.add69,
              add9: allModifiers.add9,
              add11: allModifiers.add11,
              add13: allModifiers.add13,
              // special
              bass: allModifiers.bass,
              omit3: allModifiers.omit3,
              no3: allModifiers.omit3,
              omit5: allModifiers.omit5,
              no5: allModifiers.omit5,
              5: allModifiers.power,
              alt: allModifiers.alt,
              "alt.": allModifiers.alt,
              altered: allModifiers.alt
            });
            function getDerivedModifiers(source, modifierId, derivedFn) {
              return Object.keys(source).map(derivedFn).reduce(function(acc, curr) {
                acc[curr] = modifierId;
                return acc;
              }, {});
            }
            var modifiers_allVariants = Object.keys(allSymbols).sort(function(a, b) {
              return b.length - a.length;
            });
            const modifiers = allModifiers;
            ;
            const intervalsToSemitones = {
              1: 0,
              2: 2,
              b3: 3,
              3: 4,
              4: 5,
              b5: 6,
              5: 7,
              "#5": 8,
              b6: 8,
              6: 9,
              bb7: 9,
              b7: 10,
              7: 11,
              b9: 13,
              9: 14,
              "#9": 15,
              11: 17,
              "#11": 18,
              b13: 20,
              13: 21
            };
            ;
            function parseDescriptor_toConsumableArray(arr) {
              return parseDescriptor_arrayWithoutHoles(arr) || parseDescriptor_iterableToArray(arr) || parseDescriptor_unsupportedIterableToArray(arr) || parseDescriptor_nonIterableSpread();
            }
            function parseDescriptor_nonIterableSpread() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function parseDescriptor_unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return parseDescriptor_arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return parseDescriptor_arrayLikeToArray(o, minLen);
            }
            function parseDescriptor_iterableToArray(iter) {
              if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
            }
            function parseDescriptor_arrayWithoutHoles(arr) {
              if (Array.isArray(arr)) return parseDescriptor_arrayLikeToArray(arr);
            }
            function parseDescriptor_arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
              }
              return arr2;
            }
            function parseDescriptor(altIntervals, chord) {
              var allModifiers2 = [];
              if (chord.input.parsableDescriptor) {
                allModifiers2 = getModifiers(chord);
              }
              chord.input.modifiers = allModifiers2;
              chord.normalized.intervals = getIntervals(allModifiers2, altIntervals);
              chord.normalized.semitones = getSemitones(chord.normalized.intervals);
              chord.normalized.intents = getIntents(allModifiers2);
              return chord;
            }
            function getModifiers(chord) {
              var parsableDescriptor = chord.input.parsableDescriptor;
              var modifiers2 = [];
              var descriptorRegex = new RegExp(modifiers_allVariants.map(escapeRegex).join("|"), "g");
              var descriptorMatches = parsableDescriptor.match(descriptorRegex);
              var remainingChars = parsableDescriptor;
              var allModifiersId;
              if (descriptorMatches) {
                descriptorMatches.forEach(function(match) {
                  allModifiersId = allSymbols[match];
                  if (!Array.isArray(allModifiersId)) {
                    allModifiersId = [allModifiersId];
                  }
                  allModifiersId.forEach(function(modifierId) {
                    if (modifiers2.includes(modifierId)) {
                      return;
                    }
                    modifiers2.push(modifierId);
                    remainingChars = remainingChars.replace(match, "");
                  });
                });
              }
              if (modifiers2.length === 0) {
                throw new NoSymbolFoundError(chord);
              }
              if (remainingChars.trim().length > 0) {
                throw new InvalidModifierError(chord, remainingChars);
              }
              return modifiers2;
            }
            function getIntervals(allModifiers2, altIntervals) {
              if (allModifiers2.includes(modifiers.power)) {
                return ["1", "5"];
              } else if (allModifiers2.includes(modifiers.bass)) {
                return ["1"];
              }
              return uniq_default()(["1"].concat(parseDescriptor_toConsumableArray(getThird(allModifiers2)), parseDescriptor_toConsumableArray(getFourth(allModifiers2)), parseDescriptor_toConsumableArray(getFifths(allModifiers2, altIntervals)), parseDescriptor_toConsumableArray(getSixth(allModifiers2)), parseDescriptor_toConsumableArray(getSevenths(allModifiers2)), parseDescriptor_toConsumableArray(getNinths(allModifiers2, altIntervals)), parseDescriptor_toConsumableArray(getElevenths(allModifiers2, altIntervals)), parseDescriptor_toConsumableArray(getThirteenths(allModifiers2, altIntervals)))).sort(function(a, b) {
                return intervalsToSemitones[a] - intervalsToSemitones[b];
              });
            }
            function getThird(allModifiers2) {
              var third = [];
              if (allModifiers2.includes(modifiers.omit3)) {
                return [];
              }
              if (!hasOneOf(allModifiers2, [modifiers.sus, modifiers.sus2])) {
                if (!hasMajorIntent(allModifiers2)) {
                  third.push("b3");
                } else if (!allModifiers2.includes(modifiers.eleventh)) {
                  third.push("3");
                }
              }
              if (allModifiers2.includes(modifiers.add3)) {
                third.push("3");
              }
              return third;
            }
            function getFourth(allModifiers2) {
              var fourth = [];
              if (hasOneOf(allModifiers2, [modifiers.sus, modifiers.add4])) {
                fourth.push("4");
              }
              return fourth;
            }
            function getFifths(allModifiers2, altIntervals) {
              var fifths = [];
              if (allModifiers2.includes(modifiers.omit5)) {
                return [];
              }
              if (hasOneOf(allModifiers2, [modifiers.dim, modifiers.halfDim, modifiers.fifthFlat]) || shouldAlter(allModifiers2, altIntervals, "b5")) {
                fifths.push("b5");
              }
              if (hasOneOf(allModifiers2, [modifiers.aug, modifiers.fifthSharp]) || shouldAlter(allModifiers2, altIntervals, "#5")) {
                fifths.push("#5");
              }
              if (!fifths.length && !allModifiers2.includes(modifiers.thirteenthFlat)) {
                fifths.push("5");
              }
              return fifths;
            }
            function getSixth(allModifiers2) {
              var sixth = [];
              if (hasOneOf(allModifiers2, [modifiers.addb6])) {
                sixth.push("b6");
              }
              if (hasOneOf(allModifiers2, [modifiers.add6, modifiers.add69]) && !isExtended(allModifiers2) && !hasOneOf(allModifiers2, [modifiers.halfDim])) {
                sixth.push("6");
              }
              return sixth;
            }
            function getSevenths(allModifiers2) {
              var sevenths = [];
              if (hasOneOf(allModifiers2, [modifiers.alt])) {
                sevenths.push("b7");
              }
              if (hasOneOf(allModifiers2, [modifiers.seventh, modifiers.halfDim])) {
                if (allModifiers2.includes(modifiers.dim)) {
                  sevenths.push("bb7");
                } else if (allModifiers2.includes(modifiers.halfDim)) {
                  sevenths.push("b7");
                } else {
                  sevenths.push(getMinorOrMajorSeventh(allModifiers2));
                }
              } else if (hasOneOf(allModifiers2, [modifiers.ninth, modifiers.eleventh, modifiers.thirteenth])) {
                sevenths.push(getMinorOrMajorSeventh(allModifiers2));
              }
              if (allModifiers2.includes(modifiers.add7)) {
                sevenths.push("7");
              }
              return sevenths;
            }
            function getMinorOrMajorSeventh(allModifiers2) {
              return allModifiers2.includes(modifiers.ma) ? "7" : "b7";
            }
            function getNinths(allModifiers2, altIntervals) {
              var ninth = [];
              if (hasOneOf(allModifiers2, [modifiers.add69, modifiers.ninth, modifiers.eleventh, modifiers.thirteenth]) && hasNoneOf(allModifiers2, [modifiers.ninthFlat, modifiers.ninthSharp])) {
                ninth.push("9");
              }
              if (hasOneOf(allModifiers2, [modifiers.sus2, modifiers.add9])) {
                ninth.push("9");
              }
              if (hasOneOf(allModifiers2, [modifiers.ninthFlat]) || shouldAlter(allModifiers2, altIntervals, "b9")) {
                ninth.push("b9");
              }
              if (hasOneOf(allModifiers2, [modifiers.ninthSharp]) || shouldAlter(allModifiers2, altIntervals, "#9")) {
                ninth.push("#9");
              }
              return ninth;
            }
            function getElevenths(allModifiers2, altIntervals) {
              var elevenths = [];
              if (hasOneOf(allModifiers2, [modifiers.thirteenth]) && !hasMajorIntent(allModifiers2)) {
                elevenths.push("11");
              } else if (hasOneOf(allModifiers2, [modifiers.eleventh, modifiers.add11])) {
                elevenths.push("11");
              }
              if (hasOneOf(allModifiers2, [modifiers.eleventhSharp]) || shouldAlter(allModifiers2, altIntervals, "#11")) {
                elevenths.push("#11");
              }
              return elevenths;
            }
            function getThirteenths(allModifiers2, altIntervals) {
              var thirteenths = [];
              if (hasOneOf(allModifiers2, [modifiers.add13, modifiers.thirteenth]) || hasOneOf(allModifiers2, [modifiers.add6, modifiers.add69]) && isExtended(allModifiers2) || hasOneOf(allModifiers2, [modifiers.add6, modifiers.add69]) && hasOneOf(allModifiers2, [modifiers.halfDim])) {
                thirteenths.push("13");
              }
              if (hasOneOf(allModifiers2, [modifiers.thirteenthFlat]) || shouldAlter(allModifiers2, altIntervals, "b13")) {
                thirteenths.push("b13");
              }
              return thirteenths;
            }
            function shouldAlter(allModifiers2, altIntervals, interval) {
              return allModifiers2.includes(modifiers.alt) && altIntervals.includes(interval);
            }
            function hasMajorIntent(allModifiers2) {
              return hasNoneOf(allModifiers2, [modifiers.mi, modifiers.dim, modifiers.dim7, modifiers.halfDim]);
            }
            function isExtended(allModifiers2) {
              return hasOneOf(allModifiers2, [modifiers.seventh, modifiers.ninth, modifiers.eleventh, modifiers.thirteenth]);
            }
            function escapeRegex(string) {
              return string.replace(/[.\-*+?^${}()|[\]\\]/g, "\\$&");
            }
            function getSemitones(allIntervals) {
              return allIntervals.map(function(interval) {
                return intervalsToSemitones[interval];
              }).sort(function(a, b) {
                return a - b;
              });
            }
            function getIntents(allModifiers2) {
              return {
                major: hasMajorIntent(allModifiers2),
                eleventh: allModifiers2.includes(modifiers.eleventh),
                alt: allModifiers2.includes(modifiers.alt)
              };
            }
            ;
            function chordParserFactory_toConsumableArray(arr) {
              return chordParserFactory_arrayWithoutHoles(arr) || chordParserFactory_iterableToArray(arr) || chordParserFactory_unsupportedIterableToArray(arr) || chordParserFactory_nonIterableSpread();
            }
            function chordParserFactory_nonIterableSpread() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function chordParserFactory_unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return chordParserFactory_arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return chordParserFactory_arrayLikeToArray(o, minLen);
            }
            function chordParserFactory_iterableToArray(iter) {
              if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
            }
            function chordParserFactory_arrayWithoutHoles(arr) {
              if (Array.isArray(arr)) return chordParserFactory_arrayLikeToArray(arr);
            }
            function chordParserFactory_arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
              }
              return arr2;
            }
            function chordParserFactory2() {
              var parserConfiguration = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
              var allAltIntervals = ["b5", "#5", "b9", "#9", "#11", "b13"];
              var allNotationSystems2 = ["english", "german", "latin"];
              var _parserConfiguration$ = parserConfiguration.notationSystems, notationSystems = _parserConfiguration$ === void 0 ? cloneDeep_default()(allNotationSystems2) : _parserConfiguration$, _parserConfiguration$2 = parserConfiguration.altIntervals, altIntervals = _parserConfiguration$2 === void 0 ? cloneDeep_default()(allAltIntervals) : _parserConfiguration$2, _parserConfiguration$3 = parserConfiguration.customFilters, customFilters = _parserConfiguration$3 === void 0 ? [] : _parserConfiguration$3;
              checkAltIntervals(altIntervals, allAltIntervals);
              checkNotationSystems(notationSystems, allNotationSystems2);
              helpers_checkCustomFilters(customFilters);
              return parseChord;
              function parseChord(symbol) {
                var allErrors = [];
                if (!isInputValid(symbol)) {
                  var e = new InvalidInputError();
                  allErrors.push(formatError(e));
                }
                var allVariantsPerGroupCopy = cloneDeep_default()(allVariantsPerGroup).filter(function(variantsGroup) {
                  return notationSystems.includes(variantsGroup.name);
                });
                var chord;
                var allFilters;
                var variants;
                if (!allErrors.length) {
                  while (allVariantsPerGroupCopy.length && !chord) {
                    variants = allVariantsPerGroupCopy.shift();
                    allFilters = [initChord.bind(null, parserConfiguration), parseBase.bind(null, variants.notes), getParsableDescriptor, parseDescriptor.bind(null, altIntervals), checkIntervalsConsistency, normalizeNotes, normalizeDescriptor, formatSymbolParts, formatSymbol, nameIndividualChordNotes].concat(chordParserFactory_toConsumableArray(customFilters));
                    try {
                      chord = chain(allFilters, symbol);
                      if (chord) {
                        chord.input.notationSystem = variants.name;
                      } else {
                        allErrors.push(getUnexpectedError(variants.name));
                      }
                    } catch (e2) {
                      allErrors.push(formatError(e2, variants.name));
                    }
                  }
                }
                return chord ? chord : {
                  error: allErrors
                };
              }
            }
            function checkAltIntervals(altIntervals, allAltIntervals) {
              checkArray("altIntervals", altIntervals, allAltIntervals, true);
            }
            function checkNotationSystems(notationSystems, allNotationSystems2) {
              checkArray("notationSystems", notationSystems, allNotationSystems2);
            }
            function checkArray(arrayName, arrayToTest, allowedValues, allowEmpty) {
              if (!Array.isArray(arrayToTest)) {
                throw new TypeError("'".concat(arrayName, "' should be an array"));
              }
              if (!allowEmpty && arrayToTest.length === 0) {
                throw new TypeError("'".concat(arrayName, "' cannot be empty"));
              }
              arrayToTest.forEach(function(system) {
                if (!allowedValues.includes(system)) {
                  throw new TypeError("'".concat(system, "' is not a valid value for ").concat(arrayName));
                }
              });
            }
            function isInputValid(input) {
              return typeof input === "string" && input.length > 0;
            }
            function getUnexpectedError(notationSystem) {
              var error = new UnexpectedError();
              return formatError(error, notationSystem);
            }
            function formatError(exceptionError, notationSystem) {
              return {
                type: exceptionError.name,
                chord: exceptionError.chord,
                message: exceptionError.message,
                notationSystem
              };
            }
            const parser_chordParserFactory = chordParserFactory2;
            ;
            function shortenNormalized_ownKeys(object, enumerableOnly) {
              var keys = Object.keys(object);
              if (Object.getOwnPropertySymbols) {
                var symbols = Object.getOwnPropertySymbols(object);
                enumerableOnly && (symbols = symbols.filter(function(sym) {
                  return Object.getOwnPropertyDescriptor(object, sym).enumerable;
                })), keys.push.apply(keys, symbols);
              }
              return keys;
            }
            function shortenNormalized_objectSpread(target) {
              for (var i = 1; i < arguments.length; i++) {
                var source = null != arguments[i] ? arguments[i] : {};
                i % 2 ? shortenNormalized_ownKeys(Object(source), true).forEach(function(key) {
                  shortenNormalized_defineProperty(target, key, source[key]);
                }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : shortenNormalized_ownKeys(Object(source)).forEach(function(key) {
                  Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
                });
              }
              return target;
            }
            function shortenNormalized_defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            var shortDescriptors = {
              sus2: "sus2",
              add2: "2",
              omit: "no",
              ma: "M",
              mi: "m",
              dim: "\xB0",
              aug7: "7+",
              eleventh: "11"
            };
            function shortenNormalized(chord) {
              var descriptor;
              var chordChanges = chord.formatted.chordChanges;
              if (isSus2(chord)) {
                descriptor = shortDescriptors.sus2;
                chordChanges = [];
              } else if (isAdd2(chord)) {
                descriptor = shortDescriptors.add2;
                chordChanges = [];
              } else if (isAug7(chord)) {
                descriptor = shortDescriptors.aug7;
                chordChanges = [];
              } else {
                descriptor = chord.formatted.descriptor.replace("mi", shortDescriptors.mi).replace(/[m|M]a/, shortDescriptors.ma).replace("dim", shortDescriptors.dim);
                if (isEleventh(chord)) {
                  descriptor = descriptor.replace(/7sus|9sus/, shortDescriptors.eleventh);
                }
              }
              chordChanges = chordChanges.map(function(change) {
                return change.replace(/[m|M]a/, shortDescriptors.ma).replace("omit", shortDescriptors.omit);
              });
              return shortenNormalized_objectSpread(shortenNormalized_objectSpread({}, chord), {}, {
                formatted: shortenNormalized_objectSpread(shortenNormalized_objectSpread({}, chord.formatted), {}, {
                  descriptor,
                  chordChanges
                })
              });
            }
            function isSus2(chord) {
              return hasExactly(chord.normalized.intervals, ["1", "5", "9"]);
            }
            function isAdd2(chord) {
              return hasExactly(chord.normalized.intervals, ["1", "3", "5", "9"]);
            }
            function isAug7(chord) {
              return hasExactly(chord.normalized.intervals, ["1", "3", "#5", "b7"]);
            }
            function isEleventh(chord) {
              return chord.normalized.intents.eleventh;
            }
            var difference = __webpack_require__(1966);
            var difference_default = /* @__PURE__ */ __webpack_require__.n(difference);
            ;
            function simplify_simplify() {
              var level = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "none";
              var chord = arguments.length > 1 ? arguments[1] : void 0;
              if (level === "none") {
                return chord;
              }
              var intervalsToRemove = {
                max: ["4", "b5", "#5", "6", "bb7", "b7", "7", "b9", "9", "#9", "11", "#11", "b13", "13"],
                core: ["4", "b9", "9", "#9", "11", "#11", "b13", "13"]
              };
              var intervals = difference_default()(chord.normalized.intervals, intervalsToRemove[level]);
              if (hasNoneOf(intervals, ["b3", "3"])) {
                intervals.push(chord.normalized.intents.major ? "3" : "b3");
              }
              if (hasNoneOf(intervals, ["b5", "5", "#5"])) {
                intervals.push("5");
              }
              chord.normalized.intervals = intervals;
              chord.normalized.semitones = intervals.map(function(interval) {
                return intervalsToSemitones[interval];
              });
              chord.normalized.intents.eleventh = false;
              chord.normalized.intents.alt = false;
              if (level === "max") {
                delete chord.normalized.bassNote;
              }
              var allFilters = [normalizeDescriptor, formatSymbolParts, nameIndividualChordNotes];
              return chain(allFilters, chord);
            }
            var invert = __webpack_require__(3137);
            var invert_default = /* @__PURE__ */ __webpack_require__.n(invert);
            ;
            var transpose_notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            var sharpsToFlats = {
              "C#": "Db",
              "D#": "Eb",
              "F#": "Gb",
              "G#": "Ab",
              "A#": "Bb"
            };
            var flatsToSharps = invert_default()(sharpsToFlats);
            function transpose(transposeValue, useFlats, chord) {
              var _chord$normalized = chord.normalized, rootNote = _chord$normalized.rootNote, bassNote = _chord$normalized.bassNote;
              var rootSharp = convertToSharp(rootNote);
              chord.normalized.rootNote = transposeNote(rootSharp, transposeValue, useFlats);
              chord.formatted.rootNote = chord.normalized.rootNote;
              if (bassNote) {
                var bassSharp = convertToSharp(bassNote);
                chord.normalized.bassNote = transposeNote(bassSharp, transposeValue, useFlats);
                chord.formatted.bassNote = chord.normalized.bassNote;
              }
              return nameIndividualChordNotes(chord);
            }
            function transposeNote(note, value, useFlats) {
              var noteIndex = transpose_notes.indexOf(note);
              var transposedIndex = noteIndex + value;
              var octaves = Math.floor(transposedIndex / 12);
              var correctedTransposedIndex = transposedIndex - octaves * 12;
              var transposed = transpose_notes[correctedTransposedIndex];
              return useFlats ? sharpsToFlats[transposed] || transposed : transposed;
            }
            function convertToSharp(note) {
              return flatsToSharps[note] || note;
            }
            ;
            var translationTables = {
              german: {
                Ab: "As",
                A: "A",
                "A#": "Ais",
                Bb: "Hes",
                B: "H",
                C: "C",
                "C#": "Cis",
                Db: "Des",
                D: "D",
                "D#": "Dis",
                Eb: "Es",
                E: "E",
                F: "F",
                "F#": "Fis",
                Gb: "Ges",
                G: "G",
                "G#": "Gis"
              },
              latin: {
                Ab: "Lab",
                A: "La",
                "A#": "La#",
                Bb: "Sib",
                B: "Si",
                C: "Do",
                "C#": "Do#",
                Db: "Reb",
                D: "Re",
                "D#": "Re#",
                Eb: "Mib",
                E: "Mi",
                F: "Fa",
                "F#": "Fa#",
                Gb: "Solb",
                G: "Sol",
                "G#": "Sol#"
              }
            };
            var allNotationSystems = Object.keys(translationTables);
            function convertNotationSystem() {
              var notationSystem = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "english";
              var chord = arguments.length > 1 ? arguments[1] : void 0;
              var finalNotationSystem = notationSystem === "auto" ? chord.input.notationSystem : notationSystem;
              if (finalNotationSystem === "english") return chord;
              if (!allNotationSystems.includes(finalNotationSystem)) return null;
              chord.formatted.rootNote = translationTables[finalNotationSystem][chord.formatted.rootNote];
              if (chord.formatted.bassNote) {
                chord.formatted.bassNote = translationTables[finalNotationSystem][chord.formatted.bassNote];
              }
              return chord;
            }
            ;
            function textPrinter(chord) {
              return chord && chord.formatted && chord.formatted.symbol ? chord.formatted.symbol : null;
            }
            ;
            function rawPrinter(chord) {
              delete chord.parserConfiguration.notationSystems;
              var cloned = cloneDeep_default()(chord);
              var textPrinted = textPrinter(chord);
              var parseChord = parser_chordParserFactory(chord.parserConfiguration);
              var reParsed = parseChord(textPrinted);
              cloned.input = reParsed.input;
              return cloned;
            }
            ;
            function chordRendererFactory_typeof(obj) {
              "@babel/helpers - typeof";
              return chordRendererFactory_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
                return typeof obj2;
              } : function(obj2) {
                return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
              }, chordRendererFactory_typeof(obj);
            }
            function chordRendererFactory_toConsumableArray(arr) {
              return chordRendererFactory_arrayWithoutHoles(arr) || chordRendererFactory_iterableToArray(arr) || chordRendererFactory_unsupportedIterableToArray(arr) || chordRendererFactory_nonIterableSpread();
            }
            function chordRendererFactory_nonIterableSpread() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function chordRendererFactory_unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return chordRendererFactory_arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return chordRendererFactory_arrayLikeToArray(o, minLen);
            }
            function chordRendererFactory_iterableToArray(iter) {
              if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
            }
            function chordRendererFactory_arrayWithoutHoles(arr) {
              if (Array.isArray(arr)) return chordRendererFactory_arrayLikeToArray(arr);
            }
            function chordRendererFactory_arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) {
                arr2[i] = arr[i];
              }
              return arr2;
            }
            function chordRendererFactory2() {
              var _ref = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, _ref$useShortNamings = _ref.useShortNamings, useShortNamings = _ref$useShortNamings === void 0 ? false : _ref$useShortNamings, _ref$simplify = _ref.simplify, simplify = _ref$simplify === void 0 ? "none" : _ref$simplify, _ref$transposeValue = _ref.transposeValue, transposeValue = _ref$transposeValue === void 0 ? 0 : _ref$transposeValue, _ref$harmonizeAcciden = _ref.harmonizeAccidentals, harmonizeAccidentals = _ref$harmonizeAcciden === void 0 ? false : _ref$harmonizeAcciden, _ref$useFlats = _ref.useFlats, useFlats = _ref$useFlats === void 0 ? false : _ref$useFlats, _ref$printer = _ref.printer, printer = _ref$printer === void 0 ? "text" : _ref$printer, _ref$notationSystem = _ref.notationSystem, notationSystem = _ref$notationSystem === void 0 ? "english" : _ref$notationSystem, _ref$customFilters = _ref.customFilters, customFilters = _ref$customFilters === void 0 ? [] : _ref$customFilters;
              helpers_checkCustomFilters(customFilters);
              var allFilters = [];
              if (["max", "core"].includes(simplify)) {
                allFilters.push(simplify_simplify.bind(null, simplify));
              }
              if (harmonizeAccidentals || transposeValue !== 0) {
                allFilters.push(transpose.bind(null, transposeValue, useFlats));
              }
              if (useShortNamings) {
                allFilters.push(shortenNormalized);
              }
              allFilters.push.apply(allFilters, [convertNotationSystem.bind(null, notationSystem), formatSymbol].concat(chordRendererFactory_toConsumableArray(customFilters)));
              return renderChord;
              function renderChord(chord) {
                if (!isValidChord(chord)) {
                  return null;
                }
                var filteredChord = chain(allFilters, cloneDeep_default()(chord));
                return printer === "raw" ? rawPrinter(filteredChord) : textPrinter(filteredChord);
              }
            }
            var isValidChord = function isValidChord2(chord) {
              return chord && chordRendererFactory_typeof(chord) === "object" && !chord.error && chord.input;
            };
            const renderer_chordRendererFactory = chordRendererFactory2;
            ;
          })();
          return __webpack_exports__;
        })()
      );
    });
  }
});

// src/lib/index.js
var import_promise = __toESM(require_promise(), 1);

// src/lib/parser.js
var import_fast_diff = __toESM(require_diff(), 1);
var Playlist = class {
  constructor(ireal) {
    const playlistEncoded = /.*?(irealb(?:ook)?):\/\/([^"]*)/.exec(ireal);
    const playlist = decodeURIComponent(playlistEncoded[2]);
    const parts = playlist.split("===");
    if (parts.length > 1) this.name = parts.pop();
    this.songs = parts.map((part) => {
      try {
        return new Song(part, playlistEncoded[1] === "irealbook");
      } catch (error) {
        const parts2 = part.split("=");
        const title = Song.parseTitle(parts2[0].trim());
        console.error(`[ireal-musicxml] [${title}] ${error}`);
        return null;
      }
    }).filter((song) => song !== null).reduce((songs, song) => {
      if (songs.length > 0) {
        const diffs = (0, import_fast_diff.default)(songs[songs.length - 1].title, song.title);
        if (diffs[0][0] === 0 && diffs.every((d) => d[0] === 0 || d[1].match(/^\d+$/))) {
          songs[songs.length - 1].cells = songs[songs.length - 1].cells.concat(song.cells);
          return songs;
        }
      }
      songs.push(song);
      return songs;
    }, []);
  }
};
var Cell = class {
  constructor() {
    this.annots = [];
    this.comments = [];
    this.bars = "";
    this.spacer = 0;
    this.chord = null;
  }
};
var Chord = class {
  constructor(note, modifiers = "", over = null, alternate = null) {
    this.note = note;
    this.modifiers = modifiers;
    this.over = over;
    this.alternate = alternate;
  }
};
var Song = class _Song {
  constructor(ireal, oldFormat = false) {
    this.cells = [];
    this.musicXml = "";
    if (!ireal) {
      this.title = "";
      this.composer = "";
      this.style = "";
      this.key = "";
      this.transpose = 0;
      this.groove = "";
      this.bpm = 0;
      this.repeats = 0;
      return;
    }
    const parts = ireal.split("=");
    if (oldFormat) {
      this.title = _Song.parseTitle(parts[0].trim());
      this.composer = _Song.parseComposer(parts[1].trim());
      this.style = parts[2].trim();
      this.key = parts[3];
      this.cells = this.parse(parts[5]);
    } else {
      this.title = _Song.parseTitle(parts[0].trim());
      this.composer = _Song.parseComposer(parts[1].trim());
      this.style = parts[3].trim();
      this.key = parts[4];
      this.transpose = +parts[5] || 0;
      this.groove = parts[7];
      this.bpm = +parts[8];
      this.repeats = +parts[9] || 3;
      const music = parts[6].split("1r34LbKcu7");
      this.cells = this.parse(unscramble(music[1]));
    }
  }
  /**
   * The RegExp for a complete chord. The match array contains:
   * 1 - the base note
   * 2 - the modifiers (+-ohd0123456789 and su for sus)
   * 3 - any comments (may be e.g. add, sub, or private stuff)
   * 4 - the "over" part starting with a slash
   * 5 - the top chord as (chord)
   * @type RegExp
   */
  static chordRegex = /^([A-G][b#]?)((?:sus|alt|add|[+\-^\dhob#])*)(\*.+?\*)*(\/[A-G][#b]?)?(\(.*?\))?/;
  static chordRegex2 = /^([ Wp])()()(\/[A-G][#b]?)?(\(.*?\))?/;
  // need the empty captures to match chordRegex
  static regExps = [
    /^\*[a-zA-Z]/,
    // section
    /^T\d\d/,
    // time measurement
    /^N./,
    // repeat marker
    /^<.*?>/,
    // comments
    _Song.chordRegex,
    // chords
    _Song.chordRegex2
    // space, W and p (with optional alt chord)
  ];
  /**
   * The parser cracks up the raw music string into several objects,
   * one for each cell. iReal Pro works with rows of 16 cell each. The result
   * is stored at song.cells.
   *
   * Each object has the following properties:
   *
   * chord: if non-null, a chord object with these properties:
   *   note      - the base note (also blank, W = invisible root, p/x/r - pause/bar repeat/double-bar repeat, n - no chord)
   *   modifiers - the modifiers, like 7, + o etc (string)
   *   over      - if non-null, another chord object for the under-note
   *   alternate - if non-null another chord object for the alternate chord
   * annots: annotations, a string of:
   *  *x  - section, like *v, *I, *A, *B etc
   *  Nx  - repeat bots (N1, N2 etc)
   *  Q   - coda
   *  S   - segno
   *  Txx - measure (T44 = 4/4 etc, but T12 = 12/8)
   *  U   - END
   *  f   - fermata
   *  l   - (letter l) normal notes
   *  s   - small notes
   * comments: an array of comment strings
   * bars: bar specifiers, a string of:
   *  | - single vertical bar, left
   *  [ - double bar, left
   *  ] - double bar, right
   *  { - repeat bar, left
   *  } - repeat bar, right
   *  Z - end bar, right
   * spacer - a number indicating the number of vertical spacers above this cell
   *
   * @returns [Cell]
   */
  parse(ireal) {
    let text = ireal.trim();
    const arr = [];
    while (text) {
      let found = false;
      for (let i = 0; i < _Song.regExps.length; i++) {
        const match = _Song.regExps[i].exec(text);
        if (match) {
          found = true;
          if (match.length <= 2) {
            arr.push(match[0]);
            text = text.substr(match[0].length);
          } else {
            arr.push(match);
            text = text.substr(match[0].length);
          }
          break;
        }
      }
      if (!found) {
        if (text[0] !== ",")
          arr.push(text[0]);
        text = text.substr(1);
      }
    }
    const cells = [];
    let obj = this.newCell(cells);
    let prevobj = null;
    for (let i = 0; i < arr.length; i++) {
      let cell = arr[i];
      if (cell instanceof Array) {
        obj.chord = this.parseChord(cell);
        cell = " ";
      }
      switch (cell[0]) {
        case "{":
        // open repeat
        case "[":
          if (prevobj) {
            prevobj.bars += ")";
            prevobj = null;
          }
          obj.bars = cell;
          cell = null;
          break;
        case "|":
          if (prevobj) {
            prevobj.bars += ")";
            prevobj = null;
          }
          obj.bars = "(";
          cell = null;
          break;
        case "]":
        // close double bar
        case "}":
        // close repeat
        case "Z":
          if (prevobj) {
            prevobj.bars += cell;
            prevobj = null;
          }
          cell = null;
          break;
        case "n":
          obj.chord = new Chord(cell[0]);
          break;
        case ",":
          cell = null;
          break;
        // separator
        case "S":
        // segno
        case "T":
        // time measurement
        case "Q":
        // coda
        case "N":
        // repeat
        case "U":
        // END
        case "s":
        // small
        case "l":
        // normal
        case "f":
        // fermata
        case "*":
          obj.annots.push(cell);
          cell = null;
          break;
        case "Y":
          obj.spacer++;
          cell = null;
          prevobj = null;
          break;
        case "r":
        case "x":
        case "W":
          obj.chord = new Chord(cell);
          break;
        case "<":
          cell = cell.substr(1, cell.length - 2);
          obj.comments.push(cell);
          cell = null;
          break;
        default:
      }
      if (cell && i < arr.length - 1) {
        prevobj = obj;
        obj = this.newCell(cells);
      }
    }
    return cells;
  }
  /**
   * The title had "A" and "The" at the back (e.g. "Gentle Rain, The")
   */
  static parseTitle(title) {
    return title.replace(/(.*)(, )(A|The)$/g, "$3 $1");
  }
  /**
   * The composer is reversed (last first) if it only has 2 names :shrug:
   */
  static parseComposer(composer) {
    const parts = composer.split(/(\s+)/);
    if (parts.length == 3) {
      return parts[2] + parts[1] + parts[0];
    }
    return composer;
  }
  parseChord(chord) {
    var note = chord[1] || " ";
    var modifiers = chord[2] || "";
    var comment = chord[3] || "";
    if (comment)
      modifiers += comment.substr(1, comment.length - 2);
    var over = chord[4] || "";
    if (over[0] === "/")
      over = over.substr(1);
    var alternate = chord[5] || null;
    if (alternate) {
      chord = _Song.chordRegex.exec(alternate.substr(1, alternate.length - 2));
      if (!chord)
        alternate = null;
      else
        alternate = this.parseChord(chord);
    }
    if (note === " " && !alternate && !over)
      return null;
    if (over) {
      var offset = over[1] === "#" || over[1] === "b" ? 2 : 1;
      over = new Chord(over.substr(0, offset), over.substr(offset), null, null);
    } else
      over = null;
    return new Chord(note, modifiers, over, alternate);
  }
  newCell(cells) {
    var obj = new Cell();
    cells.push(obj);
    return obj;
  }
};
function unscramble(s) {
  let r = "", p;
  while (s.length > 51) {
    p = s.substring(0, 50);
    s = s.substring(50);
    r = r + obfusc50(p);
  }
  r = r + s;
  r = r.replace(/Kcl/g, "| x").replace(/LZ/g, " |").replace(/XyQ/g, "   ");
  return r;
}
function obfusc50(s) {
  const newString = s.split("");
  for (let i = 0; i < 5; i++) {
    newString[49 - i] = s[i];
    newString[i] = s[49 - i];
  }
  for (let i = 10; i < 24; i++) {
    newString[49 - i] = s[i];
    newString[i] = s[49 - i];
  }
  return newString.join("");
}

// src/lib/converter.js
var import_jstoxml = __toESM(require_jstoxml(), 1);
var import_chord_symbol = __toESM(require_chord_symbol(), 1);

// package.json
var package_default = {
  name: "ireal-musicxml",
  version: "2.0.0",
  description: "iReal Pro to MusicXML converter.",
  author: "Karim Ratib <karim.ratib@gmail.com> (https://github.com/infojunkie)",
  license: "GPL-3.0-only",
  repository: {
    type: "git",
    url: "https://github.com/infojunkie/ireal-musicxml"
  },
  homepage: "https://github.com/infojunkie/ireal-musicxml",
  type: "module",
  types: "./src/types/ireal-musicxml.d.ts",
  files: [
    "LICENSE.txt",
    "build/*",
    "src/*"
  ],
  bin: {
    "ireal-musicxml": "./src/cli/cli.js"
  },
  exports: {
    import: "./build/ireal-musicxml.js",
    require: "./build/ireal-musicxml.cjs"
  },
  scripts: {
    build: "npm run build:esm && npm run build:cjs",
    "build:esm": "esbuild src/lib/index.js --bundle --format=esm --sourcemap --outfile=build/ireal-musicxml.js",
    "build:cjs": "esbuild src/lib/index.js --bundle --platform=node --packages=external --outfile=build/ireal-musicxml.cjs",
    test: "npm run test:lint && npm run test:spec && npm run test:ts",
    "test:spec": "node --test",
    "test:ts": "npm run build && node --test --loader=ts-node/esm --require ts-node/register test/**/*.spec.ts",
    "test:lint": "eslint src --fix"
  },
  devDependencies: {
    "@types/node": "^22.7.7",
    "@xmldom/xmldom": "^0.8.0",
    esbuild: "0.24.0",
    eslint: "^9.13.0",
    resolve: "^1.22.8",
    "sanitize-filename": "^1.6.3",
    "ts-node": "^10.9.2",
    typescript: "^4.9.5",
    "validate-with-xmllint": "^1.2.0",
    "xpath.js": "^1.1.0"
  },
  dependencies: {
    "chord-symbol": "^3.0.0",
    "fast-diff": "^1.2.0",
    jstoxml: "^2.0.6",
    promise: "^8.1.0"
  }
};

// src/lib/version.js
var Version = class {
  static name = package_default.name;
  static version = package_default.version;
  static author = package_default.author;
  static description = package_default.description;
};

// src/lib/converter.js
var { chordParserFactory, chordRendererFactory } = import_chord_symbol.default;
var LogLevel = class {
  static Debug = 0;
  static Info = 1;
  static Warn = 2;
  static Error = 3;
  static None = 4;
};
var MUSICXML_VERSION = "4.0";
var SCALING_MM = 7;
var SCALING_TENTHS = 40;
var Converter = class _Converter {
  static defaultOptions = {
    "divisions": 768,
    // same as used by iReal
    "notation": "rhythmic",
    // 'rhythmic' for rhythmic notation, 'slash' for slash notation
    "step": "B",
    // chord note
    "octave": 4,
    // chord note octave
    "notehead": "slash",
    // chord note head
    "noteheadSize": "large",
    // size of chord note head
    "date": true,
    // include encoding date
    "clef": false,
    // hide clef by default
    "keySignature": false,
    // hide key signature by default
    "pageWidth": 210,
    // mm (A4)
    "pageHeight": 297,
    // mm (A4)
    "pageMargin": 15,
    // mm
    "logLevel": LogLevel.Warn
  };
  static sequenceAttributes = [
    // Expected order of attribute elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/attributes/
    "divisions",
    "key",
    "time",
    "staves",
    "part-symbol",
    "instruments",
    "clef",
    "staff-details",
    "transpose",
    "directive",
    "measure-style"
  ];
  static sequenceNote = [
    // Expected order of note elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/note/
    "cue",
    "pitch",
    "rest",
    "unpitched",
    "duration",
    "tie",
    "voice",
    "type",
    "dot",
    "accidental",
    "time-modification",
    "stem",
    "notehead",
    "notehead-text",
    "staff",
    "beam",
    "notations",
    "lyric",
    "play"
  ];
  static sequenceNotations = [
    // Expected order of notations elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/notations/
    "accidental-mark",
    "arpeggiate",
    "articulations",
    "dynamics",
    "fermata",
    "glissando",
    "non-arpeggiate",
    "ornaments",
    "other-notation",
    "slide",
    "slur",
    "technical",
    "tied",
    "tuplet"
  ];
  static sequenceBarline = [
    // Expected order of barline elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/barline/
    "bar-style",
    "footnote",
    "level",
    "wavy-line",
    "segno",
    "coda",
    "fermata",
    "ending",
    "repeat"
  ];
  static mapAlter = {
    "#": 1,
    "b": -1
  };
  static mapFifthsToAlters = {
    "sharp": ["F", "C", "G", "D", "A", "E", "B"],
    "flat": ["B", "E", "A", "D", "G", "C", "F"]
  };
  static mapRepeats = {
    "D.C. al Coda": _Converter.prototype.convertDaCapo,
    "D.C. al Fine": _Converter.prototype.convertDaCapo,
    "D.C. al 1st End.": _Converter.prototype.convertDaCapo,
    "D.C. al 2nd End.": _Converter.prototype.convertDaCapo,
    "D.C. al 3rd End.": _Converter.prototype.convertDaCapo,
    "D.S. al Coda": _Converter.prototype.convertDalSegno,
    "D.S. al Fine": _Converter.prototype.convertDalSegno,
    "D.S. al 1st End.": _Converter.prototype.convertDalSegno,
    "D.S. al 2nd End.": _Converter.prototype.convertDalSegno,
    "D.S. al 3rd End.": _Converter.prototype.convertDalSegno,
    "Fine": _Converter.prototype.convertFine,
    "3x": _Converter.prototype.convertRepeatNx,
    "4x": _Converter.prototype.convertRepeatNx,
    "5x": _Converter.prototype.convertRepeatNx,
    "6x": _Converter.prototype.convertRepeatNx,
    "7x": _Converter.prototype.convertRepeatNx,
    "8x": _Converter.prototype.convertRepeatNx
  };
  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new _Converter(song, realOptions).convert();
  }
  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.time = { beats: 4, beatType: 4 };
    this.fifths = null;
    this.measure = null;
    this.barRepeat = 0;
    this.codas = [];
    this.repeats = 0;
    this.emptyCells = 0;
    this.emptyCellNewSystem = false;
    this.cellWidth = (this.options.pageWidth - 2 * this.options.pageMargin) / 16;
    this.parseChord = chordParserFactory({ "altIntervals": [
      "b5",
      "b9"
    ] });
    this.renderChord = chordRendererFactory({
      useShortNamings: true,
      printer: "raw"
    });
  }
  convert() {
    return import_jstoxml.default.toXML(this.convertSong(), {
      header: `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML ${MUSICXML_VERSION} Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
      `.trim(),
      indent: "  "
    });
  }
  convertSong() {
    return {
      _name: "score-partwise",
      _attrs: { "version": MUSICXML_VERSION },
      _content: [{
        "work": {
          "work-title": this.song.title
        }
      }, {
        "identification": [{
          _name: "creator",
          _attrs: { "type": "composer" },
          _content: this.song.composer
        }, {
          "encoding": [{
            "software": `@infojunkie/ireal-musicxml ${Version.version}`
          }, { ...this.options.date && {
            "encoding-date": _Converter.convertDate(/* @__PURE__ */ new Date())
          } }, {
            _name: "supports",
            _attrs: { "element": "accidental", "type": "no" }
          }, {
            _name: "supports",
            _attrs: { "element": "transpose", "type": "no" }
          }, {
            _name: "supports",
            _attrs: { "attribute": "new-page", "element": "print", "type": "yes", "value": "yes" }
          }, {
            _name: "supports",
            _attrs: { "attribute": "new-system", "element": "print", "type": "yes", "value": "yes" }
          }]
        }]
      }, {
        "defaults": {
          "scaling": {
            "millimeters": SCALING_MM,
            "tenths": SCALING_TENTHS
          },
          "page-layout": {
            "page-height": _Converter._mmToTenths(this.options.pageHeight),
            "page-width": _Converter._mmToTenths(this.options.pageWidth),
            "page-margins": {
              "left-margin": _Converter._mmToTenths(this.options.pageMargin, 4),
              "right-margin": _Converter._mmToTenths(this.options.pageMargin, 4),
              "top-margin": _Converter._mmToTenths(this.options.pageMargin, 4),
              "bottom-margin": _Converter._mmToTenths(this.options.pageMargin, 4)
            }
          }
        }
      }, {
        "part-list": {
          _name: "score-part",
          _attrs: { "id": "P1" },
          _content: {
            _name: "part-name",
            _attrs: { "print-object": "no" },
            _content: "Lead Sheet"
          }
        }
      }, {
        _name: "part",
        _attrs: { "id": "P1" },
        _content: this.convertMeasures()
      }]
    };
  }
  // Date in yyyy-mm-dd
  // https://stackoverflow.com/a/50130338/209184
  static convertDate(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 6e4).toISOString().split("T")[0];
  }
  static Measure = class {
    constructor(number) {
      this.body = {
        _name: "measure",
        _attrs: { "number": number },
        _content: []
      };
      this.attributes = [];
      this.chords = [];
      this.barlines = [];
      this.barEnding = null;
    }
    number() {
      return this.body["_attrs"]["number"];
    }
    assemble() {
      if (this.attributes.length) {
        this.body["_content"].push({
          "attributes": _Converter.reorderSequence(this, this.attributes, _Converter.sequenceAttributes)
        });
      }
      this.chords.forEach((chord) => {
        this.body["_content"].push({
          "harmony": chord.harmony
        }, ...chord.notes.map((note) => {
          return {
            "note": note
          };
        }));
      });
      this.barlines[0]["_content"] = _Converter.reorderSequence(this, this.barlines[0]["_content"], _Converter.sequenceBarline);
      this.body["_content"].splice(1, 0, this.barlines[0]);
      this.barlines[1]["_content"] = _Converter.reorderSequence(this, this.barlines[1]["_content"], _Converter.sequenceBarline);
      this.body["_content"].push(this.barlines[1]);
      return this.body;
    }
  };
  static Chord = class {
    constructor(harmony, notes, ireal) {
      this.harmony = harmony;
      this.notes = notes;
      this.ireal = ireal;
      this.spaces = 0;
      this.fermata = false;
    }
  };
  convertMeasures() {
    const isNewSystem = (cellIndex) => cellIndex > 0 && cellIndex % 16 === 0;
    const measures = this.song.cells.reduce((measures2, cell, cellIndex) => {
      if (cell.bars.match(/\(|\{|\[/) || !this.measure && (cell.chord || cell.annots.length || cell.comments.length)) {
        if (this.measure) {
          this._log(LogLevel.Warn, `Starting a new measure over existing measure. Closing current measure first.`);
          this.measure.barlines.push(this.convertBarline("", "right"));
          if (this.adjustChordsDuration(this.measure)) {
            measures2.push(this.measure);
          }
        }
        this.measure = new _Converter.Measure(measures2.length + 1, this.options);
        if (!measures2.length) {
          this.measure.attributes.push({
            "divisions": this.options.divisions
          }, {
            _name: "clef",
            _attrs: [{ "print-object": this.options.clef ? "yes" : "no" }],
            _content: [{
              "sign": "G"
            }, {
              "line": 2
            }]
          }, {
            "staff-details": {
              "staff-lines": 0
            }
          }, {
            "measure-style": [{
              _name: "slash",
              _attrs: { "type": "start", "use-stems": this.options.notation === "rhythmic" ? "yes" : "no" }
            }]
          }, this.convertKey());
          if (this.song.bpm) {
            this.measure.body["_content"].push(this.convertTempo(this.song.bpm));
          }
          this.measure.body["_content"].push(this.convertStyleAndGroove(this.song.style, this.song.groove));
        }
        this.measure.barlines.push(this.convertBarline(cell.bars, "left"));
        if (this.barRepeat) {
          this.measure.chords = [...measures2[measures2.length - this.barRepeat - 1].chords];
        }
      }
      if (!this.measure) {
        if (cell.chord || cell.annots.length || cell.comments.length || cell.bars && cell.bars !== ")") {
          this._log(LogLevel.Warn, `Found non-empty orphan cell ${JSON.stringify(cell)}`, measures2[measures2.length - 1]);
        }
        this.emptyCells++;
        if (isNewSystem(cellIndex)) {
          this.emptyCellNewSystem = true;
        }
        return measures2;
      }
      if (isNewSystem(cellIndex) || this.emptyCellNewSystem) {
        this.measure.body["_content"].splice(0, 0, {
          _name: "print",
          _attrs: { "new-system": "yes" },
          _content: { ...this.emptyCellNewSystem && {
            "system-layout": {
              "system-margins": [{
                "left-margin": _Converter._mmToTenths(this.cellWidth * this.emptyCells)
              }, {
                "right-margin": "0.00"
              }]
            }
          } }
        });
      }
      if (!this.emptyCellNewSystem && this.emptyCells > 0) {
        if (this.measure.body["_content"][0]?.["_name"] === "print" && this.measure.body["_content"][0]["_attrs"]?.["new-system"] === "yes") {
          measures2[measures2.length - 1].body["_content"].splice(0, 0, {
            _name: "print",
            _content: {
              "system-layout": {
                "system-margins": [{
                  "left-margin": "0.00"
                }, {
                  "right-margin": _Converter._mmToTenths(this.cellWidth * this.emptyCells)
                }]
              }
            }
          });
        } else {
          this.measure.body["_content"].splice(0, 0, {
            _name: "print",
            _content: {
              "measure-layout": {
                "measure-distance": _Converter._mmToTenths(this.cellWidth * this.emptyCells)
              }
            }
          });
        }
      }
      this.emptyCellNewSystem = false;
      this.emptyCells = 0;
      if (cell.chord) {
        switch (cell.chord.note) {
          case "x": {
            this.barRepeat = 1;
            this.measure.chords = [...measures2[measures2.length - this.barRepeat].chords];
            break;
          }
          case "r": {
            this.barRepeat = 2;
            this.measure.chords = [...measures2[measures2.length - this.barRepeat].chords];
            break;
          }
          case "p":
            if (this.measure.chords.length) {
              this.measure.chords[this.measure.chords.length - 1].spaces++;
              break;
            }
          // Fall into case 'W'.
          case "W": {
            let target = this.measure;
            if (!target.chords.length) {
              target = measures2.slice().reverse().find((m) => m.chords.length);
              if (!target) {
                this._log(LogLevel.Error, `Cannot find any measure with chords prior to ${JSON.stringify(cell.chord)}`);
              }
            }
            if (target) {
              const chord = target.chords[target.chords.length - 1].ireal;
              chord.over = cell.chord.over;
              chord.alternate = cell.chord.alternate;
              this.measure.chords.push(this.convertChord(chord));
            }
            break;
          }
          case " ": {
            this._log(LogLevel.Warn, `Unhandled empty/alternate chord ${JSON.stringify(cell.chord)}`);
            break;
          }
          default: {
            this.measure.chords.push(this.convertChord(cell.chord));
          }
        }
      } else if (!this.barRepeat) {
        if (this.measure.chords.length) {
          this.measure.chords[this.measure.chords.length - 1].spaces++;
        }
      }
      cell.annots.forEach((annot) => {
        switch (annot[0]) {
          case "*": {
            const section = annot.slice(1);
            this.measure.body["_content"].push(this.convertSection(section));
            break;
          }
          case "T": {
            const time = annot.slice(1);
            this.measure.attributes.push(this.convertTime(time));
            break;
          }
          case "S": {
            this.measure.body["_content"].push(this.convertSegno());
            break;
          }
          case "N": {
            let ending = parseInt(annot.slice(1));
            if (ending < 1) {
              const target = measures2.slice().reverse().find((m) => !!m.barEnding);
              ending = target?.barEnding ?? 0 + 1;
            }
            this.measure.barlines[0]["_content"].push(this.convertEnding(ending, "start"));
            if (ending > 1) {
              measures2[measures2.length - 1].barlines[1]["_content"].push(this.convertEnding(ending - 1, "stop"));
              const target = measures2.slice().reverse().find((m) => m.barEnding === ending - 1);
              if (!target) {
                this._log(LogLevel.Error, `Cannot find ending ${ending - 1} in right barline of any measure`);
              } else {
                const index = target.barlines[1]["_content"].findIndex((b) => !!b && b["_name"] === "ending");
                if (index === -1) {
                  this._log(LogLevel.Error, `Cannot find ending ${ending - 1} in right barline`, target);
                }
                delete target.barlines[1]["_content"][index];
              }
            }
            this.measure.barEnding = ending;
            break;
          }
          case "Q": {
            this.measure.body["_content"].push(this.convertToCoda());
            this.codas.push(this.measure);
            break;
          }
          // Ignore small and large chord renderings.
          case "l":
          case "s":
            break;
          case "f": {
            this.measure.chords[this.measure.chords.length - 1].fermata = true;
            break;
          }
          case "U": {
            this.measure.body["_content"].push(this.convertFine("END"));
            break;
          }
          default:
            this._log(LogLevel.Warn, `Unhandled annotation "${annot}"`);
        }
      });
      cell.comments.map((c) => c.trim()).forEach((comment) => {
        const repeatFn = this._map(_Converter.mapRepeats, comment);
        if (repeatFn) {
          this.measure.body["_content"].push(repeatFn.call(this, comment));
        } else {
          this.measure.body["_content"].push(this.convertComment(comment));
        }
      });
      if (cell.bars.match(/\)|\}|\]|Z/) && this.measure.chords.length) {
        this.measure.barlines.push(this.convertBarline(cell.bars, "right"));
        if (this.measure.barEnding) {
          this.measure.barlines[1]["_content"].push(this.convertEnding(this.measure.barEnding, "discontinue"));
        }
        if (this.adjustChordsDuration(this.measure)) {
          measures2.push(this.measure);
        }
        this.measure = null;
        if (this.barRepeat) this.barRepeat--;
      }
      return measures2;
    }, []);
    const remainingCells = this.song.cells.length % 16 - this.emptyCells;
    if (remainingCells > 0 && measures.length > 0) {
      measures[measures.length - 1].body["_content"].splice(0, 0, {
        _name: "print",
        _content: {
          "system-layout": {
            "system-margins": [{
              "left-margin": "0.00"
            }, {
              "right-margin": _Converter._mmToTenths(this.cellWidth * remainingCells)
            }]
          }
        }
      });
    }
    if (this.codas.length) {
      const target = this.codas[this.codas.length - 1];
      const direction = target.body["_content"].findIndex(
        (d) => d["_name"] === "direction" && Array.isArray(d["_content"]) && d["_content"].some(
          (s) => s["_name"] === "sound" && Object.keys(s["_attrs"]).includes("tocoda")
        )
      );
      if (direction === -1) {
        this._log(LogLevel.Warn, `Cannot find sound direction`, target);
      }
      target.body["_content"][direction] = this.convertCoda();
    }
    return measures.map((measure) => measure.assemble());
  }
  // Fix order of elements according to sequence as specified by an xs:sequence.
  // @param {array<element>} elements - Array of elements to sort.
  // @param {array<string>} sequence - Array of element names in order of xs:sequence.
  // @return {array<element>} Ordered array of elements.
  static reorderSequence(measure, elements, sequence) {
    return elements.filter((a) => Object.keys(a).length).sort((a1, a2) => {
      let k1 = Object.keys(a1)[0];
      if (k1 === "_name") k1 = a1[k1];
      let k2 = Object.keys(a2)[0];
      if (k2 === "_name") k2 = a2[k2];
      const i1 = sequence.indexOf(k1);
      const i2 = sequence.indexOf(k2);
      if (i1 === -1) {
        this._log(LogLevel.Warn, `Unrecognized element "${k1}"`, measure);
      }
      if (i2 === -1) {
        this._log(LogLevel.Warn, `Unrecognized element "${k2}"`, measure);
      }
      return i1 - i2;
    });
  }
  convertRepeatNx(comment) {
    let repeats = null;
    if (null !== (repeats = comment.match(/(\d+)x/))) {
      this.repeats = repeats[1];
    }
  }
  convertFine(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": "below" },
      _content: [{
        "direction-type": {
          "words": comment
        }
      }, {
        _name: "sound",
        _attrs: { "fine": "yes" }
      }]
    };
  }
  convertDaCapo(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": "below" },
      _content: [{
        "direction-type": {
          "words": comment
        }
      }, {
        _name: "sound",
        _attrs: { "dacapo": "yes" }
      }]
    };
  }
  convertDalSegno(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": "below" },
      _content: [{
        "direction-type": {
          "words": comment
        }
      }, {
        _name: "sound",
        _attrs: { "dalsegno": "yes" }
      }]
    };
  }
  convertComment(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": comment[0] === "*" ? "above" : "below" },
      _content: {
        "direction-type": {
          "words": comment[0] === "*" ? comment.slice(3) : comment
        }
      }
    };
  }
  convertEnding(ending, type) {
    return {
      _name: "ending",
      _attrs: { "number": ending, "type": type },
      _content: `${ending}.`
    };
  }
  convertBarline(bars, location) {
    let style = "regular";
    let repeat = null;
    if (bars.match(/\[|\]/)) {
      style = "light-light";
    } else if (bars.match(/Z/)) {
      style = "light-heavy";
    } else if (bars.match(/\{|\}/)) {
      style = location === "left" ? "heavy-light" : "light-heavy";
      repeat = location === "left" ? "forward" : "backward";
    }
    if (repeat === "forward") {
      this.repeats = 2;
    }
    return {
      _name: "barline",
      _attrs: { "location": location },
      _content: [{
        "bar-style": style
      }, { ...repeat && {
        _name: "repeat",
        _attrs: { "direction": repeat, ...repeat === "backward" && { "times": this.repeats } }
      } }]
    };
  }
  convertSection(section) {
    if (section === "i") section = "Intro";
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: {
        "direction-type": {
          "rehearsal": section
        }
      }
    };
  }
  convertSegno() {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": {
          _name: "segno"
        }
      }, {
        _name: "sound",
        _attrs: { "segno": "segno" }
      }]
    };
  }
  convertCoda() {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": {
          "_name": "coda"
        }
      }, {
        _name: "sound",
        _attrs: { "coda": "coda" }
        // TODO: We assume a single coda
      }]
    };
  }
  convertToCoda() {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": {
          "words": "To Coda"
        }
      }, {
        _name: "sound",
        _attrs: { "tocoda": "coda" }
        // TODO: We assume a single coda
      }]
    };
  }
  convertTempo(bpm) {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": [{
          _name: "metronome",
          _attrs: { "parentheses": "no" },
          _content: [{
            "beat-unit": this.calculateChordDuration(1)[0].type
          }, {
            "per-minute": bpm
          }]
        }]
      }, {
        _name: "sound",
        _attrs: { "tempo": bpm }
      }]
    };
  }
  convertTime(time) {
    let beats = parseInt(time[0]);
    let beatType = parseInt(time[1]);
    if (time === "12") {
      beats = 12;
      beatType = 8;
    }
    this.time = { beats, beatType };
    return {
      "time": [{
        "beats": beats
      }, {
        "beat-type": beatType
      }]
    };
  }
  adjustChordsDuration(measure) {
    if (measure.chords.length > this.time.beats) {
      this._log(LogLevel.Error, `Too many chords (${measure.chords.length} out of ${this.time.beats})`, measure);
      return true;
    }
    let beats = measure.chords.reduce((beats2, chord) => beats2 + 1 + chord.spaces, 0);
    if (!beats) {
      this._log(LogLevel.Warn, `No chord found. Skipping current measure.`, measure);
      return false;
    }
    if (beats > this.time.beats) {
      let chordIndex = 0;
      while (beats > this.time.beats) {
        if (measure.chords[chordIndex].spaces > 0) {
          measure.chords[chordIndex].spaces--;
          beats--;
        }
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    } else {
      let chordIndex = 0;
      while (beats < this.time.beats) {
        measure.chords[chordIndex].spaces++;
        beats++;
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    }
    measure.chords = measure.chords.map((chord) => {
      chord.notes = this.calculateChordDuration(1 + chord.spaces).map(
        (duration, i, ds) => this.convertChordNote(
          duration,
          i === ds.length - 1 ? chord.fermata : false,
          // Possible fermata on last chord note only
          this.options.notation === "rhythmic" && ds.length > 1 ? i > 0 ? "stop" : "start" : null
          // Possible tie in case of rhythmic notation
        )
      );
      return chord;
    });
    return true;
  }
  calculateChordDuration(beats) {
    const mapDuration = {
      "1": [{ t: "eighth", d: 0, b: 1 }],
      "2": [{ t: "quarter", d: 0, b: 2 }],
      "3": [{ t: "quarter", d: 1, b: 3 }],
      "4": [{ t: "half", d: 0, b: 4 }],
      "5": [{ t: "quarter", d: 1, b: 3 }, { t: "quarter", d: 0, b: 2 }],
      "6": [{ t: "half", d: 1, b: 6 }],
      "7": [{ t: "half", d: 2, b: 7 }],
      "8": [{ t: "whole", d: 0, b: 8 }],
      "9": [{ t: "half", d: 1, b: 6 }, { t: "quarter", d: 1, b: 3 }],
      "10": [{ t: "half", d: 1, b: 6 }, { t: "half", d: 0, b: 4 }],
      "11": [{ t: "half", d: 2, b: 7 }, { t: "half", d: 0, b: 4 }],
      "12": [{ t: "whole", d: 1, b: 12 }],
      "13": [{ t: "half", d: 2, b: 7 }, { t: "half", d: 1, b: 6 }],
      "14": [{ t: "whole", d: 2, b: 14 }],
      "15": [{ t: "whole", d: 0, b: 8 }, { t: "half", d: 2, b: 7 }]
    };
    if (this.options.notation === "slash") {
      const index = 1 * 8 / this.time.beatType;
      return Array(beats).fill(
        this._map(mapDuration, index, [], `Unexpected beat count 1 for time signature ${this.time.beats}/${this.time.beatType}`).map((duration) => {
          return {
            duration: duration.b * this.options.divisions / 2,
            type: duration.t,
            dots: duration.d
          };
        })[0]
        // We're sure to get only one entry in this case.
      );
    } else {
      const index = beats * 8 / this.time.beatType;
      return this._map(mapDuration, index, [], `Unexpected beat count ${beats} for time signature ${this.time.beats}/${this.time.beatType}`).map((duration) => {
        return {
          duration: duration.b * this.options.divisions / 2,
          type: duration.t,
          dots: duration.d
        };
      });
    }
  }
  convertChordNote(duration, fermata = false, tie = null) {
    const altered = _Converter.mapFifthsToAlters[this.fifths >= 0 ? "sharp" : "flat"].slice(0, Math.abs(this.fifths));
    const noteType = {
      _name: "pitch",
      _content: [{
        "step": this.options.step
      }, {
        "alter": altered.includes(this.options.step) ? this.fifths > 0 ? 1 : -1 : 0
      }, {
        "octave": this.options.octave
      }]
    };
    const notations = [];
    if (fermata) {
      notations.push({ _name: "fermata" });
    }
    if (tie) {
      notations.push({ _name: "tied", _attrs: { "type": tie } });
    }
    return _Converter.reorderSequence(this.measure, [noteType, {
      _name: "cue"
    }, {
      _name: "notehead",
      _content: this.options.notehead,
      _attrs: [{ "font-size": this.options.noteheadSize }]
    }, {
      "duration": duration.duration
    }, {
      "voice": 1
    }, {
      _name: "type",
      _attrs: { "size": "full" },
      _content: duration.type
    }, { ...notations.length && {
      "notations": _Converter.reorderSequence(this.measure, notations, _Converter.sequenceNotations)
    } }].concat(Array(duration.dots).fill({ _name: "dot" })), _Converter.sequenceNote);
  }
  convertChordDegree(value, type, alter) {
    return {
      _name: "degree",
      _attrs: { "print-object": "no" },
      _content: [{
        "degree-value": value
      }, {
        "degree-alter": alter
      }, {
        "degree-type": type
      }]
    };
  }
  convertChordSymbol(chord) {
    const parsedChord = this.renderChord(this.parseChord(`${chord.note}${chord.modifiers}`));
    if (!parsedChord) {
      this._log(LogLevel.Warn, `Unrecognized chord "${chord.note}${chord.modifiers}"`);
      return { rootStep: null, rootAlter: null, chordKind: null, chordDegrees: [], chordText: null };
    }
    const rootStep = parsedChord.input.rootNote[0];
    const rootAlter = this._map(_Converter.mapAlter, parsedChord.input.rootNote[1] || null, null, `Unrecognized accidental in chord "${parsedChord.input.rootNote}"`);
    const chordText = parsedChord.formatted.descriptor + parsedChord.formatted.chordChanges.join("");
    const mapKind = {
      "major": "major",
      "major6": "major-sixth",
      "major7": "major-seventh",
      "dominant7": "dominant",
      "minor": "minor",
      "minor6": "minor-sixth",
      "minor7": "minor-seventh",
      "minorMajor7": "major-minor",
      "augmented": "augmented",
      "diminished": "diminished",
      "diminished7": "diminished-seventh",
      "power": "power"
    };
    let chordKind = this._map(mapKind, parsedChord.normalized.quality, "", `Unrecognized chord quality "${parsedChord.normalized.quality}"`);
    if (parsedChord.normalized.extensions.length) {
      const extension = Math.max(...parsedChord.normalized.extensions.map((e) => parseInt(e))).toString();
      const mapExtensionKind = {
        "9": "-ninth",
        "11": "-11th",
        "13": "-13th"
      };
      chordKind = chordKind.split("-")[0] + this._map(mapExtensionKind, extension, "", `Unhandled extension ${extension}`);
      if (chordKind === "dominant-11th") {
        parsedChord.normalized.isSuspended = false;
      }
    }
    [
      { intervals: ["1", "4", "5"], kind: "suspended-fourth", strict: true },
      { intervals: ["1", "5", "9"], kind: "suspended-second", strict: true },
      { intervals: ["1", "b3", "b5", "b7"], kind: "half-diminished", strict: true },
      { intervals: ["1", "3", "#5", "b7"], kind: "augmented-seventh", strict: false }
    ].some((chord2) => {
      if ((!chord2.strict || parsedChord.normalized.intervals.length === chord2.intervals.length) && chord2.intervals.every((s, i) => s === parsedChord.normalized.intervals[i])) {
        chordKind = chord2.kind;
        chord2.intervals.forEach((i) => {
          parsedChord.normalized.alterations = parsedChord.normalized.alterations.filter((p) => p === i);
          parsedChord.normalized.adds = parsedChord.normalized.adds.filter((p) => p === i);
          parsedChord.normalized.omits = parsedChord.normalized.omits.filter((p) => p === i);
        });
        parsedChord.normalized.intervals.forEach((i) => {
          if (!chord2.intervals.includes(i)) {
            parsedChord.normalized.adds.push(i);
          }
        });
        return true;
      }
    });
    const chordDegrees = [];
    if (parsedChord.normalized.isSuspended && !chordKind.includes("suspended")) {
      parsedChord.normalized.adds.push("4");
      if (!parsedChord.normalized.adds.includes("3")) {
        parsedChord.normalized.omits.push("3");
      }
    }
    parsedChord.normalized.alterations.forEach((alteration) => {
      const degree = alteration.slice(1);
      chordDegrees.push(
        this.convertChordDegree(
          degree,
          degree === "5" || parsedChord.normalized.extensions.includes(degree) ? "alter" : "add",
          this._map(_Converter.mapAlter, alteration[0], 0, `Unrecognized alter symbol in "${alteration}"`)
        )
      );
    });
    parsedChord.normalized.adds.forEach((add) => {
      const alteration = Object.keys(_Converter.mapAlter).includes(add[0]) ? add[0] : null;
      const degree = alteration ? add.slice(1) : add;
      chordDegrees.push(
        this.convertChordDegree(degree, "add", this._map(_Converter.mapAlter, alteration, 0, `Unrecognized alter symbol in "${add}"`))
      );
    });
    parsedChord.normalized.omits.forEach((omit) => {
      const alteration = Object.keys(_Converter.mapAlter).includes(omit[0]) ? omit[0] : null;
      const degree = alteration ? omit.slice(1) : omit;
      chordDegrees.push(
        this.convertChordDegree(degree, "subtract", this._map(_Converter.mapAlter, alteration, 0, `Unrecognized alter symbol in "${omit}"`))
      );
    });
    return { rootStep, rootAlter, chordKind, chordDegrees, chordText };
  }
  convertChord(chord) {
    let harmony = null;
    if (chord.note === "n") {
      harmony = [{
        "root": [{
          _name: "root-step",
          _attrs: { "text": "" },
          _content: this.options.step
        }]
      }, {
        _name: "kind",
        _attrs: { "text": "N.C." },
        _content: "none"
      }];
    } else {
      const { rootStep, rootAlter, chordKind, chordDegrees, chordText } = this.convertChordSymbol(chord);
      const bass = !chord.over ? null : [{
        "bass-step": chord.over.note[0]
      }, { ...chord.over.note[1] && {
        "bass-alter": this._map(_Converter.mapAlter, chord.over.note[1], null, `Unrecognized accidental in bass note "${chord.over.note}"`)
      } }];
      harmony = [{
        "root": [{
          "root-step": rootStep
        }, { ...rootAlter && {
          // Don't generate the root-alter entry if rootAlter is blank
          "root-alter": rootAlter
        } }]
      }, {
        _name: "kind",
        _attrs: { "text": chordText, "use-symbols": "no" },
        _content: chordKind
      }, { ...bass && {
        "bass": bass
      } }].concat(chordDegrees);
    }
    if (chord.alternate) {
      this._log(LogLevel.Warn, `Unhandled alternate chord ${JSON.stringify(chord.alternate)}`);
    }
    return new _Converter.Chord(
      harmony,
      // Initial chord duration is 1 beat
      this.calculateChordDuration(1).map((duration) => this.convertChordNote(duration)),
      chord
    );
  }
  convertKey() {
    const mapKeys = {
      // Major keys
      "C": 0,
      "G": 1,
      "D": 2,
      "A": 3,
      "E": 4,
      "B": 5,
      "F#": 6,
      "C#": 7,
      "F": -1,
      "Bb": -2,
      "Eb": -3,
      "Ab": -4,
      "Db": -5,
      "Gb": -6,
      "Cb": -7,
      // Minor keys
      "A-": 0,
      "E-": 1,
      "B-": 2,
      "F#-": 3,
      "C#-": 4,
      "G#-": 5,
      "D#-": 6,
      "A#-": 7,
      "D-": -1,
      "G-": -2,
      "C-": -3,
      "F-": -4,
      "Bb-": -5,
      "Eb-": -6,
      "Ab-": -7
    };
    this.fifths = this._map(mapKeys, this.song.key, 0, `Unrecognized key signature "${this.song.key}"`);
    return {
      _name: "key",
      _attrs: [{ "print-object": this.options.keySignature ? "yes" : "no" }],
      _content: [{
        "fifths": this.fifths
      }, {
        "mode": this.song.key.slice(-1) === "-" ? "minor" : "major"
      }]
    };
  }
  convertStyleAndGroove(style, groove) {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": [{
          "words": style
        }]
      }, {
        "sound": [{
          "play": [{
            _name: "other-play",
            _attrs: { "type": "groove" },
            _content: groove || style
          }]
        }]
      }]
    };
  }
  _log(logLevel, message, measure = this.measure) {
    if (logLevel < this.options.logLevel) return;
    const log = `[ireal-musicxml] [${this.song.title}${measure ? "#" + measure.number() : ""}] ${message}`;
    let method = "warn";
    switch (logLevel) {
      case LogLevel.Debug:
        method = "debug";
        break;
      case LogLevel.Info:
        method = "info";
        break;
      case LogLevel.Warn:
        method = "warn";
        break;
      case LogLevel.Error:
        method = "error";
        break;
    }
    console[method](log);
  }
  _map(map, key, defaultValue, message, logLevel = LogLevel.Warn, measure = this.measure) {
    if (!key) return defaultValue;
    if (!(key in map)) {
      if (message) {
        this._log(logLevel, message, measure);
      }
      return defaultValue || null;
    }
    return map[key];
  }
  static _mmToTenths(mm, decimals = 2) {
    const value = mm * SCALING_TENTHS / SCALING_MM;
    const power = Math.pow(10, decimals);
    return Math.round(value * power) / power;
  }
};

// src/lib/index.js
function convertSync(ireal, options = {}) {
  const playlist = new Playlist(ireal);
  playlist.songs.forEach((song) => {
    song.musicXml = Converter.convert(song, options);
  });
  return playlist;
}
async function convert(ireal, options = {}) {
  return new import_promise.default((resolve) => resolve(convertSync(ireal, options)));
}
export {
  Cell,
  Chord,
  Converter,
  LogLevel,
  Playlist,
  Song,
  Version,
  convert,
  convertSync
};
//# sourceMappingURL=ireal-musicxml.js.map
