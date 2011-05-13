/**
 * Runs a function at an animation interval.
 * @param {function}      callback  Function to run.
 * @param {HTMLElement=}  element   Element bounds of the animation.
 * @param {*}             args      Variable amount of arguments to pass to the callback function.
 */
glaze.animate = function (callback /*, element, args...*/) {
  var args = Array.prototype.slice.call(arguments, 1),
      element = (args[0] instanceof HTMLElement) ? args.shift() : glaze.element,
      that = this;
  if (args.length === 0 ) { args = null; }
  /*DEBUG*/
  if (typeof callback !== 'function') {
    throw TypeError("glaze.createDraw(callback [, element, args...]): Invalid parameter.");
  }
  /*END_DEBUG*/
  (function tick () {
    callback.apply(that, args);
    window.requestAnimationFrame(tick, element);
  }());
};
