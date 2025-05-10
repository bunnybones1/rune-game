import type { PlayerId, RuneClient } from "rune-sdk"
import { physics } from "propel-js"
import {
  playerInteractiveInit,
  playerInteractiveRemove,
  playerInteractiveUpdate,
  WorldIds,
  worldInit,
} from "./game"

export type Cells = (PlayerId | null)[]
export interface GameState {
  world: physics.World
  ids: WorldIds
  inputs: Record<PlayerId, { x: number; y: number }>
}

type GameActions = {
  controls: (inputs: { x: number; y: number }) => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 4,
  updatesPerSecond: 30,
  update: (ctx) => {
    const game = ctx.game
    physics.worldStep(30, game.world)
    for (const body of physics.allBodies(game.world)) {
      if (body.data?.expiry === game.world.frameCount) {
        physics.removeBody(game.world, body)
      }
    }
    for (const playerId of ctx.allPlayerIds) {
      playerInteractiveUpdate(
        game.inputs[playerId].x,
        game.inputs[playerId].y,
        game.world,
        game.ids[playerId]
      )
    }
  },
  reactive: false,
  setup: (allPlayerIds) => {
    const data = worldInit()

    const inputs: Record<PlayerId, { x: number; y: number }> = {}

    for (const [idx, playerId] of allPlayerIds.entries()) {
      void idx
      inputs[playerId] = { x: 0, y: 0 }
      data.ids[playerId] = playerInteractiveInit(data.world, idx * 100)
    }
    return {
      world: data.world,
      ids: data.ids,
      inputs,
      playerIds: allPlayerIds,
    }
  },
  actions: {
    controls: (inputs, ctx) => {
      ctx.game.inputs[ctx.playerId] = { ...inputs }
    },
  },
  events: {
    playerLeft(playerId, { game }) {
      playerInteractiveRemove(game.world, game.ids[playerId])
      delete game.inputs[playerId]
      delete game.ids[playerId]
    },
    playerJoined(playerId, ctx) {
      ctx.game.inputs[playerId] = { x: 0, y: 0 }
      ctx.game.ids[playerId] = playerInteractiveInit(
        ctx.game.world,
        ctx.allPlayerIds.indexOf(playerId) * 100
      )
    },
  },
})
