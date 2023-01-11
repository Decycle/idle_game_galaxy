import Vector2 from './Vector2'

interface PhysicsProps {
  mass: number
  friction?: number
  bounce?: number
}

class Physics2D {
  constructor(
    public props: PhysicsProps,
    public position: Vector2,
    public velocity: Vector2 = new Vector2(0, 0),
    public acceleration: Vector2 = new Vector2(0, 0),
    public force: Vector2 = new Vector2(0, 0),
    public border: [number, number, number, number] = [
      0, 0, 1920, 1080,
    ]
  ) {}

  update(dt: number) {
    this.acceleration.addFrom(
      this.force.divScalar(this.props.mass).mulScalar(dt)
    )
    this.velocity.addFrom(this.acceleration.mulScalar(dt))
    this.position.addFrom(this.velocity.mulScalar(dt))

    if (this.position.x < this.border[0]) {
      this.position.x *= -1
      if (this.props.bounce) {
        this.velocity.x *= -this.props.bounce
      } else {
        this.velocity.x *= -1
      }
    }

    if (this.position.y < this.border[1]) {
      this.position.y *= -1
      if (this.props.bounce) {
        this.velocity.y *= -this.props.bounce
      } else {
        this.velocity.y *= -1
      }
    }

    if (this.position.x > this.border[2]) {
      this.position.x = this.border[2] * 2 - this.position.x
      if (this.props.bounce) {
        this.velocity.x *= -this.props.bounce
      } else {
        this.velocity.x *= -1
      }
    }

    if (this.position.y > this.border[3]) {
      this.position.y = this.border[3] * 2 - this.position.y
      if (this.props.bounce) {
        this.velocity.y *= -this.props.bounce
      } else {
        this.velocity.y *= -1
      }
    }

    this.force = new Vector2(0, 0)

    if (this.velocity.lengthSq() <= 0.0001) {
      this.velocity = new Vector2(0, 0)
    }
  }
}

export default Physics2D
