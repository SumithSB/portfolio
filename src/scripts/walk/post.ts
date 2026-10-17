import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// The film look: soft contact shadows, glow on lamps and windows, then a grade with vignette and grain.
const Grade = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    vignette: { value: 0.32 },
    grain: { value: 0.006 },
    warmth: { value: 0 },
    aberration: { value: 0.00012 },
    fade: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain, warmth, aberration, fade; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float d = dot(c, c);
      vec2 off = c * aberration * (1.0 + d * 4.0);
      vec4 col = texture2D(tDiffuse, vUv);
      col.r = texture2D(tDiffuse, vUv + off).r; col.b = texture2D(tDiffuse, vUv - off).b;
      // split tone: warm highlights, cool shadows, shifted by the time of day
      float l = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb += mix(vec3(-0.012, 0.0, 0.02), vec3(0.025, 0.012, -0.015), smoothstep(0.2, 0.8, l)) * (0.6 + warmth);
      col.rgb *= 1.0 - vignette * smoothstep(0.08, 0.62, d * 1.6);
      col.rgb += (hash(vUv * 1000.0 + fract(time * 7.0)) - 0.5) * grain;
      col.rgb *= 1.0 - fade; // cuts between chapters dip to black
      gl_FragColor = col;
    }`,
};

export type Quality = 0 | 1 | 2; // 0 plain, 1 bloom and grade, 2 everything

export function createPost(r: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.PerspectiveCamera, quality: Quality) {
  let q = quality, fadeLevel = 0;
  let composer: EffectComposer | undefined;
  let ao: GTAOPass | undefined;
  let bloom: UnrealBloomPass | undefined;
  let grade: ShaderPass | undefined;
  let width = 1, height = 1, pixelRatio = 1;
  const ensure = () => {
    if (q === 0 || composer) return;
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
    composer = new EffectComposer(r, target);
    composer.addPass(new RenderPass(scene, cam));
    if (q === 2) {
      ao = new GTAOPass(scene, cam, 1, 1);
      ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 0.6, scale: 1, samples: 8 });
      ao.blendIntensity = 0.55; composer.addPass(ao);
    }
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.45, 1.05);
    grade = new ShaderPass(Grade);
    composer.addPass(bloom); composer.addPass(grade); composer.addPass(new OutputPass());
    composer.setPixelRatio(pixelRatio); composer.setSize(width, height);
    ao?.setSize(Math.round(width * pixelRatio * 0.5), Math.round(height * pixelRatio * 0.5));
  };
  const dispose = () => {
    composer?.passes.forEach((pass) => pass.dispose()); composer?.dispose();
    composer = undefined; ao = undefined; bloom = undefined; grade = undefined;
  };
  ensure();
  return {
    get quality() { return q; },
    setQuality(n: Quality) { if (n === q) return; dispose(); q = n; ensure(); },
    setSize(w: number, h: number, ratio: number) {
      width = w; height = h; pixelRatio = ratio;
      composer?.setPixelRatio(ratio); composer?.setSize(w, h);
      ao?.setSize(Math.round(w * ratio * 0.5), Math.round(h * ratio * 0.5));
    },
    update(t: number, night: number, warmth: number, fade = 0) {
      if (bloom) { bloom.strength = 0.08 + night * 0.12; bloom.threshold = 1.05; }
      if (grade) {
        grade.uniforms.time.value = t; grade.uniforms.warmth.value = warmth * 0.35;
        grade.uniforms.vignette.value = 0.12 + night * 0.08; grade.uniforms.fade.value = fade;
      }
      fadeLevel = fade;
    },
    render(dt: number) {
      if (q === 0) { r.render(scene, cam); r.domElement.style.transition = 'none'; r.domElement.style.opacity = String(1 - fadeLevel); }
      else { r.domElement.style.opacity = ''; composer!.render(dt); }
    },
    dispose,
  };
}
