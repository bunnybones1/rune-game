import { physics } from "propel-js"

export function destroyJointsOfBodies(world: physics.World, bodyIds: number[]) {
  const joints = world.joints
  for (let i = joints.length - 1; i >= 0; i--) {
    const joint = joints[i]
    let rem = false
    for (const body of bodyIds) {
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
