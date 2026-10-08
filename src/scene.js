/**
 * The world — Excavation · Unbuilt City · Section Cut · Living Monolith · Clay
 *
 * One sculpted clay monolith stays centred for the whole site and transforms with
 * scroll. The camera descends a shaft of carved strata; monolithic volumes along the
 * way draw themselves as section lines, then fill and carve open as you pass. The
 * cursor presses into the clay and reveals finished stone beneath. Progress is
 * periodic, so the descent loops from the deepest chamber back to the surface.
 */
import * as THREE from "three";

export const DEPTH = 150;
const ss = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- shared GLSL ----------
const NOISE = `
float hash(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
`;

// ---------- monolith ----------
const MONO_VERT = `
uniform float uTime, uBump, uMorph, uSplit, uHitStrength, uTwist;
uniform vec3 uHit;
varying vec3 vWorld, vNormal, vObj; varying float vCarve;
${NOISE}
const vec3 N0 = normalize(vec3( 0.9, 0.2, 0.4));
const vec3 N1 = normalize(vec3(-0.7, 0.5,-0.5));
const vec3 N2 = normalize(vec3( 0.2,-0.8, 0.6));
const vec3 N3 = normalize(vec3(-0.4,-0.3,-0.9));
const vec3 N4 = normalize(vec3( 0.6, 0.9,-0.3));
float niche(vec3 n, vec3 d, float w){ return smoothstep(w, 0.985, dot(n,d)); }
float disp(vec3 n, out float carve){
  float r = 1.0 + (fbm(n*1.9 + uTime*0.02) - 0.5) * 0.55 * uBump;
  float c = niche(n,N0,0.72)+niche(n,N1,0.78)+niche(n,N2,0.80)+niche(n,N3,0.74)+niche(n,N4,0.82);
  c = min(c, 1.0) * uMorph;
  r -= c * 0.55;
  r += sin(n.y*22.0 + fbm(n*3.0)*5.0) * 0.012 * uMorph;   // tool marks / strata
  carve = c;
  return r;
}
void main(){
  vec3 n = normalize(position);
  float c; float r = disp(n, c);
  vec3 p = n * r;
  // twist
  float a = p.y * uTwist; p.xz = mat2(cos(a),-sin(a),sin(a),cos(a)) * p.xz;
  // split
  p.x += sign(n.x) * uSplit * 0.42;
  p.z += sign(n.z) * uSplit * 0.12;
  // normal by finite differences on the displaced surface
  vec3 t1 = normalize(cross(n, abs(n.y) < 0.95 ? vec3(0,1,0) : vec3(1,0,0)));
  vec3 t2 = cross(n, t1);
  float e = 0.012; float c1, c2;
  vec3 n1 = normalize(n + t1*e), n2 = normalize(n + t2*e);
  vec3 p1 = n1 * disp(n1, c1), p2 = n2 * disp(n2, c2);
  vec3 nn = normalize(cross(p1 - n*r, p2 - n*r));
  // clay dent at cursor
  vec4 w = modelMatrix * vec4(p, 1.0);
  float d = exp(-dot(w.xyz - uHit, w.xyz - uHit) * 9.0) * uHitStrength;
  p -= nn * d * 0.14;
  w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz; vObj = p; vCarve = c;
  vNormal = normalize(mat3(modelMatrix) * nn);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const MONO_FRAG = `
