/**
 * The world — one continuous Three.js scene the whole page scrolls through.
 * Camera travels down a corridor of floating stone slabs (textured with project
 * imagery), through dust, toward a warm light. Everything is a function of
 * scroll progress (0..1) so scrolling back plays it in reverse.
 */
import * as THREE from "three";

const LENGTH = 140;                        // world depth the camera travels
const SECTION_TINTS = [                    // [progress, background colour]
  [0.00, "#0b0b0c"], [0.12, "#121010"], [0.22, "#1a1410"], [0.45, "#2a1612"],
  [0.62, "#15151a"], [0.78, "#101214"], [0.90, "#0d0c0b"], [1.00, "#090909"],
];

export function createScene(canvas, { images, projectImages, lowPower = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0b0b0c");
  scene.fog = new THREE.FogExp2("#0b0b0c", 0.055);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  camera.position.set(0, 0, 0);

  const loader = new THREE.TextureLoader();
  const tex = src => { const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const textures = images.map(tex);

  // --- lights ---------------------------------------------------------
  scene.add(new THREE.AmbientLight("#8c7a68", 0.35));
  const key = new THREE.PointLight("#ffd9b0", 60, 40, 1.6); key.position.set(3, 3, -4); scene.add(key);
  const rim = new THREE.PointLight("#8aa0b8", 25, 30, 1.8); rim.position.set(-4, -2, -6); scene.add(rim);
  const far = new THREE.PointLight("#ffb074", 400, 90, 1.5); far.position.set(0, 1.5, -LENGTH - 8); scene.add(far);

  // --- slabs ----------------------------------------------------------
  const slabGroup = new THREE.Group(); scene.add(slabGroup);
  const rng = mulberry32(11);
  const slabs = [];
  const slabCount = lowPower ? 26 : 54;
  for (let i = 0; i < slabCount; i++) {
    const w = 1.2 + rng() * 3.2, h = w * (0.6 + rng() * 0.9);
    const geo = new THREE.PlaneGeometry(w, h, 1, 1);
    const t = textures[Math.floor(rng() * textures.length)];
    const mat = new THREE.MeshStandardMaterial({
      map: t, color: new THREE.Color().setHSL(0.08, 0.15, 0.35 + rng() * 0.25), roughness: 0.9, metalness: 0.05,
      side: THREE.DoubleSide, transparent: true, opacity: 0.92,
    });
    const m = new THREE.Mesh(geo, mat);
    const side = rng() < 0.5 ? -1 : 1;
    const x = side * (2.6 + rng() * 5.5), y = (rng() - 0.5) * 7, z = -4 - rng() * (LENGTH - 8);
    m.position.set(x, y, z);
    m.rotation.set((rng() - 0.5) * 0.5, side * (0.5 + rng() * 0.8), (rng() - 0.5) * 0.4);
    m.userData = { base: m.position.clone(), rot: m.rotation.clone(), phase: rng() * Math.PI * 2, amp: 0.15 + rng() * 0.35, spin: (rng() - 0.5) * 0.08 };
    slabGroup.add(m); slabs.push(m);
  }

  // --- project planes (one per project, centred in the corridor) --------
  const projectGroup = new THREE.Group(); scene.add(projectGroup);
  const projectPlanes = projectImages.map((src, i) => {
    const t = tex(src);
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, fog: true });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.2), mat);
    m.position.set(2.4, 0, -10);
    m.userData = { i };
    projectGroup.add(m);
    return m;
  });

  // --- dust -------------------------------------------------------------
  const dustCount = lowPower ? 500 : 1600;
  const dustGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(dustCount * 3), seed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    pos[i * 3] = (rng() - 0.5) * 20; pos[i * 3 + 1] = (rng() - 0.5) * 12; pos[i * 3 + 2] = -rng() * (LENGTH + 20);
    seed[i] = rng();
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uVel: { value: 0 } },
    vertexShader: `
      attribute float aSeed; uniform float uTime; uniform float uPixelRatio; uniform float uVel; varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.3 + aSeed*6.28)*0.4; p.y += cos(uTime*0.25 + aSeed*6.28)*0.3;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        float d = -mv.z;
        gl_PointSize = (1.2 + aSeed*2.2) * uPixelRatio * (12.0/max(d,1.0));
        vA = smoothstep(30.0, 4.0, d) * (0.35 + aSeed*0.5) * (1.0 + uVel*1.5);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main(){ float r = length(gl_PointCoord-0.5); if(r>0.5) discard; gl_FragColor = vec4(0.95,0.85,0.7, vA*smoothstep(0.5,0.1,r)); }`,
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  // --- state ------------------------------------------------------------
  const state = { progress: 0, smooth: 0, vel: 0, mouse: new THREE.Vector2(), mouseS: new THREE.Vector2(), work: null, paused: false };
  const bg = new THREE.Color(), tmp = new THREE.Color();

  function tintAt(p) {
    for (let i = 1; i < SECTION_TINTS.length; i++) {
      const [p0, c0] = SECTION_TINTS[i - 1], [p1, c1] = SECTION_TINTS[i];
      if (p <= p1) { const t = (p - p0) / (p1 - p0); return bg.set(c0).lerp(tmp.set(c1), THREE.MathUtils.smoothstep(t, 0, 1)); }
    }
    return bg.set(SECTION_TINTS.at(-1)[1]);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < 860 ? 68 : 55; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener("resize", resize);
  window.addEventListener("pointermove", e => { state.mouse.set(e.clientX / innerWidth - 0.5, -(e.clientY / innerHeight - 0.5)); }, { passive: true });

  const clock = new THREE.Clock();
  let lastSmooth = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (state.paused) return;
    const t = clock.getElapsedTime();
    state.smooth += (state.progress - state.smooth) * 0.08;
    state.vel += ((state.smooth - lastSmooth) * 60 - state.vel) * 0.1; lastSmooth = state.smooth;
    state.mouseS.lerp(state.mouse, 0.05);

    // camera along the corridor + parallax + sway
    const z = -state.smooth * LENGTH;
    camera.position.set(state.mouseS.x * 1.2 + Math.sin(t * 0.3) * 0.15, state.mouseS.y * 0.8 + Math.cos(t * 0.23) * 0.1, z);
    camera.rotation.set(state.mouseS.y * 0.05, -state.mouseS.x * 0.08, Math.sin(t * 0.2) * 0.01 + state.vel * -0.02);
    camera.fov = (innerWidth < 860 ? 68 : 55) + Math.min(Math.abs(state.vel) * 40, 8); camera.updateProjectionMatrix();
    key.position.set(camera.position.x + 3, camera.position.y + 3, z - 4);
    rim.position.set(camera.position.x - 4, camera.position.y - 2, z - 7);

    // colour
    const c = tintAt(state.smooth); scene.background.copy(c); scene.fog.color.copy(c);

    // slabs drift
    for (const m of slabs) {
      const u = m.userData;
      m.position.y = u.base.y + Math.sin(t * 0.4 + u.phase) * u.amp;
      m.position.x = u.base.x + Math.cos(t * 0.3 + u.phase) * u.amp * 0.5;
      m.rotation.y = u.rot.y + Math.sin(t * 0.2 + u.phase) * u.spin;
      m.rotation.z = u.rot.z + state.vel * 0.05;
    }

    // project planes: the active one sits ahead of the camera, others fade
    if (state.work) {
      const { index, local } = state.work;
      projectPlanes.forEach((m, i) => {
        const d = i - index - local;                     // 0 = centred, ±1 = neighbours
        const vis = Math.max(0, 1 - Math.abs(d));
        m.material.opacity += ((vis * 0.9) - m.material.opacity) * 0.12;
        m.position.z = z - 9 - d * 3.5;
        const mobile = innerWidth < 860;
        m.position.x = (mobile ? 0.4 : 2.4) + d * 5 + state.mouseS.x * -0.6;
        m.position.y = (mobile ? 1.6 : 0.2) + Math.sin(t * 0.5 + i) * 0.1 + state.mouseS.y * -0.4;
        m.rotation.y = -d * 0.35 + state.mouseS.x * 0.1;
        m.rotation.x = state.mouseS.y * 0.08;
      });
    } else {
      projectPlanes.forEach(m => { m.material.opacity += (0 - m.material.opacity) * 0.1; });
    }

    dustMat.uniforms.uTime.value = t;
    dustMat.uniforms.uVel.value = Math.min(Math.abs(state.vel) * 3, 2);
    renderer.render(scene, camera);
  }
  frame();

  return {
    state,
    setProgress: p => { state.progress = p; },
    setWork: w => { state.work = w; },
    pause: () => { state.paused = true; },
    resume: () => { state.paused = false; clock.getDelta(); },
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
