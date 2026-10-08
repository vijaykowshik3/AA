/**
 * Hero WebGL — "liquid stone"
 * A fullscreen fragment shader: domain-warped noise lit in the studio palette,
 * with the hero image sampled through a flowing displacement field.
 * Pointer position warps the field; scroll progress deepens it and fades out.
 * Raw WebGL1 — no library needed, ~6KB.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;      // 0..1
uniform float u_mouseVel;  // 0..1
uniform float u_scroll;    // 0..1
uniform float u_intro;     // 0..1
uniform sampler2D u_tex;
uniform vec2 u_texRes;

// --- noise ----------------------------------------------------------
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){
  float s=0.0,a=0.5;
  for(int i=0;i<5;i++){s+=a*snoise(p);p=p*2.02+vec2(3.1,1.7);a*=0.5;}
  return s;
}

// cover-fit uv for the texture
vec2 coverUV(vec2 uv, vec2 res, vec2 tex){
  float ra = res.x/res.y, ta = tex.x/tex.y;
  vec2 s = (ra > ta) ? vec2(1.0, ta/ra) : vec2(ra/ta, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main(){
  vec2 uv = v_uv;
  vec2 p = uv; p.x *= u_res.x/u_res.y;
  float t = u_time*0.08;

  // mouse influence: soft well around the pointer
  vec2 m = u_mouse; m.x *= u_res.x/u_res.y;
  float d = distance(p, m);
  float well = smoothstep(0.55, 0.0, d) * (0.35 + u_mouseVel*1.2);

  // domain warp
  vec2 q = vec2(fbm(p*1.4 + t), fbm(p*1.4 - t*0.7 + 5.2));
  vec2 r = vec2(fbm(p*1.1 + q*1.6 + t*0.6), fbm(p*1.1 + q*1.6 - t*0.4 + 8.1));
  float n = fbm(p*0.9 + r*1.2 + well*0.6);

  // displacement field for the image
  float depth = 0.012 + u_scroll*0.06 + well*0.05;
  vec2 disp = r * depth;
  vec2 tuv = coverUV(uv, u_res, u_texRes);
  tuv = (tuv - 0.5) * (1.0 + u_scroll*0.25 + (1.0-u_intro)*0.2) + 0.5;   // scale out on scroll, in on intro
  vec3 img = texture2D(u_tex, tuv + disp).rgb;

  // palette: charcoal -> bronze -> bone
  vec3 c0 = vec3(0.043,0.043,0.047);
  vec3 c1 = vec3(0.49,0.36,0.25);
  vec3 c2 = vec3(0.925,0.905,0.875);
  float k = smoothstep(-0.6, 0.7, n + well*0.5);
  vec3 tone = mix(c0, c1, smoothstep(0.0,0.75,k));
  tone = mix(tone, c2, smoothstep(0.72,1.0,k)*0.38);

  // light sweep driven by noise, revealing the image
  float sweep = smoothstep(0.35, 0.95, k);
  vec3 col = mix(img*0.55, img*1.1 + tone*0.35, sweep);
  col = mix(col, tone, 0.22);

  // edge vignette + intro fade
  float vig = smoothstep(1.35, 0.3, length(uv-0.5)*1.6);
  col *= mix(0.45, 1.0, vig);
  col *= mix(0.0, 1.0, u_intro);
  col = mix(col, c0, u_scroll*0.85);

  gl_FragColor = vec4(col, 1.0);
}`;

export function initHeroGL(canvas, imgSrc, { reduced = false } = {}) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) { canvas.style.background = `url(${imgSrc}) center/cover`; return null; }

  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); }
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ["u_res", "u_time", "u_mouse", "u_mouseVel", "u_scroll", "u_intro", "u_tex", "u_texRes"].forEach(n => U[n] = gl.getUniformLocation(prog, n));

  // texture
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([20, 18, 16]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  let texRes = [1, 1];
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    texRes = [img.naturalWidth, img.naturalHeight];
  };
  img.src = imgSrc;

  const state = { mouse: [0.5, 0.5], target: [0.5, 0.5], vel: 0, scroll: 0, intro: reduced ? 1 : 0, running: true };
  let last = [0.5, 0.5];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  };
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", e => {
    state.target = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  }, { passive: true });

  const start = performance.now();
  const frame = () => {
    if (!state.running) return;
    // ease mouse, derive velocity
    state.mouse[0] += (state.target[0] - state.mouse[0]) * 0.06;
    state.mouse[1] += (state.target[1] - state.mouse[1]) * 0.06;
    const dv = Math.hypot(state.mouse[0] - last[0], state.mouse[1] - last[1]);
    state.vel += (Math.min(dv * 40, 1) - state.vel) * 0.1;
    last = [...state.mouse];

    gl.uniform2f(U.u_res, canvas.width, canvas.height);
    gl.uniform1f(U.u_time, reduced ? 0 : (performance.now() - start) / 1000);
    gl.uniform2f(U.u_mouse, state.mouse[0], state.mouse[1]);
    gl.uniform1f(U.u_mouseVel, state.vel);
    gl.uniform1f(U.u_scroll, state.scroll);
    gl.uniform1f(U.u_intro, state.intro);
    gl.uniform2f(U.u_texRes, texRes[0], texRes[1]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.u_tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return {
    state,
    setScroll: v => { state.scroll = v; },
    setIntro: v => { state.intro = v; },
    pause: () => { state.running = false; },
    resume: () => { if (!state.running) { state.running = true; requestAnimationFrame(frame); } },
  };
}
