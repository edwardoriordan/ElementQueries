(function(window) {

  // var MediaList = [];
  var eq;

  var MediaList = function() {
    var that = this;
    that.list = [];

    this.add = function(item) {
      that.list.push(item);
    }

    this.runLoop = function() {
      that.list.forEach(function(elementQuery) {
        elementQuery.checkAllForMatch();
      });  
    }
  };
  var MEDIALIST = new MediaList();

  // Class
  var ElementMatchMedia = function(selector, query) {
    var that = this;
    var matchedEvent = new CustomEvent("matchChange", { 
      bubbles: true,
      cancelable: true
    });
    var element = document.querySelectorAll(selector);

    this.elements = arrayFromNodeList(element);
    this.query = query;
    this.matches;
    this.listeners = [];
    this.matchedElements = [];

    // Add a listener to be fired when element matched change
    this.addListener = function(cb) {
      that.listeners.push(cb);
      if (MEDIALIST.list.indexOf(that) === -1) {
        MEDIALIST.list.push(that);

        that.init();
      }
    }; 

    // Listener for matchChange events
    // Fire any callbacks
    document.addEventListener("matchChange", function(e) {
      that.listeners.forEach(function(listener) {
        listener( e.target, that.isElementMatching(e.target), that );
      });
    });

    // Is element currently matched?
    this.isElementMatching = function(element) {
      return that.matchedElements.indexOf(element) !== -1;
    }
    // Remove element from matched array - emit matchChange event 
    this.removeElementFromMatched = function(element) {
      if (that.matchedElements.indexOf(element) !== -1) {    
        that.matchedElements.splice(that.matchedElements.indexOf(element), 1);
        element.dispatchEvent(matchedEvent);
      }
    }
    // Add element from matched array - emit matchChange event 
    this.addElementToMatched = function(element) {
      if (that.matchedElements.indexOf(element) === -1) {  
        that.matchedElements.push(element);
        element.dispatchEvent(matchedEvent);
      }
    }

    // Run from MediaList
    // Check if any elements match querry
    // Add or remove from matched list
    this.checkAllForMatch = function() {
      this.elements.forEach(function(element) {
        if(that.checkElementMatches(element)) {
          that.addElementToMatched(element);
        } else {
          that.removeElementFromMatched(element); 
        }
      });
    };

    // Same as this.checkAllForMatch
    // Must dispatchEvent for elements not matched as well (1)
    this.init = function() {
     this.elements.forEach(function(element) {
       if(that.checkElementMatches(element)) {
         that.addElementToMatched(element);
       } else {
         that.removeElementFromMatched(element);

         element.dispatchEvent(matchedEvent); // *1
       }
     });   
    }

    this.checkForMatchedChange = function(element) {
    }

    // Check if individual element matches querry
    this.checkElementMatches = function(element) {
      return evalMediaQuery(that.query)({
        width: getWidth(element),
        height: getHeight(element)  
      });
    };
  }

  document.addEventListener("DOMContentLoaded", ready, false);
  function ready() {
    var runElementQueryLoopPerfomant = debounce(MEDIALIST.runLoop, 100);
    window.addEventListener("resize", runElementQueryLoopPerfomant, false);

    test();
  }

  function test() {
    eq = new ElementMatchMedia('.big', '(min-width: 250px)');
    eq.addListener(function(element, matches) {
      console.log('changed', element, matches);
      if (matches) {
        element.classList.add('matching');
        element.classList.remove('not-matching');
      } else {
        element.classList.remove('matching');
        element.classList.add('not-matching');
      }
    });

    // New API
    // eq = new ElementMatchMedia('.big', '(min-width: 250px)', {
    //   rateLimit: 'debounce',
    //   toggleClassTrue: 'matching',
    //   toggleClassFalse: 'not-matching',
    // });
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
  function evalMediaQuery(query) {
    return Function("d", "return(" + query
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
        return "d." + toCamelCase($1) + $2 + parseCSSNumber($3);
      })
      .replace(/([<>=]+)([A-z][\w-]*)/g, '$1"$2"') + ")");
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

