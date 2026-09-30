/* Hansol Hong portfolio — interactive product windows. All data is fictional. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COARSE = matchMedia('(pointer: coarse)').matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const won = (n) => (n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '억' : n.toLocaleString('ko-KR') + '만');
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function chrome(el, url, body) {
    el.innerHTML = `<div class="win-bar"><i></i><i></i><i></i><div class="url">${url}</div><span class="sample">SAMPLE DATA</span></div><div class="win-body">${body}<div class="toast" role="status" aria-live="polite"></div></div>`;
    return $('.win-body', el);
  }
  function toast(root, msg) {
    const t = $('.toast', root.closest('.win'));
    if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2400);
  }
  function seg(items, cur, name) {
    return `<div class="seg" role="group" aria-label="${name}">${items.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
  }

  /* ---------- project index + copy ---------- */
  const idx = $('#proj-index');
  if (idx) idx.innerHTML = $$('.proj').map((p) => `<a class="chip" href="#${p.id}">${esc($('h3', p).textContent)}</a>`).join('');
  const copyBtn = $('#copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const txt = $('#mail').textContent;
    const done = () => { copyBtn.textContent = '복사했습니다'; setTimeout(() => (copyBtn.textContent = '주소 복사'), 1800); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents($('#mail')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copyBtn.textContent = '선택했습니다. 복사해 주세요'; };
    try { navigator.clipboard.writeText(txt).then(done, sel); } catch (e) { sel(); }
  });

  /* ======================================================================
     01 NAS search + RAG
     ==================================================================== */
  const CLIENTS = ['한빛전자', '그린모터스', '노바디스플레이', '대한물산', '세종시티', '미래모빌리티', '한국소재', '블루오션', '시티라이트', '온누리문화재단', '하늘항공', '새봄제약'];
  const KINDS = ['미디어월', '아나모픽 전광판', '인터랙티브월', '체험존', '쇼룸 미디어', '홍보관', '로비 미디어', '키네틱 조형', '전시관 리뉴얼', '몰입형 영상관', '옥외 미디어', '신제품 런칭 이벤트'];
  const PROJ = (() => {
    const r = rng(7), out = [], seq = { P: {}, J: {}, CS: {}, R: {} };
    const fixed = [
      ['P', 2025, 8, '한빛전자', '신제품 런칭 미디어월', 412], ['P', 2025, 6, '그린모터스', '모터쇼 아나모픽 전광판', 337],
      ['J', 2025, 5, '노바디스플레이', '옥외 미디어 제안', 96], ['P', 2025, 3, '대한물산', '사옥 로비 인터랙티브월', 258],
      ['CS', 2025, 2, '한빛전자', '미디어월 정기 점검', 41], ['P', 2025, 1, '세종시티', '전시관 체험존 구축', 511],
      ['J', 2026, 8, '그린모터스', '전기차 쇼룸 전광판 제안', 128], ['P', 2026, 7, '미래모빌리티', '쇼룸 미디어 개편', 294],
      ['CS', 2026, 4, '한빛전자', '미디어월 콘텐츠 교체', 58], ['R', 2026, 3, '퍼셉트', '공간 자동 모델링 연구', 188],
    ];
    fixed.forEach(([t, y, m, c, k, f]) => out.push({ t, y, m, c, k, f }));
    for (let i = 0; i < 70; i++) {
      const y = 2019 + Math.floor(r() * 8), t = r() < 0.5 ? 'P' : r() < 0.7 ? 'J' : r() < 0.85 ? 'CS' : 'R';
      out.push({ t, y, m: 1 + Math.floor(r() * 12), c: CLIENTS[Math.floor(r() * CLIENTS.length)], k: KINDS[Math.floor(r() * KINDS.length)], f: 12 + Math.floor(r() * 560) });
    }
    out.sort((a, b) => b.y - a.y || b.m - a.m);
    out.slice().reverse().forEach((p) => { const yy = String(p.y).slice(2); const s = seq[p.t]; s[yy] = (s[yy] || 0) + 1; p.code = `${p.t}${yy}-${String(s[yy] * 3 + 5).padStart(3, '0')}`; });
    out.forEach((p) => { p.name = `${p.c} ${p.k}`; p.date = `${p.y}.${String(p.m).padStart(2, '0')}`; });
    const fix = [['그린모터스', '모터쇼 아나모픽 전광판', 'P25-022'], ['한빛전자', '신제품 런칭 미디어월', 'P25-014'], ['대한물산', '사옥 로비 인터랙티브월', 'P25-031'], ['세종시티', '전시관 체험존 구축', 'P25-008'], ['노바디스플레이', '옥외 미디어 제안', 'J25-041'], ['한빛전자', '미디어월 정기 점검', 'CS25-006']];
    const fixedSet = new Set(fix.map((f) => f[2]));
    out.forEach((p) => { const f = fix.find((x) => x[0] === p.c && x[1] === p.k); if (f) p.code = f[2]; });
    const used = new Set(fixedSet);
    out.forEach((p) => { if (fix.some((x) => x[0] === p.c && x[1] === p.k)) return; let [pre, n] = p.code.split('-'); n = +n; while (used.has(`${pre}-${String(n).padStart(3, '0')}`)) n++; p.code = `${pre}-${String(n).padStart(3, '0')}`; used.add(p.code); });
    return out;
  })();
  const TYPE_L = { P: '실행', J: '제안', CS: '유지보수', R: '연구' };
  const RAG = [
    { q: '그린모터스 전광판 최종 도면 어디 있어?', a: '최종 도면은 P25-022(그린모터스 모터쇼 아나모픽 전광판)의 03_설계 폴더에 있습니다. 파일명은 「전광판_구조도면_v3_final.dwg」이고 같은 폴더에 PDF 변환본이 있습니다.\n\nv2와 비교하면 하부 프레임 높이가 400mm에서 550mm로 바뀌었고, 이 변경은 2025.05.21 회의록에 기록돼 있습니다.', s: ['P25-022 / 03_설계 / 전광판_구조도면_v3_final.dwg', 'P25-022 / 03_설계 / 전광판_구조도면_v3_final.pdf', 'P25-022 / 01_회의록 / 2025-05-21_설계변경.docx'] },
    { q: '2025년에 한 미디어월 프로젝트 알려줘', a: '2025년에 진행한 미디어월 관련 실행 프로젝트는 세 건입니다.\n\n· P25-014 한빛전자 신제품 런칭 미디어월 (2025.08)\n· P25-031 대한물산 사옥 로비 인터랙티브월 (2025.03)\n· P25-008 세종시티 전시관 체험존 구축 (2025.01)\n\n세 건 모두 최종 보고서가 06_완료 폴더에 있습니다.', s: ['P25-014 / 06_완료 / 결과보고서.pdf', 'P25-031 / 06_완료 / 결과보고서.pdf', 'P25-008 / 06_완료 / 결과보고서.pdf'] },
    { q: '한빛전자 유지보수 이력 요약해줘', a: '한빛전자 미디어월은 2025년부터 유지보수 계약으로 관리하고 있습니다.\n\n· 2025.02 정기 점검: 모듈 2개 교체, 밝기 보정\n· 2026.04 콘텐츠 교체: 봄 캠페인 영상 3종 적용\n\n다음 정기 점검은 2026.10 예정이며, 계약 만료는 2026.12입니다.', s: ['CS25-008 / 점검보고서_2025-02.pdf', 'CS26-011 / 콘텐츠_교체_확인서.pdf', 'CS25-008 / 유지보수_계약서.pdf'] },
  ];
  function initNAS() {
    const root = $('#nas'); if (!root) return;
    const st = { q: '전광판 아나모픽 2025', year: 'all', type: 'all', mode: 'kw', sel: null, more: false };
    const body = chrome(root, 'nas.percept.local / <b>search</b>', `
      <div class="nas">
        <div class="side"><div class="brand">NAS SEARCH</div>
          <button type="button" aria-current="true">프로젝트 검색</button><button type="button" disabled>실적 조회<small>데모 미포함</small></button>
          <button type="button" data-go="#p-intro">소개서 생성 ↓</button><button type="button" disabled>폴더 탐색<small>데모 미포함</small></button><button type="button" disabled>업로드<small>데모 미포함</small></button></div>
        <div class="nas-main">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">${seg([['kw', '키워드 검색'], ['ai', 'AI에게 묻기']], 'kw', '검색 방식')}</div>
          <div data-kw>
            <label class="searchbox"><span class="k">⌕</span><input id="nas-q" type="search" autocomplete="off" aria-label="프로젝트 검색어"><button class="btn" type="button" data-run>검색</button></label>
            <div class="filters" data-f="year">${[['all', '전체 연도'], ['2026', '2026'], ['2025', '2025'], ['2024', '2024'], ['old', '~2023']].map(([v, l]) => `<button class="chip" type="button" data-v="${v}" aria-pressed="${v === 'all'}">${l}</button>`).join('')}</div>
            <div class="filters" data-f="type" style="margin-top:0">${[['all', '전체 구분'], ['P', 'P 실행'], ['J', 'J 제안'], ['CS', 'CS 유지보수'], ['R', 'R 연구']].map(([v, l]) => `<button class="chip" type="button" data-v="${v}" aria-pressed="${v === 'all'}">${l}</button>`).join('')}</div>
            <div class="meta" data-meta></div>
            <ul class="res" data-res role="listbox" aria-label="검색 결과"></ul>
            <div data-tree></div>
          </div>
          <div data-ai hidden>
            <div class="rag"><div class="q" data-qs></div>
              <label class="searchbox" style="height:44px;margin-bottom:12px"><input id="nas-ai" type="text" autocomplete="off" placeholder="자료에 대해 물어보세요" aria-label="AI에게 질문"><button class="btn" type="button" data-ask>묻기</button></label>
              <div class="a" data-a aria-live="polite"></div><div class="src" data-src></div></div>
          </div>
        </div>
      </div>`);
    const q = $('#nas-q', body); q.value = st.q;
    const render = () => {
      const toks = st.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let list = PROJ.filter((p) => (st.type === 'all' || p.t === st.type) && (st.year === 'all' || (st.year === 'old' ? p.y <= 2023 : String(p.y) === st.year)));
      if (toks.length) {
        list = list.map((p) => { const hay = `${p.code} ${p.name} ${p.y} ${TYPE_L[p.t]}`.toLowerCase(); return { p, s: toks.filter((t) => hay.includes(t)).length }; })
          .filter((x) => x.s > 0).sort((a, b) => b.s - a.s || b.p.y - a.p.y || b.p.m - a.p.m).map((x) => x.p);
      }
      const n = list.length, shown = st.more ? list.slice(0, 20) : list.slice(0, 6);
      const secs = (0.12 + ((st.q.length * 7) % 13) / 100).toFixed(2);
      $('[data-meta]', body).innerHTML = `893개 프로젝트 · 파일 7만여 개 중 <b>${n}건</b>`;
      const hl = (s) => { let o = esc(s); toks.forEach((t) => { if (t.length < 1) return; o = o.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<mark>${m}</mark>`); }); return o; };
      $('[data-res]', body).innerHTML = shown.map((p) => `<li role="option" tabindex="0" data-code="${p.code}" aria-selected="${st.sel === p.code}"><span class="c">${hl(p.code)}</span><span class="n">${hl(p.name)}</span><span class="d">${p.date} · ${p.f}</span></li>`).join('')
        + (n > shown.length ? `<li data-more tabindex="0" role="button" style="grid-template-columns:1fr;justify-items:center;color:var(--fg-3);font-family:var(--mono);font-size:12px">${n}건 중 ${shown.length}건 표시 · 더 보기</li>` : '')
        + (n === 0 ? `<li style="grid-template-columns:1fr;cursor:default;color:var(--fg-2)">결과가 없습니다. 검색어를 줄이거나 연도 필터를 전체로 바꿔 보세요.</li>` : '');
      if (st.sel && !shown.some((p) => p.code === st.sel)) st.sel = null;
      const sel = PROJ.find((p) => p.code === st.sel);
      $('[data-tree]', body).innerHTML = sel ? `<div class="tree"><div class="h">${esc(sel.code)} ${esc(sel.name)}</div>${['01_회의록', '02_제안', '03_설계', '04_제작', '05_현장사진', '06_완료'].map((f, i) => `├ ${f} <span style="color:var(--fg-3)">${Math.max(1, Math.round(sel.f * [0.06, 0.14, 0.22, 0.28, 0.24, 0.06][i]))}</span>`).join('<br>')}</div>` : '';
    };
    const ask = (text) => {
      const hit = RAG.find((r) => r.q === text) || RAG.find((r) => text && r.q.split(' ').filter((w) => w.length > 1 && text.includes(w)).length >= 2);
      const a = $('[data-a]', body), s = $('[data-src]', body);
      const ans = hit ? hit.a : '이 데모는 가상 데이터라 위의 예시 질문 세 개에만 답합니다. 실제 시스템은 파일 7만여 건의 색인에서 근거 문서를 찾아 답합니다.';
      s.innerHTML = ''; a.textContent = ''; let i = 0; clearInterval(a._t);
      if (RM) { a.textContent = ans; if (hit) s.innerHTML = hit.s.map((x) => `<span>${esc(x)}</span>`).join(''); return; }
      a.setAttribute('aria-busy', 'true');
      a._t = setInterval(() => { i += 3; a.textContent = ans.slice(0, i); if (i >= ans.length) { clearInterval(a._t); a.removeAttribute('aria-busy'); if (hit) s.innerHTML = hit.s.map((x) => `<span>${esc(x)}</span>`).join(''); } }, 16);
    };
    $('[data-qs]', body).innerHTML = RAG.map((r, i) => `<button class="chip" type="button" data-q="${i}">${esc(r.q)}</button>`).join('');
    body.addEventListener('click', (e) => {
      const b = e.target.closest('button, li');
      if (!b) return;
      if (b.closest('.seg')) { st.mode = b.dataset.v; $$('.seg button', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); $('[data-kw]', body).hidden = st.mode !== 'kw'; $('[data-ai]', body).hidden = st.mode !== 'ai'; if (st.mode === 'ai' && !$('[data-a]', body).textContent) ask(RAG[0].q); return; }
      const f = b.closest('.filters'); if (f) { st[f.dataset.f] = b.dataset.v; $$('button', f).forEach((x) => x.setAttribute('aria-pressed', x === b)); st.more = false; render(); return; }
      if (b.dataset.run !== undefined) { st.q = q.value; st.more = false; render(); return; }
      if (b.dataset.more !== undefined) { st.more = true; render(); return; }
      if (b.dataset.code) { st.sel = st.sel === b.dataset.code ? null : b.dataset.code; render(); return; }
      if (b.dataset.q !== undefined) { const r = RAG[+b.dataset.q]; $('#nas-ai', body).value = r.q; ask(r.q); return; }
      if (b.dataset.ask !== undefined) { ask($('#nas-ai', body).value.trim()); return; }
      if (b.dataset.go) { document.querySelector(b.dataset.go).scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); return; }
      if (b.dataset.t) toast(body, `데모에서는 검색 화면만 열려 있습니다`);
    });
    body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.target.dataset.code || e.target.dataset.more !== undefined)) { e.target.click(); } });
    q.addEventListener('input', () => { st.q = q.value; st.more = false; render(); });
    $('#nas-ai', body).addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(e.target.value.trim()); });
    st.sel = 'P25-022'; render();
  }

  /* ======================================================================
     02 Company profile generator
     ==================================================================== */
  const CASES = [
    ['한빛전자 미디어월', 'Hanbit Electronics Media Wall', '韩光电子 媒体墙', 'ハンビット電子 メディアウォール'],
    ['그린모터스 아나모픽 전광판', 'Green Motors Anamorphic Billboard', '绿色汽车 裸眼3D大屏', 'グリーンモーターズ 錯視ビルボード'],
    ['대한물산 인터랙티브월', 'Daehan Trading Interactive Wall', '大韩物产 互动墙', '大韓物産 インタラクティブウォール'],
    ['세종시티 체험존', 'Sejong City Experience Zone', '世宗城 体验区', '世宗シティ 体験ゾーン'],
    ['노바디스플레이 옥외 미디어', 'Nova Display Outdoor Media', '诺瓦显示 户外媒体', 'ノヴァディスプレイ 屋外メディア'],
    ['미래모빌리티 쇼룸', 'Mirae Mobility Showroom', '未来出行 展厅', 'ミレモビリティ ショールーム'],
    ['한국소재 기업관', 'Korea Materials Pavilion', '韩国材料 企业馆', '韓国素材 企業館'],
    ['블루오션 워터파크', 'Blue Ocean Waterpark', '蓝海 水上乐园', 'ブルーオーシャン ウォーターパーク'],
    ['시티라이트 광장', 'City Light Plaza', '城市之光 广场', 'シティライト 広場'],
    ['온누리문화재단 몰입형 전시', 'Onnuri Foundation Immersive Show', '温努里文化财团 沉浸式展览', 'オンヌリ文化財団 没入型展示'],
  ];
  const SECT = [['회사 개요', 'Company Overview', '公司概况', '会社概要'], ['사업 영역', 'Business Areas', '业务领域', '事業領域'], ['주요 실적', 'Selected Works', '主要业绩', '主な実績'], ['연락처', 'Contact', '联系方式', 'お問い合わせ']];
  function initGen() {
    const root = $('#gen'); if (!root) return;
    const st = { sel: new Set([0, 1, 2, 3, 4, 5]), lang: 0, done: true, busy: false };
    const body = chrome(root, 'intro.percept.local / <b>generate</b>', `
      <div class="gen">
        <div class="gen-list"><div class="mini" style="display:flex;justify-content:space-between;padding:0 4px 8px;grid-column:1/-1"><span>사례 선택</span><span data-cnt></span></div><div data-cases style="display:contents"></div></div>
        <div class="gen-main">
          <div class="gen-top">${seg([['0', '국문'], ['1', '영문'], ['2', '중문'], ['3', '일문']], '0', '언어')}<button class="btn" type="button" data-go>소개서 생성</button></div>
          <div class="bar"><i data-bar></i></div>
          <div class="mini" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span data-status></span><span data-cache></span></div>
          <div class="slides" data-slides></div>
        </div>
      </div>`);
    $('[data-cases]', body).innerHTML = CASES.map((c, i) => `<label><input type="checkbox" id="gen-c${i}" ${st.sel.has(i) ? 'checked' : ''} data-i="${i}">${esc(c[0])}</label>`).join('');
    const deck = () => {
      const L = st.lang, s = [{ cover: 1, t: 'COMPANY PROFILE' }, { t: SECT[0][L] }, { t: SECT[1][L] }, { t: SECT[2][L] }];
      [...st.sel].sort((a, b) => a - b).forEach((i) => s.push({ t: CASES[i][L], c: 1 }));
      s.push({ t: SECT[3][L] }); return s;
    };
    const paint = (filled) => {
      const d = deck();
      $('[data-slides]', body).innerHTML = d.map((x, i) => {
        const on = i < filled;
        return `<div class="sl ${x.cover && on ? 'cover' : ''} ${on ? 'on' : 'wait'}"><b>${on ? esc(x.t) : '생성 대기'}</b><div class="ph"></div><span class="mini">${String(i + 1).padStart(2, '0')}</span></div>`;
      }).join('');
      $('[data-bar]', body).style.width = (filled / d.length) * 100 + '%';
      $('[data-cnt]', body).textContent = `${st.sel.size} / ${CASES.length}`;
      $('[data-status]', body).textContent = filled >= d.length ? `완성 · ${d.length}장 · 회사소개서_${['KO', 'EN', 'ZH', 'JA'][st.lang]}.pptx` : st.busy ? `슬라이드 채우는 중 ${filled} / ${d.length}` : `생성 버튼을 누르면 ${d.length}장을 채웁니다`;
      $('[data-cache]', body).textContent = st.lang ? '번역 캐시 사용' : '원문 · 번역 없음';
      $('[data-go]', body).disabled = st.busy || st.sel.size === 0;
    };
    const run = () => {
      const d = deck(); st.busy = true; let i = 0; paint(0);
      const tick = () => { i++; paint(i); if (i < d.length) setTimeout(tick, 140 + (st.lang ? 90 : 0)); else { st.busy = false; st.done = true; paint(i); toast(body, `${d.length}장 생성 완료`); } };
      setTimeout(tick, 200);
    };
    body.addEventListener('change', (e) => { const i = e.target.dataset.i; if (i === undefined) return; e.target.checked ? st.sel.add(+i) : st.sel.delete(+i); st.done = false; paint(0); });
    body.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || st.busy) return;
      if (b.closest('.seg')) { st.lang = +b.dataset.v; $$('.seg button', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); run(); return; }
      if (b.dataset.go !== undefined) run();
    });
    paint(deck().length);
  }

  /* ======================================================================
     03 Weekly meeting system
     ==================================================================== */
  const GROUPS = ['미디어1그룹', '미디어2그룹', '공간그룹', '기술연구소', '영업팀', '경영기획그룹'];
  const ROLES = [['경영기획그룹', '경영기획 (전체)'], ['미디어1그룹', '미디어1그룹'], ['공간그룹', '공간그룹'], ['영업팀', '영업팀']];
  const WK_PROJ = ['한빛전자 신제품 런칭 미디어월', '그린모터스 전기차 쇼룸 전광판', '대한물산 로비 인터랙티브월 2차', '세종시티 체험존 리뉴얼', '미래모빌리티 쇼룸 미디어', '한국소재 기업관 전시', '블루오션 워터파크 사이니지', '시티라이트 광장 미디어파사드', '온누리문화재단 몰입형 전시', '하늘항공 라운지 미디어', '새봄제약 홍보관', '노바디스플레이 옥외 미디어', '공간 자동 모델링 연구', '사내 NAS 통합 운영', '주간회의 시스템', '홈페이지 실적 이관'];
  const DONE = ['콘텐츠 1차 시안 공유', '현장 실측 완료', '구조 도면 v2 검토', '견적서 발송', '고객 킥오프 미팅', '하드웨어 발주', '시운전 점검', '영상 렌더링 70%', '시공사 선정', '설계 변경 협의', '운영 매뉴얼 초안', '제안서 제출'];
  const PLAN = ['콘텐츠 2차 시안', '현장 설치 착수', '도면 확정', '계약 조건 협의', '최종 PT', '장비 입고 검수', '오픈 리허설', '영상 최종본 납품', '공정표 확정', '고객 보고', '교육 진행', '결과 발표 대응'];
  const ISSUE = ['', '', '', '납기 1주 지연 가능', '', '고객 담당자 변경', '', '예산 조정 요청', '', ''];
  function wkRows(week) {
    const r = rng(week * 31 + 5), rows = [];
    for (let i = 0; i < 46; i++) {
      const g = GROUPS[i % 5 === 4 ? 4 : Math.floor(r() * 4)];
      const t = g === '영업팀' ? 'S' : ['P', 'P', 'P', 'J', 'CS', 'R'][Math.floor(r() * 6)];
      const num = t === 'S' ? `S26-${String(1 + (i % 14)).padStart(3, '0')}` : `${t}26-${String(10 + i * 2 + Math.floor(r() * 2)).padStart(3, '0')}`;
      rows.push({ id: i, num, t, name: WK_PROJ[Math.floor(r() * WK_PROJ.length)], g, done: DONE[Math.floor(r() * DONE.length)], plan: PLAN[Math.floor(r() * PLAN.length)], issue: ISSUE[Math.floor(r() * ISSUE.length)] });
    }
    return rows;
  }
  function initWeekly() {
    const root = $('#weekly'); if (!root) return;
    const st = { week: 39, tab: 'week', role: '미디어1그룹', page: 1, rows: wkRows(39), edits: 0 };
    const body = chrome(root, 'weekly.percept.local / <b>meeting</b>', `
      <div class="wk-top">
        <div class="week"><button type="button" data-w="-1" aria-label="이전 주">‹</button><span data-wlabel></span><button type="button" data-w="1" aria-label="다음 주">›</button></div>
        <span class="sp"></span>
        <label class="wk-role" for="wk-role">역할<select id="wk-role">${ROLES.map(([v, l]) => `<option value="${v}" ${v === st.role ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <div style="padding:12px 18px 0">${seg([['sum', '요약'], ['week', '주간업무'], ['sales', '영업'], ['cost', '비용'], ['prog', '진행']], 'week', '보기')}</div>
      <div class="wk-body" data-view></div>`);
    const wlabel = () => {
      const mon = new Date(2026, 8, 28 + (st.week - 39) * 7), fri = new Date(mon); fri.setDate(mon.getDate() + 4);
      const f = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      $('[data-wlabel]', body).innerHTML = `2026년 ${st.week}주차 · ${f(mon)}–${f(fri)}<span class="iso"> · ISO W${st.week + 1}</span>`;
    };
    const canEdit = (row) => st.role === '경영기획그룹' || row.g === st.role;
    const views = {
      sum() {
        const mine = st.rows.filter((r) => r.g === st.role).length;
        return `<div class="kpis">
          <div class="kpi"><strong>18</strong><span>진행 프로젝트</span><em>+2</em></div>
          <div class="kpi"><strong>5</strong><span>이번 주 신규 영업</span><em>S 번호</em></div>
          <div class="kpi"><strong>3</strong><span>2주 안에 마감</span></div>
          <div class="kpi"><strong>${st.role === '경영기획그룹' ? 46 : mine}</strong><span>${st.role === '경영기획그룹' ? '전체 입력 행' : '우리 그룹 입력 행'}</span></div></div>
          <div class="src3"><div>원장<small>그룹장 관리 엑셀</small></div><div>전자결재 백업<small>그룹웨어</small></div><div>주간업무 엑셀<small>그룹별 시트</small></div><div class="arrow">→</div><div class="to">주간회의 화면 1개<small>조회 · 그룹별 입력</small></div></div>
          <div class="two">
            <div class="norm"><h4>이번 마감에 적용한 정리 규칙</h4><ul>
              <li>'미디어1G' · '미디어 1그룹' · '미디어그룹(1)' → <b>미디어1그룹</b></li>
              <li>시트 '(914-918)' → <b>2026년 37주차</b> · ISO W38</li>
              <li>열 구성 v1 ~ v4 → <b>헤더 이름 기준</b>으로 통일</li>
              <li>영업 행 'J26-##3' → <b>S26-003</b></li>
              <li>'세종시티 체험존 리뉴얼' → <b>P26-031</b> 유사도 0.94 · 후보 1</li>
              <li>'한국소재 전시' → 연결 보류 · 후보 2</li></ul></div>
            <div class="norm"><h4>이번 주 확인할 이슈</h4><ul>${st.rows.filter((r) => r.issue).slice(0, 5).map((r) => `<li><b>${r.num}</b> ${esc(r.issue)} · ${esc(r.g)}</li>`).join('') || '<li>이슈 없음</li>'}</ul></div>
          </div>`;
      },
      week() {
        const per = 20, pages = Math.ceil(st.rows.length / per), rows = st.rows.slice((st.page - 1) * per, st.page * per);
        const cell = (r, k) => { const ok = canEdit(r); return `<td class="cell ${ok ? 'mine' : 'locked'} ${r['_' + k] ? 'edited' : ''}" data-id="${r.id}" data-k="${k}" ${ok ? 'tabindex="0"' : 'title="소관 그룹만 입력할 수 있습니다"'}>${esc(r[k]) || '<span style="color:var(--fg-3)">—</span>'}</td>`; };
        return `<div class="scroll-x"><table class="grid" style="min-width:680px"><thead><tr><th>번호</th><th>프로젝트</th><th>담당</th><th>지난주 실적</th><th>이번 주 계획</th><th>이슈</th></tr></thead><tbody>
          ${rows.map((r) => `<tr><td class="code">${r.num}</td><td>${esc(r.name)}</td><td style="white-space:nowrap;color:var(--fg-2)">${esc(r.g)}</td>${cell(r, 'done')}${cell(r, 'plan')}${cell(r, 'issue')}</tr>`).join('')}
          </tbody></table></div>
          <div class="pager"><span>${st.rows.length}행 · 20행씩 · ${st.edits ? `이번 세션 수정 ${st.edits}건 저장됨` : '파란 줄이 있는 칸만 입력할 수 있습니다'}</span><div>${Array.from({ length: pages }, (_, i) => `<button type="button" data-p="${i + 1}" aria-current="${st.page === i + 1}">${i + 1}</button>`).join('')}</div></div>`;
      },
      sales() {
        const stages = ['문의', '제안 준비', '제안 제출', '협의'], r = rng(st.week);
        const rows = Array.from({ length: 9 }, (_, i) => ({ n: `S26-${String(20 - i).padStart(3, '0')}`, c: CLIENTS[(i * 5 + st.week) % CLIENTS.length], k: KINDS[(i * 3 + st.week) % KINDS.length], s: stages[Math.floor(r() * 4)], a: Math.round(8 + r() * 60) * 1000, o: ['홍', '김', '이', '박'][i % 4] }));
        return `<div class="scroll-x"><table class="grid" style="min-width:620px"><thead><tr><th>S 번호</th><th>고객</th><th>건명</th><th>단계</th><th class="num">예상 금액</th><th>담당</th></tr></thead><tbody>
          ${rows.map((x) => `<tr><td class="code">${x.n}</td><td>${x.c}</td><td>${x.k}</td><td><span class="tag">${x.s}</span></td><td class="num">${won(x.a)}</td><td>${x.o}</td></tr>`).join('')}</tbody></table></div>
          <p class="mini" style="margin:12px 0 0">S 번호는 J(제안) 번호 이전 단계에 자동으로 붙고, 한번 붙으면 바뀌지 않습니다.</p>`;
      },
      cost() {
        const r = rng(st.week + 3);
        const rows = GROUPS.slice(0, 5).map((g) => { const b = 300 + Math.round(r() * 700); return { g, b, u: Math.round(b * (0.45 + r() * 0.5)) }; });
        const max = Math.max(...rows.map((x) => x.b));
        return `<div class="mini" style="margin-bottom:8px">그룹별 누적 집행 / 연간 예산 (백만 원, 가상) · 흰 선이 예산</div>
          ${rows.map((x) => `<div class="hbar"><span>${x.g}</span><span class="t"><i style="width:${(x.u / max) * 100}%"></i><i class="plan" style="width:${(x.b / max) * 100}%"></i></span><span class="v">${x.u} / ${x.b}</span></div>`).join('')}
          <p class="mini" style="margin:12px 0 0">금액은 모두 VAT 별도 기준으로 맞춰 표시합니다.</p>`;
      },
      prog() {
        const r = rng(st.week + 9), now = 8.9;
        const rows = WK_PROJ.slice(0, 9).map((n) => { const s = Math.floor(r() * 8), l = 2 + Math.floor(r() * 4); return { n, s, l: Math.min(l, 12 - s), p: Math.min(1, Math.max(0, (now - s) / l)) }; });
        return `<div class="gantt"><div></div><div class="months">${Array.from({ length: 12 }, (_, i) => `<span>${i + 1}월</span>`).join('')}</div>
          ${rows.map((x) => `<div class="row"><div class="nm">${esc(x.n)}</div><div class="tl"><i style="left:${(x.s / 12) * 100}%;width:${(x.l / 12) * 100}%"><b style="width:${x.p * 100}%"></b></i><span class="now" style="left:${(now / 12) * 100}%"></span></div></div>`).join('')}</div>
          <p class="mini" style="margin:12px 0 0">파란 선이 이번 주입니다.</p>`;
      },
    };
    const render = () => { wlabel(); $('[data-view]', body).innerHTML = views[st.tab](); };
    const edit = (td) => {
      if (!td || td.querySelector('input')) return;
      const row = st.rows[+td.dataset.id], k = td.dataset.k;
      if (!canEdit(row)) { toast(body, `${row.g} 소관 행입니다. 역할을 바꿔 보세요`); return; }
      const inp = document.createElement('input'); inp.value = row[k]; inp.setAttribute('aria-label', '내용 입력');
      td.textContent = ''; td.appendChild(inp); inp.focus(); inp.select();
      let closed = false;
      const close = (save) => { if (closed) return; closed = true; if (save && inp.value !== row[k]) { row[k] = inp.value; row['_' + k] = 1; st.edits++; toast(body, `${row.num} 저장됨`); } render(); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(true); if (e.key === 'Escape') close(false); });
      inp.addEventListener('blur', () => close(true));
    };
    body.addEventListener('click', (e) => {
      const td = e.target.closest('td.cell'); if (td) { edit(td); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.closest('.seg')) { st.tab = b.dataset.v; $$('.seg button', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); render(); return; }
      if (b.dataset.p) { st.page = +b.dataset.p; render(); return; }
      if (b.dataset.w) { st.week = Math.min(39, Math.max(30, st.week + +b.dataset.w)); st.rows = wkRows(st.week); st.edits = 0; st.page = 1; render(); if (st.week === 39 && +b.dataset.w > 0) toast(body, '이번 주가 마지막 마감 주차입니다'); }
    });
    body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('td.cell')) { e.preventDefault(); edit(e.target); } });
    $('#wk-role', body).addEventListener('change', (e) => { st.role = e.target.value; render(); toast(body, `${e.target.selectedOptions[0].textContent} 화면으로 전환`); });
    render();
  }

  /* ======================================================================
     04 CRM kanban
     ==================================================================== */
  const STAGES = ['문의 접수', '견적 · 제안', '협의 · 계약', '수주 완료'];
  function initCRM() {
    const root = $('#crm'); if (!root) return;
    let cards = [
      [0, '한빛전자', '홈페이지 문의', '09.14', '미디어월 신규', 0, '홍'], [0, '세종시티', '전시 담당 소개', '09.12', '체험관 리뉴얼', 0, '김'], [0, '블루오션', '전시회 명함', '09.09', '워터파크 사이니지', 0, '홍'], [0, '미래모빌리티', '기존 고객 재문의', '09.06', '쇼룸 미디어 개편', 0, '이'],
      [1, '그린모터스', '제안서 발송', '09.08', '전기차 쇼룸 전광판', 42000, '홍'], [1, '노바디스플레이', '견적 조정 중', '09.05', '옥외 미디어', 18000, '박'], [1, '미래모빌리티', 'PT 예정', '09.19', '로비 키네틱 조형', 65000, '김'], [1, '블루오션', '현장 실측 완료', '09.02', '입구 미디어게이트', 9000, '이'],
      [2, '대한물산', '계약서 검토', '09.11', '로비 인터랙티브월 2차', 31000, '홍'], [2, '한국소재', '조건 협의', '09.03', '기업관 전시', 24000, '박'], [2, '노바디스플레이', '법무 검토', '08.29', '매장 디스플레이', 18000, '김'],
      [3, '시티라이트', '착수 09.01', '09.01', '광장 미디어파사드', 50000, '이'], [3, '한빛전자', '착수 08.20', '08.20', '신제품 런칭 미디어월', 27000, '홍'], [3, '세종시티', '착수 08.04', '08.04', '전시관 체험존', 36000, '김'],
    ].map(([s, c, n, d, k, a, o], i) => ({ id: i, s, c, n, d, k, a, o }));
    const pool = [['하늘항공', '라운지 미디어아트', '홈페이지 문의'], ['새봄제약', '본사 홍보관', '홈페이지 문의'], ['온누리문화재단', '몰입형 전시', '홈페이지 문의']];
    let filter = 'all', nid = 100;
    if (COARSE) { const t = root.previousElementSibling; if (t && t.classList.contains('try')) t.innerHTML = '<b>직접 해 보기</b>카드의 ← → 를 눌러 단계를 옮기고, 홈페이지 문의를 받아 보세요'; }
    const body = chrome(root, 'crm.percept.io / <b>pipeline</b>', `
      <div class="crm-top"><div><b style="font-weight:500">영업 파이프라인</b> <span class="mini">2026년 3분기</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${seg([['all', '전체'], ['mine', '내 담당'], ['week', '이번 주']], 'all', '필터')}<button class="btn ghost" type="button" data-in>+ 홈페이지 문의 받기</button></div></div>
      <div class="scroll-x"><div class="kanban" data-board></div></div>`);
    const vis = (c) => filter === 'all' || (filter === 'mine' ? c.o === '홍' : c.d >= '09.14' && c.d <= '09.30');
    const render = () => {
      $('[data-board]', body).innerHTML = STAGES.map((s, i) => {
        const list = cards.filter((c) => c.s === i && vis(c)), sum = list.reduce((t, c) => t + c.a, 0);
        return `<div class="col" data-col="${i}"><div class="col-h"><span>${s}<span class="n">${list.length}</span></span><span class="sum">${sum ? won(sum) : ''}</span></div>
          ${list.map((c) => `<div class="kcard ${c.fresh ? 'new' : ''}" data-id="${c.id}" tabindex="0" aria-label="${esc(c.c)} ${esc(c.k)}, ${s}. Enter 또는 → 다음 단계, ← 이전 단계"><b>${esc(c.c)}</b><small>${esc(c.n)} · ${c.d}</small><div style="display:flex;justify-content:space-between;gap:6px;font-size:12.5px;color:var(--fg-2)"><span>${esc(c.k)}</span><span class="amt">${c.a ? won(c.a) : ''}</span></div><div class="kmove"><button type="button" data-mv="-1" data-id="${c.id}" aria-label="이전 단계로" ${i === 0 ? 'disabled' : ''}>←</button><button type="button" data-mv="1" data-id="${c.id}" aria-label="다음 단계로" ${i === 3 ? 'disabled' : ''}>→</button></div></div>`).join('')}</div>`;
      }).join('');
    };
    const move = (id, to) => { const c = cards.find((x) => x.id === id); if (!c || c.s === to) return; c.s = to; c.fresh = false; if (to > 0 && !c.a) c.a = 12000; render(); toast(body, `${c.c} → ${STAGES[to]}`); };
    // pointer drag
    let drag = null;
    body.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.kcard'); if (!card || e.button > 0 || e.pointerType === 'touch' || e.target.closest('button')) return;
      const r = card.getBoundingClientRect();
      drag = { id: +card.dataset.id, card, dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false, w: r.width };
      card.setPointerCapture(e.pointerId);
    });
    body.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      if (!drag.moved) { drag.moved = true; drag.ph = document.createElement('div'); drag.ph.className = 'ph-card'; drag.ph.style.height = drag.card.offsetHeight + 'px'; drag.card.after(drag.ph); drag.card.classList.add('drag'); Object.assign(drag.card.style, { position: 'fixed', width: drag.w + 'px', zIndex: 50, pointerEvents: 'none' }); }
      drag.card.style.left = e.clientX - drag.dx + 'px'; drag.card.style.top = e.clientY - drag.dy + 'px';
      const col = document.elementFromPoint(e.clientX, e.clientY)?.closest('.col');
      $$('.col', body).forEach((c) => c.classList.toggle('over', c === col));
      if (col && drag.ph.parentElement !== col) col.appendChild(drag.ph);
    });
    const end = (e) => {
      if (!drag) return;
      const d = drag; drag = null;
      if (!d.moved) return;
      const col = document.elementFromPoint(e.clientX, e.clientY)?.closest('.col');
      if (col) move(d.id, +col.dataset.col); else render();
    };
    body.addEventListener('pointerup', end); body.addEventListener('pointercancel', (e) => { drag = null; render(); });
    body.addEventListener('keydown', (e) => { const c = e.target.matches('.kcard') && e.target; if (!c) return; const x = cards.find((k) => k.id === +c.dataset.id); if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); move(x.id, Math.min(3, x.s + 1)); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(x.id, Math.max(0, x.s - 1)); } });
    body.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.closest('.seg')) { filter = b.dataset.v; $$('.seg button', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); render(); return; }
      if (b.dataset.mv) { const x = cards.find((k) => k.id === +b.dataset.id); move(x.id, Math.min(3, Math.max(0, x.s + +b.dataset.mv))); return; }
      if (b.dataset.in !== undefined) {
        const p = pool.shift(); if (!p) { toast(body, '오늘 들어온 문의를 모두 받았습니다'); return; }
        cards.unshift({ id: nid++, s: 0, c: p[0], k: p[1], n: p[2], d: '09.29', a: 0, o: '홍', fresh: true });
        filter = 'all'; $$('.seg button', body).forEach((x) => x.setAttribute('aria-pressed', x.dataset.v === 'all'));
        render(); toast(body, 'POST /api/inquiry · 200 · API 키 확인');
      }
    });
    render();
  }

  /* ======================================================================
     05 Partners
     ==================================================================== */
  function initPartners() {
    const root = $('#partner'); if (!root) return;
    const P = [
      ['대성시스템', '시공', [92, 88, 84, 90], 12, 8400], ['한울디자인', '출력 · 제작', [90, 91, 86, 88], 27, 5120], ['정우테크', '출력 · 제작', [82, 76, 80, 74], 94, 12300],
      ['블루라인물류', '운송 · 설치', [78, 84, 70, 76], 131, 3760], ['세림전자', '임대', [66, 70, 72, 62], 188, 6940], ['참조명', '시공', [80, 72, 78, 70], 203, 2180],
      ['동해아크릴', '출력 · 제작', [88, 90, 82, 86], 21, 1840], ['케이엘이디', '임대', [86, 80, 88, 84], 64, 9700], ['미래구조', '시공', [70, 64, 76, 68], 45, 4410],
      ['하나운송', '운송 · 설치', [84, 86, 80, 82], 29, 2650], ['빛샘조명', '시공', [74, 70, 84, 72], 322, 1530], ['온빛사인', '출력 · 제작', [62, 66, 70, 60], 9, 980],
    ].map(([n, k, s, d, a]) => { const avg = s.reduce((x, y) => x + y, 0) / 4; return { n, k, s, d, a, avg, g: avg >= 85 ? 'A' : avg >= 72 ? 'B' : 'C' }; });
    const st = { sort: 'd', dir: 1, kind: '전체', open: '대성시스템' };
    const body = chrome(root, 'admin.percept.local / <b>partners</b>', `
      <div class="p-kpis">
        <div class="kpi"><strong>128</strong><span>등록 협력사</span></div>
        <div class="kpi"><strong data-soon></strong><span>30일 안에 계약 만료</span></div>
        <div class="kpi"><strong>4.2억</strong><span>이번 분기 집행</span></div>
        <div class="kpi"><strong>A·B·C</strong><span>항목별 점수로 자동 산정</span></div></div>
      <div style="padding:10px 18px 0" class="filters" data-kinds>${['전체', '시공', '출력 · 제작', '운송 · 설치', '임대'].map((k) => `<button class="chip" type="button" data-k="${k}" aria-pressed="${k === '전체'}">${k}</button>`).join('')}</div>
      <div class="scroll-x" style="padding:0 18px 16px"><table class="grid" style="min-width:600px"><thead><tr>
        <th>협력사</th><th>분류</th><th class="sortable" tabindex="0" data-s="avg">등급</th><th class="sortable" tabindex="0" data-s="d" aria-sort="ascending">계약 만료</th><th class="sortable num" tabindex="0" data-s="a">연 집행액</th></tr></thead><tbody data-rows></tbody></table>
        <p class="mini" style="margin:10px 0 0">등급은 항목별 점수 평균으로 자동 산정합니다. 협력사·점수는 샘플 데이터입니다.</p></div>`);
    $('[data-soon]', body).textContent = P.filter((p) => p.d <= 30).length;
    const render = () => {
      const list = P.filter((p) => st.kind === '전체' || p.k === st.kind).sort((a, b) => (a[st.sort] - b[st.sort]) * st.dir);
      $('[data-rows]', body).innerHTML = list.map((p) => `<tr class="click" data-n="${p.n}" tabindex="0" aria-expanded="${st.open === p.n}"><td>${p.n}</td><td style="color:var(--fg-2)">${p.k}</td><td><span class="grade ${p.g}">${p.g}</span></td><td><span class="dday ${p.d <= 30 ? 'soon' : ''}">D-${p.d}</span></td><td class="num">${won(p.a)}</td></tr>`
        + (st.open === p.n ? `<tr class="detail"><td colspan="5"><div class="score">${['품질', '납기', '단가', '대응'].map((l, i) => `<div>${l}<div class="t"><i style="width:${p.s[i]}%"></i></div><b>${p.s[i]}</b></div>`).join('')}</div><div class="mini">평균 ${p.avg.toFixed(1)}점 → ${p.g}등급${p.d <= 30 ? ` · 만료 ${p.d}일 전이라 담당자에게 알림을 보냈습니다` : ''}</div></td></tr>` : '')).join('');
      $$('.sortable', body).forEach((th) => { if (th.dataset.s === st.sort) th.setAttribute('aria-sort', st.dir > 0 ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort'); });
    };
    body.addEventListener('click', (e) => {
      const th = e.target.closest('.sortable'); if (th) { const s = th.dataset.s; st.dir = st.sort === s ? -st.dir : s === 'd' ? 1 : -1; st.sort = s; render(); return; }
      const k = e.target.closest('[data-k]'); if (k) { st.kind = k.dataset.k; $$('[data-k]', body).forEach((x) => x.setAttribute('aria-pressed', x === k)); render(); return; }
      const tr = e.target.closest('tr.click'); if (tr) { st.open = st.open === tr.dataset.n ? null : tr.dataset.n; render(); }
    });
    body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr.click, th.sortable')) e.target.click(); });
    render();
  }

  /* ======================================================================
     06 PMS registration simulator
     ==================================================================== */
  function initPMS() {
    const root = $('#pms'); if (!root) return;
    const J = [
      ['J26-018', '그린모터스 모터쇼 아나모픽 전광판', '(주)그린모터스', 142, '미디어'], ['J26-015', '대한물산 로비 인터랙티브월 2차', '대한물산(주)', 96, '공간'],
      ['J26-012', '한국소재 기업관 전시', '한국소재(주)', 188, '전시'], ['J26-009', '시티라이트 광장 미디어파사드', '시티라이트(주)', 74, '미디어'],
    ];
    const next = { P: 47, J: 19, R: 4 };
    const recent = [['P26-046', '미래모빌리티 쇼룸 미디어 개편', '09.24'], ['CS26-031-01', '세종시티 체험존 유지보수', '09.22'], ['J26-018', '그린모터스 모터쇼 아나모픽 전광판', '09.19']];
    const st = { type: 'P', j: 0 };
    const body = chrome(root, 'pms.percept.local / project / <b>new</b>', `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px 0"><div><b style="font-weight:500">프로젝트 등록</b> <span class="mini">화면안 · 클릭 가능</span></div>
        ${seg([['J', '제안 J'], ['P', '매출 P'], ['CS', '유지보수 CS'], ['R', '연구개발 R']], 'P', '구분')}</div>
      <div class="pms"><div data-form></div><div><div class="inherit" data-inh></div><div class="rule">채번 규칙 <b>유형 + yy + - + 순번 3자리</b><br>J 제안 / P 매출 / R 연구개발<br>CS 유지보수 (원 프로젝트 번호 + -01)<br>매출 종류는 코드에 넣지 않고 속성으로 관리</div>
        <div class="recent" data-recent></div></div></div>`);
    const code = () => st.type === 'P' ? `P26-0${next.P}` : st.type === 'J' ? `J26-0${next.J}` : st.type === 'R' ? `R26-00${next.R}` : `CS26-0${next.P - 1}-01`;
    const render = () => {
      const j = J[st.j], t = st.type;
      const pick = t === 'P' ? `<div class="f"><label for="pms-j">기존 제안 선택</label><select class="field" id="pms-j">${J.map((x, i) => `<option value="${i}" ${i === st.j ? 'selected' : ''}>${x[0]} · ${x[1]}</option>`).join('')}<option value="-1" ${st.j < 0 ? 'selected' : ''}>제안 없이 바로 수주</option></select></div>`
        : t === 'CS' ? `<div class="f"><label for="pms-j">원 프로젝트 선택</label><select class="field" id="pms-j"><option>P26-0${next.P - 1} · ${recent[0][1]}</option></select></div>` : '';
      const name = t === 'P' && j ? j[1] : t === 'CS' ? `${recent[0][1]} 유지보수` : '', cli = t === 'P' && j ? j[2] : t === 'CS' ? '미래모빌리티(주)' : '';
      $('[data-form]', body).innerHTML = `${pick}
        <div class="f"><label>${{ P: '매출', J: '제안', CS: '유지보수', R: '연구' }[t]} 프로젝트 코드 (자동 채번)</label><div class="autocode"><span>${code()}</span><small>${t === 'P' && j ? `${j[0]}에서 승계` : '새 번호'}</small></div></div>
        <div class="f"><label for="pms-n">프로젝트명</label><input class="field" id="pms-n" value="${esc(name)}" placeholder="프로젝트명을 입력하세요"></div>
        <div class="row2"><div class="f"><label for="pms-c">발주처</label><input class="field" id="pms-c" value="${esc(cli)}" placeholder="발주처"></div><div class="f"><label for="pms-k">매출 종류</label><select class="field" id="pms-k">${['미디어', '공간', '전시', '로보틱스'].map((k) => `<option ${j && k === j[4] ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
        <div class="row2"><div class="f"><label for="pms-d">계약 기간</label><input class="field" id="pms-d" value="${t === 'J' || t === 'R' ? '' : '2026.10.01 – 2027.02.28'}" placeholder="YYYY.MM.DD – YYYY.MM.DD"></div><div class="f"><label for="pms-r">실 수행 기간</label><input class="field" id="pms-r" placeholder="비우면 계약 기간과 같음"></div></div>
        <button class="btn" type="button" data-reg>등록</button>`;
      $('[data-inh]', body).innerHTML = t === 'P' && j ? `<h4>제안 승계 — ${j[0]}에서</h4><dl><dt>제안 단계 투입 공수</dt><dd>${j[3]}시간</dd><dt>승계 비율</dt><dd>100%</dd><dt>제안 마감 처리</dt><dd>마감함</dd><dt>분할 발주</dt><dd>해제 가능</dd></dl>`
        : `<h4>${t === 'CS' ? '원 프로젝트 연결' : '새 번호'}</h4><dl><dt>${t === 'CS' ? '원가 집계' : '승계'}</dt><dd>${t === 'CS' ? '원 프로젝트와 분리' : '없음'}</dd><dt>2012년부터 이어진 코드</dt><dd>511건</dd></dl>`;
      $('[data-recent]', body).innerHTML = `<div class="mini" style="border:0;padding:0 0 4px">최근 등록</div>` + recent.slice(0, 4).map((r, i) => `<div class="${r[3] ? 'fresh' : ''}"><span>${r[0]}</span><span style="color:var(--fg-3)">${r[2]}</span></div>`).join('');
    };
    body.addEventListener('change', (e) => { if (e.target.id === 'pms-j' && st.type === 'P') { st.j = +e.target.value; render(); } });
    body.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.closest('.seg')) { st.type = b.dataset.v; $$('.seg button', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); render(); return; }
      if (b.dataset.reg !== undefined) {
        const n = $('#pms-n', body).value.trim(); if (!n) { toast(body, '프로젝트명을 입력해 주세요'); $('#pms-n', body).focus(); return; }
        const c = code(); recent.forEach((r) => (r[3] = 0)); recent.unshift([c, n, '09.29', 1]);
        if (st.type === 'P') next.P++; if (st.type === 'J') next.J++; if (st.type === 'R') next.R++;
        render(); toast(body, `${c} 등록됨`);
      }
    });
    render();
  }


  /* ======================================================================
     AI community board
     ==================================================================== */
  function initBoard() {
    const root = $('#board'); if (!root) return;
    const TAGS = ['#문서', '#이미지·영상', '#데이터', '#자동화', '#리서치'];
    const posts = [
      [3, '회의록 요약을 매주 자동으로 받는 방법', '영업팀', '김○○', 14, 2], [0, '제안서 목차 초안을 5분 만에 잡는 질문 순서', '미디어1그룹', '이○○', 11, 1],
      [1, '렌더 시안 배경 정리에 써 본 도구 비교', '공간그룹', '박○○', 9, 2], [2, '견적 비교표를 AI로 정리한 후기', '경영기획그룹', '최○○', 7, 1],
      [4, '해외 전시 사례를 조사할 때 쓰는 질문', '미디어2그룹', '정○○', 6, 1], [3, '회사소개서 스킬 설치하고 써 본 후기', '기술연구소', '한○○', 5, 3],
      [0, '영문 메일 톤을 맞추는 요청 문장', '총무팀', '윤○○', 4, 1], [2, '타임시트 양식을 한 번에 바꾸는 스크립트', '경영기획그룹', '서○○', 3, 4],
    ].map(([t, title, dept, who, rec, lv], id) => ({ id, t, title, dept, who, rec, lv, mine: false }));
    let tag = -1;
    const body = chrome(root, 'flow · <b>AI 활용 게시판</b>', `
      <div style="padding:14px 18px 0" class="filters" data-tags>${['전체', ...TAGS].map((l, i) => `<button class="chip" type="button" data-t="${i - 1}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
      <div class="board"><div class="posts" data-posts></div>
        <div class="b-side"><div class="b-card hot"><h4>이달의 최다 추천 · 월간 보상</h4><p data-top></p></div>
          <div class="b-card"><h4>발표 세션 · 격월</h4><p>11월 세션 발표자 2명 모집 중</p></div>
          <div class="b-card"><h4>난이도 4단계</h4><p>처음 쓰는 직원은 1단계 글부터 따라 합니다</p><div class="lv"><i class="on"></i><i class="on"></i><i></i><i></i></div></div></div></div>`);
    const render = () => {
      const list = posts.filter((p) => tag < 0 || p.t === tag).sort((a, b) => b.rec - a.rec);
      $('[data-posts]', body).innerHTML = list.map((p) => `<div class="post"><b>${esc(p.title)}</b><small><em>${TAGS[p.t]}</em> · Lv.${p.lv} · ${esc(p.dept)} ${esc(p.who)}</small><button class="rec" type="button" data-id="${p.id}" aria-pressed="${p.mine}" aria-label="추천 ${p.rec}">▲ ${p.rec}</button></div>`).join('');
      const top = posts.slice().sort((a, b) => b.rec - a.rec)[0];
      $('[data-top]', body).textContent = `${top.title} · ${top.dept} ${top.who} · 추천 ${top.rec}`;
    };
    body.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.t !== undefined) { tag = +b.dataset.t; $$('[data-t]', body).forEach((x) => x.setAttribute('aria-pressed', x === b)); render(); return; }
      if (b.dataset.id !== undefined) { const p = posts[+b.dataset.id]; p.mine = !p.mine; p.rec += p.mine ? 1 : -1; render(); }
    });
    render();
  }

  /* ---------- sticky nav ---------- */
  function initNav() {
    const bar = $('#topbar'), heroNav = $('.hero .nav'); if (!bar || !heroNav) return;
    new IntersectionObserver(([e]) => bar.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(heroNav);
    const links = $$('#topbar ul a'), ids = links.map((a) => a.getAttribute('href').slice(1)), secs = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const onScroll = () => {
      const y = innerHeight * 0.35; let cur = null;
      secs.forEach((s) => { if (s.getBoundingClientRect().top <= y) cur = s.id; });
      links.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + cur));
    };
    let last = null; const chips = $$('#proj-index a'), projs = chips.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
    const onScroll2 = () => { const y = innerHeight * 0.4; let cur = null; projs.forEach((p) => { if (p && p.getBoundingClientRect().top <= y) cur = p.id; }); chips.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + cur)); if (cur !== last) { last = cur; const c = chips.find((a) => a.getAttribute('href') === '#' + cur), box = $('#proj-index'); if (c && box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: c.offsetLeft - box.clientWidth / 2 + c.offsetWidth / 2, behavior: RM ? 'auto' : 'smooth' }); } };
    addEventListener('scroll', () => { onScroll(); onScroll2(); }, { passive: true }); onScroll(); onScroll2();
    document.addEventListener('scroll', (e) => { const el = e.target; if (el.classList && el.classList.contains('scroll-x')) el.classList.toggle('end', el.scrollLeft + el.clientWidth >= el.scrollWidth - 4); }, true);
  }

  [initNAS, initGen, initWeekly, initCRM, initPartners, initBoard, initNav].forEach((f) => { try { f(); } catch (err) { console.error(f.name, err); } });
})();
