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
