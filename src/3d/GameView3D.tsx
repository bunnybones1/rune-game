import { useFrame } from "@react-three/fiber";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { GameState } from "../logic";
import { BoxGeometry, Color, MeshBasicMaterial, SphereGeometry } from "three";
import { physics } from "propel-js";
let up = false;
let down = false;
let left = false;
let right = false;
let x = 0;
let y = 0;
let lastSent = { x: 0, y: 0 };
let lastSentTime = Date.now();

function updateXY() {
  x = 0;
  if (left) {
    x -= 1;
  }
  if (right) {
    x += 1;
  }
  y = 0;
  if (up) {
    y += 1;
  }
  if (down) {
    y -= 1;
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    left = true;
  }
  if (e.key === "d" || e.key === "ArrowRight") {
    right = true;
  }
  if (e.key === "w" || e.key === "ArrowUp") {
    up = true;
  }
  if (e.key === "s" || e.key === "ArrowDown") {
    down = true;
  }
  updateXY();
});

window.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    left = false;
  }
  if (e.key === "d" || e.key === "ArrowRight") {
    right = false;
  }
  if (e.key === "w" || e.key === "ArrowUp") {
    up = false;
  }
  if (e.key === "s" || e.key === "ArrowDown") {
    down = false;
  }
  updateXY();
});

function updatePointerXY(px: number, py: number) {
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const dx = px - window.innerWidth * 0.5;
  const dy = py - window.innerHeight * 0.5;
  const l = Math.sqrt(dx * dx + dy * dy);
  if (l < minSide * 0.15) {
    left = false;
    right = false;
    up = false;
    down = false;
  } else {
    const cardinal = (Math.round((Math.atan2(dy, dx) / Math.PI) * 4) + 4) % 8;
    left = cardinal === 0 || cardinal === 1 || cardinal === 7;
    right = cardinal === 4 || cardinal === 5 || cardinal === 3;
    up = cardinal === 2 || cardinal === 1 || cardinal === 3;
    down = cardinal === 6 || cardinal === 7 || cardinal === 5;
  }
  updateXY();
}

let isPointerDown = false;

window.addEventListener("pointerdown", (ev) => {
  isPointerDown = true;
  updatePointerXY(ev.clientX, ev.clientY);
});

window.addEventListener("pointermove", (ev) => {
  if (isPointerDown) {
    updatePointerXY(ev.clientX, ev.clientY);
  }
});

window.addEventListener("pointerup", (ev) => {
  void ev;
  left = false;
  right = false;
  up = false;
  down = false;
  updateXY();
  isPointerDown = false;
});

export default function GameView3D(props: {
  setFocusPos: Dispatch<SetStateAction<[number, number]>>;
}) {
  const { setFocusPos } = props;
  useFrame(() => {
    if (Date.now() - lastSentTime > 100) {
      if (lastSent.x !== x || lastSent.y !== y) {
        Rune.actions.controls({ x, y });
        lastSent = { x, y };
        lastSentTime = Date.now();
      }
    }
  });

  // const [playerId, setPlayerId] = useState<string | undefined>();
  const [gameState, setGameState] = useState<GameState | undefined>();

  useEffect(() => {
    Rune.initClient({
      onChange: (ctx) => {
        setGameState(ctx.game);

        const focusBody = ctx.game.world.dynamicBodies.find(
          (b) => b.id === ctx.game.ids[ctx.yourPlayerId!].body,
        );
        if (focusBody) {
          setFocusPos([focusBody.center.x, focusBody.center.y]);
        }
      },
    });
  });

  const geometryCircle = useMemo(() => new SphereGeometry(1, 16, 8), []);
  const geometryRect = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const materialStatic = useMemo(
    () => new MeshBasicMaterial({ color: new Color(10, 10, 1) }),
    [],
  );
  const materialSensor = useMemo(
    () => new MeshBasicMaterial({ color: new Color(10, 0.5, 0.5) }),
    [],
  );
  const materialDynamicCircle = useMemo(
    () => new MeshBasicMaterial({ color: new Color(0.3, 2, 0.3) }),
    [],
  );
  const materialDynamicRect = useMemo(
    () => new MeshBasicMaterial({ color: new Color(0.2, 1.5, 2) }),
    [],
  );
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 2]} intensity={150} color={[1, 0.7, 0.3]} />
      <pointLight position={[0, -3, 2]} intensity={50} color={[1, 0.4, 0.8]} />
      {gameState &&
        gameState.world.staticBodies.map((sb, i) => {
          return sb.shapes.map((shape) => {
            if (shape.type === physics.ShapeType.CIRCLE) {
              const circle = shape as physics.Circle;
              const radius = circle.bounds;
              return (
                <mesh
                  geometry={geometryCircle}
                  material={shape.sensor ? materialSensor : materialStatic}
                  key={`sb${i}`}
                  position={[sb.center.x, 0, sb.center.y]}
                  scale={[radius, radius, radius]}
                ></mesh>
              );
            }
          });
        })}
      {gameState &&
        gameState.world.dynamicBodies.map((sb, i) => {
          return sb.shapes.map((shape) => {
            if (shape.type === physics.ShapeType.CIRCLE) {
              const circle = shape as physics.Circle;
              const radius = circle.bounds;
              return (
                <mesh
                  geometry={geometryCircle}
                  material={materialDynamicCircle}
                  key={`db${i}`}
                  position={[shape.center.x, 0, shape.center.y]}
                  scale={[radius, radius, radius]}
                ></mesh>
              );
            } else if (shape.type === physics.ShapeType.RECTANGLE) {
              const rect = shape as physics.Rectangle;
              const width = rect.width;
              const height = rect.height;
              return (
                <mesh
                  geometry={geometryRect}
                  material={materialDynamicRect}
                  key={`db${i}`}
                  position={[shape.center.x, 0, shape.center.y]}
                  rotation={[0, -sb.angle, 0]}
                  scale={[width, 1, height]}
                ></mesh>
              );
            }
          });
        })}
    </>
  );
}
