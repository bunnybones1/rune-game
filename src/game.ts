import { physics } from "propel-js"
import { PlayerId } from "rune-sdk"
import { destroyJointsOfBodies } from "./utils/physicsUtils"

const MAX_VELOCITY: number = 10000
const CAR_ACCEL: number = 5000

export type CarIds = {
  body: number
}

export type WorldIds = Record<PlayerId, CarIds>

// jointed car
export function worldInit(): { world: physics.World; ids: WorldIds } {
  const world = physics.createWorld({ x: 0, y: 0 })
  world.damp = 0.99
  world.angularDamp = 0.99
  const friction = 1

  const rect = physics.createRectangle(
    world,
    { x: 250, y: 458 },
    400,
    50,
    0,
    friction,
    0
  )
  physics.addBody(world, rect)
  for (let i = 1; i < 50; i++) {
    const rect = physics.createRectangle(
      world,
      { x: 250 + i * 390, y: 420 },
      400,
      50,
      0,
      friction,
      0
    )
    physics.addBody(world, rect)

    physics.rotateBody(rect, i % 2 === 0 ? 0.2 : -0.2)
  }
  return {
    world,
    ids: {},
  }
}

export function playerInteractiveInit(
  world: physics.World,
  startX: number
): CarIds {
  const base = physics.createCircleShape(world, { x: 0, y: 0 }, 30)
  const body = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [
    base,
  ]) as physics.DynamicRigidBody

  physics.addBody(world, body)
  physics.moveBody(body, { x: startX, y: 0 })

  return {
    body: body.id,
  }
}

export function fireProjectile(
  world: physics.World,
  startX: number,
  startY: number,
  vecX: number,
  vecY: number
) {
  const base = physics.createCircleShape(world, { x: 0, y: 0 }, 3)
  const projectile = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [
    base,
  ]) as physics.DynamicRigidBody

  physics.addBody(world, projectile)
  physics.moveBody(projectile, { x: startX, y: startY })
  projectile.velocity = { x: vecX, y: vecY }
  projectile.data = { expiry: world.frameCount + 20 }
  return projectile
}

export function playerInteractiveUpdate(
  x: number,
  y: number,
  world: physics.World,
  ids: CarIds
) {
  const body = world.dynamicBodies.find((b) => b.id === ids.body)
  if (!body) {
    throw new Error("Can't find body body")
  }
  body.restingTime = 0

  const delta = 1 / 60

  body.velocity.x *= 0.75
  body.velocity.y *= 0.75
  body.angularVelocity *= 0.75

  if (x < 0) {
    body.velocity.x = Math.max(
      -MAX_VELOCITY,
      body.velocity.x - CAR_ACCEL * delta
    )
  } else if (x > 0) {
    body.velocity.x = Math.min(
      MAX_VELOCITY,
      body.velocity.x + CAR_ACCEL * delta
    )
  }

  if (y < 0) {
    body.velocity.y = Math.max(
      -MAX_VELOCITY,
      body.velocity.y + CAR_ACCEL * delta
    )
  } else if (y > 0) {
    body.velocity.y = Math.min(
      MAX_VELOCITY,
      body.velocity.y - CAR_ACCEL * delta
    )
  }

  if (body.velMag > 0.1 && (x !== 0 || y !== 0)) {
    const angle = Math.atan2(-y, x)
    let targetAngle = angle - Math.PI * 0.5
    const td = targetAngle - body.angle
    if (td < -Math.PI) {
      targetAngle += Math.PI * 2
    } else if (td > Math.PI) {
      targetAngle -= Math.PI * 2
    }
    body.angle -= (body.angle - targetAngle) * delta * 20
  }

  if (world.frameCount % 2 === 0) {
    const pa = body.angle + Math.PI * 0.5
    const vx = Math.cos(pa)
    const vy = Math.sin(pa)
    const projectile = fireProjectile(
      world,
      body.center.x,
      body.center.y,
      vx * 1000,
      vy * 1000
    )
    physics.excludeCollisions(world, body, projectile)
  }

  return body
}

export function playerInteractiveRemove(world: physics.World, ids: CarIds) {
  const body = world.dynamicBodies.find((b) => b.id === ids.body)
  if (!body) {
    throw new Error("Can't find body body")
  }
  physics.removeBody(world, body)
  const bodies = [body.id]
  destroyJointsOfBodies(world, bodies)
}
