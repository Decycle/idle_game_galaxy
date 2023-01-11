const vertexShader = /* glsl */ `
  attribute vec3 aVertexPosition;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0);
  }
`

const shader = {
  vertex: vertexShader,
  fragment: fragmentShader,
}

export default shader
