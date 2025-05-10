import { physics } from "propel-js"
import { PlayerId } from "rune-sdk"

const MAX_VELOCITY: number = 10000
const CAR_ACCEL: number = 1000
const CAR_TILT: number = 2

export type CarIds = {
  chassis: number
  leftSensor: number
  rightSensor: number
  circle1: number
  circle2: number
}

export type WorldIds = Record<PlayerId, CarIds>

// jointed car
export function worldInit(): { world: physics.World; ids: WorldIds } {
  const world = physics.createWorld({ x: 0, y: 100 })
  world.damp = 0.99
  world.angularDamp = 0.95
  const friction = 1

  const rect = physics.createRectangle(
    world,
    { x: 250, y: 458 },
    400,
    30,
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
      30,
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

export function carInteractiveInit(world: physics.World): CarIds {
  const friction = 1

  const circle1 = physics.createCircle(
    world,
    { x: 150, y: 0 },
    15,
    3,
    friction,
    0
  ) as physics.DynamicRigidBody
  physics.addBody(world, circle1)
  const circle2 = physics.createCircle(
    world,
    { x: 190, y: 0 },
    15,
    3,
    friction,
    0
  ) as physics.DynamicRigidBody
  physics.addBody(world, circle2)

  const leftAnchor = physics.createCircleShape(world, { x: 150, y: 0 }, 3)
  const rightAnchor = physics.createCircleShape(world, { x: 190, y: 0 }, 3)

  // give them a bit of padding to consume the resolution of wheels against floor
  const leftSensor = physics.createCircleShape(
    world,
    { x: 150, y: 0 },
    16.5,
    true
  )
  const rightSensor = physics.createCircleShape(
    world,
    { x: 190, y: 0 },
    16.5,
    true
  )

  const base = physics.createRectangleShape(
    world,
    { x: 170, y: -25 },
    60,
    20,
    0
  )
  const chassis = physics.createRigidBody(
    world,
    { x: 170, y: 10 },
    1,
    friction,
    0,
    [base, leftAnchor, rightAnchor, leftSensor, rightSensor]
  ) as physics.DynamicRigidBody

  physics.addBody(world, chassis)
  physics.excludeCollisions(world, chassis, circle1)
  physics.excludeCollisions(world, chassis, circle2)
  physics.createJoint(world, circle1, leftSensor, 1, 0)
  physics.createJoint(world, circle2, rightSensor, 1, 0)

  return {
    chassis: chassis.id,
    leftSensor: leftSensor.id,
    rightSensor: rightSensor.id,
    circle1: circle1.id,
    circle2: circle2.id,
  }
}

export function carInteractiveUpdate(
  x: number,
  y: number,
  world: physics.World,
  ids: CarIds
) {
  const chassis = world.dynamicBodies.find((b) => b.id === ids.chassis)
  if (!chassis) {
    throw new Error("Can't find chassis body")
  }
  const circle1 = world.dynamicBodies.find((b) => b.id === ids.circle1)
  if (!circle1) {
    throw new Error("Can't find circle1 body")
  }
  const circle2 = world.dynamicBodies.find((b) => b.id === ids.circle2)
  if (!circle2) {
    throw new Error("Can't find circle2 body")
  }
  const leftSensor = chassis.shapes.find((s) => s.id === ids.leftSensor)
  if (!leftSensor) {
    throw new Error("Can't find leftSensor shape")
  }
  const rightSensor = chassis.shapes.find((s) => s.id === ids.rightSensor)
  if (!rightSensor) {
    throw new Error("Can't find leftSensor shape")
  }

  const isMidAir = !leftSensor.sensorColliding && !rightSensor.sensorColliding

  chassis.restingTime = 0
  circle1.restingTime = 0
  circle2.restingTime = 0

  const delta = 1 / 60

  // since we're sure the body is on the ground it ok to drive the chassis forward since it
  // gives uniform velocity to the wheels
  if (!isMidAir) {
    if (x < 0) {
      chassis.velocity.x = Math.max(
        -MAX_VELOCITY,
        chassis.velocity.x - CAR_ACCEL * delta
      )
    }
    if (x > 0) {
      chassis.velocity.x = Math.min(
        MAX_VELOCITY,
        chassis.velocity.x + CAR_ACCEL * delta
      )
    }
  }

  // if we've been off the ground for a bit then allow explicitly tilting the car. Note that
  // this is totally non-physical so we're giving the player direct control of the car's angle
  // and want to ignore any other velocity/acceleration on it
  if (isMidAir) {
    if (x < 0) {
      physics.rotateBody(chassis, -CAR_TILT * delta)
      chassis.angularVelocity = 0
    }
    if (x > 0) {
      physics.rotateBody(chassis, CAR_TILT * delta)
      chassis.angularVelocity = 0
    }
  }

  return chassis
}

export function carInteractiveRemove(world: physics.World, ids: CarIds) {
  const chassis = world.dynamicBodies.find((b) => b.id === ids.chassis)
  if (!chassis) {
    throw new Error("Can't find chassis body")
  }
  const circle1 = world.dynamicBodies.find((b) => b.id === ids.circle1)
  if (!circle1) {
    throw new Error("Can't find circle1 body")
  }
  const circle2 = world.dynamicBodies.find((b) => b.id === ids.circle2)
  if (!circle2) {
    throw new Error("Can't find circle2 body")
  }
  physics.removeBody(world, chassis)
  physics.removeBody(world, circle1)
  physics.removeBody(world, circle2)
  const bodies = [chassis.id, circle1.id, circle2.id]
  const joints = world.joints
  for (let i = joints.length - 1; i >= 0; i--) {
    const joint = joints[i]
    let rem = false
    for (const body of bodies) {
      if (joint.bodyA === body || joint.bodyB === body) {
        rem = true
        break
      }
    }
    if (rem) {
      joints.splice(i, 1)
    }
  }
}
