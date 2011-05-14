/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, plusplus: false, bitwise: true, newcap: true*/
/*globals glaze, WebGLDebugUtils*/

(function () {
  var ready_queue = []; // {canvas: element, queue: [fns...]}
  
  function dom_loaded () {
    ready_queue.forEach(function (obj) {
      obj.queue.forEach(function (callback) {
        //set global so we can access throughout stack
        glaze.canvas = obj.canvas;
        glaze.gl = obj.canvas.getContext("experimental-webgl");
        /*DEBUG*/
        if (!glaze.gl instanceof window.WebGLRenderingContext) {
          throw new ReferenceError("glaze.ready: Invalid WebGL rendering context.");
        }
        /*END_DEBUG*/
        callback.call(glaze.canvas, glaze.gl);
      });
      obj.queue.length = 0;
    });
  }
  
  function onDOMContentLoaded () {
    dom_loaded();
    window.removeEventListener('DOMContentLoaded', onDOMContentLoaded, false);
  }
  
  /**
   * @param {HTMLCanvasElement}               canvas
   * @param {function(WebGLRenderingContext)} callback
   */
  glaze.ready = function (canvas, callback) {
    var i, len;
    canvas = get_element(canvas);
    /*DEBUG*/
    if (!canvas instanceof window.HTMLCanvasElement || typeof callback !== 'function') {
      throw new TypeError("glaze.ready(canvas:HTMLCanvasElement, callback:function): Invalid parameter.");
    }
    /*END_DEBUG*/
    if (ready_queue.some(function (obj) { return obj.canvas === canvas; })) {
      //git a match, add to callback queue
      for (i = 0, len = ready_queue.length; i < len; i++) {
        if (ready_queue[i].canvas === canvas) {
          ready_queue.queue.push(callback);
          break;
        }
      }
    } else {
      //new canvas
      ready_queue.push({canvas: canvas, queue: [callback]});
    }

    //already loaded
    if (window.readyState === 'complete') {
      dom_loaded();
    }
  };

  //if we missed the event, no need to listen for it
  if (window.readyState !== 'complete') {
    window.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);
  }
}());
