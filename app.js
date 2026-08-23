const STORAGE_KEY = "ctd_worker_hajeri_v1";
let workers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const dateInput = document.getElementById("dateInput");
const searchInput = document.getElementById("searchInput");
const table = document.getElementById("workerTable");
const emptyMsg = document.getElementById("emptyMsg");
const modal = document.getElementById("modal");
const workerName = document.getElementById("workerName");
const editIndex = document.getElementById("editIndex");

dateInput.value = new Date().toISOString().slice(0,10);

function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(workers)); }

function getDayStatus(worker, date){
  return worker.attendance?.[date] || "Absent";
}

function setDayStatus(worker, date, status){
  worker.attendance = worker.attendance || {};
  worker.attendance[date] = status;
  saveData();
}

function render(){
  const date = dateInput.value;
  const q = searchInput.value.trim().toLowerCase();
  const filtered = workers.filter(w => w.name.toLowerCase().includes(q));

  table.innerHTML = "";
  filtered.forEach((w, i) => {
    const realIndex = workers.indexOf(w);
    const status = getDayStatus(w,date);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><strong>${escapeHtml(w.name)}</strong></td>
      <td>
        <select class="status" data-index="${realIndex}">
          <option value="Present" ${status==="Present"?"selected":""}>Present</option>
          <option value="Absent" ${status==="Absent"?"selected":""}>Absent</option>
          <option value="Half Day" ${status==="Half Day"?"selected":""}>Half Day</option>
        </select>
      </td>
      <td class="actions">
        <button class="edit" data-edit="${realIndex}">Edit</button>
        <button class="delete" data-delete="${realIndex}">Delete</button>
      </td>`;
    table.appendChild(tr);
  });

  emptyMsg.style.display = filtered.length ? "none" : "block";
  const statuses = workers.map(w => getDayStatus(w,date));
  document.getElementById("totalCount").textContent = workers.length;
  document.getElementById("presentCount").textContent = statuses.filter(x=>x==="Present").length;
  document.getElementById("absentCount").textContent = statuses.filter(x=>x==="Absent").length;

  document.querySelectorAll(".status").forEach(el => {
    el.addEventListener("change", e => {
      setDayStatus(workers[Number(e.target.dataset.index)], date, e.target.value);
      render();
    });
  });
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEdit(Number(btn.dataset.edit)));
  });
  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.delete);
      if(confirm(`Delete ${workers[idx].name}?`)){
        workers.splice(idx,1); saveData(); render();
      }
    });
  });
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function openAdd(){
  document.getElementById("modalTitle").textContent = "Add Worker";
  editIndex.value = "";
  workerName.value = "";
  modal.classList.remove("hidden");
  workerName.focus();
}
function openEdit(idx){
  document.getElementById("modalTitle").textContent = "Edit Worker";
  editIndex.value = idx;
  workerName.value = workers[idx].name;
  modal.classList.remove("hidden");
  workerName.focus();
}
function closeModal(){ modal.classList.add("hidden"); }

document.getElementById("addBtn").addEventListener("click", openAdd);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
document.getElementById("saveBtn").addEventListener("click", () => {
  const name = workerName.value.trim();
  if(!name){ alert("Please enter worker name."); workerName.focus(); return; }
  const idx = editIndex.value;
  if(idx === "") workers.push({name, attendance:{}});
  else workers[Number(idx)].name = name;
  saveData(); closeModal(); render();
});
workerName.addEventListener("keydown", e => { if(e.key==="Enter") document.getElementById("saveBtn").click(); });
modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });
dateInput.addEventListener("change", render);
searchInput.addEventListener("input", render);

document.getElementById("exportBtn").addEventListener("click", () => {
  const date = dateInput.value;
  let csv = "Worker Name,Date,Status\\n";
  workers.forEach(w => { csv += `"${w.name.replaceAll('"','""')}","${date}","${getDayStatus(w,date)}"\\n`; });
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `worker-hajeri-${date}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

render();
