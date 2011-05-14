/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/

/**
 * @param {WebGLShader} vShader   Vertex shader
 * @param {WebGLShader} fShader   Fragment shader
 * @this {WebGLRenderingContext}
 * @return {WebGLProgram}
 */
glaze.createProgram = function (vert_shader, frag_shader) {
  var program, status_log,
      gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl;
  
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
 * @param {function(WebGLProgram)=} callback
 * @this {WebGLRenderingContext}
 */
glaze.loadProgram = function (urls /*, callback*/) {
  var v_element, f_element, v_shader, f_shader, program,
      args = Array.prototype.slice.call(arguments),
      callback = (typeof args[args.length-1] === 'function') ? args.pop() : null,
      canvas = (glaze.canvas) ? glaze.canvas : null,
      gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl;

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
    v_shader = glaze.loadShader.call(gl, v_element, gl.VERTEX_SHADER);
  }
  if (f_element) {
    f_shader = glaze.loadShader.call(gl, f_element, gl.FRAGMENT_SHADER);
  }
  
  if (v_shader && f_shader) {
    program = glaze.createProgram.call(gl, v_shader, f_shader);
    if (typeof callback === 'function') {
      callback.call(canvas, program);
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
    glaze.loadShader.call(gl, urls.vertex, gl.VERTEX_SHADER, function (shader) {
      if (f_shader) {
        callback.call(canvas, glaze.createProgram.call(gl, shader, f_shader));
      } else {
        v_shader = shader;
      }
    });
  }
  if (!f_shader) {
    glaze.loadShader.call(gl, urls.fragment, gl.FRAGMENT_SHADER, function (shader) {
      if (v_shader) {
        callback.call(canvas, glaze.createProgram.call(gl, v_shader, shader));
      } else {
        f_shader = shader;
      }
    });
  }
};

/**
 * @param {WebGLProgram}  program
 * @param {string}        name
 * @this {WebGLRenderingContext}
 * return {number}                Location index.
 */
glaze.createAttribute = function (program, name /*, gl*/) {
  var attrib,
      gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl;
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
 * @this {WebGLRenderingContext}
 * return {WebGLUniformLocation}
 */
glaze.createUniform = function (program, name) {
  var gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl;
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
