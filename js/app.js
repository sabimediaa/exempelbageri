(function(){
const CATS=[
 {id:"kakor",name:"Kakor",blurb:"Småkakor i påse och kakor att dela."},
 {id:"hembakat",name:"Hembakat",blurb:"Pajer, kladdkaka och säsongens bakverk."},
 {id:"matbrod",name:"Matbröd",blurb:"Långjäst surdeg, bakat tidigt på morgonen."},
 {id:"fikabrod",name:"Fikabröd",blurb:"Bullar och knutar med riktigt smör."},
 {id:"granola",name:"Granola",blurb:"Rostad i små satser, sötad med honung."}
];
const ALLERGENS=["Gluten","Havre","Mjölk","Ägg","Nötter","Mandel","Sesam","Soja"];
const ICON={
 kakor:'<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="14" cy="9" r="1.2" fill="currentColor"/><circle cx="13" cy="14" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>',
 hembakat:'<path d="M3 13h18l-2 6H5Z"/><path d="M5 13c1-4 4-6 7-6s6 2 7 6"/><path d="M9 10l1 2M14 10l-1 2"/>',
 matbrod:'<path d="M3 15c0-5 4-9 9-9s9 4 9 9c0 2-1 3-3 3H6c-2 0-3-1-3-3Z"/><path d="M8 10l2 2M12 9l2 2M16 10l1 1"/>',
 fikabrod:'<circle cx="12" cy="12" r="8"/><path d="M12 12m-4 0a4 4 0 1 0 4-4a2.5 2.5 0 1 0-2.5 2.5"/>',
 granola:'<path d="M7 4h10v3l2 3v10H5V10l2-3Z"/><path d="M5 13h14"/><path d="M9 16h1M13 17h1M11 15h1"/>',
 skapet:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M15 6h2"/>',
 om:'<path d="M12 3c-1 5-5 8-5 13a5 5 0 0 0 10 0c0-5-4-8-5-13Z"/><path d="M12 11v10"/>',
 admin:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
 alla:'<path d="M4 6h16M4 12h16M4 18h10"/>',
 bestall:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'
};
const ico=(k,s=26)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]||ICON.kakor}</svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kr=n=>`${(Number(n)||0).toLocaleString("sv-SE")} kr`;

const saved=window.SITE_DATA;
let S=JSON.parse(JSON.stringify(saved));
S.products.forEach(p=>{p.al=p.al||[];p.ingr=p.ingr||"";p.tag=p.tag||"";});
let canEdit=false, artifactApi=undefined, menuOpen=false, dirty=false, saveMsg="";
let filter="alla", infoId=null, editId=null, armDel=null, aTab="oversikt";
let calc={}; // swish calculator {id:qty}
let orderSel={occ:"Kalas",items:[]}, orderErr="", orderText="";

