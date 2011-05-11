/*jslint browser: true, devel: true, onevar: true, undef: true, regexp: true, bitwise: true, newcap: true*/
/*globals gl, gland*/
if (typeof window.requestAnimationFrame !== 'function') {
  window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.oRequestAnimationFrame ||
                                 window.msRequestAnimationFrame ||
                                 function (callback, element) {
                                   window.setTimeout(callback, 1000/60);
                                 };
}
