const form=document.getElementById("applicationForm");
const button=document.getElementById("submitBtn");
const message=document.getElementById("message");

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
  }finally{
    button.disabled=false;
  }
});