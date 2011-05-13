window.glaze = {};
(function () {
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
/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/

/**
 * @param {string}            url
 * @param {function(string)}  callback
 * @param {function(Error)=}  err_callback
 */
function load_url_source (url, callback, err_callback) {
  var request = new XMLHttpRequest(),
      err;
  /*DEBUG*/
  if (typeof url !== 'string' || typeof callback !== 'function' ||
      (err_callback !== undefined && typeof err_callback !== 'function')) {
    throw new TypeError("load_url(url:string, callback:function, err_callback:function): Invalid parameters.");
  }
  /*END_DEBUG*/
  function load_shader_error (evt) {
    err = err || evt;
    if (typeof err_callback === 'function') {
      err_callback(err);
    } else {
      console.error(err);
    }
  }
  request.addEventListener('load', function () {
    callback(request.responseText);
  }, false);
  request.addEventListener('error', load_shader_error, false);
  request.addEventListener('abort', load_shader_error, false);
  
  try {
    request.open('GET', window.encodeURI(url), true);
    request.send(null);
  } catch (e) {
    err = e;
  }
}

/**
 * @param {string|HTMLElement} element
 * @return {HTMLElement|null}
 */
function get_element (element) {
  if (element instanceof window.HTMLElement) {
    return element;
  }
  if (typeof element === 'string') {
    element = (element[0] === '#') ? element.slice(1) : element;
  }
  return document.getElementById(element);
}

/**
 * Returns the inner-HTML content from an element.
 * @param   {string}            id
 * @param   {function(string)=} callback
 * @return  {string}
 */
function load_element_source (id, callback) {
  var element = get_element(id),
      inner_html = (element) ? element.innerHTML : null;
  /*DEBUG*/
  if(!element) {
    throw new ReferenceError("load_element_source: Element not found for: " + id);
  }
  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError("load_element_source(id:string, callback:function): Invalid callback.");
  }
  if (typeof inner_html !== 'string' || inner_html.length === 0) {
    throw new SyntaxError("load_element_source: #" + id + " source is empty.");
  }
  /*END_DEBUG*/
  if (typeof callback === 'function') {
    callback(inner_html);
  }
  return inner_html;
}

/**
 * Ensures that any callbacks are run with the correct window.gl binding.
 * @param {WebGLRenderingContext=}  context
 * @param {function}                callback
 * @param {*}                       params
 * @returns {*} Return value of callback;
 */
function with_gl (context, callback /*, params...*/) {
  var params = Array.prototype.slice.call(arguments, 2),
      old_gl = window.gl,
      rv;
  if (params.length === 0) { params = null; }
  window.gl = context;
  rv = callback.apply(this, params);
  window.gl = old_gl;
  return rv;
}
/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/
if (typeof window.requestAnimationFrame !== 'function') {
  window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.oRequestAnimationFrame ||
                                 window.msRequestAnimationFrame ||
                                 function (callback, element) {
                                   window.setTimeout(callback, 1000/60);
                                 };
}

/**
 * Runs a function at an animation interval.
 * @param {function}      callback  Function to run.
 * @param {HTMLElement=}  element   Element bounds of the animation.
 * @param {WebGLRenderingContext=}  gl
 * @param {*}             args      Variable amount of arguments to pass to the callback function.
 */
glaze.animate = function (callback /*, element, gl, args...*/) {
  var args = Array.prototype.slice.call(arguments, 1),
      element = (args[0] instanceof HTMLElement) ? args.shift() : glaze.element,
      gl = (args[0] instanceof WebGLRenderingContext) ? args.shift() : window.gl,
      that = this;
  if (args.length === 0 ) { args = null; }
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.animate: Invalid WebGL rendering context.");
  }
  if (typeof callback !== 'function') {
    throw TypeError("glaze.createDraw(callback [, element, args...]): Invalid parameter.");
  }
  /*END_DEBUG*/
  (function tick () {
    if (!window.gl) { window.gl = gl }; //gives our drawing function access to the global context
    callback.apply(that, args);
    window.requestAnimationFrame(tick, element);
  }());
};
/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze, load_element_source, load_url_source*/

/**
 * @param {string|number}           type
 * @param {string}                  src
 * @param {WebGLRenderingContext=}  gl
 * @return {WebGLShader}
 */
