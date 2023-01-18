import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './App.css'

import pointShader from './shaders/point'
import lineShader from './shaders/line'
import { Canvas } from '@react-three/fiber'
import { IUniform, Vector3 } from 'three'
import { button, useControls } from 'leva'
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei'

type Uniforms = {
  [uniform: string]: IUniform<any>
}

const PointMaterial = ({
  uniforms,
}: {
  uniforms?: Uniforms
}) => {
  return (
    <shaderMaterial
      attach='material'
      fragmentShader={pointShader.fragment}
      vertexShader={pointShader.vertex}
      uniforms={uniforms}
    />
  )
}

interface MeshProps {
  vertices: Float32Array
  uniforms?: Uniforms
}

interface PointMeshProps extends MeshProps {
  vertexCount: number
  size?: Float32Array
}

const PointMesh = forwardRef<
  THREE.BufferGeometry,
  PointMeshProps
>(
  (
    { vertices, uniforms, vertexCount }: PointMeshProps,
    ref
  ) => {
    return (
      <points>
        <bufferGeometry ref={ref}>
          <bufferAttribute
            attach='attributes-position'
            array={vertices}
            itemSize={3}
            count={vertexCount}
          />
        </bufferGeometry>
        <PointMaterial uniforms={uniforms} />
      </points>
    )
  }
)

const LineMaterial = ({
  uniforms,
}: {
  uniforms?: Uniforms
}) => {
  return (
    <shaderMaterial
      attach='material'
      fragmentShader={lineShader.fragment}
      vertexShader={lineShader.vertex}
      uniforms={uniforms}
    />
  )
}

interface LineMeshProps extends MeshProps {
  lineCount: number
  tensions: Float32Array
}

const LineMesh = forwardRef<
  THREE.BufferGeometry,
  LineMeshProps
>(
  (
    {
      vertices,
      tensions,
      uniforms,
      lineCount,
    }: LineMeshProps,
    ref
  ) => {
    return (
      <lineSegments>
        <bufferGeometry ref={ref}>
          <bufferAttribute
            attach='attributes-position'
            array={vertices}
            itemSize={3}
            count={lineCount * 2}
          />
          <bufferAttribute
            attach='attributes-tension'
            array={tensions}
            itemSize={1}
            count={lineCount * 2}
          />
        </bufferGeometry>
        <LineMaterial uniforms={uniforms} />
      </lineSegments>
    )
  }
)

const getVector3 = (array: Float32Array, index: number) => {
  return new Vector3(
    array[index * 3],
    array[index * 3 + 1],
    array[index * 3 + 2]
  )
}

const updateVector3 = (
  array: Float32Array,
  index: number,
  newVector: Vector3
) => {
  array[index * 3] = newVector.x
  array[index * 3 + 1] = newVector.y
  array[index * 3 + 2] = newVector.z
}

const addVector3 = (
  array: Float32Array,
  index: number,
  newVector: Vector3
) => {
  array[index * 3] += newVector.x
  array[index * 3 + 1] += newVector.y
  array[index * 3 + 2] += newVector.z
}

