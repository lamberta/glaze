/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/

/**
 * @param {array} vertices
 * @param {string=} target  Target buffer object, default: gl.ARRAY_BUFFER
 * @param {string=} usage   Expected usage, default: gl.STATIC_DRAW
 * @this {WebGLRenderingContext}
 * return {WebGLBuffer}
 */
glaze.createBuffer = function (vertices, target, usage) {
  var gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl,
      buffer;
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
