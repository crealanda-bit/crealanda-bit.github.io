(function(){
var h=document.getElementById("pw-host");if(!h)return;var st=document.createElement("style");
st.textContent=".pw{--red:#B32C43;--cream:#FCF5EE;--card:#ffffff26;--mut:#FCF5EEd0;--o:Oswald,Arial,sans-serif;font-family:\"Bebas Neue\",sans-serif;letter-spacing:.3px;font-size:19px;color:var(--cream);margin:0 0 18px;text-align:left}.pw *{box-sizing:border-box}.pw-search{display:flex;gap:8px}.pw-search input{flex:1;min-width:0;padding:11px 13px;border:1px solid var(--red);border-radius:7px;background:var(--card);color:var(--cream);caret-color:var(--cream);font-size:19px}.pw-search input::placeholder{color:var(--cream);opacity:.8}.pw-search input:focus{outline:2px solid var(--cream);outline-offset:2px}.pw button{border:0;border-radius:8px;padding:10px 18px;background:var(--red);color:var(--cream);font-size:21px;line-height:1}.pw button.alt{padding:10px 12px;font-size:20px}.pw-list{list-style:none;margin:8px 0 0;padding:0;background:var(--cream);color:#6F4257;border-radius:10px;overflow:hidden;font:17px var(--o)}.pw-list li{padding:11px 14px;cursor:pointer;border-bottom:1px solid #6F425722}.pw-msg{margin:16px 0;text-align:center;font:16px var(--o);color:var(--mut)}.pw-hero{margin-top:14px;padding:12px 18px;border-radius:10px;background:var(--red);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}.pw-top{flex-basis:100%;display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;max-width:100%}.pw-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}.pw-pl{flex:1}.pw-left .pw-temp{font-size:48px}.pw-left .pw-feel{font-size:14px}.pw-vl{align-self:stretch;width:1px;background:#FCF5EE40;flex-shrink:0}.pw-rt{display:flex;flex-direction:column;gap:6px;flex-shrink:0;font:17px/1.3 var(--o)}.pw-rt div{white-space:nowrap;text-align:center}.pw-hl{height:1px;background:#FCF5EE55}.pw-pl,.pw-now{text-align:center;min-width:0;overflow-wrap:anywhere}.pw-hero h2,.pw h3{-webkit-text-stroke:.4px var(--cream)}.pw-hero h2{margin:2px 0 0;font:400 clamp(30px,9vw,40px)/1 \"Great Vibes\",cursive}.pw-ico{font-size:46px;line-height:1;position:relative;left:5px}.pw-temp{font-size:58px;line-height:1}.pw-now{flex-shrink:0}.pw-feel{white-space:nowrap;margin-top:4px;font:16px var(--o);color:var(--mut)}.pw-det{flex-basis:100%;display:grid;grid-template-columns:auto 1px auto 1px auto;justify-content:space-between;align-items:center;gap:0 6px;padding-top:10px;border-top:1px solid #FCF5EE55;font:17px/1.3 var(--o)}.pw-det div{display:flex;flex-direction:column;gap:5px}.pw-det i{align-self:stretch;background:#FCF5EE40}.pw-det span{white-space:nowrap}.pw h3{margin:20px 0 8px;text-align:center;font:400 clamp(26px,7vw,32px) \"Great Vibes\",cursive}.pw-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px}.pw-h{flex:0 0 auto;min-width:64px;text-align:center;background:var(--card);border-radius:10px;padding:8px 4px}.pw-h span{display:block;font:15px var(--o)}.pw-h b,.pw-d b{font-weight:400;font-size:22px}.pw-d{display:grid;grid-template-columns:5.8rem 2rem 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #FCF5EE70}.pw-d .r{font:15px var(--o);color:var(--mut)}.pw-foot{margin:16px 0 0;text-align:center;font:13px var(--o);color:var(--mut)}.pw-foot a{color:inherit}";
document.head.appendChild(st);
h.innerHTML="<div class=\"pw\" id=\"pw\"><div class=\"pw-search\"><input id=\"pw-in\" type=\"text\" placeholder=\"Typ je plaats, bijv. Zwolle\" autocomplete=\"off\" aria-label=\"Plaatsnaam\"><button id=\"pw-go\">Zoek</button><button id=\"pw-me\" class=\"alt\" aria-label=\"Gebruik mijn locatie\">\ud83d\udccd</button></div><ul class=\"pw-list\" id=\"pw-list\" hidden></ul><div id=\"pw-out\"><p class=\"pw-msg\">Vul een plaats in om het weer te zien \ud83c\udf24\ufe0f</p></div><p class=\"pw-foot\">Weergegevens van <a href=\"https://open-meteo.com/\" target=\"_blank\" rel=\"noopener\">Open-Meteo.com</a> en Buienradar \u00b7 wordt elke 10 minuten automatisch bijgewerkt</p>\n</div>"
})();
(function(){
var $=function(i){return document.getElementById(i)};var mo=false,out=$('pw-out'),ls=$('pw-list'),input=$('pw-in'),P=null,tm=null;
function wc(c){
return c<1?'☀️':c<2?'🌤️':c<3?'⛅':c<4?'☁️':c<50?'🌫️':c<61?(c<55?'🌦️':'🌧️'):c<70?(c==61?'🌦️':'🌧️'):c<80?(c==75?'❄️':'🌨️'):c<83?(c==80?'🌦️':c==81?'🌧️':'⛈️'):c<87?(c==86?'❄️':'🌨️'):c>94?'⛈️':'🌡️'
}
function bft(k){var t=[1,6,12,20,29,39,50,62,75,89,103,118],n=0;while(n<t.length&&k>=t[n])n++;return n}
function ico(c,cc,dy){if(c>3||cc==null)return wc(c);if(dy===0)return cc<25?'🌙':'☁️';return cc<25?'☀️':cc<65?'🌤️':cc<95?'⛅':'☁️'}
function oi(s){
s=(s||'').toLowerCase();
return/onweer/.test(s)?'⛈️':/sneeuw|hagel/.test(s)?'🌨️':/motregen/.test(s)?'🌦️':/regen|bui/.test(s)?'🌧️':/mist|nevel/.test(s)?'🌫️':null
}
function ef(l,m,h,t){return l==null||m==null||h==null?t:Math.max(l,m,h*.4)}function obs(p){
return fetch('https://data.buienradar.nl/2.0/feed/json').then(function(r){return r.json()}).then(function(j){
var b=null,m=1e9;((j.actual&&j.actual.stationmeasurements)||[]).forEach(function(x){
if(!x.weatherdescription||x.lat==null)return;var a=(x.lat-p.lat)*111,e=(x.lon-p.lon)*111*Math.cos(p.lat*Math.PI/180),q=a*a+e*e;
if(q<m){m=q;b=x}
});
return b&&m<400?b:null
}).catch(function(){return null})
}
function tt(){return mo?'Minder weergegevens ▴':'Meer weergegevens ▾'}function r(n){return Math.round(n)}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function se(){
var q=input.value.trim(); if(!q)return;out.innerHTML='<p class="pw-msg">Zoeken…</p>';ls.hidden=true;
fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=nl&format=json&name='+encodeURIComponent(q))
.then(function(r){return r.json()}).then(function(d){
var res=d.results||[];if(!res.length){out.innerHTML='<p class="pw-msg">Geen plaats gevonden.</p>';return}
if(res.length===1){pk(res[0]);return}out.innerHTML='<p class="pw-msg">Welke bedoel je?</p>';
ls.innerHTML=res.map(function(p,i){
return '<li data-i="'+i+'">'+esc(p.name)+(p.admin1?', '+esc(p.admin1):'')+(p.country?' ('+esc(p.country)+')':'')+'</li>'
}).join('');
ls.hidden=false;ls.onclick=function(e){
var li=e.target.closest('li');if(li){ls.hidden=true;pk(res[li.dataset.i])}
}
}).catch(function(){out.innerHTML='<p class="pw-msg">Zoeken lukt nu niet.</p>'})
}
function pk(p){
P={name:p.name,sub:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude};
input.value=p.name;get()
}
function get(){
if(!P)return;window.pwPlace=P;setTimeout(function(){
document.dispatchEvent(new CustomEvent('pw-place',{detail:P}))
},0);
clearInterval(tm);
var cu='temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m',u='https://api.open-meteo.com/v1/forecast?latitude='+P.lat+'&longitude='+P.lon+
'&current='+cu+'&hourly=temperature_850hPa,temperature_2m,precipitation_probability,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto&forecast_days=7';
fetch(u).then(function(r){return r.json()}).then(function(d){
return fetch('https://api.open-meteo.com/v1/forecast?latitude='+P.lat+'&longitude='+P.lon+'&current='+cu+'&models=knmi_seamless&timezone=auto').then(function(r){return r.json()}).then(function(k){
var q=k.current||{},c=d.current;for(var x in q)if(q[x]!=null&&x!=='time')c[x]=q[x];return d
}).catch(function(){return d})
}).then(function(d){
return obs(P).then(function(o){d.obs=o;return d})
}).then(show).catch(function(){out.innerHTML='<p class="pw-msg">Weergegevens ophalen lukt nu niet.</p>'});
tm=setInterval(get,600000)
}
function show(d){
var c=d.current,dl=d.daily,h=d.hourly,o=d.obs,ic=oi(o&&o.weatherdescription)||ico(c.weather_code,ef(c.cloud_cover_low,c.cloud_cover_mid,c.cloud_cover_high,c.cloud_cover),c.is_day);
window.pwCold=c.temperature_2m<8;var now=c.time.slice(0,13),i0=h.time.findIndex(function(t){return t.slice(0,13)>=now});
if(i0<0)i0=0;var hr=h.time.slice(i0,i0+24).map(function(t,k){
var j=i0+k;
return '<div class="pw-h"><span>'+t.slice(11,16)+'</span><span style="font-size:26px">'+ico(h.weather_code[j],ef(h.cloud_cover_low[j],h.cloud_cover_mid[j],h.cloud_cover_high[j],h.cloud_cover[j]),h.is_day[j])+'</span><b>'+r(h.temperature_2m[j])+'°</b><span class="r">💧'+(h.precipitation_probability[j]||0)+'%</span></div>'
}).join('');
var dd=dl.time.map(function(t,i){
var nm=i===0?'Vandaag':new Date(t+'T12:00').toLocaleDateString('nl-NL',{weekday:'long'});
return '<div class="pw-d"><span style="text-transform:capitalize;font:17px var(--o)">'+nm+'</span><span>'+wc(dl.weather_code[i])+'</span><span class="r">'+(dl.precipitation_sum[i]>0?'💧 '+dl.precipitation_sum[i].toFixed(1)+' mm':'droog')+'</span><b>'+r(dl.temperature_2m_max[i])+'° <span class="r">/ '+r(dl.temperature_2m_min[i])+'°</span></b></div>'
}).join('');
var wk=r(c.wind_speed_10m),ps=dl.precipitation_sum[0]||0;var dp=c.dew_point_2m!=null?r(c.dew_point_2m)+'°':'–';
var v=h.temperature_850hPa&&h.temperature_850hPa[i0],up=v==null?'–':r(v)+'°';
var it=[['🌧️ '+ps.toFixed(1)+' mm','💧 '+c.relative_humidity_2m+'%'],['🌬️ '+r(c.wind_gusts_10m)+' km/u','🌀 '+bft(wk)+' Bft'],['🌅 '+dl.sunrise[0].slice(11,16),'🌇 '+dl.sunset[0].slice(11,16)]];
out.innerHTML=
'<div class="pw-hero"><div class="pw-top"><div class="pw-left"><div class="pw-pl"><div class="pw-ico">'+ic+'</div><h2>'+esc(P.name)+'</h2></div><div class="pw-now"><div class="pw-temp">'+r(c.temperature_2m)+'°</div><div class="pw-feel">voelt als '+r(c.apparent_temperature)+'°</div></div></div><i class="pw-vl"></i><div class="pw-rt"><div>💦 '+dp+'</div><i class="pw-hl"></i><div>🎈 850 hPa '+up+'</div></div></div>'+
'<div class="pw-det">'+it.map(function(g){
return '<div>'+g.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div>'
}).join('<i></i>')+'</div></div>'+
'<div id="pw-more"'+(mo?'':' hidden')+'><h3>Komende 24 uur</h3><div class="pw-scroll">'+hr+'</div><h3>Komende 7 dagen</h3>'+dd+'</div><p style="text-align:center;margin:14px 0 0"><button id="pw-tog" type="button">'+tt()+'</button></p>';
fit();document.fonts&&document.fonts.ready.then(fit)
}
function fit(){var e=out.querySelector('h2'),f=36,t=e&&e.style;if(!e)return;t.whiteSpace='nowrap';t.fontSize='36px';while(f>12&&e.scrollWidth>e.clientWidth)t.fontSize=--f+'px';if(e.scrollWidth>e.clientWidth)t.whiteSpace='normal'}
$('pw-go').onclick=se;
out.addEventListener('click',function(e){if(e.target.id!=='pw-tog')return;mo=!mo;$('pw-more').hidden=!mo;e.target.textContent=tt()});
input.onkeydown=function(e){if(e.key==='Enter')se()};$('pw-me').onclick=function(){
if(!navigator.geolocation){out.innerHTML='<p class="pw-msg">Locatie wordt niet ondersteund.</p>';return}
navigator.geolocation.getCurrentPosition(function(p){
P={name:'Mijn locatie',sub:'',lat:p.coords.latitude,lon:p.coords.longitude};input.value='';get()
},function(){out.innerHTML='<p class="pw-msg">Locatie niet toegestaan.</p>'})
};
function sp(){
fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=nl&format=json&name=Espel')
.then(function(r){return r.json()}).then(function(d){
var l=d.results||[],p=l.filter(function(x){return x.admin1==='Flevoland'})[0]||l[0];if(p){
P={name:p.name,sub:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude};
input.value=p.name;get()
}
}).catch(function(){
})
}
sp()
})();
(function(){
var DG=4,wl=document.getElementById('weerLijst');if(!wl)return;
var st=document.createElement('style');
st.textContent='#weerLijst{--ar:3/4;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;align-items:start}#weerLijst>p{grid-column:1/-1}#weerLijst .wdag{min-width:0;text-align:center}#weerLijst .wt{white-space:normal;line-height:1.1;font-size:clamp(20px,5.4vw,30px)}#weerLijst .wg{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;aspect-ratio:var(--ar);border-radius:10px;background:#ffffff26}#weerLijst .wg:empty{display:none}#weerLijst .wg::-webkit-scrollbar{display:none}#weerLijst .wg>*{flex:0 0 100%;margin:0;border-radius:0;scroll-snap-align:center;scroll-snap-stop:always}#weerLijst .wg a{display:block;cursor:zoom-in}#weerLijst .wg img,#weerLijst .wg video{display:block;width:100%;height:100%;object-fit:cover;border-radius:0}.wdt{display:flex;flex-wrap:wrap;justify-content:center;margin:0 0 6px}.wdt button{height:20px;padding:0 3px;border:0;background:none;display:flex;align-items:center}.wdt button::after{content:"";width:9px;height:9px;border-radius:5px;border:2px solid #FCF5EE;opacity:.6;transition:.3s}.wdt button.on::after{width:22px;background:#FCF5EE;opacity:1}@media(max-width:650px){#weerLijst{column-gap:10px}#weerLijst .wi{font-size:15px}}';
document.head.appendChild(st);
function E(t,c){var e=document.createElement(t);if(c)e.className=c;return e}
function kn(t){
var b=E('button');b.type='button';b.textContent=t;
b.style.cssText='display:block;margin:10px auto 0;padding:8px 14px;border:0;border-radius:8px;background:#B32C43;color:#FCF5EE;font:19px "Bebas Neue",sans-serif;white-space:nowrap;cursor:pointer;grid-column:1/-1';
return b
}
function zm(u,s){
var ov=E('div','lb'),bx=E('div','sl big'),tr=E('div','sl-t'),dt=E('div','sl-d'),x=E('button','lb-x'),ds=[];
u.forEach(function(p,n){var i=new Image();i.src=p;i.alt='';i.draggable=false;tr.appendChild(i);var d=E('span',n==s?'on':'');ds.push(d);dt.appendChild(d)});
bx.appendChild(tr);if(u.length>1)bx.appendChild(dt);
tr.onscroll=function(){var k=Math.round(tr.scrollLeft/(tr.clientWidth||1));ds.forEach(function(d,n){d.classList.toggle('on',n==k)})};
x.type='button';x.setAttribute('aria-label','Sluiten');x.innerHTML='<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>';
function k(e){if(e.key==='Escape')c()}
function c(){if(ov.classList.contains('out'))return;ov.classList.add('out');document.body.style.overflow='';document.removeEventListener('keydown',k);setTimeout(function(){ov.remove()},200)}
x.onclick=c;ov.onclick=function(e){if(e.target===ov)c()};
document.body.style.overflow='hidden';document.addEventListener('keydown',k);
bx.appendChild(x);ov.appendChild(bx);document.body.appendChild(ov);tr.scrollLeft=s*tr.clientWidth
}
function ap(){
var sc=[].slice.call(wl.querySelectorAll('.wdag'));if(!sc.length)return;
sc.forEach(function(s){
if(s.dataset.pw)return;s.dataset.pw='1';var g=s.querySelector('.wg');if(!g)return;
var n=g.children.length;if(n<2)return;var d=E('div','wdt'),bs=[];
for(var i=0;i<n;i++)(function(i){var b=E('button');b.type='button';b.onclick=function(){g.scrollTo({left:i*g.clientWidth,behavior:'smooth'})};bs.push(b);d.appendChild(b)})(i);
bs[0].className='on';
g.addEventListener('scroll',function(){var k=Math.round(g.scrollLeft/(g.clientWidth||1));bs.forEach(function(b,i){b.classList.toggle('on',i===k)})},{passive:true});
g.before(d)
});
if(sc.length>DG&&!wl.dataset.pwDagen){
wl.dataset.pwDagen='1';var od=sc.slice(DG),open=false,b=kn('Oudere dagen tonen ('+od.length+')');
od.forEach(function(s){s.style.display='none'});b.onclick=function(){
open=!open;od.forEach(function(s){s.style.display=open?'':'none'});b.textContent=open?'Oudere dagen verbergen':'Oudere dagen tonen ('+od.length+')'
};
wl.appendChild(b)
}
}
new MutationObserver(ap).observe(wl,{childList:true});ap();
wl.addEventListener('click',function(e){
var a=e.target.closest&&e.target.closest('.wg a');if(!a||!a.querySelector('img'))return;e.preventDefault();
var u=[].slice.call(a.parentNode.querySelectorAll('a')).map(function(x){return x.href});zm(u,Math.max(0,u.indexOf(a.href)))
})
})();
(function(){
var wp=document.getElementById('weerPage'),k9=wp&&wp.querySelector('.k9'),host=document.getElementById('pw-host'),wl=document.getElementById('weerLijst');
if(!k9||!host||!wl)return;var G=12,cur=0,W=0,X0=0,Y0=0,T0=0,dx=0,ok=0,dr=0,h1=k9.querySelector('h1');
var st=document.createElement('style');
st.textContent='.pwd{display:flex;justify-content:center;align-items:center;height:28px;margin:-33px 0 5px}.pwd button{height:28px;padding:0 5px;border:0;background:none;display:flex;align-items:center}.pwd button::after{content:"";width:12px;height:12px;border-radius:6px;border:2px solid #FCF5EE;opacity:.6;transition:.3s}.pwd button.on::after{width:32px;background:#FCF5EE;opacity:1}#weerPage>h1{margin:0 0 14px;text-align:center;white-space:nowrap;font:400 clamp(26px,8.4vw,48px) "Great Vibes",cursive;-webkit-text-stroke:.4px #FCF5EE}.pwv{overflow:hidden;overflow:clip;overflow-clip-margin:6px;transition:height .35s}.pwt{display:flex;align-items:flex-start;gap:'+G+'px;transition:transform .4s cubic-bezier(.22,.85,.3,1)}.pwt.drag,.pwt.drag .pwp{transition:none}.pwp{flex:0 0 100%;min-width:0;opacity:.35;transform:scale(.96);transform-origin:50% 0;transition:opacity .4s,transform .4s}.pwp.on{opacity:1;transform:none}';
document.head.appendChild(st);
var pwv=document.createElement('div'),pwt=document.createElement('div'),pn=[document.createElement('div'),document.createElement('div')],d=document.createElement('div');
pwv.className='pwv';pwt.className='pwt';pn[0].className='pwp on';pn[1].className='pwp';k9.insertBefore(pwv,host);pwv.appendChild(pwt);
pwt.appendChild(pn[0]);pwt.appendChild(pn[1]);pn[0].appendChild(host);pn[1].appendChild(wl);d.className='pwd';
d.innerHTML='<button type="button" class="on" aria-label="Pagina 1: weer en radar"></button><button type="button" aria-label="Pagina 2: weerfoto\u2019s"></button>';
wp.insertBefore(d,wp.firstChild);if(h1)wp.insertBefore(h1,k9);
var b=d.children;function ms(){W=pwt.clientWidth+G}function setX(x){pwt.style.transform='translateX('+x+'px)'}
function sy(){if(dr)return;var v=pn[cur].offsetHeight;if(v)pwv.style.height=v+'px'}
function sn(){pwt.classList.add('drag');ms();setX(-cur*W);void pwt.offsetWidth;pwt.classList.remove('drag')}
function go(n){
var old=cur;cur=n;ms();setX(-n*W);pwv.style.transition='';for(var i=0;i<2;i++){
pn[i].style.opacity=pn[i].style.transform='';pn[i].classList.toggle('on',i===n);b[i].classList.toggle('on',i===n)
}
sy();if(n!==old&&window.scrollY>0)window.scrollTo({top:0,behavior:'smooth'})
}
b[0].onclick=function(){go(0)};b[1].onclick=function(){go(1)};pwv.addEventListener('touchstart',function(e){
ok=dr=0;
if(e.touches.length!==1||e.target.closest('.leaflet-container,.pw-scroll,.wg,input,textarea,select,video'))return;
X0=e.touches[0].clientX;Y0=e.touches[0].clientY;T0=Date.now();dx=0;ok=1
},{passive:true});
pwv.addEventListener('touchmove',function(e){
if(!ok)return;var t=e.touches[0],mx=t.clientX-X0,my=t.clientY-Y0;if(!dr){
if(Math.abs(my)>10&&Math.abs(my)>Math.abs(mx)){ok=0;return}if(Math.abs(mx)<8||Math.abs(mx)<Math.abs(my)*1.3)return;
dr=1;ms();pwt.classList.add('drag');pwv.style.transition='none'
}
if(e.cancelable)e.preventDefault();dx=mx;
var m=(cur===0&&mx>0)||(cur===1&&mx<0)?mx*.3:mx,p=Math.max(0,Math.min(1,cur-m/W)),a=pn[0].offsetHeight,c=pn[1].offsetHeight;
setX(-cur*W+m);pn[0].style.opacity=1-.65*p;pn[0].style.transform='scale('+(1-.04*p)+')';pn[1].style.opacity=.35+.65*p;pn[1].style.transform='scale('+(.96+.04*p)+')';
pwv.style.height=(a+(c-a)*p)+'px'
},{passive:false});
function end(){
if(!ok)return;ok=0;if(!dr)return;dr=0;pwt.classList.remove('drag');var v=dx/(Date.now()-T0||1),n=cur;if(cur===0&&(dx<-W*.2||v<-.45))n=1;
else if(cur===1&&(dx>W*.2||v>.45))n=0;go(n)
}
pwv.addEventListener('touchend',end,{passive:true});pwv.addEventListener('touchcancel',end,{passive:true});
function ck(){if(pwt.clientWidth+G!==W)sn();sy()}
if(window.ResizeObserver){var ro=new ResizeObserver(ck);ro.observe(pn[0]);ro.observe(pn[1])}
addEventListener('resize',ck);
})();
(function(){var s=document.createElement('script');s.src='radar.js';document.body.appendChild(s)})();
