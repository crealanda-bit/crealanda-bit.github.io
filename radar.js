/* Regenradar Crea Landa - Hoofdscript (Benelux kaart & radarlagen) */
(function(){
  var host = document.getElementById('pw-host');
  if (!host) return;

  // HTML structuur voor de radar binnen de wearpagina
  var wrap = document.createElement('div');
  wrap.className = 'pw-radar-wrap';
  wrap.innerHTML = `
    <div class="pwr-top pwr-ch">
      <button type="button" data-l="rain">Regen</button>
      <button type="button" data-l="snow">Sneeuw</button>
      <button type="button" data-l="blits">Bliksem</button>
      <button type="button" data-l="wolken">Wolken</button>
      <button type="button" data-l="wind">Wind</button>
    </div>
    <div class="pwr-map" id="pwr-map-box">
      <div id="pwr-m"></div>
      <div class="pwr-rt">
        <div class="pwr-bl" id="pwr-blits-menu">
          <div class="pwr-bt" id="pwr-blits-btn">⚡ GEEN BLIKSEM ▾</div>
          <div class="pwr-dicht" id="pwr-blits-list"></div>
        </div>
        <button type="button" class="pwr-wb" id="pwr-wind-btn">Windstroomlijnen</button>
      </div>
      <div class="pwr-lock"><span>Kaart vergrendeld</span></div>
    </div>
    <div class="pwr-bar">
      <button type="button" id="pwr-play">▶</button>
      <input type="range" id="pwr-rng" min="0" max="0" value="0">
      <span id="pwr-t">--:--</span>
    </div>
    <div class="pwr-acts">
      <button type="button" id="pwr-f">Foto</button>
      <button type="button" id="pwr-g">GIF</button>
      <button type="button" id="pwr-l">Kaart ontgrendelen</button>
    </div>
  `;
  host.parentNode.insertBefore(wrap, host.nextSibling);

  // Leaflet script inladen indien niet aanwezig
  if(!window.L){
    var ls = document.createElement('script');
    ls.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(ls);
    var lc = document.createElement('link');
    lc.rel = 'stylesheet';
    lc.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(lc);
  }

  // Wacht tot Leaflet geladen is en initialiseer de kaart
  function initMapWhenReady(){
    if(!window.L){ setTimeout(initMapWhenReady, 100); return; }

    // Initialiseer kaart gecentreerd op de Benelux
    var map = L.map('pwr-m', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true
    }).setView([50.85, 4.35], 7);

    // Beperk kaart tot de Benelux
    var beneluxBounds = L.latLngBounds([49.3, 2.3], [53.7, 7.3]);
    map.setMaxBounds(beneluxBounds);
    map.setMinZoom(7);
    map.setMaxZoom(10);

    // Achtergrond tile laag (neutraal/donker passend bij paars/blauw)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Laad Benelux grenzen in kleur #FCF5EE (zonder plaatsnamen)
    fetch('https://raw.githubusercontent.com/grevory/boundary-lines/master/countries/NLD/nld.geojson') // Of je eigen GeoJSON bron voor Benelux
      .catch(function(){}); // Fallback als bestand lokaal laadt

    // Exposeer benodigde objecten globaal voor animaties en wind/gif modules
    window.pwRadar = {
      map: map,
      s: function(){ return { map: map, mapEl: document.getElementById('pwr-map-box') }; }
    };

    // Laad optionele extra modules als ze aanwezig zijn
    ['radar.css', 'Radar-gif.js', 'wind.js'].forEach(function(f){
      if(f.endsWith('.css')){
        var c = document.createElement('link'); c.rel='stylesheet'; c.href=f; document.head.appendChild(c);
      } else {
        var s = document.createElement('script'); s.src=f; document.body.appendChild(s);
      }
    });
  }

  initMapWhenReady();
})();
