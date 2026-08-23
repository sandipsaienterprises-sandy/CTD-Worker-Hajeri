const KEY = "ctd_worker_hajeri_v5";

const defaultData = {
  workers: [],
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
const workerOTRate = document.getElementById("workerOTRate");
const workerPhone = document.getElementById("workerPhone");
const editWorkerId = document.getElementById("editWorkerId");

dateInput.value = todayISO();


// =============================
// LOAD DATA
// =============================

function loadData() {

  try {

    const saved = localStorage.getItem(KEY);

    if (!saved) {

      return {
        workers: [],
        attendance: {}
      };

    }

    const parsed = JSON.parse(saved);

    if (!parsed.workers) {
      parsed.workers = [];
    }

    if (!parsed.attendance) {
      parsed.attendance = {};
    }

    parsed.workers.forEach(w => {

      if (w.otRate === undefined) {
        w.otRate = 0;
      }

      if (w.phone === undefined) {
        w.phone = "";
      }

    });

    return parsed;

  } catch (e) {

    return {
      workers: [],
      attendance: {}
    };

  }

}


// =============================
// SAVE DATA
// =============================

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}


// =============================
// TODAY
// =============================

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
  .toISOString()
  .slice(0, 10);

}


function selectedDate() {

  return dateInput.value || todayISO();

}


// =============================
// ATTENDANCE
// =============================

function getSavedAttendance(workerId, date) {

  if (
    data.attendance[date] &&
    data.attendance[date][workerId]
  ) {

    return data.attendance[date][workerId];

  }

  return null;

}


function getDailyAttendance(workerId, date) {

  const saved =
    getSavedAttendance(workerId, date);

  if (saved) {

    return {
      status: saved.status || "Present",
      otHours: Number(saved.otHours || 0),
      advance: Number(saved.advance || 0),
      payment: saved.payment || "Pending"
    };

  }

  return {
    status: "Present",
    otHours: 0,
    advance: 0,
    payment: "Pending"
  };

}


function saveAttendance(
  workerId,
  values,
  date = selectedDate()
) {

  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }

  const old =
    getSavedAttendance(workerId, date) || {
      status: "Present",
      otHours: 0,
      advance: 0,
      payment: "Pending"
    };

  data.attendance[date][workerId] = {

    ...old,
    ...values,
    submitted: true

  };

  saveData();

  render();

}


// =============================
// SEARCH DROPDOWN
// =============================

let workerDropdown = null;


function createWorkerDropdown() {

  if (workerDropdown) return;

  workerDropdown =
    document.createElement("div");

  workerDropdown.id =
    "workerDropdown";

  workerDropdown.style.position = "absolute";
  workerDropdown.style.background = "white";
  workerDropdown.style.border = "1px solid #ddd";
  workerDropdown.style.borderRadius = "10px";
  workerDropdown.style.boxShadow =
    "0 8px 20px rgba(0,0,0,0.15)";
  workerDropdown.style.zIndex = "9999";
  workerDropdown.style.maxHeight = "260px";
  workerDropdown.style.overflowY = "auto";
  workerDropdown.style.display = "none";

  document.body.appendChild(workerDropdown);

}


function positionWorkerDropdown() {

  if (!workerDropdown) return;

  const rect =
    searchInput.getBoundingClientRect();

  workerDropdown.style.left =
    rect.left + window.scrollX + "px";

  workerDropdown.style.top =
    rect.bottom + window.scrollY + 4 + "px";

  workerDropdown.style.width =
    rect.width + "px";

}


function showWorkerDropdown() {

  createWorkerDropdown();

  const query =
    searchInput.value
      .trim()
      .toLowerCase();

  const workers =
    data.workers.filter(w => {

      return w.name
        .toLowerCase()
        .includes(query);

    });


  workerDropdown.innerHTML = "";


  if (!workers.length) {

    const empty =
      document.createElement("div");

    empty.textContent =
      "No worker found";

    empty.style.padding = "14px";

    empty.style.color = "#777";

    workerDropdown.appendChild(empty);

  }


  workers.forEach(worker => {

    const item =
      document.createElement("div");

    item.textContent =
      worker.name;

    item.style.padding =
      "12px 15px";

    item.style.cursor =
      "pointer";

    item.style.borderBottom =
      "1px solid #eee";

    item.style.fontWeight =
      "600";


    item.onmouseenter = function() {

      item.style.background =
        "#f1f5ff";

    };


    item.onmouseleave = function() {

      item.style.background =
        "white";

    };


    item.onclick = function() {

      searchInput.value =
        worker.name;

      workerDropdown.style.display =
        "none";

      render();

    };


    workerDropdown.appendChild(item);

  });


  positionWorkerDropdown();

  workerDropdown.style.display =
    "block";

}


