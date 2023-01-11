class Vector2 {
  constructor(public x: number, public y: number) {}

  add(v: Vector2) {
    return new Vector2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vector2) {
    return new Vector2(this.x - v.x, this.y - v.y)
  }

  mul(v: Vector2) {
    return new Vector2(this.x * v.x, this.y * v.y)
  }

  div(v: Vector2) {
    return new Vector2(this.x / v.x, this.y / v.y)
  }

  addScalar(s: number) {
    return new Vector2(this.x + s, this.y + s)
  }

  subScalar(s: number) {
    return new Vector2(this.x - s, this.y - s)
  }

  mulScalar(s: number) {
    return new Vector2(this.x * s, this.y * s)
  }

  divScalar(s: number) {
    return new Vector2(this.x / s, this.y / s)
  }

  addFrom(v: Vector2) {
    this.x += v.x
    this.y += v.y
    return this
  }

  subFrom(v: Vector2) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  mutFrom(v: Vector2) {
    this.x *= v.x
    this.y *= v.y
    return this
  }
  divFrom(v: Vector2) {
    this.x /= v.x
    this.y /= v.y
    return this
  }

  addScalarFrom(s: number) {
    this.x += s
    this.y += s
    return this
  }

  subScalarFrom(s: number) {
    this.x -= s
    this.y -= s
    return this
  }

  mutScalarFrom(s: number) {
    this.x *= s
    this.y *= s
    return this
  }

  divScalarFrom(s: number) {
    this.x /= s
    this.y /= s
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y
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

  dot(v: Vector2) {
    return this.x * v.x + this.y * v.y
  }

  transpose() {
    return new Vector2(this.y, this.x)
  }

  rotate(angle: number) {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return new Vector2(
      this.x * c - this.y * s,
      this.x * s + this.y * c
    )
  }

  angle() {
    return Math.atan2(this.y, this.x)
  }

  angleTo(v: Vector2) {
    return Math.acos(this.normalized().dot(v.normalized()))
  }

  distanceTo(v: Vector2) {
    return this.sub(v).length()
  }

  distanceToSq(v: Vector2) {
    return this.sub(v).lengthSq()
  }

  lerp(v: Vector2, t: number) {
    return this.add(v.sub(this).mulScalar(t))
  }
}

export default Vector2
