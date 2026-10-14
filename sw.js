/* Crea Landa: onthoudt kaarttegels (radar + kaart) zodat inzoomen sneller gaat */
var NAAM='tegels-v1',MAX=500,HOSTS=['tile.openstreetmap.org','tilecache.rainviewer.com'];
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){
 var r=e.request;
 if(r.method!=='GET'||HOSTS.indexOf(new URL(r.url).hostname)<0)return;
 e.respondWith(caches.open(NAAM).then(function(c){
  return c.match(r).then(function(hit){
   return hit||fetch(r).then(function(n){
    if(n.ok){c.put(r,n.clone()).then(function(){return c.keys()}).then(function(k){if(k.length>MAX)c.delete(k[0])})}
    return n;
   });
  });
 }));
});
