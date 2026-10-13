/* Regenradar Crea Landa - GIF-maker (wordt door radar.js geladen) */
(function(){
  var gifUrl='',gifBusy=false;
  /* ===== GIF maken van de radarbeweging ===== */
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
  function maakGif(){
    var S=window.pwRadar.s(),map=S.map,base=S.base,layers=S.layers,frames=S.frames,on=S.on,pl=S.pl,mapEl=S.mapEl,zichtbaar=S.zichtbaar,tijd=S.tijd,HEX=S.HEX,SNOWHEX=S.SNOWHEX,pause=S.pause;
    if(gifBusy||!layers.length||!map)return;
    pause();gifBusy=true;
    var gb=S.gb;gb.disabled=true;gb.textContent='Even\u2026';
    function klaar(){gifBusy=false;gb.disabled=false;gb.textContent='GIF'}
    function fout(){klaar();gb.textContent='Mislukt';setTimeout(function(){gb.textContent='GIF'},3000)}
    laadGif(function(){
      try{
        var mr=mapEl.getBoundingClientRect(),W=mr.width,H=mr.height,sc=Math.min(1,520/W),w=Math.round(W*sc),h=Math.round(H*sc);
        function cv(){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
        function teken(ctx,list){[].forEach.call(list,function(e){var r=e.getBoundingClientRect();if(r.width)ctx.drawImage(e,(r.left-mr.left)*sc,(r.top-mr.top)*sc,r.width*sc,r.height*sc)})}
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
        var ex=on.snow||on.blits,lh=(10+(on.rain?25.4:0)+(ex?(on.rain?4:0)+14.4:0))*sc,lw=150*sc,lx=(w-lw)/2,ly=h-8*sc-lh,pd=9*sc;
        function balk(x,lft,wd,cols){
          var gr=x.createLinearGradient(lft,0,lft+wd,0);
          cols.forEach(function(k,j){gr.addColorStop(j/(cols.length-1),k)});return gr;
        }
        frames.forEach(function(fr,n){
          var c=cv(),x=c.getContext('2d');
          x.drawImage(bc,0,0);
          x.globalAlpha=.85;teken(x,layers[n].getContainer().querySelectorAll('canvas'));x.globalAlpha=1;
          /* bliksem */
          if(on.blits){
            x.font=(17*sc)+'px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';
            zichtbaar(n).forEach(function(v){
              var q=map.latLngToContainerPoint([v.s.lat,v.s.lon]);
              x.globalAlpha=v.op;x.fillText('\u26A1',q.x*sc,q.y*sc);
            });
            x.globalAlpha=1;
          }
          /* plaatsmarkering */
          x.beginPath();x.arc(mp.x*sc,mp.y*sc,7*sc,0,7);x.fillStyle='#B32C43';x.fill();
          x.lineWidth=2*sc;x.strokeStyle='#FCF5EE';x.stroke();
          /* legenda */
          x.textBaseline='alphabetic';
          if(on.rain||ex){
            rr(x,lx,ly,lw,lh,8*sc);x.fillStyle='#6F4257';x.fill();
            var y0=ly+6*sc;x.fillStyle='#FCF5EE';x.font=(12*sc)+'px Oswald,Arial,sans-serif';
            if(on.rain){
              rr(x,lx+pd,y0,lw-2*pd,8*sc,4*sc);x.fillStyle=balk(x,lx+pd,lw-2*pd,HEX);x.fill();
              x.fillStyle='#FCF5EE';var by=y0+22*sc;
              x.textAlign='left';x.fillText('Licht',lx+pd,by);
              x.textAlign='center';x.fillText('Zwaar',w/2,by);
              x.textAlign='right';x.fillText('Extreem',lx+lw-pd,by);
              y0+=25.4*sc;
            }
            if(ex){
              if(on.rain)y0+=4*sc;
              if(on.snow){
                rr(x,lx+pd,y0+3*sc,30*sc,8*sc,4*sc);x.fillStyle=balk(x,lx+pd,30*sc,SNOWHEX);x.fill();
                x.fillStyle='#FCF5EE';x.textAlign='left';x.fillText('Sneeuw',lx+pd+34*sc,y0+11*sc);
              }
              if(on.blits){
                x.fillStyle='#FCF5EE';
                if(on.snow){x.textAlign='right';x.fillText('\u26A1 Bliksem',lx+lw-pd,y0+11*sc)}
                else{x.textAlign='left';x.fillText('\u26A1 Bliksem',lx+pd,y0+11*sc)}
              }
            }
          }
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

  window.pwRadarGif=maakGif;
})();
