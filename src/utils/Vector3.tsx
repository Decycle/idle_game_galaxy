class Vector3 {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  add(v: Vector3) {
    return new Vector3(
      this.x + v.x,
      this.y + v.y,
      this.z + v.z
    )
  }

  sub(v: Vector3) {
    return new Vector3(
      this.x - v.x,
      this.y - v.y,
      this.z - v.z
    )
  }

  mul(v: Vector3) {
    return new Vector3(
      this.x * v.x,
      this.y * v.y,
      this.z * v.z
    )
  }

  div(v: Vector3) {
    return new Vector3(
      this.x / v.x,
      this.y / v.y,
      this.z / v.z
    )
  }

  addScalar(s: number) {
    return new Vector3(this.x + s, this.y + s, this.z + s)
  }

  subScalar(s: number) {
    return new Vector3(this.x - s, this.y - s, this.z - s)
  }

  mulScalar(s: number) {
    return new Vector3(this.x * s, this.y * s, this.z * s)
  }

  divScalar(s: number) {
    return new Vector3(this.x / s, this.y / s, this.z / s)
  }

  addFrom(v: Vector3) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }

  subFrom(v: Vector3) {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }

  mutFrom(v: Vector3) {
    this.x *= v.x
    this.y *= v.y
    this.z *= v.z
    return this
  }
  divFrom(v: Vector3) {
    this.x /= v.x
    this.y /= v.y
    this.z /= v.z
    return this
  }

  addScalarFrom(s: number) {
    this.x += s
    this.y += s
    this.z += s
    return this
  }

  subScalarFrom(s: number) {
    this.x -= s
    this.y -= s
    this.z -= s
    return this
  }

  mutScalarFrom(s: number) {
    this.x *= s
    this.y *= s
    this.z *= s
    return this
  }

  divScalarFrom(s: number) {
    this.x /= s
    this.y /= s
    this.z /= s
  }

  lengthSq() {
    return (
      this.x * this.x + this.y * this.y + this.z * this.z
    )
  }

  length() {
    return Math.sqrt(this.lengthSq())
  }

  normalized() {
    return this.divScalar(this.length())
  }

  normalize() {
    this.divScalarFrom(this.length())
  }

  dot(v: Vector3) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  distanceTo(v: Vector3) {
    return this.sub(v).length()
  }

  distanceToSq(v: Vector3) {
    return this.sub(v).lengthSq()
  }

  lerp(v: Vector3, t: number) {
    return this.add(v.sub(this).mulScalar(t))
  }

  cross(v: Vector3) {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    )
  }
}

export default Vector3
