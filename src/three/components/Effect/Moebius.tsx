import { Effect } from "postprocessing";
import fragmentShader from "../Shader/moebius/moebius.glsl";
import { useMemo } from "react";
import {
  Camera,
  PerspectiveCamera,
  Texture,
  Uniform,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

interface IProps {
  depthRenderTarget: WebGLRenderTarget;
  normalRenderTarget: WebGLRenderTarget;
  camera: Camera;
  noiseTex?: Texture;
  frequency?: number;
  amplitude?: number;
}

class MoebiusEffect extends Effect {
  constructor(args: IProps) {
    super("Moebius", fragmentShader, {
      uniforms: new Map<string, any>([
        ["cameraNear", new Uniform((args.camera as PerspectiveCamera).near)],
        ["cameraFar", new Uniform((args.camera as PerspectiveCamera).far)],
        ["uDepth", new Uniform(args.depthRenderTarget.depthTexture)],
        ["uNormal", new Uniform(args.normalRenderTarget.texture)],
        ["uResolution", new Uniform(new Vector2())],
        ["uFrequency", new Uniform(args.frequency)],
        ["uAmplitude", new Uniform(args.amplitude)],
        ["uNoiseTex", new Uniform(args.noiseTex)],
      ]),
    });
    this.depthRenderTarget = args.depthRenderTarget;
    this.camera = args.camera as PerspectiveCamera;
  }

  private depthRenderTarget: WebGLRenderTarget;
  private camera: Camera;

  update(
    renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
    deltaTime?: number
  ): void {
    this.uniforms
      .get("uResolution")!
      .value.set(
        innerWidth * Math.min(window.devicePixelRatio, 2),
        innerHeight * Math.min(window.devicePixelRatio, 2)
      );
  }
}

const Moebius = (args: IProps) => {
  const effect = useMemo(() => new MoebiusEffect(args), [args]);
  return <primitive object={effect} dispose={null} />;
};

export { Moebius };
