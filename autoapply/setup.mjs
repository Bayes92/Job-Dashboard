import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import {createInterface} from "node:readline/promises";

const dir=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(dir,"config.local.json");
const cli=createInterface({input:process.stdin,output:process.stdout});
function cleanFile(value) {
  let v=value.trim().replace(/^["']|["']$/g,"").replace(/\\ /g," ");
  if(v.startsWith("~/"))v=path.join(os.homedir(),v.slice(2));
  return path.resolve(v);
}
async function field(label,old="") {
  const answer=(await cli.question(label+(old?" ["+old+"]":"")+": ")).trim();
  return answer||old;
}
async function pdf(label,old="") {
  for(;;){
    const raw=await field(label+" (trascina il PDF nel Terminale)",old);
    if(!raw){console.log("Serve il file PDF.");continue}
    const v=cleanFile(raw);
    if(fs.existsSync(v)&&v.toLowerCase().endsWith(".pdf"))return v;
    console.log("PDF non trovato: "+v);
  }
}
try {
  let prev={};if(fs.existsSync(file))prev=JSON.parse(fs.readFileSync(file,"utf8"));
  console.log("\nCONFIGURAZIONE SOLO LOCALE: i dati non saranno pubblicati su GitHub.\n");
  const conf={
    firstName:await field("Nome",prev.firstName||""),
    lastName:await field("Cognome",prev.lastName||""),
    email:await field("Email",prev.email||""),
    phone:await field("Telefono internazionale",prev.phone||""),
    linkedin:await field("URL profilo LinkedIn",prev.linkedin||""),
    cvEn:await pdf("CV inglese",prev.cvEn||""),
    cvIt:await pdf("CV italiano",prev.cvIt||"")
  };
  if(!conf.firstName||!conf.lastName||!conf.email.includes("@"))throw Error("Nome, cognome ed email sono obbligatori.");
  fs.writeFileSync(file,JSON.stringify(conf,null,2)+"\n",{mode:0o600});
  fs.chmodSync(file,0o600);
  console.log("\nConfigurazione salvata solo in "+file);
  console.log("Esegui: npm start -- --date=2026-11-16\n");
}finally{cli.close()}
