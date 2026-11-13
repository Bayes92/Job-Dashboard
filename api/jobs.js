// Notion-backed Mission Control API. GET syncs rows; POST creates or updates records.
const DATA_SOURCE_ID="e230210a-39f8-4ab3-b6f9-4ac7b50f0875";
const NOTION_VERSION="2025-09-03";
const STATUSES=["Da valutare","Interessante","Candidatura inviata","Colloquio","Scartata"];
const textValue=value=>String(value??"").slice(0,2000);
const rich=value=>({rich_text:textValue(value)?[{text:{content:textValue(value)}}]:[]});
function plain(prop){const value=prop?.title||prop?.rich_text||[];return Array.isArray(value)?value.map(x=>x.plain_text||x.text?.content||"").join(""):""}
function normalize(page){
 const p=page.properties||{},getText=n=>plain(p[n]),getSelect=n=>p[n]?.select?.name||"";
 return {
  id:page.id,company:getText("Azienda"),role:plain(p["Ruolo"]),
  area:(p["Area"]?.multi_select||[]).map(x=>x.name).join(" · ")||"Da classificare",
  location:getText("Sede")||"Non specificata",mode:getSelect("Modalità")||"Non specificata",
  score:Number.isFinite(p["Compatibilità"]?.number)?p["Compatibilità"].number:0,
  status:getSelect("Stato")||"Da valutare",protected:Boolean(p["Categoria protetta / L.68/99"]?.checkbox),
  url:p["🔗 Link candidatura diretta"]?.url||p["Link annuncio"]?.url||"",
  notes:getText("Note"),next:getText("🧭 Prossima azione"),
  dateAdded:p["Aggiunta alla dashboard"]?.created_time||page.created_time||"",
  deadline:p["Scadenza"]?.date?.start||"",priority:getSelect("Priorità"),pageUrl:page.url
 };
}
async function notion(path,token,method="GET",body){
 const response=await fetch("https://api.notion.com/v1/"+path,{method,headers:{"Authorization":"Bearer "+token,"Notion-Version":NOTION_VERSION,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(data.message||data.error||("Notion API HTTP "+response.status));error.status=response.status;throw error}
 return data;
}
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store, max-age=0");
 const token=process.env.NOTION_KEY||process.env.NOTION_TOKEN;
 if(!token)return res.status(500).json({error:"Variabile NOTION_KEY non configurata su Vercel"});
 try{
  if(req.method==="GET"){
   let cursor;const pages=[];
   do{const data=await notion("data_sources/"+DATA_SOURCE_ID+"/query",token,"POST",{page_size:100,...(cursor?{start_cursor:cursor}:{})});pages.push(...(data.results||[]));cursor=data.has_more?data.next_cursor:null}while(cursor);
   const jobs=pages.map(normalize).filter(j=>j.company||j.role);
   return res.status(200).json({source:"notion",total:jobs.length,jobs,syncedAt:new Date().toISOString()});
  }
  if(req.method!=="POST"){res.setHeader("Allow","GET, POST");return res.status(405).json({error:"Metodo non consentito"})}
  const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
  if(body.action==="update"){
   const {id,status,next}=body;
   if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"ID Notion non valido"});
   if(status!==undefined&&!STATUSES.includes(status))return res.status(400).json({error:"Stato non valido"});
   const properties={};
   if(status!==undefined)properties["Stato"]={select:{name:status}};
   if(next!==undefined)properties["🧭 Prossima azione"]=rich(next);
   if(!Object.keys(properties).length)return res.status(400).json({error:"Nessun campo da aggiornare"});
   const page=await notion("pages/"+id,token,"PATCH",{properties});
   return res.status(200).json({ok:true,job:normalize(page)});
  }
  if(body.action==="create"){
   const j=body.job||{};
   if(!textValue(j.company).trim()||!textValue(j.role).trim())return res.status(400).json({error:"Azienda e ruolo sono obbligatori"});
   const properties={
    "Ruolo":{title:[{text:{content:textValue(j.role)}}]},
    "Azienda":rich(j.company),"Sede":rich(j.location),"Note":rich(j.notes),
    "🧭 Prossima azione":rich(j.next),"Stato":{select:{name:STATUSES.includes(j.status)?j.status:"Da valutare"}},
    "Modalità":{select:{name:["Remoto","Ibrido","In presenza","Non specificata"].includes(j.mode)?j.mode:"Non specificata"}},
    "Compatibilità":{number:Math.max(1,Math.min(10,Number(j.score)||7))},
    "Categoria protetta / L.68/99":{checkbox:Boolean(j.protected)}
   };
   if(j.url)properties["Link annuncio"]={url:textValue(j.url)};
   const page=await notion("pages",token,"POST",{parent:{data_source_id:DATA_SOURCE_ID},properties});
   return res.status(201).json({ok:true,job:normalize(page)});
  }
  return res.status(400).json({error:"Azione non riconosciuta"});
 }catch(error){
  console.error("Mission Control Notion API:",error);
  return res.status(error.status&&error.status<500?error.status:502).json({error:error.message||"Errore Notion"});
 }
};