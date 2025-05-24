import { Canvas } from "@react-three/fiber";
import GameView3D from "./3d/GameView3D";
import View3D from "./3d/View3D";
import { useState } from "react";

export default function App() {
  const [focusPos, setFocusPos] = useState<[number, number]>([0, 0]);
  return (
    <Canvas style={{ height: "100vh", width: "100vw" }}>
      <View3D focusPos={focusPos}>
        <GameView3D setFocusPos={setFocusPos} />
      </View3D>
    </Canvas>
  );
}
