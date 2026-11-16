import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createInterface} from "node:readline/promises";
import {chromium} from "playwright";

const dir=path.dirname(fileURLToPath(import.meta.url));
const configPath=path.join(dir,"config.local.json");
if(!fs.existsSync(configPath)) {
  console.error("Configurazione mancante. Avvia prima: npm run setup");
  process.exit(1);
}
const config=JSON.parse(fs.readFileSync(configPath,"utf8"));
for(const cv of [config.cvIt,config.cvEn]){
  if(!cv||!fs.existsSync(cv)){console.error("CV non trovato: ripeti npm run setup");process.exit(1)}
}
const args=process.argv.slice(2);
const value=(key,defaultValue="")=>{
  const flag=args.find(s=>s.startsWith("--"+key+"="));
  return flag?flag.slice(key.length+3):defaultValue;
};
const dayFormatter=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"});
const targetDay=value("date",dayFormatter.format(new Date()));
const api=value("feed","https://mission-control-jacopo.vercel.app/api/jobs");
const appliedFile=path.join(dir,"data","applied.csv");
fs.mkdirSync(path.dirname(appliedFile),{recursive:true});
if(!fs.existsSync(appliedFile))fs.writeFileSync(appliedFile,"date,company,role,url,source\n",{mode:0o600});
function csvColumns(line) {
  const list=[];let current="",inQuotes=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'&&inQuotes&&line[i+1]==='"'){current+='"';i++}
    else if(ch==='"')inQuotes=!inQuotes;
    else if(ch===","&&!inQuotes){list.push(current);current=""}
    else current+=ch;
  }
  list.push(current);return list;
}
function readApplied(file){
  if(!fs.existsSync(file))return [];
  return fs.readFileSync(file,"utf8").split(/\r?\n/).slice(1).filter(Boolean).map(row=>{
    const [date,company,role,url]=csvColumns(row);return {date,company,role,url};
  });
}
const externalPath=value("applied-csv");
if(externalPath&&!fs.existsSync(externalPath)) {
  console.error("Registro esterno non trovato: "+externalPath);
  process.exit(1);
}
const entries=[...readApplied(appliedFile),...(externalPath?readApplied(externalPath):[])];
const norm=x=>String(x||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const canonical=x=>{try{const u=new URL(x);return u.host+u.pathname.replace(/\/$/,"")}catch{return norm(x)}};
function duplicate(job){
  return entries.some(x=>canonical(x.url)===canonical(job.url)||(norm(x.company)===norm(job.company)&&norm(x.role)===norm(job.role)));
}
const response=await fetch(api,{headers:{Accept:"application/json"}});
if(!response.ok)throw Error("Mission Control API: HTTP "+response.status);
const payload=await response.json();
if(payload.source!=="notion"||!Array.isArray(payload.jobs))throw Error("L'API non restituisce un elenco Notion valido");
const jobs=payload.jobs.filter(j=>
  (args.includes("--all")||j.dateAdded&&dayFormatter.format(new Date(j.dateAdded))===targetDay)
  &&["Da valutare","Interessante"].includes(j.status)
  &&j.url&&!duplicate(j)
  &&(!value("id")||j.id===value("id"))
);
if(!jobs.length){console.log("Nessuna offerta da preparare per i filtri scelti.");process.exit(0)}
const cli=createInterface({input:process.stdin,output:process.stdout});
const ask=message=>cli.question(message);
const choice=[];
console.log("\nCAREER AUTOAPPLY — MODALITA ASSISTITA\n");
jobs.forEach((j,i)=>console.log(String(i+1).padStart(2," ")+") "+j.company+" — "+j.role+" | "+j.location+" | "+j.mode));
console.log("\nStati Notion e CSV locale controllati. NON sono controllati automaticamente Gmail Inviati e gli eventuali registri esterni non indicati.");
console.log("NON verra eseguito alcun invio automatico sul sito.");
const selected=(await ask("\nIndici separati da virgola, oppure 'tutti': ")).trim().toLowerCase();
if(selected==="tutti")choice.push(...jobs);
else {
  for(const i of new Set(selected.split(",").map(Number))){
    if(Number.isInteger(i)&&i>=1&&i<=jobs.length)choice.push(jobs[i-1]);
  }
}
if(!choice.length){console.log("Nessuna selezione.");cli.close();process.exit(0)}
const browser=await chromium.launchPersistentContext(path.join(dir,".profile"),{
  headless:false,viewport:{width:1400,height:900},acceptDownloads:true
});
async function fill(page,regex,text) {
  if(!text)return false;
  for(const candidate of [page.getByLabel(regex).first(),page.getByPlaceholder(regex).first()]){
    try{
      if(await candidate.count()&&await candidate.isVisible()){
        await candidate.fill(text,{timeout:2200});return true;
      }
    }catch{}
  }
  return false;
}
async function uploadCV(page,file){
  const inputs=page.locator('input[type="file"]');
  const count=await inputs.count();
  if(count===1){await inputs.first().setInputFiles(file);return true}
  for(let i=0;i<count;i++){
    const input=inputs.nth(i);
    const nearby=await input.evaluate(el=>{
      const a=el.closest("label")?.textContent||"";
      const b=el.parentElement?.parentElement?.textContent||"";
      return (a+" "+b).slice(0,600);
    }).catch(()=>"");
    if(/\bcv\b|resume|curriculum|upload.*file|allega.*cv/i.test(nearby)){
      await input.setInputFiles(file);return true;
    }
  }
  return false;
}
function confirmation(text){
  return /thank you for applying|thank you for your application|application submitted|your application has been submitted|application received|candidatura inviata|grazie per la candidatura|abbiamo ricevuto la tua candidatura/i.test(text);
}
const csv=x=>'"'+String(x??"").replaceAll('"','""')+'"';
try {
  for(const job of choice) {
    if(duplicate(job)){console.log("Duplicato: "+job.company+" / "+job.role);continue}
    console.log("\n========================================");
    console.log(job.company+" — "+job.role+"\n"+job.url);
    console.log("NOTA: conferma che il ruolo sia aperto e che tu possa lavorare dall'Italia.");
    const page=await browser.newPage();
    try {
      await page.goto(job.url,{waitUntil:"domcontentloaded",timeout:45000});
      const pageText=await page.locator("body").innerText().catch(()=>"");
      if(/job not found|this job is no longer available|position is closed|job posting has expired/i.test(pageText)){
        console.log("Annuncio probabilmente chiuso. Non compilato.");continue;
      }
      console.log("Se necessario clicca Apply nel browser e attendi la comparsa del modulo.");
      await ask("Premi INVIO quando vedi i campi del modulo: ");
      let done=0;
      const pairs=[
        [/^(first name|nome)(\s*\*)?$/i,config.firstName],
        [/^(last name|cognome|surname)(\s*\*)?$/i,config.lastName],
        [/^(full name|nome completo)(\s*\*)?$/i,config.firstName+" "+config.lastName],
        [/^(email|e-mail|email address|indirizzo email)(\s*\*)?$/i,config.email],
        [/^(phone|phone number|telefono|numero di telefono)(\s*\*)?$/i,config.phone],
        [/linkedin/i,config.linkedin]
      ];
      for(const [re,v] of pairs)if(await fill(page,re,v))done++;
      const cv=/cgm consulting/i.test(job.company)?config.cvIt:config.cvEn;
      const attached=await uploadCV(page,cv).catch(err=>(console.log("CV: "+err.message),false));
      console.log("Campi di contatto compilati: "+done+"; CV allegato: "+(attached?"SI":"NO"));
      console.log("Verifica manualmente: ogni risposta, disponibilita, retribuzione, consenso, eligibility Italia e CV.");
      console.log("Prima dell'invio controlla anche Gmail Inviati e ogni altro registro candidature.");
      console.log("ATTENZIONE: per inviare, premi tu Submit / Invia nel browser.");
      await ask("Dopo l'invio o la rinuncia, premi INVIO: ");
      const after=await page.locator("body").innerText().catch(()=>"");
      if(!confirmation(after)){
        console.log("Nessuna conferma riconosciuta: candidatura NON registrata.");continue;
      }
      console.log("Trovato un testo compatibile con la conferma sul sito.");
      const ok=(await ask("Hai verificato che questa specifica candidatura sia stata inviata? Digita SI: ")).trim().toUpperCase();
      if(ok!=="SI"){console.log("Non registrata.");continue}
      fs.appendFileSync(appliedFile,[new Date().toISOString(),job.company,job.role,job.url,"Conferma visiva"].map(csv).join(",")+"\n");
      entries.push({company:job.company,role:job.role,url:job.url});
      console.log("Registrata nel CSV LOCALE. Aggiorna lo stato su Notion solo dopo la conferma di invio.");
    }catch(err){console.error("Errore nel modulo: "+err.message)}
    finally{await page.close().catch(()=>{})}
  }
}finally{
  await browser.close().catch(()=>{});
  cli.close();
}
console.log("\nFine sessione. Invii non confermati NON registrati.");
