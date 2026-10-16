/* Radar Crea Landa - kaart, lagen, bliksem, wind, tijdlijn.
   Laadt zelf Leaflet, radar.css, wind.js en (bij een tik op Foto/GIF) radar-gif.js. */
(function(){
var LF='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.',
RV='https://api.rainviewer.com/public/weather-maps.json',
SAT='https://view.eumetsat.int/geoserver/wms',SATLAAG='mtg_fd:ir105_hrfi',SATMIN=25, /* satelliet loopt ongeveer 25 min achter */
KAART_DONKER=[111,132,178],KAART_LICHT=[234,240,248],
HEX=['#A9BEE6','#5C7FC8','#E0607A','#B32C43','#4A1428'],SNOWHEX=['#D8C4E0','#8A5AAB'],
BCOL=['#FFE14D','#FF9F1C','#E63946'],BLAB=['0-10 min','10-30 min','30-60 min'],
SATOP=.55,RAINOP=.85,BOLT='M13 2 4 14h6l-1 8 9-12h-6z';
function $(i){return document.getElementById(i)}
function mk(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e}
function js(u,cb){var s=document.createElement('script');s.src=u;s.onload=s.onerror=cb;document.head.appendChild(s)}
function css(u){var l=document.createElement('link');l.rel='stylesheet';l.href=u;document.head.appendChild(l)}
var pw=$('pw');if(!pw)return;
css(LF+'css');css('radar.css');
js(LF+'js',function(){js('wind.js',init)});

function init(){
var L=window.L;if(!L||$('pwr-map'))return;
var map,base,dot,grp,mapEl,layers=[],wolken=[],frames=[],idx=0,pt=0,
on={rain:1,snow:1,blits:1,wolken:1,wind:0},bon=[1,1,1],strikes=[],
pl=window.pwPlace||{lat:52.71,lon:5.86};
window.pwKaart={d:KAART_DONKER,l:KAART_LICHT};

/* stijl voor wind (staat niet in radar.css) */
var st=mk('style');st.textContent='.pwr-wc{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:450}.pwr-wm{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1050}.pwr-wm>div{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:1px}.pwr-wm .pn{font:11px/1.1 Oswald,Arial,sans-serif;color:#FCF5EE;text-shadow:0 0 3px #6F4257,0 0 3px #6F4257}.pwr-wm .pk{display:flex;align-items:center;gap:3px;padding:2px 6px;border-radius:6px;background:#B32C43;color:#FCF5EE;font:12px/1.2 Oswald,Arial,sans-serif;white-space:nowrap}.pwr-wm .pk svg{width:14px;height:14px;flex-shrink:0}';
document.head.appendChild(st);

/* blauwe kaartkleuren (duotone-filter) */
var fx=function(i){return KAART_DONKER[i]/255+' '+KAART_LICHT[i]/255},fl=mk('div');
fl.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
fl.innerHTML='<svg width="0" height="0"><filter id="pwr-duo" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="'+fx(0)+'"/><feFuncG type="table" tableValues="'+fx(1)+'"/><feFuncB type="table" tableValues="'+fx(2)+'"/></feComponentTransfer></filter></svg>';
document.body.appendChild(fl);

/* opbouw van het scherm */
var CH=[['rain','Regen'],['snow','Sneeuw'],['blits','Bliksem'],['wolken','Wolken'],['wind','Wind']],
chips=CH.map(function(c){return '<button type="button" class="pwr-pc'+(on[c[0]]?' on':'')+'" data-k="'+c[0]+'">'+c[1]+'</button>'}).join(''),
rows=BLAB.map(function(t,j){return '<button type="button" class="pwr-br"><svg viewBox="0 0 24 24"><path d="'+BOLT+'" fill="'+BCOL[j]+'" stroke="#6F4257" stroke-width="1.3" stroke-linejoin="round"/></svg><span>'+t+'</span><b>0</b></button>'}).join(''),
top=mk('div','pwr-top');
top.innerHTML='<p style="text-align:center;margin:14px 0 0"><button type="button" id="pwr-tg">Radar \u25B4</button></p><div id="pwr-body"><div class="pwr-ch" style="margin-top:10px">'+chips+'</div>'+
'<div class="pwr-map locked" id="pwr-map"><div id="pwr-m" style="position:absolute;left:0;top:0;width:100%;height:100%"></div>'+
'<div class="pwr-leg"><div class="pwr-lr"><i style="background:linear-gradient(90deg,'+HEX+')"></i><div class="pwr-lb"><span>Licht</span><span>Zwaar</span><span>Extreem</span></div></div><div class="pwr-ls"><i style="background:linear-gradient(90deg,'+SNOWHEX+')"></i><div class="pwr-lb"><span>Sneeuw</span></div></div><div class="pwr-lw"><i style="background:linear-gradient(90deg,#2a2a3a,#f0f0f4)"></i><div class="pwr-lb"><span>Laag</span><span>Hoog</span></div></div></div>'+
'<div class="pwr-bl dicht" id="pwr-bl"><div class="pwr-bt" id="pwr-bt"></div>'+rows+'</div>'+
'<div class="pwr-lock"><span>Tik om de kaart te bedienen</span></div></div>'+
'<div class="pwr-bar"><button type="button" id="pwr-p">\u25B6</button><input type="range" id="pwr-s" min="0" max="0" value="0" aria-label="Tijdlijn"><span id="pwr-t"></span></div>'+
'<div class="pwr-acts"><button type="button" id="pwr-f">Foto</button><button type="button" id="pwr-g">GIF</button></div></div>';
var ft=pw.querySelector('.pw-foot');pw.insertBefore(top,ft);
var mp=$('pwr-map');mapEl=$('pwr-m');

/* kaart */
map=L.map(mapEl,{minZoom:4,maxZoom:10,zoomSnap:1}).setView([pl.lat,pl.lon],8);
map.attributionControl.setPrefix(false);
map.createPane('wolk').style.zIndex=250;map.createPane('regen').style.zIndex=350;
base=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{className:'pwr-base',crossOrigin:'anonymous',maxZoom:19,attribution:'\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
dot=L.circleMarker([pl.lat,pl.lon],{radius:7,color:'#FCF5EE',weight:2,fillColor:'#B32C43',fillOpacity:1,interactive:false}).addTo(map);
grp=L.layerGroup().addTo(map);
if(window.pwWind)pwWind.init(map);
var first=1;
if(window.ResizeObserver)new ResizeObserver(function(){map.invalidateSize();if(first&&mapEl.clientWidth){first=0;map.setView([pl.lat,pl.lon],map.getZoom())}}).observe(mapEl);
document.addEventListener('pw-place',function(e){pl=e.detail;dot.setLatLng([pl.lat,pl.lon]);map.setView([pl.lat,pl.lon],map.getZoom())});

/* kaart vergrendelen zodat de pagina soepel scrolt */
mp.querySelector('.pwr-lock').onclick=function(){mp.classList.remove('locked')};
document.addEventListener('pointerdown',function(e){if(!mp.contains(e.target))mp.classList.add('locked')});

/* regenlaag: RainViewer-tegels, regen en sneeuw gesplitst over twee canvassen */
function cvs(c){var k=mk('canvas',c);k.width=k.height=256;return k}
function snee(r,g,b){return r>g+20&&b>g+20&&Math.abs(r-b)<45}
var Regen=L.GridLayer.extend({createTile:function(c,done){
 var t=mk('div'),a=cvs('pwr-cr'),s=cvs('pwr-cs'),im=new Image();t.appendChild(a);t.appendChild(s);im.crossOrigin='anonymous';
 im.onload=function(){try{
  var k=cvs(''),x=k.getContext('2d');x.drawImage(im,0,0,256,256);
  var d=x.getImageData(0,0,256,256),p=d.data,e=x.createImageData(256,256),q=e.data;
  for(var i=0;i<p.length;i+=4)if(p[i+3]&&snee(p[i],p[i+1],p[i+2])){q[i]=p[i];q[i+1]=p[i+1];q[i+2]=p[i+2];q[i+3]=p[i+3];p[i+3]=0}
  a.getContext('2d').putImageData(d,0,0);s.getContext('2d').putImageData(e,0,0);
 }catch(z){}done(null,t)};
 im.onerror=function(){done(null,t)};
 im.src=this.options.u+'/256/'+c.z+'/'+c.x+'/'+c.y+'/2/1_1.png';return t}});
function satLaag(ms){
 var t=new Date(Math.floor((Math.min(ms,Date.now())-SATMIN*6e4)/6e5)*6e5).toISOString().slice(0,19)+'Z';
 return L.tileLayer.wms(SAT,{layers:SATLAAG,format:'image/png',transparent:true,version:'1.3.0',time:t,pane:'wolk',className:'pwr-sat',crossOrigin:'anonymous',opacity:0,attribution:'Contains modified EUMETSAT Meteosat data '+new Date().getFullYear()})}

/* tijd en bliksem */
function p2(n){return('0'+n).slice(-2)}
function tijd(n){var f=frames[n];if(!f)return'';var d=new Date(f.time*1000),m=Math.round((Date.now()-f.time*1000)/6e4);
 return p2(d.getHours())+':'+p2(d.getMinutes())+' \u00B7 '+(m>=1?m+' min geleden':m<=-1?'over '+(-m)+' min':'nu')}
function zicht(n){var f=frames[n],r=[];if(!f)return r;var t0=Math.min(f.time*1000,Date.now());
 strikes.forEach(function(s){var a=(t0-s.t)/6e4;if(a<0||a>60)return;r.push({s:s,b:a<10?0:a<30?1:2})});return r}
function zichtbaar(n){return zicht(n).filter(function(v){return bon[v.b]})}
function bolts(){
 grp.clearLayers();var all=zicht(idx),c=[0,0,0];all.forEach(function(v){c[v.b]++});
 if(on.blits)zichtbaar(idx).slice(0,300).forEach(function(v){
  L.marker([v.s.lat,v.s.lon],{interactive:false,keyboard:false,icon:L.divIcon({className:'pwr-bolt',iconSize:[20,20],iconAnchor:[10,10],html:'<svg viewBox="0 0 24 24" style="color:'+BCOL[v.b]+'"><path d="'+BOLT+'" fill="currentColor" stroke="#6F4257" stroke-width="1.3" stroke-linejoin="round"/></svg>'})}).addTo(grp)});
 [].forEach.call($('pwr-bl').querySelectorAll('.pwr-br b'),function(b,j){b.textContent=c[j]});
 var n=all.length;$('pwr-bt').textContent='\u26A1 '+(n?n+' bliksem'+(n>1?'s':''):'Geen bliksem')+($('pwr-bl').classList.contains('dicht')?' \u25BE':' \u25B4')}
function toon(n){
 if(!frames.length)return;idx=n;
 layers.forEach(function(l,i){l.setOpacity(i==n&&(on.rain||on.snow)?RAINOP:0)});
 wolken.forEach(function(l,i){l.setOpacity(i==n&&on.wolken?SATOP:0)});
 $('pwr-s').value=n;$('pwr-t').textContent=tijd(n);bolts()}
function pasToe(){
 ['rain','snow','wolken','blits'].forEach(function(k){mp.classList.toggle('no-'+(k=='blits'?'blits':k),!on[k])});
 if(window.pwWind)pwWind.set(!!on.wind,on.wind?'wind':'');toon(idx)}

/* afspelen */
function pause(){clearTimeout(pt);pt=0;$('pwr-p').textContent='\u25B6'}
function stap(){var n=(idx+1)%frames.length;toon(n);pt=setTimeout(stap,n==frames.length-1?1500:450)}
$('pwr-p').onclick=function(){if(pt)pause();else if(frames.length){$('pwr-p').textContent='\u275A\u275A';stap()}};
$('pwr-s').oninput=function(){pause();toon(+this.value)};

/* knoppen */
$('pwr-tg').onclick=function(){var b=$('pwr-body');b.hidden=!b.hidden;this.textContent='Radar '+(b.hidden?'\u25BE':'\u25B4')};
[].forEach.call(top.querySelectorAll('.pwr-pc'),function(b){b.onclick=function(){var k=b.dataset.k;on[k]=on[k]?0:1;b.classList.toggle('on',!!on[k]);pasToe()}});
$('pwr-bt').onclick=function(){$('pwr-bl').classList.toggle('dicht');bolts()};
[].forEach.call($('pwr-bl').querySelectorAll('.pwr-br'),function(b,j){b.onclick=function(){bon[j]=bon[j]?0:1;b.classList.toggle('off',!bon[j]);bolts()}});
function gif(f){function go(){if(window.pwRadarGif)pwRadarGif(f)}window.pwRadarGif?go():js('radar-gif.js',go)}
$('pwr-f').onclick=function(){gif(1)};$('pwr-g').onclick=function(){gif()};

/* gegevens van de GIF-maker */
window.pwRadar={s:function(){return{map:map,base:base,layers:layers,wolken:wolken,frames:frames,on:on,pl:pl,mapEl:mapEl,zichtbaar:zichtbaar,tijd:tijd,HEX:HEX,SNOWHEX:SNOWHEX,BCOL:BCOL,BLAB:BLAB,bon:bon,pause:pause,gb:$('pwr-g'),idx:idx,satCors:true,satOp:SATOP}}};

/* radarbeelden ophalen (elke 5 minuten opnieuw) */
function laad(){
 fetch(RV).then(function(r){return r.json()}).then(function(d){
  var past=d.radar.past||[],fr=past.concat(d.radar.nowcast||[]);if(!fr.length)return;
  pause();layers.concat(wolken).forEach(function(l){map.removeLayer(l)});layers=[];wolken=[];frames=fr;
  fr.forEach(function(f){
   layers.push(new Regen({pane:'regen',maxNativeZoom:7,opacity:0,u:d.host+f.path,attribution:'<a href="https://www.rainviewer.com/">RainViewer</a>'}).addTo(map));
   wolken.push(satLaag(f.time*1000).addTo(map))});
  $('pwr-s').max=fr.length-1;pasToe();toon(Math.max(0,past.length-1));
 }).catch(function(){$('pwr-t').textContent='Radar laden mislukt'})}
laad();setInterval(laad,300000);

/* bliksem live via Blitzortung (verzamelt vanaf het openen van de pagina) */
function dec(b){var a,e={},d=b.split(''),c=d[0],f=c,g=[c],h=256,o=h;for(var i=1;i<d.length;i++){a=d[i].charCodeAt(0);a=h>a?d[i]:e[a]?e[a]:f+c;g.push(a);c=a.charAt(0);e[o]=f+c;o++;f=a}return g.join('')}
var SV=['ws1','ws7','ws8'],sk=0;
function ws(){var w;try{w=new WebSocket('wss://'+SV[sk%SV.length]+'.blitzortung.org/')}catch(e){return}
 w.onopen=function(){w.send('{"a":111}')};
 w.onmessage=function(m){try{var o=JSON.parse(dec(m.data));
  if(o.lat>38&&o.lat<64&&o.lon>-14&&o.lon<30){strikes.push({lat:o.lat,lon:o.lon,t:o.time>1e15?o.time/1e6:Date.now()});if(strikes.length>4000)strikes.shift()}}catch(e){}};
 w.onclose=function(){sk++;setTimeout(ws,30000)}}
ws();
setInterval(function(){var lim=Date.now()-72e5/2;strikes=strikes.filter(function(s){return s.t>lim});bolts()},15000);
pasToe();
}
})();
