glaze.ready('#display', function () {
  var viewport_w = this.width,
      viewport_h = this.height;
  
  /* load the vertex/fragment shaders
   * create the program object
   * link the program
   */
  glaze.loadProgram({vertex:'shader.vert', fragment:'shader.frag'}, function (program) {
    var vPosition, vVertices;

    //bind vPosition to attribute 0
    vPosition = glaze.createAttribute(program, 'vPosition');
    //create buffer to hold triangle position
    vVertices = glaze.createBuffer([ 0.0,  0.5,  0.0,
                                    -0.5, -0.5,  0.0,
                                     0.5, -0.5,  0.0]);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //start the animation
    glaze.animate(draw, viewport_w, viewport_h, program, vVertices);
  });
});

function draw (width, height, program, vertices) {
  //set the viewport
  gl.viewport(0, 0, width, height);
  //clear the color buffer
  gl.clear(gl.COLOR_BUFFER_BIT);
  //use the program object
  gl.useProgram(program);
  //load the vertex data
  gl.vertexAttribPointer(vertices, 3, gl.FLOAT, false, 0, vertices);
  gl.enableVertexAttribArray(vertices);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
