/* Regenradar Crea Landa - radar: RainViewer.com, kaart: OpenStreetMap, kaartprogramma: Leaflet, bliksem: Blitzortung.org, gif: gif.js, wolken: EUMETSAT Meteosat */
(function(){
 var wp=document.getElementById('pw');if(!wp||window.pwRadarLoaded)return;window.pwRadarLoaded=1;
 var API='https://api.rainviewer.com/public/weather-maps.json';
 var START_OPEN=true; /* true = radar staat open bij binnenkomst, false = ingeklapt */
 var SAT_URL='https://view.eumetsat.int/geoserver/wms';
 var SAT_LAAG='mtg_fd:ir105_hrfi'; /* infrarood, elke 10 min. Werkt dit niet? Probeer 'msg_fes:rgb_eview' */
 var SAT_OPACITY=.65;  /* 0 = onzichtbaar, 1 = volledig dekkend */
 var SAT_LAG=0;  /* minuten vertraging van de satelliet. Zijn de nieuwste wolken leeg? Zet op 20 of 30 */
 var SAT_CORS=true;  /* true = wolken ook in de GIF. Verdwijnen de wolken op de kaart? Zet op false */
 /* Kleuren (pas gerust aan) ===== */
 var HEX=['#9EB3D8','#627EB5','#D9667A','#B32C43','#7E1D30','#3E1A2C'];  /* regen: licht -> zwaar */
 var SNOWHEX=['#D6BFD9','#AE86B4','#7E4F8C'];  /* sneeuw: licht -> zwaar */
 var BMAX=[5,15,30,60,120];  /* bliksem: grens per stap in minuten */
 var BLAB=['0-5 min','5-15 min','15-30 min','30-60 min','1-2 uur'];  /* tekst in de legenda */
 var BCOL=['#B32C43','#D9667A','#FCF5EE','#9EB3D8','#627EB5'];  /* bliksem: vers -> oud */
 function rgb(h){return[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}
 var KLEUREN=HEX.map(rgb),SKLEUREN=SNOWHEX.map(rgb);
 /* Blitzortung: servers worden na elkaar geprobeerd */
 var WS=['wss://ws1.blitzortung.org/','wss://ws7.blitzortung.org/','wss://ws8.blitzortung.org/','wss://ws1.blitzortung.org:3000/'];
 var BWIN=BMAX[BMAX.length-1]*60000; /* bliksem blijft 2 uur bewaard */
 var BOLTP='<path d="M13 2 4 14h6l-1 8 9-12h-6z" stroke="#6F4257" stroke-width="1.3" stroke-linejoin="round"/>';
 function bsvg(c){return '<svg viewBox="0 0 24 24" fill="currentColor"'+(c?' style="color:'+c+'"':'')+'>'+BOLTP+'</svg>'}
 var pl=window.pwPlace||null,box,mapEl,map,mk,base,frames=[],layers=[],wolkenLagen=[],idx=0,timer=null,host='',lastKey=0,started=false;
 var wantPlay=true,eerste=true,blitsGone=false,on={rain:true,snow:true,blits:true,wolken:true},bon=[1,1,1,1,1],strikes=[],boltLayer=null;
 var st=document.createElement('style');
 st.textContent='#pw-radar{margin-top:6px}'+
 '.pwr-base{filter:grayscale(1) brightness(1.08) contrast(.85)}.pwr-map .leaflet-control-attribution{font-size:10px;line-height:1.3;padding:0 5px;background:#ffffffb0}'+
 '.pwr-top{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px}'+
 '.pwr-ch{display:flex;gap:5px;flex-wrap:wrap}'+
 '.pw .pwr-top button{padding:7px 11px;font-size:18px;border-radius:8px}'+
 '.pw .pwr-top .pwr-pc{background:#ffffff26;color:#FCF5EEb3;box-shadow:inset 0 0 0 1px #B32C43}'+
 '.pw .pwr-top .pwr-pc.on{background:#B32C43;color:#FCF5EE;box-shadow:none}'+
 '.pwr-map{position:relative;height:360px;border-radius:10px;overflow:hidden;background:#ffffff26}'+
 '.pwr-cr,.pwr-cs{position:absolute;left:0;top:0;width:100%;height:100%}'+
 '.pwr-map.no-rain .pwr-cr,.pwr-map.no-snow .pwr-cs{display:none}'+
 '.pwr-bolt{color:#B32C43;filter:drop-shadow(0 0 1px #0006)}.pwr-bolt svg{display:block;width:20px;height:20px}'+
 '#pwr-m{position:absolute;inset:0;font:12px Oswald,Arial,sans-serif}'+
 '.pwr-map.locked #pwr-m{pointer-events:none}'+
 '.pwr-lock{display:none;position:absolute;inset:0;z-index:1100;align-items:flex-end;justify-content:center;padding:12px 12px 70px;cursor:pointer}'+
 '.pwr-map.locked .pwr-lock{display:flex}'+
 '.pwr-lock span{background:#B32C43;color:#FCF5EE;padding:7px 14px;border-radius:8px;font-size:19px}'+
 '.pwr-leg{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:max-content;z-index:1000;padding:6px 9px 4px;border-radius:8px;background:#6F4257;pointer-events:none;font:12px/1.2 Oswald,Arial,sans-serif;color:#FCF5EE}'+
 '.pwr-leg i{display:block;height:8px;border-radius:4px;box-shadow:0 0 0 1px #FCF5EE66}'+
 '.pwr-leg .pwr-lb{display:flex;justify-content:space-between;margin-top:3px}'+
 '.pwr-leg .pwr-lr{width:132px}.pwr-leg .pwr-lrow{display:flex;align-items:center}'+
 '.pwr-map:not(.no-rain) .pwr-lrow{margin-top:4px}'+
 '.pwr-leg .pwr-lsn{display:flex;align-items:center;gap:4px}.pwr-leg .pwr-lsn i{width:30px}'+
 '.pwr-map.no-rain .pwr-lr,.pwr-map.no-snow .pwr-lsn,.pwr-map.no-snow .pwr-lrow{display:none}'+
 '.pwr-map.no-rain.no-snow .pwr-leg{display:none}'+
 '.pwr-bl{position:absolute;right:8px;top:8px;z-index:1200;display:flex;flex-direction:column;gap:1px;padding:5px 5px 4px;border-radius:8px;background:#6F4257eb;color:#FCF5EE;font:12px/1.2 Oswald,Arial,sans-serif}'+
 '.pwr-map.no-blits .pwr-bl{display:none}'+
 '.pwr-bl .pwr-bt{padding:0 3px 3px;font-size:12px;white-space:nowrap}'+
 '.pw .pwr-bl .pwr-br{display:flex;align-items:center;gap:6px;width:100%;margin:0;padding:3px;border:0;border-radius:5px;background:none;box-shadow:none;color:#FCF5EE;font:12px/1.2 Oswald,Arial,sans-serif;letter-spacing:0;text-transform:none;text-align:left}'+
 '.pw .pwr-bl .pwr-br.off{opacity:.4}.pw .pwr-bl .pwr-br:active{background:#ffffff26}'+
 '.pwr-br svg{width:16px;height:16px;flex-shrink:0}.pwr-br span{flex:1;white-space:nowrap}.pwr-br b{font-weight:400;min-width:14px;text-align:right;opacity:.8}'+
 '.pwr-bar{display:flex;align-items:center;gap:10px;margin-top:10px}'+
 '.pw .pwr-bar button{width:46px;height:42px;padding:0;font-size:20px}'+
 '.pwr-bar input{flex:1;min-width:0;accent-color:#B32C43}'+
 '#pwr-t{min-width:112px;text-align:right;font:16px Oswald,Arial,sans-serif}'+
 '@media(min-width:700px){.pwr-map{height:440px}}';
 document.head.appendChild(st);
 function $(i){return document.getElementById(i)}
 function rgb2hsl(r,g,b){
  r/=255;g/=255;b/=255;
  var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;
  if(d){
   s=l>.5?d/(2-mx-mn):d/(mx+mn);
   h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;
  }
  return [h,s,l];
 }
 function niveau(r,g,b){
  var c=rgb2hsl(r,g,b),h=c[0],s=c[1],l=c[2];
  if(s<.35||l>.85)return -1;
  if((h<75||h>330)&&l>.6)return 0;
  if(h>=75&&h<170)return 2;
  if(h>=170&&h<=265)return l>.62?0:(l>.42?1:2);
  if(h>=48&&h<75)return 3;
  if(h>=18&&h<48)return 4;
  return 5;
 }
 function laadImg(u,cb){var im=new Image();im.crossOrigin='anonymous';im.onload=function(){cb(im)};im.onerror=function(){cb(null)};im.src=u}
 function pixels(im,w,h){var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,w,h)}
 var Kleurlaag=null;
 function maakLaag(){
  Kleurlaag=L.TileLayer.extend({
   createTile:function(c,done){
    var tile=document.createElement('div'),sz=this.getTileSize(),w=sz.x,h=sz.y;
    var u1=this.getTileUrl(c),u0=u1.replace(/\/1_1\.png$/,'/1_0.png'),a=null,b=null,n=0;
    function klaar(){
     if(++n<2)return;
     var rc=document.createElement('canvas');rc.width=w;rc.height=h;rc.className='pwr-cr';tile.appendChild(rc);
     var src=a||b;
     if(src){
      try{
       var d1=pixels(src,w,h),p=d1.data,p2=(a&&b)?pixels(b,w,h).data:null,sd=null,sp=null,sc=null;
       for(var i=0;i<p.length;i+=4){
        var a1=p[i+3];
        if(p2&&p2[i+3]&&a1&&Math.abs(p[i]-p2[i])+Math.abs(p[i+1]-p2[i+1])+Math.abs(p[i+2]-p2[i+2])>40){
         if(!sd){sc=document.createElement('canvas');sc.width=w;sc.height=h;sc.className='pwr-cs';sd=sc.getContext('2d').createImageData(w,h);sp=sd.data}
         var m=niveau(p[i],p[i+1],p[i+2]),k=m<=1?0:(m<=3?1:2);
         sp[i]=SKLEUREN[k][0];sp[i+1]=SKLEUREN[k][1];sp[i+2]=SKLEUREN[k][2];sp[i+3]=p2[i+3];
         p[i+3]=0;
        }else if(a1){
         var q=niveau(p[i],p[i+1],p[i+2]);
         if(q>=0){p[i]=KLEUREN[q][0];p[i+1]=KLEUREN[q][1];p[i+2]=KLEUREN[q][2]}
        }
       }
       rc.getContext('2d').putImageData(d1,0,0);
       if(sd){sc.getContext('2d').putImageData(sd,0,0);tile.appendChild(sc)}
      }catch(e){rc.getContext('2d').drawImage(src,0,0)}
     }
     done(null,tile);
    }
    laadImg(u0,function(i){a=i;klaar()});
    laadImg(u1,function(i){b=i;klaar()});
    return tile;
   }
  });
 }
 function build(){
  box=document.createElement('div');box.id='pw-radar';
  box.innerHTML='<p style="text-align:center;margin:20px 0 8px"><button id="pwr-h" type="button" aria-expanded="'+START_OPEN+'">Radar '+(START_OPEN?'▴':'▾')+'</button></p>'+
   '<div id="pwr-body"'+(START_OPEN?'':' hidden')+'>'+
   '<div class="pwr-top"><span class="pwr-ch">'+
   '<button type="button" class="pwr-pc on" data-l="rain" aria-pressed="true">Regen</button>'+
   '<button type="button" class="pwr-pc on" data-l="snow" aria-pressed="true">Sneeuw</button>'+
   '<button type="button" class="pwr-pc on" data-l="blits" aria-pressed="true">Bliksem</button>'+
   '<button type="button" class="pwr-pc on" data-l="wolken" aria-pressed="true">Wolken</button></span>'+
   '<button id="pwr-g" type="button" class="alt">GIF</button></div>'+
   '<div class="pwr-map locked"><div id="pwr-m"></div><div class="pwr-lock"><span>Tik om de kaart te bedienen</span></div>'+
   '<div class="pwr-bl"><div class="pwr-bt">⚡ Verbinden…</div>'+BLAB.map(function(t,j){return '<button type="button" class="pwr-br" data-b="'+j+'" aria-pressed="true">'+bsvg(BCOL[j])+'<span>'+t+'</span><b class="pwr-bn">0</b></button>'}).join('')+'</div>'+
   '<div class="pwr-leg"><div class="pwr-lr"><i style="background:linear-gradient(90deg,'+HEX.join(',')+')"></i><div class="pwr-lb"><span>Licht</span><span>Zwaar</span><span>Extreem</span></div></div>'+
   '<div class="pwr-lrow"><span class="pwr-lsn"><i style="background:linear-gradient(90deg,'+SNOWHEX.join(',')+')"></i><span>Sneeuw</span></span></div></div></div>'+
   '<div class="pwr-bar"><button id="pwr-p" type="button" aria-label="Afspelen">▶</button>'+
   '<input id="pwr-s" type="range" min="0" max="0" value="0" aria-label="Tijd"><span id="pwr-t">Laden…</span></div>'+
   '<p style="text-align:center;margin:10px 0 0"><button id="pwr-l" type="button" class="alt">Kaart bedienen</button></p></div>';
  var foot=wp.querySelector('.pw-foot');wp.insertBefore(box,foot);
  foot.insertAdjacentHTML('beforeend','<br>Radar van <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer.com</a> · bliksem van <a href="https://www.blitzortung.org/" target="_blank" rel="noopener">Blitzortung.org</a> · wolken van <a href="https://view.eumetsat.int/" target="_blank" rel="noopener">EUMETSAT</a>');
  mapEl=$('pwr-m');
  var m=box.querySelector('.pwr-map'),body=$('pwr-body'),hb=$('pwr-h');
  function lock(v){m.classList.toggle('locked',v);$('pwr-l').textContent=v?'Kaart bedienen':'Kaart vergrendelen'}
  box.querySelector('.pwr-lock').onclick=function(){lock(false)};
  $('pwr-l').onclick=function(){lock(!m.classList.contains('locked'))};
  $('pwr-p').onclick=function(){if(timer){wantPlay=false;pause()}else{wantPlay=true;play()}};
  $('pwr-s').oninput=function(){wantPlay=false;pause();show(+this.value)};
  $('pwr-g').onclick=gifKlik;
  box.querySelector('.pwr-bl').onclick=function(e){
   var b=e.target.closest&&e.target.closest('.pwr-br');if(!b)return;
   var k=+b.getAttribute('data-b');bon[k]=bon[k]?0:1;
   b.classList.toggle('off',!bon[k]);b.setAttribute('aria-pressed',!!bon[k]);bolts(idx);
  };
  [].forEach.call(box.querySelectorAll('.pwr-pc'),function(b){
   b.onclick=function(){
    var k=b.getAttribute('data-l');
    if(on.rain&&on.snow&&on.wolken&&(on.blits||blitsGone)){on.rain=on.snow=on.blits=on.wolken=false;on[k]=true}
    else{on[k]=!on[k];if(!on.rain&&!on.snow&&!on.blits&&!on.wolken){on.rain=on.snow=on.wolken=true;on.blits=!blitsGone}}
    toggles();
   };
  });
  hb.onclick=function(){
   var open=body.hidden;body.hidden=!open;
   hb.textContent='Radar '+(open?'▴':'▾');hb.setAttribute('aria-expanded',open);
   if(open){
    if(!started){started=true;loadLeaflet()}
    else if(map)setTimeout(function(){map.invalidateSize()},50);
    toggles();
    if(wantPlay&&frames.length&&!timer)play();
   }else{pause();wsStop()}
  };
  new IntersectionObserver(function(es){
   if(es[0].isIntersecting){if(!started&&!body.hidden){started=true;loadLeaflet()}else if(wantPlay&&frames.length&&!timer&&!body.hidden)play()}else pause();
  },{threshold:.1}).observe(box);
 }
 function toggles(){
  if(!box)return;
  var m=box.querySelector('.pwr-map');
  ['rain','snow','blits','wolken'].forEach(function(k){
   m.classList.toggle('no-'+k,!on[k]);
   var b=box.querySelector('.pwr-pc[data-l="'+k+'"]');b.classList.toggle('on',on[k]);b.setAttribute('aria-pressed',on[k]);
  });
  if(!map)return;
  var open=!$('pwr-body').hidden;
  if(on.wolken&&open){if(!wolkenLagen.length)wolkenBouw()}else wolkenWeg();
  if(on.blits&&open){map.addLayer(boltLayer);wsWant=true;if(!ws)wsStart(0);bolts(idx)}
  else{map.removeLayer(boltLayer);wsStop()}
 }
 function satTijd(i){return new Date(Math.floor((frames[i].time-SAT_LAG*60)/600)*600000).toISOString()}
 function wolkenWeg(){wolkenLagen.forEach(function(l){map.removeLayer(l)});wolkenLagen=[]}
 function wolkenBouw(){
  wolkenWeg();
  if(!map||!frames.length||!on.wolken||$('pwr-body').hidden)return;
  wolkenLagen=frames.map(function(fr,j){
   return L.tileLayer.wms(SAT_URL,{
    layers:SAT_LAAG,format:'image/png',transparent:true,version:'1.3.0',time:satTijd(j),exceptions:'application/vnd.ogc.se_blank',
    opacity:0,zIndex:5,maxZoom:10,crossOrigin:SAT_CORS
   }).addTo(map);
  });
  wolkenToon(idx);
 }
 function wolkenToon(i){wolkenLagen.forEach(function(l,j){l.setOpacity(j===i?SAT_OPACITY:0)})}
 var ws=null,wsWant=false,wsRetry=null,wsOpen=false;
 function blLabel(){
  var t=box&&box.querySelector('.pwr-bt');if(!t)return;
  var c=[0,0,0,0,0],tot=0;
  if(frames.length)zichtbaar(idx,1).forEach(function(v){c[v.b]++;tot++});
  t.textContent='⚡ '+(!wsOpen?'Verbinden…':(tot?'Bliksem':'Geen bliksem'));
  [].forEach.call(box.querySelectorAll('.pwr-bn'),function(e,j){e.textContent=c[j]});
 }
 function lzw(b){var a,e={},d=b.split(''),c=d[0],f=c,g=[c],h=256,o=h;for(var i=1;i<d.length;i++){a=d[i].charCodeAt(0);a=h>a?d[i]:e[a]?e[a]:f+c;g.push(a);c=a.charAt(0);e[o]=f+c;o++;f=a}return g.join('')}
 function wsStart(k){
  if(!wsWant)return;
  if(k>=WS.length){wsFail();return}
  var opened=false,s;
  try{s=new WebSocket(WS[k])}catch(e){wsStart(k+1);return}
  ws=s;
  s.onopen=function(){opened=true;wsOpen=true;blLabel();try{s.send('{"a":111}')}catch(e){}};
  s.onmessage=function(e){
   try{var d=JSON.parse(lzw(e.data));if(typeof d.lat==='number'&&typeof d.lon==='number')strike(d.lat,d.lon)}catch(x){}
  };
  s.onerror=function(){};
  s.onclose=function(){
   if(ws!==s)return;ws=null;wsOpen=false;blLabel();
   if(!wsWant)return;
   if(opened)wsRetry=setTimeout(function(){wsStart(k)},15000);else wsStart(k+1);
  };
 }
 function wsStop(){wsWant=false;clearTimeout(wsRetry);wsOpen=false;if(ws){var s=ws;ws=null;try{s.close()}catch(e){}}blLabel()}
 function wsFail(){
  on.blits=false;blitsGone=true;wsWant=false;
  var b=box&&box.querySelector('.pwr-pc[data-l="blits"]');if(b)b.hidden=true;if(!on.rain&&!on.snow&&!on.wolken){on.rain=on.snow=on.wolken=true}
  toggles();
 }
 function strike(lat,lon){
  if(!pl||!map||Math.abs(lat-pl.lat)>10||Math.abs(lon-pl.lon)>16)return;
  var mkr=L.marker([lat,lon],{icon:L.divIcon({html:bsvg(''),className:'pwr-bolt',iconSize:[20,20]}),interactive:false,keyboard:false,opacity:0}).addTo(boltLayer);
  strikes.push({t:Date.now(),lat:lat,lon:lon,m:mkr,b:-1});
  var lim=Date.now()-BWIN-60000;
  while(strikes.length>600||(strikes.length&&strikes[0].t<lim)){boltLayer.removeLayer(strikes.shift().m)}
  if(idx===frames.length-1)bolts(idx);
 }
 function zichtbaar(i,all){
  var last=i===frames.length-1,ft=last?Date.now():frames[i].time*1000,r=[];
  strikes.forEach(function(s){
   var a=(ft-s.t)/60000;if(a<0||a>BMAX[BMAX.length-1])return;
   var b=0;while(a>BMAX[b])b++;
   if(all||bon[b])r.push({s:s,b:b});
  });
  return r;
 }
 function bolts(i){
  if(!frames.length||!boltLayer)return;
  strikes.forEach(function(s){s.b=-1});
  zichtbaar(i).forEach(function(v){v.s.b=v.b});
  strikes.forEach(function(s){
   s.m.setOpacity(s.b<0?0:1);
   var e=s.m.getElement&&s.m.getElement();if(e&&s.b>=0)e.style.color=BCOL[s.b];
  });
  blLabel();
 }
 function loadLeaflet(){
  var css=document.createElement('link');css.rel='stylesheet';
  css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';document.head.appendChild(css);
  var js=document.createElement('script');
  js.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  js.onload=init;js.onerror=function(){$('pwr-t').textContent='Kaart laadt niet'};
  document.head.appendChild(js);
 }
 function init(){
  maakLaag();
  map=L.map(mapEl,{attributionControl:false,minZoom:5,maxZoom:10}).setView([pl.lat,pl.lon],7);
  base=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,className:'pwr-base',crossOrigin:true}).addTo(map);
  L.control.attribution({prefix:false}).addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, Contains modified EUMETSAT Meteosat data '+new Date().getFullYear()).addTo(map);
  mk=L.circleMarker([pl.lat,pl.lon],{radius:7,color:'#FCF5EE',weight:2,fillColor:'#B32C43',fillOpacity:1}).addTo(map);
  boltLayer=L.layerGroup();
  loadFrames();setInterval(loadFrames,300000);
  setInterval(function(){if(frames.length&&idx===frames.length-1)bolts(idx)},30000);
  setTimeout(function(){map.invalidateSize()},300);
  toggles();
 }
 function loadFrames(){
  fetch(API).then(function(r){return r.json()}).then(function(d){
   var f=(d.radar&&d.radar.past)||[];if(!f.length)throw 0;
   if(f[f.length-1].time===lastKey)return;lastKey=f[f.length-1].time;
   layers.forEach(function(l){map.removeLayer(l)});
   host=d.host;frames=f;
   layers=f.map(function(fr){
    return new Kleurlaag(host+fr.path+'/256/{z}/{x}/{y}/2/1_1.png',{opacity:0,maxNativeZoom:7,maxZoom:10,zIndex:10}).addTo(map);
   });
   wolkenBouw();
   $('pwr-s').max=f.length-1;show(f.length-1);
   if(eerste){eerste=false;if(wantPlay)play()}
  }).catch(function(){$('pwr-t').textContent='Radar niet beschikbaar'});
 }
 function tijd(i){return new Date(frames[i].time*1000).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}
 function show(i){
  idx=i;
  layers.forEach(function(l,j){l.setOpacity(j===i?.85:0)});
  wolkenToon(i);
  $('pwr-s').value=i;
  var min=Math.round((Date.now()-frames[i].time*1000)/60000),hhmm=tijd(i);
  $('pwr-t').textContent=i===frames.length-1?hhmm+' · nu':hhmm+' · '+min+' min geleden';
  bolts(i);
 }
 function play(){
  if(!frames.length)return;
  $('pwr-p').textContent='❚❚';$('pwr-p').setAttribute('aria-label','Pauze');
  (function stap(){
   timer=setTimeout(function(){show(idx+1>=frames.length?0:idx+1);stap()},idx===frames.length-1?1500:450);
  })();
 }
 function pause(){
  clearTimeout(timer);timer=null;
  var p=$('pwr-p');if(p){p.textContent='▶';p.setAttribute('aria-label','Afspelen')}
 }
 window.pwRadar={s:function(){return{map:map,base:base,layers:layers,wolken:wolkenLagen,satCors:SAT_CORS,satOp:SAT_OPACITY,frames:frames,on:on,pl:pl,mapEl:mapEl,zichtbaar:zichtbaar,tijd:tijd,HEX:HEX,SNOWHEX:SNOWHEX,BCOL:BCOL,BLAB:BLAB,bon:bon,pause:pause,gb:$('pwr-g')}}};
 function gifKlik(){
  if(window.pwRadarGif)return window.pwRadarGif();
  var gb=$('pwr-g'),s=document.createElement('script');gb.textContent='…';
  s.src='radar-gif.js';s.onload=function(){gb.textContent='GIF';window.pwRadarGif&&window.pwRadarGif()};
  s.onerror=function(){gb.textContent='Mislukt';setTimeout(function(){gb.textContent='GIF'},3000)};
  document.head.appendChild(s);
 }
 function place(p){
  pl=p;
  if(!box)build();
  if(map){map.setView([pl.lat,pl.lon],map.getZoom());mk.setLatLng([pl.lat,pl.lon])}
 }
 document.addEventListener('pw-place',function(e){place(e.detail)});
 if(pl)place(pl);
})();
