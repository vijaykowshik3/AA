/**
 * The world — the evolution of the architect's tools.
 * A dark studio void the camera descends through. Each era's tool is built from
 * primitives, appears first as gold construction lines, then materialises as
 * you arrive, floats while you read, and drifts away as you leave.
 * Everything is a function of scroll progress, which is periodic (the loop).
 */
import * as THREE from "three";
const STATIONS = [];

export const DEPTH = 120;
const ss = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const BG = [[0, "#0a0a0c"], [0.08, "#0c0b0b"], [0.35, "#120f0e"], [0.62, "#1a1310"], [0.78, "#121214"], [0.9, "#0c0c0d"], [0.96, "#050505"], [1, "#040404"]];

export function createScene(canvas, { projectImages, evo = { a: 0, b: 0 }, lowPower = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0a0a0c");
  scene.fog = new THREE.FogExp2("#0a0a0c", 0.03);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  camera.position.set(0, 0, 8);

  scene.add(new THREE.HemisphereLight("#d8cdbd", "#1a1512", 0.55));
  const key = new THREE.DirectionalLight("#ffe7cf", 2.2); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight("#7f93ad", 1.1); rim.position.set(-6, -2, -4); scene.add(rim);
  const spot = new THREE.PointLight("#ffd2a3", 40, 30, 1.8); scene.add(spot);

  // ---------- materials ----------
  const ACCENT = new THREE.Color("#c9a27a");
  const M = {
    bronze: () => new THREE.MeshStandardMaterial({ color: "#b48c62", metalness: 0.75, roughness: 0.32, transparent: true }),
    steel: () => new THREE.MeshStandardMaterial({ color: "#aeb3b8", metalness: 0.9, roughness: 0.25, transparent: true }),
    bone: () => new THREE.MeshStandardMaterial({ color: "#e4ddd0", metalness: 0.05, roughness: 0.7, transparent: true }),
    graphite: () => new THREE.MeshStandardMaterial({ color: "#2a2928", metalness: 0.3, roughness: 0.55, transparent: true }),
    wood: () => new THREE.MeshStandardMaterial({ color: "#7a5436", metalness: 0.05, roughness: 0.8, transparent: true }),
    stone: () => new THREE.MeshStandardMaterial({ color: "#8f8a82", metalness: 0.02, roughness: 0.95, transparent: true }),
    paper: () => new THREE.MeshStandardMaterial({ color: "#efe9dc", metalness: 0, roughness: 0.9, transparent: true, side: THREE.DoubleSide }),
    screen: () => new THREE.MeshStandardMaterial({ color: "#16242a", emissive: "#2a5a66", emissiveIntensity: 0.55, roughness: 0.4, transparent: true }),
    glass: () => new THREE.MeshStandardMaterial({ color: "#8fb3c7", metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.5 }),
  };
  const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, r = [0, 0, 0]) => { const m = mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(...r); return m; };
  const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, r = [0, 0, 0], seg = 24) => { const m = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.rotation.set(...r); return m; };
  const sph = (rad, mat, x = 0, y = 0, z = 0) => { const m = mesh(new THREE.SphereGeometry(rad, 24, 16), mat); m.position.set(x, y, z); return m; };
  const torus = (R, r, mat, x = 0, y = 0, z = 0, rot = [0, 0, 0]) => { const m = mesh(new THREE.TorusGeometry(R, r, 10, 40), mat); m.position.set(x, y, z); m.rotation.set(...rot); return m; };
  const edgesOf = (m) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 28), new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 })); l.position.copy(m.position); l.rotation.copy(m.rotation); l.scale.copy(m.scale); return l; };
  const pointsOf = (arr, size, color) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, sizeAttenuation: true })); };
  const lineStrip = (pts, color = ACCENT) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color, transparent: true }));
  const lineSegs = (pts, color) => new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(a => new THREE.Vector3(...a))), new THREE.LineBasicMaterial({ color, transparent: true }));

  // ---------- tool builders ----------
  const T = {
    chisel: () => { const g = new THREE.Group(); g.add(cyl(0.16, 0.2, 1.4, M.wood(), 0, 0.5)); g.add(cyl(0.2, 0.2, 0.08, M.steel(), 0, -0.2)); g.add(box(0.26, 1.3, 0.08, M.steel(), 0, -0.85)); g.add(box(0.26, 0.12, 0.08, M.bone(), 0, -1.5)); g.rotation.z = 0.5; return g; },
    plumb: () => { const g = new THREE.Group(); g.add(cyl(0.006, 0.006, 2.6, M.bone(), 0, 0.9, 0, [0, 0, 0], 6)); g.add(sph(0.12, M.bronze(), 0, 2.2)); g.add(cyl(0.22, 0.22, 0.3, M.bronze(), 0, -0.45)); g.add(cyl(0.22, 0.0, 0.5, M.bronze(), 0, -0.85)); return g; },
    square: () => { const g = new THREE.Group(); g.add(box(1.9, 0.14, 0.06, M.bronze(), 0.6, -0.8)); g.add(box(0.14, 1.9, 0.06, M.bronze(), -0.33, 0.1)); const c = new THREE.Group(); c.add(sph(0.12, M.steel(), 0, 0.9)); c.add(cyl(0.05, 0.02, 1.8, M.steel(), -0.3, 0, 0, [0, 0, 0.33])); c.add(cyl(0.05, 0.02, 1.8, M.steel(), 0.3, 0, 0, [0, 0, -0.33])); c.position.set(1.1, 0.4, 0.3); g.add(c); return g; },
    rod: () => { const g = new THREE.Group(); const a = 1.1; g.add(cyl(0.07, 0.07, 3.2, M.wood(), 0, 0, 0, [0, 0, a])); for (let i = -6; i <= 6; i++) { const r = torus(0.085, 0.012, M.bronze(), Math.sin(a) * i * 0.24, -Math.cos(a) * i * 0.24 * -1, 0, [0, 0, a]); r.rotation.set(1.5708, 0, 0); r.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), a); r.position.set(-Math.sin(a) * i * 0.24, Math.cos(a) * i * 0.24, 0); g.add(r); } return g; },
    proportion: () => { const g = new THREE.Group(); const phi = 1.618; let w = 2.4, h = w / phi, x = 0, y = 0; for (let i = 0; i < 6; i++) { g.add(lineStrip([[x - w/2, y - h/2, 0], [x + w/2, y - h/2, 0], [x + w/2, y + h/2, 0], [x - w/2, y + h/2, 0], [x - w/2, y - h/2, 0]])); const sq = h; x = x - w / 2 + sq / 2 + (w - sq); y = y; const nw = w - sq; if (i % 2 === 0) { x = x - (w - sq) / 2 - sq / 2 + (w - sq) / 2 - 0; } w = nw; h = w / phi; if (w < 0.1) break; } g.add(torus(0.95, 0.012, M.bronze(), 0, 0, 0.05)); const pl = mesh(new THREE.PlaneGeometry(2.4, 2.4 / phi), M.bone()); pl.material.opacity = 0.06; pl.position.z = -0.02; g.add(pl); g.add(cyl(0.05, 0.05, 2.6, M.bone(), 0, 0, 0.1, [0, 0, 1.5708])); return g; },
    mason: () => { const g = new THREE.Group(); g.add(cyl(0.05, 0.05, 1.6, M.wood(), -0.4, 0, 0, [0, 0, 0.4])); g.add(cyl(0.3, 0.3, 0.6, M.wood(), -0.7, 0.75, 0, [0, 0, 0.4 + 1.5708])); g.add(box(0.9, 0.04, 0.6, M.steel(), 0.9, -0.5, 0, [0, 0.3, 0])); g.add(cyl(0.05, 0.05, 0.7, M.wood(), 0.9, -0.2, -0.3, [0.4, 0, 0])); g.add(box(0.5, 0.5, 0.5, M.stone(), 0.2, -1.1, -0.5)); return g; },
    drawing: () => { const g = new THREE.Group(); const p = mesh(new THREE.PlaneGeometry(2.6, 1.8), M.paper()); p.rotation.x = -0.9; p.position.y = -0.4; g.add(p); const persp = []; for (let i = -4; i <= 4; i++) persp.push([i * 0.3, 0.9, 0], [i * 0.08, -0.9, 0]); const ls = lineSegs(persp, "#5a4a3a"); ls.rotation.x = -0.9; ls.position.set(0, -0.4, 0.01); g.add(ls); const pen = new THREE.Group(); pen.add(cyl(0.09, 0.09, 1.9, M.bone(), 0, 0, 0, [0, 0, 0], 6)); pen.add(cyl(0.09, 0.0, 0.3, M.wood(), 0, -1.1)); pen.add(cyl(0.03, 0.0, 0.1, M.graphite(), 0, -1.28)); pen.add(cyl(0.09, 0.09, 0.2, M.bronze(), 0, 1.0)); pen.rotation.set(0.3, 0, -0.5); pen.position.set(0.8, 0.5, 0.4); g.add(pen); return g; },
    model: () => { const g = new THREE.Group(); g.add(box(2.4, 0.08, 1.8, M.wood(), 0, -0.6)); const s = M.bone(); [[-0.7, 0.3, 0.6, 0.8, 0.6], [0.2, 0.5, 0.5, 1.3, 0.5], [0.9, 0.2, 0.4, 0.5, 0.9], [-0.2, 0.15, 0.4, 0.3, 0.3]].forEach(([x, h, w, d, z]) => g.add(box(w, h * 2, d, s, x, -0.56 + h, z - 0.5))); g.add(cyl(0.18, 0.18, 0.9, s, -0.8, -0.1, -0.4)); return g; },
    survey: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const a = i * 2.094; g.add(cyl(0.03, 0.03, 2.4, M.wood(), Math.cos(a) * 0.5, -0.7, Math.sin(a) * 0.5, [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4])); } g.add(cyl(0.3, 0.3, 0.12, M.bronze(), 0, 0.5)); g.add(cyl(0.09, 0.09, 1.1, M.bronze(), 0, 0.85, 0, [0.3, 0, 1.5708])); g.add(torus(0.2, 0.02, M.bronze(), 0, 0.85, 0)); return g; },
    camera: () => { const g = new THREE.Group(); g.add(box(1.6, 1.0, 0.9, M.graphite())); g.add(cyl(0.34, 0.38, 0.5, M.steel(), 0, 0, 0.65, [1.5708, 0, 0])); g.add(cyl(0.26, 0.26, 0.1, M.glass(), 0, 0, 0.92, [1.5708, 0, 0])); g.add(box(0.5, 0.14, 0.4, M.bronze(), -0.4, 0.57, 0)); g.add(cyl(0.1, 0.1, 0.16, M.bronze(), 0.5, 0.58, 0)); return g; },
    steel: () => { const g = new THREE.Group(); const s = M.steel(); g.add(box(0.5, 0.08, 2.6, s, 0, 0.5)); g.add(box(0.06, 1.0, 2.6, s)); g.add(box(0.5, 0.08, 2.6, s, 0, -0.5)); g.rotation.set(0.2, 0.6, 0.1); g.add(box(1.0, 1.0, 1.0, M.stone(), 1.3, -0.6, -0.4)); for (let i = 0; i < 4; i++) g.add(cyl(0.02, 0.02, 1.4, M.bronze(), 1.3 + (i % 2 ? 0.3 : -0.3), -0.6, -0.4 + (i < 2 ? 0.3 : -0.3))); return g; },
    sketchpad: () => { const g = new THREE.Group(); g.add(box(1.9, 1.5, 1.4, M.bone(), 0, 0, -0.5)); const sc = mesh(new THREE.PlaneGeometry(1.4, 1.05), M.screen()); sc.position.set(0, 0.05, 0.21); g.add(sc); g.add(lineStrip([[-0.4, -0.3, 0.22], [0.4, -0.3, 0.22], [0.4, 0.3, 0.22], [-0.4, 0.3, 0.22], [-0.4, -0.3, 0.22], [0.1, 0.1, 0.22], [0.4, 0.3, 0.22]], new THREE.Color("#9fe3ef"))); g.add(cyl(0.04, 0.02, 1.0, M.steel(), 1.1, -0.3, 0.6, [0.5, 0, -0.7])); return g; },
    cad: () => { const g = new THREE.Group(); g.add(box(2.0, 1.3, 0.08, M.graphite(), 0, 0.4)); const sc = mesh(new THREE.PlaneGeometry(1.84, 1.14), M.screen()); sc.position.set(0, 0.4, 0.05); g.add(sc); g.add(box(0.3, 0.5, 0.2, M.graphite(), 0, -0.45, -0.1)); g.add(box(0.9, 0.05, 0.5, M.graphite(), 0, -0.72, 0.1)); g.add(box(1.4, 0.06, 0.5, M.bone(), -0.4, -0.75, 0.9)); const mo = mesh(new THREE.SphereGeometry(0.22, 24, 12), M.bone()); mo.scale.set(1, 0.55, 1.4); mo.position.set(0.9, -0.72, 0.9); g.add(mo); const wf = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.42, 1)), new THREE.LineBasicMaterial({ color: "#9fe3ef", transparent: true })); wf.position.set(0, 0.4, 0.1); g.add(wf); g.userData.spin = wf; return g; },
    bim: () => { const g = new THREE.Group(); const s = M.bone(); for (let x = -1; x <= 1; x++) for (let y = 0; y < 4; y++) for (let z = -1; z <= 1; z++) { if ((x + y + z + 3) % 2) continue; g.add(box(0.5, 0.06, 0.5, s, x * 0.6, y * 0.5 - 0.8, z * 0.6)); } for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) g.add(cyl(0.02, 0.02, 2.0, M.bronze(), x * 0.6, 0, z * 0.6)); const pts = []; for (let i = 0; i < 60; i++) pts.push((Math.random() - .5) * 2.4, (Math.random() - .5) * 2.4, (Math.random() - .5) * 2.4); g.add(pointsOf(pts, 0.05, "#c9a27a")); return g; },
    fabrication: () => { const g = new THREE.Group(); const arm = new THREE.Group(); arm.add(cyl(0.4, 0.5, 0.2, M.graphite(), 0, -1.0)); arm.add(cyl(0.15, 0.15, 1.2, M.bone(), 0, -0.4)); arm.add(sph(0.2, M.graphite(), 0, 0.2)); arm.add(cyl(0.11, 0.11, 1.3, M.bone(), 0.5, 0.6, 0, [0, 0, -0.9])); arm.add(sph(0.16, M.graphite(), 1.0, 0.95)); arm.add(cyl(0.08, 0.04, 0.8, M.steel(), 1.2, 0.6, 0, [0, 0, 0.6])); arm.position.x = -0.8; g.add(arm); const hs = new THREE.Group(); hs.add(box(0.9, 0.45, 0.5, M.graphite())); hs.add(torus(0.42, 0.03, M.graphite(), 0, 0, -0.1, [1.5708, 0, 0])); hs.position.set(1.1, 0.7, 0); hs.rotation.y = -0.5; g.add(hs); const pts = []; for (let i = 0; i < 400; i++) { const x = (Math.random() - .5) * 1.6, z = (Math.random() - .5) * 1.0, y = Math.random() * 1.1; if (Math.abs(x) > 0.6 || Math.abs(z) > 0.3 || y > 0.9) pts.push(x + 1.0, y - 1.2, z); } g.add(pointsOf(pts, 0.03, "#9fe3ef")); return g; },
    generative: () => { const g = new THREE.Group(); const n = lowPower ? 500 : 1400; const arr = new Float32Array(n * 3), home = new Float32Array(n * 3), seed = new Float32Array(n); for (let i = 0; i < n; i++) { const lvl = Math.floor(Math.random() * 10); const w = 0.9 - lvl * 0.05; home[i*3] = (Math.random() - .5) * w; home[i*3+1] = lvl * 0.24 - 1.1 + Math.random() * 0.2; home[i*3+2] = (Math.random() - .5) * w; seed[i] = Math.random(); } const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(arr, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#d9c1a0", size: 0.035, transparent: true })); g.add(pts); g.userData.swarm = { pts, home, seed, n }; return g; },
    twin: () => { const g = new THREE.Group(); const b = M.bone(); const tower = (x, mat) => { const t = new THREE.Group(); t.add(box(0.8, 1.6, 0.6, mat, 0, 0)); t.add(box(0.5, 0.7, 0.4, mat, 0.2, 1.1, 0.1)); t.position.x = x; return t; }; g.add(tower(-0.9, b)); g.add(tower(0.9, M.glass())); const wf = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.8, 1.6, 0.6)), new THREE.LineBasicMaterial({ color: "#9fe3ef", transparent: true })); wf.position.x = 0.9; g.add(wf); const links = []; for (let i = 0; i < 7; i++) links.push([-0.5, -0.7 + i * 0.25, 0.3], [0.5, -0.7 + i * 0.25, 0.3]); g.add(lineSegs(links, ACCENT)); const bot = new THREE.Group(); bot.add(box(0.5, 0.2, 0.4, M.graphite())); bot.add(cyl(0.05, 0.05, 0.8, M.steel(), 0.1, 0.4, 0, [0, 0, 0.3])); bot.add(box(0.2, 0.2, 0.2, M.bone(), 0.35, 0.78)); bot.position.set(0, -1.3, 0.6); g.add(bot); return g; },
  };

  // ---------- build stations ----------
  const stations = STATIONS.map((st, i) => {
    const g = (T[st.tool] || T.chisel)();
    const wrap = new THREE.Group(); wrap.add(g);
    const meshes = [], lines = [], points = [], extraLines = [];
    g.traverse(o => { if (o.isMesh) meshes.push(o); else if (o.isPoints) points.push(o); else if (o.isLine || o.isLineSegments) extraLines.push(o); });
    meshes.forEach(m => { m.material.userData.base = m.material.opacity; const e = edgesOf(m); m.parent.add(e); lines.push(e); });
    wrap.userData = { meshes, lines, points, extraLines, g, side: i % 2 ? 1 : -1, phase: Math.random() * 6.28 };
    wrap.visible = false;
    scene.add(wrap);
    return wrap;
  });

  // ---------- project chambers ----------
  const loader = new THREE.TextureLoader();
  const chambers = projectImages.map(src => {
    const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0 }));
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(7.6, 5.0)), new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 }));
    m.add(frame); m.userData = { frame }; scene.add(m); return m;
  });

  // ---------- dust ----------
  const dustCount = lowPower ? 400 : 1200;
  const dp = new Float32Array(dustCount * 3), dsd = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) { dp[i*3] = (Math.random()-.5)*26; dp[i*3+1] = -Math.random()*(DEPTH+30)+10; dp[i*3+2] = (Math.random()-.5)*18; dsd[i] = Math.random(); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dsd, 1));
  const dustU = { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uVel: { value: 0 }, uMouse: { value: new THREE.Vector3() } };
  scene.add(new THREE.Points(dustGeo, new THREE.ShaderMaterial({ uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSeed; uniform float uTime,uPR,uVel; uniform vec3 uMouse; varying float vA;
      void main(){ vec3 p = position; p.x += sin(uTime*0.25+aSeed*6.28)*0.5; p.y += cos(uTime*0.2+aSeed*6.28)*0.4;
        vec3 away = p - uMouse; float dm = length(away); p += normalize(away) * smoothstep(3.0, 0.0, dm) * 1.2;
        vec4 mv = modelViewMatrix*vec4(p,1.0); float d = -mv.z; gl_PointSize = (1.0+aSeed*2.0)*uPR*(14.0/max(d,1.0)); vA = smoothstep(30.0,3.0,d)*(0.25+aSeed*0.45)*(1.0+uVel); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vA; void main(){ float r=length(gl_PointCoord-0.5); if(r>0.5) discard; gl_FragColor=vec4(0.95,0.85,0.7,vA*smoothstep(0.5,0.1,r)); }` })));

  // ---------- state ----------
  const state = { progress: 0, smooth: 0, vel: 0, mouse: new THREE.Vector2(), mouseS: new THREE.Vector2(), work: null, paused: false };
  const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
  const bgAt = p => { let i = 1; while (i < BG.length - 1 && BG[i][0] < p) i++; const [p0, c0] = BG[i - 1], [p1, c1] = BG[i]; return tmpC.set(c0).lerp(tmpC2.set(c1), ss(p, p0, p1)); };

  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 860 ? 60 : 46; camera.updateProjectionMatrix(); }
  resize(); addEventListener("resize", resize);
  addEventListener("pointermove", e => state.mouse.set(e.clientX / innerWidth - 0.5, -(e.clientY / innerHeight - 0.5)), { passive: true });

  const clock = new THREE.Clock();
  let last = 0;
  const span = 1;

  function frame() {
    requestAnimationFrame(frame);
    if (state.paused) return;
    const t = clock.getElapsedTime();
    state.smooth += (state.progress - state.smooth) * 0.085;
    if (Math.abs(state.progress - state.smooth) > 0.5) state.smooth = state.progress;
    state.vel += ((state.smooth - last) * 60 - state.vel) * 0.1; last = state.smooth;
    state.mouseS.lerp(state.mouse, 0.06);
    const p = state.smooth, camY = -p * DEPTH, mobile = innerWidth < 860;

    camera.position.set(state.mouseS.x * 0.8 + Math.sin(t * 0.25) * 0.1, camY + state.mouseS.y * 0.5 + Math.cos(t * 0.2) * 0.06, 8);
    camera.rotation.set(state.mouseS.y * 0.04, -state.mouseS.x * 0.05, Math.sin(t * 0.17) * 0.006 + state.vel * -0.02);
    camera.fov = (mobile ? 60 : 46) + Math.min(Math.abs(state.vel) * 40, 7); camera.updateProjectionMatrix();
    spot.position.set(camera.position.x + 2, camY + 2.5, 5);
    scene.background.copy(bgAt(p)); scene.fog.color.copy(scene.background);

    // ----- stations -----
    stations.forEach((w, i) => {
      const pc = evo.a + (i + 0.5) * span;
      const d = (p - pc) / span;
      const ad = Math.abs(d);
      if (ad > 1.6) { if (w.visible) w.visible = false; return; }
      w.visible = true;
      const u = w.userData;
      const solid = 1 - ss(ad, 0.35, 0.95);
      const wire = (1 - ss(ad, 0.9, 1.5)) * (1 - solid * 0.9);
      const pres = 1 - ss(ad, 0.5, 1.5);
      const side = mobile ? 0 : u.side * 2.6;
      w.position.set(side + state.mouseS.x * -0.6, camY + (mobile ? 1.3 : 0) + d * -5.5 + Math.sin(t * 0.6 + u.phase) * 0.08, 0.5 + state.mouseS.y * -0.3);
      w.scale.setScalar((mobile ? 0.7 : 1) * (0.7 + 0.3 * pres));
      u.g.rotation.set(Math.sin(t * 0.35 + u.phase) * 0.15 + state.mouseS.y * -0.25, t * 0.25 + d * 1.2 + state.mouseS.x * 0.5, Math.sin(t * 0.3 + u.phase) * 0.06);
      u.meshes.forEach(m => { m.material.opacity = m.material.userData.base * solid; });
      u.lines.forEach(l => { l.material.opacity = wire * 0.85; });
      u.points.forEach(pt => { pt.material.opacity = solid; });
      u.extraLines.forEach(l => { l.material.opacity = solid; });
      if (u.g.userData.spin) u.g.userData.spin.rotation.y = t * 0.8;
      if (u.g.userData.swarm) {
        const { pts, home, seed, n } = u.g.userData.swarm; const arr = pts.geometry.attributes.position.array; const form = solid;
        for (let k = 0; k < n; k++) { const sx = Math.sin(t * 0.7 + seed[k] * 9) * 1.4, sy = Math.cos(t * 0.5 + seed[k] * 7) * 1.2, sz = Math.sin(t * 0.6 + seed[k] * 5) * 1.2; arr[k*3] = sx + (home[k*3] - sx) * form; arr[k*3+1] = sy + (home[k*3+1] - sy) * form; arr[k*3+2] = sz + (home[k*3+2] - sz) * form; }
        pts.geometry.attributes.position.needsUpdate = true;
      }
    });

    // ----- chambers -----
    chambers.forEach((c, i) => {
      if (!state.work) { c.material.opacity += (0 - c.material.opacity) * 0.1; c.userData.frame.material.opacity = c.material.opacity * 0.6; return; }
      const d = i - state.work.index - state.work.local, vis = Math.max(0, 1 - Math.abs(d));
      c.material.opacity += (vis * 0.95 - c.material.opacity) * 0.12;
      c.userData.frame.material.opacity = Math.max(0, 1 - Math.abs(d) * 0.6) * 0.8 - vis * 0.6;
      c.position.set((mobile ? 0.3 : 2.6) + d * 6 + state.mouseS.x * -0.5, camY + (mobile ? 1.2 : 0.3) + Math.sin(t * 0.5 + i) * 0.08 + state.mouseS.y * -0.3, -2 - Math.abs(d) * 2.5);
      c.rotation.set(state.mouseS.y * 0.06, -d * 0.4 + state.mouseS.x * 0.08, 0);
      c.scale.setScalar(mobile ? 0.6 : 1);
    });

    dustU.uTime.value = t; dustU.uVel.value = Math.min(Math.abs(state.vel) * 3, 2);
    dustU.uMouse.value.set(camera.position.x + state.mouseS.x * 8, camY + state.mouseS.y * 5, 2);
    renderer.render(scene, camera);
  }
  frame();

  return { state, setProgress: p => { state.progress = p; }, setWork: w => { state.work = w; }, pause: () => { state.paused = true; }, resume: () => { state.paused = false; clock.getDelta(); } };
}
