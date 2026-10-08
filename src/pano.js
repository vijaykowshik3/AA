/**
 * Hero panorama — a 360° equirectangular render you can hold and drag to look
 * around, with inertia, a slow idle drift, wheel / pinch zoom, and handwritten
 * notes anchored to elements in the room that breathe in and out of focus.
 */
import * as THREE from "three";

// Notes are placed by pixel position on the source panorama (u, v in 0..1).
export const NOTES = [
  { u: 0.452, v: 0.62, text: "Book-matched marble table,\nset on a bronze plinth" },
  { u: 0.458, v: 0.41, text: "One line of light —\na linear pendant" },
  { u: 0.548, v: 0.45, text: "Arabescato niches,\nback-lit shelves" },
  { u: 0.51, v: 0.12, text: "Vaulted timber ceiling,\nhand-finished oak" },
  { u: 0.345, v: 0.48, text: "Sheer linen, so the city\nbecomes the artwork" },
  { u: 0.832, v: 0.5, text: "A long gallery that\nends in a single piece" },
  { u: 0.53, v: 0.82, text: "Hand-knotted wool,\nsoft underfoot" },
  { u: 0.64, v: 0.38, text: "Walnut panels with\na hidden light reveal" },
  { u: 0.06, v: 0.48, text: "Living room, drenched\nin evening sun" },
];

const dirOf = (u, v, r = 1) => new THREE.Vector3(Math.cos(2 * Math.PI * u) * Math.sin(Math.PI * v), Math.cos(Math.PI * v), Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * v)).multiplyScalar(r);

export function createPano(root, { src, notesEl, reduced = false, onProgress, onLoad }) {
  const canvas = root.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(78, 1, 0.1, 100);

  const tex = new THREE.TextureLoader().load(src, () => { root.classList.add("is-loaded"); onLoad?.(); }, e => { if (e.total) onProgress?.(e.loaded / e.total); }, () => onLoad?.());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const geo = new THREE.SphereGeometry(50, 96, 64); geo.scale(-1, 1, 1);
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })));

  // view: lon/lat in degrees; u=0.5 (image centre) sits at lon 180
  const view = { lon: 180 - 6, lat: 2, vLon: 0, vLat: 0, fov: 86, tFov: 86, intro: reduced ? 1 : 0 };
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, idleAt = 0, interacted = false, active = true;
  const pinch = { d: 0 };

  // notes
  notesEl.innerHTML = NOTES.map((n, i) => `<div class="pnote" style="--d:${(i * 0.37) % 1}"><i></i><span>${n.text.replace(/\n/g, "<br/>")}</span></div>`).join("");
  const noteEls = [...notesEl.children];
  const noteDirs = NOTES.map(n => dirOf(n.u, n.v, 40));

  const onDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    view.vLon = view.vLat = 0; root.classList.add("is-dragging");
    canvas.setPointerCapture?.(e.pointerId);
    if (!interacted) { interacted = true; root.classList.add("is-touched"); }
  };
  const onMove = e => {
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(1, now - lastT);
    const k = view.fov / innerHeight;                          // degrees per pixel
    const dx = (e.clientX - lastX) * k, dy = (e.clientY - lastY) * k;
    view.lon -= dx; view.lat += e.pointerType === "touch" ? 0 : dy;
    view.vLon = -dx / dt * 16; view.vLat = e.pointerType === "touch" ? 0 : dy / dt * 16;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  };
  const onUp = () => { if (!dragging) return; dragging = false; idleAt = performance.now(); root.classList.remove("is-dragging"); };
  canvas.addEventListener("pointerdown", onDown);
  addEventListener("pointermove", onMove);
  addEventListener("pointerup", onUp);
  addEventListener("pointercancel", onUp);
  // zoom: ctrl/pinch-wheel only, so normal wheel still scrolls the page
  canvas.addEventListener("wheel", e => { if (!e.ctrlKey) return; e.preventDefault(); view.tFov = Math.min(100, Math.max(45, view.tFov + e.deltaY * 0.08)); }, { passive: false });
  canvas.addEventListener("touchmove", e => { if (e.touches.length !== 2) return; const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch.d) view.tFov = Math.min(100, Math.max(45, view.tFov - (d - pinch.d) * 0.12)); pinch.d = d; }, { passive: true });
  canvas.addEventListener("touchend", () => { pinch.d = 0; });

  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    view.tFov = w < 860 ? 92 : 86; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);

  const v3 = new THREE.Vector3(), fwd = new THREE.Vector3();
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!active) return;
    const t = clock.getElapsedTime(), now = performance.now();
    if (!dragging) {
      view.lon += view.vLon; view.lat += view.vLat;
      view.vLon *= 0.94; view.vLat *= 0.94;
      if (!reduced && now - idleAt > 2500) view.lon += 0.018;    // idle drift
    }
    view.lat = Math.max(-75, Math.min(75, view.lat));
    view.fov += (view.tFov - view.fov) * 0.08;
    // intro: start pushed in and blurred, settle out
    camera.fov = view.fov - (1 - view.intro) * 18;
    camera.updateProjectionMatrix();
    const phi = THREE.MathUtils.degToRad(90 - view.lat), th = THREE.MathUtils.degToRad(view.lon);
    fwd.set(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
    camera.lookAt(fwd);
    renderer.render(scene, camera);

    // notes: project, fade by distance from centre, breathe slowly
    const w = root.clientWidth, h = root.clientHeight;
    noteEls.forEach((el, i) => {
      const d = noteDirs[i];
      const facing = d.clone().normalize().dot(fwd);
      v3.copy(d).project(camera);
      if (facing < 0.25 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) { el.style.opacity = 0; return; }
      const x = (v3.x * 0.5 + 0.5) * w, y = (-v3.y * 0.5 + 0.5) * h;
      const centre = Math.hypot(v3.x * 0.85, v3.y);                // 0 centre .. ~1.3 edge
      const focus = 1 - Math.min(1, Math.max(0, (centre - 0.15) / 0.75));
      const breathe = 0.5 + 0.5 * Math.sin(t * 0.45 + i * 1.7);       // each note drifts in and out on its own rhythm
      const clearOfTitle = 1 - Math.min(1, Math.max(0, (y / h - 0.64) / 0.08));
      const o = Math.min(1, focus * 1.4) * (0.15 + 0.85 * breathe) * clearOfTitle * view.intro;
      el.style.opacity = o.toFixed(3);
      el.style.filter = `blur(${((1 - o) * 9).toFixed(2)}px)`;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + Math.sin(t * 0.8 + i) * 4).toFixed(1)}px, 0)`;
    });
  }
  frame();

  return {
    view,
    setActive: a => { if (a === active) return; active = a; if (a) clock.getDelta(); },
  };
}