precision highp float;
uniform float uTime, uReveal, uDissolve, uHitStrength, uLineMix;
uniform vec3 uHit, uCam, uKeyPos, uKeyCol, uRimCol, uAccent, uClay;
varying vec3 vWorld, vNormal, vObj; varying float vCarve;
${NOISE}
void main(){
  // dissolve into dust
  float dn = fbm(vObj * 2.6 + 3.0);
  float edge = uDissolve * 1.25 - 0.1;
  if (dn < edge) discard;
  float glow = smoothstep(edge + 0.08, edge, dn);

  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCam - vWorld);
  vec3 L = normalize(uKeyPos - vWorld);
  float lam = max(dot(N, L), 0.0);
  float half_ = dot(N, L) * 0.5 + 0.5;
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 28.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float ao = 1.0 - vCarve * 0.55;

  // clay with faint hand marks
  float marks = fbm(vObj * 9.0) * 0.12;
  vec3 clay = uClay * (0.9 + marks) ;
  // finished stone: dark warm marble with bronze veins
  float vein = pow(fbm(vObj * 3.2 + vec3(0.0, uTime*0.02, 0.0)), 3.0);
  vec3 stone = mix(vec3(0.10,0.085,0.075), uAccent, smoothstep(0.08, 0.5, vein));
  float rev = smoothstep(0.95, 0.15, distance(vWorld, uHit)) * uReveal;
  vec3 base = mix(clay, stone, rev);
  float gloss = mix(0.08, 0.6, rev);

  vec3 col = base * (0.32 + half_ * 1.15 * uKeyCol) * ao;
  col += uRimCol * fres * 0.7;
  col += spec * gloss * uKeyCol;
  col += uAccent * glow * 1.6;
  col = mix(col, uAccent * 0.9, uLineMix * 0.0);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------- volumes (unbuilt city, section cut) ----------
const VOL_VERT = `
varying vec3 vObj, vWorld, vNormal;
void main(){ vObj = position; vec4 w = modelMatrix*vec4(position,1.0); vWorld = w.xyz; vNormal = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*w; }`;
const VOL_FRAG = `
precision highp float;
uniform float uCarve, uFill, uSeed; uniform vec3 uKeyPos, uCol, uFogCol; uniform float uFogD, uCamY;
varying vec3 vObj, vWorld, vNormal;
${NOISE}
void main(){
  vec3 an = abs(vNormal);
  vec2 uv = an.z > an.x && an.z > an.y ? vObj.xy : (an.x > an.y ? vObj.zy : vObj.xz);
  vec2 g = fract(uv * 0.5 + 0.5);
  vec2 id = floor(uv * 0.5 + 0.5);
  float cell = hash(vec3(id, uSeed));
  float open = step(0.16, g.x) * step(g.x, 0.84) * step(0.12, g.y) * step(g.y, 0.88);
  if (open > 0.5 && cell < uCarve * 0.55) discard;
  vec3 L = normalize(uKeyPos - vWorld);
  float lam = max(dot(normalize(vNormal), L), 0.0) * 0.8 + 0.2;
  vec3 col = uCol * lam;
  // light leaking from inside through the carved openings
  float rim = (1.0 - open) * smoothstep(0.0, 0.08, min(min(g.x, 1.0-g.x), min(g.y, 1.0-g.y)));
  col += vec3(1.0, 0.75, 0.5) * (1.0 - rim) * uCarve * 0.12;
  float dist = distance(vWorld, vec3(0.0, uCamY, 7.0));
  float fog = 1.0 - exp(-dist * dist * uFogD);
  col = mix(col, uFogCol, fog);
  gl_FragColor = vec4(col, uFill);
}`;

