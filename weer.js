/* Weer-widget Crea Landa - weerdata van Open-Meteo.com */
(function(){var h=document.getElementById("pw-host");if(!h)return;var st=document.createElement("style");st.textContent=".pw{--red:#B32C43;--cream:#FCF5EE;--card:#ffffff26;--mut:#FCF5EEd0;font-family:\"Bebas Neue\",sans-serif;letter-spacing:.3px;font-size:19px;color:var(--cream);margin:0 0 18px;text-align:left}.pw *{box-sizing:border-box}.pw-search{display:flex;gap:8px}.pw-search input{flex:1;min-width:0;padding:11px 13px;border:1px solid var(--red);border-radius:7px;background:var(--card);color:var(--cream);caret-color:var(--cream);font-size:19px}.pw-search input::placeholder{color:var(--cream);opacity:.8}.pw-search input:focus{outline:2px solid var(--cream);outline-offset:2px}.pw button{border:0;border-radius:8px;padding:10px 18px;background:var(--red);color:var(--cream);font-size:21px;line-height:1}.pw button.alt{padding:10px 12px;font-size:20px}.pw-list{list-style:none;margin:8px 0 0;padding:0;background:var(--cream);color:#6F4257;border-radius:10px;overflow:hidden;font:17px Oswald,Arial,sans-serif}.pw-list li{padding:11px 14px;cursor:pointer;border-bottom:1px solid #6F425722}.pw-list li:hover{background:#9EB3D850}.pw-msg{margin:16px 0;text-align:center;font:16px Oswald,Arial,sans-serif;color:var(--mut)}.pw-hero{margin-top:14px;padding:16px 18px;border-radius:10px;background:var(--red);display:flex;align-items:center;justify-content:space-between;gap:12px}.pw-hero h2{margin:0;font:400 clamp(30px,8vw,40px)/1.05 \"Great Vibes\",cursive;-webkit-text-stroke:.4px var(--cream)}.pw-hero .sub{margin:4px 0 0;font:15px/1.35 Oswald,Arial,sans-serif;color:var(--mut)}.pw-now{text-align:right;flex-shrink:0}.pw-ico{font-size:44px;line-height:1}.pw-temp{font-size:58px;line-height:1}.pw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:10px}.pw-card{background:var(--card);border-radius:10px;padding:9px 12px}.pw-card small{display:block;font:14px Oswald,Arial,sans-serif;color:var(--mut)}.pw-card b{font-weight:400;font-size:22px}.pw h3{margin:20px 0 8px;text-align:center;font:400 clamp(26px,7vw,32px) \"Great Vibes\",cursive;-webkit-text-stroke:.4px var(--cream)}.pw-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}.pw-h{flex:0 0 auto;min-width:64px;text-align:center;background:var(--card);border-radius:10px;padding:8px 4px}.pw-h span{display:block;font:15px Oswald,Arial,sans-serif}.pw-h b{font-weight:400;font-size:22px}.pw-d{display:grid;grid-template-columns:5.8rem 2rem 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #FCF5EE70}.pw-d .r{font:15px Oswald,Arial,sans-serif;color:var(--mut)}.pw-d b{font-weight:400;font-size:22px}.pw-foot{margin:16px 0 0;text-align:center;font:13px Oswald,Arial,sans-serif;color:var(--mut)}.pw-foot a{color:inherit}";document.head.appendChild(st);h.innerHTML="<div class=\"pw\" id=\"pw\">\n  <div class=\"pw-search\">\n    <input id=\"pw-in\" type=\"text\" placeholder=\"Typ je plaats, bijv. Zwolle\" autocomplete=\"off\" aria-label=\"Plaatsnaam\">\n    <button id=\"pw-go\">Zoek</button>\n    <button id=\"pw-me\" class=\"alt\" title=\"Gebruik mijn locatie\" aria-label=\"Gebruik mijn locatie\">\ud83d\udccd</button>\n  </div>\n  <ul class=\"pw-list\" id=\"pw-list\" hidden></ul>\n  <div id=\"pw-out\"><p class=\"pw-msg\">Vul een plaats in om het weer te zien \ud83c\udf24\ufe0f</p></div>\n  <p class=\"pw-foot\">Weergegevens van <a href=\"https://open-meteo.com/\" target=\"_blank\" rel=\"noopener\">Open-Meteo.com</a> \u00b7 wordt elke 10 minuten automatisch bijgewerkt</p>\n</div>";})();
(function(){
  var $=function(i){return document.getElementById(i)};
  var moreOpen=false,out=$('pw-out'),list=$('pw-list'),input=$('pw-in'),place=null,timer=null;
  var WC={0:['Helder','☀️'],1:['Overwegend helder','🌤️'],2:['Half bewolkt','⛅'],3:['Bewolkt','☁️'],45:['Mist','🌫️'],48:['Rijpmist','🌫️'],
  51:['Lichte motregen','🌦️'],53:['Motregen','🌦️'],55:['Zware motregen','🌧️'],56:['Ijzel','🌧️'],57:['Ijzel','🌧️'],
  61:['Lichte regen','🌦️'],63:['Regen','🌧️'],65:['Zware regen','🌧️'],66:['Ijzelregen','🌧️'],67:['Ijzelregen','🌧️'],
  71:['Lichte sneeuw','🌨️'],73:['Sneeuw','🌨️'],75:['Zware sneeuw','❄️'],77:['Sneeuwkorrels','🌨️'],
  80:['Lichte buien','🌦️'],81:['Buien','🌧️'],82:['Zware buien','⛈️'],85:['Sneeuwbuien','🌨️'],86:['Zware sneeuwbuien','❄️'],
  95:['Onweer','⛈️'],96:['Onweer met hagel','⛈️'],99:['Zwaar onweer met hagel','⛈️']};
  function wc(c){return WC[c]||['Onbekend','🌡️']}
  function bft(k){var t=[1,6,12,20,29,39,50,62,75,89,103,118],n=0;while(n<t.length&&k>=t[n])n++;return n}
  function dir(d){return ['noord','noordoost','oost','zuidoost','zuid','zuidwest','west','noordwest'][Math.round(d/45)%8]}
  function arrow(d){return '<span style="display:inline-block;transform:rotate('+((d+180)%360)+'deg)">↑</span>'}
  function r(n){return Math.round(n)}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function save(p){try{localStorage.setItem('pw-place',JSON.stringify(p))}catch(e){}}
  function load(){try{return JSON.parse(localStorage.getItem('pw-place'))}catch(e){return null}}

  function search(){
    var q=input.value.trim(); if(!q)return;
    out.innerHTML='<p class="pw-msg">Zoeken…</p>';list.hidden=true;
    fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=nl&format=json&name='+encodeURIComponent(q))
    .then(function(r){return r.json()}).then(function(d){
      var res=d.results||[];
      if(!res.length){out.innerHTML='<p class="pw-msg">Geen plaats gevonden. Probeer een andere schrijfwijze.</p>';return}
      if(res.length===1){pick(res[0]);return}
      out.innerHTML='<p class="pw-msg">Welke bedoel je?</p>';
      list.innerHTML=res.map(function(p,i){return '<li data-i="'+i+'">'+esc(p.name)+(p.admin1?', '+esc(p.admin1):'')+(p.country?' ('+esc(p.country)+')':'')+'</li>'}).join('');
      list.hidden=false;
      list.onclick=function(e){var li=e.target.closest('li');if(li){list.hidden=true;pick(res[li.dataset.i])}};
    }).catch(function(){out.innerHTML='<p class="pw-msg">Zoeken lukt nu niet. Probeer het zo nog eens.</p>'});
  }
  function pick(p){
    place={name:p.name,sub:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude};
    input.value=p.name;save(place);get();
  }
  function get(){
    if(!place)return;
    clearInterval(timer);
    var u='https://api.open-meteo.com/v1/forecast?latitude='+place.lat+'&longitude='+place.lon+
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m'+
    '&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,uv_index_max'+
    '&timezone=auto&forecast_days=7';
    fetch(u).then(function(r){return r.json()}).then(show).catch(function(){out.innerHTML='<p class="pw-msg">Weergegevens ophalen lukt nu niet.</p>'});
    timer=setInterval(get,600000);
  }
  function show(d){
    var c=d.current,w=wc(c.weather_code),dl=d.daily,h=d.hourly;
    var now=c.time.slice(0,13),i0=h.time.findIndex(function(t){return t.slice(0,13)>=now});if(i0<0)i0=0;
    var hrs=h.time.slice(i0,i0+24).map(function(t,k){var j=i0+k;
      return '<div class="pw-h"><span>'+t.slice(11,16)+'</span><span style="font-size:26px">'+wc(h.weather_code[j])[1]+'</span><b>'+r(h.temperature_2m[j])+'°</b><span class="r" >💧'+(h.precipitation_probability[j]||0)+'%</span></div>'}).join('');
    var days=dl.time.map(function(t,i){
      var nm=i===0?'Vandaag':new Date(t+'T12:00').toLocaleDateString('nl-NL',{weekday:'long'});
      return '<div class="pw-d"><span style="text-transform:capitalize;font:17px Oswald,Arial,sans-serif">'+nm+'</span><span>'+wc(dl.weather_code[i])[1]+'</span><span class="r">'+(dl.precipitation_sum[i]>0?'💧 '+dl.precipitation_sum[i].toFixed(1)+' mm':'droog')+'</span><b>'+r(dl.temperature_2m_max[i])+'° <span class="r">/ '+r(dl.temperature_2m_min[i])+'°</span></b></div>'}).join('');
    var wk=r(c.wind_speed_10m);
    out.innerHTML=
    '<div class="pw-hero"><div><h2>'+esc(place.name)+'</h2><p class="sub">'+esc(place.sub)+'<br>'+w[0]+' · bijgewerkt '+c.time.slice(11,16)+'</p></div>'+
    '<div class="pw-now"><div class="pw-ico">'+w[1]+'</div><div class="pw-temp">'+r(c.temperature_2m)+'°</div></div></div>'+
    '<div class="pw-grid">'+
    card('Voelt als',r(c.apparent_temperature)+'°')+
    card('Wind',wk+' km/u '+arrow(c.wind_direction_10m)+'<br><span style="font:15px Oswald,Arial,sans-serif">uit het '+dir(c.wind_direction_10m)+' · kracht '+bft(wk)+'</span>')+
    card('Windstoten',r(c.wind_gusts_10m)+' km/u')+
    card('Neerslag nu',c.precipitation+' mm')+
    '</div><div id="pw-more"'+(moreOpen?'':' hidden')+'><div class="pw-grid">'+
    card('Luchtvochtigheid',c.relative_humidity_2m+'%')+
    card('Bewolking',c.cloud_cover+'%')+
    card('Luchtdruk',r(c.pressure_msl)+' hPa')+
    card('UV vandaag',r(dl.uv_index_max[0]))+
    card('Zon op / onder',dl.sunrise[0].slice(11,16)+' / '+dl.sunset[0].slice(11,16))+
    '</div><h3>Komende 24 uur</h3><div class="pw-scroll">'+hrs+'</div><h3>Komende 7 dagen</h3>'+days+'</div>'+
    '<p style="text-align:center;margin:14px 0 0"><button id="pw-tog" type="button">'+(moreOpen?'Minder weergegevens ▴':'Meer weergegevens ▾')+'</button></p>';
  }
  function card(a,b){return '<div class="pw-card"><small>'+a+'</small><b>'+b+'</b></div>'}

  $('pw-go').onclick=search;
  out.addEventListener('click',function(e){
    if(e.target.id!=='pw-tog')return;
    moreOpen=!moreOpen;$('pw-more').hidden=!moreOpen;
    e.target.textContent=moreOpen?'Minder weergegevens ▴':'Meer weergegevens ▾';
  });
  input.onkeydown=function(e){if(e.key==='Enter')search()};
  $('pw-me').onclick=function(){
    if(!navigator.geolocation){out.innerHTML='<p class="pw-msg">Locatie wordt niet ondersteund.</p>';return}
    navigator.geolocation.getCurrentPosition(function(p){
      place={name:'Mijn locatie',sub:'',lat:p.coords.latitude,lon:p.coords.longitude};input.value='';get();
    },function(){out.innerHTML='<p class="pw-msg">Locatie niet toegestaan. Typ gewoon je plaats in.</p>'});
  };
  function startPlace(){
    fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&language=nl&format=json&name=Espel')
    .then(function(r){return r.json()}).then(function(d){
      var l=d.results||[],p=l.filter(function(x){return x.admin1==='Flevoland'})[0]||l[0];
      if(p){place={name:p.name,sub:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude};input.value=p.name;get()}
    }).catch(function(){});
  }
  var s=load();if(s){place=s;input.value=s.name;get()}else startPlace();
})();

