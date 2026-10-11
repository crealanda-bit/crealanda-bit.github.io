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
box.innerHTML = '<div class="wl">Eerste dag</div><input id="wFrom" type="date"><div class="wl">Laatste dag (leeg laten bij 1 dag)</div><input id="wTo" type="date"><input id="wInfo" type="text" placeholder="Hoe was het weer die dag?"><div class="wl">Foto\u2019s en filmpjes (filmpjes maximaal 15 MB)</div><input id="wFiles" type="file" accept="image/*,video/*" multiple><button type="button" id="wBtn">Uploaden</button>';
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
$('wInfo').onkeydown = (e) => e.key == 'Enter' && e.preventDefault();
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
const { error } = await db.storage.from(BUCKET).upl
