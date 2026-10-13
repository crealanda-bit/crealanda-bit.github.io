/* Regenradar Crea Landa - radar: RainViewer.com, kaart: OpenStreetMap, kaartprogramma: Leaflet */
(function(){
  var wp=document.getElementById('pw');if(!wp||window.pwRadarLoaded)return;window.pwRadarLoaded=1;
  var API='https://api.rainviewer.com/public/weather-maps.json';
  var START_OPEN=true; /* true = radar staat open bij binnenkomst, false = ingeklapt */

  /* ===== Neerslagkleuren: van licht naar zwaar (pas gerust aan) ===== */
  var KLEUREN=[[143,216,245],[47,125,225],[46,175,98],[245,211,39],[242,140,30],[194,24,91]];
  /*            lichtblauw    blauw        groen       geel         oranje       framboos   */

  var pl=window.pwPlace||null,box,mapEl,map,mk,frames=[],layers=[],idx=0,timer=null,host='',lastKey=0,started=false;
  var st=document.createElement('style');
  st.textContent='#pw-radar{margin-top:6px}'+
  '.pwr-base{filter:grayscale(1) brightness(1.08) contrast(.85)}.pwr-map .leaflet-control-attribution{font-size:10px;line-height:1.3;padding:0 5px;background:#ffffffb0}'+
  '.pwr-map{position:relative;height:360px;border-radius:10px;overflow:hidden;background:#ffffff26}'+
  '#pwr-m{position:absolute;inset:0;font:12px Oswald,Arial,sans-serif}'+
  '.pwr-map.locked #pwr-m{pointer-events:none}'+
  '.pwr-lock{display:none;position:absolute;inset:0;z-index:1100;align-items:flex-end;justify-content:center;padding:12px 12px 56px;cursor:pointer}'+
  '.pwr-map.locked .pwr-lock{display:flex}'+
  '.pwr-lock span{background:#B32C43;color:#FCF5EE;padding:7px 14px;border-radius:8px;font-size:19px}'+
  '.pwr-leg{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:150px;z-index:1000;padding:6px 9px 4px;border-radius:8px;background:#FCF5EEE6;pointer-events:none;font:12px/1.2 Oswald,Arial,sans-serif;color:#6F4257}'+
  '.pwr-leg i{display:block;height:8px;border-radius:4px;background:linear-gradient(90deg,#8FD8F5,#2F7DE1,#2EAF62,#F5D327,#F28C1E,#C2185B)}'+
  '.pwr-leg div{display:flex;justify-content:space-between;margin-top:3px}'+
  '.pwr-bar{display:flex;align-items:center;gap:10px;margin-top:10px}'+
  '.pw .pwr-bar button{width:46px;height:42px;padding:0;font-size:20px}'+
  '.pwr-bar input{flex:1;min-width:0;accent-color:#B32C43}'+
  '#pwr-t{min-width:112px;text-align:right;font:16px Oswald,Arial,sans-serif}'+
  '@media(min-width:700px){.pwr-map{height:440px}}';
  document.head.appendChild(st);

  function $(i){return document.getElementById(i)}

  /* herkleurt de RainViewer-tegels naar onze eigen kleuren */
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
    if(s<.35||l>.85)return -1;               /* vage randjes: laten staan */
    if(h>=75&&h<170)return 2;                /* groen */
    if(h>=170&&h<=265)return l>.62?0:(l>.42?1:2); /* blauw: licht -> donker */
    if(h>=48&&h<75)return 3;                 /* geel */
    if(h>=18&&h<48)return 4;                 /* oranje */
    return 5;                                /* rood = zwaarst */
  }
  var Kleurlaag=null;
  function maakLaag(){
    Kleurlaag=L.TileLayer.extend({
      createTile:function(c,done){
        var t=document.createElement('canvas'),s=this.getTileSize(),img=new Image();
        t.width=s.x;t.height=s.y;img.crossOrigin='anonymous';
        img.onload=function(){
          var x=t.getContext('2d');x.drawImage(img,0,0);
          try{
            var d=x.getImageData(0,0,t.width,t.height),p=d.data;
            for(var i=0;i<p.length;i+=4){
              if(!p[i+3])continue;
              var n=niveau(p[i],p[i+1],p[i+2]);
              if(n>=0){p[i]=KLEUREN[n][0];p[i+1]=KLEUREN[n][1];p[i+2]=KLEUREN[n][2]}
            }
            x.putImageData(d,0,0);
          }catch(e){} /* lukt herkleuren niet, dan blijft het origineel staan */
          done(null,t);
        };
        img.onerror=function(){done(null,t)};
        img.src=this.getTileUrl(c);
        return t;
      }
    });
  }

  function build(){
    box=document.createElement('div');box.id='pw-radar';
    box.innerHTML='<p style="text-align:center;margin:20px 0 8px"><button id="pwr-h" type="button" aria-expanded="'+START_OPEN+'">Radar '+(START_OPEN?'\u25B4':'\u25BE')+'</button></p>'+
      '<div id="pwr-body"'+(START_OPEN?'':' hidden')+'>'+
      '<div class="pwr-map locked"><div id="pwr-m"></div><div class="pwr-lock"><span>Tik om de kaart te bedienen</span></div>'+
      '<div class="pwr-leg"><i></i><div><span>Licht</span><span>Zwaar</span><span>Extreem</span></div></div></div>'+
      '<div class="pwr-bar"><button id="pwr-p" type="button" aria-label="Afspelen">\u25B6</button>'+
      '<input id="pwr-s" type="range" min="0" max="0" value="0" aria-label="Tijd"><span id="pwr-t">Laden\u2026</span></div>'+
      '<p style="text-align:center;margin:10px 0 0"><button id="pwr-l" type="button" class="alt">Kaart bedienen</button></p></div>';
    var foot=wp.querySelector('.pw-foot');wp.insertBefore(box,foot);
    foot.insertAdjacentHTML('beforeend','<br>Radar van <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer.com</a>');
    mapEl=$('pwr-m');
    var m=box.querySelector('.pwr-map'),body=$('pwr-body'),hb=$('pwr-h');
    function lock(v){m.classList.toggle('locked',v);$('pwr-l').textContent=v?'Kaart bedienen':'Kaart vergrendelen'}
    box.querySelector('.pwr-lock').onclick=function(){lock(false)};
    $('pwr-l').onclick=function(){lock(!m.classList.contains('locked'))};
    $('pwr-p').onclick=function(){timer?pause():play()};
    $('pwr-s').oninput=function(){pause();show(+this.value)};
    /* in- en uitklappen */
    hb.onclick=function(){
      var open=body.hidden;body.hidden=!open;
      hb.textContent='Radar '+(open?'\u25B4':'\u25BE');hb.setAttribute('aria-expanded',open);
      if(open){
        if(!started){started=true;loadLeaflet()}
        else if(map)setTimeout(function(){map.invalidateSize()},50);
      }else pause();
    };
    /* kaart pas laden als je de radar echt ziet (bespaart data) */
    new IntersectionObserver(function(es){
      if(es[0].isIntersecting){if(!started&&!body.hidden){started=true;loadLeaflet()}}else pause();
    },{threshold:.1}).observe(box);
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
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,className:'pwr-base'}).addTo(map);
    L.control.attribution({prefix:false}).addAttribution('\u00A9 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>').addTo(map);
    mk=L.circleMarker([pl.lat,pl.lon],{radius:7,color:'#FCF5EE',weight:2,fillColor:'#B32C43',fillOpacity:1}).addTo(map);
    loadFrames();setInterval(loadFrames,300000);
    setTimeout(function(){map.invalidateSize()},300);
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

  function show(i){
    idx=i;
    layers.forEach(function(l,j){l.setOpacity(j===i?.85:0)});
    $('pwr-s').value=i;
    var t=new Date(frames[i].time*1000),min=Math.round((Date.now()-t)/60000);
    var hhmm=t.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
    $('pwr-t').textContent=i===frames.length-1?hhmm+' \u00B7 nu':hhmm+' \u00B7 '+min+' min geleden';
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

  function place(p){
    pl=p;
    if(!box)build();
    if(map){map.setView([pl.lat,pl.lon],map.getZoom());mk.setLatLng([pl.lat,pl.lon])}
  }
  document.addEventListener('pw-place',function(e){place(e.detail)});
  if(pl)place(pl);
})();
