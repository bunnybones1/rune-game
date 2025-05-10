import { physics } from "propel-js"
import { WorldIds } from "./game"

const canvas = document.getElementById("render") as HTMLCanvasElement
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
canvas.width = window.innerWidth
canvas.height = window.innerHeight

let up = false
let down = false
let left = false
let right = false
let x = 0
let y = 0
let lastSent = { x: 0, y: 0 }
let lastSentTime = Date.now()

function updateXY() {
  x = 0
  if (left) {
    x -= 1
  }
  if (right) {
    x += 1
  }
  y = 0
  if (up) {
    y += 1
  }
  if (down) {
    y -= 1
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    left = true
  }
  if (e.key === "d" || e.key === "ArrowRight") {
    right = true
  }
  if (e.key === "w" || e.key === "ArrowUp") {
    up = true
  }
  if (e.key === "s" || e.key === "ArrowDown") {
    down = true
  }
  updateXY()
})

window.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    left = false
  }
  if (e.key === "d" || e.key === "ArrowRight") {
    right = false
  }
  if (e.key === "w" || e.key === "ArrowUp") {
    up = false
  }
  if (e.key === "s" || e.key === "ArrowDown") {
    down = false
  }
  updateXY()
})

function updatePointerXY(px: number, py: number) {
  const isLeft = px < window.innerWidth * 0.5
  const isUp = py < window.innerHeight * 0.5
  left = isLeft
  right = !isLeft
  up = isUp
  down = !isUp
  updateXY()
}

let isPointerDown = false

canvas.addEventListener("pointerdown", (ev) => {
  isPointerDown = true
  updatePointerXY(ev.clientX, ev.clientY)
})

canvas.addEventListener("pointermove", (ev) => {
  if (isPointerDown) {
    updatePointerXY(ev.clientX, ev.clientY)
  }
})

canvas.addEventListener("pointerup", (ev) => {
  void ev
  left = false
  right = false
  up = false
  down = false
  updateXY()
  isPointerDown = false
})

let world: physics.World
let ids: WorldIds
let playerId: string | undefined

function render() {
  requestAnimationFrame(render)

  if (Date.now() - lastSentTime > 100) {
    if (lastSent.x !== x || lastSent.y !== y) {
      Rune.actions.controls({ x, y })
      lastSent = { x, y }
      lastSentTime = Date.now()
    }
  }
  if (!world || !ids) {
    return
  }
  ctx.reset()
  ctx.resetTransform()
  ctx.lineWidth = 3

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  ctx.fillStyle = "rgba(30,0,80,1)"
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

  const focusBody = world.dynamicBodies.find(
    (b) => b.id === ids[playerId!].chassis
  )
  if (focusBody) {
    ctx.translate(
      -(focusBody.center.x - window.innerWidth * 0.5),
      -(focusBody.center.y - window.innerHeight * 0.5)
    )
  }
  const bodies = physics.allBodies(world)
  for (const joint of world.joints) {
    ctx.strokeStyle = "yellow"

    const bodyA = bodies.find((b) => b.id === joint.bodyA)!
    const centerA = joint.shapeA
      ? bodyA.shapes.find((s) => s.id === joint.shapeA)!.center
      : bodyA.center
    const bodyB = bodies.find((b) => b.id === joint.bodyB)!
    const centerB = joint.shapeB
      ? bodyB.shapes.find((s) => s.id === joint.shapeB)!.center
      : bodyB.center
    ctx.beginPath()
    ctx.moveTo(centerA.x, centerA.y)
    ctx.lineTo(centerB.x, centerB.y)
    ctx.stroke()
  }
  for (const body of bodies.sort(
    (a, b) => (a.static ? 0 : 1) - (b.static ? 0 : 1)
  )) {
    for (const shape of body.shapes) {
      ctx.strokeStyle = "white"
      ctx.setLineDash([])
      if (body.static) {
        ctx.strokeStyle = "grey"
      } else if (
        (body as physics.DynamicRigidBody).restingTime > world.restTime
      ) {
        ctx.strokeStyle = "green"
      }

      if (shape.sensor) {
        ctx.strokeStyle = "yellow"
        ctx.setLineDash([5, 3])
      }
      if (shape.type === physics.ShapeType.CIRCLE) {
        ctx.save()
        ctx.translate(shape.center.x, shape.center.y)
        ctx.rotate(body.angle)

        ctx.beginPath()
        ctx.arc(0, 0, shape.bounds, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, shape.bounds)
        ctx.stroke()

        if (shape.sensor && shape.sensorColliding) {
          ctx.fillStyle = "rgba(255,255,0,0.7)"
          ctx.beginPath()
          ctx.arc(0, 0, shape.bounds, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "yellow"
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(0, shape.bounds)
          ctx.fill()
        }

        ctx.restore()
      }
      if (shape.type === physics.ShapeType.RECTANGLE) {
        ctx.fillStyle = "rgba(255,255,0,0.7)"
        ctx.save()
        ctx.translate(shape.center.x, shape.center.y)
        ctx.rotate(body.angle + shape.angle)
        ctx.strokeRect(
          -shape.width / 2,
          -shape.height / 2,
          shape.width,
          shape.height
        )

        if (shape.sensor && shape.sensorColliding) {
          ctx.fillRect(
            -shape.width / 2,
            -shape.height / 2,
            shape.width,
            shape.height
          )
        }
        ctx.restore()
      }
    }

    if (!body.static) {
      const dynamic = body as physics.DynamicRigidBody
      ctx.fillStyle = "blue"
      ctx.beginPath()
      ctx.arc(
        dynamic.centerOfPhysics.x,
        dynamic.centerOfPhysics.y,
        2,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
    ctx.fillStyle = "red"
    ctx.beginPath()
    ctx.arc(body.center.x, body.center.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

requestAnimationFrame(render)

Rune.initClient({
  onChange: (ctx) => {
    world = ctx.game.world
    ids = ctx.game.ids
    playerId = ctx.yourPlayerId
  },
})
