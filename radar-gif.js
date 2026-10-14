/* Regenradar Crea Landa - GIF-maker (wordt door radar.js geladen) */
(function(){
  var gifUrl='',gifBusy=false;
  var st=document.createElement('style');st.textContent='.pwr-gv{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;background:#000000b3;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}.pwr-gv img{max-width:100%;max-height:68vh;border-radius:12px;box-shadow:0 10px 40px #0006}.pwr-gv .pwr-rij{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.pwr-gv .pwr-gb{display:inline-block;border:0;border-radius:999px;padding:10px 20px;background:#B32C43;color:#FCF5EE;font:21px/1 "Bebas Neue",sans-serif;text-decoration:none;cursor:pointer}';document.head.appendChild(st);
  var BP=window.Path2D?new Path2D('M13 2 4 14h6l-1 8 9-12h-6z'):null;
  var workerUrl='';
  function laadGif(cb,err){
    if(window.GIF&&workerUrl)return cb();
    var u='https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/';
    fetch(u+'gif.worker.js').then(function(r){return r.text()}).then(function(t){
      workerUrl=URL.createObjectURL(new Blob([t],{type:'text/javascript'}));
      if(window.GIF)return cb();
      var s=document.createElement('script');s.src=u+'gif.js';s.onload=cb;s.onerror=err;document.head.appendChild(s);
    }).catch(err);
  }
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function bolt(c,px,py,sz,col){
    if(!BP)return;
    c.save();c.translate(px,py);c.scale(sz/24,sz/24);
    c.fillStyle=col;c.strokeStyle='#6F4257';c.lineWidth=1.3;c.lineJoin='round';c.fill(BP);c.stroke(BP);c.restore();
  }
  function maakGif(){
    var S=window.pwRadar.s(),map=S.map,base=S.base,layers=S.layers,wolken=S.wolken,frames=S.frames,on=S.on,pl=S.pl,mapEl=S.mapEl,zichtbaar=S.zichtbaar,tijd=S.tijd,HEX=S.HEX,SNOWHEX=S.SNOWHEX,BCOL=S.BCOL,BLAB=S.BLAB,bon=S.bon,pause=S.pause;
    if(gifBusy||!layers.length||!map)return;
    pause();gifBusy=true;
    var gb=S.gb;gb.disabled=true;gb.textContent='Even\u2026';
    function klaar(){gifBusy=false;gb.disabled=false;gb.textContent='GIF'}
    function fout(){klaar();gb.textContent='Mislukt';setTimeout(function(){gb.textContent='GIF'},3000)}
    laadGif(function(){
      try{
        var mr=mapEl.getBoundingClientRect(),W=mr.width,H=mr.height,sc=Math.min(2,720/W),w=Math.round(W*sc),h=Math.round(H*sc);
        function cv(){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
        function teken(ctx,list){[].forEach.call(list,function(e){
          if(e.tagName==='IMG'&&!(e.complete&&e.naturalWidth))return;
          var r=e.getBoundingClientRect();if(r.width)ctx.drawImage(e,(r.left-mr.left)*sc,(r.top-mr.top)*sc,r.width*sc,r.height*sc)})}
        var bc=cv(),bx=bc.getContext('2d');bx.imageSmoothingQuality='high';bx.fillStyle='#d8d8d8';bx.fillRect(0,0,w,h);
        teken(bx,base.getContainer().querySelectorAll('img.leaflet-tile'));
        var bd=bx.getImageData(0,0,w,h),p=bd.data,K=window.pwKaart;
        /* zelfde blauwe kaartkleuren als op de pagina (KAART_DONKER / KAART_LICHT in radar.js) */
        for(var i=0;i<p.length;i+=4){
          var g=(p[i]*.299+p[i+1]*.587+p[i+2]*.114)/255;
          p[i]=K.d[0]+(K.l[0]-K.d[0])*g;p[i+1]=K.d[1]+(K.l[1]-K.d[1])*g;p[i+2]=K.d[2]+(K.l[2]-K.d[2])*g;
        }
        bx.putImageData(bd,0,0);
        var mp=map.latLngToContainerPoint([pl.lat,pl.lon]);
        var gif=new GIF({workers:2,quality:2,width:w,height:h,workerScript:workerUrl});
        var pd=9*sc,mx=document.createElement('canvas').getContext('2d');
        mx.font=(12*sc)+'px Oswald,Arial,sans-serif';
        var lh=35.4*sc,rainW=132*sc,snowW=56*sc,lgap=12*sc;
        var lw=(on.rain?rainW:0)+(on.snow?snowW:0)+(on.rain&&on.snow?lgap:0)+2*pd,lx=(w-lw)/2,ly=h-24*sc-lh;
        var rh=15*sc,blw=2*pd+16*sc,blh=BLAB.length*rh+8*sc,bx0,by0=40*sc;
        BLAB.forEach(function(t){blw=Math.max(blw,2*pd+16*sc+mx.measureText(t).width)});
        bx0=w-blw-8*sc;
        function balk(x,lft,wd,cols){
          var gr=x.createLinearGradient(lft,0,lft+wd,0);
          cols.forEach(function(k,j){gr.addColorStop(j/(cols.length-1),k)});return gr;
        }
        frames.forEach(function(fr,n){
          var c=cv(),x=c.getContext('2d');x.imageSmoothingQuality='high';
          x.drawImage(bc,0,0);
          if(on.wolken&&S.satCors&&wolken[n]){
            x.globalAlpha=S.satOp;teken(x,wolken[n].getContainer().querySelectorAll('img.leaflet-tile'));x.globalAlpha=1;
          }
          x.globalAlpha=.85;teken(x,layers[n].getContainer().querySelectorAll('canvas'));x.globalAlpha=1;
          if(on.blits){
            zichtbaar(n).forEach(function(v){
              var q=map.latLngToContainerPoint([v.s.lat,v.s.lon]);
              bolt(x,q.x*sc-10*sc,q.y*sc-10*sc,20*sc,BCOL[v.b]);
            });
          }
          x.beginPath();x.arc(mp.x*sc,mp.y*sc,7*sc,0,7);x.fillStyle='#B32C43';x.fill();
          x.lineWidth=2*sc;x.strokeStyle='#FCF5EE';x.stroke();
          x.textBaseline='alphabetic';
          if(on.rain||on.snow){
            rr(x,lx,ly,lw,lh,8*sc);x.fillStyle='#6F4257';x.fill();
            var y0=ly+6*sc,cx=lx+pd,by=y0+22*sc;
            x.font=(12*sc)+'px Oswald,Arial,sans-serif';
            if(on.rain){
              rr(x,cx,y0,rainW,8*sc,4*sc);x.fillStyle=balk(x,cx,rainW,HEX);x.fill();
              x.fillStyle='#FCF5EE';
              x.textAlign='left';x.fillText('Licht',cx,by);
              x.textAlign='center';x.fillText('Zwaar',cx+rainW/2,by);
              x.textAlign='right';x.fillText('Extreem',cx+rainW,by);
              cx+=rainW+lgap;
            }
            if(on.snow){
              rr(x,cx,y0,snowW,8*sc,4*sc);x.fillStyle=balk(x,cx,snowW,SNOWHEX);x.fill();
              x.fillStyle='#FCF5EE';x.textAlign='center';x.fillText('Sneeuw',cx+snowW/2,by);
            }
          }
          var tt=tijd(n);x.font=(20*sc)+'px "Bebas Neue",Oswald,Arial,sans-serif';
          var tw=x.measureText(tt).width+16*sc;
          rr(x,w-tw-8*sc,8*sc,tw,28*sc,8*sc);x.fillStyle='#6F4257';x.fill();
          x.fillStyle='#FCF5EE';x.textAlign='right';x.fillText(tt,w-16*sc,29*sc);
          if(on.blits){
            rr(x,bx0,by0,blw,blh,8*sc);x.fillStyle='#6F4257';x.fill();
            x.font=(12*sc)+'px Oswald,Arial,sans-serif';x.textAlign='left';x.textBaseline='middle';
            BLAB.forEach(function(t,j){
              var cy=by0+4*sc+j*rh+rh/2;
              x.globalAlpha=bon[j]?1:.4;
              bolt(x,bx0+pd,cy-6*sc,12*sc,BCOL[j]);
              x.fillStyle='#FCF5EE';x.fillText(t,bx0+pd+16*sc,cy);
            });
            x.globalAlpha=1;x.textBaseline='alphabetic';
          }
          x.font=(10*sc)+'px Arial,sans-serif';var at='\u00A9 OpenStreetMap \u00B7 RainViewer',aw=x.measureText(at).width+10*sc;
          x.fillStyle='#FCF5EEdd';x.fillRect(w-aw,h-14*sc,aw,14*sc);
          x.fillStyle='#6F4257';x.textAlign='right';x.fillText(at,w-5*sc,h-4*sc);
          gif.addFrame(c,{delay:n===frames.length-1?1500:450,copy:true});
        });
        gif.on('progress',function(v){gb.textContent=Math.round(v*100)+'%'});
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
    var rij=document.createElement('div');rij.className='pwr-rij';
    var a=document.createElement('a');a.className='pwr-gb';a.href=gifUrl;a.download='regenradar-crea-landa.gif';a.textContent='Opslaan';
    rij.appendChild(a);
    var file=null;try{file=new File([blob],'regenradar-crea-landa.gif',{type:'image/gif'})}catch(e){}
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
      var d=document.createElement('button');d.type='button';d.className='pwr-gb';d.textContent='Delen';
      d.onclick=function(){navigator.share({files:[file],title:'Regenradar Crea Landa'}).catch(function(){})};
      rij.appendChild(d);
    }
    var x=document.createElement('button');x.type='button';x.className='pwr-gb';x.textContent='Sluiten';
    x.onclick=function(){ov.remove()};ov.onclick=function(e){if(e.target===ov)ov.remove()};
    rij.appendChild(x);ov.appendChild(im);ov.appendChild(rij);document.body.appendChild(ov);
  }
  window.pwRadarGif=maakGif;
})();
