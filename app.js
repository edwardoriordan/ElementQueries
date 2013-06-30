(function(window) {

  /** Element Query List
  ========================================================================== */
  function ElementQueryList() {
    this.elementQueries = [];
  };
  ElementQueryList.prototype.add = function(elementQuery) {
    console.log(this);
    if (this.elementQueries.indexOf(elementQuery) === -1) {
      this.elementQueries.push(elementQuery);
    }
  };
  ElementQueryList.prototype.runLoop = function(edward) {
    this.elementQueries.forEach(function(elementQuery) {
      elementQuery.check();  
    });
  };
  // ElementQueryList.prototype.runLoopS = this.runLoop.bind(this);

  // @todo - Create as a singlton ?
  var MEDIALIST = new ElementQueryList();
  console.log(MEDIALIST);

  /** Element Query
  ========================================================================== */
  function ElementMatchMedia(selector, query) {
    this.selector = selector;
    this.elements = this.selectedElements();
    this.query = mediaQueryToExpression(query);
    this.matches;
    this.listeners = [];
    this.matchedElements = [];
    this._allMatchedElements = [];
  }

  /** Public */

  // Add a listener - fired when a elements matched status changes
  ElementMatchMedia.prototype.addListener = function(cb) {
    this.listeners.push(cb);

    MEDIALIST.add(this);

    this.check();
  };

  // ElementMatchMedia.prototype.updateElements = function(selector) {
  //   var selector = selector || this.selector;
  //   var element = document.querySelectorAll(selector);
  //   this.elements = arrayFromNodeList(element);
  // }

  ElementMatchMedia.prototype.selectedElements = function(selector) {
    var selector = selector || this.selector;
    return arrayFromNodeList( document.querySelectorAll(selector) );
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
    return evaluateExpression(this.query)({
      width: getWidth(element),
      height: getHeight(element)  
    });
  };

  // Do stuff
  document.addEventListener("DOMContentLoaded", ready, false);
  function ready() {
    var runElementQueryLoopPerfomant = debounce(MEDIALIST.runLoop.bind(MEDIALIST), 100);
    window.addEventListener("resize", runElementQueryLoopPerfomant, false);
    test();
  }

  // @todo - add chaining
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
  }

  // Utils or EQ
  function arrayFromNodeList(nodeList) {
    var arr = [],
        i = 0;
    if (nodeList.length === 1) return [nodeList[0]];

    for (i; i < nodeList.length; ++i) {
      arr.push(nodeList[i]);
    }
    return arr;
  }

  // EQ
  function mediaQueryToExpression(query) {
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

  function evaluateExpression(expression) {
    var expression = 'q.' + expression;
    return Function('q', 'return(' + expression + ')')
  }

  // Utils
  function toCamelCase(value) {
    return value.toLowerCase().replace(/-[a-z]/g, function ($0) {
      return $0[1].toUpperCase();
    });
  }

  // Utils
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

  // Utils
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

  // Utils
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
  }

  // Element Querry
  var getProperty = function(elem, property) {
    return window.getComputedStyle(elem)[property];  
  };
  var getWidth = function(selector) {
    return parseInt(getProperty(selector, 'width'));
  }
  var getHeight = function(selector) {
    return parseInt(getProperty(selector, 'height'));
  }

  // Media List - from underscore
  debounce = function(func, wait, immediate) {
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
  throttle = function(func, wait) {
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

})(this);

