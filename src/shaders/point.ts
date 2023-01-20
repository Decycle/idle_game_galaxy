const vertexShader = /* glsl */ `

uniform float uSize;
attribute float mass;
varying float vMass;

const float maxDistance = 100.0;
const float scale = 10.0;

void main()
{

  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

  gl_PointSize = uSize * pow(mass, 1.0 / 3.0);

  // bool isPerspective = (projectionMatrix[2][3] == -1.);
	// if (isPerspective) gl_PointSize *= ( scale / - log2(mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
  // gl_PointSize = 10.;

  vMass = mass;
}
`

const fragmentShader = /* glsl */ `

varying float vMass;

//random number generator
float rand(vec2 co)
{
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 randomColor(vec2 co)
{
  float r = rand(co + 0.0);
  float g = rand(co + 1.0);
  float b = rand(co + 2.0);

  return vec3(r, g, b);
}

void main()
{
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
  if (dist > 0.5) discard;

  vec3 color = randomColor(vec2(vMass, 0.0));

  if (dist > 0.4) {
    gl_FragColor = vec4(vec3(0.), 1.0);
  }
  else {
    gl_FragColor = vec4(1., 1., 0.7, 1.0);
  }
}
`

const shader = {
  vertex: vertexShader,
  fragment: fragmentShader,
}

export default shader