// Show ALL workers when click
searchInput.addEventListener(
  "focus",
  showWorkerDropdown
);


// Show/filter workers while typing
searchInput.addEventListener(
  "input",
  function() {

    showWorkerDropdown();

    render();

  }
);


// Close dropdown outside
document.addEventListener(
  "click",
  function(e) {

    if (
      e.target !== searchInput &&
      workerDropdown &&
      !workerDropdown.contains(e.target)
    ) {

      workerDropdown.style.display =
        "none";

    }

  }
);


window.addEventListener(
  "resize",
  positionWorkerDropdown
);

window.addEventListener(
  "scroll",
  positionWorkerDropdown
);


// =============================
// FILTER WORKERS
// =============================

function filteredWorkers() {

  const q =
    searchInput.value
      .trim()
      .toLowerCase();

  if (!q) {

    return data.workers;

  }

  return data.workers.filter(w =>

    w.name
      .toLowerCase()
      .includes(q)

  );

}


// =============================
// RENDER
// =============================

function render() {

  const workers =
    filteredWorkers();

  const date =
    selectedDate();


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  let present = 0;
  let absent = 0;
  let half = 0;


  data.workers.forEach(w => {

    const saved =
      getSavedAttendance(
        w.id,
        date
      );


    // IMPORTANT:
    // Only count attendance
    // if it is actually saved.

    if (!saved) return;


    if (
      saved.status === "Present"
    ) {

      present++;

    }

    else if (
      saved.status === "Absent"
    ) {

      absent++;

    }

    else if (
      saved.status === "Half Day"
    ) {

      half++;

    }

  });


  document.getElementById(
    "totalCount"
  ).textContent =
    data.workers.length;


  document.getElementById(
    "presentCount"
  ).textContent =
    present;


  document.getElementById(
    "absentCount"
  ).textContent =
    absent;


  document.getElementById(
    "halfCount"
  ).textContent =
    half;


  workerTable.innerHTML =
    workers.map((w, i) => {


      const saved =
        getSavedAttendance(
          w.id,
          date
        );


      const a =
        getDailyAttendance(
          w.id,
          date
        );


      const submitted =
        saved && saved.submitted;


      return `

        <tr>

          <td>
            ${i + 1}
          </td>


          <td>
            <strong>
              ${esc(w.name)}
            </strong>
          </td>


          <td>
            ₹${Number(
              w.rate || 0
            ).toLocaleString("en-IN")}
          </td>


          <td>

            <select
              class="status-select"
              onchange="
                changeStatus(
                  '${w.id}',
                  this.value
                )
              "
              ${submitted ? "disabled" : ""}
            >

              <option value="Present"
                ${a.status === "Present"
                  ? "selected"
                  : ""}
              >
                Present
              </option>


              <option value="Absent"
                ${a.status === "Absent"
                  ? "selected"
                  : ""}
              >
                Absent
              </option>


              <option value="Half Day"
                ${a.status === "Half Day"
                  ? "selected"
                  : ""}
              >
                Half Day
              </option>

            </select>

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="0.5"
              value="${a.otHours}"
              onchange="
                changeOT(
                  '${w.id}',
                  this.value
                )
              "
              ${submitted ? "disabled" : ""}
            >

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="1"
              value="${a.advance}"
              onchange="
                changeAdvance(
                  '${w.id}',
                  this.value
                )
              "
              ${submitted ? "disabled" : ""}
            >

          </td>


          <td class="attendance-action">

            ${
              submitted

              ?

              `
                <button
                  class="edit"
                  onclick="
                    editAttendance(
                      '${w.id}'
                    )
                  "
                >
                  Edit
                </button>
              `

              :

              `
                <button
                  class="primary"
                  onclick="
                    submitAttendance(
                      '${w.id}'
                    )
                  "
                >
                  Submit
                </button>
              `
            }

          </td>


          <td class="actions">

            <button
              class="edit"
              onclick="
                openEdit('${w.id}')
              "
            >
              Edit
            </button>


            <button
              class="danger"
              onclick="
                deleteWorker('${w.id}')
              "
            >
              Delete
            </button>

          </td>

        </tr>

      `;

    }).join("");


  document.getElementById(
    "emptyState"
  ).style.display =
    workers.length
      ? "none"
      : "block";


  renderMonthly();

}


// =============================
// SUBMIT ATTENDANCE
// =============================

window.submitAttendance =
function(id) {

  const a =
    getDailyAttendance(
      id,
      selectedDate()
    );


  saveAttendance(
    id,
    {
      status: a.status,
      otHours: a.otHours,
      advance: a.advance
    }
  );

};


