import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

function SceneContent({ count = 300 }) {
    const pointsRef = useRef<THREE.Points>(null);
    const linesRef = useRef<THREE.LineSegments>(null);
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    useEffect(() => {
        // Entry animation
        gsap.fromTo(camera.position,
            { z: 80, y: 15 },
            { z: 25, y: 5, duration: 2.5, ease: "power3.out" }
        );
        
        if (groupRef.current) {
            gsap.fromTo(groupRef.current.rotation,
                { y: -Math.PI / 4, x: Math.PI / 8 },
                { y: 0, x: 0, duration: 3, ease: "power2.out" }
            );
        }
    }, [camera]);

    const { positions, linesList } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const yOffset = -5;
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;     // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20 + yOffset; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40; // z
        }

        const linesList: number[] = [];
        // Connect nearby nodes
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dist = Math.hypot(
                    positions[i * 3] - positions[j * 3],
                    positions[i * 3 + 1] - positions[j * 3 + 1],
                    positions[i * 3 + 2] - positions[j * 3 + 2]
                );
                
                // Max distance for connection
                if (dist < 4.5) {
                    linesList.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    );
                }
            }
        }
        
        return { 
            positions, 
            linesList: new Float32Array(linesList) 
        };
    }, [count]);

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        if (pointsRef.current && linesRef.current) {
            // Slower continuous rotation after GSAP finishes
            pointsRef.current.rotation.y = time * 0.03;
            linesRef.current.rotation.y = time * 0.03;
        }
    });

    return (
        <group ref={groupRef}>
            {/* The nodes */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={positions.length / 3}
                        array={positions}
                        itemSize={3}
                        args={[positions, 3]}
                    />
                </bufferGeometry>
                <PointMaterial transparent color="#a78bfa" size={0.15} sizeAttenuation={true} depthWrite={false} />
            </points>

            {/* The connections */}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={linesList.length / 3}
                        array={linesList}
                        itemSize={3}
                        args={[linesList, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#6d28d9" transparent opacity={0.2} depthWrite={false} />
            </lineSegments>
            
            <Grid
                position={[0, -10, 0]}
                args={[100, 100]}
                cellSize={1}
                cellThickness={1}
                cellColor="#7c3aed"
                sectionSize={5}
                sectionThickness={1.5}
                sectionColor="#8b5cf6"
                fadeDistance={50}
                fadeStrength={1.5}
            />
        </group>
    );
}

export default function NetworkBackground() {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <Canvas camera={{ position: [0, 5, 25], fov: 60 }} dpr={[1, 2]}>
                <fog attach="fog" args={['#0f172a', 15, 45]} />
                <ambientLight intensity={1} />
                <SceneContent count={300} />
            </Canvas>
        </div>
    );
}
