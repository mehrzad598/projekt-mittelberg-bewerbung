const loginView=document.getElementById("loginView");
const dashboard=document.getElementById("dashboard");
const loginForm=document.getElementById("loginForm");
const loginMessage=document.getElementById("loginMessage");
const logoutBtn=document.getElementById("logoutBtn");
const refreshBtn=document.getElementById("refreshBtn");
const statusFilter=document.getElementById("statusFilter");
const cards=document.getElementById("cards");
const adminMessage=document.getElementById("adminMessage");

const allCount=document.getElementById("allCount");
const newCount=document.getElementById("newCount");
const acceptedCount=document.getElementById("acceptedCount");
const rejectedCount=document.getElementById("rejectedCount");

let applications=[];

function formatDate(value){
  return new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
}

function el(tag,className,text){
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(text!==undefined) node.textContent=text;
  return node;
}

function answer(title,value,full=false){
  const box=el("div",`answer${full?" full":""}`);
  box.append(el("b","",title),el("p","",value||"Keine Angabe"));
  return box;
}

function updateStats(){
  allCount.textContent=applications.length;
  newCount.textContent=applications.filter(a=>a.status==="Neu").length;
  acceptedCount.textContent=applications.filter(a=>a.status==="Angenommen").length;
  rejectedCount.textContent=applications.filter(a=>a.status==="Abgelehnt").length;
}

function render(){
  cards.replaceChildren();
  updateStats();

  const filter=statusFilter.value;
  const visible=applications.filter(a=>filter==="Alle"||a.status===filter);

  if(!visible.length){
    cards.append(el("div","empty","Keine Bewerbungen für diesen Filter."));
    return;
  }

  for(const app of visible){
    const card=el("article","application");
    const head=el("div","application-head");
    const left=el("div");
    left.append(
      el("div","role",app.role),
      el("div","name",`${app.name} · ${app.discord}`),
      el("div","meta",`${app.email} · ${app.age} · ${formatDate(app.createdAt)}`)
    );
    head.append(left,el("span","badge",app.status));

    const answers=el("div","answers");
    answers.append(
      answer("Erfahrung",app.experience,true),
      answer("Motivation",app.motivation,true),
      answer("Verfügbarkeit",app.availability),
      answer("Weitere Angaben",app.extra||"Keine")
    );

    const actions=el("div","card-actions");
    const select=document.createElement("select");
    for(const status of ["Neu","In Prüfung","Angenommen","Abgelehnt"]){
      const option=document.createElement("option");
      option.value=status;
      option.textContent=status;
      option.selected=status===app.status;
      select.append(option);
    }

    const save=el("button","btn","Status speichern");
    save.addEventListener("click",()=>saveStatus(app.id,select.value));

    const email=el("a","btn","E-Mail schreiben");
    email.href=`mailto:${app.email}?subject=${encodeURIComponent(`Projekt Mittelberg Bewerbung als ${app.role}`)}`;

    const remove=el("button","btn danger","Löschen");
    remove.addEventListener("click",()=>deleteApplication(app.id));

    actions.append(select,save,email,remove);
    card.append(head,answers,actions);
    cards.append(card);
  }
}

async function loadApplications(){
  adminMessage.textContent="Bewerbungen werden geladen …";
  const response=await fetch("/api/admin/applications");

  if(response.status===401){
    showLogin();
    return;
  }

  const result=await response.json();
  if(!response.ok){
    adminMessage.className="message error";
    adminMessage.textContent=result.error||"Fehler beim Laden.";
    return;
  }

  applications=result.applications||[];
  render();
  adminMessage.className="message ok";
  adminMessage.textContent=`${applications.length} Bewerbung(en) geladen.`;
}

async function saveStatus(id,status){
  const response=await fetch(`/api/admin/applications/${id}`,{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status})
  });
  const result=await response.json();

  if(!response.ok){
    adminMessage.className="message error";
    adminMessage.textContent=result.error||"Status konnte nicht gespeichert werden.";
    return;
  }

  const index=applications.findIndex(a=>a.id===id);
  if(index>=0) applications[index]=result;
  render();
  adminMessage.className="message ok";
  adminMessage.textContent="✓ Status gespeichert.";
}

async function deleteApplication(id){
  if(!confirm("Diese Bewerbung wirklich löschen?")) return;
  const response=await fetch(`/api/admin/applications/${id}`,{method:"DELETE"});
  if(response.ok){
    applications=applications.filter(a=>a.id!==id);
    render();
  }
}

function showLogin(){
  loginView.hidden=false;
  dashboard.hidden=true;
  logoutBtn.hidden=true;
}

function showDashboard(){
  loginView.hidden=true;
  dashboard.hidden=false;
  logoutBtn.hidden=false;
}

loginForm.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const password=document.getElementById("password").value;
  const response=await fetch("/api/admin/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password})
  });
  const result=await response.json();

  if(!response.ok){
    loginMessage.className="message error";
    loginMessage.textContent=result.error||"Anmeldung fehlgeschlagen.";
    return;
  }

  loginForm.reset();
  showDashboard();
  loadApplications();
});

logoutBtn.addEventListener("click",async()=>{
  await fetch("/api/admin/logout",{method:"POST"});
  showLogin();
});

refreshBtn.addEventListener("click",loadApplications);
statusFilter.addEventListener("change",render);

(async()=>{
  const me=await fetch("/api/admin/me").then(r=>r.json());
  if(me.loggedIn){
    showDashboard();
    loadApplications();
  }else{
    showLogin();
  }
})();