// =============================
// EDIT ATTENDANCE
// =============================

window.editAttendance =
function(id) {

  const date =
    selectedDate();


  if (
    data.attendance[date] &&
    data.attendance[date][id]
  ) {

    data.attendance[date][id]
      .submitted = false;

  }


  saveData();

  render();

};


// =============================
// STATUS
// =============================

window.changeStatus =
function(id, status) {

  const old =
    getDailyAttendance(
      id,
      selectedDate()
    );


  if (
    data.attendance[selectedDate()] &&
    data.attendance[selectedDate()][id]
  ) {

    data.attendance[selectedDate()][id]
      .status = status;

    saveData();

    render();

  }

};


// =============================
// OT
// =============================

window.changeOT =
function(id, value) {

  const date =
    selectedDate();


  if (
    data.attendance[date] &&
    data.attendance[date][id]
  ) {

    data.attendance[date][id]
      .otHours =
      Number(value || 0);

    saveData();

    render();

  }

};


// =============================
// ADVANCE
// =============================

window.changeAdvance =
function(id, value) {

  const date =
    selectedDate();


  if (
    data.attendance[date] &&
    data.attendance[date][id]
  ) {

    data.attendance[date][id]
      .advance =
      Number(value || 0);

    saveData();

    render();

  }

};


// =============================
// MONTHLY PAYMENT
// =============================

window.changeMonthlyPayment =
function(id, value) {

  const [year, month] =
    selectedDate()
      .split("-")
      .map(Number);


  const days =
    new Date(
      year,
      month,
      0
    ).getDate();


  for (
    let d = 1;
    d <= days;
    d++
  ) {

    const iso =
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


    if (
      data.attendance[iso] &&
      data.attendance[iso][id]
    ) {

      data.attendance[iso][id]
        .payment = value;

    }

  }


  saveData();

  render();

};


// =============================
// MONTHLY SUMMARY
// =============================

function renderMonthly() {

  const [year, month] =
    selectedDate()
      .split("-")
      .map(Number);


  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();


  monthlyTable.innerHTML =
    data.workers.map(w => {


      let present = 0;
      let half = 0;
      let absent = 0;
      let otHours = 0;
      let advance = 0;

      let lastPayment =
        "Pending";


      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


        const saved =
          getSavedAttendance(
            w.id,
            iso
          );


        // VERY IMPORTANT:
        // If no attendance saved,
        // don't count that day.

        if (!saved) continue;


        if (
          saved.status === "Present"
        ) {

          present++;

        }

        else if (
          saved.status === "Half Day"
        ) {

          half++;

        }

        else if (
          saved.status === "Absent"
        ) {

          absent++;

        }


        otHours +=
          Number(
            saved.otHours || 0
          );


        advance +=
          Number(
            saved.advance || 0
          );


        if (saved.payment) {

          lastPayment =
            saved.payment;

        }

      }


      const payableDays =
        present +
        (half * 0.5);


      const grossSalary =
        payableDays *
        Number(w.rate || 0);


      const overtimeAmount =
        otHours *
        Number(w.otRate || 0);


      const totalSalary =
        grossSalary +
        overtimeAmount;


      const netSalary =
        Math.max(
          0,
          totalSalary - advance
        );


      return `

        <tr>

          <td>
            <strong>
              ${esc(w.name)}
            </strong>
          </td>


          <td>
            ${present}
          </td>


          <td>
            ${half}
          </td>


          <td>
            ${absent}
          </td>


          <td>
            ${otHours}
          </td>


          <td>
            ${payableDays}
          </td>


          <td>
            ₹${grossSalary.toLocaleString("en-IN")}
          </td>


          <td>
            ₹${advance.toLocaleString("en-IN")}
          </td>


          <td>
            <strong>
              ₹${netSalary.toLocaleString("en-IN")}
            </strong>
          </td>


          <td>

            <select
              onchange="
                changeMonthlyPayment(
                  '${w.id}',
                  this.value
                )
              "
            >

              <option
                value="Pending"
                ${lastPayment === "Pending"
                  ? "selected"
                  : ""}
              >
                Pending
              </option>


              <option
                value="Paid"
                ${lastPayment === "Paid"
                  ? "selected"
                  : ""}
              >
                Paid
              </option>

            </select>

          </td>

        </tr>

      `;

    }).join("");

}


// =============================
// FORMAT DATE
// =============================

function formatDate(iso) {

  const [y, m, d] =
    iso.split("-");

  return `${d}-${m}-${y}`;

}


// =============================
// ESCAPE HTML
// =============================

