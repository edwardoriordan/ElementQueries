(function(window) {

  var MEDIA_LIST;
  
  /** Element Query List
  ========================================================================== */
  function ElementQueryList(type) {
    this.elementQueries = [];
    this.handler = this.getTimedoutHandler();
    this.attachHandler();
  };

  ElementQueryList.prototype.getTimedoutHandler = function(type, wait) {
    var type = type || 'debounce';
    var wait = wait || 250;

    console.log(this[type]);
    if (typeof this[type] !== 'undefined') {
      return this[type](this.runLoop.bind(this), wait);
    }
  };
  ElementQueryList.prototype.updateTimeoutType = function(deffer, wait) {
    this.removeHandler();
    this.handler = this.getTimedoutHandler(deffer, wait);
    this.attachHandler();
  };
  ElementQueryList.prototype.attachHandler = function() {
    window.addEventListener("resize", this.handler, false);     
  };
  ElementQueryList.prototype.removeHandler = function() {
    window.removeEventListener("resize", this.handler, false);     
  };

  ElementQueryList.prototype.add = function(elementQuery) {
    if (this.elementQueries.indexOf(elementQuery) === -1) {
      this.elementQueries.push(elementQuery);
    }
  };
  ElementQueryList.prototype.runLoop = function() {
    console.log('run');
    this.elementQueries.forEach(function(elementQuery) {
      elementQuery.check();  
    });
  };
  ElementQueryList.prototype.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };
  ElementQueryList.prototype.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  if (typeof MEDIA_LIST === "undefined") {
    MEDIA_LIST = new ElementQueryList();
  }

  /** Element Query
  ========================================================================== */
  function ElementMatchMedia(selector, query) {
    this.selector = selector;
    this.elements = this.selectedElements();
    this.query = this._mediaQueryToExpression(query);
    this.matches;
    this.listeners = [];
    this.matchedElements = [];
    this._allMatchedElements = [];
  }

  /** Public */

  // Add a listener - fired when a elements matched status changes
  ElementMatchMedia.prototype.addListener = function(cb) {
    this.listeners.push(cb);

    MEDIA_LIST.add(this);

    this.check();
  };
  ElementMatchMedia.prototype.selectedElements = function(selector) {
    var selector = selector || this.selector;
    return this._arrayFromNodeList( document.querySelectorAll(selector) );
  }

  // Check if any elements match querry
  // Add or remove from matched list
  ElementMatchMedia.prototype.check = function() {
    var _self = this;
    this.selectedElements().forEach(function(element) {
      if(_self.checkElementMatches(element)) {
        _self.addElementToMatched(element);
      } else {
        _self.removeElementFromMatched(element); 
      }
      _self._checkForFirstTime(element);
    });
  };

  ElementMatchMedia.prototype.changeGlobalTimeout = function(type, wait) {
    if (type == 'debounce') var wait = wait || 50;
    var wait = wait || 0;
    MEDIA_LIST.updateTimeoutType(type, wait);
  }

  // Helper function to add or remove class
  // based on match
  ElementMatchMedia.prototype.toggleClass = function(isMatching, isNotMatching) {
    var isNotMatching = isNotMatching || 'not-' + isMatching;
    this.addListener(function(element, matches) {
      if (matches) {
        element.classList.add(isMatching);
        element.classList.remove(isNotMatching);
      } else {
        element.classList.remove(isMatching);
        element.classList.add(isNotMatching);
      }
    });
  }

  /** Private */
  // Element Querry
  ElementMatchMedia.prototype.getProperty = function(elem, property) {
    return window.getComputedStyle(elem)[property];  
  };
  ElementMatchMedia.prototype.getWidth = function(selector) {
    return parseInt(this.getProperty(selector, 'width'));
  }
  ElementMatchMedia.prototype.getHeight = function(selector) {
    return parseInt(this.getProperty(selector, 'height'));
  }

  // If the first time 
  ElementMatchMedia.prototype._checkForFirstTime = function (element) {
    if (this._allMatchedElements.indexOf(element) === -1) {
      this.matchChanged(element);
      this._allMatchedElements.push(element);
    }
  }
  // Fire any callbacks
  ElementMatchMedia.prototype.matchChanged = function(element) {
    var _self = this;
    this.listeners.forEach(function(listener) {
      listener(element, _self.isElementMatching(element), _self );
    });
  }

  ElementMatchMedia.prototype.isElementMatching = function(element) {
    return this.matchedElements.indexOf(element) !== -1;
  }
  ElementMatchMedia.prototype.removeElementFromMatched = function(element) {
    // Only remove if already a matched element
    if (this.matchedElements.indexOf(element) !== -1) {
      this.matchedElements.splice(this.matchedElements.indexOf(element), 1);
      this.matchChanged(element);
    }
  }
  ElementMatchMedia.prototype.addElementToMatched = function(element) {
    if (this.matchedElements.indexOf(element) === -1) {
      this.matchedElements.push(element);
      this.matchChanged(element);
    }
  }
  // Check if individual element matches querry
  ElementMatchMedia.prototype.checkElementMatches = function(element) {
    var _self = this;

    var eqObj = {};
    if (this.query.indexOf('width') !== -1) eqObj.width = this.getWidth(element);
    if (this.query.indexOf('height') !== -1) eqObj.height = this.getHeight(element);

    return this._evaluateExpression(this.query)(eqObj);
  }

  // Helper - transform node list to an array
  ElementMatchMedia.prototype._arrayFromNodeList = function(nodeList) {
    var arr = [],
        i = 0;
    if (nodeList.length === 1) return [nodeList[0]];

    for (i; i < nodeList.length; ++i) {
      arr.push(nodeList[i]);
    }
    return arr;
  }

  // Format media querry as javascript expression
  // Modified from - https://github.com/jonathantneal/MediaClass
  ElementMatchMedia.prototype._mediaQueryToExpression = function(query) {
    return query
      .replace(/\(|\)/g, "")
      .replace(/\s*,\s*/g, ") || (")
      .replace(/\s+and\s+/gi, " && ")
      .replace(/min-(.*?):/gi, "$1>=")
      .replace(/max-(.*?):/gi, "$1<=")
      .replace(/above-(.*?):/gi, "$1>")
      .replace(/below-(.*?):/gi, "$1<")
      .replace(/min-|max-/gi, "")
      .replace(/(all|screen|print)/, "d.$1")
      .replace(/:/g, "==")
      .replace(/([\w-]+)\s*([<>=]+)\s*(\w+)/g, function ($0, $1, $2, $3) {
        return toCamelCase($1) + $2 + parseCSSNumber($3);
      });
  }
  // Test is query object matches querry expression
  // Example - q.width > 750 && q.height > 500
  ElementMatchMedia.prototype._evaluateExpression = function(expression) {
    var expression = 'q.' + expression;
    return Function('q', 'return(' + expression + ')')
  }

  // CSS Utils
  function toCamelCase(value) {
    return value.toLowerCase().replace(/-[a-z]/g, function ($0) {
      return $0[1].toUpperCase();
    });
  }
  function parseCSSNumber(value, window) {
    return value.replace(/([\d\.]+)(%|em|rem|in|pt|px)/, function ($0, $1, $2) {
      switch ($2) {
        case "em":
          return emsToPixels($1);
          break;
        case "rem":
          return remsToPixels($1);
          break;
        case "pt":
          return $1 * 96;
          break;
        default:
          return $1;
      }
    });
    // @todo - ems only work off root - fix this to calculate from
    // particular dom scope
    function emsToPixels(em, scope) {
      var scope = scope || document.querySelectorAll('body')[0];
      var test = document.createElement("div");

      test.style.fontSize = "1em";
      test.style.margin = "0";
      test.style.padding = "0";
      test.style.border = "none";
      test.style.width = "1em";
      scope.appendChild(test);
      var val = test.offsetWidth;
      scope.removeChild(test);
      return Math.round(val * em);
    };
    function remsToPixels(rem) {
      var scope = document.querySelectorAll('body')[0];
      var test = document.createElement("div");
      test.style.fontSize = "1rem";
      test.style.margin = "0";
      test.style.padding = "0";
      test.style.border = "none";
      test.style.width = "1rem";
      scope.appendChild(test);
      var val = test.offsetWidth;
      scope.removeChild(test);
      return Math.round(val * rem);
    };
  }

  // --------------------------------------------------------

  // Do stuff
  document.addEventListener("DOMContentLoaded", ready, false);
  function test() {
    var eq = new ElementMatchMedia('.big', '(min-width: 750px)');

    eq.toggleClass('matching');

    // Test with content add after page
    var p = document.createElement("p");
    p.classList.add('big');
    var newContent = document.createTextNode("Hi there I was added afterward!");
    p.appendChild(newContent);
    document.body.appendChild(p);
    eq.check();

    // Check changing global throttle settings
    // eq.changeGlobalTimeout('throttle', 1000);
    // eq.changeGlobalTimeout('debounce');
  }

})(this);

