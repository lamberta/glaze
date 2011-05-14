/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze, load_element_source, load_url_source*/

/**
 * @param {string|number}         type
 * @param {string}                src
 * @this {WebGLRenderingContext}
 * @return {WebGLShader}
 */
glaze.createShader = function (type, src) {
  var shader, status_log,
      gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl;
  
  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  /*END_DEBUG*/
  if (type === 'vertex')   { type = gl.VERTEX_SHADER; }
  if (type === 'fragment') { type = gl.FRAGMENT_SHADER; }
  /*DEBUG*/
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
 * @param {function(WebGLShader)=}  callback
 * @this {WebGLRenderingContext}
 * @return {WebGLShader}
 */
glaze.loadShader = function (location, type /*, callback*/) {
  var args = Array.prototype.slice.call(arguments),
      callback = (typeof args[args.length-1] === 'function') ? args.pop() : null,
      gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl,
      canvas = (glaze.canvas) ? glaze.canvas : null,
      element = get_element(location),
      shader;

  /*DEBUG*/
  if (!gl instanceof WebGLRenderingContext) {
    throw new ReferenceError("glaze.createShader: No gl context.");
  }
  /*END_DEBUG*/
  if (type === 'fragment') { type = gl.FRAGMENT_SHADER; }
  if (type === 'vertex')   { type = gl.VERTEX_SHADER; }
  /*DEBUG*/
  if (type !== gl.FRAGMENT_SHADER && type !== gl.VERTEX_SHADER) {
    throw new TypeError("glaze.loadShader(location:string, type:constant, callback:function): Invalid parameters.");
  }
  /*END_DEBUG*/
  if (element) {
    shader = glaze.createShader.call(gl, type, load_element_source(element));
    if (typeof callback === 'function') {
      callback.call(canvas, shader);
    }
    return shader;
    
  } else {
    /*DEBUG*/
    if (typeof location !== 'string' || typeof callback !== 'function') {
      throw new TypeError("glaze.loadShader(location:string, type:constant, callback:function): Invalid parameters.");
    }
    /*END_DEBUG*/
    load_url_source(location, function (src) {
      callback.call(canvas, glaze.createShader.call(gl, type, src));
    });
  }
};
