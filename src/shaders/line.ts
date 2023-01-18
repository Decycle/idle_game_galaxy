const vertexShader = /* glsl */ `

attribute float tension;
varying float vTension;

void main()
{
    /**
     * Position
     */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vTension = tension;
}
`

const fragmentShader = /* glsl */ `

varying float vTension;

void main()
{
    vec3 blue = vec3(0.0, 0.0, 1.0);
    vec3 green = vec3(0.0, 1.0, 0.0);
    vec3 red = vec3(1.0, 0.0, 0.0);

    vec3 color;

    float k = vTension * 3. - 2.;

    if (k < 1.0) {
      color = mix(red, green, k);
    }
    else {
      color = mix(red, green, 2. - k);
    }
    // vec3 color = red;

    gl_FragColor = vec4(color, 1.0);
}
`

const shader = {
  vertex: vertexShader,
  fragment: fragmentShader,
}

export default shader
