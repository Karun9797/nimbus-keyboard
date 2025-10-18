"use client";

import { Keyboard, KeyboardRefs } from "@/components/Keyboard";
import { Keycap } from "@/components/Keycap";
import { useGSAP } from "@gsap/react";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import gsap from "gsap";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFrame, useThree } from "@react-three/fiber";

gsap.registerPlugin(ScrollTrigger);

function CameraController() {
  const { camera, size } = useThree();
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentCameraPositionRef = useRef(new THREE.Vector3(0, 0, 4));
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const baseCameraPosition = {
    x: 0,
    y: 0,
    z: 4,
  };

  useFrame(() => {
    if (prefersReducedMotion) {
      camera.position.set(
        baseCameraPosition.x,
        baseCameraPosition.y,
        baseCameraPosition.z,
      );
      camera.lookAt(targetRef.current);
      return;
    }
    const mouse = mouseRef.current;

    const horizontalTilt = mouse.x - 0.5; // Controls X-axis
    const verticalTilt = mouse.y - 0.5; // Controls Y-axis

    const targetPosition = new THREE.Vector3(
      baseCameraPosition.x + horizontalTilt,
      baseCameraPosition.y - verticalTilt,
      baseCameraPosition.z,
    );

    // smooth transition
    currentCameraPositionRef.current.lerp(targetPosition, 0.05);
    camera.position.copy(currentCameraPositionRef.current);
    camera.lookAt(targetRef.current);
  });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / size.width;
      mouseRef.current.y = e.clientY / size.height;
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);

      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [size]);
  return null;
}

