/* 3D viewer for the exhibition study model (exported from Blender as glTF). */
let THREE, OrbitControls, GLTFLoader, RoomEnvironment;
const COARSE = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const root = document.getElementById('v3');
const MODEL = root?.dataset.model || 'model/gogeum.glb';
const VIEWS = [
  ['00_OVERVIEW', '조감', 'ISO'], ['00_TOP', '평면', 'TOP'], ['07_WALK_ENTRY', '입구에서 본 동선', 'EYE'],
  ['01_SIGNALS', 'Z1 신호연 전시', 'EYE'], ['03_IMMERSIVE', 'Z3 몰입 영상관', 'EYE'], ['04_AVATAR', 'Z4 체험 존', 'EYE'],
  ['06_EDUCATION', '교육동', 'EYE'], ['08_NEW_OUTDOOR', '야외 5B 추가 제안', 'EYE'], ['10_SERVICE', '지원시설 4실', 'EYE'],
];
const LAYERS = [['CHECK', '동선 · 구역 표시', true], ['PEOPLE', '관람객 (실제 크기)', true], ['BLACKOUT', '차광 천장', false], ['ROOFS', '한옥 지붕', false]];

if (root) boot();

function boot() {
  root.innerHTML = `<div class="win-bar"><i></i><i></i><i></i><div class="url">space-exhibit / <b>study_03.glb</b> · Blender → glTF</div><span class="sample">REAL MODEL</span></div>
  <div class="v3">
    <div class="stage" data-stage>
      <img class="poster" src="img/overview.webp" alt="전시 공간 모델 조감 렌더" data-poster>
      <div class="load" data-load><span class="mini" data-pct>3D 모델 준비 중</span><button class="btn" type="button" data-start>3D로 열기 · 1.9MB</button></div>
      <div class="hud" data-hud hidden></div>
      <button class="btn grab" type="button" data-grab hidden>3D 조작하기</button>
      <div class="measure" data-measure hidden></div>
    </div>
    <div class="v3-side">
      <div><h4>시점 · 모델에 저장된 카메라</h4><div class="views" data-views>${VIEWS.map(([k, l, t], i) => `<button type="button" data-cam="${k}" aria-pressed="${i === 0}" disabled>${l}<span>${t}</span></button>`).join('')}</div></div>
      <div class="toggles"><h4>레이어</h4>${LAYERS.map(([k, l, on]) => `<label for="ly-${k}">${l}<input class="sw" type="checkbox" id="ly-${k}" data-layer="${k}" ${on ? 'checked' : ''} disabled></label>`).join('')}</div>
      <div class="acts"><h4>도구</h4><button class="btn ghost" type="button" data-walk disabled>관람 동선 재생</button><button class="btn ghost" type="button" data-ruler disabled>치수 재기</button></div>
    </div>
  </div>`;
  const stage = root.querySelector('[data-stage]');
  let started = false;
  const start = () => { if (started) return; started = true; init(stage).catch((e) => { console.error(e); root.querySelector('[data-pct]').textContent = '이 브라우저에서 3D를 열 수 없습니다. 아래 렌더 이미지를 참고해 주세요.'; }); };
  root.querySelector('[data-start]').addEventListener('click', start);
  if (!COARSE && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '300px' });
    io.observe(stage);
  }
}

