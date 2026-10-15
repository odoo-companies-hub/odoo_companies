!function(){
  const flags={India:"🇮🇳","United States":"🇺🇸","United Kingdom":"🇬🇧",Germany:"🇩🇪","United Arab Emirates":"🇦🇪",Canada:"🇨🇦",Netherlands:"🇳🇱",Australia:"🇦🇺",France:"🇫🇷",Belgium:"🇧🇪",Brazil:"🇧🇷",Spain:"🇪🇸",Italy:"🇮🇹",Mexico:"🇲🇽","Saudi Arabia":"🇸🇦",Egypt:"🇪🇬"};
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function norm(s){return s.replace(/\s*\/\s*/g,"/").trim()}
  function label(s){return s.replace(/\//g," / ")}
  function sizeBucket(avgStr){
    const n=parseInt((avgStr||"").replace(/\D/g,""),10)||0;
    if(n>=100)return"large";
    if(n>=20)return"medium";
    return"small"
  }

  const indSel=document.getElementById("q-industry"),
        countrySel=document.getElementById("q-country"),
        sizeSel=document.getElementById("q-size"),
        tierSel=document.getElementById("q-tier"),
        submitBtn=document.getElementById("q-submit"),
        resultsWrap=document.getElementById("match-results"),
        grid=document.getElementById("match-grid"),
        heading=document.getElementById("match-heading"),
        sub=document.getElementById("match-sub");

  if(!indSel||typeof PARTNERS==="undefined")return;

  const industrySet=new Set();
  Object.values(PARTNER_STATS||{}).forEach(s=>(s.industries||[]).forEach(i=>industrySet.add(norm(i.name))));
  [...industrySet].sort().forEach(key=>{
    const o=document.createElement("option");
    o.value=key;o.textContent=label(key);indSel.appendChild(o)
  });

  const countries=[...new Set(PARTNERS.map(p=>p.country))].sort();
  countries.forEach(c=>{
    const o=document.createElement("option");
    o.value=c;o.textContent=`${flags[c]||""} ${c}`.trim();countrySel.appendChild(o)
  });

  function scorePartner(p,industry,size,tier,country){
    const s=(PARTNER_STATS||{})[p.path];
    if(!s)return null;
    let sc=0;const reasons=[];
    if(industry){
      const m=(s.industries||[]).find(i=>norm(i.name)===industry);
      if(m){sc+=m.count*3;reasons.push(`${m.count} ${label(industry)} project${m.count===1?"":"s"} on record`)}
    }
    if(size){
      const b=sizeBucket(s.referenceSizes&&s.referenceSizes.average);
      if(b===size){sc+=15;reasons.push(`Typical project size matches yours (avg ${s.referenceSizes.average})`)}
    }
    if(tier){
      if(p.tier===tier){sc+=10;reasons.push(`${tier} tier partner`)}
    }
    if(country){
      if(p.country===country){sc+=8;reasons.push(`Based in ${country}`)}
    }
    if(s.customerRetention)sc+=Math.min(s.customerRetention,100)/20;
    if(s.totalReferences)sc+=Math.min(s.totalReferences,200)/40;
    if(s.customerRetention)reasons.push(`${s.customerRetention}% client retention`);
    if(s.totalReferences)reasons.push(`${s.totalReferences} total projects`);
    return{sc,reasons:reasons.slice(0,3)}
  }

  function runMatch(){
    const industry=indSel.value,size=sizeSel.value,tier=tierSel.value,country=countrySel.value;
    const scored=PARTNERS.map(p=>{
      const r=scorePartner(p,industry,size,tier,country);
      return r?{p,sc:r.sc,reasons:r.reasons}:null
    }).filter(Boolean).sort((a,b)=>b.sc-a.sc).slice(0,6);

    resultsWrap.hidden=false;
    if(!scored.length){
      grid.innerHTML="";
      sub.textContent="No partners with published project data matched — try widening your filters.";
      resultsWrap.scrollIntoView({behavior:"smooth"});
      return
    }
    const anyFilter=industry||size||tier||country;
    sub.textContent=anyFilter
      ?`Ranked by fit to your answers, using each partner's own published project data.`
      :`No filters selected — showing the highest client-retention, most-active partners overall.`;
    grid.innerHTML=scored.map(({p,reasons})=>`
      <div class="card ${p.tier}">
        <h3>${esc(p.name)}</h3>
        <div class="meta">
          <span class="badge ${p.tier}">${p.tier} Partner</span>
          <span class="country-chip">${flags[p.country]||""} ${esc(p.country)}</span>
        </div>
        <ul class="match-reasons">${reasons.map(r=>`<li>${esc(r)}</li>`).join("")}</ul>
        <div class="contact">
          ${p.phone?`<a href="tel:${esc(p.phone.replace(/[^+\d]/g,""))}">📞 ${esc(p.phone)}</a>`:""}
          ${p.email?`<a href="mailto:${esc(p.email)}">✉️ ${esc(p.email)}</a>`:""}
          ${p.website?`<a href="${esc(p.website.startsWith("http")?p.website:"https://"+p.website)}" target="_blank" rel="noopener">🌐 Website</a>`:""}
        </div>
        <a class="profile-link" href="index.html?q=${encodeURIComponent(p.name)}">View in directory →</a>
      </div>
    `).join("");
    resultsWrap.scrollIntoView({behavior:"smooth"})
  }

  submitBtn.addEventListener("click",runMatch)
}();
