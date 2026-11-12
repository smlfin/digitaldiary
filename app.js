(()=>{
const C=window.DD_CONFIG,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const LS=(k,v)=>v===undefined?JSON.parse(localStorage.getItem(k)||'null'):localStorage.setItem(k,JSON.stringify(v));
const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN'),pct=(a,b)=>b?Math.round(a*100/b):0,d10=s=>String(s||'').replace(/\D/g,'').slice(-10);
const toast=(m,bad)=>{const t=$('#toast');t.textContent=m;t.className=bad?'bad show':'show';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',3500)};
const post=async b=>(await fetch(C.API,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(b)})).json();
const get=async p=>(await fetch(C.API+'?'+new URLSearchParams(p))).json();
const opts=a=>a.map(x=>`<option>${x}</option>`).join('');
const PRODUCTS=['RD','FD','NCD','SUB DEBT','NIDHI','OTHER'],STATUS=['Hot','Warm','Cold'];
const JOBS=['Business','Private Sector','Government Service','Retired Government','Retired Private Sector','NRI','Doctors','Others'];
const CIRCLE=['Friends','Family','Neighbours','Former Colleagues','New Customer'];
const DIST=['Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam','Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'];
$('#branches').innerHTML=opts(C.BRANCHES);$('#districts').innerHTML=opts(DIST);

/* ---------- ENTRY FORM ---------- */
const F=[['Staff',[['branch','Branch','text',{list:'branches',req:1}],['emp','Employee name','text',{req:1}],['code','Employee code','text',{req:1}]]],
['Customer',[['name','Customer name','text',{req:1}],['phone','Phone (10 digits)','tel',{req:1}],['addr','Address','text'],['place','Street / Place','text'],['district','District','text',{list:'districts'}],['pin','Pincode','tel']]],
['Work & income',[['jobcat','Job category','select',{o:JOBS}],['jobdet','Job details','text'],['income','Avg monthly income (₹)','number']]],
['Family',[['bday','Birthday','date'],['wedding','Wedding day','date'],['age','Approx. age','number'],['spouse','Husband / Wife name','text'],['spousejob','Husband / Wife job','text'],['kids','Children name(s)','text'],['kidsdet','Children details','text']]],
['Lead',[['profile','Customer profile','select',{o:['High','Medium','Low']}],['circle','Close circle contact?','select',{o:CIRCLE}],['relation','Description & relation','text'],['product','Product discussed *','chips',{o:PRODUCTS}],['closed','Closed amount (₹)','number'],['visits','Visits completed','number'],['v1','First visit date','date'],['status','Lead status','select',{o:STATUS,req:1}],['r1','Remark','textarea']]]];
const fld=([k,l,t,o={}])=>{const a=`name="${k}" id="f_${k}"${o.req?' required':''}`;
 const i=t=='select'?`<select ${a}><option value="">—</option>${opts(o.o)}</select>`:t=='textarea'?`<textarea ${a} rows="2"></textarea>`:
 t=='chips'?`<div class="chips">${o.o.map(x=>`<label><input type="checkbox" name="${k}" value="${x}"><span>${x}</span></label>`).join('')}</div>`:
 `<input type="${t}" ${a}${o.list?` list="${o.list}"`:''}${t=='number'?' min="0" inputmode="numeric"':''}${t=='tel'?' inputmode="tel"':''} autocomplete="off">`;
 return `<div class="fld${t=='textarea'||t=='chips'?' w':''}"><label class="l" for="f_${k}">${l}${o.req?' *':''}</label>${i}</div>`};
$('#f').innerHTML=F.map(([t,a])=>`<fieldset><legend>${t}</legend><div class="g">${a.map(fld).join('')}</div></fieldset>`).join('')+'<div class="sub"><button id="sv">Save lead</button></div>';
const me=()=>LS('dd_me')||{},fillMe=()=>{const m=me();['branch','emp','code'].forEach(k=>$('#f_'+k).value=m[k]||'')};fillMe();
const prep=()=>{const d={};new FormData($('#f')).forEach((v,k)=>d[k]=k in d?d[k]+', '+v:v.trim());
 ['income','age','closed','visits'].forEach(k=>d[k]=d[k]===''||d[k]==null?'':+d[k]);
 if(!d.age&&d.bday){d.age=Math.floor((Date.now()-new Date(d.bday))/315576e5)}return d};
const validate=d=>!d.branch||!d.emp||!d.code?'Fill branch, employee name and code':!d.name?'Customer name is required':d10(d.phone).length!=10?'Enter a valid 10-digit phone number':
 d.pin&&!/^\d{6}$/.test(d.pin)?'Pincode must be 6 digits':d.age&&(d.age<18||d.age>110)?'Age looks wrong':!d.product?'Select product discussed':!d.status?'Select lead status':'';
$('#f').onsubmit=async e=>{e.preventDefault();const d=prep(),er=validate(d);if(er)return toast(er,1);
 LS('dd_me',{branch:d.branch,emp:d.emp,code:d.code});const b=$('#sv');b.disabled=true;
 try{let r=await post({action:'add',key:C.STAFF_KEY,data:d});
  if(r.dup){if(!confirm(`This phone was already captured: ${r.dup.name} by ${r.dup.emp} (${r.dup.branch}) on ${r.dup.ts}.\nSave again anyway?`))return;r=await post({action:'add',key:C.STAFF_KEY,data:d,force:1})}
  if(!r.ok)throw Error(r.error);done('Lead saved ✓')}
 catch(x){if(x instanceof TypeError){LS('dd_q',[...Q(),d]);badge();done('No network — saved on this device, will sync automatically')}else toast(x.message,1)}
 finally{b.disabled=false}};
const done=m=>{$('#f').reset();fillMe();scrollTo(0,0);toast(m);MY=null};
/* offline queue */
const Q=()=>LS('dd_q')||[],badge=()=>$('#q').textContent=Q().length?Q().length+' pending sync':'';
async function flush(){const a=Q();if(!a.length||!navigator.onLine)return;const left=[];let ok=0;
 for(const d of a){try{const r=await post({action:'add',key:C.STAFF_KEY,data:d});r.ok||r.dup?ok++:left.push(d)}catch{left.push(d)}}
 LS('dd_q',left);badge();if(ok)toast(ok+' offline lead(s) synced')}
addEventListener('online',flush);badge();flush();

/* ---------- SHARED HELPERS ---------- */
const pd=s=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s||'');return m&&m[3]>=2000?new Date(m[3],m[2]-1,m[1]).getTime():null};
function amt(s){s=String(s||'');if(/^\s*(not closed|nil|zero|na|n\/a|-)?\s*$/i.test(s))return 0;let t=0;
 s.replace(/(\d[\d,]*\.?\d*)\s*(lakhs?|lacs?|l\b|k\b|cr)?/gi,(m,n,u)=>{n=parseFloat(n.replace(/,/g,''));u=(u||'').toLowerCase();t+=u=='k'?n*1e3:u[0]=='l'?n*1e5:u=='cr'?n*1e7:n;return m});return t}
