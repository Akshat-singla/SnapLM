"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { EffectComposer, DepthOfField, Bloom } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedMesh({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const { camera } = useThree();

    useFrame(() => {
        const scroll = scrollY.current;
        const mesh = meshRef.current;

        if (!mesh) return;

        // 🎬 HERO — object enters
        if (scroll < 600) {
            mesh.position.z = 3 - scroll * 0.003;
            mesh.rotation.y += 0.01;
        }

        // 🎬 FEATURES — showcase rotation
        else if (scroll < 1400) {
            mesh.position.z = -1;
            mesh.rotation.x += 0.02;
            mesh.rotation.y += 0.02;
        }

        // 🎬 HOW IT WORKS — vertical drift
        else if (scroll < 2200) {
            mesh.position.y = -(scroll - 1400) * 0.002;
            mesh.rotation.z += 0.02;
        }

        // 🎬 CTA — exit dramatically
        else {
            mesh.position.z -= 0.05;
            mesh.rotation.x += 0.05;
        }

        // 🎥 subtle cinematic camera movement
        camera.position.x = Math.sin(scroll * 0.001) * 0.5;
        camera.position.y = Math.sin(scroll * 0.0007) * 0.3;
        camera.lookAt(0, 0, 0);
    });

    return (
        <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
            <mesh ref={meshRef}>
                <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                <meshStandardMaterial
                    color="#7c3aed"
                    metalness={1}
                    roughness={0.1}
                    emissive="#7c3aed"
                    emissiveIntensity={0.6}
                />
            </mesh>
        </Float>
    );
}

export default function Scene({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <pointLight position={[3, 3, 3]} intensity={2} />
                <pointLight position={[-3, -3, -3]} intensity={1} color="#7c3aed" />

                <AnimatedMesh scrollY={scrollY} />

                {/* 🎥 Post Processing (APPLE FEEL) */}
                <EffectComposer>
                    <DepthOfField
                        focusDistance={0}
                        focalLength={0.02}
                        bokehScale={2}
                        height={480}
                    />
                    <Bloom intensity={0.8} luminanceThreshold={0.2} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}