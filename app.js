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
      that.list.forEach(function(media) {
        media.matches();
      });  
    }
  };
  var MEDIALIST = new MediaList();

  // Class
  var ElementMatchMedia = function(selector, query) {
    var that = this;
    var matchChanged = new CustomEvent("matchChange");
    var element = document.querySelectorAll(selector);

    this.elements = arrayFromNodeList(element);
    this.query = parseMQ(query);
    this._matched;
    this.listeners = [];

    this.elements.forEach(function(element) {
      element.addEventListener("matchChange", function(e) {
        console.info("Event is: ", e);

        that.listeners.forEach(function(listener) {
          listener(that)
        });
      })
    });

    this.matches = function() {
      var matches = evalMediaQuery(query)({
        width: getWidth(this.elements[0]),
        height: getHeight(this.elements[0])  
      });

      if (matches !== that._matched) {
        that._matched = matches;
        this.elements.forEach(function(element) {
          element.dispatchEvent(matchChanged);
        });
      }

      return matches;
    };

    this.addListener = function(cb) {
      that.listeners.push(cb);
      if (MEDIALIST.list.indexOf(that) === -1) MEDIALIST.list.push(that);
    }; 
  }

  document.addEventListener("DOMContentLoaded", ready, false);
  function ready() {
    var runElementQueryLoopPerfomant = debounce(MEDIALIST.runLoop, 100);
    window.addEventListener("resize", runElementQueryLoopPerfomant, false);

    test();
    
    runElementQueryLoopPerfomant();
  }

  function test() {
    eq = new ElementMatchMedia('.big', 'min-width: 250px');
    eq.addListener(function(media) {
      console.log('changed');

      media.elements.forEach(function(element) {
        // element.classList.toggle('red');
        toggleClass(element, 'red', media._matched);
      });
    });
  }

  // Utils
  function toggleClass(element, className, truthy) {
    if (truthy) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }  
  }

  function arrayFromNodeList(nodeList) {
    var arr = [],
        i = 0;
    if (nodeList.length === 1) return [nodeList[0]];

    for (i; i < nodeList.length; ++i) {
      arr.push(nodeList[i]);
    }
    return arr;
  }

  // var mql = window.matchMedia("(orientation: portrait)");
  // mql.addListener(handleOrientationChange);
  // handleOrientationChange(mql);

  // var eq = ElementMatchMedia(el, '(min-width: 50px)');
  // eq.matches: true | false
  // eq.addListener(callback(element, mq))

  // Set Class
  function setClass(selector, elClass, mq) {
    var elems = document.querySelectorAll(selector);
    
    for (var i = 0; i < elems.length; ++i) {

      console.log(elems[i], getWidth(elems[i]));
      
      if (getWidth(elems[i]) > mq) {
        elems[i].classList.add(elClass);
      } else {
        elems[i].classList.remove(elClass);
      }

      // trigger event - element query matched
    }
  }

  function parseMQ(query) {
    var evalQ = query
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
                  .replace(/([\w-]+)\s*([<>=]+)\s*(\w+)/g, function ($0, attribute, symbol, value) {
                    return toCamelCase(attribute) + symbol + parseCSSNumber(value);
                  });
    return evalQ;
  }

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

  function parseMQObj(query) {
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
            .replace(/([\w-]+)\s*([<>=]+)\s*(\w+)/g, function ($0, attribute, symbol, value) {
              return '|' + toCamelCase(attribute) + '|' + symbol + '|' + parseCSSNumber(value);
            });
  }

  function toCamelCase(value) {
    return value.toLowerCase().replace(/-[a-z]/g, function ($0) {
      return $0[1].toUpperCase();
    });
  }

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

  // Get Property
  var getProperty = function(elem, property) {
    // var elem = document.querySelectorAll(selector)[0];
    return window.getComputedStyle(elem)[property];  
  };
  var getWidth = function(selector) {
    return parseInt(getProperty(selector, 'width'));
  }
  var getHeight = function(selector) {
    return parseInt(getProperty(selector, 'height'));
  }

  // Underscore
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

