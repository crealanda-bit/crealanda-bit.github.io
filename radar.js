(()=>{
const B="https://nyeedsxrlnkbxzoritwg.supabase.co",K="sb_publishable_zjsw5kOIEZXbGszdm8T_jQ_CU6GHCC7";
const OK="Bedankt voor je reactie! Hij wordt eerst bekeken en verschijnt daarna op de site.";
const rpc=(n,b)=>fetch(B+"/rest/v1/rpc/"+n,{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify(b)}).then(r=>r.ok?r.json().catch(()=>null):r.text().then(t=>{throw Error(t)}));
const mail=b=>fetch("https://formsubmit.co/ajax/crealanda@gmail.com",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(b)});
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const st=document.createElement("style");
st.textContent=".rc{margin-top:auto;padding-top:8px;font-family:Oswald,Arial,sans-serif;color:#FCF5EE}.rc button{display:block;width:100%;border:0;border-radius:10px;background:#ffffff26;color:#FCF5EE;cursor:pointer;text-align:center}.rc .rl{padding:7px 8px;font:clamp(12px,3.4vw,15px) Oswald,Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rc .rl:disabled{cursor:default;opacity:.85}.rc .rb{margin-top:6px;padding:2px 6px;font:400 clamp(20px,5.6vw,26px)/1.3 'Great Vibes',cursive}.rp{position:absolute;z-index:2500;padding:14px;border-radius:14px;background:#9EB3D8;color:#FCF5EE;box-shadow:0 10px 30px #0006;font:16px/1.35 Oswald,Arial,sans-serif;animation:rpIn .35s ease both}@keyframes rpIn{0%{opacity:0;transform:scale(.92)}75%{opacity:1;transform:scale(1.01)}}.rp .rt{margin:0 30px 8px;text-align:center;font:400 30px/1.1 'Great Vibes',cursive;-webkit-text-stroke:.4px #FCF5EE}.rp .rx{position:absolute;top:6px;right:6px;width:34px;height:34px;padding:0;border:0;background:none;color:#FCF5EE;font-size:28px;line-height:1;cursor:pointer}.rp .ri{padding:8px 0;border-top:1px solid #FCF5EE70}.rp .ri b{font-weight:600}.rp .ri small{opacity:.85;margin-left:6px}.rp .ri p{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.rp input,.rp textarea{display:block;width:100%;margin:0 0 8px;padding:10px;border:1px solid #B32C43;border-radius:7px;background:#ffffff26;color:#FCF5EE;caret-color:#FCF5EE;font:inherit;font-size:17px}.rp input::placeholder,.rp textarea::placeholder{color:#FCF5EE;opacity:.8}.rp .go{display:block;margin:6px auto 0;padding:4px 26px;border:0;border-radius:8px;background:#B32C43;color:#FCF5EE;font:400 26px 'Great Vibes',cursive;cursor:pointer}.rp .go:disabled{opacity:.6}.rp .rs{min-height:1.2em;margin:8px 0 0;text-align:center}.rp .hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}";
document.head.append(st);
const fmt=d=>new Date(d).toLocaleDateString("nl-NL",{day:"numeric",month:"short"});
const L=document.getElementById("weerLijst");
/* Pop-up vak: komt over het kaartje en alles eromheen heen en groeit mee met de inhoud */
let pop=null;
function closePop(){if(pop){pop.remove();pop=null}}
function openPop(card,title,content){
closePop();
const p=el("div","rp"),x=el("button","rx","×");
x.type="button";x.setAttribute("aria-label","Sluiten");x.onclick=closePop;
p.append(x,el("div","rt",title),content);
const c=card.getBoundingClientRect(),g=L.getBoundingClientRect();
p.style.left=(g.left+scrollX)+"px";p.style.width=g.width+"px";p.style.top=(c.top+scrollY)+"px";p.style.minHeight=c.height+"px";
document.body.append(p);pop=p
}
document.addEventListener("pointerdown",e=>{if(pop&&!pop.contains(e.target)&&!(e.target.closest&&e.target.closest(".rc")))closePop()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePop()});
addEventListener("hashchange",closePop);addEventListener("resize",closePop);
function box(id,lbl){
const d=el("div","rc"),last=el("button","rl","Reacties laden…"),btn=el("button","rb","Reageren");
last.type="button";btn.type="button";last.disabled=true;
let all=[];
function load(){
rpc("get_weather_comments",{p_day:id}).then(a=>{
all=Array.isArray(a)?a:[];
if(!all.length){last.textContent="Nog geen reacties";last.disabled=true;return}
last.disabled=false;last.textContent=all[0].name+": "+all[0].message;
}).catch(()=>{last.textContent="Reacties laden mislukt";last.disabled=true})}
last.onclick=()=>{
const w=el("div");
all.forEach(c=>{const r=el("div","ri"),h=el("div"),p=el("p","",c.message);h.append(el("b","",c.name),el("small","",fmt(c.created_at)));r.append(h,p);w.append(r)});
openPop(d.closest(".wdag")||d,"Reacties",w)};
btn.onclick=()=>{
const form=el("form"),status=el("p","rs"),n=el("input"),m=el("input"),t=el("textarea"),go=el("button","go","Versturen"),hp=el("input","hp");
/* Verborgen botveld: mensen zien dit niet, bots vullen het vaak wel in */
hp.type="text";hp.name="website";hp.tabIndex=-1;hp.autocomplete="off";hp.setAttribute("aria-hidden","true");
n.placeholder="Naam";n.required=true;n.maxLength=60;n.autocomplete="name";
m.placeholder="E-mailadres";m.type="email";m.required=true;m.maxLength=120;m.autocomplete="email";
t.placeholder="Je reactie";t.required=true;t.rows=3;t.maxLength=1000;
go.type="submit";
form.append(n,m,t,hp,go,status);
form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;
/* Botveld ingevuld: doe alsof het gelukt is, maar verstuur niets */
if(hp.value){form.replaceChildren(el("p","rs",OK));return}
/* Wachttijd van 1 minuut tussen twee reacties vanaf dit apparaat */
try{if(Date.now()-(+localStorage.getItem("cl_rc_last")||0)<60000){status.textContent="Wacht even een minuutje voordat je nog een reactie plaatst.";return}}catch(x){}
go.disabled=true;status.textContent="Even geduld…";
const nm=n.value,em=m.value,tx=t.value;
rpc("add_weather_comment",{p_day:id,p_name:nm,p_email:em,p_message:tx}).then(()=>{try{localStorage.setItem("cl_rc_last",String(Date.now()))}catch(x){}
mail({_subject:"Nieuwe reactie op Crea Landa (wacht op goedkeuring)",_template:"table",Dag:lbl||"",Naam:nm,Email:em,Reactie:tx}).catch(()=>{});
form.replaceChildren(el("p","rs",OK))}).catch(err=>{status.textContent=/te_snel/.test(err.message)?"Je hebt zojuist al gereageerd. Probeer het over een minuutje opnieuw.":"Versturen mislukt. Controleer je gegevens en probeer het opnieuw.";go.disabled=false})};
openPop(d.closest(".wdag")||d,"Reageren",form);n.focus()};
d.append(last,btn);load();return d}
/* Elk weerkaartje (ook bij nieuwe uploads) krijgt automatisch zijn reactieknoppen */
function build(){
L.querySelectorAll("section.wdag").forEach(s=>{
if(s.dataset.rc||!s.dataset.id)return;
s.dataset.rc=1;
s.append(box(s.dataset.id,(s.querySelector(".wt")||{}).textContent||""))})}
new MutationObserver(build).observe(L,{childList:true});
build();
})();