glaze.createShader = function (type, src /*, gl*/) {
  var shader, status_log,
      gl = (arguments.length === 3) ? arguments[2] : window.gl;
  
  if (type === 'vertex')   { type = gl.VERTEX_SHADER; }
  if (type === 'fragment') { type = gl.FRAGMENT_SHADER; }
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  if (type !== gl.VERTEX_SHADER && type !== gl.FRAGMENT_SHADER) {
    throw new ReferenceError("glaze.createShader(type:constant, src:string): Invalid shader type: " + type);
  }
  if (typeof src !== 'string') {
    throw new TypeError("glaze.createShader(type:constant, src:string): Invalid shader source: " + src);
  }
  /*END_DEBUG*/
  shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  /*DEBUG*/
  if (!gl.isShader(shader)) {
    throw new Error("glaze.createShader: Could not create shader.");
  }
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    status_log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    type = (type === gl.VERTEX_SHADER) ? 'VERTEX' : 'FRAGMENT';
    throw new Error("glaze.createShader: Bad Compile: " + type + ": " + status_log);
  }
  /*END_DEBUG*/
  return shader;
};

/**
 * @param {string|HTMLElement}      location
 * @param {string|number}           type
 * @param {WebGLRenderingContext=}  gl
 * @param {function(WebGLShader)=}  callback
 * @return {WebGLShader}
 */
glaze.loadShader = function (location, type /*, gl, callback*/) {
  var args = Array.prototype.slice.call(arguments),
      callback = (typeof args[args.length-1] === 'function') ? args.pop() : null,
      gl = (args[args.length-1] instanceof WebGLRenderingContext) ? args.pop() : window.gl,
      element = get_element(location),
      shader, old_gl;

  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  if (type === 'fragment') { type = gl.FRAGMENT_SHADER; }
  if (type === 'vertex')   { type = gl.VERTEX_SHADER; }
  if (type !== gl.FRAGMENT_SHADER && type !== gl.VERTEX_SHADER) {
    throw new TypeError("glaze.loadShader(location:string, type:constant, callback:function): Invalid parameters.");
  }
  /*END_DEBUG*/
  if (element) {
    shader = glaze.createShader(type, load_element_source(element), gl);
    if (typeof callback === 'function') {
      with_gl(gl, callback, shader);
    }
    return shader;
  } else {
    /*DEBUG*/
    if (typeof location !== 'string' || typeof callback !== 'function') {
      throw new TypeError("glaze.loadShader(location:string, type:constant, callback:function): Invalid parameters.");
    }
    /*END_DEBUG*/
    load_url_source(location, function (src) {
      with_gl(gl, callback, glaze.createShader(type, src, gl));
    });
  }
};
/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/

/**
 * @param {WebGLShader} vShader     Vertex shader
 * @param {WebGLShader} fShader     Fragment shader
 * @param {WebGLRenderingContext=}  gl
 * @return {WebGLProgram}
 */
glaze.createProgram = function (vert_shader, frag_shader /*, gl*/) {
  var program, status_log,
      gl = (arguments.length === 3) ? arguments[2] : window.gl;
  
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  if (!gl.isShader(vert_shader) || !gl.isShader(frag_shader)) {
    throw new TypeError("glaze.createProgram(vert_shader:WebGLShader, frag_shader:WebGLShader): Invalid parameters.");
  }
  /*END_DEBUG*/
  program = gl.createProgram();
  gl.attachShader(program, vert_shader);
  gl.attachShader(program, frag_shader);
  gl.linkProgram(program);
  /*DEBUG*/
  if (!gl.isProgram(program)) {
    throw new Error("glaze.createProgram: Could not create program object.");
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    status_log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("glaze.createProgram: " + status_log);
  }
  /*END_DEBUG*/
  return program;
};

/**
 * @param {object}                  urls {vertex: 'url', fragment: 'url'}
 * @param {WebGLRenderingContext=}  gl
 * @param {function(WebGLProgram)=} callback
 */
