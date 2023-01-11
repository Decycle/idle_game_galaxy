const vertexShader = /* glsl */ `
  attribute vec3 aVertexPosition;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    gl_PointSize = 10.0;
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  void main() {
    //make the point to a circle
    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));

    gl_FragColor = vec4(step(dist, 0.5) * vec3(1.) , 1.0);
  }
`

const shader = {
  vertex: vertexShader,
  fragment: fragmentShader,
}

export default shader
