/* Regenradar Crea Landa - Hoofdscript */
(function(){
  var host=document.getElementById('pw-host');if(!host)return;
  var wrap=document.createElement('div');wrap.className='pw';
  wrap.innerHTML='<div class="pwr-top pwr-ch"><button type="button" class="pwr-pc" data-l="rain">Regen</button><button type="button" class="pwr-pc" data-l="snow">Sneeuw</button><button type="button" class="pwr-pc" data-l="blits">Bliksem</button><button type="button" class="pwr-pc" data-l="wolken">Wolken</button><button type="button" class="pwr-pc" data-l="wind">Wind</button></div><div class="pwr-map" id="pwr-map"><div id="pwr-m"></div><div class="pwr-rt"><div class="pwr-bl dicht" id="pwr-bl"><div class="pwr-bt" id="pwr-bt">\u26a1 GEEN BLIKSEM \u25be</div><div class="pwr-dicht" id="pwr-dl"></div></div><button type="button" class="pwr-wb off" id="pwr-wb">Windstroomlijnen</button></div><div class="pwr-lock"><span>Kaart vergrendeld</span></div><div class="pwr-leg" id="pwr-leg"><div class="pwr-lr"><div class="pwr-lt">Regen</div><i style="background:linear-gradient(90deg,#00f,#0ff,#f0f,#ff0,#f00)"></i><div class="pwr-lb"><span>Licht</span><span>Zwaar</span><span>Extreem</span></div></div><div class="pwr-ls"><div class="pwr-lt">Sneeuw</div><i style="background:linear-gradient(90deg,#88f,#fff)"></i><div class="pwr-lb"><span style="width:100%;text-align:center">Sneeuw</span></div></div><div class="pwr-lw"><div class="pwr-lt">Wolken</div><i style="background:linear-gradient(90deg,#222,#aaa,#fff)"></i><div class="pwr-lb"><span>Laag</span><span>Hoog</span></div></div><div class="pwr-lwd"><div class="pwr-lt">Wind</div><i style="background:linear-gradient(90deg,#5C77AD,#6F4257,#B32C43,#3E1A2C)"></i><div class="pwr-lb"><span>Zacht</span><span>Hard</span></div></div></div></div><div class="pwr-bar"><button type="button" id="pwr-pl">\u25b6</button><input id="pwr-rng" type="range" min="0" max="0" value="0"><span id="pwr-t">--:--</span></div><div class="pwr-acts"><button type="button" id="pwr-f">Foto</button><button type="button" id="pwr-g">GIF</button><button type="button" id="pwr-lk">Kaart vergrendelen</button></div>';
  host.appendChild(wrap);

  if(!window.L){
    var ls=document.createElement('script');ls.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';document.head.appendChild(ls);
    var lc=document.createElement('link');lc.rel='stylesheet';lc.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(lc);
  }
  var cs=document.createElement('link');cs.rel='stylesheet';cs.href='radar.css';document.head.appendChild(cs);

  var map,base,layers=[],wolken=[],frames=[],times=[],stels=[];
  var pl={lat:52.71,lon:5.86}; // Espel als standaard coördinaat
  var on={rain:true,snow:false,blits:true,wolken:false,wind:false};
  var idx=0,timer=null,playing=false,satCors=false,satOp=.45;
  var BCOL=['#B32C43','#FF8C00','#FFD700'],BLAB=['Ontladingen','Wolk-grond','Grond-wolk'];
  var bon=[true,true,true],blitsen=[];
  var HEX=['#0000ff00','#00aaff88','#00ff00aa','#ffff00cc','#ff7f00ee','#ff0000ff','#8b0000ff'];
  var SNOWHEX=['#8888ff88','#ffffffcc'];

  function init(){
    if(!window.L||!document.getElementById('pwr-m')){setTimeout(init,100);return;}
    
    // Kaart instellen op de Benelux, met grenzen in #FCF5EE en zonder plaatsnamen
    map=L.map('pwr-m',{zoomControl:true,attributionControl:true,boxZoom:false,doubleClickZoom:false});
    
    // Beperk kaart tot de Benelux
    var beneluxBounds = L.latLngBounds([49.3, 2.3], [53.7, 7.3]);
    map.setMaxBounds(beneluxBounds);
    map.setView([50.85, 4.35], 7);
    map.setMinZoom(7);
    map.setMaxZoom(10);

    // Schone achtergrond zonder plaatsnamen (CartoDB Voyager No Labels)
    base=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',{maxZoom:19,opacity:1}).addTo(map);

    // Land- en provinciegrenzen in kleur #FCF5EE
    fetch('https://raw.githubusercontent.com/grevory/boundary-lines/master/countries/NLD/nld.geojson')
      .then(function(r){return r.json();}).then(function(data){
        L.geoJSON(data,{
          style: function(feature){
            return { color: '#FCF5EE', weight: 1.5, fillOpacity: 0 };
          }
        }).addTo(map);
      }).catch(function(){});

    // Laad optionele modules zoals wind en gif-maker
    ['wind.js','Radar-gif.js'].forEach(function(f){
      var s=document.createElement('script');s.src=f;document.body.appendChild(s);
    });

    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(function(r){return r.json();}).then(function(d){
        if(!d.radar||!d.radar.past)return;
        stels=d.radar.past.concat(d.radar.nowcast||[]);
        frames=stels.map(function(f){
          var l=window.L.tileLayer('https://tilecache.rainviewer.com'+f.path+'/256/{z}/{x}/{y}/2/1_1.png',{opacity:0,zIndex:200});
          l.addTo(map);return l;
        });
        times=stels.map(function(f){return f.time;});
        var rng=document.getElementById('pwr-rng');
        rng.max=frames.length-1;rng.value=frames.length-1;idx=frames.length-1;
        update();loadBlits();
      }).catch(function(){});
  }

  function tijd(n){
    if(!times[n])return'--:--';
    var d=new Date(times[n]*1000);
    return('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
  }

  function update(){
    layers.forEach(function(l,i){l.setOpacity(i===idx?0.85:0);});
    var rng=document.getElementById('pwr-rng');if(rng)rng.value=idx;
    var t=document.getElementById('pwr-t');if(t)t.textContent=tijd(idx);
  }

  function loadBlits(){
    fetch('https://www.blitzortung.org/api/historic_data.php?time='+(Date.now()/1000|0))
      .then(function(r){return r.json();}).then(function(d){blitsen=d||[];}).catch(function(){});
  }

  window.pwRadar={
    s:function(){return{map:map,base:base,layers:layers,wolken:wolken,frames:frames,on:on,pl:pl,mapEl:document.getElementById('pwr-map'),zichtbaar:function(){return [];},tijd:tijd,HEX:HEX,SNOWHEX:SNOWHEX,BCOL:BCOL,BLAB:BLAB,bon:bon,pause:function(){playing=false;clearInterval(timer);}}
  };

  init();
})();
