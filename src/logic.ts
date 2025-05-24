import type { PlayerId, RuneClient } from "rune-sdk";
import { physics } from "propel-js";
import {
  dropSeed,
  dropSpaceProbe,
  plantTree,
  playerInteractiveInit,
  playerInteractiveRemove,
  playerInteractiveUpdate,
  WorldIds,
  worldInit,
} from "./game";
import { includeCollisionsByIds } from "./utils/physicsUtils";

export type Cells = (PlayerId | null)[];
export interface GameState {
  world: physics.World;
  forestTime: number;
  ids: WorldIds;
  inputs: Record<PlayerId, { x: number; y: number }>;
}

type GameActions = {
  controls: (inputs: { x: number; y: number }) => void;
};

declare global {
  const Rune: RuneClient<GameState, GameActions>;
}

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 4,
  updatesPerSecond: 30,
  update: (ctx) => {
    const game = ctx.game;
    physics.worldStep(30, game.world);
    const growForest = game.forestTime > game.world.frameCount;
    for (const body of physics.allBodies(game.world)) {
      if (
        body.data?.seedTime === game.world.frameCount &&
        body.center.x < 500 &&
        body.center.x > -500 &&
        body.center.y < 500 &&
        body.center.y > -500
      ) {
        const a = Math.random() * Math.PI * 2;
        const l = Math.random() * 200 + 100;
        dropSeed(
          game.world,
          body.center.x + Math.cos(a) * l,
          body.center.y + Math.sin(a) * l,
        );
        body.data.seedTime += growForest ? 1 : ~~(Math.random() * 200) + 200;
      }

      if (body.data?.isSeed || body.data?.isTree) {
        physics.collidingWithStatic(
          game.world,
          body as physics.DynamicRigidBody,
        );
      }
      if (body.data?.growTime === game.world.frameCount) {
        const spaceProbe = dropSpaceProbe(
          game.world,
          body.center.x,
          body.center.y,
          body.shapes[0].bounds * 2 + 40,
        );
        physics.collidingWithStatic(game.world, spaceProbe);
        if (spaceProbe.shapes[0].sensorCollisions.length <= 1) {
          const circle = body.shapes[0];
          if (circle.type === physics.ShapeType.CIRCLE) {
            circle.bounds += 5 / circle.bounds;
          }
          body.data.growTime += growForest ? 1 : ~~(Math.random() * 50) + 50;
        }
        physics.removeBody(game.world, spaceProbe);
      }
      if (body.data?.isSeed) {
        (body as physics.DynamicRigidBody).restingTime = 0;
        if (game.world.frameCount > 1000) {
          // debugger
        }
        if (body.shapes[0].sensorCollisions.length === 0) {
          plantTree(game.world, body.center.x, body.center.y, growForest);
        }
        physics.removeBody(game.world, body);
      }
      for (const shape of body.shapes) {
        if (shape.sensorCollisions.length > 0) {
          shape.sensorCollisions.length = 0;
        }
      }
      if (body.data?.expiry === game.world.frameCount) {
        if (body.data?.originId) {
          const origin = game.world.dynamicBodies.find(
            (v) => v.id === body.data.originId,
          )!;
          if (origin) {
            includeCollisionsByIds(game.world, origin.id, body.id);
            if (game.world.exclusions[body.id].length === 0) {
              delete game.world.exclusions[body.id];
            }
          }
        }
        physics.removeBody(game.world, body);
      }
    }
    for (const playerId of ctx.allPlayerIds) {
      playerInteractiveUpdate(
        game.inputs[playerId].x,
        game.inputs[playerId].y,
        game.world,
        game.ids[playerId],
      );
    }
  },
  reactive: false,
  setup: (allPlayerIds) => {
    const data = worldInit();

    const inputs: Record<PlayerId, { x: number; y: number }> = {};

    for (const [idx, playerId] of allPlayerIds.entries()) {
      void idx;
      inputs[playerId] = { x: 0, y: 0 };
      data.ids[playerId] = playerInteractiveInit(data.world, idx * 60);
    }
    return {
      world: data.world,
      ids: data.ids,
      inputs,
      playerIds: allPlayerIds,
      forestTime: 10,
    };
  },
  actions: {
    controls: (inputs, ctx) => {
      ctx.game.inputs[ctx.playerId] = { ...inputs };
    },
  },
  events: {
    playerLeft(playerId, { game }) {
      playerInteractiveRemove(game.world, game.ids[playerId]);
      delete game.inputs[playerId];
      delete game.ids[playerId];
    },
    playerJoined(playerId, ctx) {
      ctx.game.inputs[playerId] = { x: 0, y: 0 };
      ctx.game.ids[playerId] = playerInteractiveInit(
        ctx.game.world,
        ctx.allPlayerIds.indexOf(playerId) * 60,
      );
    },
  },
});
