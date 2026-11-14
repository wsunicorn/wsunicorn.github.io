(() => {
  const root = document.documentElement, $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = root.lang === 'vi' ? 'vi' : 'en';

  /* ── four attention heads ── */
  const HEADS = [
    { id:'research', img:'/img/hero-research.webp', ph:.92, hx:.6, hy:.06, no:'01', word:'RESEARCH', acc:'--r-amber', line:{en:'<b>research</b> LLM systems that can prove what they say.',vi:'<b>nghiên cứu</b> hệ thống LLM chứng minh được điều nó nói.'},
      cards:[
        { t:'Head 14 · layer 22', h:`<div class="bars"><div>chunk 1<i style="--w:88%"></i>.62</div><div>chunk 2<i style="--w:30%"></i>.21</div><div>chunk 3<i style="--w:14%"></i>.11</div><div>answer<i style="--w:9%"></i>.06</div></div>` },
        { t:'Thesis', h:`<div class="big">0.745</div><div class="sm"><b>macro-F1</b> · 2,271 params<br>≈ PhoBERT-large 0.749</div>` },
        { t:'Evidence found', h:`<div class="big">87.8%</div><div class="sm">strongest head on the right chunk · <b>14.3× chance</b></div>` } ] },
    { id:'build', img:'/img/hero-build.webp', ph:.78, hx:.3, hy:.16, cy:[.08,.31], no:'02', word:'BUILD', acc:'--r-coral', line:{en:'<b>build</b> AI products where every answer cites its page.',vi:'<b>xây</b> sản phẩm AI mà câu trả lời nào cũng chỉ ra nguồn.'},
      cards:[
        { t:'viRAGops · /ask', h:`<div class="sm" style="color:var(--ink)">Students may miss up to <b>20% of sessions</b> <span class="cite">QC §12.3</span></div><div class="chips"><span class="chip ok">faithful ✓</span><span class="chip ok">cited ✓</span></div>` },
        { t:'Eval gate · CI', h:`<div class="chips"><span class="chip ok">PASS</span><span class="chip warn">WARN</span><span class="chip no">BLOCK</span></div><div class="sm"><b>300</b>-question golden set before any change ships</div>` },
        { t:'Study app · iOS / Android', h:`<div class="sm" style="color:var(--ink)">“Định nghĩa entropy?”</div><div class="sm">→ answer anchored to <span class="cite">p. 42</span> or an honest “not in your file”</div>` } ] },
    { id:'data', img:'/img/hero-data.webp', ph:.8, hx:.52, hy:.13, no:'03', word:'DATA', acc:'--r-cyan', line:{en:'<b>pipe data</b> from raw files to indexed, versioned, monitored.',vi:'<b>dựng dữ liệu</b> từ file thô đến chỉ mục, có phiên bản, có giám sát.'},
      cards:[
        { t:'DataOps', h:`<div class="pipe"><span>ingest</span><i></i><span>chunk</span><i></i><span>embed</span><i></i><span>index</span></div><div class="sm">Qdrant · pgvector · BM25 hybrid</div>` },
        { t:'7 source types', h:`<div class="chips"><span class="chip">PDF</span><span class="chip">DOCX</span><span class="chip">MD</span><span class="chip">Notion</span><span class="chip">Web</span><span class="chip">Sitemap</span></div>` },
        { t:'MLOps · AWS', h:`<div class="sm"><b>DVC → MLflow → ECS</b><br>drift detected → retrain → smoke test</div>` } ] },
    { id:'play', img:'/img/hero-play.webp', ph:.92, hx:.5, hy:.08, no:'04', word:'PLAY', acc:'--r-blue', line:{en:'<b>play</b> for the team — on court and in code.',vi:'<b>chơi</b> vì đội — trên sân bóng và trong code.'},
      cards:[
        { t:'Volleyball', h:`<div class="big">#9</div><div class="sm">Faculty of IT team · <b>4 straight years</b>, every year of uni</div>` },
        { t:'English', h:`<div class="big">6.0</div><div class="sm">IELTS · Aug 2026 · papers & docs daily</div>` },
        { t:'Teams', h:`<div class="sm" style="color:var(--ink);font-size:15px">Thesis duo · TMA BU2</div><div class="sm">from Đồng Tháp to HCMC · <b>team-first</b> on court and in code</div>` } ] },
  ];

  const giant = $('#giant'), heads = $('#heads'), roleLine = $('#roleLine');
  const hero = $('.hero'), svg = $('#lines'), portrait = $('#portrait');
  HEADS.forEach((h, i) => {
    const b = document.createElement('button');
    b.className = 'tab'; b.type = 'button'; b.role = 'tab'; b.id = 'tab-' + h.id;
    b.innerHTML = `<small>${h.no}</small>${h.id.toUpperCase()}<i class="prog"></i>`;
    b.onclick = () => { select(i); hold(); };
    heads.appendChild(b);
  });
  const cardEls = ['#o1', '#o2', '#o3'].map($);
  let cur = -1, timer, holdT;
  function setWord(w) {
    giant.style.setProperty('--len', w.length);
    giant.innerHTML = [...w].map(c => `<span>${c}</span>`).join('');
    giant.querySelectorAll('span').forEach((s, i) => s.style.transitionDelay = (i * 35) + 'ms');
  }
  function select(i) {
    if (i === cur) return; cur = i; const h = HEADS[i];
    root.style.setProperty('--acc', `var(${h.acc})`);
    heads.querySelectorAll('.tab').forEach((t, k) => t.setAttribute('aria-selected', k === i));
    roleLine.innerHTML = h.line[lang];
    if (reduce) { setWord(h.word); fill(h); setPortrait(h); return; }
    giant.classList.add('out');
    portrait.classList.add('swap');
    cardEls.forEach(c => c.classList.add('swap'));
    setTimeout(() => {
      setPortrait(h);
      setWord(h.word); giant.classList.remove('out'); giant.classList.add('pre');
      requestAnimationFrame(() => requestAnimationFrame(() => giant.classList.remove('pre')));
      fill(h); cardEls.forEach((c, k) => setTimeout(() => c.classList.remove('swap'), 90 * k));
    }, 380);
    schedule();
  }
  function setPortrait(h) {
    const done = () => { portrait.classList.remove('swap'); layout(); };
    hero.style.setProperty('--ph', h.ph);
    if (portrait.getAttribute('src') === h.img) return done();
    portrait.onload = done; portrait.src = h.img;
    if (portrait.complete) done();
  }
  function fill(h) { cardEls.forEach((c, k) => c.querySelector('.core').innerHTML = `<div class="t"><span>${h.cards[k].t}</span><em>H${h.no}</em></div>${h.cards[k].h}`); }
  function schedule() { clearTimeout(timer); if (!reduce && !heads.classList.contains('paused')) timer = setTimeout(() => select((cur + 1) % HEADS.length), 5500); }
  function hold() { heads.classList.add('paused'); clearTimeout(timer); clearTimeout(holdT); holdT = setTimeout(() => { heads.classList.remove('paused'); schedule(); }, 14000); }

  /* orbit positions + attention lines (desktop) */
  function layout() {
    if (cur < 0) return;
    const wide = innerWidth > 820, h = HEADS[cur];
    const W = hero.clientWidth, H = hero.clientHeight;
    const pr = portrait.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const head = { x: pr.left - hr.left + pr.width * h.hx, y: pr.top - hr.top + pr.height * h.hy };
    // thẻ trái: ngay dưới cột chữ — chỉ hiện khi còn đủ chỗ phía trên thanh chọn head (không bao giờ che nút)
    // thẻ phải: giữa ảnh và cột chỉ số, không bao giờ đè lên cột đó
    const left = $('.h-left').getBoundingClientRect(), stats = $('.h-right'), cw = 236;
    const rightLimit = (stats.offsetParent ? stats.getBoundingClientRect().left - hr.left : W - 32) - cw - 20;
    const leftTop = left.bottom - hr.top + 28, leftFits = leftTop + cardEls[0].offsetHeight < H - 96;
    const spots = [
      { x: left.left - hr.left, y: leftTop },
      { x: Math.min(Math.max(head.x + 90, pr.right - hr.left - 60), rightLimit), y: H * (h.cy ? h.cy[0] : .13) },
      { x: Math.min(Math.max(head.x + 120, pr.right - hr.left - 40), rightLimit), y: H * (h.cy ? h.cy[1] : .47) } ];
    cardEls.forEach((c, k) => {
      c.classList.toggle('off', wide && k === 0 && !leftFits);
      if (wide) { c.style.left = Math.max(16, spots[k].x) + 'px'; c.style.top = spots[k].y + 'px'; } else { c.style.left = c.style.top = ''; } });
    if (!wide) { svg.innerHTML = ''; return; }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let d = '';
    cardEls.forEach((c, k) => {
      if (c.classList.contains('off')) return;
      const r = c.getBoundingClientRect(); const ax = (k === 0 ? r.right : r.left) - hr.left, ay = r.top - hr.top + 40;
      const mx = (head.x + ax) / 2;
      const p = `M${head.x} ${head.y} C ${mx} ${head.y - 40}, ${mx} ${ay}, ${ax} ${ay}`;
      d += `<path d="${p}"/><path class="pulse" d="${p}"/><circle cx="${ax}" cy="${ay}" r="3.5"/>`;
    });
    svg.innerHTML = d;
  }
  addEventListener('resize', layout);
  new ResizeObserver(() => layout()).observe($('.h-left'));          // chữ dài hơn (tiếng Việt, font tải xong) → xếp lại
  document.fonts && document.fonts.ready.then(layout);
  HEADS.forEach(h => { const im = new Image(); im.src = h.img; });  // tải trước ảnh của mọi head

  /* marquee */
  const words = ['RAG', 'AI Agents', 'LLMOps', 'Attention', 'PyTorch', 'Evaluation', 'Vietnamese NLP', 'Computer Vision', 'MLOps', 'Volleyball #9'];
  const seq = words.map((w, i) => `<span class="${i % 2 ? 'o' : ''}">${w}</span><span class="star">✦</span>`).join('');
  $('#track').innerHTML = seq + seq;

  /* stop-motion: 4 dáng đổi liên tục; dừng khi rê chuột / giảm chuyển động */
  const poseImgs = [...document.querySelectorAll('#poses img')]; let pi = 1, poseHover = false;
  poseImgs[pi].classList.add('on');
  $('#poses').addEventListener('pointerenter', () => poseHover = true); $('#poses').addEventListener('pointerleave', () => poseHover = false);
  if (!reduce) setInterval(() => { if (poseHover) return; poseImgs[pi].classList.remove('on'); pi = (pi + 1) % poseImgs.length; poseImgs[pi].classList.add('on'); }, 650);

  /* heatmap card */
  $('#heat').innerHTML = Array.from({ length: 40 }, (_, i) => `<i style="--o:${(0.15 + Math.abs(Math.sin(i * 1.7)) * .85).toFixed(2)};--d:${-(i % 7) * .4}s"></i>`).join('');

  /* research lens */
  const box = $('#lensBox'), lens = $('#lens');
  box.querySelectorAll('.chunk').forEach(ch => { const s = ch.querySelector('small').outerHTML; const txt = ch.textContent.replace(ch.querySelector('small').textContent, '').trim(); ch.innerHTML = s + txt.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); });
  const lw = [...box.querySelectorAll('.w')];
  function lensAt(x, y) { const r = box.getBoundingClientRect(); lens.style.left = (x - r.left) + 'px'; lens.style.top = (y - r.top) + 'px';
    lw.forEach(w => { const b = w.getBoundingClientRect(); const d = Math.hypot(b.left + b.width / 2 - x, b.top + b.height / 2 - y); w.style.setProperty('--a', Math.max(0, 1 - d / 120).toFixed(2)); }); }
  let lensHover = false;
  box.addEventListener('pointermove', e => { lensHover = true; lensAt(e.clientX, e.clientY); });
  box.addEventListener('pointerleave', () => lensHover = false);
  const t0 = performance.now();
  (function idle(t) { if (!lensHover) { const r = box.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { const k = reduce ? .35 : ((t - t0) / 6000) % 1;
      lensAt(r.left + r.width * (.2 + .6 * (.5 - .5 * Math.cos(k * 6.283))), r.top + r.height * (.25 + .5 * (.5 - .5 * Math.cos(k * 12.566)))); } }
    if (!reduce) requestAnimationFrame(idle); })(t0);

  /* counters when in view */
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target, end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suf || '';
    if (reduce || dec) return; const s = performance.now(); const tick = n => { const k = Math.min(1, (n - s) / 1300), v = end * (1 - Math.pow(1 - k, 3)); el.textContent = v.toFixed(dec) + suf; if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));


  /* theme: Noir (tối) ↔ Paper (sáng), nhớ lựa chọn */
  $('#theme').onclick = () => { const next = root.dataset.skin === 'paper' ? 'noir' : 'paper'; root.dataset.skin = next;
    try { localStorage.setItem('skin', next); } catch {} };

  /* copy email */
  const label0 = $('#copy span').textContent;
  $('#copy').onclick = async () => { const lbl = $('#copy span'); try { await navigator.clipboard.writeText($('#mail').textContent); lbl.textContent = lang === 'vi' ? 'Đã chép' : 'Copied'; } catch { getSelection().selectAllChildren($('#mail')); lbl.textContent = lang === 'vi' ? 'Đã chọn — Ctrl+C' : 'Selected — Ctrl+C'; } setTimeout(() => lbl.textContent = label0, 2200); };

  select(0); requestAnimationFrame(layout);
})();
