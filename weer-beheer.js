(() => {
const MAX = 15 * 1024 * 1024, VID = /\.(mp4|mov|webm|m4v)$/i, isV = (f) => (f.type || '').startsWith('video') || VID.test(f.name);
const wd = (s, o) => new Date(s + 'T12:00:00').toLocaleDateString('nl-NL', o), Y = { day: 'numeric', month: 'long', year: 'numeric' };
const wt = (a, b) => a == b ? wd(a, Y) : (a.slice(0, 7) == b.slice(0, 7) ? +a.slice(8) + '' : wd(a, a.slice(0, 4) == b.slice(0, 4) ? { day: 'numeric', month: 'long' } : Y)) + ' t/m ' + wd(b, Y);
const css = document.createElement('style');
css.textContent = '.wl{margin:0 0 4px}.th{position:relative}.th img,.th video{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.th button{position:absolute;top:3px;right:3px;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:var(--red);color:var(--cream);font:inherit;line-height:1;cursor:pointer}.tg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px 14px 8px}';
document.head.append(css);
const opt = document.createElement('option');
opt.value = 'weer'; opt.textContent = 'Het weer in de polder';
$('uPage').append(opt);
const box = document.createElement('div');
box.hidden = true;
box.innerHTML = '<div class="wl">Eerste dag</div><input id="wFrom" type="date"><div class="wl">Laatste dag (leeg laten bij 1 dag)</div><input id="wTo" type="date"><textarea id="wInfo" rows="3" placeholder="Hoe was het weer die dag?"></textarea><div class="wl">Foto\u2019s en filmpjes (filmpjes maximaal 15 MB)</div><input id="wFiles" type="file" accept="image/*,video/*" multiple><button type="button" id="wBtn">Uploaden</button>';
$('uPage').after(box);
const hide = [$('file'), $('title'), $('description')], sb = $('uploadForm').querySelector('button[type="submit"]');
function pick() {
const w = $('uPage').value == 'weer';
box.hidden = !w;
hide.forEach((e) => (e.hidden = w));
sb.hidden = w;
if (w) $('productFields').hidden = true;
}
$('uPage').addEventListener('change', pick);
const sec = document.createElement('section');
sec.hidden = true;
sec.innerHTML = '<h2 class="sec-title">Het weer</h2><div class="grid" id="wGrid"></div><p class="msg" id="wMsg"></p>';
$('productSection').after(sec);
const wSay = (t) => ($('wMsg').textContent = t);
$('wBtn').onclick = async () => {
const files = [...$('wFiles').files], a = $('wFrom').value, b = $('wTo').value || a;
if (!a) return say('Kies eerst de datum.');
if (b < a) return say('De laatste dag ligt voor de eerste dag.');
if (!files.length) return say('Kies foto\u2019s of filmpjes.');
const big = files.find((f) => isV(f) && f.size > MAX);
if (big) return say('Het filmpje \u201c' + big.name + '\u201d is groter dan 15 MB. Kies een kleiner filmpje.');
const bad = files.find((f) => !isV(f) && !(f.type || '').startsWith('image'));
if (bad) return say('\u201c' + bad.name + '\u201d is geen foto of filmpje.');
const btn = $('wBtn'), paths = [];
btn.disabled = true;
try {
for (let i = 0; i < files.length; i++) {
say('Uploaden ' + (i + 1) + ' van ' + files.length + '...');
const f = files[i];
let blob = f, ext = (f.name.split('.').pop() || 'mp4').toLowerCase(), type = f.type || 'video/mp4';
if (!isV(f)) { const c = await compressImage(f, 1600, 0.85); blob = c.blob; ext = c.ext; type = c.type; }
const p = 'weer/' + crypto.randomUUID() + '.' + ext;
const { error } = await db.storage.from(BUCKET).
.upload(p, blob, { contentType: type });
if (error) throw new Error('Upload mislukt: ' + error.message);
paths.push(p);
}
const { error: dbErr } = await db.from('weather_days').insert({
date_from: a,
date_to: b,
info: $('wInfo').value.trim(),
files: paths
});
if (dbErr) throw new Error('Opslaan mislukt: ' + dbErr.message);
say('Gelukt! Het staat op de pagina Het Weer In De Polder.');
$('wFrom').value = '';
$('wTo').value = '';
$('wInfo').value = '';
$('wFiles').value = '';
loadWeer();
} catch (err) {
if (paths.length) await db.storage.from(BUCKET).remove(paths);
say(err.message);
} finally {
btn.disabled = false;
}
};
async function loadWeer() {
sec.hidden = !(location.hash === '#admin' && currentSession);
if (sec.hidden) return;
const { data, error } = await db.from('weather_days').select('*').order('date_from', { ascending: false });
if (error) return wSay('Laden mislukt: ' + error.message);
const g = $('wGrid');
g.innerHTML = '';
for (const w of data) {
const f = document.createElement('figure'), c = document.createElement('figcaption');
c.innerHTML = '<span class="cap-title"></span><small></small>';
c.firstChild.textContent = wt(w.date_from, w.date_to);
c.lastChild.textContent = (w.info || '') + ' (' + (w.files || []).length + ' bestanden)';
const act = document.createElement('div');
act.className = 'actions';
const del = makeBtn('Verwijderen', 'ghost');
del.onclick = async () => {
if (!confirm('Deze dag met alle foto\u2019s en filmpjes verwijderen?')) return;
del.disabled = true;
const { data: d, error: e } = await db.from('weather_days').delete().eq('id', w.id).select();
if (e || !d || !d.length) { del.disabled = false; return alert('Verwijderen mislukt: ' + (e ? e.message : 'geen rechten')); }
if ((w.files || []).length) await db.storage.from(BUCKET).remove(w.files);
loadWeer();
};
act.append(del);
f.append(c, act);
g.append(f);
}
}
window.addEventListener('hashchange', loadWeer);
db.auth.onAuthStateChange(() => setTimeout(loadWeer, 0));
pick(); window.addEventListener('pageshow', () => setTimeout(pick, 0));
loadWeer();
})();
