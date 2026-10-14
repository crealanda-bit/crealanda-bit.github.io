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
/* meetchips: windkracht en windstoten op een aantal grote plaatsen die in beeld zijn */
var STAD=[['Amsterdam',52.37,4.90],['Rotterdam',51.92,4.48],['Utrecht',52.09,5.12],['Den Haag',52.08,4.30],['Groningen',53.22,6.57],['Eindhoven',51.44,5.48],['Zwolle',52.51,6.09],['Maastricht',50.85,5.69],['Arnhem',51.98,5.91],['Leeuwarden',53.20,5.80],['Middelburg',51.50,3.61],['Den Helder',52.96,4.76],['Enschede',52.22,6.89],['Breda',51.59,4.78],['Antwerpen',51.22,4.40],['Brussel',50.85,4.35],['Gent',51.05,3.72],['Luik',50.63,5.57],['Keulen',50.94,6.96],['Düsseldorf',51.23,6.78],['Hamburg',53.55,9.99],['Bremen',53.08,8.80],['Hannover',52.37,9.74],['Londen',51.51,-.13],['Parijs',48.86,2.35],['Lille',50.63,3.06],['Dortmund',51.51,7.47],['Norwich',52.63,1.30],['Amersfoort',52.16,5.39],['Almere',52.35,5.26],['Apeldoorn',52.21,5.97],['Emmen',52.78,6.90],['Venlo',51.37,6.17],['Tilburg',51.56,5.09],['Haarlem',52.38,4.64],['Alkmaar',52.63,4.75],['Vlissingen',51.44,3.57]];
var BFT=[1,6,12,20,29,39,50,62,75,89,103,118],sc={},sbusy=false;
function bft(v){var k=0;while(k<12&&v>=BFT[k])k++;return k}
function kies(){
  W=map.getSize().x;H=map.getSize().y;
  var q=[];
  for(var k=0;k<STAD.length&&q.length<6;k++){
    var p=map.latLngToContainerPoint([STAD[k][1],STAD[k][2]]);
    if(p.x<60||p.x>W-60||p.y<40||p.y>H-70)continue;
    if(p.y<80&&p.x>W-150)continue;
    if(q.some(function(o){return Math.abs(o.x-p.x)<110&&Math.abs(o.y-p.y)<70}))continue;
    q.push({n:STAD[k][0],la:STAD[k][1],lo:STAD[k][2],x:p.x,y:p.y});
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
    fetch('https://api.open-meteo.com/v1/forecast?latitude='+need.map(function(o){return o.la}).join(',')+'&longitude='+need.map(function(o){return o.lo}).join(',')+'&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh&timezone=auto')
    .then(function(r){return r.json()}).then(function(d){
      sbusy=false;
      if(!Array.isArray(d))d=[d];
      need.forEach(function(o,i){
        var c=d[i]&&d[i].current;
        sc[o.n]=c?{t:Date.now(),s:c.wind_speed_10m,g:c.wind_gusts_10m,d:c.wind_direction_10m}:{t:Date.now()};
      });
      if(md==='wind')chips();
    }).catch(function(){sbusy=false});
  }
  q.forEach(function(o){
    var c=sc[o.n];if(!c||c.s==null)return;
    var e=document.createElement('div');e.style.left=o.x+'px';e.style.top=o.y+'px';
    e.className='c'+(c.g>=50?' r':'');
    e.innerHTML='<small>'+o.n+'</small><b><svg viewBox="0 0 24 24" style="transform:rotate('+Math.round(c.d+180)+'deg)"><path d="M12 2l7 19-7-4-7 4z" fill="#FCF5EE"/></svg><span>'+Math.round(c.s)+'</span><small>km/u</small></b><small>kracht '+bft(c.s)+' · stoten '+Math.round(c.g)+'</small>';
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