async function init(stage) {
  const $ = (s) => root.querySelector(s);
  const pct = $('[data-pct]'); $('[data-start]').hidden = true; pct.textContent = '3D 모델 불러오는 중 0%';
  [THREE, { OrbitControls }, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js')]);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!window.__capture });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(12, 30, 8); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(38, 1, 0.05, 400);
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = true; controls.enableZoom = false; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 0.3; controls.maxDistance = 120;

  const gltf = await new Promise((res, rej) => new GLTFLoader().load(MODEL, res, (e) => { if (e.total) pct.textContent = `3D 모델 불러오는 중 ${Math.round((e.loaded / e.total) * 100)}%`; }, rej));
  scene.add(gltf.scene);
  const cams = {};
  gltf.scene.traverse((o) => { if (o.isCamera) cams[o.name] = o; });
  gltf.scene.updateMatrixWorld(true);
  const layerObjs = {};
  gltf.scene.traverse((o) => { const c = o.userData?.coll || ''; LAYERS.forEach(([k]) => { if (c.includes(k)) (layerObjs[k] ||= []).push(o); }); });
  const setLayer = (k, on) => (layerObjs[k] || []).forEach((o) => (o.visible = on));
  LAYERS.forEach(([k, , on]) => setLayer(k, on));

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const walk = gltf.animations[0] ? mixer.clipAction(gltf.animations[0]) : null;
  let walking = false;

  const resize = () => { const r = stage.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); dirty = true; };
  let dirty = true; new ResizeObserver(resize).observe(stage); resize();

  renderer.domElement.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const f = Math.exp(e.deltaY * 0.0015), off = cam.position.clone().sub(controls.target).multiplyScalar(f);
    const d = off.length(); if (d < 0.4 || d > 120) return;
    cam.position.copy(controls.target).add(off); dirty = true;
  }, { passive: false });
  const grab = $('[data-grab]');
  const setGrab = (on) => { controls.enabled = on; controls.enableZoom = on && COARSE; renderer.domElement.style.touchAction = on ? 'none' : 'pan-y'; stage.style.touchAction = on ? 'none' : 'pan-y'; grab.textContent = on ? '조작 끝내기' : '3D 조작하기'; };
  if (COARSE) { grab.hidden = false; setGrab(false); grab.addEventListener('click', () => setGrab(!controls.enabled)); new IntersectionObserver(([e]) => { if (!e.isIntersecting && controls.enabled) setGrab(false); }).observe(stage); }

  // camera presets
  const hud = $('[data-hud]');
  let tween = null;
  const viewOf = (key) => {
    const c = cams[key]; if (!c) return null;
    const p = new THREE.Vector3(), d = new THREE.Vector3();
    c.getWorldPosition(p); c.getWorldDirection(d);
    const ortho = c.isOrthographicCamera;
    const dist = ortho ? Math.max(4, p.y / Math.max(0.2, -d.y)) : 3.5;
    let fov = ortho ? (key === '00_TOP' ? 46 : 40) : Math.min(72, c.fov || 60);
    const t = p.clone().add(d.multiplyScalar(dist));
    if (ortho && key !== '00_TOP') p.lerp(t, 0.3);
    return { p, t, fov };
  };
  const go = (key, label, instant) => {
    const v = viewOf(key); if (!v) return;
    hud.hidden = false; hud.textContent = COARSE ? `${label} · '3D 조작하기'를 누르면 돌려 볼 수 있습니다` : `${label} · 드래그 회전 · Ctrl/⌘ + 휠 확대 · 우클릭 이동`;
    if (instant || RM) { cam.position.copy(v.p); controls.target.copy(v.t); cam.fov = v.fov; cam.updateProjectionMatrix(); controls.update(); dirty = true; return; }
    tween = { t0: performance.now(), p0: cam.position.clone(), q0: controls.target.clone(), f0: cam.fov, v };
  };

  // measuring
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const marks = new THREE.Group(); scene.add(marks);
  const measureEl = $('[data-measure]');
  let ruler = false, pts = [];
  const dotGeo = new THREE.SphereGeometry(0.06, 16, 12), dotMat = new THREE.MeshBasicMaterial({ color: 0x1f8ce6, depthTest: false });
  const lineMat = new THREE.LineBasicMaterial({ color: 0x1f8ce6, depthTest: false });
  const clearMarks = () => { marks.clear(); pts = []; measureEl.hidden = true; dirty = true; };
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!ruler || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObject(gltf.scene, true).find((h) => h.object.visible && isShown(h.object));
    if (!hit) return;
    if (pts.length === 2) clearMarks();
    pts.push(hit.point.clone());
    const dot = new THREE.Mesh(dotGeo, dotMat); dot.position.copy(hit.point); dot.renderOrder = 10; marks.add(dot);
    if (pts.length === 2) {
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat); l.renderOrder = 10; marks.add(l);
      const mm = Math.round(pts[0].distanceTo(pts[1]) * 1000);
      measureEl.hidden = false; measureEl.textContent = `${mm.toLocaleString('ko-KR')} mm`;
    } else { measureEl.hidden = false; measureEl.textContent = '두 번째 점을 누르세요'; }
    dirty = true;
  });
  const isShown = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };

  // UI wiring
  root.querySelectorAll('[disabled]').forEach((b) => (b.disabled = false));
  if (!walk) $('[data-walk]').disabled = true;
  $('[data-views]').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    root.querySelectorAll('[data-cam]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    go(b.dataset.cam, b.firstChild.textContent);
  });
  root.querySelectorAll('[data-layer]').forEach((i) => i.addEventListener('change', () => { setLayer(i.dataset.layer, i.checked); dirty = true; }));
  $('[data-walk]').addEventListener('click', (e) => {
    walking = !walking; e.currentTarget.textContent = walking ? '재생 멈춤' : '관람 동선 재생';
    if (walking) { walk.paused = false; walk.play(); const pl = root.querySelector('#ly-PEOPLE'); if (!pl.checked) { pl.checked = true; setLayer('PEOPLE', true); } } else walk.paused = true;
  });
  $('[data-ruler]').addEventListener('click', (e) => {
    ruler = !ruler; e.currentTarget.textContent = ruler ? '치수 재기 끄기' : '치수 재기';
    e.currentTarget.setAttribute('aria-pressed', ruler); stage.style.cursor = ruler ? 'crosshair' : '';
    if (ruler) { measureEl.hidden = false; measureEl.textContent = '모델 위 두 점을 누르세요'; } else clearMarks();
  });
  controls.addEventListener('change', () => (dirty = true));

  go('00_OVERVIEW', '조감', true);
  $('[data-poster]').classList.add('gone'); $('[data-load]').hidden = true;

  // render loop — runs only while the stage is on screen
  let onScreen = true;
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; if (onScreen) requestAnimationFrame(loop); }).observe(stage);
  const clock = new THREE.Clock();
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function loop() {
    if (!onScreen) return;
    requestAnimationFrame(loop);
    const dt = clock.getDelta();
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.t0) / 1100), e = ease(k);
      cam.position.lerpVectors(tween.p0, tween.v.p, e); controls.target.lerpVectors(tween.q0, tween.v.t, e);
      cam.fov = tween.f0 + (tween.v.fov - tween.f0) * e; cam.updateProjectionMatrix();
      if (k >= 1) tween = null; dirty = true;
    }
    if (walking) { mixer.update(dt); dirty = true; }
    if (controls.update()) dirty = true;
    if (dirty) { renderer.render(scene, cam); dirty = false; }
  }
  window.__v3ready = true;
  requestAnimationFrame(loop);
}