// ---------- shaft (excavation strata) ----------
const SHAFT_VERT = `varying vec3 vWorld; varying vec3 vN; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vWorld = w.xyz; vN = normal; gl_Position = projectionMatrix*viewMatrix*w; }`;
const SHAFT_FRAG = `
precision highp float;
uniform float uCamY, uFogD, uTime; uniform vec3 uFogCol, uKeyPos;
varying vec3 vWorld;
${NOISE}
void main(){
  float band = floor(vWorld.y * 0.45 + fbm(vWorld * 0.35) * 2.0);
  float tone = 0.35 + hash(vec3(band, 1.0, 2.0)) * 0.35;
  vec3 warm = vec3(0.42, 0.33, 0.25), cool = vec3(0.30, 0.30, 0.33);
  vec3 col = mix(cool, warm, hash(vec3(band, 7.0, 3.0))) * tone;
  col *= 0.75 + fbm(vWorld * 1.4) * 0.5;                              // grain
  float crack = smoothstep(0.04, 0.0, abs(fract(vWorld.y * 0.45 + fbm(vWorld*0.35)*2.0) - 0.5) - 0.46);
  col *= 1.0 - crack * 0.6;
  // key light falloff
  float d = distance(vWorld, uKeyPos);
  col *= 0.15 + 2.2 / (1.0 + d * d * 0.02);
  float dist = distance(vWorld, vec3(0.0, uCamY, 7.0));
  float fog = 1.0 - exp(-dist * dist * uFogD);
  col = mix(col, uFogCol, fog);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------- keyframes along the descent ----------
// mono: x,y,z offset from camera target, scale, bump, morph, split, dissolve, twist, lines(0..1 wire)
const KEYS = [
  { p: 0.00, bg: "#09090b", fogD: 0.0040, mono: [2.8, 0.2, -2.4, 1.15, 0.7, 0.6, 0.0, 0.0, 0.0, 1.0] },
  { p: 0.06, bg: "#0b0b0d", fogD: 0.0038, mono: [2.8, 0.2, -2.4, 1.2, 0.75, 0.75, 0.0, 0.0, 0.0, 0.0] },
  { p: 0.17, bg: "#141110", fogD: 0.0034, mono: [-2.6, 0.3, -3.5, 0.75, 0.80, 0.55, 0.0, 0.0, 0.2, 0.0] },
  { p: 0.26, bg: "#1b140f", fogD: 0.0030, mono: [-3.4, 0.6, -5.0, 0.55, 0.85, 1.00, 0.0, 0.0, 0.4, 0.0] },
  { p: 0.58, bg: "#2a1711", fogD: 0.0026, mono: [-3.6, 0.8, -6.0, 0.55, 0.85, 1.00, 0.0, 0.0, 1.2, 0.0] },
  { p: 0.68, bg: "#17161a", fogD: 0.0030, mono: [2.4, 0.0, -2.5, 0.95, 0.6, 0.6, 0.9, 0.0, 0.0, 0.0] },
  { p: 0.80, bg: "#111214", fogD: 0.0034, mono: [0.0, 0.2, -4.0, 1.20, 0.9, 1.0, 0.0, 0.0, 0.0, 0.0] },
  { p: 0.88, bg: "#0d0c0c", fogD: 0.0040, mono: [2.2, 0.4, -3.0, 0.8, 0.5, 0.3, 0.0, 0.0, 0.0, 0.6] },
  { p: 0.95, bg: "#060606", fogD: 0.0060, mono: [0.0, 0.0, -2.2, 1.00, 0.5, 0.2, 0.0, 0.85, 0.0, 0.0] },
  { p: 1.00, bg: "#040404", fogD: 0.0120, mono: [2.8, 0.2, -2.4, 1.15, 0.7, 0.6, 0.0, 1.0, 0.0, 1.0] },
];

export function createScene(canvas, { projectImages, lowPower = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#09090b");
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 90);
  camera.position.set(0, 0, 7);

  const rng = mulberry32(5);
  const keyPos = new THREE.Vector3(3, 3, 4);
  const fogCol = new THREE.Color("#09090b");
  const accent = new THREE.Color("#c9a27a");

  // ----- monolith -----
  const monoU = {
    uTime: { value: 0 }, uBump: { value: 0.6 }, uMorph: { value: 0 }, uSplit: { value: 0 }, uTwist: { value: 0 },
    uHit: { value: new THREE.Vector3(99, 99, 99) }, uHitStrength: { value: 0 }, uReveal: { value: 0 }, uDissolve: { value: 0 }, uLineMix: { value: 0 },
    uCam: { value: camera.position }, uKeyPos: { value: keyPos }, uKeyCol: { value: new THREE.Color("#ffeedd") },
    uRimCol: { value: new THREE.Color("#8fa3b8") }, uAccent: { value: accent }, uClay: { value: new THREE.Color("#9d958c") },
  };
  const monoGeo = new THREE.IcosahedronGeometry(1, lowPower ? 48 : 96);
  const mono = new THREE.Mesh(monoGeo, new THREE.ShaderMaterial({ uniforms: monoU, vertexShader: MONO_VERT, fragmentShader: MONO_FRAG }));
  scene.add(mono);
  // section lines of the monolith
  const wireU = { ...monoU, uLineMix: { value: 1 } };
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 14)),
    new THREE.ShaderMaterial({ uniforms: wireU, vertexShader: MONO_VERT, fragmentShader: `precision highp float; uniform float uLineMix; uniform vec3 uAccent; void main(){ gl_FragColor = vec4(uAccent, uLineMix*0.55); }`, transparent: true, depthWrite: false })
  );
  wire.scale.setScalar(1.004);
  scene.add(wire);
  const proxy = new THREE.Mesh(new THREE.SphereGeometry(1.02, 24, 16), new THREE.MeshBasicMaterial({ visible: false }));
  scene.add(proxy);

  // ----- shaft -----
  const shaftU = { uCamY: { value: 0 }, uFogD: { value: 0.004 }, uTime: { value: 0 }, uFogCol: { value: fogCol }, uKeyPos: { value: keyPos } };
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 16, DEPTH + 80, 48, 1, true),
    new THREE.ShaderMaterial({ uniforms: shaftU, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, side: THREE.BackSide })
  );
  shaft.position.y = -DEPTH / 2;
  scene.add(shaft);

  // ----- volumes -----
  const volumes = [];
  const volCount = lowPower ? 22 : 46;
  const lineMat = () => new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0 });
  for (let i = 0; i < volCount; i++) {
    const w = 1.2 + rng() * 3.2, h = 2 + rng() * 8, d = 1.2 + rng() * 3;
    const y = -8 - rng() * (DEPTH - 16);
    const inWork = y < -0.23 * DEPTH && y > -0.62 * DEPTH;
    const side = rng() < 0.5 ? -1 : 1;
    const x = side * ((inWork ? 7.5 : 6) + rng() * 7), z = -(5 + rng() * 14);
    const geo = new THREE.BoxGeometry(w, h, d);
    const u = { uCarve: { value: 0 }, uFill: { value: 0 }, uSeed: { value: rng() * 100 }, uKeyPos: { value: keyPos }, uCol: { value: new THREE.Color().setHSL(0.07, 0.10, 0.22 + rng() * 0.14) }, uFogCol: { value: fogCol }, uFogD: { value: 0.004 }, uCamY: { value: 0 } };
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VOL_VERT, fragmentShader: VOL_FRAG, transparent: true }));
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat());
    const g = new THREE.Group();
    g.add(mesh, lines);
    g.position.set(x, y, z);
    g.rotation.y = rng() * Math.PI;
    g.userData = { u, lines, phase: rng() * 6.28 };
    scene.add(g); volumes.push(g);
  }

  // ----- project chambers (renders) -----
  const loader = new THREE.TextureLoader();
  const chambers = projectImages.map((src, i) => {
    const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0 }));
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(7.6, 5.0)), lineMat());
    m.add(frame); m.userData = { frame };
    scene.add(m); return m;
  });

  // ----- dust -----
  const dustCount = lowPower ? 500 : 1500;
  const dpos = new Float32Array(dustCount * 3), dseed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) { dpos[i*3] = (rng()-.5)*24; dpos[i*3+1] = -rng()*(DEPTH+30)+10; dpos[i*3+2] = (rng()-.5)*20; dseed[i] = rng(); }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dseed, 1));
  const dustU = { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uVel: { value: 0 }, uMouse: { value: new THREE.Vector3(0, 0, 0) } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSeed; uniform float uTime,uPR,uVel; uniform vec3 uMouse; varying float vA;
      void main(){ vec3 p = position; p.x += sin(uTime*0.25+aSeed*6.28)*0.5; p.y += cos(uTime*0.2+aSeed*6.28)*0.4;
        vec3 away = p - uMouse; float dm = length(away); p += normalize(away) * smoothstep(3.0, 0.0, dm) * 1.2;
        vec4 mv = modelViewMatrix*vec4(p,1.0); float d = -mv.z;
        gl_PointSize = (1.0+aSeed*2.0)*uPR*(14.0/max(d,1.0)); vA = smoothstep(30.0,3.0,d)*(0.3+aSeed*0.5)*(1.0+uVel);
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vA; void main(){ float r=length(gl_PointCoord-0.5); if(r>0.5) discard; gl_FragColor=vec4(0.95,0.85,0.7,vA*smoothstep(0.5,0.1,r)); }`,
  }));
  scene.add(dust);

  // ----- state -----
  const state = { progress: 0, smooth: 0, vel: 0, mouse: new THREE.Vector2(), mouseS: new THREE.Vector2(), work: null, paused: false, press: 0, hover: 0 };
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();

  function keyAt(p) {
    let i = 1; while (i < KEYS.length - 1 && KEYS[i].p < p) i++;
    const a = KEYS[i - 1], b = KEYS[i];
    const t = THREE.MathUtils.smoothstep((p - a.p) / (b.p - a.p), 0, 1);
    return { t, a, b };
  }
  const lerpArr = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 860 ? 62 : 50; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);
  addEventListener("pointermove", e => { state.mouse.set(e.clientX / innerWidth - 0.5, -(e.clientY / innerHeight - 0.5)); ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); }, { passive: true });
  addEventListener("pointerdown", () => { state.press = 1; });
  addEventListener("pointerup", () => { state.press = 0; });

  const clock = new THREE.Clock();
  let last = 0, hitStrength = 0, reveal = 0;
  const monoPos = new THREE.Vector3(), monoTarget = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (state.paused) return;
    const t = clock.getElapsedTime();
    state.smooth += (state.progress - state.smooth) * 0.085;
    // handle the loop seam: if the target wrapped, snap
    if (Math.abs(state.progress - state.smooth) > 0.5) state.smooth = state.progress;
    state.vel += ((state.smooth - last) * 60 - state.vel) * 0.1; last = state.smooth;
    state.mouseS.lerp(state.mouse, 0.06);
    const p = state.smooth, camY = -p * DEPTH;

    // camera: descending, with parallax and sway
    camera.position.set(state.mouseS.x * 1.0 + Math.sin(t * 0.25) * 0.12, camY + state.mouseS.y * 0.6 + Math.cos(t * 0.2) * 0.08, 7);
    camera.rotation.set(state.mouseS.y * 0.04 - 0.06, -state.mouseS.x * 0.06, Math.sin(t * 0.17) * 0.008 + state.vel * -0.03);
    camera.fov = (innerWidth < 860 ? 62 : 50) + Math.min(Math.abs(state.vel) * 50, 9); camera.updateProjectionMatrix();
    keyPos.set(camera.position.x + 3.5, camY + 3, 4.5);

    // keyframes
    const { t: kt, a, b } = keyAt(p);
    const m = lerpArr(a.mono, b.mono, kt);
    tmpC.set(a.bg).lerp(tmpC2.set(b.bg), kt);
    scene.background.copy(tmpC); fogCol.copy(tmpC);
    const fogD = a.fogD + (b.fogD - a.fogD) * kt;
    shaftU.uCamY.value = camY; shaftU.uFogD.value = fogD; shaftU.uTime.value = t;

    // monolith
    monoTarget.set(m[0], camY + m[1], m[2]);
    if (innerWidth < 860) monoTarget.set(m[0] * 0.3, camY + m[1] + 2.1, m[2] - 1.2);
    monoPos.lerp(monoTarget, 0.08);
    mono.position.copy(monoPos); wire.position.copy(monoPos); proxy.position.copy(monoPos);
    const sc = m[3] * (innerWidth < 860 ? 0.8 : 1);
    mono.scale.setScalar(sc); wire.scale.setScalar(sc * 1.004); proxy.scale.setScalar(sc);
    const rotY = p * Math.PI * 3.2 + t * 0.06 + state.mouseS.x * 0.5, rotX = Math.sin(t * 0.15) * 0.08 + state.mouseS.y * -0.35;
    mono.rotation.set(rotX, rotY, 0); wire.rotation.copy(mono.rotation); proxy.rotation.copy(mono.rotation);
    monoU.uTime.value = t; monoU.uBump.value = m[4]; monoU.uMorph.value = m[5]; monoU.uSplit.value = m[6]; monoU.uDissolve.value = m[7]; monoU.uTwist.value = m[8];
    wireU.uLineMix.value = m[9];

    // clay: cursor press + reveal
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(proxy, false)[0];
    const want = hit ? 0.5 + state.press * 0.8 : 0;
    hitStrength += (want - hitStrength) * 0.12; reveal += ((hit ? 1 : 0) - reveal) * 0.08;
    if (hit) monoU.uHit.value.lerp(hit.point, 0.35);
    monoU.uHitStrength.value = hitStrength; monoU.uReveal.value = reveal;
    dustU.uMouse.value.copy(hit ? hit.point : new THREE.Vector3(camera.position.x + state.mouseS.x * 6, camY + state.mouseS.y * 4, 2));

    // volumes: draw as lines when far, fill and carve as you pass
    for (const g of volumes) {
      const dy = Math.abs(g.position.y - camY);
      const near = 1 - ss(dy, 6, 26);
      const u = g.userData.u;
      u.uFill.value = near * 0.9; u.uCarve.value = (1 - ss(dy, 3, 14)) * 0.85; u.uFogD.value = fogD; u.uCamY.value = camY;
      g.userData.lines.material.opacity = (1 - ss(dy, 14, 42)) * (1 - near * 0.85) * 0.6;
      g.position.y += Math.sin(t * 0.3 + g.userData.phase) * 0.0015;
      if (innerWidth < 860) { u.uFill.value *= 0.5; g.userData.lines.material.opacity *= 0.5; }
    }

    // chambers: the active project's render floats ahead; others wait around the shaft
    chambers.forEach((c, i) => {
      if (!state.work) { c.material.opacity += (0 - c.material.opacity) * 0.1; c.userData.frame.material.opacity = c.material.opacity * 0.6; return; }
      const d = i - state.work.index - state.work.local;
      const vis = Math.max(0, 1 - Math.abs(d));
      c.material.opacity += (vis * 0.95 - c.material.opacity) * 0.12;
      c.userData.frame.material.opacity = Math.max(0, 1 - Math.abs(d) * 0.6) * 0.8 - vis * 0.6;
      const mobile = innerWidth < 860;
      c.position.set((mobile ? 0.3 : 2.6) + d * 6 + state.mouseS.x * -0.5, camY + (mobile ? 1.2 : 0.3) + Math.sin(t * 0.5 + i) * 0.08 + state.mouseS.y * -0.3, -3 - Math.abs(d) * 2.5);
      c.rotation.set(state.mouseS.y * 0.06, -d * 0.4 + state.mouseS.x * 0.08, 0);
      c.scale.setScalar(mobile ? 0.6 : 1);
    });

    dustU.uTime.value = t; dustU.uVel.value = Math.min(Math.abs(state.vel) * 3, 2);
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
  return function () { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