function esc(s) {

  return String(s).replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );

}


// =============================
// EDIT WORKER
// =============================

window.openEdit =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) return;


  document.getElementById(
    "modalTitle"
  ).textContent =
    "Edit Worker";


  editWorkerId.value =
    w.id;


  workerName.value =
    w.name;


  workerRate.value =
    w.rate || "";


  workerOTRate.value =
    w.otRate || "";


  workerPhone.value =
    w.phone || "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};


// =============================
// DELETE WORKER
// =============================

window.deleteWorker =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) return;


  if (
    !confirm(
      `Delete worker "${w.name}"?`
    )
  ) return;


  data.workers =
    data.workers.filter(
      x => x.id !== id
    );


  Object.keys(
    data.attendance
  ).forEach(date => {

    delete data.attendance[date][id];

  });


  saveData();

  render();

};


// =============================
// ADD WORKER
// =============================

document.getElementById(
  "addWorkerBtn"
).onclick =
function() {


  document.getElementById(
    "modalTitle"
  ).textContent =
    "Add Worker";


  editWorkerId.value = "";


  workerName.value = "";


  workerRate.value = "";


  workerOTRate.value = "";


  workerPhone.value = "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};


// =============================
// CLOSE MODAL
// =============================

function closeModal() {

  modal.classList.add(
    "hidden"
  );

}


document.getElementById(
  "closeModal"
).onclick =
closeModal;


document.getElementById(
  "cancelBtn"
).onclick =
closeModal;


modal.addEventListener(
  "click",
  function(e) {

    if (
      e.target === modal
    ) {

      closeModal();

    }

  }
);


// =============================
// SAVE WORKER
// =============================

document.getElementById(
  "saveWorkerBtn"
).onclick =
function() {


  const name =
    workerName.value.trim();


  if (!name) {

    alert(
      "Please enter worker name."
    );

    workerName.focus();

    return;

  }


  const rate =
    Number(
      workerRate.value || 0
    );


  const otRate =
    Number(
      workerOTRate.value || 0
    );


  const phone =
    workerPhone.value.trim();


  const id =
    editWorkerId.value;


  if (id) {


    const w =
      data.workers.find(
        x => x.id === id
      );


    if (w) {

      w.name = name;

      w.rate = rate;

      w.otRate = otRate;

      w.phone = phone;

    }


  }

  else {


    data.workers.push({

      id:
        crypto.randomUUID(),

      name:
        name,

      rate:
        rate,

      otRate:
        otRate,

      phone:
        phone

    });

  }


  saveData();

  closeModal();

  searchInput.value = "";

  render();

};


// =============================
// MARK ALL PRESENT
// =============================

document.getElementById(
  "allPresentBtn"
).onclick =
function() {


  if (
    !data.workers.length
  ) return;


  const date =
    selectedDate();


  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  data.workers.forEach(w => {


    const old =
      getSavedAttendance(
        w.id,
        date
      ) || {

        status:
          "Present",

        otHours:
          0,

        advance:
          0,

        payment:
          "Pending"

      };


    data.attendance[date][w.id] = {

      ...old,

      status:
        "Present",

      submitted:
        true

    };

  });


  saveData();

  render();

};


// =============================
// DATE CHANGE
// =============================

dateInput.onchange =
function() {

  render();

};


// =============================
// PRINT
// =============================

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


// =============================
// EXPORT CSV
// =============================

document.getElementById(
  "exportBtn"
).onclick =
function() {


  const rows = [[

    "Date",

    "Worker Name",

    "Daily Rate",

    "Status",

    "OT Hours",

    "Advance",

    "OT Rate",

    "OT Amount",

    "Payment"

  ]];


  const dates =
    Object.keys(
      data.attendance
    ).sort();


  dates.forEach(date => {


    data.workers.forEach(w => {


      const a =
        getSavedAttendance(
          w.id,
          date
        );


      if (!a) return;


      rows.push([

        date,

        w.name,

        w.rate,

        a.status,

        a.otHours || 0,

        a.advance || 0,

        w.otRate || 0,

        Number(
          a.otHours || 0
        ) *
        Number(
          w.otRate || 0
        ),

        a.payment ||
          "Pending"

      ]);

    });

  });


  const csv =
    rows.map(row =>

      row.map(value =>

        `"${String(value)
          .replaceAll(
            '"',
            '""'
          )}"`

      ).join(",")

    ).join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );


  const a =
    document.createElement(
      "a"
    );


  a.href =
    URL.createObjectURL(
      blob
    );


  a.download =
    "CTD-Worker-Hajeri.csv";


  a.click();

};


// =============================
// START
// =============================

render();
