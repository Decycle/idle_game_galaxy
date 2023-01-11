import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './App.css'

import Vector3 from './utils/Vector3'
import Physics3D from './utils/Physics3D'

import pointShader from './shaders/point'
import lineShader from './shaders/line'
import { mat4 } from 'gl-matrix'

const GraphCanvas = ({ clicks }: { clicks: Number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const points = useMemo(
    () => [
      new Physics3D(
        { mass: 1, bounce: 0.6 },
        new Vector3(300, 119, 150)
      ),
      new Physics3D(
        { mass: 1, bounce: 0.6 },
        new Vector3(420, 189, 200)
      ),
      new Physics3D(
        { mass: 1, bounce: 0.6 },
        new Vector3(420, 305, 350)
      ),
      new Physics3D(
        { mass: 1, bounce: 0.6 },
        new Vector3(800, 305, 500)
      ),
    ],
    []
  )

  const lines = useMemo(
    () => [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [1, 3],
      [0, 3],
    ],
    []
  )

  const relaxedLength = 300
  const stringConstant = 0.1

  const update = useCallback(() => {
    points.forEach((point) => {
      point.update(1 / 60)
    })

    lines.forEach((line) => {
      const point1 = points[line[0]]
      const point2 = points[line[1]]

      const dist = point1.position.distanceTo(
        point2.position
      )

      const force = (relaxedLength - dist) * stringConstant
      const dir = point1.position
        .sub(point2.position)
        .normalized()

      point1.force.addFrom(dir.mulScalar(force))
      point2.force.addFrom(dir.mulScalar(-force))

      console.log(force)
    })
  }, [points, lines])

  useEffect(() => {
    const id = setInterval(update, 1000 / 60)
    return () => clearInterval(id)
  }, [update])

  const drawPoint = (pos: Vector3) => {
    const z = pos.z / 100
    const depth = Math.min(Math.max(1 / z, 0), 1)

    // console.log(z)
    console.log(depth)

    return [pos.x * depth, pos.y * depth, depth]
  }

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      //clear canvas
      ctx.clearRect(0, 0, 1920, 1080)

      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'white'

      points.forEach((point) => {
        const circle = new Path2D()

        const [x, y, depth] = drawPoint(point.position)

        circle.arc(x, y, depth * 10, 0, 2 * Math.PI)
        ctx.fill(circle)
      })

      lines.forEach((line) => {
        const point1 = points[line[0]]
        const point2 = points[line[1]]

        const [x1, y1] = drawPoint(point1.position)
        const [x2, y2] = drawPoint(point2.position)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      requestAnimationFrame(() => draw(ctx))
    },
    [points, lines]
  )

  React.useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (context) {
      draw(context)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      height={1080}
      width={1920}></canvas>
  )
}

const loadShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type)

  if (shader) {
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader
    } else {
      console.error(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(
          shader
        )}`
      )
      gl.deleteShader(shader)
    }
  }
}

const initShaderProgram = (
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) => {
  const vertexShader = loadShader(
    gl,
    gl.VERTEX_SHADER,
    vsSource
  )
  const fragmentShader = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    fsSource
  )

  const shaderProgram = gl.createProgram()
  if (!vertexShader || !fragmentShader || !shaderProgram)
    return

  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (
    gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)
  ) {
    return shaderProgram
  } else {
    console.error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    )
  }
}

const initBuffers = (gl: WebGLRenderingContext) => {
  const pointPositionBuffer = gl.createBuffer()
  const linePositionBuffer = gl.createBuffer()

  const pointPositions = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0]
  const linePositions = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0]

  gl.bindBuffer(gl.ARRAY_BUFFER, pointPositionBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(pointPositions),
    gl.DYNAMIC_DRAW
  )

  gl.bindBuffer(gl.ARRAY_BUFFER, linePositionBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(linePositions),
    gl.DYNAMIC_DRAW
  )

  return {
    pointPosition: pointPositionBuffer,
    linePosition: linePositionBuffer,
  }
}

const WebGLCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const init = useCallback(
    (
      gl: WebGLRenderingContext,
      canvas: HTMLCanvasElement
    ) => {
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clearDepth(1.0)
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      const fieldOfView = (45 * Math.PI) / 180
      const aspect =
        canvas.clientWidth / canvas.clientHeight
      const zNear = 0.1
      const zFar = 100.0

      const projectionMatrix = mat4.create()

      mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
      )

      const modelViewMatrix = mat4.create()

      mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [0.0, 0.0, -6.0]
      )

      const pointShaderProgram = initShaderProgram(
        gl,
        pointShader.vertex,
        pointShader.fragment
      )

      if (!pointShaderProgram) return
      const pointProgramInfo = {
        program: pointShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(
            pointShaderProgram,
            'aVertexPosition'
          ),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(
            pointShaderProgram,
            'uProjectionMatrix'
          ),
          modelViewMatrix: gl.getUniformLocation(
            pointShaderProgram,
            'uModelViewMatrix'
          ),
        },
      }
      const lineShaderProgram = initShaderProgram(
        gl,
        lineShader.vertex,
        lineShader.fragment
      )

      if (!lineShaderProgram) return

      const lineProgramInfo = {
        program: lineShaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(
            lineShaderProgram,
            'aVertexPosition'
          ),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(
            lineShaderProgram,
            'uProjectionMatrix'
          ),
          modelViewMatrix: gl.getUniformLocation(
            lineShaderProgram,
            'uModelViewMatrix'
          ),
        },
      }

      const buffers = initBuffers(gl)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pointPosition)
      gl.vertexAttribPointer(
        pointProgramInfo.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        4 * 3, //or 0 => automatically calculate sizeof(Float) * 3
        0
      )
      gl.enableVertexAttribArray(
        pointProgramInfo.attribLocations.vertexPosition
      )

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.linePosition)
      gl.vertexAttribPointer(
        lineProgramInfo.attribLocations.vertexPosition,
        3,
        gl.FLOAT,
        false,
        4 * 3, //or 0 => automatically calculate sizeof(Float) * 3
        0
      )

      gl.enableVertexAttribArray(
        lineProgramInfo.attribLocations.vertexPosition
      )

      gl.useProgram(pointProgramInfo.program)
      gl.uniformMatrix4fv(
        pointProgramInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
      )

      gl.uniformMatrix4fv(
        pointProgramInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      )

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pointPosition)
      gl.drawArrays(gl.POINTS, 0, 2)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.linePosition)
      gl.useProgram(lineProgramInfo.program)

      gl.uniformMatrix4fv(
        lineProgramInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
      )

      gl.uniformMatrix4fv(
        lineProgramInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      )

      gl.drawArrays(gl.LINES, 0, 2)
    },
    []
  )

  const draw = useCallback((gl: WebGLRenderingContext) => {
    gl.drawArrays(gl.POINTS, 0, 2)
    const new_position = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0]
    // new_position[0] = Math.random()
    // new_position[1] = Math.random()
    // new_position[3] = Math.random()
    // new_position[4] = Math.random()
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      0,
      new Float32Array(new_position)
    )
    gl.drawArrays(gl.POINTS, 0, 2)
    requestAnimationFrame(() => draw(gl))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return
    init(gl, canvas)
    draw(gl)
  })

  return (
    <canvas
      ref={canvasRef}
      width={1440}
      height={720}></canvas>
  )
}

function App() {
  const [counter, setCounter] = useState(0)

  return (
    <div className='App'>
      <WebGLCanvas />
      <button
        className='click_button'
        onClick={() => setCounter(counter + 1)}>
        CLICK ME
        <svg
          className='click_button_icon'
          width='30'
          height='30'>
          <circle
            cx='15'
            cy='15'
            r='10'
            stroke='black'
            strokeWidth='1'
            fill='currentColor'
          />
        </svg>
      </button>
      {counter}
    </div>
  )
}

export default App
