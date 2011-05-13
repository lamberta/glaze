/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, plusplus: false, bitwise: true, newcap: true*/
/*globals glaze, WebGLDebugUtils*/

/* Setting this as a global for convenience.
 */
window.gl = null;

Object.defineProperty(glaze, 'element', (function () {
  var canvas_element = null;
  return {
    enumerable: true,
    configurable: true,
    get : function () { return canvas_element; },
    set : function (element) {
      if (element === null) {
        window.gl = canvas_element = null;
        return null;
      }
      element = get_element(element);
      /*DEBUG*/
      if (!element instanceof window.HTMLCanvasElement) {
        throw new TypeError("glaze.element(canvasVar:HTMLCanvasElement): Invalid element.");
      }
      /*END_DEBUG*/
      canvas_element = element;
      window.gl = canvas_element.getContext("experimental-webgl");
      /*DEBUG*/
      if (typeof WebGLDebugUtils !== 'undefined') {
        window.gl = WebGLDebugUtils.makeDebugContext(canvas_element.getContext("experimental-webgl"));
      } else {
        console.warn("glaze.element: Unable to locate WebGLDebugUtils, using regular context.");
      }
      /*END_DEBUG*/
    }
  };
}()));


(function () {
  var ready_queue = [];
  
  function dom_loaded () {
    var i = 0,
        len = ready_queue.length;

    //if (len > 0) {
    //  throw new Error("glaze.ready: No WebGL context, set glaze.element with a Canvas element.");
    //}
    for (; i < len; i++) {
      ready_queue[i].call(glaze.element, window.gl); //pass the global object to alias the namespace
    }
    ready_queue.length = 0;
  }
  
  function onDOMContentLoaded () {
    dom_loaded();
    window.removeEventListener('DOMContentLoaded', onDOMContentLoaded, false);
  }
  
  /**
   * @param {HTMLCanvasElement=}  canvas
   * @param {function}            callback
   */
  glaze.ready = function (/*canvas,*/ callback) {
    var canvas, old_canvas;
    if (arguments.length === 2) {
      canvas = get_element(arguments[0]);
      callback = arguments[1];
    }
    /*DEBUG*/
    if ((canvas && !canvas instanceof window.HTMLCanvasElement) || 
        typeof callback !== 'function') {
      throw new TypeError("glaze.ready([canvas,] callback):Invalid parameter.");
    }
    /*END_DEBUG*/
    if (canvas) {
      ready_queue.push(function () {
        old_canvas = glaze.element;
        glaze.element = canvas;
        callback.call(canvas, window.gl);
        glaze.element = old_canvas;
      });
    } else {
      ready_queue.push(callback);
    }
    //already loaded
    if (window.readyState === "complete") {
      dom_loaded();
    }
  };

  //if we missed the event, no need to listen for it
  if (window.readyState !== "complete") {
    if (window.addEventListener) {
      window.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);
    } else {
      console.error("window.addEventListener not supported.");
    }
  }
  
}());