const enrich=x=>{x.branch=(x.branch||'').trim().toUpperCase();x._emp=(x.emp||'').trim().toUpperCase();x._amt=amt(x.closed);x._closed=x._amt>0;
 x._vis=/more/i.test(x.visits)?5:parseInt(x.visits)||0;x._ts=pd(x.ts);const ds=['ts','v1','v2','v3','v4'].map(k=>pd(x[k])).filter(Boolean);
 x._last=ds.length?Math.max(...ds):null;x._days=x._last?Math.floor((Date.now()-x._last)/864e5):999;
 x._p=(x.product||'').toUpperCase().split(/[,/&+]|\band\b/i).map(s=>s.trim().replace(/^SD$|^SUB.?DEBT$/,'SUB DEBT')).filter(Boolean);
 const s=(x.status||'').trim();x.status=s?s[0].toUpperCase()+s.slice(1).toLowerCase():'Unknown';return x};

/* ---------- MY LEADS (password-protected) ---------- */
let MY=null,MF='All',BRS=null;const dlg=$('#dlg');
const sess=()=>{const t=LS('dd_tok');return t&&t.exp>Date.now()?t.t:null},setTok=t=>LS('dd_tok',t?{t,exp:Date.now()+5.5*36e5}:null);
const lock=m=>{setTok(null);MY=null;if(m)toast(m,1);loadMy()};
async function loadMy(){const box=$('#leads');if(!sess())return auth(box);if(MY)return drawMy();box.innerHTML='<p class="m">Loading…</p>';
 try{const r=await post({action:'myleads',key:C.STAFF_KEY,token:sess()});if(!r.ok)throw Error(r.error);MY=r.rows.map(enrich);drawMy()}
 catch(x){/session/i.test(x.message)?lock('Session expired — please log in again'):box.innerHTML=`<p class="m">${esc(x.message)}</p>`}}
