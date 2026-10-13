/* Regenradar Crea Landa - radar: RainViewer.com, kaart: OpenStreetMap, kaartprogramma: Leaflet, bliksem: Blitzortung.org, gif: gif.js */
(function(){
  var wp=document.getElementById('pw');if(!wp||window.pwRadarLoaded)return;window.pwRadarLoaded=1;
  var API='https://api.rainviewer.com/public/weather-maps.json';
  var START_OPEN=true; /* true = radar staat open bij binnenkomst, false = ingeklapt */

  /* ===== Kleuren (pas gerust aan) ===== */
  var HEX=['#9EB3D8','#627EB5','#D9667A','#B32C43','#7E1D30','#3E1A2C'];   /* regen: licht -> zwaar */
  var SNOWHEX=['#D6BFD9','#AE86B4','#7E4F8C'];                              /* sneeuw: licht -> zwaar */
  function rgb(h){return[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}
  var KLEUREN=HEX.map(rgb),SKLEUREN=SNOWHEX.map(rgb);

  /* Blitzortung: servers worden na elkaar geprobeerd */
  var WS=['wss://ws1.blitzortung.org/','wss://ws7.blitzortung.org/','wss://ws8.blitzortung.org/','wss://ws1.blitzortung.org:3000/'];
  var BWIN=900000; /* bliksem blijft 15 minuten zichtbaar */

  var pl=window.pwPlace||null,box,mapEl,map,mk,base,frames=[],layers=[],idx=0,timer=null,host='',lastKey=0,started=false,gifBusy=false;
  var blitsGone=false,on={rain:true,snow:true,blits:true},strikes=[],boltLayer=null;
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
  '.pwr-bolt{font-size:17px;line-height:20px;text-align:center;filter:drop-shadow(0 0 1px #6F4257)}'+
  '#pwr-m{position:absolute;inset:0;font:12px Oswald,Arial,sans-serif}'+
  '.pwr-map.locked #pwr-m{pointer-events:none}'+
  '.pwr-lock{display:none;position:absolute;inset:0;z-index:1100;align-items:flex-end;justify-content:center;padding:12px 12px 70px;cursor:pointer}'+
  '.pwr-map.locked .pwr-lock{display:flex}'+
  '.pwr-lock span{background:#B32C43;color:#FCF5EE;padding:7px 14px;border-radius:8px;font-size:19px}'+
  '.pwr-leg{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:150px;z-index:1000;padding:6px 9px 4px;border-radius:8px;background:#6F4257;pointer-events:none;font:12px/1.2 Oswald,Arial,sans-serif;color:#FCF5EE}'+
  '.pwr-leg i{display:block;height:8px;border-radius:4px;box-shadow:0 0 0 1px #FCF5EE66}'+
  '.pwr-leg .pwr-lb{display:flex;justify-content:space-between;margin-top:3px}'+
  '.pwr-leg .pwr-lrow{display:flex;justify-content:space-between;align-items:center}'+
  '.pwr-map:not(.no-rain) .pwr-lrow{margin-top:4px}'+
  '.pwr-leg .pwr-lsn{display:flex;align-items:center;gap:4px}.pwr-leg .pwr-lsn i{width:30px}'+
  '.pwr-map.no-rain .pwr-lr,.pwr-map.no-snow .pwr-lsn,.pwr-map.no-blits .pwr-lbl{display:none}'+
  '.pwr-map.no-snow.no-blits .pwr-lrow{display:none}'+
  '.pwr-map.no-rain.no-snow.no-blits .pwr-leg{display:none}'+
  '.pwr-bar{display:flex;align-items:center;gap:10px;margin-top:10px}'+
  '.pw .pwr-bar button{width:46px;height:42px;padding:0;font-size:20px}'+
  '.pwr-bar input{flex:1;min-width:0;accent-color:#B32C43}'+
  '#pwr-t{min-width:112px;text-align:right;font:16px Oswald,Arial,sans-serif}'+
  '.pwr-gv{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;background:#000000b3;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'+
  '.pwr-gv img{max-width:100%;max-height:68vh;border-radius:12px;box-shadow:0 10px 40px #0006}'+
  '.pwr-gv .pwr-rij{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}'+
  '.pwr-gv .pwr-gb{display:inline-block;border:0;border-radius:8px;padding:10px 18px;background:#B32C43;color:#FCF5EE;font:21px/1 "Bebas Neue",sans-serif;text-decoration:none;cursor:pointer}'+
  '@media(min-width:700px){.pwr-map{height:440px}}';
  document.head.appendChild(st);

  function $(i){return document.getElementById(i)}

  /* ===== herkleuren: regen en sneeuw uit de RainViewer-tegels ===== */
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
                  /* dit pixel is sneeuw */
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
    box.innerHTML='<p style="text-align:center;margin:20px 0 8px"><button id="pwr-h" type="button" aria-expanded="'+START_OPEN+'">Radar '+(START_OPEN?'\u25B4':'\u25BE')+'</button></p>'+
      '<div id="pwr-body"'+(START_OPEN?'':' hidden')+'>'+
      '<div class="pwr-top"><span class="pwr-ch">'+
      '<button type="button" class="pwr-pc on" data-l="rain" aria-pressed="true">Regen</button>'+
      '<button type="button" class="pwr-pc on" data-l="snow" aria-pressed="true">Sneeuw</button>'+
      '<button type="button" class="pwr-pc on" data-l="blits" aria-pressed="true">Bliksem</button></span>'+
      '<button id="pwr-g" type="button" class="alt">GIF</button></div>'+
      '<div class="pwr-map locked"><div id="pwr-m"></div><div class="pwr-lock"><span>Tik om de kaart te bedienen</span></div>'+
      '<div class="pwr-leg"><div class="pwr-lr"><i style="background:linear-gradient(90deg,'+HEX.join(',')+')"></i><div class="pwr-lb"><span>Licht</span><span>Zwaar</span><span>Extreem</span></div></div>'+
      '<div class="pwr-lrow"><span class="pwr-lsn"><i style="background:linear-gradient(90deg,'+SNOWHEX.join(',')+')"></i><span>Sneeuw</span></span><span class="pwr-lbl">\u26A1 Bliksem</span></div></div></div>'+
      '<div class="pwr-bar"><button id="pwr-p" type="button" aria-label="Afspelen">\u25B6</button>'+
      '<input id="pwr-s" type="range" min="0" max="0" value="0" aria-label="Tijd"><span id="pwr-t">Laden\u2026</span></div>'+
      '<p style="text-align:center;margin:10px 0 0"><button id="pwr-l" type="button" class="alt">Kaart bedienen</button></p></div>';
    var foot=wp.querySelector('.pw-foot');wp.insertBefore(box,foot);
    foot.insertAdjacentHTML('beforeend','<br>Radar van <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer.com</a> \u00B7 bliksem van <a href="https://www.blitzortung.org/" target="_blank" rel="noopener">Blitzortung.org</a>');
    mapEl=$('pwr-m');
    var m=box.querySelector('.pwr-map'),body=$('pwr-body'),hb=$('pwr-h');
    function lock(v){m.classList.toggle('locked',v);$('pwr-l').textContent=v?'Kaart bedienen':'Kaart vergrendelen'}
    box.querySelector('.pwr-lock').onclick=function(){lock(false)};
    $('pwr-l').onclick=function(){lock(!m.classList.contains('locked'))};
    $('pwr-p').onclick=function(){timer?pause():play()};
    $('pwr-s').oninput=function(){pause();show(+this.value)};
    $('pwr-g').onclick=gifKlik;
    [].forEach.call(box.querySelectorAll('.pwr-pc'),function(b){
      b.onclick=function(){
        var k=b.getAttribute('data-l');
        if(on.rain&&on.snow&&(on.blits||blitsGone)){on.rain=on.snow=on.blits=false;on[k]=true} /* alles aan: eerste tik = alleen deze laag */
        else{on[k]=!on[k];if(!on.rain&&!on.snow&&!on.blits){on.rain=on.snow=true;on.blits=!blitsGone}} /* niets over: weer alles */
        toggles();
      };
    });
    hb.onclick=function(){
      var open=body.hidden;body.hidden=!open;
      hb.textContent='Radar '+(open?'\u25B4':'\u25BE');hb.setAttribute('aria-expanded',open);
      if(open){
        if(!started){started=true;loadLeaflet()}
        else if(map)setTimeout(function(){map.invalidateSize()},50);
        toggles();
      }else{pause();wsStop()}
    };
    new IntersectionObserver(function(es){
      if(es[0].isIntersecting){if(!started&&!body.hidden){started=true;loadLeaflet()}}else pause();
    },{threshold:.1}).observe(box);
  }

  /* knopjes Regen / Sneeuw / Bliksem */
  function toggles(){
    if(!box)return;
    var m=box.querySelector('.pwr-map');
    ['rain','snow','blits'].forEach(function(k){
      m.classList.toggle('no-'+k,!on[k]);
      var b=box.querySelector('.pwr-pc[data-l="'+k+'"]');b.classList.toggle('on',on[k]);b.setAttribute('aria-pressed',on[k]);
    });
    if(!map)return;
    if(on.blits&&!$('pwr-body').hidden){map.addLayer(boltLayer);wsWant=true;if(!ws)wsStart(0);bolts(idx)}
    else{map.removeLayer(boltLayer);wsStop()}
  }

  /* ===== bliksem (Blitzortung) ===== */
  var ws=null,wsWant=false,wsRetry=null;
  function lzw(b){var a,e={},d=b.split(''),c=d[0],f=c,g=[c],h=256,o=h;for(var i=1;i<d.length;i++){a=d[i].charCodeAt(0);a=h>a?d[i]:e[a]?e[a]:f+c;g.push(a);c=a.charAt(0);e[o]=f+c;o++;f=a}return g.join('')}
  function wsStart(k){
    if(!wsWant)return;
    if(k>=WS.length){wsFail();return}
    var opened=false,s;
    try{s=new WebSocket(WS[k])}catch(e){wsStart(k+1);return}
    ws=s;
    s.onopen=function(){opened=true;try{s.send('{"a":111}')}catch(e){}};
    s.onmessage=function(e){
      try{var d=JSON.parse(lzw(e.data));if(typeof d.lat==='number'&&typeof d.lon==='number')strike(d.lat,d.lon)}catch(x){}
    };
    s.onerror=function(){};
    s.onclose=function(){
      if(ws!==s)return;ws=null;
      if(!wsWant)return;
      if(opened)wsRetry=setTimeout(function(){wsStart(k)},15000);else wsStart(k+1);
    };
  }
  function wsStop(){wsWant=false;clearTimeout(wsRetry);if(ws){var s=ws;ws=null;try{s.close()}catch(e){}}}
  function wsFail(){
    on.blits=false;blitsGone=true;wsWant=false;
    var b=box&&box.querySelector('.pwr-pc[data-l="blits"]');if(b)b.hidden=true;if(!on.rain&&!on.snow){on.rain=on.snow=true}
    toggles();
  }
  function strike(lat,lon){
    if(!pl||!map||Math.abs(lat-pl.lat)>10||Math.abs(lon-pl.lon)>16)return;
    var mkr=L.marker([lat,lon],{icon:L.divIcon({html:'\u26A1',className:'pwr-bolt',iconSize:[20,20]}),interactive:false,keyboard:false,opacity:0}).addTo(boltLayer);
    strikes.push({t:Date.now(),lat:lat,lon:lon,m:mkr});
    var lim=Date.now()-10800000;
    while(strikes.length>400||(strikes.length&&strikes[0].t<lim)){boltLayer.removeLayer(strikes.shift().m)}
    if(idx===frames.length-1)bolts(idx);
  }
  function zichtbaar(i){
    var last=i===frames.length-1,ft=last?Date.now():frames[i].time*1000,r=[];
    strikes.forEach(function(s){
      if(s.t>ft-BWIN&&s.t<=ft)r.push({s:s,op:Math.max(.35,1-(ft-s.t)/BWIN)});
    });
    return r;
  }
  function bolts(i){
    if(!frames.length||!boltLayer)return;
    var v=zichtbaar(i),ids={};
    v.forEach(function(x){x.s.m.setOpacity(x.op);ids[x.s.t+'_'+x.s.lat]=1});
    strikes.forEach(function(s){if(!ids[s.t+'_'+s.lat])s.m.setOpacity(0)});
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
    L.control.attribution({prefix:false}).addAttribution('\u00A9 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>').addTo(map);
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
      $('pwr-s').max=f.length-1;show(f.length-1);
    }).catch(function(){$('pwr-t').textContent='Radar niet beschikbaar'});
  }

  function tijd(i){return new Date(frames[i].time*1000).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}
  function show(i){
    idx=i;
    layers.forEach(function(l,j){l.setOpacity(j===i?.85:0)});
    $('pwr-s').value=i;
    var min=Math.round((Date.now()-frames[i].time*1000)/60000),hhmm=tijd(i);
    $('pwr-t').textContent=i===frames.length-1?hhmm+' \u00B7 nu':hhmm+' \u00B7 '+min+' min geleden';
    bolts(i);
  }
  function play(){
    if(!frames.length)return;
    $('pwr-p').textContent='\u275A\u275A';$('pwr-p').setAttribute('aria-label','Pauze');
    (function stap(){
      timer=setTimeout(function(){show(idx+1>=frames.length?0:idx+1);stap()},idx===frames.length-1?1500:450);
    })();
  }
  function pause(){
    clearTimeout(timer);timer=null;
    var p=$('pwr-p');if(p){p.textContent='\u25B6';p.setAttribute('aria-label','Afspelen')}
  }

  /* GIF-maker staat in radar-gif.js en wordt pas geladen als je op GIF drukt */
  window.pwRadar={s:function(){return{map:map,base:base,layers:layers,frames:frames,on:on,pl:pl,mapEl:mapEl,zichtbaar:zichtbaar,tijd:tijd,HEX:HEX,SNOWHEX:SNOWHEX,pause:pause,gb:$('pwr-g')}}};
  function gifKlik(){
    if(window.pwRadarGif)return window.pwRadarGif();
    var gb=$('pwr-g'),s=document.createElement('script');gb.textContent='\u2026';
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
