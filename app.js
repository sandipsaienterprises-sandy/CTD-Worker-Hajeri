const KEY = "ctd_worker_hajeri_v4";


// =========================
// BASIC HELPERS
// =========================

function newId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "worker_" + Date.now() + "_" + Math.random();
}


const defaultData = {
  workers: [
    {
      id: newId(),
      name: "ARMAN",
      rate: 0,
      otRate: 0,
      phone: ""
    }
  ],

  attendance: {}
};


let data = loadData();


// =========================
// ELEMENTS
// =========================

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


// =========================
// LOAD DATA
// =========================

function loadData() {

  try {

    let saved = localStorage.getItem(KEY);

    // Old version migration
    if (!saved) {
      saved = localStorage.getItem("ctd_worker_hajeri_v3");
    }

    if (!saved) {
      saved = localStorage.getItem("ctd_worker_hajeri_v2");
    }

    if (saved) {

      const parsed = JSON.parse(saved);

      if (!parsed.workers) {
        parsed.workers = [];
      }

      if (!parsed.attendance) {
        parsed.attendance = {};
      }

      parsed.workers.forEach(w => {

        if (!w.id) {
          w.id = newId();
        }

        if (w.rate === undefined) {
          w.rate = 0;
        }

        if (w.otRate === undefined) {
          w.otRate = 0;
        }

        if (!w.phone) {
          w.phone = "";
        }

      });

      return parsed;
    }

    return defaultData;

  } catch (error) {

    console.error(error);

    return defaultData;
  }
}


// =========================
// SAVE
// =========================

function saveData() {

  try {

    localStorage.setItem(
      KEY,
      JSON.stringify(data)
    );

    return true;

  } catch (error) {

    alert("Data save failed.");

    console.error(error);

    return false;
  }
}


// =========================
// DATE
// =========================

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}


dateInput.value = todayISO();


function selectedDate() {

  return dateInput.value || todayISO();
}


