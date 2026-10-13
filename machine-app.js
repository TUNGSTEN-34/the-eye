(() => {
  const KEY = "eye-analyst-machine-demo-v1";
  const initialStock = [
    {id:"tractor-basic",name:"Compact Farm Tractor",category:"Agricultural",tier:"Entry tier",price:250000,rate:0.10,stock:8,description:"Compact equipment for small-farm work."},
    {id:"tractor-pro",name:"Utility Farm Tractor",category:"Agricultural",tier:"Professional tier",price:650000,rate:0.15,stock:5,description:"Higher-capacity tractor category tier."},
    {id:"harvester",name:"Crop Harvester",category:"Agricultural",tier:"Premium tier",price:1200000,rate:0.18,stock:3,description:"Harvesting equipment, premium price tier."},
    {id:"water-pump",name:"Irrigation Water Pump",category:"Irrigation",tier:"Entry tier",price:120000,rate:0.08,stock:12,description:"Water movement and irrigation equipment."},
    {id:"solar-pump",name:"Solar Irrigation Pump",category:"Irrigation",tier:"Premium tier",price:480000,rate:0.12,stock:6,description:"Solar-powered irrigation equipment."},
    {id:"generator",name:"Portable Generator",category:"Power",tier:"Standard tier",price:300000,rate:0.09,stock:7,description:"Portable power equipment."}
  ];
  const fmt = n => new Intl.NumberFormat("en-UG",{style:"currency",currency:"UGX",maximumFractionDigits:0}).format(n);
  const read = () => { try { const d=JSON.parse(localStorage.getItem(KEY)||"null"); if(d&&Array.isArray(d.stock)&&Array.isArray(d.owned)&&Array.isArray(d.history)&&Number.isSafeInteger(d.balance)) return d; } catch(e) {} return {stock:initialStock.map(x=>({...x})),owned:[],history:[],balance:0}; };
  let data = read();
  const save = () => localStorage.setItem(KEY,JSON.stringify(data));
  const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const elapsedDays = date => Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/86400000));
  const earned = item => Math.floor(item.price*(item.rate/100)*elapsedDays(item.assignedAt));
  const history = (type,details,amount=0) => data.history.push({type,details,amount,at:new Date().toISOString()});
  function renderStock(){
    const host=document.getElementById("machine-stock"); if(!host)return;
    const b=document.getElementById("stock-balance"); if(b)b.textContent=fmt(data.balance);
    host.innerHTML=data.stock.map(m=>`<article class="card"><span class="tag">${escapeHTML(m.category)} · ${escapeHTML(m.tier)}</span><h3>${escapeHTML(m.name)}</h3><p>${escapeHTML(m.description)}</p><div class="project-meta"><span>Price: ${fmt(m.price)}</span><span>Demo rate: ${Number(m.rate).toFixed(2)}% / day</span><span>Available: ${m.stock}</span></div><p class="muted">Illustrative simple-interest estimate: ${fmt(Math.floor(m.price*m.rate/100))} per day before any costs or conditions.</p><button class="btn btn-primary" data-buy="${m.id}" ${m.stock<1||data.balance<m.price?"disabled":""}>${m.stock<1?"Out of stock":data.balance<m.price?"Insufficient demo balance":"Assign to my account"}</button></article>`).join("");
    host.querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>buy(btn.dataset.buy)));
  }
  function buy(id){
    const m=data.stock.find(x=>x.id===id); if(!m||m.stock<1||data.balance<m.price)return;
    data.balance-=m.price;m.stock-=1;
    const item={id:m.id,name:m.name,category:m.category,tier:m.tier,price:m.price,rate:m.rate,assignedAt:new Date().toISOString(),instanceId:Date.now()+"-"+Math.random().toString(36).slice(2,8)};
    data.owned.push(item);history("machine_assigned",m.name+" assigned to demo account",m.price);save();renderStock();renderAccount();renderAdmin();
  }
  function renderAccount(){
    const host=document.getElementById("my-machines");if(!host)return;
    document.getElementById("account-balance").textContent=fmt(data.balance);
    document.getElementById("machine-count").textContent=String(data.owned.length);
    host.innerHTML=data.owned.length?data.owned.map(m=>{const days=elapsedDays(m.assignedAt);return `<div class="ledger-row"><div><strong>${escapeHTML(m.name)}</strong><br><span class="muted">${escapeHTML(m.category)} · ${escapeHTML(m.tier)} · Assigned ${new Date(m.assignedAt).toLocaleDateString()}</span><br><span class="muted">Price ${fmt(m.price)} · Demo rate ${Number(m.rate).toFixed(2)}% per day · ${days} elapsed day(s)</span></div><strong class="ledger-credit">Estimate: ${fmt(earned(m))}</strong></div>`}).join(""):'<p class="muted">No machines assigned yet. Browse the stock and choose a machine to test the workflow.</p>';
    const h=document.getElementById("machine-history");if(h)h.innerHTML=data.history.length?[...data.history].reverse().map(x=>`<div class="ledger-row"><div><strong>${escapeHTML(x.type.replaceAll("_"," "))}</strong><br><span class="muted">${escapeHTML(x.details)} · ${new Date(x.at).toLocaleString()}</span></div><strong>${x.amount?fmt(x.amount):""}</strong></div>`).join(""):'<p class="muted">No activity yet.</p>';
  }
  function renderAdmin(){
    const list=document.getElementById("admin-stock");if(list)list.innerHTML=data.stock.map(m=>`<div class="ledger-row"><div><strong>${escapeHTML(m.name)}</strong><br><span class="muted">${escapeHTML(m.category)} · ${escapeHTML(m.tier)} · ${m.stock} in stock</span></div><strong>${fmt(m.price)} · ${Number(m.rate).toFixed(2)}%/day</strong></div>`).join("");
    const select=document.getElementById("rate-machine");if(select){const previous=select.value;select.innerHTML=data.stock.map(m=>`<option value="${m.id}">${escapeHTML(m.name)} — ${escapeHTML(m.tier)}</option>`).join("");if(data.stock.some(m=>m.id===previous))select.value=previous;setRateField();}
  }
  function setRateField(){const sel=document.getElementById("rate-machine"),input=document.getElementById("rate-value");if(sel&&input){const m=data.stock.find(x=>x.id===sel.value);if(m)input.value=m.rate;}}
  const creditForm=document.getElementById("demo-credit-form");if(creditForm)creditForm.addEventListener("submit",e=>{e.preventDefault();const input=document.getElementById("credit-amount"),amount=Number(input.value);if(!Number.isSafeInteger(amount)||amount<=0)return;data.balance+=amount;history("virtual_credit","Owner demo credit (local only)",amount);save();creditForm.reset();document.getElementById("admin-message").textContent="Virtual demo balance updated in this browser only.";renderStock();renderAccount();renderAdmin();});
  const rateForm=document.getElementById("rate-form");if(rateForm){document.getElementById("rate-machine").addEventListener("change",setRateField);rateForm.addEventListener("submit",e=>{e.preventDefault();const m=data.stock.find(x=>x.id===document.getElementById("rate-machine").value),rate=Number(document.getElementById("rate-value").value);if(!m||!Number.isFinite(rate)||rate<0||rate>100)return;const old=m.rate;m.rate=rate;data.owned.filter(x=>x.id===m.id).forEach(x=>{x.rate=rate;});history("rate_changed",m.name+" demo rate changed from "+old+"% to "+rate+"% per day");save();document.getElementById("admin-message").textContent="Illustrative demo rate saved locally.";renderStock();renderAccount();renderAdmin();});}
  renderStock();renderAccount();renderAdmin();
})();