export function Scene() {
  const keyboardGroupRef = useRef<THREE.Group>(null);
  const keycapGroupRef = useRef<THREE.Group>(null);
  const keyboardAnimationRef = useRef<KeyboardRefs>(null);
  const [lightIntensityScalar, setLightIntensityScalar] = useState(0);

  const [scale, setScale] = useState(1);
  // const { positionX, positionY, positionZ, rotationX, rotationY, rotationZ } =
  //   useControls({
  //     positionX: 0,
  //     positionY: -0.5,
  //     positionZ: 3,
  //     rotationX: Math.PI / 2,
  //     rotationY: 0,
  //     rotationZ: 0,
  //   });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let scalingFactor = 1;

      if (width <= 500) {
        scalingFactor = 0.5; // Mobile
      } else if (width <= 768) {
        scalingFactor = 0.65; // Small tablet
      } else if (width <= 1024) {
        scalingFactor = 0.75; // Large tablet
      } else if (width <= 1355) {
        scalingFactor = 0.85; // Small laptop
      } else if (width <= 1600) {
        scalingFactor = 0.95; // Standard desktop
      } else {
        scalingFactor = 1; // Large screen
      }
      setScale(scalingFactor);
    };

    // Run once on mount
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!keyboardGroupRef.current || !keycapGroupRef.current) return;
      const keyboard = keyboardGroupRef.current;
      const keycaps = keycapGroupRef.current;

      // const materials: Array<any> = [];
      keycaps.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // cast to any to let GSAP write `opacity` at runtime
          const mat = child.material as any;
          mat.transparent = true;
          mat.opacity = 0; // set starting opacity
          // materials.push(mat);
        }
      });

      // animate light gradually
      gsap.to(
        { lightIntensityScalar: 0 },
        {
          lightIntensityScalar: 1,
          duration: 3,
          delay: 0.5,
          ease: "power2.inOut",
          onUpdate: function () {
            setLightIntensityScalar(this.targets()[0].lightIntensityScalar);
          },
        },
      );

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
      });

      if (typeof window !== "undefined") {
        const initialScrollY = window.scrollY;
        if (initialScrollY === 0) {
          document.body.style.overflow = "hidden";
        }
      }

      tl.to(keyboard.position, {
        x: 0,
        y: -0.2,
        z: 0,
        duration: 1,
      })
        .to(
          keyboard.rotation,
          {
            x: 0,
            y: 6.3,
            z: 0,
            duration: 2.5,
          },
          0,
        )
        .to(
          keyboard.position,
          {
            x: 0.2,
            y: -0.5,
            z: 1.9,
            duration: 1.4,
            ease: "power4.out",
          },
          1.6,
        )
        .call(() => {
          if (typeof window !== "undefined") {
            document.body.style.overflow = "";
          }
          if (!keyboard || !keycaps) return;
          const scrollTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom bottom",
              scrub: 1,
            },
          });

          scrollTimeline
            .to(keyboard.position, {
              x: 0,
              y: -0.75,
              z: 1.9,
            })
            .to(
              keyboard.rotation,
              {
                x: Math.PI * -0.3,
                y: 0,
                z: -0.4,
              },
              "<",
            )
            .to(
              keycaps.scale,
              {
                x: 5,
                y: 5,
                z: 5,
                duration: 3,
              },
              "0",
            );

          // Add wave animation to the scroll timeline
          if (keyboardAnimationRef.current) {
            // Collect all switches and keycaps from all rows
            const switchRefs = keyboardAnimationRef.current.switches;
            const individualKeys = keyboardAnimationRef.current.keys;

            // Collect all switches into a single array
            const allSwitches: THREE.Object3D[] = [];

            // Gather all switches from all rows
            [
              switchRefs.functionRow.current,
              switchRefs.numberRow.current,
              switchRefs.topRow.current,
              switchRefs.homeRow.current,
              switchRefs.bottomRow.current,
              switchRefs.modifiers.current,
              switchRefs.arrows.current,
            ].forEach((row) => {
              if (row) {
                allSwitches.push(...Array.from(row.children));
              }
            });

            // Define keycaps in actual left-to-right COLUMN order across the keyboard
            const keyboardColumns = [
              ["esc", "grave", "tab", "caps", "lshift", "lcontrol"],
              ["f1", "one", "q", "a", "z", "lalt"],
              ["f2", "two", "w", "s", "x", "lwin"],
              ["f3", "three", "e", "d", "c"],
              ["f4", "four", "r", "f", "v"],
              ["f5", "five", "t", "g", "b", "space"],
              ["f6", "six", "y", "h", "n"],
              ["f7", "seven", "u", "j", "m"],
              ["f8", "eight", "i", "k", "comma"],
              ["f9", "nine", "o", "l", "period"],
              ["f10", "zero", "dash", "p", "semicolon", "slash", "ralt"],
              [
                "f11",
                "lsquarebracket",
                "quote",
                "rshift",
                "fn",
                "arrowleft",
                "rsquarebracket",
                "enter",
                "f12",
                "equal",
                "arrowup",
              ],
              [],
              [
                "del",
                "backspace",
                "backslash",
                "pagedown",
                "end",
                "arrowdown",
                "pageup",
                "arrowright",
              ],
              [],
            ];

            // Group keycaps and switches by column
            const keyCapsByColumn: THREE.Mesh[][] = [];
            const switchesByColumn: THREE.Object3D[][] = [];

            // Sort switches by X position to match column order
            const sortedSwitches = allSwitches.sort(
              (a, b) => a.position.x - b.position.x,
            );

            keyboardColumns.forEach((column, columnIndex) => {
              const columnKeycaps: THREE.Mesh[] = [];
              const columnSwitches: THREE.Object3D[] = [];

              column.forEach((keyName) => {
                if (keyName && individualKeys[keyName]?.current) {
                  columnKeycaps.push(individualKeys[keyName].current);
                }
              });

              // Assign switches to columns based on their count
              const switchesPerColumn = Math.ceil(
                sortedSwitches.length / keyboardColumns.length,
              );
              const startIndex = columnIndex * switchesPerColumn;
              const endIndex = Math.min(
                startIndex + switchesPerColumn,
                sortedSwitches.length,
              );

              for (let i = startIndex; i < endIndex; i++) {
                if (sortedSwitches[i]) {
                  columnSwitches.push(sortedSwitches[i]);
                }
              }

              keyCapsByColumn.push(columnKeycaps);
              switchesByColumn.push(columnSwitches);
            });

            // Add wave animation for each column to the scroll timeline
            keyCapsByColumn.forEach((columnKeycaps, columnIndex) => {
              const columnSwitches = switchesByColumn[columnIndex];

              if (columnKeycaps.length === 0 && columnSwitches.length === 0)
                return;

              // Calculate wave timing - spread across scroll timeline
              const waveProgress = columnIndex / (keyboardColumns.length - 1); // 0 to 1
              const waveStartTime = waveProgress * 2 + 0.5; // Spread wave across 2 time units

              // Animate keycaps up then down
              if (columnKeycaps.length > 0) {
                const keycapPositions = columnKeycaps.map(
                  (keycap) => keycap.position,
                );

                // Create temporary keyframe for wave peak
                scrollTimeline.to(
                  keycapPositions,
                  {
                    y: "+=0.08", // Lift keycaps up
                    duration: 0.5,
                    ease: "power2.inOut",
                  },
                  waveStartTime,
                );

                // Return to original position
                scrollTimeline.to(
                  keycapPositions,
                  {
                    y: "-=0.08", // Bring keycaps back down
                    duration: 0.5,
                    ease: "power2.inOut",
                  },
                  waveStartTime + 0.5,
                );
              }

              // Animate switches (follow keycaps with delay and less movement)
              if (columnSwitches.length > 0) {
                const switchPositions = columnSwitches.map(
                  (switchObj) => switchObj.position,
                );

                // Up phase (slightly delayed and lower)
                scrollTimeline.to(
                  switchPositions,
                  {
                    y: "+=0.04", // Less movement for switches
                    duration: 0.3,
                    ease: "power2.inOut",
                  },
                  waveStartTime + 0.2, // Slight delay
                );

                // Down phase
                scrollTimeline.to(
                  switchPositions,
                  {
                    y: "-=0.04",
                    duration: 0.3,
                    ease: "power2.inOut",
                  },
                  waveStartTime + 0.5,
                );
              }
            });
          }
        });
    });
  });

  return (
    <group>
      <CameraController />
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
      <group scale={scale}>
        <group ref={keyboardGroupRef}>
          <Keyboard
            scale={9}
            position={[0, 0, 0]}
            rotation={[1.6, 0.4, 0]}
            ref={keyboardAnimationRef}
          />
        </group>

        <ambientLight intensity={0.2 * lightIntensityScalar} />

        {/* position={[positionX, positionY, positionZ]}
        rotation={[rotationX, rotationY, rotationZ]} */}

        <group ref={keycapGroupRef}>
          <Keycap position={[0, -0.4, 2.6]} rotation={[0, 2, 3]} texture={0} />
          <Keycap position={[-1.4, 0, 2.3]} rotation={[3, 2, 1]} texture={1} />
          <Keycap position={[-1.8, 1, 1.5]} rotation={[0, 1, 3]} texture={2} />
          <Keycap position={[0, 1, 1]} rotation={[0, 4, 2]} texture={3} />
          <Keycap position={[0.7, 0.9, 1.4]} rotation={[3, 2, 0]} texture={4} />
          <Keycap
            position={[1.3, -0.3, 2.3]}
            rotation={[1, 2, 0]}
            texture={5}
          />
          <Keycap position={[0, 1, 2]} rotation={[2, 2, 3]} texture={6} />
          <Keycap position={[-0.7, 0.6, 2]} rotation={[1, 4, 0]} texture={7} />
          <Keycap
            position={[-0.77, 0.1, 2.8]}
            rotation={[3, 2, 3]}
            texture={8}
          />
          <Keycap position={[2, 0, 1]} rotation={[0, 0, 3]} texture={0} />
        </group>
      </group>

      <Environment
        files={["/hdr/blue-studio.hdr"]}
        environmentIntensity={0.1 * lightIntensityScalar}
      />
      <spotLight
        position={[-2, 1.5, 3]}
        intensity={26 * lightIntensityScalar}
        castShadow
        shadow-bias={-0.0002}
        shadow-normalBias={-0.00001}
        shadow-mapSize={1024}
      />
    </group>
  );
}