const root=document.getElementById("root");
const catName=id=>(CATS.find(c=>c.id===id)||{}).name||id;
const cabItems=()=>S.products.filter(p=>p.inCab);
const inStock=()=>cabItems().filter(p=>p.left>0);
function stat(p){if(!p.inCab)return["order","Beställ"];if(!p.left)return["out","Slut i skåpet"];if(p.left/(p.cap||1)<=0.3)return["low","Få kvar"];return["ok","I skåpet"];}
function refilledText(){
  const d=new Date(S.cabinet.refilledAt); if(isNaN(d))return "–";
  const t=d.toLocaleTimeString("sv-SE",{hour:"2-digit",minute:"2-digit"});
  return d.toDateString()===new Date().toDateString()?`idag ${t}`:`${d.toLocaleDateString("sv-SE",{day:"numeric",month:"short"})} ${t}`;
}
function toast(m){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";t.setAttribute("role","status");document.body.appendChild(t);}t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2400);}
const wave=`<svg class="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0,34 C240,4 480,58 720,32 C960,8 1200,52 1440,24 L1440,60 L0,60 Z"/></svg>`;

/* ---------- shared chrome ---------- */
function header(){
  return `<header class="bar${menuOpen?" menu-open":""}"><div class="wrap">
   <a class="logo" href="#hem"><span class="mark">${ico("om",20)}</span>Exempelbageri</a>
   <div class="bar-actions">
    <a class="grab-pill" href="#skapet">${ico("skapet",18)}<span>Swish &amp; Grab</span></a>
    <button class="menu-btn" type="button" id="menu-btn" aria-expanded="${menuOpen}" aria-controls="split-menu"><span class="burger" aria-hidden="true"><i></i><i></i><i></i></span>${menuOpen?"Stäng":"Meny"}</button>
   </div></div></header>`;
}
function tiles(withAdmin){
  const count=c=>S.products.filter(p=>p.cat===c).length;
  let i=0; const d=()=>`style="animation-delay:${(i++)*45}ms"`;
  let h=`<a class="tile accent wide" href="#skapet" ${d()}>${ico("skapet")}<div><h3>Swish &amp; Grab</h3><div class="sub">${inStock().length} sorter i skåpet just nu</div></div></a>`;
  CATS.forEach(c=>{h+=`<a class="tile" href="#${c.id}" ${d()}>${ico(c.id)}<div><h3>${c.name}</h3><div class="sub">${count(c.id)} sorter</div></div></a>`;});
  h+=`<a class="tile" href="#sortiment" ${d()}>${ico("alla")}<div><h3>Allt</h3><div class="sub">Hela sortimentet</div></div></a>`;
  h+=`<a class="tile" href="#bestall" ${d()}>${ico("bestall")}<div><h3>Beställ</h3><div class="sub">Tårtor och kalas</div></div></a>`;
  h+=`<a class="tile" href="#om-oss" ${d()}>${ico("om")}<div><h3>Om oss</h3><div class="sub">Och vanliga frågor</div></div></a>`;
  if(withAdmin)h+=`<a class="tile" href="#admin" ${d()}>${ico("admin")}<div><h3>Admin</h3><div class="sub">Skåp och sortiment</div></div></a>`;
  return h;
}
function menu(){return menuOpen?`<nav class="split-menu" id="split-menu" aria-label="Meny"><div class="split-grid">${tiles(canEdit)}<div class="split-foot"><span>${esc(S.cabinet.street)}, ${esc(S.cabinet.city)}</span><span>${esc(S.contact.email)}</span></div></div></nav>`:"";}
function footer(){
  return `<footer><div class="wrap"><div class="foot-top">
    <h2>Sugen på något <em>gott?</em></h2>
    <div class="foot-col"><span class="eyebrow">Sidor</span><a href="#hem">Hem</a><a href="#sortiment">Sortiment</a><a href="#skapet">Swish &amp; Grab</a><a href="#bestall">Beställ</a><a href="#om-oss">Om oss</a></div>
    <div class="foot-col"><span class="eyebrow">Kontakt</span><span style="user-select:all">${esc(S.contact.email)}</span><span style="user-select:all">${esc(S.contact.phone)}</span>${S.contact.instagram?`<a href="${esc(S.contact.instagram)}" target="_blank" rel="noopener">Instagram ↗</a>`:""}</div>
   </div><div class="foot-bottom"><span>© 2026 Exempelbageri · Vi har ingen butik, allt säljs via skåpet</span>${canEdit?'<a href="#admin">Admin →</a>':""}</div></div></footer>`;
}
function fab(r){return ["skapet","admin"].includes(r)?"":`<a class="btn btn-grab fab" href="#skapet">${ico("skapet",20)} Swish &amp; Grab</a>`;}

function card(p){
  const [c,t]=stat(p);
  return `<button class="card" type="button" data-info="${p.id}" aria-label="${esc(p.name)}, visa ingredienser och allergener">
    <div class="card-art">${p.tag?`<span class="tag${p.tag==="Nyhet"?" new":""}">${esc(p.tag)}</span>`:""}<span class="info-i"><i>i</i>Info</span>${ico(p.cat,64)}</div>
    <div><div class="cat">${catName(p.cat)}</div><h3>${esc(p.name)}</h3></div>
    <p>${esc(p.desc)}</p>
    <div class="card-foot"><span class="price">${kr(p.price)}</span><span class="pill ${c}">${t}${p.inCab&&p.left?` · ${p.left} st`:""}</span></div></button>`;
}
function shelves(){
  const items=cabItems().slice(0,8); while(items.length<8)items.push(null);
  let h='';for(let r=0;r<2;r++){h+='<div class="shelf">';for(let i=r*4;i<r*4+4;i++){const p=items[i];
    h+=p?`<div class="slot ${p.left?"full":""}">${esc(p.name.split(",")[0])}<br>${p.left} st</div>`:`<div class="slot empty">Tom</div>`;}h+='</div>';}
  return h;
}
function cabFacts(){return `<span class="fact"><span class="dot${S.cabinet.open?"":" off"}"></span>${S.cabinet.open?"Öppet dygnet runt":"Stängt just nu"}</span><span class="fact">Påfyllt ${refilledText()}</span><span class="fact">Nästa påfyllning ${esc(S.cabinet.nextRefill)}</span>`;}
function pageHero(eyebrow,title,lead,extra=""){return `<div class="page-hero"><div class="wrap"><button class="back" type="button" data-open-menu>← Meny</button><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${lead?`<p>${lead}</p>`:""}${extra}</div>${wave}</div>`;}

/* ---------- pages ---------- */
function pageHome(){
  const fav=S.products.filter(p=>p.tag).concat(S.products.filter(p=>!p.tag)).slice(0,4);
  const names=S.products.map(p=>`<span>${esc(p.name.split(",")[0])}</span>`).join("");
  const cheapest=Math.min(...S.products.map(p=>p.price));
  return `<div class="hero"><div class="wrap"><div>
     <span class="eyebrow">Hembageri utan butik</span>
     <h1>Bröd och bullar som får <em>ta tid</em>.</h1>
     <p class="lead">Kakor, hembakat, matbröd, fikabröd och granola. Bakat för hand och sålt via vårt Swish &amp; Grab-skåp vid vägen.</p>
     <div class="actions"><a class="btn btn-grab" href="#skapet">${ico("skapet",20)} Se vad som finns i skåpet</a><button class="btn btn-ghost" type="button" data-open-menu>Öppna menyn</button></div>
     <div class="trust"><div><strong>${inStock().length}</strong>sorter i skåpet</div><div><strong>${S.products.length}</strong>sorter totalt</div><div><strong>24/7</strong>öppet skåp</div></div>
   </div>
   <div class="hero-art" aria-hidden="true">
    <svg viewBox="0 0 400 400"><ellipse cx="200" cy="350" rx="160" ry="16" fill="rgba(0,0,0,.2)"/><path d="M50 290c0-100 70-160 160-160s150 60 150 160c0 25-20 40-50 40H100c-30 0-50-15-50-40Z" fill="#c48a43"/><path d="M50 290c0-100 70-160 160-160s150 60 150 160" fill="none" stroke="#8f5a22" stroke-width="5"/><path d="M118 190c30 20 60 26 90 26M148 164c26 16 56 22 90 20M198 148c20 12 50 18 80 16" stroke="#f2dfb8" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="318" cy="300" r="52" fill="#a96a2c"/><path d="M318 300m-34 0a34 34 0 1 0 34-34a22 22 0 1 0 -22 22a11 11 0 1 0 11-11" fill="none" stroke="#6e3f15" stroke-width="5" stroke-linecap="round"/><g fill="#f6f1df"><circle cx="300" cy="272" r="3.5"/><circle cx="334" cy="280" r="3.5"/><circle cx="312" cy="324" r="3.5"/><circle cx="342" cy="314" r="3.5"/></g></svg>
    <div class="badge"><div><span>Från</span><strong>${kr(cheapest)}</strong><span>i skåpet</span></div></div>
   </div></div>${wave}</div>
  <div class="strip" aria-hidden="true"><div class="strip-track">${names}${names}</div></div>
  <section><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Veckans favoriter</span><h2>Det här tar slut först</h2><p class="small" style="margin-top:6px">Tryck på en vara för att se ingredienser och allergener.</p></div><a class="link-arrow" href="#sortiment">Hela sortimentet →</a></div>
   <div class="cards">${fav.map(card).join("")}</div></div></section>
  <section class="mist"><div class="wrap"><span class="eyebrow">Så funkar det</span><h2 style="font-size:clamp(1.9rem,3.8vw,2.8rem);margin-top:6px">Från ugnen till skåpet</h2>
   <ol class="steps"><li><span class="n">Steg 1</span><h3>Kolla skåpet</h3><p>Se vad som finns kvar och hur många av varje sort innan du åker.</p></li><li><span class="n">Steg 2</span><h3>Ta och swisha</h3><p>Öppna skåpet, ta det du vill ha och swisha summan. Räknaren hjälper dig.</p></li><li><span class="n">Steg 3</span><h3>Njut nybakat</h3><p>Vi fyller på varje morgon, så det du köper är bakat samma dag.</p></li></ol></div></section>
  <section><div class="wrap cab-split"><div>
    <span class="eyebrow">Swish &amp; Grab</span><h2 style="font-size:clamp(1.9rem,4vw,2.8rem);margin:6px 0 12px">Skåpet vid vägen</h2>
    <p class="muted" style="max-width:46ch;margin-bottom:18px">${esc(S.cabinet.street)}, ${esc(S.cabinet.city)}. ${inStock().length} sorter finns i skåpet just nu.</p>
    <div class="facts" style="margin-bottom:22px">${cabFacts()}</div><a class="btn btn-grab" href="#skapet">Öppna skåpet</a></div>
   <a class="shelves" href="#skapet" aria-label="Visa skåpets innehåll">${shelves()}</a></div></section>
  <section style="padding-top:0"><div class="wrap"><div class="band"><div><span class="eyebrow">Beställningar</span><h2>Tårta till kalaset eller bröd till <em>festen</em></h2><p>Beställ minst tre dagar i förväg. Vi bakar och ställer det i skåpet eller lämnar det vid grinden.</p></div><a class="btn btn-grab" href="#bestall">Skicka förfrågan →</a></div></div></section>`;
}
function pageCat(id){
  const c=CATS.find(x=>x.id===id); const list=S.products.filter(p=>p.cat===id);
  return pageHero("Sortiment",c.name,c.blurb)+`<section class="tight"><div class="wrap"><div class="cards">${list.map(card).join("")||'<p class="muted">Inga sorter just nu.</p>'}</div></div></section>`;
}
function pageAll(){
  const f=[["alla","Alla"],["skap","I skåpet nu"],...CATS.map(c=>[c.id,c.name])];
  let list=S.products;
  if(filter==="skap")list=list.filter(p=>p.inCab&&p.left>0);else if(filter!=="alla")list=list.filter(p=>p.cat===filter);
  return pageHero("Sortiment","Allt vi <em>bakar</em>","Det som finns i skåpet är märkt. Resten går att beställa.")+
   `<section class="tight"><div class="wrap"><div class="sec-head"><p class="small">Tryck på en vara för ingredienser och allergener.</p><div class="chips">${f.map(([k,l])=>`<button class="chip-btn" type="button" data-filter="${k}" aria-pressed="${filter===k}">${l}</button>`).join("")}</div></div>
   <div class="cards">${list.map(card).join("")||'<p class="muted">Inget här just nu.</p>'}</div></div></section>`;
}
function pageCab(){
  const items=cabItems();
  const lines=Object.entries(calc).filter(([,q])=>q>0).map(([id,q])=>({p:S.products.find(x=>x.id===id),q})).filter(x=>x.p);
  const total=lines.reduce((s,x)=>s+x.p.price*x.q,0);
  return pageHero("Swish &amp; Grab","Skåpet","Se vad som finns, plocka ihop ditt köp och swisha summan.",`<div class="facts" style="margin-top:6px">${cabFacts()}</div>`)+
  `<section class="tight"><div class="wrap cab-layout"><div class="stack">
    <div class="block"><h3>I skåpet just nu</h3><div class="inv">
     ${items.map(p=>{const[c,t]=stat(p);const q=calc[p.id]||0;return `<div class="inv-row${p.left?"":" out"}"><div class="inv-ico">${ico(p.cat,24)}</div>
       <div style="min-width:0"><div class="nm">${esc(p.name)}</div><div class="meta"><span>${kr(p.price)}</span><span class="pill ${c}">${t}${p.left?` · ${p.left} st`:""}</span></div></div>
       <div class="stepper" aria-label="Antal ${esc(p.name)}"><button type="button" data-calc="-1" data-id="${p.id}" aria-label="Ta bort en ${esc(p.name)}"${q?"":" disabled"}>−</button><output>${q}</output><button type="button" data-calc="1" data-id="${p.id}" aria-label="Lägg till en ${esc(p.name)}"${q>=p.left?" disabled":""}>+</button></div></div>`;}).join("")||'<p class="muted">Skåpet är tomt just nu.</p>'}
    </div><p class="small" style="margin-top:10px">Lagret räknas av vid varje påfyllning och kan skilja några stycken.</p></div>
    <div class="block"><h3>Var står skåpet?</h3><div class="loc">
     <svg class="map" viewBox="0 0 320 200" role="img" aria-label="Kartskiss över var skåpet står">
      <rect class="m-bg" width="320" height="200"/><path class="m-road" d="M0 120 C80 112 160 128 320 108" stroke-width="22" fill="none"/><path class="m-dash" d="M0 120 C80 112 160 128 320 108" stroke-width="2" stroke-dasharray="8 8" fill="none"/><path class="m-road" d="M190 0 L178 200" stroke-width="14" fill="none"/>
      <rect class="m-house" x="200" y="34" width="72" height="44" rx="4"/><text class="m-housetext" x="236" y="61" text-anchor="middle" font-size="11" font-family="Figtree, sans-serif">Gården</text>
      <path class="m-pin" d="M214 74c-8 0-13 6-13 12 0 9 13 20 13 20s13-11 13-20c0-6-5-12-13-12Z"/><circle class="m-pinhole" cx="214" cy="86" r="4.5"/>
      <text class="m-text" x="14" y="104" font-size="10" font-family="Figtree, sans-serif">${esc(S.cabinet.street.replace(/\s*\d+.*$/,""))}</text><text class="m-strong" x="234" y="104" font-size="11" font-weight="700" font-family="Figtree, sans-serif">Skåpet</text></svg>
     <div><address><strong>${esc(S.cabinet.street)}</strong><br>${esc(S.cabinet.city)}</address><p class="small" style="margin-top:8px">${esc(S.cabinet.place)}</p>
      <a class="btn btn-ghost btn-sm" style="margin-top:14px" href="${esc(S.cabinet.maps)}" target="_blank" rel="noopener">Öppna i Google Maps ↗</a></div></div></div>
    <div class="block"><h3>Så handlar du</h3><ol class="how"><li><span>Öppna skåpet och ta det du vill ha.</span></li><li><span>Lägg till samma varor i räknaren så ser du vad du ska swisha.</span></li><li><span>Swisha summan och skriv gärna vad du köpt i meddelandet.</span></li><li><span>Stäng dörren ordentligt så att brödet håller sig fräscht.</span></li></ol></div>
   </div>
   <aside class="calc" aria-label="Swish-räknare"><h3>Att swisha</h3>
    ${lines.length?`<ul class="calc-lines">${lines.map(x=>`<li><span>${x.q} × ${esc(x.p.name)}</span><span class="sum">${kr(x.p.price*x.q)}</span></li>`).join("")}</ul>`:`<p class="empty">Tryck på + vid det du tar ur skåpet.</p>`}
    <div class="calc-total"><span>Totalt</span><strong>${kr(total)}</strong></div>
    <div class="swish-box"><div><small>Swishnummer</small><div class="no" id="swish-no">${esc(S.cabinet.swish)}</div></div><button class="btn btn-sm" type="button" id="copy-btn">Kopiera</button></div>
    ${lines.length?`<button class="btn btn-ghost btn-sm" type="button" data-act="clearcalc">Töm räknaren</button>`:""}
    <p class="note">Räknaren hjälper bara till med summan. Betalningen gör du i Swish-appen.</p></aside>
  </div></section>`;
}
function pageOrder(){
  const occs=["Kalas","Födelsedag","Bröllop","Studentfest","Företagsfika","Annat"];
  const min=new Date(Date.now()+3*864e5).toISOString().slice(0,10);
  return pageHero("Beställ","Bakat till ditt <em>tillfälle</em>","Tårtor, kalasbullar, bröd till fest och granola i större mängd. Beställ minst tre dagar i förväg.")+
  `<section class="tight"><div class="wrap order-grid"><div>
    <span class="eyebrow">Så funkar det</span><h2 style="font-size:clamp(1.8rem,3.6vw,2.5rem);margin-top:6px">Berätta vad du vill ha</h2>
    <p class="muted" style="margin-top:10px;max-width:46ch">Fyll i formuläret så får du en färdig text att skicka till oss. Vi svarar inom ett dygn med pris och tid.</p>
    <ul class="perks"><li><strong>Hämta i skåpet</strong><span>Din beställning står märkt med ditt namn.</span></li><li><strong>Eller vid grinden</strong><span>Större beställningar lämnar vi vid gården.</span></li><li><strong>Allt från sortimentet</strong><span>Plus tårtor och kalasbullar på beställning.</span></li><li><strong>Betala med Swish</strong><span>När du hämtar, till samma nummer som skåpet.</span></li></ul>
   </div>
   <form class="form" id="order-form" novalidate><h3>Förfrågan</h3>
    <div class="row2"><div class="field"><label for="o-name">Namn</label><input id="o-name" autocomplete="name" placeholder="t.ex. Anna Svensson"></div><div class="field"><label for="o-phone">Telefon</label><input id="o-phone" type="tel" autocomplete="tel" placeholder="070-123 45 67"></div></div>
    <div class="row2"><div class="field"><label for="o-date">Datum</label><input id="o-date" type="date" min="${min}"></div><div class="field"><label for="o-guests">Antal personer</label><input id="o-guests" type="number" min="1" inputmode="numeric" placeholder="20"></div></div>
    <div class="field"><span class="flabel">Tillfälle</span><div class="pick">${occs.map(o=>`<button type="button" data-occ="${o}" aria-pressed="${orderSel.occ===o}">${o}</button>`).join("")}</div></div>
    <div class="field"><span class="flabel">Vad vill du ha? <span class="small">(välj en eller flera)</span></span><div class="pick">${["Tårta",...S.products.map(p=>p.name.split(",")[0])].map(n=>`<button type="button" data-oitem="${esc(n)}" aria-pressed="${orderSel.items.includes(n)}">${esc(n)}</button>`).join("")}</div></div>
    <div class="field"><label for="o-msg">Övrigt</label><textarea id="o-msg" placeholder="Allergier, antal, önskemål om tårta…"></textarea></div>
    ${orderErr?`<p class="err">${esc(orderErr)}</p>`:""}
    <button class="btn btn-ink" type="submit">Skapa förfrågan</button>
    ${orderText?`<div class="result"><strong>Klart! Skicka texten till ${esc(S.contact.email)}</strong><pre id="order-text">${esc(orderText)}</pre><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-olive btn-sm" type="button" id="copy-order">Kopiera texten</button><button class="btn btn-ghost btn-sm" type="button" id="copy-mail">Kopiera e-postadress</button></div><p class="small">Inget skickas automatiskt. Klistra in texten i ett mejl eller sms till oss.</p></div>`:""}
   </form></div></section>`;
}
function pageAbout(){
  return pageHero("Om oss","Ett litet bageri <em>utan butik</em>","Allt bakas för hand och säljs via skåpet vid vägen.")+
  `<section class="tight"><div class="wrap about"><div class="story"><span class="eyebrow">Vår historia</span><h2 style="font-size:clamp(1.8rem,3.6vw,2.6rem)">Från hemmakök till skåp vid vägen</h2><p>${esc(S.about)}</p><a class="btn btn-ink" href="#sortiment" style="justify-self:start;margin-top:6px">Se sortimentet →</a></div>
   <div class="about-art" aria-hidden="true">${ico("matbrod",200)}</div></div></section>
  <section class="mist"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Det här står vi för</span><h2>Enkla regler, bra bröd</h2></div></div>
   <div class="values"><div class="value"><h3>Riktigt smör</h3><p>Inget margarin och inga genvägar i bullarna.</p></div><div class="value"><h3>Bakat samma dag</h3><p>Skåpet fylls på varje morgon. Det som blir över skänker vi bort.</p></div><div class="value"><h3>Tillit</h3><p>Skåpet är olåst. Vi litar på att du swishar för det du tar.</p></div></div></div></section>
  <section><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Vanliga frågor</span><h2>Bra att veta</h2></div></div>
   <div class="faq"><details open><summary>Har ni en butik?</summary><p>Nej. Allt säljs via Swish &amp; Grab-skåpet vid ${esc(S.cabinet.street)} och via beställningar.</p></details>
   <details><summary>Hur vet jag vad som finns i skåpet?</summary><p>Sidan Swish &amp; Grab visar vad som finns kvar. Vi uppdaterar lagret när vi fyller på.</p></details>
   <details><summary>Kan ni anpassa efter allergier?</summary><p>Hör av dig så berättar vi vad vi kan göra. Allt bakas i samma kök, så vi kan inte garantera att något är helt fritt från spår av allergener.</p></details>
   <details><summary>Vad händer om skåpet är tomt?</summary><p>Vi fyller på igen ${esc(S.cabinet.nextRefill)}. Vill du vara säker på att få något kan du beställa i förväg.</p></details></div>
   <p class="small" style="margin-top:20px">Kontakt: <span style="user-select:all">${esc(S.contact.email)}</span> · <span style="user-select:all">${esc(S.contact.phone)}</span></p></div></section>`;
}
function infoSheet(){
  const p=S.products.find(x=>x.id===infoId); if(!p)return "";
  const [c,t]=stat(p);
  return `<div class="overlay" id="info-ov" role="dialog" aria-modal="true" aria-labelledby="info-name"><div class="sheet">
   <button class="close" type="button" data-close aria-label="Stäng">✕</button>
   <div class="info-grid"><div class="info-art">${ico(p.cat,120)}<span class="price">${kr(p.price)}</span></div>
   <div class="info-body"><div><span class="eyebrow">${catName(p.cat)}${p.tag?` · ${esc(p.tag)}`:""}</span><h2 id="info-name">${esc(p.name)}</h2></div>
    <p class="muted">${esc(p.desc)}</p>
    <div><span class="pill ${c}">${t}${p.inCab&&p.left?` · ${p.left} st kvar`:""}</span></div>
    <div><h4>Ingredienser</h4><p>${esc(p.ingr)||"–"}</p></div>
    <div><h4>Allergener</h4><div class="als">${p.al.length?p.al.map(a=>`<span class="al">${esc(a)}</span>`).join(""):'<span class="muted">Inga av de vanligaste allergenerna.</span>'}</div>
     <p class="small" style="margin-top:8px">Bakat i ett kök som även hanterar gluten, mjölk, ägg, nötter och mandel.</p></div>
    ${p.inCab&&p.left?`<a class="btn btn-grab" href="#skapet">Finns i skåpet →</a>`:`<a class="btn btn-ink" href="#bestall">Beställ i förväg →</a>`}
   </div></div></div></div>`;
}

/* ---------- admin ---------- */
function pageAdmin(){
  if(!canEdit){
    return `<div class="page-hero"><div class="wrap"><button class="back" type="button" data-open-menu>← Meny</button><span class="eyebrow">Admin</span><h1>Bara för ägaren</h1></div>${wave}</div>
    <section class="tight"><div class="wrap"><div class="notice">${artifactApi===undefined?"Kontrollerar behörighet…":"Den här sidan är bara för ägaren. Du kan se sortimentet och skåpet via menyn."}</div></div></section>`;
  }
  const out=cabItems().filter(p=>!p.left).length, low=cabItems().filter(p=>p.left&&p.left/p.cap<=.3).length;
  const tabs=[["oversikt","Översikt",out+low],["skapet","Skåpet",0],["sortiment","Sortiment",0],["info","Info & kontakt",0]];
  let body="";
  if(aTab==="oversikt"){
    const val=cabItems().reduce((s,p)=>s+p.left*p.price,0);
    const refill=cabItems().map(p=>({p,need:p.cap-p.left})).filter(x=>x.need>0).sort((a,b)=>b.need-a.need);
    body=`<div class="ahead"><div><p>${new Date().toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"})}</p><h1>Hej!</h1></div><button class="btn btn-olive btn-sm" type="button" data-act="refilled">Markera påfyllt nu</button></div>
     <div class="kpis"><div class="kpi hi"><small>Sorter i skåpet</small><strong>${inStock().length}</strong><span>av ${cabItems().length} valda</span></div>
      <div class="kpi"><small>Slut i skåpet</small><strong>${out}</strong><span>${low} med få kvar</span></div>
      <div class="kpi"><small>Värde i skåpet</small><strong>${kr(val)}</strong><span>om allt säljs</span></div>
      <div class="kpi"><small>Senast påfyllt</small><strong style="font-size:1.4rem">${refilledText()}</strong><span>Nästa ${esc(S.cabinet.nextRefill)}</span></div></div>
     <div class="acols"><div class="panel"><div class="panel-head"><h2>Att baka och fylla på</h2><span class="small">${refill.reduce((s,x)=>s+x.need,0)} st totalt</span></div>
       <ul class="list">${refill.map(x=>{const r=x.p.left/x.p.cap;return `<li><div class="nm">${esc(x.p.name)}<small>${x.p.left} av ${x.p.cap} kvar</small><div class="bar-meter"><i class="${!x.p.left?"out":r<=.3?"low":""}" style="width:${Math.round(r*100)}%"></i></div></div><strong style="font-variant-numeric:tabular-nums">+${x.need}</strong></li>`;}).join("")||'<li><span class="muted">Skåpet är fullt.</span></li>'}</ul>
       ${refill.length?`<button class="btn btn-ghost btn-sm" type="button" data-act="fillall" style="justify-self:start">Fyll alla till max</button>`:""}</div>
      <div class="panel"><div class="panel-head"><h2>Skåpet just nu</h2><button class="btn btn-ghost btn-sm" type="button" data-tab="skapet">Ändra lager →</button></div>
       <a class="shelves" href="#skapet" aria-label="Visa skåpsidan">${shelves()}</a>
       <div class="facts">${cabFacts()}</div></div></div>`;
  }else if(aTab==="skapet"){
    body=`<div class="ahead"><div><p>Ändra antal när du fyller på eller när något tar slut</p><h1>Skåpet</h1></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-olive btn-sm" type="button" data-act="refilled">Markera påfyllt nu</button></div></div>
     <div class="panel"><div class="panel-head"><h2>Lager</h2><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" type="button" data-act="fillall">Fyll alla</button><button class="btn btn-ghost btn-sm" type="button" data-act="emptyall">Töm alla</button></div></div>
      <ul class="list">${cabItems().map(p=>`<li><div class="nm">${esc(p.name)}<small>${kr(p.price)} · plats för ${p.cap} st</small></div><div class="stepper"><button type="button" aria-label="Minska ${esc(p.name)}" data-act="dec" data-id="${p.id}">−</button><output>${p.left}</output><button type="button" aria-label="Öka ${esc(p.name)}" data-act="inc" data-id="${p.id}">+</button></div></li>`).join("")||'<li><span class="muted">Inga varor ligger i skåpet. Slå på "I skåpet" under Sortiment.</span></li>'}</ul></div>
     <div class="panel"><div class="panel-head"><h2>Skåpets status</h2></div><div class="sw-wrap" style="justify-content:space-between"><span>${S.cabinet.open?"Skåpet visas som öppet":"Skåpet visas som stängt"}</span><button class="switch" type="button" role="switch" aria-checked="${S.cabinet.open}" aria-label="Skåpet öppet" data-act="toggleopen"></button></div>
      <div class="field"><label for="cab-next">Nästa påfyllning</label><input id="cab-next" data-cf="nextRefill" value="${esc(S.cabinet.nextRefill)}"></div></div>`;
  }else if(aTab==="sortiment"){
    body=`<div class="ahead"><div><p>Lägg till, ändra eller ta bort. Slå av "I skåpet" för varor som bara går att beställa.</p><h1>Sortiment</h1></div><button class="btn btn-ink btn-sm" type="button" data-act="add">+ Lägg till vara</button></div>
     ${CATS.map(c=>{const l=S.products.filter(p=>p.cat===c.id);return `<div class="panel"><div class="panel-head"><h2>${c.name}</h2><span class="small">${l.length} sorter</span></div>
      ${l.map(p=>`<div class="mrow"><div class="inv-ico" style="width:44px;height:44px">${ico(p.cat,22)}</div><div class="nm">${esc(p.name)}<small>${kr(p.price)}${p.tag?` · ${esc(p.tag)}`:""} · ${esc(p.desc)}</small></div>
        <div class="m-actions"><span class="sw-wrap"><button class="switch" type="button" role="switch" aria-checked="${p.inCab}" aria-label="${esc(p.name)} i skåpet" data-act="togglecab" data-id="${p.id}"></button>I skåpet</span>
         <button type="button" data-act="edit" data-id="${p.id}">Ändra</button><button type="button" class="danger${armDel===p.id?" arm":""}" data-act="del" data-id="${p.id}">${armDel===p.id?"Säker?":"Ta bort"}</button></div></div>`).join("")||'<p class="muted">Inga sorter.</p>'}</div>`;}).join("")}`;
  }else{
    const c=S.cabinet;
    body=`<div class="ahead"><div><p>Det här ser besökarna på skåpsidan och i sidfoten</p><h1>Info &amp; kontakt</h1></div></div>
     <div class="acols"><div class="panel"><h2>Skåpets plats</h2>
      <div class="field"><label for="cab-street">Gatuadress</label><input id="cab-street" data-cf="street" value="${esc(c.street)}"></div>
      <div class="field"><label for="cab-city">Postnummer och ort</label><input id="cab-city" data-cf="city" value="${esc(c.city)}"></div>
      <div class="field"><label for="cab-place">Var exakt står skåpet?</label><textarea id="cab-place" data-cf="place">${esc(c.place)}</textarea></div>
      <div class="field"><label for="cab-maps">Länk till Google Maps</label><input id="cab-maps" type="url" data-cf="maps" value="${esc(c.maps)}"></div>
      <div class="field"><label for="cab-swish">Swishnummer</label><input id="cab-swish" data-cf="swish" value="${esc(c.swish)}"></div></div>
     <div class="panel"><h2>Kontakt och om oss</h2>
      <div class="field"><label for="ct-email">E-post</label><input id="ct-email" data-ct="email" value="${esc(S.contact.email)}"></div>
      <div class="field"><label for="ct-phone">Telefon</label><input id="ct-phone" data-ct="phone" value="${esc(S.contact.phone)}"></div>
      <div class="field"><label for="ct-ig">Instagram-länk</label><input id="ct-ig" type="url" data-ct="instagram" value="${esc(S.contact.instagram)}"></div>
      <div class="field"><label for="about">Text om oss</label><textarea id="about" data-about="1" style="min-height:160px">${esc(S.about)}</textarea></div></div></div>`;
  }
  return `<div class="admin"><aside class="side"><a class="logo" href="#hem"><span class="mark">${ico("om",20)}</span><span>Exempelbageri <small>Admin</small></span></a>
    <div class="side-nav" role="tablist">${tabs.map(([k,l,n])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${aTab===k}">${l}${n?`<span class="count">${n}</span>`:""}</button>`).join("")}</div>
    <div class="side-foot"><a href="#hem">← Till hemsidan</a></div></aside>
   <div class="amain">${body}
    <div class="savebar"><span>${saveMsg?esc(saveMsg):dirty?"Du har osparade ändringar":"Allt är sparat"}</span><span style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" type="button" data-act="reset"${dirty?"":" disabled"}>Ångra</button><button class="btn btn-grab btn-sm" type="button" data-act="save"${dirty?"":" disabled"}>Spara</button></span></div>
   </div></div>`;
}
function editSheet(){
  const p=S.products.find(x=>x.id===editId); if(!p)return "";
  return `<div class="overlay" id="ed-ov" role="dialog" aria-modal="true" aria-labelledby="ed-title"><div class="sheet"><button class="close" type="button" data-close aria-label="Stäng">✕</button>
   <div class="ed"><h2 id="ed-title">Ändra vara</h2>
    <div class="field"><label for="e-name">Namn</label><input id="e-name" data-e="name" value="${esc(p.name)}"></div>
    <div class="row2"><div class="field"><label for="e-cat">Kategori</label><select id="e-cat" data-e="cat">${CATS.map(c=>`<option value="${c.id}"${c.id===p.cat?" selected":""}>${c.name}</option>`).join("")}</select></div>
     <div class="field"><label for="e-price">Pris (kr)</label><input id="e-price" type="number" min="0" inputmode="numeric" data-e="price" value="${p.price}"></div></div>
    <div class="field"><label for="e-desc">Beskrivning</label><input id="e-desc" data-e="desc" value="${esc(p.desc)}"></div>
    <div class="field"><label for="e-ingr">Ingredienser</label><textarea id="e-ingr" data-e="ingr">${esc(p.ingr)}</textarea></div>
    <div class="field"><span class="flabel">Allergener</span><div class="pick">${ALLERGENS.map(a=>`<button type="button" data-eal="${a}" aria-pressed="${p.al.includes(a)}">${a}</button>`).join("")}</div></div>
    <div class="row2"><div class="field"><label for="e-tag">Etikett</label><select id="e-tag" data-e="tag"><option value="">Ingen</option>${["Bästsäljare","Nyhet"].map(t=>`<option${p.tag===t?" selected":""}>${t}</option>`).join("")}</select></div>
     <div class="field"><label for="e-cap">Platser i skåpet</label><input id="e-cap" type="number" min="1" inputmode="numeric" data-e="cap" value="${p.cap}"></div></div>
    <div class="ed-actions"><button class="btn btn-ink" type="button" data-close>Klar</button></div>
    <p class="small">Ändringarna sparas när du trycker Spara längst ner.</p></div></div></div>`;
}

/* ---------- routing & render ---------- */
const ROUTES=["hem","sortiment","skapet","bestall","om-oss","admin",...CATS.map(c=>c.id)];
function route(){const h=location.hash.slice(1);return ROUTES.includes(h)?h:"hem";}
function render(keep){
  const r=route(); let page;
  if(r==="hem")page=pageHome();else if(r==="sortiment")page=pageAll();else if(r==="skapet")page=pageCab();else if(r==="bestall")page=pageOrder();
  else if(r==="om-oss")page=pageAbout();else if(r==="admin")page=pageAdmin();else page=pageCat(r);
  const y=window.scrollY;
  const adminView=r==="admin"&&canEdit;
  root.innerHTML=(adminView?"":header()+menu())+`<main>${page}</main>`+(adminView?"":footer()+fab(r))+infoSheet()+editSheet();
  document.body.style.overflow=(menuOpen||infoId||editId)?"hidden":"";
  if(keep)window.scrollTo(0,y);
}
window.addEventListener("hashchange",()=>{menuOpen=false;infoId=null;editId=null;armDel=null;render();window.scrollTo(0,0);});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(infoId||editId){infoId=null;editId=null;render(true);}else if(menuOpen){menuOpen=false;render(true);}});

root.addEventListener("click",e=>{
  const ov=e.target.classList&&e.target.classList.contains("overlay");
  if(ov){infoId=null;editId=null;render(true);return;}
  const t=e.target.closest("button,a"); if(!t)return;
  if(t.id==="menu-btn"){menuOpen=!menuOpen;render(true);return;}
  if(t.hasAttribute("data-open-menu")){menuOpen=true;render(true);return;}
  if(t.matches(".split-menu a")&&t.getAttribute("href")===location.hash){menuOpen=false;render();return;}
  if(t.hasAttribute("data-close")){infoId=null;editId=null;render(true);return;}
  if(t.dataset.info){infoId=t.dataset.info;render(true);return;}
  if(t.dataset.filter){filter=t.dataset.filter;render(true);return;}
  if(t.dataset.calc){const p=S.products.find(x=>x.id===t.dataset.id);if(!p)return;calc[p.id]=Math.max(0,Math.min(p.left,(calc[p.id]||0)+Number(t.dataset.calc)));render(true);return;}
  if(t.id==="copy-btn"){copy(S.cabinet.swish.replace(/\s/g,""),"Swishnumret är kopierat",document.getElementById("swish-no"));return;}
  if(t.id==="copy-order"){copy(orderText,"Texten är kopierad",document.getElementById("order-text"));return;}
  if(t.id==="copy-mail"){copy(S.contact.email,"E-postadressen är kopierad",null);return;}
  if(t.dataset.occ){orderSel.occ=t.dataset.occ;keepForm(()=>render(true));return;}
  if(t.dataset.oitem){const n=t.dataset.oitem;orderSel.items=orderSel.items.includes(n)?orderSel.items.filter(x=>x!==n):[...orderSel.items,n];keepForm(()=>render(true));return;}
  if(t.dataset.tab){aTab=t.dataset.tab;armDel=null;render();window.scrollTo(0,0);return;}
  if(t.dataset.eal){const p=S.products.find(x=>x.id===editId);if(!p)return;const a=t.dataset.eal;p.al=p.al.includes(a)?p.al.filter(x=>x!==a):[...p.al,a];mark();return;}
  const a=t.dataset.act; if(!a)return;
  const p=S.products.find(x=>x.id===t.dataset.id);
  if(a==="clearcalc"){calc={};render(true);return;}
  if(a==="inc"&&p){p.left=Math.min(p.cap,p.left+1);}
  else if(a==="dec"&&p){p.left=Math.max(0,p.left-1);}
  else if(a==="fillall"){cabItems().forEach(x=>x.left=x.cap);}
  else if(a==="emptyall"){cabItems().forEach(x=>x.left=0);}
  else if(a==="refilled"){S.cabinet.refilledAt=new Date().toISOString();toast("Påfyllning markerad");}
  else if(a==="toggleopen"){S.cabinet.open=!S.cabinet.open;}
  else if(a==="togglecab"&&p){p.inCab=!p.inCab;if(!p.inCab)p.left=0;}
  else if(a==="edit"&&p){editId=p.id;render(true);return;}
  else if(a==="del"&&p){if(armDel!==p.id){armDel=p.id;render(true);return;}S.products=S.products.filter(x=>x.id!==p.id);armDel=null;}
  else if(a==="add"){const n={id:"p"+Date.now().toString(36),cat:"kakor",name:"Ny vara",price:0,desc:"",ingr:"",al:[],tag:"",inCab:false,left:0,cap:6};S.products.push(n);editId=n.id;}
  else if(a==="reset"){S=JSON.parse(JSON.stringify(saved));S.products.forEach(p=>{p.al=p.al||[];p.ingr=p.ingr||"";p.tag=p.tag||"";});dirty=false;saveMsg="";render(true);return;}
  else if(a==="save"){save();return;}
  else return;
  mark();
});
function mark(){dirty=true;saveMsg="";render(true);}
function keepForm(fn){
  const ids=["o-name","o-phone","o-date","o-guests","o-msg"];const v={};ids.forEach(i=>{const el=document.getElementById(i);if(el)v[i]=el.value;});
  fn();ids.forEach(i=>{const el=document.getElementById(i);if(el&&v[i]!=null)el.value=v[i];});
}
root.addEventListener("submit",e=>{
  if(e.target.id!=="order-form")return; e.preventDefault();
  const g=i=>(document.getElementById(i)||{}).value?.trim()||"";
  const v={name:g("o-name"),phone:g("o-phone"),date:g("o-date"),guests:g("o-guests"),msg:g("o-msg")};
  if(!v.name||!v.phone||!v.date){orderErr="Fyll i namn, telefon och datum så att vi kan svara dig.";orderText="";}
  else if(new Date(v.date)<new Date(Date.now()+2.5*864e5)){orderErr="Välj ett datum minst tre dagar fram.";orderText="";}
  else if(!orderSel.items.length&&!v.msg){orderErr="Välj vad du vill ha eller skriv det under Övrigt.";orderText="";}
  else{orderErr="";const d=new Date(v.date).toLocaleDateString("sv-SE",{weekday:"long",day:"numeric",month:"long"});
    orderText=`Hej Exempelbageri!\n\nJag vill beställa till ${orderSel.occ.toLowerCase()} ${d}${v.guests?` för ca ${v.guests} personer`:""}.\nVill ha: ${orderSel.items.join(", ")||"se nedan"}\n${v.msg?`\nÖvrigt: ${v.msg}\n`:""}\nNamn: ${v.name}\nTelefon: ${v.phone}`;}
  keepForm(()=>render(true));
  const r=document.querySelector(".result,.err");if(r)r.scrollIntoView({block:"nearest",behavior:"smooth"});
});
root.addEventListener("input",e=>{
  const el=e.target; let changed=false, rerender=false;
  if(el.dataset.e){const p=S.products.find(x=>x.id===editId);if(!p)return;const f=el.dataset.e;
    if(f==="price"||f==="cap"){p[f]=Math.max(f==="cap"?1:0,parseInt(el.value,10)||0);if(f==="cap")p.left=Math.min(p.left,p.cap);}else p[f]=el.value;
    changed=true;rerender=el.tagName==="SELECT";}
  else if(el.dataset.cf){S.cabinet[el.dataset.cf]=el.value;changed=true;}
  else if(el.dataset.ct){S.contact[el.dataset.ct]=el.value;changed=true;}
  else if(el.dataset.about){S.about=el.value;changed=true;}
  if(!changed)return;
  saveMsg="";
  if(!dirty||rerender){dirty=true;const id=el.id;render(true);const n=document.getElementById(id);if(n&&n.tagName!=="SELECT"){n.focus();try{n.setSelectionRange(n.value.length,n.value.length);}catch(_){}}}
});
function copy(text,msg,el){
  const fallback=()=>{if(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Markerat. Kopiera manuellt.");}else toast(text);};
  try{navigator.clipboard.writeText(text).then(()=>toast(msg),fallback);}catch(_){fallback();}
}

/* ---------- save: rebuild the whole page from state ---------- */
const RESET=':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
function buildDoc(state){
  const css=document.getElementById("app-style").textContent;
  const js=document.getElementById("app-script").textContent;
  const json=JSON.stringify(state).replace(/</g,"\\u003c");
  const SC="script";
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>'+RESET+'</style></head><body>'
   +'<title>Exempelbageri</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
   +'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@400;500;600;700&display=swap">\n'
   +'<style id="app-style">'+css+'</style>\n\n<div id="root"></div>\n\n'
   +'<'+SC+' type="application/json" id="state">'+json+'</'+SC+'>\n\n'
   +'<'+SC+' id="app-script">'+js+'</'+SC+'>\n</body></html>';
}
async function save(){
  if(!artifactApi){saveMsg="Det går inte att spara i den här vyn.";render(true);return;}
  saveMsg="Sparar…";render(true);
  try{await artifactApi.publish(buildDoc(S));saveMsg="Sparat";render(true);}
  catch(err){const c=err&&err.code;
    if(c==="conflict")saveMsg="Någon annan sparade samtidigt. Sidan laddas om med den nya versionen.";
    else if(c==="not_writer"||c==="not_granted"||c==="consent_required"){canEdit=false;saveMsg="";}
    else if(c==="rate_limited")saveMsg="Du sparar för ofta. Vänta en stund och försök igen.";
    else if(c==="too_large")saveMsg="Sidan blev för stor. Ta bort några varor.";
    else saveMsg="Det gick inte att spara just nu. Försök igen om en stund.";
    render(true);}
}

render();
(async()=>{
  try{
    const [u,a]=await Promise.all([window.claude?.use?.("user"),window.claude?.use?.("artifact")]);
    artifactApi=a||null;
    canEdit=!!(a&&u&&await u.canEdit());
  }catch(_){artifactApi=null;canEdit=false;}
  render(true);
})();
})();