async function auth(box){
 if(!BRS){box.innerHTML='<p class="m">Loading…</p>';try{const r=await post({action:'branches',key:C.STAFF_KEY});if(!r.ok)throw Error(r.error);BRS=r.branches}catch(x){return box.innerHTML=`<p class="m">${esc(x.message)}</p>`}}
 box.innerHTML=`<form class="au" id="a1"><h3 style="margin-top:0">Staff login</h3><label class="l">Branch</label><select name="branch" required><option value="">—</option>${opts(BRS)}</select><label class="l">Employee code</label><input name="code" required autocomplete="off" value="${esc(me().code||'')}"><div class="a"><button>Continue</button></div></form>`;
 $('#a1').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.code=d.code.trim();
  try{const r=await post({action:'lookup',key:C.STAFF_KEY,...d});if(!r.ok)throw Error(r.error);step2(box,d,r)}catch(x){toast(x.message,1)}}}
function step2(box,d,r){
 box.innerHTML=`<form class="au" id="a2"><h3 style="margin-top:0">Hello, ${esc(r.name)}</h3><p class="m">${r.hasPw?'Enter your password.':'First time here — set a password (min 6 characters).'}</p><input type="password" name="pw" placeholder="Password" minlength="6" required autocomplete="${r.hasPw?'current-password':'new-password'}">${r.hasPw?'':'<input type="password" name="pw2" placeholder="Confirm password" required autocomplete="new-password" style="margin-top:.5rem">'}<div class="a"><button type="button" class="o" id="ab">Not me</button><button>${r.hasPw?'Login':'Set password & login'}</button></div></form>`;
 $('#ab').onclick=()=>auth(box);
 $('#a2').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(!r.hasPw&&f.pw!==f.pw2)return toast('Passwords do not match',1);
  try{const x=await post({action:r.hasPw?'login':'setpw',key:C.STAFF_KEY,branch:d.branch,code:d.code,pw:f.pw});if(!x.ok)throw Error(x.error);setTok(x.token);LS('dd_me',{...me(),code:d.code});MY=null;loadMy()}catch(er){toast(er.message,1)}}}
function drawMy(){const box=$('#leads');
 box.innerHTML=`<div class="tb"><select id="mf">${['All','Hot','Warm','Cold','Due (14d+)'].map(o=>`<option${o==MF?' selected':''}>${o}</option>`).join('')}</select><input id="ms" placeholder="Search name / phone"><button class="o" id="mr">Refresh</button><button class="o" id="lo">Logout</button></div><div id="ml"></div>`;
 $('#mf').onchange=e=>{MF=e.target.value;list()};$('#ms').oninput=list;$('#mr').onclick=()=>{MY=null;loadMy()};
 $('#lo').onclick=()=>{post({action:'logout',key:C.STAFF_KEY,token:sess()}).catch(()=>0);lock()};list()}
function list(){const q=($('#ms').value||'').toLowerCase();
 const a=MY.filter(x=>(MF=='All'||x.status==MF||(MF[0]=='D'&&!x._closed&&x._days>=14))&&(x.name+x.phone).toLowerCase().includes(q)).sort((a,b)=>b._days-a._days);
 $('#ml').innerHTML=(a.map(x=>{const p=d10(x.phone);return`<article class="c ${x.status}"><div><b>${esc(x.name)}</b><span class="s s${x.status}">${x.status}</span>${x._closed?`<span class="s sC">Closed ${inr(x._amt)}</span>`:''}</div>
 <div class="m">${esc(x.product)} · ${x._vis} visit(s) · last touch ${x._days>900?'—':x._days+'d ago'}${x.place?' · '+esc(x.place):''}</div>
 <div class="a"><a href="tel:${p}">Call</a><a target="_blank" rel="noopener" href="https://wa.me/91${p}">WhatsApp</a><button data-r="${x._row}">Follow-up</button></div></article>`}).join(''))||'<p class="m">No leads.</p>'}
