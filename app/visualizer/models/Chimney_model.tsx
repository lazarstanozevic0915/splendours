'use client';
import * as THREE from 'three'; // Ensure to import THREE if not already imported
import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { useMediaQuery } from 'react-responsive';
import { OrbitControls, useProgress } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureLoader } from 'three';

const Chimney = ({
  modelPath,
  selectedBaseColor,
  selectedArm,
  selectedNormal,
  selectedHeight,
  zoomStatus,
  rotateStatus
}: {
  modelPath: string;
  selectedBaseColor: string | null;
  selectedArm: string | null;
  selectedNormal: string | null;
  selectedHeight: string | null;
  zoomStatus: boolean | false;
  rotateStatus: Number | 0;
}) => {
  const gltf = useLoader(GLTFLoader, modelPath);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  // const [value] = React.useState<number | null>(5);
  const [minAzimuthAngle, setMinAzimuthAngle] = useState<number>(-Math.PI / 4);
  const [maxAzimuthAngle, setMaxAzimuthAngle] = useState<number>(Math.PI / 4);
  const [minPolarAngle, setMinPolarAngle] = useState<number>(Math.PI / 4);
  const [maxPolarAngle, setMaxPolarAngle] = useState<number>(Math.PI / 1.5);
  const [intensity, setIntensity] = useState<number>(2.5);
  const [lightPoses, setLightPoses] = useState<[number, number, number]>([1, 1, 1]);

  const [textures, setTextures] = useState<{
    baseColor: THREE.Texture;
    arm: THREE.Texture;
    normal: THREE.Texture;
    height: THREE.Texture;
  }>({
    baseColor: useLoader(TextureLoader, '/Project_textures/01_beachport/textures/beachport_basecolor.jpg'),
    arm: useLoader(TextureLoader, '/Project_textures/01_beachport/textures/beachport_arm.jpg'),
    normal: useLoader(TextureLoader, '/Project_textures/01_beachport/textures/beachport_height.jpg'),
    height: useLoader(TextureLoader, '/Project_textures/01_beachport/textures/beachport_normal.jpg'),
  });

  useEffect(() => {
    // Update textures based on the selected paths
    if (selectedBaseColor) {
      setTextures(prevState => ({
        ...prevState,
        baseColor: useLoader(TextureLoader, selectedBaseColor),
      }));
    }
    if (selectedArm) {
      setTextures(prevState => ({
        ...prevState,
        arm: useLoader(TextureLoader, selectedArm),
      }));
    }
    if (selectedNormal) {
      setTextures(prevState => ({
        ...prevState,
        normal: useLoader(TextureLoader, selectedNormal),
      }));
    }
    if (selectedHeight) {
      setTextures(prevState => ({
        ...prevState,
        height: useLoader(TextureLoader, selectedHeight),
      }));
    }
  }, [selectedBaseColor, selectedArm, selectedNormal, selectedHeight]);

  // Define type for settings
  type CameraSettings = {
    cameraPosition: [number, number, number]; // Explicitly defined as a tuple
    primitivePosition: [number, number, number];
    orbitTarget: [number, number, number];
    backgroundColor: string;
  };

  const [settings1, setSettings1] = useState<CameraSettings>(() => {
    return {
      cameraPosition: [0, 0, 7.5],
      primitivePosition: [0, -1.5, 0],
      orbitTarget: [0, 0, 0],
      backgroundColor: '#283C28',
    }
  })
  const [settings2, setSettings2] = useState<CameraSettings>(() => {
    return {
      cameraPosition: [0, 0, 3.5],
      primitivePosition: [0, -0.8, 0],
      orbitTarget: [0, 0, 0],
      backgroundColor: '#283C28',
    }
  })

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (gltf && textures.baseColor) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.name === 'main_change') {
          child.material = new THREE.MeshStandardMaterial({
            map: textures.baseColor,
            normalMap: textures.normal,
            displacementMap: textures.height,
            displacementScale: 0,
            roughnessMap: textures.arm,
            roughness: 0.8,
            metalness: 0.0,
          });
          child.material.needsUpdate = true;
        }
      });

      // Apply model-specific transformations if needed
      // if (modelPath === '/models/chimney5.glb') {
      if (rotateStatus == 0) {
        gltf.scene.rotation.y = Math.PI / 2; // Rotate 90 degrees
        setLightPoses([1, 1, 1]);
      }
      if (rotateStatus == 1) {
        gltf.scene.rotation.y = Math.PI / 3.5;
        setLightPoses([0, 1, 1]);
      }
      if (rotateStatus == 2) {
        gltf.scene.rotation.y = Math.PI / 1.39;
        setLightPoses([0, 1, 1]);
      }

      setMinAzimuthAngle(-Math.PI / 4);
      setMaxAzimuthAngle(Math.PI / 4);
      setMinPolarAngle(Math.PI / 4);
      setMaxPolarAngle(Math.PI / 1.5);
      setIntensity(2.5);

      setSettings1((prevSet) => ({
        ...prevSet,
        cameraPosition: [0, zoomStatus ? -1 : 0, zoomStatus ? 2.0 : 5]
      }));
      setSettings2((prevSet) => ({
        ...prevSet,
        cameraPosition: [0, 0, zoomStatus ? 1.5 : 3.5]
      }));
    }
  }, [gltf, textures.baseColor, modelPath, zoomStatus, rotateStatus]);

  useEffect(() => {
    if (isMobile) {
      if (cameraRef.current) {
        cameraRef.current.position.set(...settings1.cameraPosition);
      }
    } else {
      if (cameraRef.current) {
        cameraRef.current.position.set(...settings2.cameraPosition);
      }
    }
  }, [settings1.cameraPosition, settings2.cameraPosition, isMobile]);

  return (
    <>
      {isMobile ? (
        <Canvas
          style={{ height: '100%', width: '100%' }} // Make Canvas full screen
          key={modelPath} // Add this line to force re-mounting
          camera={{ position: settings1.cameraPosition }}
          shadows
          onCreated={({ gl, camera }) => {
            gl.setClearColor(settings1.backgroundColor); // Set background color dynamically
            cameraRef.current = camera;
          }}
          className='relativeScene'
        >
          <ambientLight intensity={0.5} color='green' />
          <directionalLight position={lightPoses} intensity={intensity} castShadow />
          <directionalLight position={[-1, -1, -1]} intensity={intensity} />
          <primitive object={gltf.scene} position={settings1.primitivePosition} castShadow />
          {/* <Sphere position={[0, 0, 0]} args={[0.1, 32, 32]} castShadow>
                  <meshStandardMaterial attach="material" color="blue" />
              </Sphere>
              <Sphere position={[1, 0, 0]} args={[0.1, 32, 32]} castShadow>
                  <meshStandardMaterial attach="material" color="red" />
              </Sphere>
              <Sphere position={[0, 0, 1]} args={[0.1, 32, 32]} castShadow>
                  <meshStandardMaterial attach="material" color="green" />
              </Sphere>
              <Sphere position={[0, 1, 0]} args={[0.1, 32, 32]} castShadow>
                  <meshStandardMaterial attach="material" color="green" />
              </Sphere> */}
          {/* <OrbitControls target={settings.orbitTarget} /> */}
          <OrbitControls
            target={settings1.orbitTarget}
            enableZoom={true}
            enablePan={false} // Disable panning if unnecessary
            minDistance={1} // Minimum zoom level
            maxDistance={5} // Maximum zoom level
            minPolarAngle={minPolarAngle} // Minimum vertical angle (limit upward rotation)
            maxPolarAngle={maxPolarAngle} // Maximum vertical angle (limit downward rotation)
            minAzimuthAngle={minAzimuthAngle} // Limit left rotation (-25 degrees)
            maxAzimuthAngle={maxAzimuthAngle} // Limit right rotation (245 degrees)
            enableDamping // Smooth the rotation for better UX
            dampingFactor={0.1}
          />
        </Canvas>
      ) : (
        <>
          {' '}
          <Canvas
            style={{ height: '100%', width: '100%' }} // Make Canvas full screen
            key={modelPath} // Add this line to force re-mounting
            camera={{ position: settings2.cameraPosition }}
            shadows
            onCreated={({ gl, camera }) => {
              gl.setClearColor(settings2.backgroundColor); // Set background color dynamically
              cameraRef.current = camera;
            }}
            className='relativeScene'
          >
            <directionalLight position={lightPoses} intensity={intensity} castShadow />
            <directionalLight position={[-1, -1, -1]} intensity={intensity} />
            <primitive object={gltf.scene} position={settings2.primitivePosition} castShadow />
            {/* <OrbitControls target={settings.orbitTarget} /> */}
            <OrbitControls
              target={settings2.orbitTarget}
              enableZoom={true}
              enablePan={false} // Disable panning if unnecessary
              minDistance={0} // Minimum zoom level
              maxDistance={4} // Maximum zoom level
              minPolarAngle={Math.PI / 4} // Minimum vertical angle (limit upward rotation)
              maxPolarAngle={Math.PI / 1.5} // Maximum vertical angle (limit downward rotation)
              minAzimuthAngle={-Math.PI / 4} // Limit left rotation (-45 degrees)
              maxAzimuthAngle={Math.PI / 4} // Limit right rotation (+45 degrees)
              enableDamping // Smooth the rotation for better UX
              dampingFactor={0.1}
            />
          </Canvas>
        </>
      )}
    </>
  );
};

export default Chimney;