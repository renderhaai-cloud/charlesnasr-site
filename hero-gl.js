/* hero-gl.js — the cloud reacts to the cursor like smoke. Plain WebGL, no library.
   Falls back to the static <picture> whenever WebGL is unavailable or motion is reduced. */
(function () {
  'use strict';
  var d = document.documentElement;
  var canvas = document.getElementById('heroGl');
  var media = document.getElementById('heroMedia');
  var hero = document.getElementById('hero');
  if (!canvas || !media || !hero || d.classList.contains('reduced')) return;
  var gl = null;
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
  if (!gl) return;

  var VERT = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=vec2(p.x*0.5+0.5,0.5-p.y*0.5);gl_Position=vec4(p,0.0,1.0);}';
  var FRAG = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'uniform sampler2D tex;uniform vec2 res;uniform vec2 texRes;uniform float time;uniform vec2 mouse;uniform vec2 vel;uniform float strength;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
    'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.1+vec2(17.0,9.0);a*=0.5;}return v;}',
    'vec2 cover(vec2 uv){float ra=res.x/res.y;float ta=texRes.x/texRes.y;vec2 s=vec2(1.0);if(ra>ta){s.y=ta/ra;}else{s.x=ra/ta;}return (uv-0.5)*s+0.5;}',
    'void main(){',
    ' vec2 uv=vUv;',
    ' vec4 base=texture2D(tex,cover(uv));',
    ' float luma=dot(base.rgb,vec3(0.3,0.59,0.11));',
    ' float n1=fbm(uv*3.0+vec2(time*0.07,time*0.03));',
    ' float n2=fbm(uv*3.0-vec2(time*0.05,time*0.06)+5.0);',
    ' vec2 drift=(vec2(n1,n2)-0.5)*0.014*(0.15+luma);',
    ' vec2 asp=vec2(res.x/res.y,1.0);',
    ' float dist=distance(uv*asp,mouse*asp);',
    ' float infl=smoothstep(0.38,0.0,dist)*strength;',
    ' vec2 disp=drift+vel*infl*0.3+(vec2(n1,n2)-0.5)*infl*0.08;',
    ' float ca=clamp(length(disp)*0.6,0.0,0.006);',
    ' vec3 col;',
    ' col.r=texture2D(tex,cover(uv+disp*(1.0+ca*4.0))).r;',
    ' col.g=texture2D(tex,cover(uv+disp)).g;',
    ' col.b=texture2D(tex,cover(uv+disp*(1.0-ca*4.0))).b;',
    ' gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['tex', 'res', 'texRes', 'time', 'mouse', 'vel', 'strength'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  var texW = 16, texH = 9, ready = false;

  function loadTexture() {
    var tall = window.innerWidth < 700;
    var src = tall ? 'assets/img/hero-cloud-m-1080.jpg' : 'assets/img/hero-cloud-1600.jpg';
    var img = new Image();
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      texW = img.naturalWidth; texH = img.naturalHeight; ready = true;
      media.classList.add('gl');
    };
    img.onerror = function () { ready = false; media.classList.remove('gl'); };
    img.src = src;
  }
  loadTexture();

  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    var w = media.clientWidth, h = media.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  var lastTall = window.innerWidth < 700;
  window.addEventListener('resize', function () {
    resize();
    var tall = window.innerWidth < 700;
    if (tall !== lastTall) { lastTall = tall; loadTexture(); }
  });

  var mouse = { x: 0.5, y: 0.45 }, target = { x: 0.5, y: 0.45 }, vel = { x: 0, y: 0 }, strength = 0, wantStrength = 0, prev = null;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    hero.addEventListener('pointermove', function (e) {
      var r = media.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      target.x = x; target.y = y;
      if (prev) { vel.x += (x - prev.x) * 1.6; vel.y += (y - prev.y) * 1.6; }
      prev = { x: x, y: y };
      wantStrength = 1;
    });
    hero.addEventListener('pointerleave', function () { wantStrength = 0; prev = null; });
  }

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  var start = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!ready || !visible || document.hidden) return;
    var t = (now - start) / 1000;
    mouse.x += (target.x - mouse.x) * 0.12; mouse.y += (target.y - mouse.y) * 0.12;
    vel.x *= 0.9; vel.y *= 0.9;
    strength += (wantStrength - strength) * 0.06;
    gl.uniform1i(U.tex, 0);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform2f(U.texRes, texW, texH);
    gl.uniform1f(U.time, t);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform2f(U.vel, Math.max(-0.35, Math.min(0.35, vel.x)), Math.max(-0.35, Math.min(0.35, vel.y)));
    gl.uniform1f(U.strength, strength);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  requestAnimationFrame(frame);
})();