function formatDate(iso) {

  if (!iso) return "";

  const parts = iso.split("-");

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


// =========================
// ATTENDANCE
// =========================

function getAttendance(workerId, date) {

  if (!data.attendance[date]) {
    data.attendance[date] = {};
  }


  if (!data.attendance[date][workerId]) {

    data.attendance[date][workerId] = {

      status: "Present",

      otHours: 0,

      advance: 0,

      payment: "Pending",

      submitted: false

    };

  }


  const a = data.attendance[date][workerId];


  // Old data compatibility

  if (a.status === undefined) {
    a.status = "Present";
  }

  if (a.otHours === undefined) {
    a.otHours = 0;
  }

  if (a.advance === undefined) {
    a.advance = 0;
  }

  if (a.payment === undefined) {
    a.payment = "Pending";
  }

  if (a.submitted === undefined) {
    a.submitted = false;
  }


  return a;
}


// =========================
// SET ATTENDANCE
// =========================

function setAttendance(workerId, values) {

  const date = selectedDate();

  const old = getAttendance(
    workerId,
    date
  );


  if (old.submitted) {

    alert(
      "Attendance submitted. Click Edit to change it."
    );

    render();

    return;
  }


  data.attendance[date][workerId] = {

    ...old,

    ...values

  };


  saveData();

  render();
}


// =========================
// FILTER WORKERS
// =========================

function filteredWorkers() {

  const q = searchInput.value
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


// =========================
// WORKER NAME DROPDOWN
// =========================

function renderWorkerNames() {

  const list =
    document.getElementById("workerNames");


  list.innerHTML =
    data.workers.map(w =>

      `<option value="${esc(w.name)}"></option>`

    ).join("");
}


// =========================
// MAIN RENDER
// =========================

function render() {

  renderWorkerNames();


  const workers =
    filteredWorkers();


  const date =
    selectedDate();


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  // =========================
  // STATS
  // =========================

  let present = 0;
  let absent = 0;
  let half = 0;


  data.workers.forEach(w => {

    const a =
      getAttendance(w.id, date);


    if (a.status === "Present") {
      present++;
    }

    else if (a.status === "Absent") {
      absent++;
    }

    else if (a.status === "Half Day") {
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


  // =========================
  // DAILY TABLE
  // =========================

  workerTable.innerHTML =
    workers.map((w, i) => {


      const a =
        getAttendance(w.id, date);


      const locked =
        a.submitted;


      return `

        <tr>

          <td>${i + 1}</td>


          <td>
            <strong>${esc(w.name)}</strong>
          </td>


          <td>
            ₹${Number(w.rate || 0)
              .toLocaleString("en-IN")}
          </td>


          <td>

            <select
              class="status-select"
              ${locked ? "disabled" : ""}
              onchange="changeStatus('${w.id}', this.value)"
            >

              <option value="Present"
                ${a.status === "Present" ? "selected" : ""}>
                Present
              </option>

              <option value="Absent"
                ${a.status === "Absent" ? "selected" : ""}>
                Absent
              </option>

              <option value="Half Day"
                ${a.status === "Half Day" ? "selected" : ""}>
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
              value="${a.otHours || 0}"
              ${locked ? "disabled" : ""}
              onchange="changeOT('${w.id}', this.value)"
            >

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="1"
              value="${a.advance || 0}"
              ${locked ? "disabled" : ""}
              onchange="changeAdvance('${w.id}', this.value)"
            >

          </td>


          <td>

            ${
              locked

              ?

              `<button
                class="edit"
                onclick="editAttendance('${w.id}')"
              >
                Edit
              </button>`

              :

              `<button
                class="submit-btn"
                onclick="submitAttendance('${w.id}')"
              >
                Submit
              </button>`
            }

          </td>


          <td class="actions">

            <button
              class="edit"
              onclick="openEdit('${w.id}')"
            >
              Edit
            </button>


            <button
              class="danger"
              onclick="deleteWorker('${w.id}')"
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


// =========================
// SUBMIT ATTENDANCE
// =========================

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();


  const a =
    getAttendance(workerId, date);


  a.submitted = true;


  saveData();

  render();
};


// =========================
// EDIT ATTENDANCE
// =========================

window.editAttendance =
function(workerId) {

  const date =
    selectedDate();


  const a =
    getAttendance(workerId, date);


  a.submitted = false;


  saveData();

  render();
};


// =========================
// STATUS
// =========================

window.changeStatus =
function(id, status) {

  setAttendance(id, {
    status: status
  });

};


// =========================
// OT
// =========================

window.changeOT =
function(id, value) {

  setAttendance(id, {

    otHours:
      Number(value || 0)

  });

};


// =========================
// ADVANCE
// =========================

window.changeAdvance =
function(id, value) {

  setAttendance(id, {

    advance:
      Number(value || 0)

  });

};


// =========================
// MONTHLY
// =========================

function renderMonthly() {

  const [
    year,
    month
  ] =
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

      let payment =
        "Pending";


      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


        const a =
          getAttendance(
            w.id,
            iso
          );


        if (a.status === "Present") {

          present++;

        }

        else if (
          a.status === "Half Day"
        ) {

          half++;

        }

        else {

          absent++;

        }


        otHours +=
          Number(a.otHours || 0);


        advance +=
          Number(a.advance || 0);


        if (a.payment === "Paid") {
          payment = "Paid";
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

          <td>${present}</td>

          <td>${half}</td>

          <td>${absent}</td>

          <td>${otHours}</td>

          <td>${payableDays}</td>

          <td>
            ₹${totalSalary
              .toLocaleString("en-IN")}
          </td>

          <td>
            ₹${advance
              .toLocaleString("en-IN")}
          </td>

          <td>
            <strong>
              ₹${netSalary
                .toLocaleString("en-IN")}
            </strong>
          </td>

          <td>

            <select
              onchange="changeMonthlyPayment('${w.id}', this.value)"
            >

              <option value="Pending"
                ${payment === "Pending" ? "selected" : ""}>
                Pending
              </option>

              <option value="Paid"
                ${payment === "Paid" ? "selected" : ""}>
                Paid
              </option>

            </select>

          </td>

        </tr>

      `;

    }).join("");
}


// =========================
// PAYMENT
// =========================

window.changeMonthlyPayment =
function(id, value) {

  const [
    year,
    month
  ] =
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


    const a =
      getAttendance(
        id,
        iso
      );


    a.payment =
      value;

  }


  saveData();

  render();
};


// =========================
// OPEN EDIT WORKER
// =========================

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


// =========================
// DELETE WORKER
// =========================

window.deleteWorker =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) return;


  if (!confirm(
    `Delete worker "${w.name}"?`
  )) {

    return;

  }


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


// =========================
// ADD WORKER
// =========================

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


// =========================
// CLOSE MODAL
// =========================

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

    if (e.target === modal) {

      closeModal();

    }

  }
);


// =========================
// SAVE WORKER
// =========================

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


  // EDIT

  if (id) {

    const w =
      data.workers.find(
        x => x.id === id
      );


    if (w) {

      w.name =
        name;

      w.rate =
        rate;

      w.otRate =
        otRate;

      w.phone =
        phone;

    }

  }


  // ADD

  else {

    data.workers.push({

      id: newId(),

      name: name,

      rate: rate,

      otRate: otRate,

      phone: phone

    });

  }


  // IMPORTANT SAVE

  if (saveData()) {

    closeModal();

    searchInput.value = "";

    render();

  }

};


// =========================
// MARK ALL PRESENT
// =========================

document.getElementById(
  "allPresentBtn"
).onclick =
function() {

  if (!data.workers.length) {
    return;
  }


  const date =
    selectedDate();


  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date
      );


    if (!a.submitted) {

      a.status =
        "Present";

    }

  });


  saveData();

  render();
};


// =========================
// DATE / SEARCH
// =========================

dateInput.onchange =
function() {

  render();

};


searchInput.oninput =
function() {

  render();

};


// =========================
// PRINT
// =========================

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


// =========================
// EXPORT CSV
// =========================

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
        getAttendance(
          w.id,
          date
        );


      rows.push([

        date,

        w.name,

        w.rate,

        a.status,

        a.otHours,

        a.advance,

        w.otRate,

        Number(a.otHours || 0) *
        Number(w.otRate || 0),

        a.payment

      ]);

    });

  });


  const csv =
    rows.map(row =>

      row.map(value =>

        `"${String(value)
          .replaceAll('"', '""')}"`

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
    document.createElement("a");


  a.href =
    URL.createObjectURL(blob);


  a.download =
    "CTD-Worker-Hajeri.csv";


  a.click();

};


// =========================
// ESCAPE HTML
// =========================

function esc(s) {

  return String(s).replace(
    /[&<>"']/g,
    function(c) {

      return {

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#39;"

      }[c];

    }
  );

}


// =========================
// START
// =========================

render();
