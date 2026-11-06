'use strict';
(() => {
  const D = window.LATTO;
  if (!D) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const groupById = Object.fromEntries(D.groups.map(g => [g.id, g]));
  const personById = Object.fromEntries(D.people.map(p => [p.id, p]));
  const wdUrl = q => `https://www.wikidata.org/wiki/${q}`;
  const tiesOf = id => D.ties.filter(t => t.a === id || t.b === id).map(t => t.text);
  const cite = p => p.page ? `Transcript, p. ${p.page}` : D.sources[p.src];

  /* ---------- Simple lists ---------- */

  $('link-carnegie-quote').href = D.links.carnegie;

  $('steps').innerHTML = D.recovery.map(s => `
    <li><p class="when">${esc(s.when)}</p><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('');

  $('main-bill').innerHTML = D.mainHall.map(a => `
    <li><span>${esc(a.name)}</span>${a.note ? `<small>${esc(a.note)}</small>` : ''}</li>`).join('');

  $('recital-bill').innerHTML = D.lineup.map(l => `
    <li><span>${esc(l.name)}</span><small>${esc(l.role)}</small></li>`).join('');

  $('lineup').innerHTML = D.lineup.map(l => `
    <li${l.self ? ' class="self"' : ''}>
      <div class="printed">${esc(l.printed)}${l.printedRole ? `<small>${esc(l.printedRole)}</small>` : '<small class="lost">instrument torn away</small>'}</div>
      <div class="who">${esc(l.name)} <span>· ${esc(l.role)}</span>${l.note ? `<p>${esc(l.note)}</p>` : ''}</div>
    </li>`).join('');

  $('quotes').innerHTML = D.quotes.map(q => `
    <blockquote><p>${esc(q.text)}</p><footer>${esc(q.context)} · Transcript, p. ${q.page}</footer></blockquote>`).join('');

  $('road').innerHTML = D.road.map(r => `
    <article><h4>${esc(r.place)}</h4><p>${esc(r.text)}</p>
      <blockquote><p>${esc(r.quote)}</p><footer>Transcript, p. ${r.page}</footer></blockquote></article>`).join('');

  $('source-list').innerHTML = [
    [D.links.interview, 'The 2015 interview', 'Linked Jazz interview with Zena Latto, March 25, 2015, with her written corrections. Internet Archive.'],
    [D.links.carnegie, '“Zena’s Flyer”', 'Gino Francesconi’s account of the phone call, the missing concert and the flyer’s conservation. Carnegie Hall, 2016.'],
    [D.links.wikipedia, 'Zena Latto on Wikipedia', 'Written by members of the Semantic Lab. Source here for her birth and death dates and a few others, marked where used.'],
    [D.links.wikidata, 'Zena Latto on Wikidata', `Item ${D.subject.wd}, the identifier that ties her to the people she named.`],
    [D.links.linkedjazz, 'Linked Jazz', 'The research project on relationships among jazz musicians that conducted the interview.'],
    [D.links.semlab, 'Semantic Lab at Pratt', 'The lab that holds and digitized Zena’s archive.'],
  ].map(([href, title, text]) => `<li><a href="${esc(href)}">${esc(title)}</a><p>${esc(text)}</p></li>`).join('');

  const video = $('flyer-video');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) video.controls = true;
  else { video.autoplay = true; video.play().catch(() => { video.controls = true; }); }

  /* ---------- Tooltip shared by the timeline ---------- */

  function tooltip(host) {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.setAttribute('role', 'tooltip');
    host.appendChild(tip);
    const place = (x, y) => {
      const w = host.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = Math.max(0, Math.min(w - tw, x + 14)) + 'px';
      tip.style.top = (y + 18 + th > host.clientHeight + 60 ? y - th - 12 : y + 18) + 'px';
    };
    return {
      show(html, x, y) { tip.innerHTML = html; tip.classList.add('show'); place(x, y); },
      hide() { tip.classList.remove('show'); },
    };
  }

  /* ---------- Network ---------- */

  function network() {
    const host = $('network');
    const W = 1160, H = 600, cx = W / 2, cy = H / 2, R = 250, step = 32, ruleInset = 168;
    const pos = {};
    const rules = [];

    for (const side of ['left', 'right']) {
      const groups = D.groups.filter(g => g.side === side);
      const slots = [];
      let s = 0;
      groups.forEach((g, gi) => {
        if (gi) s += 0.5;
        const members = D.people.filter(p => p.group === g.id);
        const first = s;
        members.forEach(p => { slots.push([p, s]); s += 1; });
        rules.push({ g, side, first, last: s - 1 });
      });
      const span = s - 1;
      const yOf = slot => cy + (slot - span / 2) * step;
      for (const [p, slot] of slots) {
        const y = yOf(slot), dx = Math.sqrt(R * R - (y - cy) ** 2);
        pos[p.id] = { x: side === 'left' ? cx - dx : cx + dx, y, side };
      }
      for (const r of rules.filter(r => r.side === side)) { r.y1 = yOf(r.first) - 11; r.y2 = yOf(r.last) + 11; }
    }

    const wrap = (label, max = 15) => label.split(' ').reduce((lines, word) => {
      const last = lines[lines.length - 1];
      if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
      else lines.push(word);
      return lines;
    }, []);

    const edges = D.people.map(p => {
      const { x, y } = pos[p.id];
      return `<line class="edge" data-id="${p.id}" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${groupById[p.group].color}"/>`;
    }).join('');

    const ties = D.ties.map(t => {
      const a = pos[t.a], b = pos[t.b];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const qx = mx + (cx - mx) * 0.35, qy = my + (cy - my) * 0.35;
      return `<path class="tie" data-a="${t.a}" data-b="${t.b}" d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}"/>`;
    }).join('');

    const ruleMarks = rules.map(r => {
      const x = r.side === 'left' ? ruleInset : W - ruleInset;
      const tx = r.side === 'left' ? x - 12 : x + 12;
      const lines = wrap(r.g.label);
      const mid = (r.y1 + r.y2) / 2 - (lines.length - 1) * 7 + 4;
      return `<line class="group-rule" x1="${x}" x2="${x}" y1="${r.y1}" y2="${r.y2}" stroke="${r.g.color}"/>
        <text class="group-label" x="${tx}" y="${mid}" text-anchor="${r.side === 'left' ? 'end' : 'start'}">${lines.map((l, i) => `<tspan x="${tx}" dy="${i ? 14 : 0}">${esc(l)}</tspan>`).join('')}</text>`;
    }).join('');

    const nodes = D.people.map(p => {
      const { x, y, side } = pos[p.id], left = side === 'left';
      const g = groupById[p.group];
      return `<g class="node" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(`${p.name}, ${p.role}. ${g.label}.`)}">
        <rect class="hit" x="${(left ? x - 160 : x - 12).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="172" height="28" rx="4"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${g.color}"/>
        <text x="${(left ? x - 13 : x + 13).toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="${left ? 'end' : 'start'}">${esc(p.name)}</text>
      </g>`;
    }).join('');

    host.innerHTML = `<svg class="net" viewBox="0 0 ${W} ${H}" aria-hidden="false">
      ${ties}${edges}${ruleMarks}
      <g class="ego"><circle cx="${cx}" cy="${cy}" r="42"/><text x="${cx}" y="${cy - 2}" text-anchor="middle">Zena</text><text x="${cx}" y="${cy + 14}" text-anchor="middle">Latto</text></g>
      ${nodes}</svg>`;

    $('net-legend').innerHTML = D.groups.map(g =>
      `<li><i style="background:${g.color}"></i>${esc(g.label)} <b>${D.people.filter(p => p.group === g.id).length}</b></li>`).join('');

    $('net-list').innerHTML = D.groups.map(g => `
      <h4><i style="background:${g.color}"></i>${esc(g.label)}</h4>
      <ul>${D.people.filter(p => p.group === g.id).map(p =>
        `<li><div>${p.wd ? `<a href="${wdUrl(p.wd)}">${esc(p.name)}</a>` : esc(p.name)} <span>· ${esc(p.role)}</span></div><span>${esc([p.said, ...tiesOf(p.id).map(t => t + '.')].join(' '))}</span></li>`).join('')}</ul>`).join('');

    const svg = host.querySelector('svg');
    const detail = $('net-detail');
    let pinned = null;

    function render(id) {
      svg.classList.toggle('active', !!id);
      const near = new Set();
      svg.querySelectorAll('.tie').forEach(t => {
        const on = id && (t.dataset.a === id || t.dataset.b === id);
        t.classList.toggle('on', !!on);
        if (on) near.add(t.dataset.a === id ? t.dataset.b : t.dataset.a);
      });
      svg.querySelectorAll('.edge').forEach(e => e.classList.toggle('on', e.dataset.id === id));
      svg.querySelectorAll('.node').forEach(n => {
        n.classList.toggle('on', n.dataset.id === id);
        n.classList.toggle('near', near.has(n.dataset.id));
        n.setAttribute('aria-pressed', String(n.dataset.id === pinned));
      });

      if (!id) {
        detail.innerHTML = `<div><h3>${esc(D.subject.name)}</h3><p class="meta">Clarinet, tenor and baritone sax</p>
          <p class="links"><a href="${D.links.wikidata}">Wikidata ${D.subject.wd}</a></p></div>
          <div><p class="said">Born ${esc(D.subject.born)}. Died ${esc(D.subject.died)}.</p>
          <blockquote>I met so many. I think I’m very lucky.<cite>Transcript, p. 13</cite></blockquote></div>`;
        return;
      }
      const p = personById[id], g = groupById[p.group];
      const tied = tiesOf(id);
      detail.innerHTML = `<div><h3>${esc(p.name)}</h3>
          <p class="meta"><i style="background:${g.color}"></i>${esc(g.label)} · ${esc(p.role)}</p>
          <p class="links">${p.wd ? `<a href="${wdUrl(p.wd)}">Wikidata ${p.wd}</a>` : 'No Wikidata item matched yet'}</p></div>
        <div><p class="said">${esc(p.said)}</p>${tied.length ? `<p class="note">In her account: ${esc(tied.join('; '))}.</p>` : ''}
          ${p.quote ? `<blockquote>${esc(p.quote)}<cite>${esc(cite(p))}${p.src === 'correction' ? ', with her written correction' : ''}</cite></blockquote>` : `<p class="note">Source: ${esc(D.sources[p.src])}</p>`}</div>`;
    }

    svg.querySelectorAll('.node').forEach(n => {
      const id = n.dataset.id;
      n.addEventListener('pointerenter', () => render(id));
      n.addEventListener('pointerleave', () => render(pinned));
      n.addEventListener('focus', () => render(id));
      n.addEventListener('blur', () => render(pinned));
      const toggle = () => { pinned = pinned === id ? null : id; render(pinned || id); };
      n.addEventListener('click', e => { e.stopPropagation(); toggle(); });
      n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
    svg.addEventListener('click', () => { pinned = null; render(null); });
    render(null);
  }

  /* ---------- Timeline ---------- */

  function timeline() {
    const host = $('timeline');
    const T = D.timeline;
    const W = 1100, left = 132, right = 30, plotW = W - left - right;
    const x = yr => left + (yr - T.start) / (T.end - T.start) * plotW;
    const barH = 18;
    let y = 56, lastGroup;
    const parts = [], hits = [];

    for (const lane of T.lanes) {
      if (lane.group !== lastGroup) {
        y += lane.group ? 28 : 0;
        if (lane.group) parts.push(`<text class="lane-group" x="0" y="${y - 22}">${esc(lane.group)}</text>`);
        lastGroup = lane.group;
      }
      parts.push(`<text class="lane-label" x="${left - 14}" y="${y + 4}" text-anchor="end">${esc(lane.label)}</text>`);
      for (const b of lane.bars) {
        const x1 = x(b.from), w = Math.max(4, x(b.to) - x1 - 2);
        const cls = b.tone || '';
        parts.push(`<rect class="bar ${cls}" x="${x1.toFixed(1)}" y="${y - barH / 2}" width="${w.toFixed(1)}" height="${barH}" rx="4"/>`);
        if (b.label) {
          if (b.labelOutside) parts.push(`<text class="bar-label out" x="${(x1 + w + 8).toFixed(1)}" y="${y + 4}">${esc(b.label)}</text>`);
          else parts.push(`<text class="bar-label ${cls}" x="${(x1 + 9).toFixed(1)}" y="${y + 4}">${esc(b.label)}</text>`);
        }
        const title = lane.id === 'home' ? b.label : lane.label;
        hits.push({ svg: `<rect class="hit" tabindex="0" x="${x1.toFixed(1)}" y="${y - 14}" width="${Math.max(24, w).toFixed(1)}" height="28"
          data-tip="${esc(`<b>${esc(title)}</b>${esc(b.detail)}<small>${esc(D.sources[b.src])}</small>`)}" aria-label="${esc(`${title}. ${b.detail}`)}"/>` });
      }
      y += 28;
    }

    const eventsY = y + 34;
    parts.push(`<text class="lane-group" x="0" y="${eventsY + 4}">Events</text>`);
    const gridBottom = eventsY;
    const decades = [];
    for (let d = Math.ceil(T.start / 10) * 10; d <= T.end; d += 10) decades.push(d);
    const grid = decades.map(d => `<line class="grid" x1="${x(d).toFixed(1)}" x2="${x(d).toFixed(1)}" y1="34" y2="${gridBottom}"/>
      <text x="${x(d).toFixed(1)}" y="22" text-anchor="middle">${d}</text>`).join('');

    const hero = T.events.find(e => e.hero);
    const marker = `<line class="marker" x1="${x(hero.at).toFixed(1)}" x2="${x(hero.at).toFixed(1)}" y1="34" y2="${eventsY}"/>`;

    const dots = T.events.map(e => {
      const ex = x(e.at), r = e.hero ? 7 : e.key ? 5.5 : 4.5;
      let label = '';
      if (e.key) {
        const anchor = ex < 190 ? 'start' : ex > W - 90 ? 'end' : 'middle';
        const lx = anchor === 'start' ? ex - 5 : anchor === 'end' ? ex + 5 : ex;
        label = `<text class="event-label" x="${lx.toFixed(1)}" y="${eventsY + 28}" text-anchor="${anchor}">${esc(e.short)}</text>
          <text class="event-year" x="${lx.toFixed(1)}" y="${eventsY + 44}" text-anchor="${anchor}">${Math.floor(e.at)}</text>`;
      }
      hits.push({ svg: `<circle class="hit" tabindex="0" cx="${ex.toFixed(1)}" cy="${eventsY}" r="12"
        data-tip="${esc(`<b>${esc(e.date)}</b>${esc(e.label)}<small>${esc(D.sources[e.src])}</small>`)}" aria-label="${esc(`${e.date}. ${e.label}`)}"/>` });
      return `<circle class="dot${e.key ? ' key' : ''}${e.hero ? ' hero' : ''}" cx="${ex.toFixed(1)}" cy="${eventsY}" r="${r}"/>${label}`;
    }).join('');

    const H = eventsY + 56;
    host.innerHTML = `<svg class="tl" viewBox="0 0 ${W} ${H}">
      <g class="axis">${grid}</g>${marker}${parts.join('')}${dots}${hits.map(h => h.svg).join('')}</svg>`;

    const tip = tooltip(host);
    host.querySelectorAll('.hit').forEach(h => {
      const html = h.dataset.tip;
      const at = e => { const r = host.getBoundingClientRect(); tip.show(html, e.clientX - r.left, e.clientY - r.top); };
      h.addEventListener('pointerenter', at);
      h.addEventListener('pointermove', at);
      h.addEventListener('pointerleave', tip.hide);
      h.addEventListener('focus', () => {
        const r = host.getBoundingClientRect(), b = h.getBoundingClientRect();
        tip.show(html, b.left + b.width / 2 - r.left, b.bottom - r.top - 12);
      });
      h.addEventListener('blur', tip.hide);
    });

    $('chrono').innerHTML = T.events.map(e => `
      <li${e.hero ? ' class="hero"' : ''}><time>${esc(e.date)}</time><div><span>${esc(e.label)}</span><small>${esc(D.sources[e.src])}</small></div></li>`).join('');
  }

  network();
  timeline();
})();
