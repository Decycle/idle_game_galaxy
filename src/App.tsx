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
import { Canvas, useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
} from '@react-three/postprocessing'
import { IUniform, Vector3 } from 'three'
import { button, useControls } from 'leva'
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei'

const MAX_POINT_COUNT = 1000
const MAX_LINE_COUNT = 1000

const LEAF: number = 3

type Uniforms = {
  [uniform: string]: IUniform<any>
}

const PointMaterial = ({
  uniforms,
}: {
  uniforms?: Uniforms
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useControls({
    size: {
      value: 3,
      min: 1,
      max: 10,
    },
  })

  useEffect(() => {
    if (materialRef.current) {
      console.log(size)
      materialRef.current.needsUpdate = true
    }
  }, [size])

  return (
    <shaderMaterial
      ref={materialRef}
      attach='material'
      fragmentShader={pointShader.fragment}
      vertexShader={pointShader.vertex}
      uniforms={{
        ...uniforms,
        uSize: { value: size },
      }}
    />
  )
}

interface MeshProps {
  vertices: Float32Array
  uniforms?: Uniforms
}

interface PointMeshProps extends MeshProps {
  vertexCount: number
  masses?: Float32Array
  onPointClick: (index: number) => void
}

const PointMesh = forwardRef<
  THREE.BufferGeometry,
  PointMeshProps
>(
  (
    {
      vertices,
      uniforms,
      vertexCount,
      masses,
      onPointClick,
    }: PointMeshProps,
    ref
  ) => {
    return (
      <points
        onClick={({ index }) => {
          if (index !== undefined) {
            onPointClick(index)
          }
        }}>
        <bufferGeometry ref={ref}>
          <bufferAttribute
            attach='attributes-position'
            array={vertices}
            itemSize={3}
            count={vertexCount}
          />
          <bufferAttribute
            attach='attributes-mass'
            array={masses}
            itemSize={1}
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

const setVector3 = (
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

interface GameSceneProps {
  vertices: React.MutableRefObject<Float32Array>
  verticesVel: React.MutableRefObject<Float32Array>
  verticesAcc: React.MutableRefObject<Float32Array>
  lineIndex: React.MutableRefObject<Uint16Array>
  lines: React.MutableRefObject<Float32Array>
  tensions: React.MutableRefObject<Float32Array>
  masses: React.MutableRefObject<Float32Array>
  pointCount: number
  lineCount: number
}

const GameScene = ({
  vertices,
  verticesVel,
  verticesAcc,
  lineIndex,
  lines,
  tensions,
  masses,
  pointCount,
  lineCount,
}: GameSceneProps) => {
  const pointsRef = useRef<THREE.BufferGeometry>(null)
  const linesRef = useRef<THREE.BufferGeometry>(null)

  const springRestLength = 3
  const springStiffness = 4
  const springDamping = 0.2

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

    //add repulsion force for nodes on the same level
    for (let i = 1; i < pointCount; i += 1) {
      const vertex1 = getVector3(vertices.current, i)

      const level =
        LEAF === 2
          ? Math.floor(Math.log2(i + 1))
          : Math.floor(
              Math.log(i * (LEAF - 1) + 1) / Math.log(LEAF)
            )

      const startIndex =
        LEAF === 2
          ? Math.pow(LEAF, level) - 1
          : (Math.pow(LEAF, level) - 1) / (LEAF - 1)
      const endIndex =
        LEAF === 2
          ? Math.pow(LEAF, level + 1) - 1
          : (Math.pow(LEAF, level + 1) - 1) / (LEAF - 1)

      for (let j = startIndex; j < endIndex; j++) {
        if (j === i) {
          continue
        }

        const vertex2 = getVector3(vertices.current, j)

        const distance = vertex1.distanceTo(vertex2)
        const direction = vertex1
          .clone()
          .sub(vertex2)
          .normalize()

        const repulsionForce = direction
          .clone()
          .divideScalar(Math.pow(distance, 2))

        addVector3(verticesAcc.current, i, repulsionForce)
      }
    }

    //add (reversed) gravity
    // for (let i = 0; i < pointCount * 3; i += 3) {
    //   const mass = masses.current[Math.floor(i / 3)]

    //   verticesAcc.current[i + 1] += (10 * mass) / 60
    //   verticesAcc.current[1] -= (10 * mass) / 60
    // }
    //update velocity and position
    for (let i = 0; i < pointCount; i++) {
      const mass = masses.current[i]
      addVector3(
        verticesVel.current,
        i,
        getVector3(verticesAcc.current, i).divideScalar(
          60 * mass
        )
      )
      addVector3(
        vertices.current,
        i,
        getVector3(verticesVel.current, i).divideScalar(60)
      )

      //reset acceleration
      setVector3(
        verticesAcc.current,
        i,
        new Vector3(0, 0, 0)
      )
    }

    for (let i = 0; i < lineCount * 2; i += 2) {
      const index1 = lineIndex.current[i]
      const index2 = lineIndex.current[i + 1]

      const vertex1 = getVector3(vertices.current, index1)
      const vertex2 = getVector3(vertices.current, index2)

      //update line
      setVector3(lines.current, i, vertex1)
      setVector3(lines.current, i + 1, vertex2)

      //update tension
      const distance = vertex1.distanceTo(vertex2)

      tensions.current[i] = distance / springRestLength
      tensions.current[i + 1] = distance / springRestLength
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
  }, [
    lineCount,
    pointCount,
    lineIndex,
    lines,
    tensions,
    vertices,
    verticesVel,
    verticesAcc,
    masses,
  ])

  // useControls({
  //   Update: button(update),
  //   Update1: button(() => {
  //     for (let i = 0; i < 60; i++) {
  //       update()
  //     }
  //   }),
  // })

  useEffect(() => {
    const id = setInterval(update, 1 / 60)
    return () => {
      clearInterval(id)
    }
  }, [update])

  const [currentViewIndex, setCurrentViewIndex] = useState<
    null | number
  >(null)

  const [lastViewIndex, setLastViewIndex] = useState<
    null | number
  >(null)

  const onPointClick = (index: number) => {
    setLastViewIndex(currentViewIndex)
    setCurrentViewIndex(index)
    // masses.current[index] = 1000

    if (pointsRef.current) {
      pointsRef.current.attributes.mass.needsUpdate = true
    }
  }

  const isLine = (index1: number, index2: number) => {
    for (let i = 0; i < lineCount * 2; i += 2) {
      const lineIndex1 = lineIndex.current[i]
      const lineIndex2 = lineIndex.current[i + 1]

      if (
        (lineIndex1 === index1 && lineIndex2 === index2) ||
        (lineIndex1 === index2 && lineIndex2 === index1)
      ) {
        return true
      }
    }

    return false
  }

  useFrame(({ camera }) => {
    // if (currentViewIndex !== null) {
    //   if (
    //     lastViewIndex === null ||
    //     (lastViewIndex !== null &&
    //       isLine(currentViewIndex, lastViewIndex))
    //   ) {
    //     const vertex = getVector3(
    //       vertices.current,
    //       currentViewIndex
    //     )
    //     camera.position.lerp(vertex, 0.01)
    //   }
    // }
  })

  return (
    <>
      <LineMesh
        vertices={lines.current}
        tensions={tensions.current}
        lineCount={lineCount}
        ref={linesRef}
      />
      <PointMesh
        vertices={vertices.current}
        masses={masses.current}
        vertexCount={pointCount}
        ref={pointsRef}
        onPointClick={onPointClick}
      />
    </>
  )
}

const App = () => {
  const [pointCount, setPointCount] = useState(2)
  const [lineCount, setLineCount] = useState(1)

  const vertices = useRef(
    new Float32Array(MAX_POINT_COUNT * 3)
  )

  //change ref name
  const verticesVel = useRef(
    new Float32Array(MAX_POINT_COUNT * 3)
  )
  const verticesAcc = useRef(
    new Float32Array(MAX_POINT_COUNT * 3)
  )

  const lineIndex = useRef(
    new Uint16Array(MAX_LINE_COUNT * 2)
  )

  const lines = useRef(
    new Float32Array(MAX_LINE_COUNT * 2 * 3)
  )

  const tensions = useRef(
    new Float32Array(MAX_LINE_COUNT * 2)
  )

  const masses = useRef(
    new Float32Array(MAX_POINT_COUNT).fill(1)
  )

  const springCoefficients = useRef(
    new Float32Array(MAX_LINE_COUNT * 2).fill(2)
  )

  const springRestLengths = useRef(
    new Float32Array(MAX_LINE_COUNT * 2).fill(1)
  )

  const [meta, setMeta] = useState(false)

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Meta') {
      setMeta(true)
    }
  })

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Meta') {
      setMeta(false)
    }
  })

  const addPoint = (count: number) => () => {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 10 - 5
      const y = Math.random() * 10 - 5
      const z = Math.random() * 10 - 5

      const currentPointIndex = pointCount + i

      setVector3(
        vertices.current,
        currentPointIndex,
        new Vector3(x, y, z)
      )

      const lineIndex1 = (lineCount + i) * 2
      const lineIndex2 = (lineCount + i) * 2 + 1

      const connectPointIndex = Math.floor(
        (currentPointIndex - 1) / LEAF
      )

      lineIndex.current[lineIndex1] = currentPointIndex
      lineIndex.current[lineIndex2] = connectPointIndex

      setVector3(
        lines.current,
        lineIndex1,
        getVector3(vertices.current, currentPointIndex)
      )

      setVector3(
        lines.current,
        lineIndex2,
        getVector3(vertices.current, connectPointIndex)
      )

      const level =
        LEAF === 2
          ? Math.floor(Math.log2(currentPointIndex + 1))
          : Math.floor(
              Math.log(currentPointIndex * (LEAF - 1) + 1) /
                Math.log(LEAF)
            )

      const mass =
        Math.pow(1 / LEAF, level) * masses.current[0]
      masses.current[currentPointIndex] = mass
    }
    setLineCount((prev) => prev + count)
    setPointCount((prev) => prev + count)
  }

  const init = () => {
    setVector3(vertices.current, 0, new Vector3(0, 0, 0))
    setVector3(vertices.current, 1, new Vector3(1, 1, 1))

    lineIndex.current[0] = 0
    lineIndex.current[1] = 1

    masses.current[0] = 1000
    masses.current[1] = 500
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className='App'>
      <button onClick={addPoint(100)}>
        add 100 points
      </button>
      <button onClick={addPoint(10)}>add 10 points</button>
      <button onClick={addPoint(1)}>add point</button>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 10]}
        />
        <OrbitControls enabled={!meta} />
        <GameScene
          vertices={vertices}
          verticesVel={verticesVel}
          verticesAcc={verticesAcc}
          lineIndex={lineIndex}
          lines={lines}
          tensions={tensions}
          masses={masses}
          pointCount={pointCount}
          lineCount={lineCount}
        />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            intensity={0.2}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export default App
