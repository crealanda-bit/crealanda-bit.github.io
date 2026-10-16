/* Radar Crea Landa */
(function(){
var LF='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.',
RV='https://api.rainviewer.com/public/weather-maps.json',
SAT='https://view.eumetsat.int/geoserver/wms',SATLAAG='mtg_fd:ir105_hrfi',SATMIN=25,
KD=[111,132,178],KL=[234,240,248],HEX=['#A9BEE6','#5C7FC8','#E0607A','#B32C43','#4A1428'],
SNOWHEX=['#D8C4E0','#8A5AAB'],BCOL=['#FFE14D','#FF9F1C','#E63946'],BLAB=['0-10 min','10-30 min','30-60 min'],
SATOP=.55,RAINOP=.85,BOLT='M13 2 4 14h6l-1 8 9-12h-6z';
function $(i){return document.getElementById(i)}
function mk(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e}
function js(u,cb){var s=document.createElement('script');s.src=u;s.onload=s.onerror=cb;document.head.appendChild(s)}
function css(u){var l=document.createElement('link');l.rel='stylesheet';l.href=u;document.head.appendChild(l)}
var pw=$('pw');if(!pw)return;css(LF+'css');css('radar.css');js(LF+'js',function(){js('wind.js',init)});
function init(){
var L=window.L;if(!L||$('pwr-map'))return;
var map,base,dot,grp,mapEl,layers=[],wolken=[],frames=[],idx=0,pt=0,
on={rain:1,snow:1,blits:1,wolken:1,wind:0},bon=[1,1,1],strikes=[],
pl=window.pwPlace||{lat:52.71,lon:5.86};window.pwKaart={d:KD,l:KL};
var st=mk('style');st.textContent='.pwr-wc{position:absolute;inset:0;pointer-events:none;z-index:450}.pwr-wm{position:absolute;inset:0;pointer-events:none;z-index:1050}.pwr-wm>div{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:1px}.pwr-wm .pn{font:11px/1.1 Oswald,Arial,sans-serif;color:#FCF5EE;text-shadow:0 0 3px #6F4257}.pwr-wm .pk{display:flex;align-items:center;gap:3px;padding:2px 6px;border-radius:6px;background:#B32C43;color:#FCF5EE;font:12px/1.2 Oswald,Arial,sans-serif;white-space:nowrap}.pwr-wm .pk svg{width:14px;height:14px;flex-shrink:0}';
document.head.appendChild(st);
var fx=function(i){return KD[i]/255+' '+KL[i]/255},fl=mk('div');fl.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
fl.innerHTML='<svg width="0" height="0"><filter id="pwr-duo" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="'+fx(0)+'"/><feFuncG type="table" tableValues="'+fx(1)+'"/><feFuncB type="table" tableValues="'+fx(2)+'"/></feComponentTransfer></filter></svg>';
document.body.appendChild(fl);
var CH=[['rain','Regen'],['snow','Sneeuw'],['blits','Bliksem'],['wolken','Wolken'],['wind','Wind']],
chips=CH.map(function(c){return '<button type="button" class="pwr-pc'+(on[c[0]]?' on':'')+'" data-k="'+c[0]+'">'+c[1]+'</button>'}).join(''),
rows=BLAB.map(function(t,j){return '<button type="button" class="pwr-br"><svg viewBox="0 0 24 24"><path d="'+BOLT+'" fill="'+BCOL[j]+'" stroke="#6F4257" stroke-width="1.3" stroke-linejoin="round"/></svg><span>'+t+'</span><b>0</b></button>'}).join(''),
top=mk('div','pwr-top');
top.innerHTML='<p style="text-align:center;margin:14px 0 0"><button type="button" id="pwr-tg">Radar \u25B4</button></p><div id="pwr-body"><div class="pwr-ch" style="margin-top:10px">'+chips+'</div>'+
'<div class="pwr-map locked" id="pwr-map"><div id="pwr-m" style="position:absolute;inset:0"></div>'+
'<div class="pwr-leg"><div class="pwr-lr"><i style="background:linear-gradient(90deg,'+HEX+')"></i><div class="pwr-lb"><span>Licht</span><span>Zwaar</span><span>Extreem</span></div></div><div class="pwr-ls"><i style="background:linear-gradient(90deg,'+SNOWHEX+')"></i><div class="pwr-lb"><span>Sneeuw</span></div></div><div class="pwr-lw"><i style="background:linear-gradient(90deg,#2a2a3a,#f0f0f4)"></i><div class="pwr-lb"><span>Laag</span><span>Hoog</span></div></div></div>'+
'<div class="pwr-bl dicht" id="pwr-bl"><div class="pwr-bt" id="pwr-bt"></div>'+rows+'</div>'+
'<div class="pwr-lock"><span>Tik om de kaart te bedienen</span></div></div>'+
'<div class="pwr-bar"><button type="button" id="pwr-p">\u25B6</button><input type="range" id="pwr-s" min="0" max="0" value="0" aria-label="Tijdlijn"><span id="pwr-t"></span></div>'+
'<div class="pwr-acts"><button type="button" id="pwr-f">Foto</button><button type="button" id="pwr-g">GIF</button
