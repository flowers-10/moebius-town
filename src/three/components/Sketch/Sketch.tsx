import {
  BakeShadows,
  OrbitControls,
  SoftShadows,
  useFBO,
} from "@react-three/drei";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import { useInteractStore, useLoadedStore } from "@utils/Store";
import { useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import {
  Camera,
  DepthFormat,
  DepthTexture,
  DirectionalLight,
  HalfFloatType,
  Mesh,
  MeshNormalMaterial,
  NearestFilter,
  UnsignedByteType,
  UnsignedShortType,
} from "three";
import { Moebius } from "../Effect/Moebius";
import { useFrame, useThree } from "@react-three/fiber";
import GTToneMap from "../Effect/GTToneMap";
import {
  BlendFunction,
  EdgeDetectionMode,
  PredicationMode,
  SMAAPreset,
} from "postprocessing";
import { generateUUID } from "three/src/math/MathUtils.js";

const Sketch = () => {
  const directionalLightRef = useRef<DirectionalLight>(null);

  const groundRef = useRef<Mesh>(null);

  const controlDom = useInteractStore((state) => state.controlDom);

  const camera = useThree((state) => state.camera) as Camera;

  const normalMat = useMemo(() => new MeshNormalMaterial(), []);

  const depthTexture = useMemo(
    () => new DepthTexture(innerWidth, innerHeight),
    []
  );
  depthTexture.format = DepthFormat;
  depthTexture.type = UnsignedShortType;

  const depthRenderTarget = useFBO(innerWidth, innerHeight, {
    depthTexture,
    generateMipmaps: false,
  });

  const normalRendertarget = useFBO({
    generateMipmaps: false,
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    stencilBuffer: false,
    type: HalfFloatType,
  });

  useEffect(() => {
    directionalLightRef.current!.target = groundRef.current!;
    useLoadedStore.setState({ ready: true });
  }, []);

  useFrame((state, delta) => {
    const { gl, scene, camera } = state;

    gl.setRenderTarget(depthRenderTarget);
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    gl.setRenderTarget(normalRendertarget);
    scene.overrideMaterial = normalMat;
    gl.render(scene, camera);
    scene.overrideMaterial = null;
    gl.setRenderTarget(null);
  });

  const { dircolor, ambientcolor, dirIntenisty, ambientIntenisty } =
    useControls("dirLightColor", {
      dircolor: "#fff",
      dirIntenisty: {
        value: 12,
        min: 0,
        max: 50,
        step: 0.01,
      },
      ambientcolor: "#fff",
      ambientIntenisty: {
        value: 1.1,
        min: 0,
        max: 10,
        step: 0.01,
      },
    });

  const { amplitude, frequency } = useControls("outline", {
    amplitude: { value: 2, min: 0, max: 5, step: 0.1 },
    frequency: { value: 0.04, min: 0, max: 0.15, step: 0.01 },
  });

  const gtProps = useControls("ToneMapGT", {
    MaxLuminanice: {
      value: 1,
      min: 1,
      max: 100,
      step: 0.01,
    },
    Contrast: {
      value: 1,
      min: 1,
      max: 5,
      step: 0.01,
    },
    LinearSectionStart: {
      value: 0.17,
      min: 0,
      max: 1,
      step: 0.01,
    },
    LinearSectionLength: {
      value: 0.3,
      min: 0,
      max: 0.99,
      step: 0.01,
    },
    BlackTightnessC: {
      value: 1.69,
      min: 1,
      max: 3,
      step: 0.01,
    },
    BlackTightnessB: {
      value: 0.05,
      min: 0,
      max: 1,
      step: 0.01,
    },
    Enabled: true,
  });

  const { preset } = useControls("SMAA", {
    preset: {
      value: SMAAPreset.ULTRA,
      options: {
        low: SMAAPreset.LOW,
        medium: SMAAPreset.MEDIUM,
        high: SMAAPreset.HIGH,
        ultra: SMAAPreset.ULTRA,
      },
    },
  });

  const { mod, tickness } = useControls("shadow", {
    mod: {
      value: 10,
      min: 0,
      max: 50,
      step: 0.01,
    },
    tickness: {
      value: 1.5,
      min: 0,
      max: 10,
      step: 0.01,
    },
  });

  return (
    <>
      <OrbitControls domElement={controlDom} minDistance={1} maxDistance={15} />
      <ambientLight intensity={ambientIntenisty} color={ambientcolor} />
      <color attach="background" args={["#1B43BA"]} />
      <directionalLight
        ref={directionalLightRef}
        castShadow
        position={[5, 5, 5]}
        intensity={dirIntenisty}
        color={dircolor}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-top={10}
        shadow-camera-right={10}
        shadow-camera-bottom={-10}
        shadow-camera-left={-10}
      />
      {/* <BakeShadows />
      <SoftShadows /> */}
      <mesh castShadow receiveShadow position={[-1, 2, 1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        rotation={[0, Math.PI / 3, 0]}
        position={[2, 0.75, 2]}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <mesh
        ref={groundRef}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[10, 10, 100, 100]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <EffectComposer
        disableNormalPass
        multisampling={0}
        frameBufferType={UnsignedByteType}
      >
        <Moebius
          depthRenderTarget={depthRenderTarget}
          camera={camera}
          normalRenderTarget={normalRendertarget}
          frequency={frequency}
          amplitude={amplitude}
          mod={mod}
          tickness={tickness}
        />
        <GTToneMap {...gtProps} />
        <SMAA preset={preset} key={generateUUID()} />
      </EffectComposer>
    </>
  );
};

export default Sketch;
