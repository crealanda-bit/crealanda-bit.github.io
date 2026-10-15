(function(){var h=document.getElementById("pw-host");if(!h)return;var st=document.createElement("style");st.textContent=".pw{--red:#B32C43;--cream:#FCF5EE;--card:#ffffff26;--mut:#FCF5EEd0;font-family:\"Bebas Neue\",sans-serif;letter-spacing:.3px;font-size:19px;color:var(--cream);margin:0 0 18px;text-align:left}.pw *{box-sizing:border-box}.pw-search{display:flex;gap:8px}.pw-search input{flex:1;min-width:0;padding:11px 13px;border:1px solid var(--red);border-radius:7px;background:var(--card);color:var(--cream);caret-color:var(--cream);font-size:19px}.pw-search input::placeholder{color:var(--cream);opacity:.8}.pw-search input:focus{outline:2px solid var(--cream);outline-offset:2px}.pw button{border:0;border-radius:8px;padding:10px 18px;background:var(--red);color:var(--cream);font-size:21px;line-height:1}.pw button.alt{padding:10px 12px;font-size:20px}.pw-list{list-style:none;margin:8px 0 0;padding:0;background:var(--cream);color:#6F4257;border-radius:10px;overflow:hidden;font:17px Oswald,Arial,sans-serif}.pw-list li{padding:11px 14px;cursor:pointer;border-bottom:1px solid #6F425722}.pw-list li:hover{background:#9EB3D850}.pw-msg{margin:16px 0;text-align:center;font:16px Oswald,Arial,sans-serif;color:var(--mut)}.pw-hero{margin-top:14px;padding:12px 18px;border-radius:10px;background:var(--red);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}.pw-hero h2{margin:0;font:400 clamp(40px,13vw,56px)/1 \"Great Vibes\",cursive;-webkit-text-stroke:.4px var(--cream)}.pw-now{text-align:right;flex-shrink:0}.pw-row{display:flex;align-items:center;justify-content:flex-end;gap:6px}.pw-ico{font-size:38px;line-height:1}.pw-temp{font-size:54px;line-height:1}.pw-feel{margin-top:2px;font:15px Oswald,Arial,sans-serif;color:var(--mut)}.pw-det{flex-basis:100%;display:grid;grid-template-columns:repeat(3,auto);justify-content:space-between;gap:3px 8px;padding-top:8px;border-top:1px solid #FCF5EE55;font:17px/1.3 Oswald,Arial,sans-serif}.pw-det span{white-space:nowrap}.pw h3{margin:20px 0 8px;text-align:center;font:400 clamp(26px,7vw,32px) \"Great Vibes\",cursive;-webkit-text-stroke:.4px var(--cream)}.pw-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}.pw-h{flex:0 0 auto;min-width:64px;text-align:center;background:var(--card);border-radius:10px;padding:8px 4px}.pw-h span{display:block;font:15px Oswald,Arial,sans-serif}.pw-h b{font-weight:400;font-size:22px}.pw-d{display:grid;grid-template-columns:5.8rem 2rem 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #FCF5EE70}.pw-d .r{font:15px Oswald,Arial,sans-serif;color:var(--mut)}.pw-d b{font-weight:400;font-size:22px}.pw-foot{margin:16px 0 0;text-align:center;font:13px Oswald,Arial,sans-serif;color:var(--mut)}.pw-foot a{color:inherit}";document.head.appendChild(st);h.innerHTML="<div class=\"pw\" id=\"pw\">\n  <div class=\"pw-search\">\n    <input id=\"pw-in\" type=\"text\" placeholder=\"Typ je plaats, bijv. Zwolle\" autocomplete=\"off\" aria-label=\"Plaatsnaam\">\n    <button id=\"pw-go\">Zoek</button>\n    <button id=\"pw-me\" class=\"alt\" title=\"Gebruik mijn locatie\" aria-label=\"Gebruik mijn locatie\">\ud83d\udccd</button>\n  </div>\n  <ul class=\"pw-list\" id=\"pw-list\" hidden></ul>\n  <div id=\"pw-out\"><p class=\"pw-msg\">Vul een plaats in om het weer te zien \ud83c\udf24\ufe0f</p></div>\n  <p class=\"pw-foot\">Weergegevens van <a href=\"https://open-meteo.com/\" target=\"_blank\" rel=\"noopener\">Open-Meteo.com</a> \u00b7 wordt elke 10 minuten automatisch bijgewerkt</p>\n</div>";})();
(function(){
var $=function(i){return document.getElementById(i)};
var moreOpen=false,out=$('pw-out'),list=$('pw-list'),input=$('pw-in'),place=null,timer=null;
var WC={0:['Helder','☀️'],1:['Overwegend helder','🌤️'],2:['Half bewolkt','⛅'],3:['Bewolkt','☁️'],45:['Mist','🌫️'],48:['Rijpmist','🌫️'],
51:['Lichte motregen','🌦️'],53:['Motregen','🌦️'],55:['Zware motregen','🌧️'],56:['Ijzel','🌧️'],57:['Ijzel','🌧️'],
61:['Lichte regen','🌦️'],63:['Regen','🌧️'],65:['Zware regen','🌧️'],66:['Ijzelregen','🌧️'],67:['Ijzelregen','🌧️'],
71:['Lichte sneeuw','🌨️'],73:['Sneeuw','🌨️'],75:['Zware sneeuw','❄️'],77:['Sneeuwkorrels','🌨️'],
80:['Lichte buien','🌦️'],81:['Buien','🌧️'],82:['Zware buien','⛈️'],85:['Sneeuwbuien','🌨️'],86:['Zware sneeuwbuien','❄️'],
95:['Onweer','⛈️'],96:['Onweer met hagel','⛈️'],99:['Zwaar onweer met hagel','⛈️']};
function wc(c){return WC[c]||['Onbekend','🌡️']}
function bft(k){var t=[1,6,12,20,29,39,50,62,75,89,103,118],n=0;while(n<t.length&&k>=t[n])n++;return n}
function arrow(d){return '<span style="display:inline-block;transform:rotate('+((d+180)%360)+'deg)">↑</span>'}
function r(n){return Math.round(n)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function save(p){try{localStorage.setItem('pw-place',JSON.stringify(p))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem('pw-place'))}catch(e){return null}}
function search(){
var q=input.value.trim(); if(!q)return;
out.innerHTML='<p class="pw-msg">Zoeken…</p>';list.hidden=true;
fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=nl&format=json&name='+encodeURIComponent(q))
.then(function(r){return r.json()}).then(function(d){
var res=d.results||[];
if(!res.length){out.innerHTML='<p class="pw-msg">Geen plaats gevonden. Probeer een andere schrijfwijze.</p>';return}
if(res.length===1){pick(res[0]);return}
out.innerHTML='<p class="pw-msg">Welke bedoel je?</p>';
list.innerHTML=res.map(function(p,i){return '<li data-i="'+i+'">'+esc(p.name)+(p.admin1?', '+esc(p.admin1):'')+(p.country?' ('+esc(p.country)+')':'')+'</li>'}).join('');
list.hidden=false;
list.onclick=function(e){var li=e.target.closest('li');if(li){list.hidden=true;pick(res[li.dataset.i])}};
}).catch(function(){out.innerHTML='<p class="pw-msg">Zoeken lukt nu niet. Probeer het zo nog eens.</p>'});
}
function pick(p){
place={name:p.name,sub:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude};
input.value=p.name;save(place);get();
}
function get(){
if(!place)return;
window.pwPlace=place;setTimeout(function(){document.dispatchEvent(new CustomEvent('pw-place',{detail:place}))},0);
clearInterval(timer);
var u='https://api.open-meteo.com/v1/forecast?latitude='+place.lat+'&longitude='+place.lon+
'&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto&forecast_days=7';
fetch(u).then(function(r){return r.json()}).then(show).catch(function(){out.innerHTML='<p class="pw-msg">Weergegevens ophalen lukt nu niet.</p>'});
timer=setInterval(get,600000);
}
function show(d){
var c=d.current,w=wc(c.weather_code),dl=d.daily,h=d.hourly;
window.pwCold=c.temperature_2m<8;
var now=c.time.slice(0,13),i0=h.time.findIndex(function(t){return t.slice(0,13)>=now});if(i0<0)i0=0;
var hrs=h.time.slice(i0,i0+24).map(function(t,k){var j=i0+k;
return '<div class="pw-h"><span>'+t.slice(11,16)+'</span><span style="font-size:26px">'+wc(h.weather_code[j])[1]+'</span><b>'+r(h.temperature_2m[j])+'°</b><span class="r" >💧'+(h.precipitation_probability[j]||0)+'%</span></div>'}).join('');
var days=dl.time.map(function(t,i){
var nm=i===0?'Vandaag':new Date(t+'T12:00').toLocaleDateString('nl-NL',{weekday:'long'});
return '<div class="pw-d"><span style="text-transform:capitalize;font:17px Oswald,Arial,sans-serif">'+nm+'</span><span>'+wc(dl.weather_code[i])[1]+'</span><span class="r">'+(dl.precipitation_sum[i]>0?'💧 '+dl.precipitation_sum[i].toFixed(1)+' mm':'droog')+'</span><b>'+r(dl.temperature_2m_max[i])+'° <span class="r">/ '+r(dl.temperature_2m_min[i])+'°</span></b></div>'}).join('');
var wk=r(c.wind_speed_10m),pk=h.precipitation_probability[i0]||0,ps=dl.precipitation_sum[0]||0;
var it=['💦 '+pk+'%','💦 '+ps.toFixed(1)+' mm','💧 '+c.relative_humidity_2m+'%','💨 '+wk+' km/u '+arrow(c.wind_direction_10m),'🌬️ '+r(c.wind_gusts_10m)+' km/u','🌀 '+bft(wk)+' Bft','🌧️ '+c.precipitation+' mm','🌅 '+dl.sunrise[0].slice(11,16),'🌇 '+dl.sunset[0].slice(11,16)];
out.innerHTML=
'<div class="pw-hero"><h2>'+esc(place.name)+'</h2><div class="pw-now"><div class="pw-row"><div class="pw-ico">'+w[1]+'</div><div class="pw-temp">'+r(c.temperature_2m)+'°</div></div><div class="pw-feel">voelt als '+r(c.apparent_temperature)+'°</div></div><div class="pw-det">'+it.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div></div>'+
'<div id="pw-more"'+(moreOpen?'':' hidden')+'><h3>Komende 24 uur</h3><div class="pw-scroll">'+hrs+'</div><h3>Komende 7 dagen</h3>'+days+'</div><p style="text-align:center;margin:14px 0 0"><button id="pw-tog" type="button">'+(moreOpen?'Minder weergegevens ▴':'Meer weergegevens ▾')+'</button></p>';
}
$('pw-go').onclick=search;
out.addEventListener('click',function(e){
if(e.target.id!=='pw-tog')return;
moreOpen=!moreOpen;$('pw-more').hidden=!moreOpen;
e.target.textContent=moreOpen?'Minder weergegevens ▴':'Meer weergegevens ▾';
});
input.onkeydown=function(e){if(e.key==='Enter')search()};
$('pw-me').onclick=function(){
if(!navigator.geolocation){out.innerHTML='<p class="pw-msg">Locatie wordt niet ondersteund.</p>';return}
navigator.geolocation.getCurrentPosition(function(p){
place={name:'Mijn locatie',sub:'',lat:p.coords.latitude,lon:p.coords.longitude};input.value='';get();
},function(){out.innerHTML='<p class="pw-msg">Locatie niet toegestaan. Typ gewoon je plaats in.</p>'});
};
function startPlace(){
fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=nl&format=json&name=Espel')
.then(function(r){return r.json()}).then(function(d){
var l=d.results||[],p=l.filter(function(x){return x.admin1==='Flevoland'})[0]||l[0];
if(p){place={name:p.name,sub:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude};input.value=p.name;get()}
}).catch(function(){});
}
var s=load();if(s){place=s;input.value=s.name;get()}else startPlace();
})();
(function(){
var DAGEN=4;
var FOTOS_PC=8;
var FOTOS_TEL=6;
var wl=document.getElementById('weerLijst');if(!wl)return;
function knop(t){var b=document.createElement('button');b.type='button';b.textContent=t;
b.style.cssText='display:block;margin:10px auto 0;padding:8px 14px;border:0;border-radius:8px;background:#B32C43;color:#FCF5EE;font:19px "Bebas Neue",sans-serif;white-space:nowrap;cursor:pointer;grid-column:1/-1';return b}
function apply(){
var secs=[].slice.call(wl.querySelectorAll('.wdag'));
if(!secs.length)return;
var FOTOS=innerWidth<650?FOTOS_TEL:FOTOS_PC;
secs.forEach(function(s){
if(s.dataset.pw)return;s.dataset.pw='1';
var g=s.querySelector('.wg');if(!g)return;
var it=[].slice.call(g.children);if(it.length<=FOTOS)return;
var extra=it.slice(FOTOS),open=false,n=extra.length,b=knop('+'+n+' foto\u2019s');
extra.forEach(function(e){e.style.display='none'});
b.onclick=function(){open=!open;
extra.forEach(function(e){e.style.display=open?'':'none'});
b.textContent=open?'Minder foto\u2019s':'+'+n+' foto\u2019s'};
g.after(b);
});
if(secs.length>DAGEN&&!wl.dataset.pwDagen){
wl.dataset.pwDagen='1';
var oud=secs.slice(DAGEN),open=false,b=knop('Oudere dagen tonen ('+oud.length+')');
oud.forEach(function(s){s.style.display='none'});
b.onclick=function(){open=!open;
oud.forEach(function(s){s.style.display=open?'':'none'});
b.textContent=open?'Oudere dagen verbergen':'Oudere dagen tonen ('+oud.length+')'};
wl.appendChild(b);
}
}
new MutationObserver(apply).observe(wl,{childList:true});
apply();
})();
(function(){
var wl=document.getElementById('weerLijst');if(!wl)return;
var st=document.createElement('style');
st.textContent='#weerLijst{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;align-items:start}#weerLijst>p{grid-column:1/-1}#weerLijst .wdag{min-width:0}#weerLijst .wt{white-space:normal;line-height:1.1;font-size:clamp(20px,5.4vw,30px)}#weerLijst .wg a{cursor:zoom-in}@media(max-width:650px){#weerLijst{column-gap:10px}#weerLijst .wg{grid-template-columns:repeat(2,1fr)}#weerLijst .wi{font-size:15px}}.pwl{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:56px 20px 24px;background:#00000066;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);animation:pwlIn .25s ease both}.pwl.out{animation:pwlOut .2s ease both}.pwl-box{position:relative;line-height:0;animation:pwlPlop .65s ease both}.pwl.out .pwl-box{transform:scale(.94);opacity:0;transition:transform .2s,opacity .2s}.pwl-img{display:block;width:auto;height:auto;max-width:min(calc(100vw - 40px),900px);max-height:calc(100vh - 130px);max-height:calc(100dvh - 130px);border-radius:14px;box-shadow:0 10px 40px #0006}.pwl-x{position:absolute;right:-4px;bottom:100%;margin-bottom:2px;width:44px;height:44px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:0}.pwl-x svg{width:26px;height:26px;fill:none;stroke:#FCF5EE;stroke-width:2.6;stroke-linecap:round;filter:drop-shadow(0 0 3px #000a)}@keyframes pwlIn{from{opacity:0}}@keyframes pwlOut{to{opacity:0}}@keyframes pwlPlop{0%{opacity:0;transform:scale(.88)}75%{opacity:1;transform:scale(1.02)}}';
document.head.appendChild(st);
function open(url){
var img=new Image();
img.onload=function(){
var ov=document.createElement('div'),box=document.createElement('div'),x=document.createElement('button');
ov.className='pwl';box.className='pwl-box';x.className='pwl-x';x.type='button';
x.setAttribute('aria-label','Sluiten');
x.innerHTML='<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>';
img.className='pwl-img';img.alt='';
box.appendChild(x);box.appendChild(img);ov.appendChild(box);document.body.appendChild(ov);
document.body.style.overflow='hidden';
function key(e){if(e.key==='Escape')close()}
function close(){
if(ov.classList.contains('out'))return;
ov.classList.add('out');document.body.style.overflow='';
document.removeEventListener('keydown',key);
setTimeout(function(){ov.remove()},200);
}
x.onclick=close;
ov.onclick=function(e){if(e.target===ov)close()};
document.addEventListener('keydown',key);
};
img.onerror=function(){window.open(url,'_blank')};
img.src=url;
}
wl.addEventListener('click',function(e){
var a=e.target.closest&&e.target.closest('.wg a');
if(!a||!a.querySelector('img'))return;
e.preventDefault();open(a.href);
});
})();
(function(){
var wp=document.getElementById('weerPage'),k9=wp&&wp.querySelector('.k9'),host=document.getElementById('pw-host'),wl=document.getElementById('weerLijst');
if(!k9||!host||!wl)return;
var GAP=12,cur=0,W=0,X0=0,Y0=0,T0=0,dx=0,ok=0,drag=0,h1=k9.querySelector('h1');
var st=document.createElement('style');
st.textContent='.pwd{display:flex;justify-content:center;align-items:center;height:28px;margin:-33px 0 5px}.pwd button{height:28px;padding:0 5px;border:0;background:none;display:flex;align-items:center}.pwd button::after{content:"";width:12px;height:12px;border-radius:6px;border:2px solid #FCF5EE;opacity:.6;transition:.3s}.pwd button.on::after{width:32px;background:#FCF5EE;opacity:1}#weerPage>h1{margin:0 0 14px;text-align:center;white-space:nowrap;font:400 clamp(26px,8.4vw,48px) "Great Vibes",cursive;-webkit-text-stroke:.4px #FCF5EE}.pwv{overflow:hidden;overflow:clip;overflow-clip-margin:6px;transition:height .35s ease}.pwt{display:flex;align-items:flex-start;gap:'+GAP+'px;will-change:transform;transition:transform .4s cubic-bezier(.22,.85,.3,1)}.pwt.drag,.pwt.drag .pwp{transition:none}.pwp{flex:0 0 100%;min-width:0;opacity:.35;transform:scale(.96);transform-origin:50% 0;transition:opacity .4s,transform .4s}.pwp.on{opacity:1;transform:none}';
document.head.appendChild(st);
var pwv=document.createElement('div'),pwt=document.createElement('div'),pn=[document.createElement('div'),document.createElement('div')],d=document.createElement('div');
pwv.className='pwv';pwt.className='pwt';pn[0].className='pwp on';pn[1].className='pwp';
k9.insertBefore(pwv,host);pwv.appendChild(pwt);pwt.appendChild(pn[0]);pwt.appendChild(pn[1]);pn[0].appendChild(host);pn[1].appendChild(wl);
d.className='pwd';d.innerHTML='<button type="button" class="on" aria-label="Pagina 1: weer en radar"></button><button type="button" aria-label="Pagina 2: weerfoto\u2019s"></button>';
wp.insertBefore(d,wp.firstChild);if(h1)wp.insertBefore(h1,k9);
var b=d.children;
function meas(){W=pwt.clientWidth+GAP}
function setX(x){pwt.style.transform='translate3d('+x+'px,0,0)'}
function sync(){if(drag)return;var v=pn[cur].offsetHeight;if(v)pwv.style.height=v+'px'}
function snap(){pwt.classList.add('drag');meas();setX(-cur*W);void pwt.offsetWidth;pwt.classList.remove('drag')}
function go(n){
var old=cur;cur=n;meas();setX(-n*W);pwv.style.transition='';
for(var i=0;i<2;i++){pn[i].style.opacity=pn[i].style.transform='';pn[i].classList.toggle('on',i===n);b[i].classList.toggle('on',i===n)}
sync();
if(n!==old&&window.scrollY>0)window.scrollTo({top:0,behavior:'smooth'});
}
b[0].onclick=function(){go(0)};b[1].onclick=function(){go(1)};
pwv.addEventListener('touchstart',function(e){
ok=drag=0;
if(e.touches.length!==1||e.target.closest('.leaflet-container,.pw-scroll,input,textarea,select,video'))return;
X0=e.touches[0].clientX;Y0=e.touches[0].clientY;T0=Date.now();dx=0;ok=1;
},{passive:true});
pwv.addEventListener('touchmove',function(e){
if(!ok)return;
var t=e.touches[0],mx=t.clientX-X0,my=t.clientY-Y0;
if(!drag){
if(Math.abs(my)>10&&Math.abs(my)>Math.abs(mx)){ok=0;return}
if(Math.abs(mx)<8||Math.abs(mx)<Math.abs(my)*1.3)return;
drag=1;meas();pwt.classList.add('drag');pwv.style.transition='none';
}
if(e.cancelable)e.preventDefault();
dx=mx;
var m=(cur===0&&mx>0)||(cur===1&&mx<0)?mx*.3:mx,p=Math.max(0,Math.min(1,cur-m/W)),a=pn[0].offsetHeight,c=pn[1].offsetHeight;
setX(-cur*W+m);
pn[0].style.opacity=1-.65*p;pn[0].style.transform='scale('+(1-.04*p)+')';
pn[1].style.opacity=.35+.65*p;pn[1].style.transform='scale('+(.96+.04*p)+')';
pwv.style.height=(a+(c-a)*p)+'px';
},{passive:false});
function end(){
if(!ok)return;ok=0;
if(!drag)return;drag=0;
pwt.classList.remove('drag');
var v=dx/(Date.now()-T0||1),n=cur;
if(cur===0&&(dx<-W*.2||v<-.45))n=1;else if(cur===1&&(dx>W*.2||v>.45))n=0;
go(n);
}
pwv.addEventListener('touchend',end,{passive:true});
pwv.addEventListener('touchcancel',end,{passive:true});
function check(){if(pwt.clientWidth+GAP!==W)snap();sync()}
if(window.ResizeObserver){var ro=new ResizeObserver(check);ro.observe(pn[0]);ro.observe(pn[1])}
addEventListener('resize',check);
var idle=window.requestIdleCallback?function(f){requestIdleCallback(f)}:function(f){setTimeout(f,300)};
function warm(){var im=wl.querySelectorAll('img');for(var i=0;i<im.length&&i<18;i++){im[i].loading='eager';im[i].decoding='async'}}
new MutationObserver(function(){idle(warm)}).observe(wl,{childList:true});
})();
(function(){var s=document.createElement('script');s.src='radar.js';document.body.appendChild(s)})();