/* ===== Compacte weerberichten: pas de twee getallen hieronder aan als je wilt ===== */
(function(){
  var DAGEN=3;   /* aantal dagen dat meteen zichtbaar is */
  var FOTOS=8;   /* aantal foto's per dag dat meteen zichtbaar is */
  var wl=document.getElementById('weerLijst');if(!wl)return;
  function knop(t){var b=document.createElement('button');b.type='button';b.textContent=t;
    b.style.cssText='display:block;margin:12px auto 0;padding:10px 18px;border:0;border-radius:8px;background:#B32C43;color:#FCF5EE;font:21px "Bebas Neue",sans-serif;cursor:pointer';return b}
  function apply(){
    var secs=[].slice.call(wl.querySelectorAll('.wdag'));
    if(!secs.length)return;
    secs.forEach(function(s){
      if(s.dataset.pw)return;s.dataset.pw='1';
      var g=s.querySelector('.wg');if(!g)return;
      var it=[].slice.call(g.children);if(it.length<=FOTOS)return;
      var extra=it.slice(FOTOS),open=false,n=extra.length,b=knop('Alle foto\u2019s tonen (+'+n+')');
      extra.forEach(function(e){e.style.display='none'});
      b.onclick=function(){open=!open;
        extra.forEach(function(e){e.style.display=open?'':'none'});
        b.textContent=open?'Minder foto\u2019s tonen':'Alle foto\u2019s tonen (+'+n+')'};
      g.after(b);
    });
    if(secs.length>DAGEN&&!wl.dataset.pwDagen){
      wl.dataset.pwDagen='1';
      var oud=secs.slice(DAGEN),open=false,b=knop('Oudere dagen tonen ('+oud.length+')');
      oud.forEach(function(s){s.style.display='none'});
      b.onclick=function(){open=!open;
        oud.forEach(function(s){s.style.display=open?'':'none'});
        b.textContent=open?'Oudere dagen verbergen':'Oudere dagen tonen ('+oud.length+')'};
      wl.appendChild(b);
    }
  }
  new MutationObserver(apply).observe(wl,{childList:true});
  apply();
})();
