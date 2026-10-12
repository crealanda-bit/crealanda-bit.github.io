(() => {
const css = document.createElement('style');
css.textContent = '.cday{max-width:1080px;margin:0 auto 18px;padding:16px;border-radius:12px;background:var(--blue);box-shadow:0 6px 18px rgba(0,0,0,.25)}.cday h3{margin:0 0 10px;font-family:"Great Vibes",cursive;font-size:34px;font-weight:400;color:var(--cream)}.cit{padding:10px 0;border-top:1px solid #FCF5EE70}.cit b{font-family:"Great Vibes",cursive;font-weight:400;font-size:30px}.cit small{display:block;font-size:17px;opacity:.9;overflow-wrap:anywhere}.cit small a{color:var(--cream)}.cit p{margin:4px 0 8px;font-size:20px;white-space:pre-wrap;overflow-wrap:anywhere}.cit .act-btn{flex:none;padding:6px 16px}.cit.pend{background:#B32C4333;border-radius:8px;padding:10px}.cit .tag{display:inline-block;margin-left:8px;padding:2px 10px;border-radius:6px;background:var(--red);color:var(--cream);font-size:16px;vertical-align:middle}';
document.head.append(css);

const sec = document.createElement('section');
sec.hidden = true;
sec.innerHTML = '<h2 class="sec-title">Reacties</h2><div id="cList"></div><p class="msg" id="cMsg"></p>';
const wg = $('wGrid');
(wg ? wg.closest('section') : $('productSection')).after(sec);

const cSay = (t) => { $('cMsg').textContent = t; };
const dl = (s) => new Date(s + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
const dt = (s) => new Date(s).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

async function loadC() {
sec.hidden = !(location.hash === '#admin' && currentSession);
if (sec.hidden) return;
const [c, d] = await Promise.all([
db.from('weather_comments').select('*').order('created_at', { ascending: false }),
db.from('weather_days').select('id,date_from,date_to')
]);
if (c.error) return cSay('Reacties laden mislukt: ' + c.error.message);
const label = {};
(d.data || []).forEach((w) => {
label[String(w.id)] = w.date_from === w.date_to ? dl(w.date_from) : dl(w.date_from) + ' t/m ' + dl(w.date_to);
});
const groups = {};
c.data.forEach((x) => { (groups[x.day_id] = groups[x.day_id] || []).push(x); });
const list = $('cList');
list.innerHTML = '';
const wacht = c.data.filter((x) => !x.approved).length;
cSay(c.data.length ? (wacht ? wacht + ' reactie(s) wachten op goedkeuring.' : 'Alle reacties zijn goedgekeurd.') : 'Nog geen reacties.');
Object.keys(groups).forEach((id) => {
const box = document.createElement('div');
box.className = 'cday';
const h = document.createElement('h3');
h.textContent = label[id] || 'Verwijderde dag';
box.append(h);
/* Reacties die wachten op goedkeuring staan bovenaan */
groups[id].sort((a, b) => (a.approved === b.approved ? 0 : a.approved ? 1 : -1));
groups[id].forEach((x) => {
const it = document.createElement('div');
it.className = 'cit' + (x.approved ? '' : ' pend');
const b = document.createElement('b');
b.textContent = x.name;
if (!x.approved) {
const tag = document.createElement('span');
tag.className = 'tag';
tag.textContent = 'Wacht op goedkeuring';
b.append(tag);
}
const s = document.createElement('small');
const a = document.createElement('a');
a.href = 'mailto:' + x.email;
a.textContent = x.email;
s.append(a, ' \u00b7 ' + dt(x.created_at));
const p = document.createElement('p');
p.textContent = x.message;
const row = document.createElement('div');
row.className = 'actions';
row.style.padding = '0';
if (!x.approved) {
const ok = makeBtn('Goedkeuren');
ok.onclick = async () => {
ok.disabled = true;
const r = await db.from('weather_comments').update({ approved: true }).eq('id', x.id).select();
if (r.error || !r.data || !r.data.length) {
ok.disabled = false;
return alert('Goedkeuren mislukt: ' + (r.error ? r.error.message : 'geen rechten'));
}
loadC();
};
row.append(ok);
}
const del = makeBtn('Verwijderen', 'ghost');
del.onclick = async () => {
if (!confirm('Deze reactie verwijderen?')) return;
del.disabled = true;
const r = await db.from('weather_comments').delete().eq('id', x.id).select();
if (r.error || !r.data || !r.data.length) {
del.disabled = false;
return alert('Verwijderen mislukt: ' + (r.error ? r.error.message : 'geen rechten'));
}
loadC();
};
row.append(del);
it.append(b, s, p, row);
box.append(it);
});
list.append(box);
});
}

window.addEventListener('hashchange', loadC);
db.auth.onAuthStateChange(() => setTimeout(loadC, 0));
loadC();
})();
