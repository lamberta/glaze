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
