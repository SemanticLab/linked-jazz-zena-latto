'use strict';
/*
  The photo album section. Everything shown here is read live from the Semantic Lab
  wikibase (base.semlab.io): the photograph items of the Zena Latto Project, the page
  block each one is part of, and the people, places and bands its statements name.
  Images are the files those items point to, with a small thumbnail beside each one.
*/
(() => {
  const host = document.getElementById('album-app');
  if (!host) return;

  const ENDPOINT = 'https://query.semlab.io/proxy/wdqs/bigdata/namespace/wdq/sparql';
  const ENTITY = 'http://base.semlab.io/entity/';
  const ITEM_URL = q => `https://base.semlab.io/wiki/Item:${q}`;
  const PROJECT = 'Q39868';      // Zena Latto Project
  const PHOTOGRAPH = 'Q22310';   // class: photograph
  const CERTAINTY = { Q28898: 'inferred', Q22289: 'unsure reading' };

  const PREFIXES = `
    PREFIX wd: <http://base.semlab.io/entity/>
    PREFIX wdt: <http://base.semlab.io/prop/direct/>
    PREFIX p: <http://base.semlab.io/prop/>
    PREFIX ps: <http://base.semlab.io/prop/statement/>
    PREFIX pq: <http://base.semlab.io/prop/qualifier/>
    PREFIX psv: <http://base.semlab.io/prop/statement/value/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>`;

  // One row per photograph: file, caption, description, the page block it is part of (with the scan of
  // the whole page, which is the block's file URL), and its date.
  const PHOTOS = `${PREFIXES}
    SELECT ?photo ?localId ?file ?title ?desc ?credit ?page ?blockText ?pageImage ?date ?prec ?dateAsWritten WHERE {
      ?photo wdt:P1 wd:${PHOTOGRAPH} ; wdt:P11 wd:${PROJECT} ; wdt:P17 ?localId ; wdt:P200 ?file .
      OPTIONAL { ?photo wdt:P82 ?title }
      OPTIONAL { ?photo wdt:P130 ?desc }
      OPTIONAL { ?photo wdt:P136 ?credit }
      OPTIONAL { ?photo wdt:P96 ?block . ?block wdt:P87 ?page . OPTIONAL { ?block wdt:P19 ?blockText } OPTIONAL { ?block wdt:P200 ?pageImage } }
      OPTIONAL { ?photo p:P98 ?ds . ?ds psv:P98 ?dv . ?dv wikibase:timeValue ?date ; wikibase:timePrecision ?prec .
                 OPTIONAL { ?ds pq:P141 ?dateAsWritten } }
    }`;

  // One row per statement: who is depicted (P135), where (P125), and which band the page is about (P77).
  const LINKS = `${PREFIXES}
    SELECT ?photo ?prop ?item ?itemLabel ?namedAs ?certainty WHERE {
      VALUES (?prop ?ps) { (p:P135 ps:P135) (p:P125 ps:P125) (p:P77 ps:P77) }
      ?photo wdt:P11 wd:${PROJECT} ; wdt:P1 wd:${PHOTOGRAPH} ; ?prop ?st .
      ?st ?ps ?item .
      ?item rdfs:label ?itemLabel .
      OPTIONAL { ?st pq:P141 ?namedAs }
      OPTIONAL { ?st pq:P137 ?certainty }
    }`;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const qid = uri => uri.slice(uri.lastIndexOf('/') + 1);
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  async function sparql(query) {
    const res = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`The wikibase answered ${res.status}`);
    return (await res.json()).results.bindings;
  }

  function dateText(iso, prec) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    if (prec <= 8) return `${y}s`;
    if (prec === 9) return String(y);
    if (prec === 10) return `${MONTHS[m - 1]} ${y}`;
    return `${MONTHS[m - 1]} ${d}, ${y}`;
  }

  // The block text starts with the page number and whatever is written on the page above the photos.
  function pageWriting(blockText) {
    const out = [];
    for (const part of String(blockText ?? '').split(/\s{3,}/).slice(1)) {
      if (part.startsWith('[Latto_')) break;
      out.push(part);
    }
    return out.join(' · ');
  }

  function build(photoRows, linkRows) {
    const byQ = new Map();
    for (const r of photoRows) {
      const q = qid(r.photo.value);
      if (byQ.has(q)) continue;
      const file = r.file.value;
      const cut = file.lastIndexOf('/') + 1;
      const prec = r.prec ? Number(r.prec.value) : null;
      byQ.set(q, {
        q,
        id: r.localId.value,
        file,
        thumb: `${file.slice(0, cut)}thumbs/${file.slice(cut)}`,
        caption: r.title?.value ?? '',
        desc: r.desc?.value ?? '',
        credit: r.credit?.value ?? '',
        page: r.page?.value ?? null,
        pageWriting: pageWriting(r.blockText?.value),
        pageImage: r.pageImage?.value ?? '',
        date: r.date ? { text: dateText(r.date.value, prec), written: r.dateAsWritten?.value ?? '' } : null,
        year: r.date ? (prec <= 8 ? `${r.date.value.slice(0, 4)}s` : r.date.value.slice(0, 4)) : '',
        people: [], places: [], subjects: [],
      });
    }
    for (const r of linkRows) {
      const photo = byQ.get(qid(r.photo.value));
      if (!photo) continue;
      const entry = {
        q: qid(r.item.value),
        label: r.itemLabel.value,
        namedAs: r.namedAs?.value ?? '',
        certainty: r.certainty ? CERTAINTY[qid(r.certainty.value)] ?? '' : '',
      };
      const list = r.prop.value.endsWith('/P135') ? photo.people : r.prop.value.endsWith('/P125') ? photo.places : photo.subjects;
      if (!list.some(e => e.q === entry.q)) list.push(entry);
    }
    // Photographs of Zena from her papers come first, then the album in page order.
    const photos = [...byQ.values()].sort((a, b) =>
      (a.page !== null) - (b.page !== null) || a.id.localeCompare(b.id, 'en', { numeric: true }));
    for (const p of photos) {
      p.hay = fold([p.caption, p.desc, p.pageWriting, p.date?.text, p.date?.written,
        ...[...p.people, ...p.places, ...p.subjects].flatMap(e => [e.label, e.namedAs])].join(' \n '));
    }
    return photos;
  }

  const PER_PAGE = 25;
  const state = { photos: [], q: '', person: '', place: '', year: '', pageIndex: 0, shown: [] };

  const tally = (photos, pick) => {
    const m = new Map();
    for (const p of photos) for (const e of pick(p)) {
      const t = m.get(e.q) ?? { q: e.q, label: e.label, n: 0 };
      t.n += 1; m.set(e.q, t);
    }
    return [...m.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  };

  const filtering = () => !!(state.q.trim() || state.person || state.place || state.year);

  function matches(p) {
    if (state.person && !p.people.some(e => e.q === state.person)) return false;
    if (state.place && !p.places.some(e => e.q === state.place)) return false;
    if (state.year && (state.year === 'none' ? p.year !== '' : p.year !== state.year)) return false;
    const words = fold(state.q).split(/\s+/).filter(Boolean);
    return words.every(w => p.hay.includes(w));
  }

  const pageName = page => page ? `Album page ${Number(page)}` : 'From her papers';

  function card(p, i) {
    const names = p.people.map(e => esc(e.label)).join(', ');
    return `<li class="shot">
      <button type="button" class="shot-open" data-i="${i}" aria-label="${esc(`Open photograph: ${p.caption || 'no caption'}`)}">
        <img src="${esc(p.thumb)}" data-full="${esc(p.file)}" loading="lazy" decoding="async" alt="${esc(p.desc)}">
      </button>
      <div class="shot-text">
        <p class="shot-caption${p.caption ? '' : ' none'}">${p.caption ? esc(p.caption) : 'No caption'}</p>
        ${names ? `<p class="shot-names">${names}</p>` : ''}
        <p class="shot-meta">${esc([pageName(p.page), p.date?.text].filter(Boolean).join(' · '))}</p>
      </div>
    </li>`;
  }

  function pager(total, first, last, pageCount) {
    if (pageCount < 2) return '';
    return `<div class="pager">
        <button type="button" data-act="prev" ${state.pageIndex === 0 ? 'disabled' : ''} aria-label="Previous ${PER_PAGE} photographs">←</button>
        <span>${first}–${last} of ${total}</span>
        <button type="button" data-act="next" ${state.pageIndex >= pageCount - 1 ? 'disabled' : ''} aria-label="Next ${PER_PAGE} photographs">→</button>
      </div>`;
  }

  function render() {
    const { photos } = state;
    const on = filtering();
    const list = on ? photos.filter(matches) : photos;
    const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.pageIndex = Math.min(Math.max(0, state.pageIndex), pageCount - 1);
    const start = state.pageIndex * PER_PAGE;
    const slice = list.slice(start, start + PER_PAGE);
    const nav = pager(list.length, start + 1, start + slice.length, pageCount);

    let title, clearButton = '';
    if (on) {
      const bits = [];
      if (state.person) bits.push(`with ${state.people.find(e => e.q === state.person).label}`);
      if (state.place) bits.push(`at ${state.places.find(e => e.q === state.place).label}`);
      if (state.year) bits.push(state.year === 'none' ? 'with no date' : `from ${state.year}`);
      if (state.q.trim()) bits.push(`matching “${state.q.trim()}”`);
      title = `${list.length} photograph${list.length === 1 ? '' : 's'} ${esc(bits.join(', '))}`;
      clearButton = '<button type="button" class="album-clear" data-act="clear">Clear filters</button>';
    } else {
      title = `All ${list.length} photographs`;
    }

    state.shown = list;   // the large view steps through every match, not only the 25 on screen
    document.getElementById('album-view').innerHTML =
      `<div class="album-head"><h3>${title}</h3><div class="album-tools">${clearButton}${nav}</div></div>` +
      (slice.length
        ? `<ul class="shots">${slice.map((p, i) => card(p, start + i)).join('')}</ul>${nav ? `<div class="album-foot">${nav}</div>` : ''}`
        : '<p class="album-empty">No photograph matches. Captions are searched as she wrote them, so try a first name or a nickname.</p>');

    host.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.q === state.person)));
  }

  function controls() {
    const { photos } = state;
    state.people = tally(photos, p => p.people);
    state.places = tally(photos, p => p.places);
    const years = [...new Set(photos.map(p => p.year).filter(Boolean))].sort();
    const undated = photos.filter(p => !p.year).length;
    const TOP = 10;

    host.innerHTML = `
      <form class="album-controls" id="album-controls" role="search" aria-label="Search the album">
        <label class="field field-search"><span>Search captions, names and places</span>
          <input type="search" id="album-q" placeholder="Try Arnette, Strand, trumpet, wife" autocomplete="off"></label>
        <label class="field"><span>Place</span>
          <select id="album-place"><option value="">Anywhere</option>${state.places.map(e => `<option value="${e.q}">${esc(e.label)} (${e.n})</option>`).join('')}</select></label>
        <label class="field"><span>Year</span>
          <select id="album-year"><option value="">Any year</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}${undated ? `<option value="none">No date (${undated})</option>` : ''}</select></label>
      </form>
      <div class="chips" id="album-chips" role="group" aria-label="People pictured">
        ${state.people.map((e, i) => `<button type="button" class="chip${i >= TOP ? ' extra' : ''}" data-q="${e.q}" aria-pressed="false">${esc(e.label)} <b>${e.n}</b></button>`).join('')}
        ${state.people.length > TOP ? `<button type="button" class="chip-more" data-act="more" aria-expanded="false">All ${state.people.length} people</button>` : ''}
      </div>
      <div id="album-view" aria-live="polite"></div>
      <dialog class="lightbox" id="album-dialog" aria-label="Photograph"></dialog>`;

    // Any change to a filter starts again from the first 25.
    const set = (key, value) => { state[key] = value; state.pageIndex = 0; render(); };
    const turn = step => {
      state.pageIndex += step;
      render();
      const view = document.getElementById('album-view');
      if (view.getBoundingClientRect().top < 0) view.scrollIntoView({ block: 'start' });
    };
    document.getElementById('album-controls').addEventListener('submit', e => e.preventDefault());
    document.getElementById('album-q').addEventListener('input', e => set('q', e.target.value));
    document.getElementById('album-place').addEventListener('change', e => set('place', e.target.value));
    document.getElementById('album-year').addEventListener('change', e => set('year', e.target.value));

    document.getElementById('album-chips').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'more') {
        const open = document.getElementById('album-chips').classList.toggle('all');
        b.setAttribute('aria-expanded', String(open));
        b.textContent = open ? 'Fewer' : `All ${state.people.length} people`;
        return;
      }
      set('person', state.person === b.dataset.q ? '' : b.dataset.q);
    });

    document.getElementById('album-view').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.act === 'prev') turn(-1);
      else if (b.dataset.act === 'next') turn(1);
      else if (b.dataset.act === 'clear') clear();
      else if (b.classList.contains('shot-open')) open(Number(b.dataset.i));
    });
    // A missing thumbnail falls back to the full file the wikibase item points to.
    document.getElementById('album-view').addEventListener('error', e => {
      const img = e.target;
      if (img.tagName === 'IMG' && img.dataset.full && img.src !== img.dataset.full) img.src = img.dataset.full;
    }, true);
  }

  function clear() {
    Object.assign(state, { q: '', person: '', place: '', year: '', pageIndex: 0 });
    document.getElementById('album-q').value = '';
    document.getElementById('album-place').value = '';
    document.getElementById('album-year').value = '';
    render();
  }

  /* ---------- One photograph, large ---------- */

  function open(i) {
    const dialog = document.getElementById('album-dialog');
    const show = n => {
      const p = state.shown[n];
      const who = p.people.map(e => {
        const notes = [e.namedAs && fold(e.namedAs) !== fold(e.label) ? `written “${e.namedAs}”` : '', e.certainty].filter(Boolean).join(', ');
        return `<li><a href="${ITEM_URL(e.q)}">${esc(e.label)}</a>${notes ? ` <small>${esc(notes)}</small>` : ''}</li>`;
      }).join('');
      const where = [...p.places, ...p.subjects].map(e => `<a href="${ITEM_URL(e.q)}">${esc(e.label)}</a>`).join(', ');
      const when = p.date ? esc(p.date.text) + (p.date.written && fold(p.date.written) !== fold(p.date.text) ? ` <small>written “${esc(p.date.written)}”</small>` : '') : '';
      dialog.innerHTML = `
        <div class="lightbox-bar">
          <p>${esc(pageName(p.page))} · ${n + 1} of ${state.shown.length}</p>
          <div>
            <button type="button" data-go="${n - 1}" ${n === 0 ? 'disabled' : ''} aria-label="Previous photograph">←</button>
            <button type="button" data-go="${n + 1}" ${n === state.shown.length - 1 ? 'disabled' : ''} aria-label="Next photograph">→</button>
            <button type="button" data-close autofocus>Close</button>
          </div>
        </div>
        <div class="lightbox-body">
          <div class="lightbox-picture">
            <figure><img src="${esc(p.file)}" alt="${esc(p.desc)}"></figure>
            ${p.pageImage ? '<button type="button" class="lightbox-toggle" data-whole aria-pressed="false">See the whole album page</button>' : ''}
          </div>
          <div class="lightbox-text">
            <p class="lightbox-caption${p.caption ? '' : ' none'}">${p.caption ? p.caption.split(' / ').map(esc).join('<br>') : 'No caption'}</p>
            <dl>
              ${who ? `<dt>Pictured</dt><dd><ul>${who}</ul></dd>` : ''}
              ${when ? `<dt>Date</dt><dd>${when}</dd>` : ''}
              ${p.pageWriting ? `<dt>Written on the page</dt><dd>${esc(p.pageWriting)}</dd>` : ''}
              ${where ? `<dt>${p.places.length && p.subjects.length ? 'Place and band' : p.subjects.length ? 'Band' : 'Place'}</dt><dd>${where}</dd>` : ''}
              ${p.desc ? `<dt>What it shows</dt><dd>${esc(p.desc)}</dd>` : ''}
              ${p.credit ? `<dt>Credit</dt><dd>${esc(p.credit)}</dd>` : ''}
            </dl>
            <p class="lightbox-links"><a href="${ITEM_URL(p.q)}">This photograph in the wikibase</a> · <a href="${esc(p.file)}">Full-size image</a>${p.pageImage ? ` · <a href="${esc(p.pageImage)}">Full-size album page</a>` : ''}</p>
          </div>
        </div>`;
      dialog.dataset.n = n;
    };
    const go = n => { if (n >= 0 && n < state.shown.length) show(n); };
    // Swap between the single photograph and the scan of the album page it is on.
    const whole = b => {
      const p = state.shown[Number(dialog.dataset.n)];
      const on = b.getAttribute('aria-pressed') !== 'true';
      const img = dialog.querySelector('figure img');
      img.src = on ? p.pageImage : p.file;
      img.alt = on ? `${pageName(p.page)}, with all its photographs and her writing` : p.desc;
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'Back to this photograph' : 'See the whole album page';
    };
    dialog.onclick = e => {
      const b = e.target.closest('button');
      if (e.target === dialog || b?.hasAttribute('data-close')) dialog.close();
      else if (b?.dataset.go) go(Number(b.dataset.go));
      else if (b?.hasAttribute('data-whole')) whole(b);
    };
    dialog.onkeydown = e => {
      if (e.key === 'ArrowLeft') go(Number(dialog.dataset.n) - 1);
      if (e.key === 'ArrowRight') go(Number(dialog.dataset.n) + 1);
    };
    show(i);
    dialog.showModal();
    dialog.querySelector('[data-close]').focus();
  }

  /* ---------- Load ---------- */

  async function load() {
    host.innerHTML = '<p class="album-status">Loading the album from the Semantic Lab wikibase…</p>';
    try {
      const [photoRows, linkRows] = await Promise.all([sparql(PHOTOS), sparql(LINKS)]);
      state.photos = build(photoRows, linkRows);
      if (!state.photos.length) throw new Error('The wikibase returned no photographs');
      const album = state.photos.filter(p => p.page);
      const count = document.getElementById('album-count');
      if (count) count.textContent = `Shown here are ${state.photos.length - album.length} photographs of Zena from her papers, then the ${album.length} photographs from the ${new Set(album.map(p => p.page)).size} pages of the album.`;
      controls();
      render();
    } catch (err) {
      host.innerHTML = `<p class="album-status">The album could not be loaded from the wikibase (${esc(err.message)}).
        <button type="button" id="album-retry">Try again</button> or <a href="${ITEM_URL('Q40390')}">open the album in the wikibase</a>.</p>`;
      document.getElementById('album-retry').addEventListener('click', load);
    }
  }

  load();
})();
