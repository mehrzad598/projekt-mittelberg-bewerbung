const form=document.getElementById("applicationForm");
const button=document.getElementById("submitBtn");
const message=document.getElementById("message");
const closedNotice=document.getElementById("closedNotice");
const formCard=form.closest(".form-card");

function setFormEnabled(enabled){
  for(const element of form.elements){
    element.disabled=!enabled;
  }

  button.disabled=!enabled;
  closedNotice.hidden=enabled;
  form.hidden=!enabled;
  formCard.classList.toggle("applications-closed",!enabled);

  const heading=formCard.querySelector("h2");
  if(heading) heading.hidden=!enabled;
}

async function loadApplicationStatus(){
  try{
    const response=await fetch("/api/application-status",{cache:"no-store"});
    const status=await response.json();
    setFormEnabled(Boolean(status.applicationsOpen));

    if(!status.applicationsOpen){
      message.className="message error";
      message.textContent="Die Bewerbungsphase ist aktuell geschlossen.";
    }
  }catch{
    message.className="message error";
    message.textContent="Der Bewerbungsstatus konnte nicht geladen werden.";
  }
}

form.addEventListener("submit",async(event)=>{
  event.preventDefault();
  if(!form.reportValidity()) return;

  const data=new FormData(form);
  button.disabled=true;
  message.className="message";
  message.textContent="Bewerbung wird gesendet …";

  try{
    const response=await fetch("/api/apply",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        role:data.get("role"),
        name:data.get("name"),
        discord:data.get("discord"),
        email:data.get("email"),
        age:data.get("age"),
        experience:data.get("experience"),
        motivation:data.get("motivation"),
        availability:data.get("availability"),
        extra:data.get("extra"),
        consent:data.get("consent")==="on"
      })
    });

    const result=await response.json();
    if(!response.ok) throw new Error(result.error||"Bewerbung konnte nicht gesendet werden.");

    form.reset();
    message.className="message ok";
    message.textContent="✓ Deine Bewerbung wurde erfolgreich gesendet.";
  }catch(error){
    message.className="message error";
    message.textContent=error.message;

    if(error.message.includes("geschlossen")){
      setFormEnabled(false);
    }
  }finally{
    if(closedNotice.hidden) button.disabled=false;
  }
});

loadApplicationStatus();