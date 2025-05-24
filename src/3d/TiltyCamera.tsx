import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import { animated, useSpringValue } from "@react-spring/three";
import { useEffect, useRef } from "react";
import { Group } from "three";

export default function TiltyCamera(props: {
  lookUp: boolean;
  focusPos: [number, number];
}) {
  const { lookUp, focusPos } = props;
  const camRotAnim = useSpringValue(0, {
    config: {
      mass: 0.25,
      friction: 7,
      tension: 15,
    },
  });

  useEffect(() => {
    camRotAnim.start(lookUp ? 1 : 0);
  });
  const myGroupInner = useRef<Group | null>(null);

  useFrame(() => {
    if (myGroupInner.current) {
      myGroupInner.current.rotation.x = camRotAnim.get() * 0.5;
      myGroupInner.current.position.y = camRotAnim.get() * 2;
    }
  });

  return (
    <animated.group
      ref={myGroupInner}
      rotation={[0.75, 0, 0]}
      position={[0, 0, 5]}
    >
      <PerspectiveCamera
        makeDefault
        position={[focusPos[0], 400, focusPos[1]]}
        rotation={[Math.PI * -0.5, 0, 0]}
        fov={75}
      />
    </animated.group>
  );
}