glaze.loadProgram = function (urls /*, gl, callback*/) {
  var v_element, f_element, v_shader, f_shader, program, old_gl,
      args = Array.prototype.slice.call(arguments),
      callback = (typeof args[args.length-1] === 'function') ? args.pop() : null,
      gl = (args[args.length-1] instanceof WebGLRenderingContext) ? args.pop() : window.gl;
  
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  if (!urls || typeof urls.vertex === 'undefined' || typeof urls.fragment === 'undefined') {
    throw new TypeError("glaze.loadProgram(urls:{vertex:location, fragment:location}, callback:function): Invalid parameters.");
  }
  /*END_DEBUG*/
  v_element = get_element(urls.vertex);
  f_element = get_element(urls.fragment);

  if (v_element) {
    v_shader = glaze.loadShader(v_element, gl.VERTEX_SHADER, gl);
  }
  if (f_element) {
    f_shader = glaze.loadShader(f_element, gl.FRAGMENT_SHADER, gl);
  }
  
  if (v_shader && f_shader) {
    program = glaze.createProgram(v_shader, f_shader, gl);
    if (typeof callback === 'function') {
      with_gl(gl, callback, program);
    }
    return program;
  }

  //looks like we grabbing urls
  /*DEBUG*/
  if (typeof callback !== 'function') {
    throw new TypeError("glaze.loadProgram(urls, callback:function): Urls require a callback.");
  }
  /*END_DEBUG*/
  if (!v_shader) {
    glaze.loadShader(urls.vertex, gl.VERTEX_SHADER, function (shader) {
      if (f_shader) {
        with_gl(gl, callback, glaze.createProgram(shader, f_shader, gl));
      } else {
        v_shader = shader;
      }
    });
  }
  if (!f_shader) {
    glaze.loadShader(urls.fragment, gl.FRAGMENT_SHADER, gl, function (shader) {
      if (v_shader) {
        with_gl(gl, callback, glaze.createProgram(v_shader, shader, gl));
      } else {
        f_shader = shader;
      }
    });
  }
};

/**
 * @param {WebGLProgram}  program
 * @param {string}        name
 * @param {WebGLRenderingContext=}  gl
 * return {number}                Location index.
 */
glaze.createAttribute = function (program, name /*, gl*/) {
  var attrib,
      gl = (arguments.length === 3) ? arguments[2] : window.gl;
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  if (!gl.isProgram(program) || typeof name !== 'string') {
    throw new TypeError("glaze.createAttribute(program:WebGLProgram, name:string): Invalid parameters.");
  }
  /*END_DEBUG*/
  gl.useProgram(program);
  attrib = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(attrib);
  return attrib;
};

/**
 * @param {WebGLProgram} program
 * @param {string} name
 * @param {WebGLRenderingContext=}  gl
 * return {WebGLUniformLocation}
 */
glaze.createUniform = function (program, name /*, gl*/) {
  var gl = (arguments.length === 3) ? arguments[2] : window.gl;
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  if (!gl.isProgram(program) || typeof name !== 'string') {
    throw new TypeError("createUniform(program:WebGLProgram, name:string): Invalid parameters.");
  }
  /*END_DEBUG*/
  gl.useProgram(program);
  return gl.getUniformLocation(program, name);
};
/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/

/**
 * @param {array} vertices
 * @param {string=} target  Target buffer object, default: gl.ARRAY_BUFFER
 * @param {string=} usage   Expected usage, default: gl.STATIC_DRAW
 * return {WebGLBuffer}
 */
glaze.createBuffer = function (vertices, target, usage) {
  var buffer;
  target = (target === undefined) ? gl.ARRAY_BUFFER : target;
  usage  = (usage  === undefined) ? gl.STATIC_DRAW : usage;
  /*DEBUG*/
  if (!Array.isArray(vertices)) {
    throw new TypeError("glaze.createBuffer: Vertices must be an array.");
  }
  if (target !== gl.ARRAY_BUFFER && target !== gl.ELEMENT_ARRAY_BUFFER) {
    throw new TypeError("glaze.createBuffer: Unknown target type: " + target);
  }
  if (usage !== gl.STATIC_DRAW && usage !== gl.STREAM_DRAW && usage !== gl.DYNAMIC_DRAW) {
    throw new TypeError("glaze.createBuffer: Unknown usage type: " + usage);
  }
  /*END_DEBUG*/
  buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  if (target === gl.ARRAY_BUFFER) {
    if (Array.isArray(vertices)) { vertices = new window.Float32Array(vertices); }
    /*DEBUG*/
    if (!vertices instanceof window.Float32Array) {
      throw new TypeError("glaze.createBuffer: ARRAY_BUFFER vertices must be an Array or Float32Array.");
    }
    /*END_DEBUG*/
    gl.bufferData(gl.ARRAY_BUFFER, vertices, usage);
  } else {
    //array indexes
    if (Array.isArray(vertices)) { vertices = new window.Uint16Array(vertices); }
    /*DEBUG*/
    if (!vertices instanceof window.Uint16Array) {
      throw new TypeError("glaze.createBuffer: ELEMENT_ARRAY_BUFFER vertices must be an Array or Uint16Array.");
    }
    /*END_DEBUG*/
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertices, usage);
  }
  return buffer;
};
/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/

