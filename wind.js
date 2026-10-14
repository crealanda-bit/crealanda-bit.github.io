function load(){
  if(!map||!(act||md))return;
  var b=map.getBounds().pad(PAD);
  var n=b.getNorth(),s=b.getSouth(),w=b.getWest(),e=b.getEast();
  var la=[],lo=[];
  var stappenX = GX;
  var stappenY = GY;
  if (e - w > 40) { stappenX = 4; }
  if (n - s > 25) { stappenY = 3; }

  for(var j=0;j<stappenY;j++)for(var i=0;i<stappenX;i++){
    la.push((n-(n-s)*j/(stappenY-1)).toFixed(2));
    lo.push((w+(e-w)*i/(stappenX-1)).toFixed(2));
  }
  var id=++busy;
  if (la.length > 50) { la = la.slice(0, 50); lo = lo.slice(0, 50); }

  fetch('https://api.open-meteo.com/v1/forecast?latitude='+la.join(',')+'&longitude='+lo.join(',')+
    '&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto')
  .then(function(r){return r.json()}).then(function(d){
    if(id!==busy)return;
    if(!Array.isArray(d))d=[d];
    if(d.length<stappenX*stappenY||!d[0].current)return;
    gd=d.map(function(x){return x.current});gb={n:n,s:s,w:w,e:e};
    build();apply();
  }).catch(function(){if(id===busy&&md==='wind')chips()});
}