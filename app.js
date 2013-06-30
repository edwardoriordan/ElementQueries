(function(window) {

  var ElementQueryList = function() {
    var _self = this;
    _self.list = [];

    _self.runLoop = function() {
      _self.list.forEach(function(elementQuery) {
        elementQuery.check();
      });  
    }
  };
  // Create as a singlton ?
  var MEDIALIST = new ElementQueryList();

  // Class
  var ElementMatchMedia = function(selector, query) {
    var that = this;
    var element = document.querySelectorAll(selector);

    this.elements = arrayFromNodeList(element);
    this.query = mediaQueryToExpression(query);
    this.matches;
    this.listeners = [];
    this.matchedElements = [];
    this._allMatchedElements = [];

    // Add a listener to be fired when element matched change
    // Public*
    this.addListener = function(cb) {
      that.listeners.push(cb);

      if (MEDIALIST.list.indexOf(that) === -1) {
        MEDIALIST.list.push(that);
      }

      that.check();
    };

    this.updateElements = function() {
      var element = document.querySelectorAll(selector);
      this.elements = arrayFromNodeList(element);  
    }

    this.selectedElements = function() {
      return arrayFromNodeList( document.querySelectorAll(selector) );
    }

    // Run from ElementQueryList
    // Check if any elements match querry
    // Add or remove from matched list
    // Public*
    this.check = function() {
      that.selectedElements().forEach(function(element) {

        if(that.checkElementMatches(element)) {
          that.addElementToMatched(element);
        } else {
          that.removeElementFromMatched(element); 
        }

        that._checkForFirstTime(element);
      });
    };

    this._checkForFirstTime = function (element) {
      // If the first time 
      if (that._allMatchedElements.indexOf(element) === -1) {
        that.matchChanged(element);
        that._allMatchedElements.push(element);
      }
    }

    that.toggleClass = function(isMatching, isNotMatching) {
      var isNotMatching = isNotMatching || 'not-' + isMatching;
      that.addListener(function(element, matches) {
        if (matches) {
          element.classList.add(isMatching);
          element.classList.remove(isNotMatching);
        } else {
          element.classList.remove(isMatching);
          element.classList.add(isNotMatching);
        }
      });
    }

    // Fire any callbacks
    this.matchChanged = function(element) {
      that.listeners.forEach(function(listener) {
        listener(element, that.isElementMatching(element), that );
      });
    }


    this.isElementMatching = function(element) {
      return that.matchedElements.indexOf(element) !== -1;
    }
    this.removeElementFromMatched = function(element) {
      // Only remove if already a matched element
      if (that.matchedElements.indexOf(element) !== -1) {
        that.matchedElements.splice(that.matchedElements.indexOf(element), 1);
        that.matchChanged(element);
      }
    }
    this.addElementToMatched = function(element) {

      if (that.matchedElements.indexOf(element) === -1) {
        that.matchedElements.push(element);
        that.matchChanged(element);
      }
    }

    this.init = function() {
     this.elements.forEach(function(element) {
       that.matchChanged(element);
     });   
    }

    // Check if individual element matches querry
    this.checkElementMatches = function(element) {
      return evaluateExpression(that.query)({
        width: getWidth(element),
        height: getHeight(element)  
      });
    };
  }

  // Do stuff
  document.addEventListener("DOMContentLoaded", ready, false);
  function ready() {
    var runElementQueryLoopPerfomant = debounce(MEDIALIST.runLoop, 100);
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

