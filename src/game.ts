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
  // const friction = 1

  // const rect = physics.createRectangle(
  //   world,
  //   { x: 250, y: 458 },
  //   400,
  //   50,
  //   0,
  //   friction,
  //   0
  // )
  // physics.addBody(world, rect)
  // for (let i = 1; i < 5; i++) {
  //   const rect = physics.createRectangle(
  //     world,
  //     { x: 250 + i * 390, y: 420 },
  //     400,
  //     50,
  //     0,
  //     friction,
  //     0
  //   )
  //   physics.addBody(world, rect)

  //   physics.rotateBody(rect, i % 2 === 0 ? 0.2 : -0.2)
  // }

  // dropSeed(world, 40, -320)
  plantTree(world, 40, -320, true)
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
  const body = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [base])

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
  vecY: number,
  originId: number
) {
  const base = physics.createCircleShape(world, { x: 0, y: 0 }, 3)
  const projectile = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [
    base,
  ]) as physics.DynamicRigidBody

  physics.addBody(world, projectile)
  physics.moveBody(projectile, { x: startX, y: startY })
  projectile.velocity = { x: vecX, y: vecY }
  projectile.data = { expiry: world.frameCount + 20, originId }
  return projectile
}

export function dropSeed(world: physics.World, x: number, y: number) {
  const base = physics.createCircleShape(world, { x: 0, y: 0 }, 50, true)
  const seed = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [base])
  // seed.static = true

  physics.addBody(world, seed)
  physics.moveBody(seed, { x: x, y: y })
  seed.data = { isSeed: true }
  return seed as physics.DynamicRigidBody
}

export function dropSpaceProbe(
  world: physics.World,
  x: number,
  y: number,
  radius: number
) {
  const base = physics.createCircleShape(world, { x: 0, y: 0 }, radius, true)
  const spaceProbe = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [
    base,
  ])
  // seed.static = true

  physics.addBody(world, spaceProbe)
  physics.moveBody(spaceProbe, { x: x, y: y })
  spaceProbe.data = { isSpaceProbe: true }
  return spaceProbe as physics.DynamicRigidBody
}

export function plantTree(
  world: physics.World,
  x: number,
  y: number,
  superSpreader: boolean
) {
  const base = physics.createCircleShape(world, { x: 0, y: 0 }, 4, false)
  const tree = physics.createRigidBody(world, { x: 0, y: 0 }, 1, 1, 0, [base])
  tree.static = true
  physics.addBody(world, tree)
  physics.moveBody(tree, { x: x, y: y })
  tree.data = {
    isTree: true,
    seedTime:
      world.frameCount + (superSpreader ? 1 : ~~(Math.random() * 200) + 200),
    growTime:
      world.frameCount + (superSpreader ? 1 : ~~(Math.random() * 50) + 50),
    // world.frameCount + 30,
  }
  return tree
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
    const targetAngle = angle - Math.PI * 0.5
    let angleDiff = targetAngle - body.angle
    if (angleDiff < -Math.PI) {
      angleDiff += Math.PI * 2
    } else if (angleDiff > Math.PI) {
      angleDiff -= Math.PI * 2
    }
    body.angle -= -angleDiff * delta * 20
    if (body.angle < -Math.PI) {
      body.angle += Math.PI * 2
    } else if (body.angle > Math.PI) {
      body.angle -= Math.PI * 2
    }
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
      vy * 1000,
      body.id
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
