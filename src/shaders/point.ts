const vertexShader = /* glsl */ `

void main()
{

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  gl_PointSize = 20.0;
}
`

const fragmentShader = /* glsl */ `
void main()
{
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));

  gl_FragColor = vec4(1.0, 1.0, 1.0, step(dist, 0.5));
}
`

const shader = {
  vertex: vertexShader,
  fragment: fragmentShader,
}

export default shader
