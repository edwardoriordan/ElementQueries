ElementQueries
==============

Element Queries based on matchMedia's API

``` javascript
var eq = new ElementMatchMedia('.big', '(min-width: 750px)');
eq.addListener(function(element, matches) {
  if (matches) {
    ...
  }
});
```