$('#leads').onclick=e=>{const b=e.target.closest('[data-r]');if(!b)return;const x=MY.find(y=>y._row==b.dataset.r);
 dlg.innerHTML=`<form id="ff"><h3 style="margin-top:0">${esc(x.name)}</h3><label>Visit date<input type="date" name="date" required value="${new Date().toLocaleDateString('en-CA')}"></label>
 <label>Remark<textarea name="remark" rows="3"></textarea></label><label>Status<select name="status">${STATUS.map(s=>`<option${s==x.status?' selected':''}>${s}</option>`).join('')}</select></label>
 <label>Closed amount (₹) — only if business closed<input type="number" name="closed" min="0"></label><div class="a"><button type="button" class="o" id="fx">Cancel</button><button>Save</button></div></form>`;
 dlg.showModal();$('#fx').onclick=()=>dlg.close();
 $('#ff').onsubmit=async ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target));
  try{const r=await post({action:'follow',key:C.STAFF_KEY,token:sess(),row:x._row,phone:x.phone,data:d});if(!r.ok)throw Error(r.error);dlg.close();toast('Follow-up saved ✓');MY=null;loadMy()}
  catch(er){if(/session/i.test(er.message)){dlg.close();lock('Session expired — please log in again')}else toast(er.message,1)}}};

/* ---------- REPORTS (admin) ---------- */
let ALL=[],PER=0,BR='';
async function loadRep(){const box=$('#reports');if(ALL.length)return;const k=sessionStorage.getItem('dd_admin')||prompt('Admin key');if(!k)return box.innerHTML='<p class="m">Admin key required.</p>';
 box.innerHTML='<p class="m">Loading…</p>';
 try{const r=await get({action:'list',key:k});if(!r.ok)throw Error(r.error);sessionStorage.setItem('dd_admin',k);ALL=r.rows.map(enrich);
  box.innerHTML=`<div class="tb"><select id="per"><option value="0">All time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><select id="br"><option value="">All branches</option>${opts([...new Set(ALL.map(x=>x.branch))].filter(Boolean).sort())}</select><button class="o" id="ex">Export CSV</button><button class="o" id="rl">Refresh</button></div><div id="rb"></div>`;
  $('#per').onchange=e=>{PER=+e.target.value;draw()};$('#br').onchange=e=>{BR=e.target.value;draw()};
  $('#rl').onclick=()=>{ALL=[];loadRep()};$('#ex').onclick=exp;draw()}
 catch(x){sessionStorage.removeItem('dd_admin');ALL=[];box.innerHTML=`<p class="m">${esc(x.message)}</p><button id="rr">Retry</button>`;$('#rr').onclick=loadRep}}
