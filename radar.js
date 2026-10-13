/* Regenradar Crea Landa - radar: RainViewer.com, kaart: OpenStreetMap, kaartprogramma: Leaflet */
(function(){
  var wp=document.getElementById('pw');if(!wp||window.pwRadarLoaded)return;window.pwRadarLoaded=1;
  var API='https://api.rainviewer.com/public/weather-maps.json';
  var pl=window.pwPlace||null,box,mapEl,map,mk,frames=[],layers=[],idx=0,timer=null,host='',lastKey=0,started=false;
  var st=document.createElement('style');
  st.textContent='#pw-radar{margin-top:6px}'+
  '.pwr-base{filter:grayscale(1) brightness(1.08) contrast(.85)}.pwr-map .leaflet-control-attribution{font-size:10px;line-height:1.3;padding:0 5px;background:#ffffffb0}'+
  '.pwr-map{position:relative;height:360px;border-radius:10px;overflow:hidden;background:#ffffff26}'+
  '#pwr-m{position:absolute;inset:0;font:12px Oswald,Arial,sans-serif}'+
  '.pwr-map.locked #pwr-m{pointer-events:none}'+
  '.pwr-lock{display:none;position:absolute;inset:0;z-index:1100;align-items:flex-end;justify-content:center;padding:12px;cursor:pointer}'+
  '.pwr-map.locked .pwr-lock{display:flex}'+
  '.pwr-lock span{background:#B32C43;color:#FCF5EE;padding:7px 14px;border-radius:8px;font-size:19px}'+
  '.pwr-bar{display:flex;align-items:center;gap:10px;margin-top:10px}'+
  '.pw .pwr-bar button{width:46px;height:42px;padding:0;font-size:20px}'+
  '.pwr-bar input{flex:1;min-width:0;accent-color:#B32C43}'+
  '#pwr-t{min-width:112px;text-align:right;font:16px Oswald,Arial,sans-serif}'+
  '@media(min-width:700px){.pwr-map{height:440px}}';
  document.head.appendChild(st);

  function $(i){return document.getElementById(i)}
  function build(){
    box=document.createElement('div');box.id='pw-radar';
    box.innerHTML='<h3>Radar</h3>'+
      '<div class="pwr-map locked"><div id="pwr-m"></div><div class="pwr-lock"><span>Tik om de kaart te bedienen</span></div></div>'+
      '<div class="pwr-bar"><button id="pwr-p" type="button" aria-label="Afspelen">\u25B6</button>'+
      '<input id="pwr-s" type="range" min="0" max="0" value="0" aria-label="Tijd"><span id="pwr-t">Laden\u2026</span></div>'+
      '<p style="text-align:center;margin:10px 0 0"><button id="pwr-l" type="button" class="alt">Kaart bedienen</button></p>';
    var foot=wp.querySelector('.pw-foot');wp.insertBefore(box,foot);
    foot.insertAdjacentHTML('beforeend','<br>Radar van <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer.com</a>');
    mapEl=$('pwr-m');
    var m=box.querySelector('.pwr-map');
    function lock(v){m.classList.toggle('locked',v);$('pwr-l').textContent=v?'Kaart bedienen':'Kaart vergrendelen'}
    box.querySelector('.pwr-lock').onclick=function(){lock(false)};
    $('pwr-l').onclick=function(){lock(!m.classList.contains('locked'))};
    $('pwr-p').onclick=function(){timer?pause():play()};
    $('pwr-s').oninput=function(){pause();show(+this.value)};
    /* kaart pas laden als je de radar echt ziet (bespaart data) */
    new IntersectionObserver(function(es){
      if(es[0].isIntersecting){if(!started){started=true;loadLeaflet()}}else pause();
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
        return L.tileLayer(host+fr.path+'/256/{z}/{x}/{y}/2/1_1.png',{opacity:0,maxNativeZoom:7,maxZoom:10,zIndex:10}).addTo(map);
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
