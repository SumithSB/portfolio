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
    grain: { value: 0.035 },
    warmth: { value: 0 },
    aberration: { value: 0.0012 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain, warmth, aberration; varying vec2 vUv;
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
      gl_FragColor = col;
    }`,
};

export type Quality = 0 | 1 | 2; // 0 plain, 1 bloom and grade, 2 everything

export function createPost(r: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.PerspectiveCamera, quality: Quality) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(r, target);
  composer.addPass(new RenderPass(scene, cam));
  const ao = new GTAOPass(scene, cam, 1, 1);
  ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 12 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.55, 0.82);
  composer.addPass(bloom);
  const grade = new ShaderPass(Grade);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  let q = quality;
  const apply = () => { ao.enabled = q >= 2; bloom.enabled = q >= 1; grade.enabled = q >= 1; };
  apply();

  return {
    get quality() { return q; },
    setQuality(n: Quality) { q = n; apply(); },
    setSize(w: number, h: number, ratio: number) {
      composer.setPixelRatio(ratio); composer.setSize(w, h);
      // Bloom and AO at half resolution: they are soft anyway, and it halves their cost.
      bloom.resolution.set(w * ratio * 0.5, h * ratio * 0.5);
      ao.setSize(Math.round(w * ratio * 0.5), Math.round(h * ratio * 0.5));
    },
    // night 0..1 drives how much the lights glow.
    update(t: number, night: number, warmth: number) {
      bloom.strength = 0.18 + night * 0.75;
      bloom.threshold = 0.86 - night * 0.18;
      grade.uniforms.time.value = t;
      grade.uniforms.warmth.value = warmth;
      grade.uniforms.vignette.value = 0.26 + night * 0.18;
    },
    render(dt: number) { if (q === 0) r.render(scene, cam); else composer.render(dt); },
  };
}
