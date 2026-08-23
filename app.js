const KEY = "ctd_worker_hajeri_v2";

const defaultData = {
  workers: [{id: crypto.randomUUID(), name: "ARMAN", rate: 0, phone: ""}],
  attendance: {}
};

let data = loadData();

const dateInput = document.getElementById("dateInput");
const searchInput = document.getElementById("searchInput");
const workerTable = document.getElementById("workerTable");
const monthlyTable = document.getElementById("monthlyTable");
const modal = document.getElementById("modal");
const workerName = document.getElementById("workerName");
const workerRate = document.getElementById("workerRate");
const workerPhone = document.getElementById("workerPhone");
const editWorkerId = document.getElementById("editWorkerId");

dateInput.value = todayISO();

function loadData(){
  try{
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : defaultData;
  }catch(e){ return defaultData; }
}
function saveData(){ localStorage.setItem(KEY, JSON.stringify(data)); }
function todayISO(){
  const d = new Date();
  return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function selectedDate(){ return dateInput.value || todayISO(); }
function statusFor(workerId, date=selectedDate()){
  return (data.attendance[date] && data.attendance[date][workerId]) || "Present";
}
function setStatus(workerId,status,date=selectedDate()){
  if(!data.attendance[date]) data.attendance[date] = {};
  data.attendance[date][workerId] = status;
  saveData(); render();
}
function filteredWorkers(){
  const q = searchInput.value.trim().toLowerCase();
  return data.workers.filter(w => w.name.toLowerCase().includes(q));
}
function render(){
  const workers = filteredWorkers();
  const date = selectedDate();
  document.getElementById("selectedDateLabel").textContent = formatDate(date);

  let present=0, absent=0, half=0;
  data.workers.forEach(w=>{
    const s=statusFor(w.id,date);
    if(s==="Present") present++;
    if(s==="Absent") absent++;
    if(s==="Half Day") half++;
  });
  document.getElementById("totalCount").textContent=data.workers.length;
  document.getElementById("presentCount").textContent=present;
  document.getElementById("absentCount").textContent=absent;
  document.getElementById("halfCount").textContent=half;

  workerTable.innerHTML = workers.map((w,i)=>{
    const s=statusFor(w.id,date);
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${esc(w.name)}</strong></td>
      <td>₹${Number(w.rate||0).toLocaleString("en-IN")}</td>
      <td>
        <select class="status-select" onchange="changeStatus('${w.id}',this.value)">
          <option ${s==="Present"?"selected":""}>Present</option>
          <option ${s==="Absent"?"selected":""}>Absent</option>
          <option ${s==="Half Day"?"selected":""}>Half Day</option>
        </select>
      </td>
      <td class="actions">
        <button class="edit" onclick="openEdit('${w.id}')">Edit</button>
        <button class="danger" onclick="deleteWorker('${w.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
  document.getElementById("emptyState").style.display = workers.length ? "none":"block";
  renderMonthly();
}
function renderMonthly(){
  const [year,month] = selectedDate().split("-").map(Number);
  const start = new Date(year,month-1,1);
  const end = new Date(year,month,0);
  monthlyTable.innerHTML = data.workers.map(w=>{
    let p=0,h=0,a=0;
    for(let d=1;d<=end.getDate();d++){
      const iso = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const s=statusFor(w.id,iso);
      if(s==="Present") p++;
      else if(s==="Half Day") h++;
      else a++;
    }
    const payable=p+(h*0.5);
    const salary=payable*Number(w.rate||0);
    return `<tr><td>${esc(w.name)}</td><td>${p}</td><td>${h}</td><td>${a}</td><td>${payable}</td><td>₹${salary.toLocaleString("en-IN")}</td></tr>`;
  }).join("");
}
function formatDate(iso){
  const [y,m,d]=iso.split("-");
  return `${d}-${m}-${y}`;
}
function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
window.changeStatus=(id,status)=>setStatus(id,status);
window.openEdit=(id)=>{
  const w=data.workers.find(x=>x.id===id); if(!w)return;
  document.getElementById("modalTitle").textContent="Edit Worker";
  editWorkerId.value=w.id; workerName.value=w.name; workerRate.value=w.rate||""; workerPhone.value=w.phone||"";
  modal.classList.remove("hidden"); workerName.focus();
};
window.deleteWorker=(id)=>{
  const w=data.workers.find(x=>x.id===id); if(!w)return;
  if(!confirm(`Delete worker "${w.name}"?`)) return;
  data.workers=data.workers.filter(x=>x.id!==id);
  Object.keys(data.attendance).forEach(date=>delete data.attendance[date][id]);
  saveData(); render();
};

document.getElementById("addWorkerBtn").onclick=()=>{
  document.getElementById("modalTitle").textContent="Add Worker";
  editWorkerId.value=""; workerName.value=""; workerRate.value=""; workerPhone.value="";
  modal.classList.remove("hidden"); workerName.focus();
};
function closeModal(){modal.classList.add("hidden")}
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("cancelBtn").onclick=closeModal;
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});

document.getElementById("saveWorkerBtn").onclick=()=>{
  const name=workerName.value.trim();
  if(!name){alert("Please enter worker name."); workerName.focus(); return;}
  const id=editWorkerId.value;
  if(id){
    const w=data.workers.find(x=>x.id===id);
    if(w){w.name=name;w.rate=Number(workerRate.value||0);w.phone=workerPhone.value.trim();}
  }else{
    data.workers.push({id:crypto.randomUUID(),name,rate:Number(workerRate.value||0),phone:workerPhone.value.trim()});
  }
  saveData(); closeModal(); render();
};

document.getElementById("allPresentBtn").onclick=()=>{
  if(!data.workers.length)return;
  const date=selectedDate();
  if(!data.attendance[date])data.attendance[date]={};
  data.workers.forEach(w=>data.attendance[date][w.id]="Present");
  saveData();render();
};
dateInput.onchange=render;
searchInput.oninput=render;

document.getElementById("printBtn").onclick=()=>{
  window.print();
};

document.getElementById("exportBtn").onclick=()=>{
  const rows=[["Date","Worker Name","Daily Rate","Status"]];
  const dates=Object.keys(data.attendance).sort();
  dates.forEach(date=>{
    data.workers.forEach(w=>{
      rows.push([date,w.name,w.rate,statusFor(w.id,date)]);
    });
  });
  if(rows.length===1){
    rows.push([selectedDate(),"No attendance saved yet","",""]);
  }
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="CTD-Worker-Hajeri.csv";a.click();
};

render();