const GameCanvas = () => {
  const pointsRef = useRef<THREE.BufferGeometry>(null)
  const linesRef = useRef<THREE.BufferGeometry>(null)

  const [pointCount, setPointCount] = useState(2)
  const [lineCount, setLineCount] = useState(1)

  const maxPointCount = 100
  const maxLineCount = 1000

  const vertices = useRef(
    new Float32Array(maxPointCount * 3)
  )

  vertices.current[0] = 0
  vertices.current[1] = 0
  vertices.current[2] = 0

  vertices.current[3] = 1
  vertices.current[4] = 1
  vertices.current[5] = 0

  //change ref name
  const verticesVel = useRef(
    new Float32Array(maxPointCount * 3)
  )
  const verticesAcc = useRef(
    new Float32Array(maxPointCount * 3)
  )

  const lineIndex = useRef(
    new Uint16Array(maxLineCount * 2)
  )

  lineIndex.current[0] = 0
  lineIndex.current[1] = 1

  const lines = useRef(
    new Float32Array(maxLineCount * 2 * 3)
  )

  const tensions = useRef(
    new Float32Array(maxLineCount * 2)
  )

  const springRestLength = 3
  const springStiffness = 2
  const springDamping = 0.5

  const update = useCallback(() => {
    //update all connected vertices's acceleration
    for (let i = 0; i < lineCount * 2; i += 2) {
      const index1 = lineIndex.current[i]
      const index2 = lineIndex.current[i + 1]

      const vertex1 = getVector3(vertices.current, index1)
      const vertex2 = getVector3(vertices.current, index2)

      const vertex1Vel = getVector3(
        verticesVel.current,
        index1
      )
      const vertex2Vel = getVector3(
        verticesVel.current,
        index2
      )

      const distance = vertex1.distanceTo(vertex2)
      const direction = vertex1
        .clone()
        .sub(vertex2)
        .normalize()

      const springForce = direction
        .clone()
        .multiplyScalar(
          (distance - springRestLength) * springStiffness
        )

      const dampingForce1 = vertex1Vel
        .clone()
        .multiplyScalar(-springDamping)

      const dampingForce2 = vertex2Vel
        .clone()
        .multiplyScalar(-springDamping)

      const vertex1Force = springForce
        .clone()
        .negate()
        .add(dampingForce1)
      const vertex2Force = springForce
        .clone()
        .add(dampingForce2)

      addVector3(verticesAcc.current, index1, vertex1Force)
      addVector3(verticesAcc.current, index2, vertex2Force)
    }

    //update velocity and position
    for (let i = 0; i < pointCount * 3; i++) {
      verticesVel.current[i] += verticesAcc.current[i] / 60
      vertices.current[i] += verticesVel.current[i] / 60

      verticesAcc.current[i] = 0
    }

    for (let i = 0; i < lineCount * 2; i += 2) {
      const index1 = lineIndex.current[i]
      const index2 = lineIndex.current[i + 1]

      const vertex1 = getVector3(vertices.current, index1)
      const vertex2 = getVector3(vertices.current, index2)

      //update line
      updateVector3(lines.current, i, vertex1)
      updateVector3(lines.current, i + 1, vertex2)

      //update tension
      const distance = vertex1.distanceTo(vertex2)

      tensions.current[i] = distance / springRestLength
      tensions.current[i + 1] = distance / springRestLength

      // tensions.current[i] = 0
      // tensions.current[i + 1] = 0
    }

    if (pointsRef.current) {
      pointsRef.current.attributes.position.needsUpdate =
        true
    }

    if (linesRef.current) {
      linesRef.current.attributes.position.needsUpdate =
        true
      linesRef.current.attributes.tension.needsUpdate = true
    }
  }, [])

  const addPoint = () => {
    const index = pointCount * 3
    const x = Math.random() * 10 - 5
    const y = Math.random() * 10 - 5
    const z = Math.random() * 10 - 5

    vertices.current[index] = x
    vertices.current[index + 1] = y
    vertices.current[index + 2] = z

    setPointCount(pointCount + 1)
    console.log(pointCount)
  }

  useEffect(() => {
    // update()
    const id = setInterval(update, 1000 / 60)
    return () => {
      clearInterval(id)
    }
  }, [update])

  return (
    <Canvas>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 10]}
      />
      <OrbitControls />
      <LineMesh
        vertices={lines.current}
        tensions={tensions.current}
        lineCount={lineCount}
        ref={linesRef}
      />
      <PointMesh
        vertices={vertices.current}
        vertexCount={pointCount}
        ref={pointsRef}
      />
    </Canvas>
  )
}

const App = () => {
  const [pointCount, setPointCount] = useState(2)

  return (
    <div className='App'>
      <GameCanvas />
    </div>
  )
}

export default App
