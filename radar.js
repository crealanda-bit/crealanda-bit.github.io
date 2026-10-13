/* Regenradar Crea Landa - radar: RainViewer.com, kaart: OpenStreetMap, kaartprogramma: Leaflet, gif: gif.js */
(function(){
  var wp=document.getElementById('pw');if(!wp||window.pwRadarLoaded)return;window.pwRadarLoaded=1;
  var API='https://api.rainviewer.com/public/weather-maps.json';
  var START_OPEN=true; /* true = radar staat open bij binnenkomst, false = ingeklapt */

  /* ===== Neerslagkleuren in de kleuren van de pagina: licht -> zwaar ===== */
  var HEX=['#9EB3D8','#627EB5','#D9667A','#B32C43','#7E1D30','#3E1A2C'];
  /*       licht blauw  blauw     lichte rood  rood      donkerrood  donker pruim */
  var KLEUREN=HEX.map(function(h){return[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]});

  var pl=window.pwPlace||null,box,mapEl,map,mk,base,frames=[],layers=[],idx=0,timer=null,host='',lastKey=0,started=false,gifUrl='',gifBusy=false;
  var st=document.createElement('style');
  st.textContent='#pw-radar{margin-top:6px}'+
  '.pwr-base{filter:grayscale(1) brightness(1.08) contrast(.85)}.pwr-map .leaflet-control-attribution{font-size:10px;line-height:1.3;padding:0 5px;background:#ffffffb0}'+
  '.pwr-top{display:flex;justify-content:flex-end;margin-bottom:8px}'+
  '.pwr-map{position:relative;height:360px;border-radius:10px;overflow:hidden;background:#ffffff26}'+
  '#pwr-m{position:absolute;inset:0;font:12px Oswald,Arial,sans-serif}'+
  '.pwr-map.locked #pwr-m{pointer-events:none}'+
  '.pwr-lock{display:none;position:absolute;inset:0;z-index:1100;align-items:flex-end;justify-content:center;padding:12px 12px 56px;cursor:pointer}'+
  '.pwr-map.locked .pwr-lock{display:flex}'+
  '.pwr-lock span{background:#B32C43;color:#FCF5EE;padding:7px 14px;border-radius:8px;font-size:19px}'+
  '.pwr-leg{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:150px;z-index:1000;padding:6px 9px 4px;border-radius:8px;background:#6F4257;pointer-events:none;font:12px/1.2 Oswald,Arial,sans-serif;color:#FCF5EE}'+
  '.pwr-leg i{display:block;height:8px;border-radius:4px;box-shadow:0 0 0 1px #FCF5EE66;background:linear-gradient(90deg,'+HEX.join(',')+')}'+
  '.pwr-leg div{display:flex;justify-content:space-between;margin-top:3px}'+
  '.pwr-bar{display:flex;align-items:center;gap:10px;margin-top:10px}'+
  '.pw .pwr-bar button{width:46px;height:42px;padding:0;font-size:20px}'+
  '.pwr-bar input{flex:1;min-width:0;accent-color:#B32C43}'+
  '#pwr-t{min-width:112px;text-align:right;font:16px Oswald,Arial,sans-serif}'+
  '.pwr-gv{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;background:#000000b3;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}'+
  '.pwr-gv img{max-width:100%;max-height:68vh;border-radius:12px;box-shadow:0 10px 40px #0006}'+
  '.pwr-gv .rij{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}'+
  '.pwr-gv .gb{display:inline-block;border:0;border-radius:8px;padding:10px 18px;background:#B32C43;color:#FCF5EE;font:21px/1 "Bebas Neue",sans-serif;text-decoration:none;cursor:pointer}'+
  '@media(min-width:700px){.pwr-map{height:440px}}';
  document.head.appendChild(st);

  function $(i){return document.getElementById(i)}

  /* herkleurt de RainViewer-tegels naar de kleuren van de pagina */
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
    if(s<.35||l>.85)return -1;                    /* vage randjes: laten staan */
    if((h<75||h>330)&&l>.6)return 0;              /* bleek geel/oranje randje = lichtste regen */
    if(h>=75&&h<170)return 2;                     /* groen */
    if(h>=170&&h<=265)return l>.62?0:(l>.42?1:2); /* blauw: licht -> donker */
    if(h>=48&&h<75)return 3;                      /* geel */
    if(h>=18&&h<48)return 4;                      /* oranje */
    return 5;                                     /* rood = zwaarst */
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
          }catch(e){}
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
      '<div class="pwr-top"><button id="pwr-g" type="button" class="alt">GIF maken</button></div>'+
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
    $('pwr-g').onclick=maakGif;
    hb.onclick=function(){
      var open=body.hidden;body.hidden=!open;
      hb.textContent='Radar '+(open?'\u25B4':'\u25BE');hb.setAttribute('aria-expanded',open);
      if(open){
        if(!started){started=true;loadLeaflet()}
        else if(map)setTimeout(function(){map.invalidateSize()},50);
      }else pause();
    };
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
    base=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,className:'pwr-base',crossOrigin:true}).addTo(map);
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

  function tijd(i){return new Date(frames[i].time*1000).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}
  function show(i){
    idx=i;
    layers.forEach(function(l,j){l.setOpacity(j===i?.85:0)});
    $('pwr-s').value=i;
    var min=Math.round((Date.now()-frames[i].time*1000)/60000),hhmm=tijd(i);
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

  /* ===== GIF maken van de radarbeweging ===== */
  var workerUrl='';
  function laadGif(cb,err){
    if(window.GIF&&workerUrl)return cb();
    var base='https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/';
    fetch(base+'gif.worker.js').then(function(r){return r.text()}).then(function(t){
      workerUrl=URL.createObjectURL(new Blob([t],{type:'text/javascript'}));
      if(window.GIF)return cb();
      var s=document.createElement('script');s.src=base+'gif.js';s.onload=cb;s.onerror=err;document.head.appendChild(s);
    }).catch(err);
  }
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function maakGif(){
    if(gifBusy||!layers.length||!map)return;
    pause();gifBusy=true;
    var gb=$('pwr-g');gb.disabled=true;gb.textContent='Even geduld\u2026';
    function klaar(){gifBusy=false;gb.disabled=false;gb.textContent='GIF maken'}
    function fout(){klaar();gb.textContent='GIF maken lukt niet';setTimeout(function(){gb.textContent='GIF maken'},3000)}
    laadGif(function(){
      try{
        var mr=mapEl.getBoundingClientRect(),W=mr.width,H=mr.height,sc=Math.min(1,520/W),w=Math.round(W*sc),h=Math.round(H*sc);
        function cv(){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
        function teken(ctx,list){[].forEach.call(list,function(e){var r=e.getBoundingClientRect();ctx.drawImage(e,(r.left-mr.left)*sc,(r.top-mr.top)*sc,r.width*sc,r.height*sc)})}
        /* ondergrond: kaart in grijstinten, zoals op de pagina */
        var bc=cv(),bx=bc.getContext('2d');bx.fillStyle='#d8d8d8';bx.fillRect(0,0,w,h);
        teken(bx,base.getContainer().querySelectorAll('img.leaflet-tile'));
        var bd=bx.getImageData(0,0,w,h),p=bd.data;
        for(var i=0;i<p.length;i+=4){
          var g=(p[i]*.299+p[i+1]*.587+p[i+2]*.114)*1.08;g=(g-127.5)*.85+127.5;
          p[i]=p[i+1]=p[i+2]=g<0?0:g>255?255:g;
        }
        bx.putImageData(bd,0,0);
        var mp=map.latLngToContainerPoint([pl.lat,pl.lon]);
        var gif=new GIF({workers:2,quality:10,width:w,height:h,workerScript:workerUrl});
        frames.forEach(function(fr,n){
          var c=cv(),x=c.getContext('2d');
          x.drawImage(bc,0,0);
          x.globalAlpha=.85;teken(x,layers[n].getContainer().querySelectorAll('canvas'));x.globalAlpha=1;
          /* plaatsmarkering */
          x.beginPath();x.arc(mp.x*sc,mp.y*sc,7*sc,0,7);x.fillStyle='#B32C43';x.fill();
          x.lineWidth=2*sc;x.strokeStyle='#FCF5EE';x.stroke();
          /* legenda */
          var lw=150*sc,lh=35*sc,lx=(w-lw)/2,ly=h-8*sc-lh,pd=9*sc;
          rr(x,lx,ly,lw,lh,8*sc);x.fillStyle='#6F4257';x.fill();
          var gr=x.createLinearGradient(lx+pd,0,lx+lw-pd,0);
          HEX.forEach(function(k,j){gr.addColorStop(j/(HEX.length-1),k)});
          rr(x,lx+pd,ly+6*sc,lw-2*pd,8*sc,4*sc);x.fillStyle=gr;x.fill();
          x.fillStyle='#FCF5EE';x.font=(12*sc)+'px Oswald,Arial,sans-serif';x.textBaseline='alphabetic';
          x.textAlign='left';x.fillText('Licht',lx+pd,ly+lh-7*sc);
          x.textAlign='center';x.fillText('Zwaar',w/2,ly+lh-7*sc);
          x.textAlign='right';x.fillText('Extreem',lx+lw-pd,ly+lh-7*sc);
          /* tijd en bronvermelding */
          var tt=tijd(n);x.font=(20*sc)+'px "Bebas Neue",Oswald,Arial,sans-serif';
          var tw=x.measureText(tt).width+16*sc;
          rr(x,w-tw-8*sc,8*sc,tw,28*sc,8*sc);x.fillStyle='#6F4257';x.fill();
          x.fillStyle='#FCF5EE';x.textAlign='right';x.fillText(tt,w-16*sc,29*sc);
          x.font=(10*sc)+'px Arial,sans-serif';var at='\u00A9 OpenStreetMap \u00B7 RainViewer',aw=x.measureText(at).width+10*sc;
          x.fillStyle='#ffffffb0';x.fillRect(w-aw,h-14*sc,aw,14*sc);
          x.fillStyle='#333';x.textAlign='right';x.fillText(at,w-5*sc,h-4*sc);
          gif.addFrame(c,{delay:n===frames.length-1?1500:450,copy:true});
        });
        gif.on('progress',function(v){gb.textContent='GIF '+Math.round(v*100)+'%'});
        gif.on('finished',function(blob){klaar();toonGif(blob)});
        gif.render();
      }catch(e){fout()}
    },fout);
  }
  function toonGif(blob){
    if(gifUrl)URL.revokeObjectURL(gifUrl);
    gifUrl=URL.createObjectURL(blob);
    var ov=document.createElement('div');ov.className='pwr-gv';
    var im=new Image();im.src=gifUrl;im.alt='Regenradar';
    var rij=document.createElement('div');rij.className='rij';
    var a=document.createElement('a');a.className='gb';a.href=gifUrl;a.download='regenradar-crea-landa.gif';a.textContent='Opslaan';
    rij.appendChild(a);
    var file=null;try{file=new File([blob],'regenradar-crea-landa.gif',{type:'image/gif'})}catch(e){}
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
      var d=document.createElement('button');d.type='button';d.className='gb';d.textContent='Delen';
      d.onclick=function(){navigator.share({files:[file],title:'Regenradar Crea Landa'}).catch(function(){})};
      rij.appendChild(d);
    }
    var x=document.createElement('button');x.type='button';x.className='gb';x.textContent='Sluiten';
    x.onclick=function(){ov.remove()};ov.onclick=function(e){if(e.target===ov)ov.remove()};
    rij.appendChild(x);ov.appendChild(im);ov.appendChild(rij);document.body.appendChild(ov);
  }

  function place(p){
    pl=p;
    if(!box)build();
    if(map){map.setView([pl.lat,pl.lon],map.getZoom());mk.setLatLng([pl.lat,pl.lon])}
  }
  document.addEventListener('pw-place',function(e){place(e.detail)});
  if(pl)place(pl);
})();
