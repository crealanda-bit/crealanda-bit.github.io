/* Wind Crea Landa - windeeltjes + metingen (wordt door radar.js geladen) - data: Open-Meteo.com */
(function(){
/* kleuren per windsnelheid (zacht -> hard) en grenzen in km/u */
var KL=['#5C77AD','#6F4257','#B32C43','#3E1A2C'],GR=[12,25,40];
var GX=8,GY=6;        /* meetpunten over de kaart (8 x 6 = 48) */
var CEL=8;            /* grootte van een veldcel in pixels */
var SNEL=.05;         /* snelheid van de deeltjes */
var PAD=.08,LEEF=60,LIJN=1.6;
var map,cv,ctx,mv,W=0,H=0,dpr=1,gd=null,gb=null,fu,fv,cw=0,ch=0,P=[],raf=0,act=false,md='',tm=0,lastT=0,busy=0,paused=false,iv=0;
function div(c){var e=document.createElement('div');e.className=c;return e}
function size(){
  W=map.getSize().x;H=map.getSize().y;dpr=1; /* deeltjes hoeven niet scherp: scheelt veel rekenwerk */
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
}
function stop(){cancelAnimationFrame(raf);raf=0}
function hide(){busy++;stop();if(ctx)ctx.clearRect(0,0,W,H);if(mv)mv.style.visibility='hidden'}
function init(m){
  if(map)return;
  map=m;var c=map.getContainer();
  cv=document.createElement('canvas');cv.className='pwr-wc';c.appendChild(cv);ctx=cv.getContext('2d');
  mv=div('pwr-wm');c.appendChild(mv);
  size();
  map.on('movestart zoomstart',hide);
  map.on('moveend',function(){clearTimeout(tm);tm=setTimeout(load,450)});
  clearInterval(iv);iv=setInterval(function(){if(act||md)load()},600000);
}
function load(){
  if(!map||!(act||md))return;
  var b=map.getBounds().pad(PAD),n=b.getNorth(),s=b.getSouth(),w=b.getWest(),e=b.getEast(),la=[],lo=[];
  for(var j=0;j<GY;j++)for(var i=0;i<GX;i++){
    la.push((n-(n-s)*j/(GY-1)).toFixed(2));lo.push((w+(e-w)*i/(GX-1)).toFixed(2));
  }
  var id=++busy;
  fetch('https://api.open-meteo.com/v1/forecast?latitude='+la.join(',')+'&longitude='+lo.join(',')+
    '&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto')
  .then(function(r){return r.json()}).then(function(d){
    if(id!==busy)return;
    if(!Array.isArray(d))d=[d];
    if(d.length<GX*GY||!d[0].current)return;
    gd=d.map(function(x){return x.current});gb={n:n,s:s,w:w,e:e};
    build();apply();
  }).catch(function(){if(id===busy&&md==='wind')chips()});
}
/* vectorveld op schermcellen (bilineair tussen de meetpunten) */
function build(){
  size();cw=Math.ceil(W/CEL);ch=Math.ceil(H/CEL);
  fu=new Float32Array(cw*ch);fv=new Float32Array(cw*ch);
  for(var y=0;y<ch;y++)for(var x=0;x<cw;x++){
    var ll=map.containerPointToLatLng([x*CEL+CEL/2,y*CEL+CEL/2]);
    var fi=(ll.lng-gb.w)/(gb.e-gb.w)*(GX-1),fj=(gb.n-ll.lat)/(gb.n-gb.s)*(GY-1);
    fi=Math.max(0,Math.min(GX-1.001,fi));fj=Math.max(0,Math.min(GY-1.001,fj));
    var i=fi|0,j=fj|0,a=fi-i,q=fj-j,u=0,v=0;
    [[i,j,(1-a)*(1-q)],[i+1,j,a*(1-q)],[i,j+1,(1-a)*q],[i+1,j+1,a*q]].forEach(function(t){
      var c=gd[t[1]*GX+t[0]],r=c.wind_direction_10m*Math.PI/180,s=c.wind_speed_10m;
      u+=-s*Math.sin(r)*t[2];v+=-s*Math.cos(r)*t[2];
    });
    fu[y*cw+x]=u*SNEL;fv[y*cw+x]=-v*SNEL;
  }
}
function spawn(p){p.x=Math.random()*W;p.y=Math.random()*H;p.a=Math.random()*LEEF|0}
function loop(t){
  raf=requestAnimationFrame(loop);
  if(t-lastT<30)return;lastT=t;
  ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';ctx.lineWidth=LIJN;ctx.lineCap='round';
  var paths=KL.map(function(){return new Path2D()});
  for(var k=0;k<P.length;k++){
    var p=P[k],ix=p.x/CEL|0,iy=p.y/CEL|0;
    if(p.a--<0||ix<0||iy<0||ix>=cw||iy>=ch){spawn(p);p.a+=LEEF/2;continue}
    var u=fu[iy*cw+ix],v=fv[iy*cw+ix],sp=Math.sqrt(u*u+v*v)/SNEL,c=sp<GR[0]?0:sp<GR[1]?1:sp<GR[2]?2:3;
    var nx=p.x+u,ny=p.y+v;
    paths[c].moveTo(p.x,p.y);paths[c].lineTo(nx,ny);p.x=nx;p.y=ny;
  }
  paths.forEach(function(pt,c){ctx.strokeStyle=KL[c];ctx.stroke(pt)});
}
function start(){
  if(raf||paused||!act||!gd||!fu)return;
  var n=Math.min(800,Math.round(W*H/420));P=[];
  for(var i=0;i<n;i++){var p={};spawn(p);P.push(p)}
  ctx.clearRect(0,0,W,H);raf=requestAnimationFrame(loop);
}

/* ===== Windmetingen: kleine rode knopjes per plaats =====
   Elke regel is [naam, breedtegraad, lengtegraad]. Staat hoger in de lijst = wordt eerder getoond.
   Espel staat bovenaan, dus die staat altijd op de kaart zodra hij in beeld is.
   Daarna eerst de grote steden van veel landen, daarna kleinere plaatsen. */
var STAD=[
['Espel',52.71,5.86],
['Amsterdam',52.37,4.90],['Brussel',50.85,4.35],['Londen',51.51,-.13],['Parijs',48.86,2.35],['Berlijn',52.52,13.40],
['Kopenhagen',55.68,12.57],['Oslo',59.91,10.75],['Stockholm',59.33,18.07],['Wenen',48.21,16.37],['Praag',50.08,14.44],
['Warschau',52.23,21.01],['Bern',46.95,7.45],['Rome',41.90,12.50],['Madrid',40.42,-3.70],['Luxemburg',49.61,6.13],
['Dublin',53.35,-6.26],['Lissabon',38.72,-9.14],['Helsinki',60.17,24.94],['Boedapest',47.50,19.04],
/* Nederland */
['Rotterdam',51.92,4.48],['Utrecht',52.09,5.12],['Den Haag',52.08,4.30],['Groningen',53.22,6.57],['Eindhoven',51.44,5.48],
['Zwolle',52.51,6.09],['Maastricht',50.85,5.69],['Arnhem',51.98,5.91],['Leeuwarden',53.20,5.80],['Middelburg',51.50,3.61],
['Den Helder',52.96,4.76],['Enschede',52.22,6.89],['Breda',51.59,4.78],['Amersfoort',52.16,5.39],['Almere',52.35,5.26],
['Apeldoorn',52.21,5.97],['Emmen',52.78,6.90],['Venlo',51.37,6.17],['Tilburg',51.56,5.09],['Haarlem',52.38,4.64],
['Alkmaar',52.63,4.75],['Vlissingen',51.44,3.57],['Lelystad',52.52,5.47],['Urk',52.66,5.60],['Kampen',52.56,5.91],
['Steenwijk',52.79,6.12],['Meppel',52.70,6.19],['Hoorn',52.64,5.06],['Enkhuizen',52.70,5.29],['Harderwijk',52.34,5.62],
['Deventer',52.26,6.16],['Heerenveen',52.96,5.92],['Drachten',53.11,6.10],['Assen',53.00,6.56],['Hoogeveen',52.72,6.48],
['Sneek',53.03,5.66],['Harlingen',53.17,5.42],['Texel',53.05,4.80],['Hardenberg',52.58,6.62],['Dronten',52.52,5.72],
['Emmeloord',52.71,5.75],
/* Belgie en Luxemburg */
['Antwerpen',51.22,4.40],['Gent',51.05,3.72],['Luik',50.63,5.57],['Brugge',51.21,3.22],['Oostende',51.23,2.92],
['Namen',50.47,4.87],['Charleroi',50.41,4.44],['Hasselt',50.93,5.34],
/* Duitsland */
['Keulen',50.94,6.96],['Düsseldorf',51.23,6.78],['Hamburg',53.55,9.99],['Bremen',53.08,8.80],['Hannover',52.37,9.74],
['Dortmund',51.51,7.47],['Frankfurt',50.11,8.68],['München',48.14,11.58],['Stuttgart',48.78,9.18],['Münster',51.96,7.63],
['Osnabrück',52.28,8.05],['Emden',53.37,7.21],['Kiel',54.32,10.14],['Leipzig',51.34,12.37],['Dresden',51.05,13.74],
['Neurenberg',49.45,11.08],['Kassel',51.31,9.48],['Bielefeld',52.02,8.53],['Rostock',54.09,12.14],['Trier',49.76,6.64],
['Aken',50.78,6.08],['Saarbrücken',49.24,6.99],
/* Verenigd Koninkrijk en Ierland */
['Norwich',52.63,1.30],['Manchester',53.48,-2.24],['Birmingham',52.49,-1.89],['Edinburgh',55.95,-3.19],['Glasgow',55.86,-4.25],
['Newcastle',54.98,-1.62],['Bristol',51.45,-2.59],['Cardiff',51.48,-3.18],['Leeds',53.80,-1.55],['Hull',53.74,-.33],
['Dover',51.13,1.31],['Aberdeen',57.15,-2.09],['Belfast',54.60,-5.93],['Plymouth',50.37,-4.14],['Liverpool',53.41,-2.99],
['Cork',51.90,-8.47],
/* Frankrijk */
['Lille',50.63,3.06],['Calais',50.95,1.86],['Rouen',49.44,1.10],['Straatsburg',48.57,7.75],['Lyon',45.76,4.84],
['Marseille',43.30,5.37],['Bordeaux',44.84,-.58],['Nantes',47.22,-1.55],['Rennes',48.11,-1.68],['Toulouse',43.60,1.44],
['Nice',43.70,7.26],['Brest',48.39,-4.49],['Reims',49.26,4.03],['Dijon',47.32,5.04],
/* Scandinavie en Baltische staten */
['Aarhus',56.16,10.20],['Aalborg',57.05,9.92],['Esbjerg',55.48,8.45],['Odense',55.40,10.39],['Bergen',60.39,5.32],
['Stavanger',58.97,5.73],['Trondheim',63.43,10.40],['Göteborg',57.71,11.97],['Malmö',55.60,13.00],['Tallinn',59.44,24.75],
['Riga',56.95,24.11],['Vilnius',54.69,25.28],['Reykjavik',64.15,-21.94],
/* Oost- en Midden-Europa */
['Krakau',50.06,19.94],['Gdansk',54.35,18.65],['Wroclaw',51.11,17.04],['Poznan',52.41,16.93],['Brno',49.20,16.61],
['Salzburg',47.81,13.04],['Innsbruck',47.27,11.39],['Bratislava',48.15,17.11],['Zagreb',45.81,15.98],['Boekarest',44.43,26.10],
/* Zwitserland, Italie, Spanje, Portugal */
['Zürich',47.38,8.54],['Genève',46.20,6.14],['Bazel',47.56,7.59],['Milaan',45.46,9.19],['Turijn',45.07,7.69],
['Venetië',45.44,12.32],['Napels',40.85,14.27],['Florence',43.77,11.26],['Genua',44.41,8.93],['Bologna',44.49,11.34],
['Barcelona',41.39,2.17],['Valencia',39.47,-.38],['Sevilla',37.39,-5.98],['Bilbao',43.26,-2.93],['Porto',41.15,-8.61]
];
var BFT=[1,6,12,20,29,39,50,62,75,89,103,118],sc={},sbusy=false;
function bft(v){var k=0;while(k<12&&v>=BFT[k])k++;return k}
function kies(){
  W=map.getSize().x;H=map.getSize().y;
  var q=[],mx=Math.max(6,Math.min(16,Math.round(W*H/11000))); /* maximaal aantal knopjes tegelijk */
  for(var k=0;k<STAD.length&&q.length<mx;k++){
    var s=STAD[k],p=map.latLngToContainerPoint([s[1],s[2]]);
    if(p.x<55||p.x>W-55||p.y<48||p.y>H-85)continue; /* niet tegen de rand of onder de legenda */
    if(p.x<100&&p.y<125)continue;                    /* niet onder de zoomknoppen */
    if(p.x>W-200&&p.y<130)continue;                  /* niet onder bliksem- en windknop */
    if(q.some(function(o){return Math.abs(o.x-p.x)<100&&Math.abs(o.y-p.y)<48}))continue;
    q.push({n:s[0],la:s[1],lo:s[2],x:p.x,y:p.y});
  }
  return q;
}
function vers(c){return c&&Date.now()-c.t<600000}
function chips(){
  mv.innerHTML='';mv.style.visibility='visible';
  if(md!=='wind'||!map)return;
  var q=kies(),need=q.filter(function(o){return !vers(sc[o.n])});
  if(need.length&&!sbusy){
    sbusy=true;
    fetch('https://api.open-meteo.com/v1/forecast?latitude='+need.map(function(o){return o.la}).join(',')+'&longitude='+need.map(function(o){return o.lo}).join(',')+'&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto')
    .then(function(r){return r.json()}).then(function(d){
      sbusy=false;
      if(!Array.isArray(d))d=[d];
      need.forEach(function(o,i){
        var c=d[i]&&d[i].current;
        sc[o.n]=c?{t:Date.now(),s:c.wind_speed_10m,d:c.wind_direction_10m}:{t:Date.now()};
      });
      if(md==='wind')chips();
    }).catch(function(){sbusy=false;setTimeout(function(){if(md==='wind')chips()},20000)});
  }
  q.forEach(function(o){
    var c=sc[o.n];if(!c||c.s==null)return;
    var e=document.createElement('div');e.style.left=o.x+'px';e.style.top=o.y+'px';
    e.innerHTML='<span class="pn">'+o.n+'</span><span class="pk"><svg viewBox="0 0 24 24" style="transform:rotate('+Math.round(c.d+180)+'deg)"><path d="M12 2l7 19-7-4-7 4z" fill="#FCF5EE"/></svg><span>'+Math.round(c.s)+' km/u · kracht '+bft(c.s)+'</span></span>';
    mv.appendChild(e);
  });
}
function apply(){
  if(!map)return;
  cv.style.display=act?'block':'none';
  if(!(act||md)){stop();ctx.clearRect(0,0,W,H);mv.innerHTML='';return}
  if(!gd){load();return}
  chips();
  if(act)start();else{stop();ctx.clearRect(0,0,W,H)}
}
window.pwWind={
  init:init,
  set:function(a,m){act=!!a;md=m||'';apply()},
  pause:function(){paused=true;stop()},
  resume:function(){paused=false;if(act)start()}
};
})();