const cur=()=>ALL.filter(x=>(!PER||x._ts&&Date.now()-x._ts<PER*864e5)&&(!BR||x.branch==BR));
const agg=a=>{const c=a.filter(x=>x._closed),n=s=>a.filter(x=>x.status==s).length;return{n:a.length,c:c.length,v:c.reduce((s,x)=>s+x._amt,0),h:n('Hot'),w:n('Warm'),k:n('Cold')}};
const grp=(a,f)=>{const m=new Map();a.forEach(x=>[].concat(f(x)).forEach(k=>m.set(k,[...(m.get(k)||[]),x])));return m};
const T=(h,r)=>`<div class="tw"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${r.map(c=>`<tr>${c.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')||'<tr><td class="m">No data</td></tr>'}</tbody></table></div>`;
const bar=p=>`${p}%<div class="b"><i style="width:${Math.min(p,100)}%"></i></div>`;
const seg=(t,rows,f,key)=>{const g=[...grp(rows,f)].map(([k,a])=>[k,agg(a)]).sort(key?(a,b)=>String(a[0]).localeCompare(b[0]):(a,b)=>b[1].n-a[1].n);
 return`<h3>${t}</h3>`+T(['Segment','Leads','Closed','Conversion','Closed value'],g.map(([k,s])=>[esc(k||'—'),s.n,s.c,bar(pct(s.c,s.n)),inr(s.v)]))};
const nxt=s=>{const m=/^(\d{1,2})\/(\d{1,2})\//.exec(s||'');if(!m)return 999;const n=new Date(),y=n.getFullYear(),t=new Date(y,n.getMonth(),n.getDate());let d=new Date(y,m[2]-1,m[1]);if(d<t)d=new Date(y+1,m[2]-1,m[1]);return Math.round((d-t)/864e5)};
function draw(){const a=cur(),s=agg(a),open=a.filter(x=>!x._closed);
 const due=open.filter(x=>/^(Hot|Warm)$/.test(x.status)&&x._days>21).sort((p,q)=>(p.status>q.status)-(p.status<q.status)||q._days-p._days);
 const cl=a.filter(x=>x._closed),avgV=cl.length?(cl.reduce((t,x)=>t+x._vis,0)/cl.length).toFixed(1):'—';
 const bg=[...grp(a,x=>x.branch)].map(([k,v])=>[k,agg(v)]),pg=[...grp(a,x=>x._p)].map(([k,v])=>[k,agg(v)]);
 const best=(g,m)=>g.filter(([,v])=>v.n>=m).sort((p,q)=>pct(q[1].c,q[1].n)-pct(p[1].c,p[1].n))[0];
 const ins=[`Overall conversion is <b>${pct(s.c,s.n)}%</b> (${s.c} of ${s.n} leads closed, ${inr(s.v)}).`];
 const bb=best(bg,5),bp=best(pg,5);if(bb&&!BR)ins.push(`Best branch conversion: <b>${esc(bb[0])}</b> at ${pct(bb[1].c,bb[1].n)}%.`);
 if(bp)ins.push(`Highest-converting product: <b>${esc(bp[0])}</b> at ${pct(bp[1].c,bp[1].n)}%.`);
 if(due.length)ins.push(`<b>${due.length}</b> Hot/Warm leads have had no touch for 21+ days.`);
 const nv=open.filter(x=>!x._vis).length;if(nv)ins.push(`<b>${nv}</b> open leads have never had a recorded visit.`);
 const up=a.flatMap(x=>[['Birthday',x.bday],['Wedding',x.wedding]].map(([o,d])=>({x,o,d,n:nxt(d)}))).filter(r=>r.n<=14).sort((p,q)=>p.n-q.n);
 const eg=[...grp(a,x=>x._emp)].map(([k,v])=>[k,agg(v),v[0].branch]).sort((p,q)=>q[1].n-q[1].n).slice(0,15);
 $('#rb').innerHTML=`<div class="k">${[[s.n,'Leads'],[s.c,'Closed leads'],[pct(s.c,s.n)+'%','Conversion'],[inr(s.v),'Closed value'],[s.h,'Hot'],[due.length,'Overdue follow-ups'],[avgV,'Avg visits to close']].map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
 <ul class="ins">${ins.map(i=>`<li>${i}</li>`).join('')}</ul>
 <h3>Branches</h3>${T(['Branch','Leads','Hot','Warm','Cold','Closed','Conversion','Closed value'],bg.sort((p,q)=>q[1].n-p[1].n).map(([k,v])=>[esc(k),v.n,v.h,v.w,v.k,v.c,bar(pct(v.c,v.n)),inr(v.v)]))}
 <h3>Staff (top 15 by leads)</h3>${T(['Employee','Branch','Leads','Closed','Conversion','Closed value'],eg.map(([k,v,b])=>[esc(k),esc(b),v.n,v.c,bar(pct(v.c,v.n)),inr(v.v)]))}
 ${seg('Products (multi-product leads count in each)',a,x=>x._p)}${seg('Visit funnel',a,x=>x._vis>=4?'4+ visits':x._vis+' visits',1)}${seg('Job category',a,x=>x.jobcat)}${seg('Lead source (close circle)',a,x=>x.circle)}${seg('Customer profile',a,x=>x.profile)}
 <h3>Overdue follow-ups (Hot/Warm, 21+ days idle)</h3>${T(['Customer','Phone','Branch','Employee','Status','Product','Days idle'],due.slice(0,30).map(x=>[esc(x.name),`<a href="tel:${d10(x.phone)}">${esc(x.phone)}</a>`,esc(x.branch),esc(x._emp),x.status,esc(x.product),x._days>900?'—':x._days]))}
 <h3>Birthdays & weddings in next 14 days</h3>${T(['Customer','Phone','Occasion','In (days)','Employee'],up.map(r=>[esc(r.x.name),`<a href="tel:${d10(r.x.phone)}">${esc(r.x.phone)}</a>`,r.o,r.n,esc(r.x._emp)]))}`}
function exp(){const a=cur();if(!a.length)return;const k=Object.keys(a[0]).filter(x=>x[0]!='_'),q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const u=URL.createObjectURL(new Blob([[k.join(','),...a.map(r=>k.map(c=>q(r[c])).join(','))].join('\n')],{type:'text/csv'})),l=document.createElement('a');l.href=u;l.download='digital-diary.csv';l.click();URL.revokeObjectURL(u)}

/* ---------- TABS ---------- */
$('#tabs').onclick=e=>{const t=e.target.dataset.t;if(!t)return;$$('#tabs button').forEach(b=>b.classList.toggle('on',b==e.target));$$('main>section').forEach(s=>s.hidden=s.id!=t);t=='leads'&&loadMy();t=='reports'&&loadRep()};
})();