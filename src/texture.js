/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, glaze*/

/**
 * @param {Image} image
 * @param {number=} format  default: gl.RGBA [gl.RGB|gl.ALPHA|gl.LUMINANCE|gl.LUMINANCE_ALPHA]
 * @this {WebGLRenderingContext}
 * @return {WebGLTexture}
 */
glaze.createTexture = function (image, format) {
  var gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl,
      texture = gl.createTexture(),
      format = (format === undefined) ? gl.RGBA : format;
  
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
 * @this {WebGLRenderingContext}
 */
glaze.loadTexture = function (location, callback) {
  var image,
      canvas = (glaze.canvas) ? glaze.canvas : null,
      gl = (this instanceof WebGLRenderingContext) ? this : glaze.gl;

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
    callback.call(canvas, glaze.createTexture.call(gl, image));
  } else {
    //if not, assign load handlers
    image.addEventListener('load', function () {
      callback.call(canvas, glaze.createTexture.call(gl, image));
    });
    image.addEventListener('error', load_image_error);
    image.addEventListener('abort', load_image_error);
  }
};
