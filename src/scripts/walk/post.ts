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
    vhs: { value: 0 },  // 1 = a 2000s home video: soft, colour bleeding sideways, faded and warm, faint scan lines
    cine: { value: 0 }, // 1 = today: a clean cinematic grade
    res: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, vignette, grain, warmth, aberration, fade, vhs, cine; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
    const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
    void main(){
      vec2 c = vUv - 0.5; float d = dot(c, c);
      vec2 off = c * aberration * (1.0 + d * 4.0);
      vec4 col = texture2D(tDiffuse, vUv);
      col.r = texture2D(tDiffuse, vUv + off).r; col.b = texture2D(tDiffuse, vUv - off).b;
      if (vhs > 0.001) {
        // home video: a gentle sideways wobble, soft detail, and colour that smears a few pixels to the right
        vec2 px = vec2(1.0 / res.x, 0.0) * (res.x / 960.0);
        vec2 uv = vUv + vec2(sin(vUv.y * 9.0 + time * 0.8) * 0.0004, 0.0);
        vec3 soft = (texture2D(tDiffuse, uv - 2.0 * px).rgb + 2.0 * texture2D(tDiffuse, uv - px).rgb + 2.0 * texture2D(tDiffuse, uv).rgb
          + 2.0 * texture2D(tDiffuse, uv + px).rgb + texture2D(tDiffuse, uv + 2.0 * px).rgb) / 8.0;
        vec3 bleed = (texture2D(tDiffuse, uv - 1.0 * px).rgb + texture2D(tDiffuse, uv - 2.0 * px).rgb + texture2D(tDiffuse, uv - 3.0 * px).rgb) / 3.0;
        // keep most of the sharp picture: the tape look is a hint, it mustn't smear him
        vec3 yiq = vec3(mix((toYIQ * col.rgb).x, (toYIQ * soft).x, 0.5), mix((toYIQ * col.rgb).yz, (toYIQ * bleed).yz, 0.45) * 0.88);
        vec3 tape = toRGB * yiq;
        tape = tape / (1.0 + tape * 0.18) + vec3(0.03, 0.022, 0.012); // rolled-off highlights, lifted warm blacks
        tape *= 1.0 - 0.05 * (0.5 + 0.5 * cos(vUv.y * res.y * 2.094)); // scan lines every third pixel
        col.rgb = mix(col.rgb, tape, vhs);
      }
      // split tone: warm highlights, cool shadows, shifted by the time of day; stronger, teal and orange, today
      float l = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb += mix(vec3(-0.012, 0.0, 0.02), vec3(0.025, 0.012, -0.015), smoothstep(0.2, 0.8, l)) * (0.6 + warmth);
      col.rgb += cine * mix(vec3(-0.012, 0.004, 0.014), vec3(0.018, 0.006, -0.012), smoothstep(0.15, 0.7, l));
      col.rgb = mix(col.rgb, col.rgb * col.rgb * (3.0 - 2.0 * col.rgb), cine * 0.12 * step(col.rgb, vec3(1.0)));
      col.rgb *= 1.0 - (vignette + vhs * 0.1) * smoothstep(0.08, 0.62, d * 1.6);
      col.rgb += (hash(vUv * 1000.0 + fract(time * 7.0)) - 0.5) * grain * (1.0 + vhs * 3.0) * (1.0 - cine * 0.5);
      col.rgb *= 1.0 - fade; // cuts between chapters dip to black
      gl_FragColor = col;
    }`,
};

// The dissolve between chapters: the previous place, captured a moment earlier this frame, melts into the next one.
// Bright parts go first, through a soft grain, the way film burns from one shot to the next.
const Blend = {
  uniforms: { tDiffuse: { value: null }, tPrev: { value: null }, amount: { value: 0 }, gain: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse, tPrev; uniform float amount, gain; varying vec2 vUv;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
    void main(){
      vec4 next = texture2D(tDiffuse, vUv);
      vec4 prev = texture2D(tPrev, vUv) * gain;
      float l = dot(prev.rgb, vec3(0.299, 0.587, 0.114));
      float key = clamp(0.55 * (1.0 - l / (1.0 + l)) + 0.3 * noise(vUv * vec2(9.0, 6.0)) + 0.15 * noise(vUv * 40.0), 0.0, 1.0);
      float w = smoothstep(key - 0.22, key + 0.22, amount * 1.44 - 0.22);
      vec4 col = mix(prev, next, w);
      col.rgb *= 1.0 + 0.16 * sin(amount * 3.14159); // a touch of light as the shots overlap
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
  let blend: ShaderPass | undefined;
  let prev: THREE.WebGLRenderTarget | undefined;
  let blendAmount = 0, capturedExposure = 1, pending = false;
  const size = new THREE.Vector2();
  // The overlay used without the composer: the captured frame drawn over the new one, fading out.
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadMat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat);
  let width = 1, height = 1, pixelRatio = 1;
  const ensure = () => {
    if (q === 0 || composer) return;
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }); // smooth edges; without it fine detail like faces shimmers and smears
    composer = new EffectComposer(r, target);
    composer.addPass(new RenderPass(scene, cam));
    if (q === 2) {
      ao = new GTAOPass(scene, cam, 1, 1);
      ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 0.6, scale: 1, samples: 8 });
      ao.blendIntensity = 0.55; composer.addPass(ao);
    }
    blend = new ShaderPass(Blend); blend.enabled = false; composer.addPass(blend);
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.45, 1.05);
    grade = new ShaderPass(Grade);
    composer.addPass(bloom); composer.addPass(grade); composer.addPass(new OutputPass());
    composer.setPixelRatio(pixelRatio); composer.setSize(width, height);
    ao?.setSize(Math.round(width * pixelRatio * 0.5), Math.round(height * pixelRatio * 0.5));
  };
  const dispose = () => {
    composer?.passes.forEach((pass) => pass.dispose()); composer?.dispose();
    composer = undefined; ao = undefined; bloom = undefined; grade = undefined; blend = undefined;
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
    update(t: number, night: number, warmth: number, fade = 0, vhs = 0, cine = 0) {
      if (bloom) { bloom.strength = 0.08 + night * 0.12; bloom.threshold = 1.05; }
      if (grade) {
        grade.uniforms.time.value = t; grade.uniforms.warmth.value = warmth * 0.35;
        grade.uniforms.vignette.value = 0.12 + night * 0.08; grade.uniforms.fade.value = fade;
        grade.uniforms.vhs.value = vhs; grade.uniforms.cine.value = cine;
        r.getDrawingBufferSize(grade.uniforms.res.value);
      }
      // without the grade, a CSS filter gives the home-video chapter its faded warmth
      const filter = q === 0 && vhs > 0.01 ? `saturate(${(1 - 0.2 * vhs).toFixed(3)}) sepia(${(0.2 * vhs).toFixed(3)}) contrast(${(1 - 0.08 * vhs).toFixed(3)})` : '';
      if (r.domElement.style.filter !== filter) r.domElement.style.filter = filter;
      fadeLevel = fade;
    },
    /** Keep this frame's view of the scene; the next render dissolves from it by `amount` (0 = all of it). */
    capture(amount: number) {
      r.getDrawingBufferSize(size);
      if (!prev) prev = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
      else if (prev.width !== size.x || prev.height !== size.y) prev.setSize(size.x, size.y);
      r.setRenderTarget(prev); r.render(scene, cam); r.setRenderTarget(null);
      blendAmount = amount; capturedExposure = r.toneMappingExposure; pending = true;
    },
    render(dt: number) {
      const blendGain = capturedExposure / r.toneMappingExposure; // tone mapping happens after the blend, at the new exposure
      if (q === 0) {
        r.render(scene, cam); r.domElement.style.transition = 'none'; r.domElement.style.opacity = String(1 - fadeLevel);
        if (pending && prev) {
          quadMat.map = prev.texture; quadMat.opacity = 1 - blendAmount; quadMat.color.setScalar(blendGain);
          const auto = r.autoClear; r.autoClear = false; r.render(quad, quadCam); r.autoClear = auto;
        }
      } else {
        r.domElement.style.opacity = '';
        if (blend) {
          blend.enabled = pending && !!prev;
          if (blend.enabled) { blend.uniforms.tPrev.value = prev!.texture; blend.uniforms.amount.value = blendAmount; blend.uniforms.gain.value = blendGain; }
        }
        composer!.render(dt);
      }
      pending = false;
    },
    dispose() { dispose(); prev?.dispose(); prev = undefined; quad.geometry.dispose(); quadMat.dispose(); },
  };
}
