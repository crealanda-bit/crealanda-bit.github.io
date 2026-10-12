(()=>{
const B="https://nyeedsxrlnkbxzoritwg.supabase.co",K="sb_publishable_zjsw5kOIEZXbGszdm8T_jQ_CU6GHCC7";
const OK="Bedankt voor je reactie! Hij wordt eerst bekeken en verschijnt daarna op de site.";
const rpc=(n,b)=>fetch(B+"/rest/v1/rpc/"+n,{method:"POST",headers:{apikey:K,"Content-Type":"application/json"},body:JSON.stringify(b)}).then(r=>r.ok?r.json().catch(()=>null):r.text().then(t=>{throw Error(t)}));
const mail=b=>fetch("https://formsubmit.co/ajax/crealanda@gmail.com",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(b)});
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const st=document.createElement("style");
st.textContent=".rc{margin-top:16px;text-align:center;font-family:Oswald,Arial,sans-serif;font-size:17px;color:#FCF5EE}.rc .rh{margin:0 0 4px;font-size:15px;opacity:.9}.rc .rl{display:block;width:100%;background:none;border:0;padding:6px 4px;color:#FCF5EE;font:inherit;text-align:center;cursor:pointer;text-decoration:underline}.rc .rf{text-align:left;margin:6px 0}.rc .ri{padding:8px 0;border-bottom:1px solid #FCF5EE70}.rc .ri b{font-weight:600}.rc .ri small{opacity:.8;margin-left:6px}.rc .ri p{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.rc .rb{display:inline-block;margin-top:10px;padding:4px 26px;border:0;border-radius:8px;background:#B32C43;color:#FCF5EE;font:400 26px 'Great Vibes',cursive;cursor:pointer}.rc .rb:disabled{opacity:.6}.rc form{margin-top:10px;text-align:left}.rc input,.rc textarea{display:block;width:100%;margin:0 0 8px;padding:10px;border:1px solid #B32C43;border-radius:7px;background:#9EB3D8;color:#FCF5EE;caret-color:#FCF5EE;font:inherit;font-size:17px}.rc input::placeholder,.rc textarea::placeholder{color:#FCF5EE;opacity:.8}.rc form .rb{display:block;margin:6px auto 0}.rc .rs{min-height:1.2em;margin:8px 0 0}.rc .hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}";
document.head.append(st);
const fmt=d=>new Date(d).toLocaleDateString("nl-NL",{day:"numeric",month:"short"});
function box(id,lbl){
const d=el("div","rc"),head=el("p","rh","Laatste reacties"),last=el("button","rl","Reacties laden…"),full=el("div","rf"),btn=el("button","rb","Reageer"),form=el("form"),status=el("p","rs");
last.type="button";btn.type="button";full.hidden=true;form.hidden=true;
const n=el("input"),m=el("input"),t=el("textarea"),go=el("button","rb","Versturen");
/* Verborgen botveld: mensen zien dit niet, bots vullen het vaak wel in */
const hp=el("input","hp");hp.type="text";hp.name="website";hp.tabIndex=-1;hp.autocomplete="off";hp.setAttribute("aria-hidden","true");
n.placeholder="Naam";n.required=true;n.maxLength=60;n.autocomplete="name";
m.placeholder="E-mailadres";m.type="email";m.required=true;m.maxLength=120;m.autocomplete="email";
t.placeholder="Je reactie";t.required=true;t.rows=3;t.maxLength=1000;
go.type="submit";
form.append(n,m,t,hp,go);
function load(){
rpc("get_weather_comments",{p_day:id}).then(a=>{
a=Array.isArray(a)?a:[];full.replaceChildren();
if(!a.length){last.textContent="Nog geen reacties. Wees de eerste!";last.style.pointerEvents="none";last.style.textDecoration="none";return}
last.style.pointerEvents="";last.style.textDecoration="";
last.textContent=a[0].name+": "+(a[0].message.length>60?a[0].message.slice(0,60)+"…":a[0].message)+(a.length>1?"  ("+a.length+" reacties)":"");
a.forEach(c=>{const r=el("div","ri"),b=el("b","",c.name),s=el("small","",fmt(c.created_at));const p=el("p","",c.message);const h=el("div");h.append(b,s);r.append(h,p);full.append(r)})
}).catch(()=>{last.textContent="Reacties laden mislukt"})}
last.onclick=()=>{full.hidden=!full.hidden};
btn.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden)n.focus()};
form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;
/* Botveld ingevuld: doe alsof het gelukt is, maar verstuur niets */
if(hp.value){form.hidden=true;status.textContent=OK;return}
/* Wachttijd van 1 minuut tussen twee reacties vanaf dit apparaat */
try{if(Date.now()-(+localStorage.getItem("cl_rc_last")||0)<60000){status.textContent="Wacht even een minuutje voordat je nog een reactie plaatst.";return}}catch(x){}
go.disabled=true;status.textContent="Even geduld…";
const nm=n.value,em=m.value,tx=t.value;
rpc("add_weather_comment",{p_day:id,p_name:nm,p_email:em,p_message:tx}).then(()=>{try{localStorage.setItem("cl_rc_last",String(Date.now()))}catch(x){}
mail({_subject:"Nieuwe reactie op Crea Landa (wacht op goedkeuring)",_template:"table",Dag:lbl||"",Naam:nm,Email:em,Reactie:tx}).catch(()=>{});
t.value="";form.hidden=true;status.textContent=OK}).catch(err=>{status.textContent=/te_snel/.test(err.message)?"Je hebt zojuist al gereageerd. Probeer het over een minuutje opnieuw.":"Versturen mislukt. Controleer je gegevens en probeer het opnieuw."}).then(()=>{go.disabled=false})};
d.append(head,last,full,btn,form,status);load();return d}
const L=document.getElementById("weerLijst");let busy=false;
async function build(){
if(busy)return;const all=[...L.querySelectorAll("section.wdag")];
if(!all.some(s=>!s.dataset.rc))return;busy=true;
try{const days=await fetch(B+"/rest/v1/weather_days?select=id&order=date_from.desc",{headers:{apikey:K}}).then(r=>r.json());
all.forEach((s,i)=>{if(s.dataset.rc||!days[i])return;s.dataset.rc=1;s.append(box(String(days[i].id),(s.querySelector(".wt")||{}).textContent||""))})}catch(e){}
busy=false}
new MutationObserver(build).observe(L,{childList:true});
build();
})();