/**
 * @param {Image} image
 * @param {number=} format  default: gl.RGBA [gl.RGB|gl.ALPHA|gl.LUMINANCE|gl.LUMINANCE_ALPHA]
 * @return {WebGLTexture}
 */
glaze.createTexture = function (image, format) {
  format = (format === undefined) ? gl.RGBA : format;
  
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};

/**
 * @param {string}
 * @param {function(WebGLTexture)}
 */
glaze.loadTexture = function (location, callback) {
  var image;

  function load_image_error () {
    throw new URIError("glaze.loadTexture: Unable to load " + image.src);
  }
  
  if (typeof location !== 'string') {
    image = location; //passed image object
  } else {
    if (location[0] === '#') { //element id
      location = (location[0] === '#') ? location.slice(1) : location;
      image = document.getElementById(location);
    } else {
      image = new window.Image();
      image.src = window.encodeURI(location); //url
    }
  }
  if (!image instanceof window.Image) {
    throw new ReferenceError("glaze.loadTexture: Image must be an element or url.");
  }
  
  if (image.complete) { //image already loaded
    callback(glaze.createTexture(image));
  } else {
    //if not, assign load handlers
    image.addEventListener('load', function () {
      callback(glaze.createTexture(image));
    });
    image.addEventListener('error', load_image_error);
    image.addEventListener('abort', load_image_error);
  }
};
}());
/*DEBUG*/
//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.error(msg);
		window.console.trace();
		throw new Error(msg);
		//debugger;
  }
};

/**
 * Which arguements are enums.
 * @type {!Object.<number, string>}
 */
