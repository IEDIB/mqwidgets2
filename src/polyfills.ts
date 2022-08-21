export function applyPolyfills() {

    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function forEach (callback: Function, thisArg) {
          if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
          }
          var array = this;
          thisArg = thisArg || this;
          for (var i = 0, l = array.length; i !== l; ++i) {
            callback.call(thisArg, array[i], i, array);
          }
        };
    }

    if(!Array.prototype.map) {
        Array.prototype.map = function(callback: Function) {
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }
            var arr = [];              
            for (var i = 0; i < this.length; i++) { 
                arr.push(callback(this[i], i, this));
            }
            return arr;
        }
    }

    if(!Array.prototype.filter) {
        Array.prototype.filter = function(callback: Function) {
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }
            var arr = [];     
            for (var i = 0; i < this.length; i++) {
              if (callback.call(this, this[i], i, this)) {
                arr.push(this[i]);
              }
            }
            return arr;
          }
    }
}