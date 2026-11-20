
'use strict';
const $=id=>document.getElementById(id);
const APP={jobs:[],source:'loading',lastSync:null,route:'home',jobPage:0,pageSize:24,sort:'recent',filter:'all',mode:'all',query:'',protectedFilter:'all',protectedQuery:'',questFilter:'open',toastTimer:null,selected:null};
const STATUSES=['Da valutare','Interessante','Candidatura inviata','Colloquio','Scartata','Rifiutata'];
// Dated snapshot, not a live connection to Calendar.
const INTERVIEWS=[
 {id:'agile-20261120',company:'Agile Lab',role:'Colloquio conoscitivo',start:'2026-11-20T16:00:00+01:00',end:'2026-11-20T17:00:00+01:00',platform:'Microsoft Teams',link:'https://teams.microsoft.com/meet/3758614920785439?p=RRoBJ1PZ8TL6ci2lW2',contact:'Leila Gresti',verified:'19/11/2026'},
 {id:'avvale-20261124',company:'Avvale',role:'Colloquio · ruolo da confermare',start:'2026-11-24T15:15:00+01:00',end:'2026-11-24T15:45:00+01:00',platform:'Calendario / booking',link:'https://bookings.cloud.microsoft/bookwithme/user/f5aa76a15cb64e379c17874ef4ae3ff8@avvale.com/booking/8v26Qiokd0qVkVl0bwC2Uw2?anonymous',contact:'Enrica Rottigni',verified:'19/11/2026'}
];
const MESSAGES=[
 {company:'BIP (Datwave)',kind:'Conferma',color:'green',date:'19 nov',title:'BI & Data Analytics Expert — GCP',text:'Candidatura ricevuta per la requisition 2550.',id:'1a1f339f22dbf43c'},
 {company:'PwC',kind:'Conferma',color:'green',date:'19 nov',title:'Senior Customer Data Analyst',text:'Candidatura ricevuta; il portale candidato permette di seguire lo stato.',id:'1a1f341343158d72'},
 {company:'Mollie',kind:'Conferma',color:'green',date:'19 nov',title:'Analytics Engineer II',text:'Il recruiting ha confermato la ricezione.',id:'1a1f33a6c4f4c7ca'},
 {company:'Prima',kind:'Conferma',color:'green',date:'19 nov',title:'Candidature Prima',text:'Ricevute automatiche; i messaggi non identificano il singolo ruolo.',id:'1a1f34351cf1fb90'},
 {company:'Proxify',kind:'In valutazione',color:'blue',date:'19 nov',title:'Application under review',text:'La candidatura nel network Proxify risulta in valutazione; ruolo non specificato.',id:'1a1f32eac7c38839'},
 {company:'Rosetti Marino',kind:'CV ricevuto',color:'blue',date:'19 nov',title:'Autocandidatura ricevuta',text:'Conferma di ricezione CV, non del ruolo specifico.',id:'1a1f313f061e60ed'},
 {company:'Satispay',kind:'Esito negativo',color:'red',date:'18 nov',title:'Data Analyst — Growth & Marketing',text:'Esito negativo comunicato via email e registrato in Notion.',id:'1a1f002921b9ceec'},
 {company:'Qonto',kind:'Esito negativo',color:'red',date:'19 nov',title:'Senior Marketing Data Analyst',text:'Esito negativo comunicato via email e registrato in Notion.',id:'1a1f2eb0453a3f3f'}
];
const RECRUITERS=[
 {name:'Melissa Gifuni',company:'Fortitude Group',context:'Colloquio 19 novembre',email:'melissa.gifuni@fortitudegroup.it'},
 {name:'Recruiting BFEE',company:'BFEE',context:'Due candidature inviate il 19/11',email:'jobcenter@bfee.it'},
 {name:'Team Recruiting CGM',company:'CGM Consulting',context:'Richiesta di estensione valutazione a più posizioni',email:'recruiting@cgmconsulting.it'}
];
const SKILLS=['SQL','Python','Statistics','Machine Learning','Business Intelligence','BigQuery','AWS','Tableau','Looker Studio','Forecasting','Customer Analytics','RFM / CLV','Churn Modeling','ETL / Data Pipelines','Fraud Analytics'];
const TEMPLATES={
intro:'I am a data professional with nearly seven years of experience in Data Analytics, Business Intelligence, and Data Science. I have worked with Amazon, GameStop, Sky Italia, and Reply, developing analytical solutions with SQL, Python, predictive models, and dashboards.',
followup:'Dear Hiring Team,\n\nI hope you are doing well. I am following up on my application for the [ROLE] position at [COMPANY]. I remain very interested in the opportunity and would be glad to provide any additional information.\n\nThank you for your time.\n\nKind regards,\nJacopo Soppelsa',
thanks:'Dear [NAME],\n\nThank you for taking the time to speak with me today. I enjoyed learning more about [COMPANY] and the opportunity. Our conversation strengthened my interest in contributing to your team.\n\nBest regards,\nJacopo Soppelsa'
};
const STATUS_NAMES={'Da valutare':'Nuovo incontro','Interessante':'Da esplorare','Candidatura inviata':'Catturata','Colloquio':'Arena','Scartata':'Archiviata','Rifiutata':'Rifiutata'};
const STATUS_COLORS={'Da valutare':'yellow','Interessante':'blue','Candidatura inviata':'green','Colloquio':'purple','Scartata':'yellow','Rifiutata':'red'};
const ROUTES={home:'Command Center',jobdex:'JobDex',protected:'Categorie protette',pipeline:'Percorso',arena:'Interview Arena',followup:'Follow-up Center',rifiutate:'Rifiutate',quests:'Quest Log',inbox:'Centro messaggi',analytics:'Analytics Lab',recruiters:'Recruiter HQ',trainer:'Profilo Trainer',vault:'Assets Vault',focus:'Focus Mode',settings:'Impostazioni'};
const CACHE='career_dex_live_cache_v1',QUEST_KEY='career_dex_quests_v1',QUEST_DONE='career_dex_quest_done_v1';
function html(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeLink(x){try{const u=new URL(String(x));return ['https:','http:','mailto:'].includes(u.protocol)?u.href:''}catch{return ''}}
function getLocal(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function setLocal(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch(e){console.warn('Storage unavailable',e)}}
function dateIt(s){if(!s)return 'N/D';const d=new Date(s);return Number.isNaN(d.getTime())?'N/D':new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'short',year:'numeric'}).format(d)}
function dayTime(s){const d=new Date(s);return Number.isNaN(d.getTime())?'Data non valida':new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(d)}
function hr(s){const d=new Date(s);return Number.isNaN(d.getTime())?'--:--':new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'}).format(d)}
function timeAgo(s){if(!s)return'';const diff=Date.now()-new Date(s).getTime();if(diff<0)return dateIt(s);const m=Math.floor(diff/60000);return m<1?'Adesso':m<60?m+' min fa':m<1440?Math.floor(m/60)+' h fa':dateIt(s)}
function pct(n,total){return total>0?Math.round(n/total*100):0}
function toast(s){const el=$('toast');el.textContent=s;el.style.display='block';clearTimeout(APP.toastTimer);APP.toastTimer=setTimeout(()=>{el.style.display='none'},4200)}
function countStatus(s){return APP.jobs.filter(j=>j.status===s).length}
function stats(){return {total:APP.jobs.length,history:APP.jobs.filter(j=>j.sent===true).length,active:countStatus('Candidatura inviata'),rejected:countStatus('Scartata'),refused:countStatus('Rifiutata'),review:countStatus('Da valutare')+countStatus('Interessante'),interviews:countStatus('Colloquio'),fresh:INTERVIEWS.filter(x=>new Date(x.end)>new Date()).length}}
function dedicatedProtected(j){return /categor(?:ie|ia)\s+protett|68\s*\/\s*99|collocamento\s+mirato/i.test(String(j.role||''))}
function dedicatedJobs(){return APP.jobs.filter(dedicatedProtected)}
function dedicatedSort(list){const rank={Interessante:0,'Da valutare':1,Colloquio:2,'Candidatura inviata':3,Scartata:4,Rifiutata:5};return list.sort((a,b)=>(rank[a.status]??6)-(rank[b.status]??6)||(Date.parse(b.dateAdded)||0)-(Date.parse(a.dateAdded)||0))}
function matchScore(n){n=Number(n);return Number.isFinite(n)&&n>0?'Match '+(n>10?n.toFixed(0)+'%':String(n).replace('.',',')+'/10'):'Match non indicato'}
function jobIndex(id){return APP.jobs.findIndex(j=>j.id===id)}
function jobBy(id){return APP.jobs.find(j=>j.id===id)}
function badge(status){return '<span class="pill '+(STATUS_COLORS[status]||'blue')+'">'+html(STATUS_NAMES[status]||status||'Sconosciuto')+'</span>'}
function initials(name){return (String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('')||'?').toUpperCase()}
function category(j){const s=(j.role+' '+j.area).toLowerCase();return /scientist|machine learning|ml engineer/.test(s)?'🧪':/business intelligence|bi |dashboard/.test(s)?'🔮':/engineer|pipeline|etl|dbt/.test(s)?'⚡':/crm|customer|marketing/.test(s)?'🌿':'📊'}
function appAction(label,action,cls){return '<button class="btn '+(cls||'small')+'" type="button" data-action="'+html(action)+'">'+html(label)+'</button>'}
function empty(t,details){return '<div class="empty"><strong>'+html(t)+'</strong><div>'+html(details||'')+'</div></div>'}
function setRoute(route){if(!ROUTES[route])route='home';APP.route=route;location.hash=route;document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+route));document.querySelectorAll('[data-nav]').forEach(b=>{const yes=b.dataset.nav===route;b.classList.toggle('active',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});$('page-title').textContent=ROUTES[route];$('page-eyebrow').textContent='CAREER DEX / '+route.toUpperCase();document.title=ROUTES[route]+' · Career Dex';$('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'auto'});renderView(route)}
function renderView(route){switch(route){case'home':renderHome();break;case'jobdex':renderJobs();break;case'protected':renderProtected();break;case'pipeline':renderPipeline();break;case'arena':renderArena();break;case'followup':renderFollowups();break;case'rifiutate':renderRejections();break;case'quests':renderQuests();break;case'inbox':renderInbox();break;case'analytics':renderAnalytics();break;case'recruiters':renderRecruiters();break;case'trainer':renderTrainer();break;case'vault':renderVault();break;case'focus':renderFocus();break;case'settings':renderSettings();break;}}
function redraw(){renderHome();renderJobs();renderProtected();renderPipeline();renderArena();renderFollowups();renderRejections();renderQuests();renderInbox();renderAnalytics();renderRecruiters();renderTrainer();renderVault();renderFocus();renderSettings()}
function statusSource(live){$('sync-status').classList.toggle('offline',!live);$('sync-status').innerHTML='<span class="sync-dot"></span>'+html(live?'NOTION LIVE':APP.source==='loading'?'SINCRONIZZAZIONE':'COPIA LOCALE');$('last-sync').textContent=APP.lastSync?'Ultima sincronizzazione: '+timeAgo(APP.lastSync):'In attesa dei dati';$('source-detail').textContent=live?'Collegamento attivo: Notion via /api/jobs. Le modifiche si salvano sul database.':'Dati di riserva salvati nel browser. I salvataggi sono sospesi finché Notion non torna raggiungibile.'}
async function sync(){
 $('refresh').disabled=true;APP.source='loading';statusSource(false);
 try{
  const r=await fetch('/api/jobs',{cache:'no-store'}),d=await r.json();
  if(!r.ok||!Array.isArray(d.jobs))throw new Error(d.error||'API non disponibile');
  APP.jobs=d.jobs;APP.source='notion';APP.lastSync=d.syncedAt||new Date().toISOString();setLocal(CACHE,{jobs:APP.jobs,lastSync:APP.lastSync});
  try{localStorage.setItem('jhc_jobs',JSON.stringify(APP.jobs))}catch(_){}
  statusSource(true);redraw();
 }catch(e){
  const cache=getLocal(CACHE,null),old=getLocal('jhc_jobs',null);
  APP.jobs=cache?.jobs||old||[];APP.lastSync=cache?.lastSync||null;APP.source='cached';statusSource(false);redraw();toast('Notion non disponibile: '+e.message);
 }finally{$('refresh').disabled=false}
}
function card(j){
 const i=jobIndex(j.id);return '<article class="panel job-card"><div class="ordinal">DEX #'+String(i+1).padStart(3,'0')+' · '+html(dateIt(j.dateAdded))+'</div>'+
 '<div class="monster-token hot" style="margin-top:12px">'+category(j)+'</div>'+
 '<h4>'+html(j.role||'Posizione senza titolo')+'</h4><div class="company">'+html(j.company)+'</div>'+
 '<div class="tags">'+badge(j.status)+(j.protected?'<span class="pill purple">L.68/99</span>':'')+(j.mode==='Remoto'?'<span class="pill blue">REMOTE</span>':'')+'</div>'+
 '<div class="bottom"><span class="place" title="'+html(j.location)+'">'+html(j.location||'Sede da confermare')+'</span><button class="btn small soft" type="button" data-job="'+html(j.id)+'">Scheda ↗</button></div></article>';
}
function renderHome(){
 const s=stats();$('kpi-captured').textContent=s.history;$('kpi-pending').textContent=s.active;$('kpi-arena').textContent=s.fresh;$('kpi-fainted').textContent=s.rejected;$('kpi-refused').textContent=s.refused;$('nav-rejected-count').textContent=s.refused;$('nav-protected-count').textContent=dedicatedJobs().length;
 $('hero-caption').textContent=s.review?'Ci sono '+s.review+' nuove opportunità da valutare. Scegli la prossima missione.':'Il Pokédex è aggiornato: '+s.history+' candidature storiche inviate. Ora la missione è trasformarle in colloqui e offerte.';
 $('home-xp').style.width=(s.total?pct(s.history,s.total):0)+'%';$('home-xp-label').textContent=s.history+' / '+s.total+' candidature tracciate';
 $('home-notion').textContent=s.total+' opportunità nel database';
 const protectedRows=dedicatedSort(dedicatedJobs());$('home-protected-count').textContent=protectedRows.length;$('home-protected-sent').textContent=protectedRows.filter(j=>j.sent).length;
 $('home-protected-list').innerHTML=protectedRows.length?protectedRows.slice(0,3).map(j=>'<button type="button" class="home-protected-job" data-job="'+html(j.id)+'"><span class="protected-emblem">🛡️</span><span class="main"><strong>'+html(j.company)+'</strong><small>'+html(j.role)+'</small></span>'+badge(j.status)+'</button>').join(''):empty('Nessun annuncio dedicato','Controlla i dati Notion.');
 const recentRejects=APP.jobs.filter(j=>j.status==='Rifiutata').sort((a,b)=>Date.parse(b.rejectionDate||0)-Date.parse(a.rejectionDate||0)).slice(0,3);
 $('home-rejections').innerHTML=recentRejects.length?recentRejects.map(j=>'<button type="button" class="rejection-mini" data-job="'+html(j.id)+'"><span class="rejection-mini-icon">❌</span><span class="main"><strong>'+html(j.company)+'</strong><small>'+html(j.role)+'</small></span><span class="pill red">'+html(dateIt(j.rejectionDate))+'</span></button>').join(''):empty('Nessun rifiuto registrato','La sezione si aggiorna dai dati Notion.');
 const latest=APP.jobs.slice().sort((a,b)=>(Date.parse(b.dateAdded)||0)-(Date.parse(a.dateAdded)||0)).slice(0,5);
 $('home-encounters').innerHTML=latest.length?latest.map(j=>'<div class="encounter"><div class="monster-token">'+category(j)+'</div><div class="main"><div class="name">'+html(j.company)+'</div><div class="meta">'+html(j.role)+' · '+html(dateIt(j.dateAdded))+'</div></div>'+badge(j.status)+'<button class="btn small" data-job="'+html(j.id)+'">Dettagli</button></div>').join(''):empty('Nessuna opportunità caricata','Controlla il collegamento a Notion.');
 const imminent=INTERVIEWS.filter(i=>new Date(i.end)>new Date()).sort((a,b)=>new Date(a.start)-new Date(b.start))[0];
 $('home-interview').innerHTML=imminent?'<div class="mini-label">PROSSIMA BATTLE</div><h3 style="font:800 24px var(--display);margin:9px 0">'+html(imminent.company)+'</h3><p class="muted text-xs">'+html(imminent.role)+'</p><p style="color:var(--gold);font-size:12px;font-weight:900">'+html(dayTime(imminent.start))+' – '+html(hr(imminent.end))+'</p><div class="row-buttons"><a class="btn gold small" target="_blank" rel="noopener" href="'+html(safeLink(imminent.link))+'">Apri '+html(imminent.platform)+'</a><button class="btn small" data-nav="arena">Tutti i colloqui</button></div>':empty('Nessun colloquio futuro nello snapshot','Apri il calendario per verificare nuove convocazioni.');
 const items=[{name:'Da valutare',n:countStatus('Da valutare')},{name:'Interessante',n:countStatus('Interessante')},{name:'Inviata',n:s.active},{name:'Colloquio',n:s.interviews},{name:'Scartata',n:s.rejected},{name:'Rifiutata',n:s.refused}];
 const max=Math.max(...items.map(x=>x.n),1);
 $('home-pipeline').innerHTML=items.map(x=>'<div class="bar-row"><span>'+html(x.name)+'</span><div class="bar"><span style="width:'+pct(x.n,max)+'%"></span></div><b>'+x.n+'</b></div>').join('');
 const upcoming=autoQuests().filter(q=>!getLocal(QUEST_DONE,[]).includes(q.id)).slice(0,3);
 $('home-quests').innerHTML=upcoming.length?upcoming.map(q=>'<div class="quest-item"><div class="monster-token">✨</div><div class="main"><div class="name">'+html(q.title)+'</div><div class="meta">'+html(q.note)+'</div></div></div>').join(''):empty('Quest completate','Nessuna attività automatica immediata.');
 $('home-dex-entry').textContent=s.review?s.review+' opportunità da esplorare':'Tutte le opportunità attuali risultano già elaborate';
}
function applyFilters(){
 let a=APP.jobs.filter(j=>{
 if(APP.filter!=='all'&&j.status!==APP.filter)return false;
 if(APP.mode!=='all'&&j.mode!==APP.mode)return false;
 const q=APP.query.toLowerCase();
 return !q||(j.company+' '+j.role+' '+j.location+' '+j.area+' '+j.notes).toLowerCase().includes(q);
 });
 if(APP.sort==='score')a.sort((x,y)=>(y.score||0)-(x.score||0));
 else if(APP.sort==='company')a.sort((x,y)=>x.company.localeCompare(y.company));
 else if(APP.sort==='old')a.sort((x,y)=>(Date.parse(x.dateAdded)||0)-(Date.parse(y.dateAdded)||0));
 else a.sort((x,y)=>(Date.parse(y.dateAdded)||0)-(Date.parse(x.dateAdded)||0));
 return a;
}
function renderJobs(){
 const all=applyFilters();const start=APP.jobPage*APP.pageSize,chunk=all.slice(start,start+APP.pageSize);
 $('job-count').textContent=all.length+' risultati su '+APP.jobs.length;
 $('jobs-list').innerHTML=chunk.length?chunk.map(card).join(''):empty('Nessuna corrispondenza','Modifica la ricerca o i filtri.');
 $('job-page').textContent=(all.length?'Pagina '+(APP.jobPage+1)+' / '+Math.ceil(all.length/APP.pageSize):'0 risultati');
 $('job-prev').disabled=APP.jobPage===0;$('job-next').disabled=start+APP.pageSize>=all.length;
}

function renderProtected(){
 const all=dedicatedSort(dedicatedJobs());
 const active=all.filter(j=>['Da valutare','Interessante'].includes(j.status)).length;
 const sent=all.filter(j=>j.sent).length;
 const closed=all.filter(j=>['Scartata','Rifiutata'].includes(j.status)).length;
 $('protected-count').textContent=all.length;$('protected-open').textContent=active;$('protected-sent').textContent=sent;$('protected-closed').textContent=closed;
 const flagged=APP.jobs.filter(j=>j.protected&&!dedicatedProtected(j)).length;
 $('protected-unverified').textContent=flagged+' schede contrassegnate con il flag L.68/99 non sono incluse: dal titolo non risulta chiaro che siano offerte riservate.';
 const q=APP.protectedQuery.trim().toLowerCase();
 const filtered=all.filter(j=>{
  if(APP.protectedFilter==='actionable'&&!['Da valutare','Interessante'].includes(j.status))return false;
  if(APP.protectedFilter==='sent'&&!j.sent)return false;
  if(APP.protectedFilter==='closed'&&!['Scartata','Rifiutata'].includes(j.status))return false;
  return !q||(j.company+' '+j.role+' '+j.location).toLowerCase().includes(q);
 });
 $('protected-visible').textContent=filtered.length+' risultati';
 $('protected-caption').textContent=filtered.length+' su '+all.length+' annunci esplicitamente dedicati';
 $('protected-list').innerHTML=filtered.length?filtered.map(j=>{
  const url=safeLink(j.url),page=safeLink(j.pageUrl);
  return '<article class="panel protected-job-card"><div class="protected-card-top"><span class="pill purple">🛡️ L.68/99</span><span class="protected-match">'+html(matchScore(j.score))+'</span></div>'+
  '<div class="protected-card-heading"><span class="protected-avatar">'+html(initials(j.company))+'</span><div><h4>'+html(j.role)+'</h4><p>'+html(j.company)+'</p></div></div>'+
  '<div class="protected-card-facts"><span>📍 '+html(j.location||'Sede da confermare')+'</span><span>◈ '+html(j.mode||'Non specificata')+'</span></div>'+
  '<div class="protected-card-badges">'+badge(j.status)+(j.sent?'<span class="pill green">✓ Storico invio</span>':'')+'</div>'+
  '<div class="protected-card-actions"><button class="btn gold small" type="button" data-job="'+html(j.id)+'">Dettagli</button>'+(url?'<a class="btn small" target="_blank" rel="noopener noreferrer" href="'+html(url)+'">Annuncio ↗</a>':page?'<a class="btn small" target="_blank" rel="noopener noreferrer" href="'+html(page)+'">Notion ↗</a>':'')+'</div></article>';
 }).join(''):empty('Nessuna offerta in questo filtro',APP.protectedFilter==='actionable'?'Le offerte riservate già registrate risultano lavorate o archiviate. Seleziona “Tutte” per vederle.':'Prova un filtro diverso o elimina il testo cercato.');
}
function renderPipeline(){
 const columns=STATUSES;const maxPreview=10;const body=columns.map(status=>{
 const l=APP.jobs.filter(j=>j.status===status).sort((a,b)=>(Date.parse(b.dateAdded)||0)-(Date.parse(a.dateAdded)||0));
 return '<div class="kan-col"><div class="kan-title"><span>'+badge(status)+'</span><span class="kan-badge">'+l.length+'</span></div><div class="kan-items">'+
 (l.length?l.slice(0,maxPreview).map(j=>'<button class="kan-card" type="button" data-job="'+html(j.id)+'"><strong>'+html(j.company)+'</strong><span>'+html(j.role)+'</span></button>').join('')+(l.length>maxPreview?'<button class="btn small block" data-action="filter-status" data-status="'+html(status)+'">Vedi tutte ('+l.length+')</button>':''):empty('Nessuna scheda'))+'</div></div>';
 }).join('');
 $('pipeline-board').innerHTML=body;
 const s=stats();$('pipeline-foot').textContent=s.history+' candidature inviate nello storico · '+s.active+' ancora nella fase inviata · '+s.rejected+' scartate per altri motivi · '+s.refused+' rifiutate dalle aziende.';
}
// The creation date is a triage signal, NOT proof of application date.
function followupAge(job){
 const dt=Date.parse(job.dateAdded||'');
 if(!Number.isFinite(dt))return null;
 return Math.max(0,Math.floor((Date.now()-dt)/86400000));
}
function renderFollowups(){
 const sent=APP.jobs.filter(j=>j.status==='Candidatura inviata');
 const aged=sent.filter(j=>followupAge(j)!==null&&followupAge(j)>=7);
 $('followup-count').textContent=sent.length;
 $('followup-review').textContent=aged.length;
 const mode=$('followup-filter')?.value||'review';
 const filtered=sent.filter(j=>mode==='all'||(mode==='review'?followupAge(j)!==null&&followupAge(j)>=7:followupAge(j)!==null&&followupAge(j)<7));
 filtered.sort((a,b)=>(Date.parse(a.dateAdded)||0)-(Date.parse(b.dateAdded)||0));
 $('followup-list').innerHTML=filtered.length?filtered.slice(0,100).map(j=>{
  const age=followupAge(j),url=safeLink(j.url);
  const draft='Buongiorno,\\n\\nvi scrivo per chiedere gentilmente un aggiornamento sulla mia candidatura per la posizione di '+j.role+' presso '+j.company+'. Resto molto interessato all’opportunità e disponibile per eventuali approfondimenti.\\n\\nGrazie per il tempo dedicato.\\n\\nCordiali saluti,\\nJacopo Soppelsa';
  return '<article class="panel followup-card"><div class="followup-card-main"><div class="mini-label">FOLLOW-UP · '+html(j.mode||'MODALITÀ DA VERIFICARE')+'</div><h4>'+html(j.company)+'</h4><p>'+html(j.role)+'</p><span class="pill yellow">'+html(age===null?'Data mancante':age+' giorni dalla creazione')+'</span></div><div class="followup-card-actions"><button type="button" class="btn small" data-job="'+html(j.id)+'">Scheda Notion</button>'+(url?'<a class="btn small blue" href="'+html(url)+'" target="_blank" rel="noopener noreferrer">Annuncio ↗</a>':'')+'<button type="button" class="btn small gold" data-action="copy" data-copy="'+html(draft)+'">Copia follow-up</button></div></article>';
 }).join(''):empty('Nessuna candidatura in questo filtro','Per le candidature recenti non è ancora il momento di sollecitare. Cambia filtro per vedere tutte le posizioni.');
}

function renderRejections(){
 const list=APP.jobs.filter(j=>j.status==='Rifiutata').sort((a,b)=>(Date.parse(b.rejectionDate)||0)-(Date.parse(a.rejectionDate)||0));
 $('rejected-count').textContent=list.length;
 $('rejected-list').innerHTML=list.length?list.map(j=>{
  const mail=safeLink(j.rejectionEmail),notion=safeLink(j.pageUrl);
  return '<article class="panel rejection-card"><div class="rejection-card-top"><span class="pill red">✕ NON SELEZIONATA</span><span class="rejection-date">'+html(j.rejectionDate?dateIt(j.rejectionDate):'Data non registrata')+'</span></div>'+
  '<div class="rejection-card-identity"><div class="rejection-token">'+category(j)+'</div><div><h4>'+html(j.company)+'</h4><p>'+html(j.role)+'</p></div></div>'+
  '<div class="rejection-card-details"><div><span>STATO</span><strong>Rifiutata dall’azienda</strong></div><div><span>INVIO ORIGINALE</span><strong>'+(j.sent?'Conservato nello storico':'Da verificare')+'</strong></div></div>'+
  '<div class="rejection-card-actions">'+(mail?'<a class="btn small blue" href="'+html(mail)+'" target="_blank" rel="noopener noreferrer">✉ Email originale ↗</a>':'')+(notion?'<a class="btn small" href="'+html(notion)+'" target="_blank" rel="noopener noreferrer">Scheda Notion ↗</a>':'')+'<button class="btn small" type="button" data-job="'+html(j.id)+'">Dettagli</button></div></article>';
 }).join(''):empty('Nessun rifiuto confermato','Quando registri un rifiuto in Notion con stato Rifiutata, apparirà qui automaticamente.');
}
function renderArena(){
 const now=new Date();
 $('arena-list').innerHTML=INTERVIEWS.filter(i=>new Date(i.end)>now).map(i=>{
 const future=new Date(i.end)>now;
 return '<article class="panel arena-card '+(future?'':'alt')+'"><span class="pill '+(future?'yellow':'blue')+'">'+(future?'Programmata':'Passata · snapshot')+'</span>'+
 '<h4>⚔️ '+html(i.company)+'</h4><div class="when">'+html(dayTime(i.start))+' – '+html(hr(i.end))+'</div>'+
 '<p>'+html(i.role)+'<br>Interlocutore: '+html(i.contact)+'<br>Piattaforma: '+html(i.platform)+'</p>'+
 '<div class="row-buttons"><a class="btn blue small" href="'+html(safeLink(i.link))+'" target="_blank" rel="noopener noreferrer">Apri riunione ↗</a>'+
 '<a class="btn small" href="https://calendar.google.com/calendar/u/0/r/week" target="_blank" rel="noopener">Verifica calendario</a></div>'+
 '<div class="status-note">Snapshot verificato il '+html(i.verified)+'. Non sincronizzato automaticamente con il calendario.</div></article>';
 }).join('') || empty('Nessun colloquio futuro nello snapshot','Le convocazioni reali sono su Google Calendar e iCloud Calendar: verifica lì.');
}
function autoQuests(){
 const t=[];const now=new Date();
 INTERVIEWS.filter(i=>new Date(i.end)>now).forEach(i=>t.push({id:'interview-'+i.id,title:'Verifica e prepara: '+i.company,note:dayTime(i.start)+' · snapshot datato, controlla prima il calendario',type:'Colloquio'}));
 t.push({id:'pwc-profile',title:'Controlla il profilo candidato PwC',note:'Il 19/11 PwC ha inviato il link al portale per seguire la candidatura e completare eventuali attività.',type:'Candidature'});
 t.push({id:'bip-google-verify',title:'Verifica lo stato BIP Data Analyst Google',note:'Il 18/11 era arrivato un avviso di bozza. Anche se la posizione è ora segnata inviata, verifica nel portale la ricevuta finale.',type:'Verifica'});
 t.push({id:'check-replies',title:'Controlla risposte dei recruiter',note:'Controlla Gmail e iCloud Mail per colloqui e richieste concrete. Non inviare follow-up anticipati.',type:'Comunicazioni'});
 return t;
}
function manualQuests(){return getLocal(QUEST_KEY,[])}
function allQuests(){return autoQuests().concat(manualQuests())}
function renderQuests(){
 const done=getLocal(QUEST_DONE,[]);
 let list=allQuests().filter(q=>APP.questFilter==='all'||(APP.questFilter==='done'?done.includes(q.id):!done.includes(q.id)));
 $('quest-total').textContent=allQuests().length+' missioni · '+done.filter(id=>allQuests().some(q=>q.id===id)).length+' completate';
 $('quest-list').innerHTML=list.length?list.map(q=>'<label class="quest-row '+(done.includes(q.id)?'done':'')+'"><input type="checkbox" data-quest="'+html(q.id)+'" '+(done.includes(q.id)?'checked':'')+'><span class="text"><strong>'+html(q.title)+'</strong><small>'+html(q.note)+'</small></span><span class="pill blue">'+html(q.type||'Personale')+'</span>'+(q.manual?'<button class="delete" type="button" data-delete-quest="'+html(q.id)+'" title="Elimina attività">✕</button>':'')+'</label>').join(''):empty('Nessuna quest in questa vista','Prova a cambiare il filtro.');
}
function renderInbox(){
 $('inbox-list').innerHTML=MESSAGES.map(m=>'<article class="panel message-card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong style="font-size:12px">'+html(m.company)+'</strong><span class="pill '+html(m.color)+'">'+html(m.kind)+'</span></div><h4>'+html(m.title)+'</h4><p>'+html(m.text)+'</p><div class="section-head" style="margin:0"><span class="date">'+html(m.date)+' 2026</span><a class="btn small" href="https://mail.google.com/mail/u/0/#all/'+html(m.id)+'" target="_blank" rel="noopener noreferrer">Apri Gmail ↗</a></div></article>').join('');
 $('inbox-snapshot').textContent='Archivio comunicazioni verificato il 19 novembre 2026. Nessun accesso live alla posta da questo sito: il controllo unificato è alle 18:00.';
}
function renderRecruiters(){
 $('recruiter-list').innerHTML=RECRUITERS.map(r=>'<article class="panel panel-pad"><div class="encounter" style="border:0;background:transparent;padding:0"><div class="monster-token">📨</div><div class="main"><div class="name">'+html(r.name)+'</div><div class="meta">'+html(r.company)+'</div></div></div><p class="panel-sub" style="margin:14px 0">'+html(r.context)+'</p><div class="row-buttons"><a class="btn small blue" href="mailto:'+html(r.email)+'">Scrivi email ↗</a><button class="btn small" data-action="copy" data-copy="'+html(r.email)+'">Copia indirizzo</button></div></article>').join('');
 const candidates=APP.jobs.filter(j=>j.status==='Candidatura inviata'&&/follow-up|sollecit|ricontatt|attendere feedback|riscontro/i.test(j.next||'')).slice(0,9);
 $('recruiter-followups').innerHTML=candidates.length?candidates.map(j=>'<div class="encounter"><div class="monster-token">'+category(j)+'</div><div class="main"><div class="name">'+html(j.company)+'</div><div class="meta">'+html(j.role)+'</div></div><button class="btn small" data-job="'+html(j.id)+'">Apri</button></div>').join(''):empty('Nessuna azione segnalata');
}
function barSeries(){
 const data={},now=new Date(),days=9;
 for(let i=days-1;i>=0;i--){const day=new Date(now);day.setDate(now.getDate()-i);const key=day.toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});data[key]=0}
 APP.jobs.forEach(j=>{if(!j.dateAdded)return;const d=new Date(j.dateAdded);if(Number.isNaN(d.getTime()))return;const k=d.toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'});if(Object.hasOwn(data,k))data[k]++});
 const max=Math.max(1,...Object.values(data));
 return Object.entries(data).map(([day,n])=>'<div class="chart-tower"><div class="num">'+n+'</div><div class="tower" style="height:'+Math.max(2,Math.round(n/max*122))+'px"></div><div class="day">'+html(day.slice(5))+'</div></div>').join('');
}
function renderAnalytics(){
 const s=stats();const done=APP.jobs.filter(j=>j.sent),total=s.total;
 $('analytics-bar').innerHTML=barSeries();
 const breakdown=[{title:'Candidature ancora in corso',n:s.active,color:'var(--green)'},{title:'Scartate da te / archiviate',n:s.rejected,color:'var(--gold)'},{title:'Rifiutate dalle aziende',n:s.refused,color:'var(--red)'},{title:'Da valutare / interessanti',n:s.review,color:'var(--gold)'},{title:'Colloquio in Notion',n:s.interviews,color:'var(--purple)'}];
 const sizes=breakdown.map(b=>Math.round(pct(b.n,total)*100)/100);
 let angle=0;const stops=breakdown.map((b,i)=>{const lo=angle,hi=angle+sizes[i];angle=hi;return b.color+' '+lo+'% '+hi+'%'}).join(',');
 $('analytics-ring').style.background=total?'conic-gradient('+stops+')':'conic-gradient(#264c63 0 100%)';
 $('analytics-ring').innerHTML='<strong>'+s.total+'</strong>';
 $('analytics-legend').innerHTML=breakdown.map(b=>'<div class="legend-item"><span class="dot" style="background:'+b.color+'"></span>'+html(b.title)+' <b>'+b.n+'</b></div>').join('');
 const modeObj={Remoto:0,Ibrido:0,'In presenza':0,'Non specificata':0};APP.jobs.forEach(j=>{modeObj[j.mode] = (modeObj[j.mode]||0)+1});
 const max=Math.max(1,...Object.values(modeObj));$('analytics-mode').innerHTML=Object.entries(modeObj).map(([name,n])=>'<div class="bar-row"><span>'+html(name)+'</span><div class="bar"><span style="width:'+pct(n,max)+'%"></span></div><b>'+n+'</b></div>').join('');
 $('analytics-rates').innerHTML='<div class="status-box"><small>Invii storici tracciati</small><strong>'+s.history+'</strong></div><div class="status-box"><small>Posizioni con link</small><strong>'+APP.jobs.filter(j=>!!j.url).length+'</strong></div><div class="status-box"><small>Modalità remota</small><strong>'+modeObj.Remoto+'</strong></div><div class="status-box"><small>Da valutare</small><strong>'+s.review+'</strong></div>';
 const areaCount={};APP.jobs.forEach(j=>{const v=(j.area||'').split(' · ')[0]||'Da classificare';areaCount[v]=(areaCount[v]||0)+1});$('analytics-areas').innerHTML=Object.entries(areaCount).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([a,n])=>'<div class="encounter" style="padding:10px 12px"><span class="main name">'+html(a)+'</span><span class="pill blue">'+n+'</span></div>').join('');
}
function renderTrainer(){
 const s=stats();
 $('trainer-exp').textContent=s.history+' candidature inviate · '+s.total+' opportunità monitorate';
 $('trainer-types').innerHTML=SKILLS.map((skill,i)=>'<span class="type">'+['⚡','✨','🔮','🔥','💠','🌿'][i%6]+' '+html(skill)+'</span>').join('');
 $('trainer-profile-stats').innerHTML='<div class="status-box"><small>Esperienza professionale</small><strong>~7 anni</strong></div><div class="status-box"><small>Invii storici Notion</small><strong>'+s.history+'</strong></div><div class="status-box"><small>Offerte monitorate</small><strong>'+s.total+'</strong></div><div class="status-box"><small>Data source</small><strong>'+html(APP.source==='notion'?'Live':'Locale')+'</strong></div>';
}
function renderVault(){
 $('vault-snippets').innerHTML=Object.entries(TEMPLATES).map(([id,value])=>'<article class="panel panel-pad"><div class="mini-label">'+(id==='intro'?'Presentazione':id==='followup'?'Follow-up':'Dopo colloquio')+'</div><p class="text-xs" style="color:var(--muted);line-height:1.7;white-space:pre-line;min-height:70px">'+html(value.slice(0,210))+(value.length>210?'…':'')+'</p><button class="btn small gold" data-action="copy-template" data-template="'+html(id)+'">Copia testo</button></article>').join('');
}
function renderFocus(){
 const next=APP.jobs.find(j=>j.status==='Da valutare'||j.status==='Interessante'),meeting=INTERVIEWS.filter(x=>new Date(x.end)>new Date()).sort((a,b)=>new Date(a.start)-new Date(b.start))[0];
 if(next){$('focus-content').innerHTML='<div class="overline" style="color:var(--gold)">NEXT ENCOUNTER</div><div class="large">'+html(next.company)+'</div><p>'+html(next.role)+' · '+html(next.location)+'</p><div class="row-buttons"><button class="btn hot" data-job="'+html(next.id)+'">Apri la scheda</button><a class="btn blue" href="'+html(safeLink(next.url)||'#')+'" target="_blank" rel="noopener">Apri annuncio</a></div>'}
 else if(meeting){$('focus-content').innerHTML='<div class="overline" style="color:var(--gold)">NEXT BATTLE</div><div class="large">'+html(meeting.company)+'</div><p>Le candidature attuali sono già registrate. Concentrati sul colloquio di '+html(dayTime(meeting.start))+'; prepara il tuo pitch e tre esempi concreti di progetti data.</p><div class="row-buttons"><a class="btn gold" target="_blank" rel="noopener" href="'+html(safeLink(meeting.link))+'">Apri '+html(meeting.platform)+'</a><button class="btn" data-nav="arena">Apri Interview Arena</button></div>'}
 else{$('focus-content').innerHTML='<div class="overline" style="color:var(--gold)">MISSION CLEAR</div><div class="large">Pokédex aggiornato.</div><p>Tutte le offerte registrate sono già state lavorate. Controlla le risposte dei recruiter e usa il Quest Log per i prossimi passi.</p><div class="row-buttons"><button class="btn gold" data-nav="quests">Apri Quest Log</button><a class="btn" href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener">Controlla Gmail</a></div>'}
}
const POKEMON_MOTION_KEY='career_dex_pokemon_motion_v1';
function motionEnabled(){return localStorage.getItem(POKEMON_MOTION_KEY)!=='off'}
function applyPokemonMotion(){
 const enabled=motionEnabled();
 document.body.classList.toggle('pokemon-motion-off',!enabled);
 for(const id of ['pokemon-motion-toggle','motion-switch']){
  const button=$(id);if(!button)continue;
  button.setAttribute('aria-pressed',String(enabled));
  button.title=enabled?'Ferma i Pokémon animati':'Riattiva i Pokémon animati';
  button.textContent=id==='motion-switch'?(enabled?'⏸ Ferma i Pokémon':'▶ Riattiva i Pokémon'):(enabled?'⏸ Pokémon':'▶ Pokémon');
 }
}
function togglePokemonMotion(){localStorage.setItem(POKEMON_MOTION_KEY,motionEnabled()?'off':'on');applyPokemonMotion()}
function renderSettings(){
 const s=stats();$('settings-dataset').textContent=APP.source==='notion'?'NOTION LIVE · '+s.total+' righe · sincronizzato '+timeAgo(APP.lastSync):'SNAPSHOT LOCALE · '+s.total+' righe';
 $('theme-switch').textContent=document.body.classList.contains('light')?'☾ Passa a dark Pokédex':'☀ Passa a light mode';
}
function openJob(id){
 const j=jobBy(id);if(!j)return toast('Scheda non disponibile');
 APP.selected=j.id;$('dialog-company').textContent=j.company;$('dialog-role').textContent=j.role;$('dialog-note').textContent=j.notes||'Nessuna nota';
 $('dialog-location').textContent=(j.location||'Sede da verificare')+' · '+(j.mode||'Modalità non specificata');
 $('dialog-score').textContent=j.score?j.score+'/10 MATCH':'Compatibilità non valutata';$('dialog-state').value=j.status;$('dialog-next').value=j.next||'';
 $('dialog-links').innerHTML=(j.url?'<a class="btn blue small" href="'+html(safeLink(j.url))+'" target="_blank" rel="noopener noreferrer">🔗 Apri candidatura</a>':'')+(j.pageUrl?'<a class="btn small" href="'+html(safeLink(j.pageUrl))+'" target="_blank" rel="noopener noreferrer">Scheda Notion</a>':'')+(j.rejectionEmail?'<a class="btn small" href="'+html(safeLink(j.rejectionEmail))+'" target="_blank" rel="noopener noreferrer">Email rifiuto</a>':'');
 $('job-dialog').showModal();
}
async function updateJob(e){
 e.preventDefault();const id=APP.selected;if(!id)return;const status=$('dialog-state').value,next=$('dialog-next').value.trim();
 if(APP.source!=='notion')return toast('Salvataggio non disponibile senza connessione a Notion');
 const btn=$('save-job');btn.disabled=true;try{
  const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update',id,status,next})});const d=await r.json();if(!r.ok)throw Error(d.error||'Errore salvataggio');
  $('job-dialog').close();toast('✓ Scheda salvata su Notion');await sync();
 }catch(err){toast('Errore: '+err.message)}finally{btn.disabled=false}
}
async function createJob(e){
 e.preventDefault();if(APP.source!=='notion')return toast('Notion non raggiungibile');
 const f=new FormData(e.target);const company=String(f.get('company')||'').trim(),role=String(f.get('role')||'').trim(),url=String(f.get('url')||'').trim();
 if(!company||!role)return;
 if(APP.jobs.some(j=>j.company.trim().toLowerCase()===company.toLowerCase()&&j.role.trim().toLowerCase()===role.toLowerCase()))return toast('Scheda azienda + ruolo già presente: verifica prima di crearne una seconda.');
 if(url&&APP.jobs.some(j=>j.url&&j.url.replace(/\/$/,'')===url.replace(/\/$/,'')))return toast('Questo annuncio esiste già nel database.');
 const job={company,role,url,location:String(f.get('location')||''),mode:String(f.get('mode')||''),score:Number(f.get('score')||7),status:String(f.get('status')||'Da valutare'),next:'Valutare requisiti e disponibilità',notes:''};
 $('new-save').disabled=true;try{const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',job})});const data=await r.json();if(!r.ok)throw Error(data.error||'Errore salvataggio');$('new-dialog').close();e.target.reset();toast('✓ Nuova scheda aggiunta in Notion');await sync();setRoute('jobdex');}
 catch(error){toast('Errore: '+error.message)}finally{$('new-save').disabled=false}
}
function addQuest(){
 const input=$('new-quest');const title=input.value.trim();if(!title)return toast('Inserisci il nome della missione');
 const q={id:'manual-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),title,note:'Missione aggiunta da te · salvata solo in questo browser',type:'Personale',manual:true};const qs=manualQuests();qs.push(q);setLocal(QUEST_KEY,qs);input.value='';renderQuests();renderHome();toast('Missione aggiunta');
}
function setQuest(id,checked){let done=getLocal(QUEST_DONE,[]);done=done.filter(x=>x!==id);if(checked)done.push(id);setLocal(QUEST_DONE,done);renderQuests();renderHome()}
function exportCSV(){
 const cols=['azienda','ruolo','stato','inviata_precedentemente','sede','modalita','compatibilita','link','pagina_notion','data_inserimento','prossima_azione'];
 const safe=v=>{let s=String(v??'');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const lines=[cols.map(safe).join(';')].concat(APP.jobs.map(j=>[j.company,j.role,j.status,j.sent?'SI':'NO',j.location,j.mode,j.score,j.url,j.pageUrl,j.dateAdded,j.next].map(safe).join(';')));
 const file=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});download(file,'CareerDex_Opportunita_'+new Date().toISOString().slice(0,10)+'.csv');toast('CSV esportato: '+APP.jobs.length+' posizioni');
}
function exportJSON(){download(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),source:APP.source,jobs:APP.jobs},null,2)],{type:'application/json'}),'CareerDex_Backup.json');toast('Backup JSON esportato')}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1700)}
async function copy(s){try{await navigator.clipboard.writeText(s);toast('Copiato negli appunti')}catch{toast('Il browser non consente la copia: seleziona il testo manualmente')}}
function initEvents(){
 document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');if(nav){setRoute(nav.dataset.nav);return}
  const job=e.target.closest('[data-job]');if(job){openJob(job.dataset.job);return}
  const b=e.target.closest('[data-action]');if(b){const x=b.dataset.action;
   if(x==='new'){$('new-dialog').showModal()}
   if(x==='theme'){document.body.classList.toggle('light');localStorage.setItem('career_dex_light',document.body.classList.contains('light')?'1':'0');renderSettings()}
   if(x==='motion')togglePokemonMotion();
   if(x==='copy')copy(b.dataset.copy);
   if(x==='copy-template')copy(TEMPLATES[b.dataset.template]||'');
   if(x==='export-csv')exportCSV();
   if(x==='export-json')exportJSON();
   if(x==='add-quest')addQuest();
   if(x==='filter-status'){APP.filter=b.dataset.status;APP.jobPage=0;$('job-status').value=APP.filter;setRoute('jobdex')}
   if(x==='reset-quests'){if(confirm('Eliminare le missioni locali e i loro progressi?')){localStorage.removeItem(QUEST_KEY);localStorage.removeItem(QUEST_DONE);renderQuests();renderHome()}}
   if(x==='refresh')sync();
  }
  const del=e.target.closest('[data-delete-quest]');if(del){e.preventDefault();const id=del.dataset.deleteQuest;setLocal(QUEST_KEY,manualQuests().filter(q=>q.id!==id));setQuest(id,false)}
 });
 document.addEventListener('change',e=>{
  const q=e.target.closest('[data-quest]');if(q)setQuest(q.dataset.quest,q.checked);
 });
 $('job-search').addEventListener('input',e=>{APP.query=e.target.value.trim();APP.jobPage=0;renderJobs()});
 $('job-status').addEventListener('change',e=>{APP.filter=e.target.value;APP.jobPage=0;renderJobs()});
 $('job-mode').addEventListener('change',e=>{APP.mode=e.target.value;APP.jobPage=0;renderJobs()});
 $('protected-search').addEventListener('input',e=>{APP.protectedQuery=e.target.value;renderProtected()});
 document.querySelectorAll('[data-protected-filter]').forEach(b=>b.addEventListener('click',()=>{APP.protectedFilter=b.dataset.protectedFilter;document.querySelectorAll('[data-protected-filter]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});renderProtected()}));
 $('followup-filter').addEventListener('change',renderFollowups);
 $('job-sort').addEventListener('change',e=>{APP.sort=e.target.value;APP.jobPage=0;renderJobs()});
 $('job-prev').addEventListener('click',()=>{APP.jobPage--;renderJobs()});
 $('job-next').addEventListener('click',()=>{APP.jobPage++;renderJobs()});
 document.querySelectorAll('[data-quest-filter]').forEach(b=>b.addEventListener('click',()=>{APP.questFilter=b.dataset.questFilter;document.querySelectorAll('[data-quest-filter]').forEach(x=>x.classList.toggle('active',x===b));renderQuests()}));
 $('job-edit-form').addEventListener('submit',updateJob);$('new-job-form').addEventListener('submit',createJob);
 $('menu-toggle').addEventListener('click',()=>{$('sidebar').classList.toggle('open')});
 window.addEventListener('hashchange',()=>{const route=location.hash.slice(1);if(route!==APP.route)setRoute(route)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$('sidebar').classList.remove('open');if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();setRoute('jobdex');$('job-search').focus()}});
 $('refresh').addEventListener('click',sync);
}
function init(){
 if(localStorage.getItem('career_dex_light')==='1')document.body.classList.add('light');
 applyPokemonMotion();
 initEvents();APP.route=ROUTES[location.hash.slice(1)]?location.hash.slice(1):'home';setRoute(APP.route);statusSource(false);sync();
 // Keep Notion data fresh while the dashboard is open, without interrupting form edits.
 window.setInterval(()=>{
  if(document.hidden||APP.source==='loading'||document.querySelector('dialog[open]')||document.querySelector('input:focus,textarea:focus'))return;
  sync();
 },300000);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden||APP.source==='loading')return;
  if(APP.source!=='notion'||!APP.lastSync||Date.now()-new Date(APP.lastSync).getTime()>150000)sync();
 });
}
document.addEventListener('DOMContentLoaded',init);