var glValidEnumContexts = {

  // Generic setters and getters

  'enable': { 0:true },
  'disable': { 0:true },
  'getParameter': { 0:true },

  // Rendering

  'drawArrays': { 0:true },
  'drawElements': { 0:true, 2:true },

  // Shaders

  'createShader': { 0:true },
  'getShaderParameter': { 1:true },
  'getProgramParameter': { 1:true },

  // Vertex attributes

  'getVertexAttrib': { 1:true },
  'vertexAttribPointer': { 2:true },

  // Textures

  'bindTexture': { 0:true },
  'activeTexture': { 0:true },
  'getTexParameter': { 0:true, 1:true },
  'texParameterf': { 0:true, 1:true },
  'texParameteri': { 0:true, 1:true, 2:true },
  'texImage2D': { 0:true, 2:true, 6:true, 7:true },
  'texSubImage2D': { 0:true, 6:true, 7:true },
  'copyTexImage2D': { 0:true, 2:true },
  'copyTexSubImage2D': { 0:true },
  'generateMipmap': { 0:true },

  // Buffer objects

  'bindBuffer': { 0:true },
  'bufferData': { 0:true, 2:true },
  'bufferSubData': { 0:true },
  'getBufferParameter': { 0:true, 1:true },

  // Renderbuffers and framebuffers

  'pixelStorei': { 0:true, 1:true },
  'readPixels': { 4:true, 5:true },
  'bindRenderbuffer': { 0:true },
  'bindFramebuffer': { 0:true },
  'checkFramebufferStatus': { 0:true },
  'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
  'framebufferTexture2D': { 0:true, 1:true, 2:true },
  'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
  'getRenderbufferParameter': { 0:true, 1:true },
  'renderbufferStorage': { 0:true, 1:true },

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': { 0:true },
  'depthFunc': { 0:true },
  'blendFunc': { 0:true, 1:true },
  'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
  'blendEquation': { 0:true },
  'blendEquationSeparate': { 0:true, 1:true },
  'stencilFunc': { 0:true },
  'stencilFuncSeparate': { 0:true, 1:true },
  'stencilMaskSeparate': { 0:true },
  'stencilOp': { 0:true, 1:true, 2:true },
  'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

  // Culling

  'cullFace': { 0:true },
  'frontFace': { 0:true },
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums == null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
function glFunctionArgToString(functionName, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    if (funcInfo[argumentIndex]) {
      return glEnumToString(value);
    }
  }
  return value.toString();
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
function makeDebugContext(ctx, opt_onErrorFunc) {
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii == 0) ? '' : ', ') +
              glFunctionArgToString(functionName, ii, args[ii]);
        }
        log("WebGL error "+ glEnumToString(err) + " in "+ functionName +
            "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      var result = ctx[functionName].apply(ctx, arguments);
      var err = ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       wrapper[propertyName] = ctx[propertyName];
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

function resetToInitialState(ctx) {
  var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  var tmp = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (var ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
  }
  ctx.deleteBuffer(tmp);

  var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (var ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(-1);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError());
}

function makeLostContextSimulatingContext(ctx) {
  var wrapper_ = {};
  var contextId_ = 1;
  var contextLost_ = false;
  var resourceId_ = 0;
  var resourceDb_ = [];
  var onLost_ = undefined;
  var onRestored_ = undefined;
  var nextOnRestored_ = undefined;

  // Holds booleans for each GL error so can simulate errors.
  var glErrorShadow_ = { };

  function isWebGLObject(obj) {
    //return false;
    return (obj instanceof WebGLBuffer ||
            obj instanceof WebGLFramebuffer ||
            obj instanceof WebGLProgram ||
            obj instanceof WebGLRenderbuffer ||
            obj instanceof WebGLShader ||
            obj instanceof WebGLTexture);
  }

  function checkResources(args) {
    for (var ii = 0; ii < args.length; ++ii) {
      var arg = args[ii];
      if (isWebGLObject(arg)) {
        return arg.__webglDebugContextLostId__ == contextId_;
      }
    }
    return true;
  }

  function clearErrors() {
    var k = Object.keys(glErrorShadow_);
    for (var ii = 0; ii < k.length; ++ii) {
      delete glErrorShdow_[k];
    }
  }

  // Makes a function that simulates WebGL when out of context.
  function makeLostContextWrapper(ctx, functionName) {
    var f = ctx[functionName];
    return function() {
      // Only call the functions if the context is not lost.
      if (!contextLost_) {
        if (!checkResources(arguments)) {
          glErrorShadow_[ctx.INVALID_OPERATION] = true;
          return;
        }
        var result = f.apply(ctx, arguments);
        return result;
      }
    };
  }

  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper_[propertyName] = makeLostContextWrapper(ctx, propertyName);
     } else {
       wrapper_[propertyName] = ctx[propertyName];
     }
  }

  function makeWebGLContextEvent(statusMessage) {
    return {statusMessage: statusMessage};
  }

  function freeResources() {
    for (var ii = 0; ii < resourceDb_.length; ++ii) {
      var resource = resourceDb_[ii];
      if (resource instanceof WebGLBuffer) {
        ctx.deleteBuffer(resource);
      } else if (resource instanceof WebctxFramebuffer) {
        ctx.deleteFramebuffer(resource);
      } else if (resource instanceof WebctxProgram) {
        ctx.deleteProgram(resource);
      } else if (resource instanceof WebctxRenderbuffer) {
        ctx.deleteRenderbuffer(resource);
      } else if (resource instanceof WebctxShader) {
        ctx.deleteShader(resource);
      } else if (resource instanceof WebctxTexture) {
        ctx.deleteTexture(resource);
      }
    }
  }

  wrapper_.loseContext = function() {
    if (!contextLost_) {
      contextLost_ = true;
      ++contextId_;
      while (ctx.getError());
      clearErrors();
      glErrorShadow_[ctx.CONTEXT_LOST_WEBGL] = true;
      setTimeout(function() {
          if (onLost_) {
            onLost_(makeWebGLContextEvent("context lost"));
          }
        }, 0);
    }
  };

  wrapper_.restoreContext = function() {
    if (contextLost_) {
      if (onRestored_) {
        setTimeout(function() {
            freeResources();
            resetToInitialState(ctx);
            contextLost_ = false;
            if (onRestored_) {
              var callback = onRestored_;
              onRestored_ = nextOnRestored_;
              nextOnRestored_ = undefined;
              callback(makeWebGLContextEvent("context restored"));
            }
          }, 0);
      } else {
        throw "You can not restore the context without a listener"
      }
    }
  };

  // Wrap a few functions specially.
  wrapper_.getError = function() {
    if (!contextLost_) {
      var err;
      while (err = ctx.getError()) {
        glErrorShadow_[err] = true;
      }
    }
    for (var err in glErrorShadow_) {
      if (glErrorShadow_[err]) {
        delete glErrorShadow_[err];
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  var creationFunctions = [
    "createBuffer",
    "createFramebuffer",
    "createProgram",
    "createRenderbuffer",
    "createShader",
    "createTexture"
  ];
  for (var ii = 0; ii < creationFunctions.length; ++ii) {
    var functionName = creationFunctions[ii];
    wrapper_[functionName] = function(f) {
      return function() {
        if (contextLost_) {
          return null;
        }
        var obj = f.apply(ctx, arguments);
        obj.__webglDebugContextLostId__ = contextId_;
        resourceDb_.push(obj);
        return obj;
      };
    }(ctx[functionName]);
  }

  var functionsThatShouldReturnNull = [
    "getActiveAttrib",
    "getActiveUniform",
    "getBufferParameter",
    "getContextAttributes",
    "getAttachedShaders",
    "getFramebufferAttachmentParameter",
    "getParameter",
    "getProgramParameter",
    "getProgramInfoLog",
    "getRenderbufferParameter",
    "getShaderParameter",
    "getShaderInfoLog",
    "getShaderSource",
    "getTexParameter",
    "getUniform",
    "getUniformLocation",
    "getVertexAttrib"
  ];
  for (var ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
    var functionName = functionsThatShouldReturnNull[ii];
    wrapper_[functionName] = function(f) {
      return function() {
        if (contextLost_) {
          return null;
        }
        return f.apply(ctx, arguments);
      }
    }(wrapper_[functionName]);
  }

  var isFunctions = [
    "isBuffer",
    "isEnabled",
    "isFramebuffer",
    "isProgram",
    "isRenderbuffer",
    "isShader",
    "isTexture"
  ];
  for (var ii = 0; ii < isFunctions.length; ++ii) {
    var functionName = isFunctions[ii];
    wrapper_[functionName] = function(f) {
      return function() {
        if (contextLost_) {
          return false;
        }
        return f.apply(ctx, arguments);
      }
    }(wrapper_[functionName]);
  }

  wrapper_.checkFramebufferStatus = function(f) {
    return function() {
      if (contextLost_) {
        return ctx.FRAMEBUFFER_UNSUPPORTED;
      }
      return f.apply(ctx, arguments);
    };
  }(wrapper_.checkFramebufferStatus);

  wrapper_.getAttribLocation = function(f) {
    return function() {
      if (contextLost_) {
        return -1;
      }
      return f.apply(ctx, arguments);
    };
  }(wrapper_.getAttribLocation);

  wrapper_.getVertexAttribOffset = function(f) {
    return function() {
      if (contextLost_) {
        return 0;
      }
      return f.apply(ctx, arguments);
    };
  }(wrapper_.getVertexAttribOffset);

  wrapper_.isContextLost = function() {
    return contextLost_;
  };

  function wrapEvent(listener) {
    if (typeof(listener) == "function") {
      return listener;
    } else {
      return function(info) {
        listener.handleEvent(info);
      }
    }
  }

  wrapper_.registerOnContextLostListener = function(listener) {
    onLost_ = wrapEvent(listener);
  };

  wrapper_.registerOnContextRestoredListener = function(listener) {
    if (contextLost_) {
      nextOnRestored_ = wrapEvent(listener);
    } else {
      onRestored_ = wrapEvent(listener);
    }
  }

  return wrapper_;
}

return {
  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
   *
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
   *            funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   */
  'makeDebugContext': makeDebugContext,

  /**
   * Given a WebGL context returns a wrapped context that adds 4
   * functions.
   *
   * ctx.loseContext:
   *   simulates a lost context event.
   *
   * ctx.restoreContext:
   *   simulates the context being restored.
   *
   * ctx.registerOnContextLostListener(listener):
   *   lets you register a listener for context lost. Use instead
   *   of addEventListener('webglcontextlostevent', listener);
   *
   * ctx.registerOnContextRestoredListener(listener):
   *   lets you register a listener for context restored. Use
   *   instead of addEventListener('webglcontextrestored',
   *   listener);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   */
  'makeLostContextSimulatingContext': makeLostContextSimulatingContext,

  /**
   * Resets a context to the initial state.
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *     reset.
   */
  'resetToInitialState': resetToInitialState
};

}();

/*END_DEBUG*/
