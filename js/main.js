(() => {
  const topo = document.getElementById('topo');
  const nav = document.getElementById('nav');
  const menuBtn = document.querySelector('.menu-btn');
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('ano').textContent = new Date().getFullYear();

  // ---------- topo ----------
  const atualizaTopo = () => topo.classList.toggle('rolado', window.scrollY > 40);
  atualizaTopo();
  window.addEventListener('scroll', atualizaTopo, { passive: true });

  const fechaMenu = () => {
    nav.classList.remove('aberto');
    topo.classList.remove('menu-aberto');
    menuBtn.setAttribute('aria-expanded', 'false');
  };
  menuBtn.addEventListener('click', () => {
    const abrir = !nav.classList.contains('aberto');
    nav.classList.toggle('aberto', abrir);
    topo.classList.toggle('menu-aberto', abrir);
    menuBtn.setAttribute('aria-expanded', String(abrir));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', fechaMenu));

  // ---------- link ativo ----------
  const links = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
  const secoes = links.map(a => document.querySelector(a.getAttribute('href')));
  const obsSecao = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('ativo', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secoes.forEach(s => s && obsSecao.observe(s));

  // ---------- revelar ao rolar ----------
  const obsRevelar = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visivel'); obsRevelar.unobserve(e.target); }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.revelar').forEach(el => obsRevelar.observe(el));

  // ---------- formulário (enviado pelo Netlify Forms) ----------
  const textos = {
    pt: {
      erro: 'Preencha nome, e-mail e mensagem.',
      enviando: 'Enviando…',
      ok: 'Mensagem enviada! Retornaremos em breve.',
      falha: 'Não foi possível enviar agora. Escreva para <a href="mailto:emmatech@emmatech.com.br">emmatech@emmatech.com.br</a> ou ligue (21) 3553-1420.',
      assunto: 'Contato pelo site EMMA',
    },
    en: {
      erro: 'Please fill in your name, email and message.',
      enviando: 'Sending…',
      ok: 'Message sent! We will be in touch shortly.',
      falha: 'We could not send your message just now. Please email <a href="mailto:emmatech@emmatech.com.br">emmatech@emmatech.com.br</a> or call +55 21 3553-1420.',
      assunto: 'Website enquiry (EN) - EMMA',
    },
  };
  const t = textos[document.documentElement.lang.slice(0, 2)] || textos.pt;
  const form = document.getElementById('form-contato');
  const nota = document.getElementById('form-nota');
  const botao = form.querySelector('button[type="submit"]');
  const aviso = (html, cor = '') => { nota.innerHTML = html; nota.style.color = cor; };

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(c => {
      const valido = c.value.trim() && (c.type !== 'email' || /\S+@\S+\.\S+/.test(c.value));
      c.classList.toggle('invalido', !valido);
      if (!valido) ok = false;
    });
    if (!ok) { aviso(t.erro, '#e5534b'); return; }

    form.elements.subject.value = `${t.assunto} — ${form.elements.servico.value}`;
    botao.disabled = true;
    aviso(t.enviando);
    try {
      const resp = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!resp.ok) throw new Error(resp.status);
      form.reset();
      aviso(t.ok, '#3fb950');
    } catch {
      aviso(t.falha, '#e5534b');
    } finally {
      botao.disabled = false;
    }
  });

  // ---------- nuvem de pontos 3D ----------
  const canvas = document.getElementById('nuvem');
  const ctx = canvas.getContext('2d');
  const cx = document.getElementById('cx'), cy = document.getElementById('cy'), cz = document.getElementById('cz');
  const pontos = [];
  const add = (x, y, z) => pontos.push([x, y, z]);
  const r = Math.random;

  // tanque cilíndrico
  for (let i = 0; i < 1300; i++) {
    const a = r() * Math.PI * 2, h = r() * 1.6 - .9;
    add(Math.cos(a) * .55 - .35, h, Math.sin(a) * .55);
  }
  // teto do tanque
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * .55;
    add(Math.cos(a) * d - .35, -.9 - (1 - d / .55) * .12, Math.sin(a) * d);
  }
  // tubulações horizontais
  const tubo = (x0, x1, y, z, raio, n) => {
    for (let i = 0; i < n; i++) {
      const t = r(), a = r() * Math.PI * 2;
      add(x0 + (x1 - x0) * t, y + Math.cos(a) * raio, z + Math.sin(a) * raio);
    }
  };
  tubo(.2, 1.3, .1, .15, .06, 260);
  tubo(.2, 1.3, .35, -.1, .08, 300);
  tubo(.2, 1.3, -.2, .35, .045, 200);
  // estrutura (pórtico)
  const viga = (p, q, n) => {
    for (let i = 0; i < n; i++) {
      const t = r();
      add(p[0] + (q[0] - p[0]) * t + (r() - .5) * .02, p[1] + (q[1] - p[1]) * t + (r() - .5) * .02, p[2] + (q[2] - p[2]) * t + (r() - .5) * .02);
    }
  };
  [[.5, .5], [1.1, .5], [.5, -.4], [1.1, -.4]].forEach(([x, z]) => viga([x, .7, z], [x, -.6, z], 90));
  viga([.5, -.6, .5], [1.1, -.6, .5], 60); viga([.5, -.6, -.4], [1.1, -.6, -.4], 60);
  viga([.5, -.6, .5], [.5, -.6, -.4], 60); viga([1.1, -.6, .5], [1.1, -.6, -.4], 60);
  viga([.5, .7, .5], [1.1, -.6, .5], 70); viga([1.1, .7, -.4], [.5, -.6, -.4], 70);
  // piso
  for (let i = 0; i < 700; i++) add(r() * 2.6 - 1.1, .72 + (r() - .5) * .01, r() * 1.8 - .9);

  let larg, alt, dpr, centroX, centroY, escala;
  const redimensiona = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    larg = canvas.clientWidth; alt = canvas.clientHeight;
    canvas.width = larg * dpr; canvas.height = alt * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const largo = larg > 820;
    centroX = largo ? larg * .7 : larg * .5;
    centroY = largo ? alt * .5 : alt * .62;
    escala = largo ? Math.min(larg, alt) * .3 : Math.min(larg, alt) * .38;
    canvas.style.opacity = largo ? 1 : .35;
  };
  redimensiona();
  window.addEventListener('resize', redimensiona);

  let ang = .6, varredura = -1.4, ultimoCoord = 0, visivel = true;
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(canvas);

  const desenha = t => {
    if (visivel) {
      ctx.clearRect(0, 0, larg, alt);
      const s = Math.sin(ang), c = Math.cos(ang);
      const inc = .35, si = Math.sin(inc), ci = Math.cos(inc);
      for (const [x, y, z] of pontos) {
        const xr = x * c - z * s, zr = x * s + z * c;
        const yr = y * ci - zr * si, zz = y * si + zr * ci;
        const p = 3 / (3 + zz);
        const px = centroX + xr * escala * p, py = centroY + yr * escala * p;
        const perto = Math.abs(x - varredura) < .05;
        ctx.fillStyle = perto ? 'rgba(88,166,255,.95)' : `rgba(201,209,218,${.18 + (1 - zz) * .22})`;
        const tam = perto ? 2.2 : 1.3 * p;
        ctx.fillRect(px, py, tam, tam);
      }
      if (!reduzirMovimento) {
        ang += .0022;
        varredura += .006;
        if (varredura > 1.6) varredura = -1.4;
      }
      if (t - ultimoCoord > 140) {
        const q = pontos[(r() * pontos.length) | 0];
        cx.textContent = (q[0] * 10).toFixed(3);
        cy.textContent = (q[2] * 10).toFixed(3);
        cz.textContent = (-q[1] * 10).toFixed(3);
        ultimoCoord = t;
      }
    }
    if (!reduzirMovimento) requestAnimationFrame(desenha);
  };
  requestAnimationFrame(desenha);
})();
