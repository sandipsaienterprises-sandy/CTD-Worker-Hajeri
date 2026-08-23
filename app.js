const KEY = "ctd_worker_hajeri_v4";

const OLD_KEY = "ctd_worker_hajeri_v3";

const defaultData = {
  workers: [
    {
      id: crypto.randomUUID(),
      name: "ARMAN",
      rate: 0,
      otRate: 0,
      phone: ""
    }
  ],
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


// =====================================================
// LOAD DATA
// =====================================================

function loadData() {

  try {

    const saved = localStorage.getItem(KEY);

    if (saved) {

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
    }


    // OLD VERSION मधून फक्त Worker Names घ्या
    // जुना चुकीचा attendance data घेऊ नका

    const oldSaved = localStorage.getItem(OLD_KEY);

    if (oldSaved) {

      const oldData = JSON.parse(oldSaved);

      if (
        oldData &&
        Array.isArray(oldData.workers)
      ) {

        return {
          workers: oldData.workers.map(w => ({
            id: w.id || crypto.randomUUID(),
            name: w.name || "",
            rate: Number(w.rate || 0),
            otRate: Number(w.otRate || 0),
            phone: w.phone || ""
          })),

          attendance: {}
        };

      }

    }


    return defaultData;

  }

  catch (e) {

    return defaultData;

  }

}


// =====================================================
// SAVE
// =====================================================

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}


// =====================================================
// DATE
// =====================================================

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


// =====================================================
// CHECK IF ATTENDANCE IS SUBMITTED
// =====================================================

function isSubmitted(workerId, date) {

  return !!(
    data.attendance &&
    data.attendance[date] &&
    data.attendance[date][workerId] &&
    data.attendance[date][workerId].submitted === true
  );

}


// =====================================================
// GET SAVED ATTENDANCE
// IMPORTANT:
// येथे default Present SAVE होत नाही
// =====================================================

function getSavedAttendance(workerId, date) {

  if (
    data.attendance &&
    data.attendance[date] &&
    data.attendance[date][workerId]
  ) {

    return data.attendance[date][workerId];

  }

  return null;

}


// =====================================================
// SAVE ATTENDANCE
// =====================================================

function saveAttendance(
  workerId,
  values,
  date = selectedDate()
) {

  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  const old =
    data.attendance[date][workerId] || {

      status: "Present",

      otHours: 0,

      advance: 0,

      payment: "Pending",

      submitted: false

    };


  data.attendance[date][workerId] = {

    ...old,

    ...values,

    submitted: true

  };


  saveData();

  render();

}


// =====================================================
// SEARCH WORKERS
// =====================================================

function filteredWorkers() {

  const q =
    searchInput.value
      .trim()
      .toLowerCase();


  return data.workers.filter(w =>

    w.name
      .toLowerCase()
      .includes(q)

  );

}


// =====================================================
// RENDER
// =====================================================

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


  // -----------------------------------------------
  // TODAY / SELECTED DATE COUNTER
  // ONLY SUBMITTED ATTENDANCE COUNT
  // -----------------------------------------------

  data.workers.forEach(w => {

    const a =
      getSavedAttendance(
        w.id,
        date
      );


    if (!a || a.submitted !== true) {
      return;
    }


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


  // =================================================
  // DAILY TABLE
  // =================================================

  workerTable.innerHTML =
    workers.map((w, i) => {

      const a =
        getSavedAttendance(
          w.id,
          date
        );


      const submitted =
        a &&
        a.submitted === true;


      const status =
        submitted
          ? a.status
          : "Present";


      const otHours =
        submitted
          ? Number(a.otHours || 0)
          : 0;


      const advance =
        submitted
          ? Number(a.advance || 0)
          : 0;


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
              id="status-${w.id}"
              ${submitted ? "" : "disabled"}
            >

              <option value="Present"
                ${status === "Present" ? "selected" : ""}>
                Present
              </option>

              <option value="Absent"
                ${status === "Absent" ? "selected" : ""}>
                Absent
              </option>

              <option value="Half Day"
                ${status === "Half Day" ? "selected" : ""}>
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
              id="ot-${w.id}"
              value="${otHours}"
              ${submitted ? "" : "disabled"}
            >

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="1"
              id="advance-${w.id}"
              value="${advance}"
              ${submitted ? "" : "disabled"}
            >

          </td>


          <td>

            ${
              submitted

              ?

              `
                <button
                  class="edit"
                  onclick="editAttendance('${w.id}')"
                >
                  Edit
                </button>
              `

              :

              `
                <button
                  class="primary attendance-submit"
                  onclick="submitAttendance('${w.id}')"
                >
                  Submit
                </button>
              `
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


// =====================================================
// SUBMIT ATTENDANCE
// =====================================================

window.submitAttendance =
function(id) {

  const status =
    document.getElementById(
      `status-${id}`
    ).value;


  const otHours =
    Number(
      document.getElementById(
        `ot-${id}`
      ).value || 0
    );


  const advance =
    Number(
      document.getElementById(
        `advance-${id}`
      ).value || 0
    );


  saveAttendance(id, {

    status: status,

    otHours: otHours,

    advance: advance,

    payment: "Pending"

  });

};


// =====================================================
// EDIT ATTENDANCE
// =====================================================

window.editAttendance =
function(id) {

  const status =
    document.getElementById(
      `status-${id}`
    );

  const ot =
    document.getElementById(
      `ot-${id}`
    );

  const advance =
    document.getElementById(
      `advance-${id}`
    );


  status.disabled = false;

  ot.disabled = false;

  advance.disabled = false;


  const button =
    event.target;


  button.textContent =
    "Save";


  button.onclick =
    function() {

      saveAttendance(id, {

        status: status.value,

        otHours:
          Number(ot.value || 0),

        advance:
          Number(advance.value || 0)

      });

    };

};


// =====================================================
// MONTHLY REPORT
// =====================================================

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

      let payment = "Pending";


      // -----------------------------------------------
      // IMPORTANT:
      // Only submitted attendance is counted
      // -----------------------------------------------

      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


        const a =
          getSavedAttendance(
            w.id,
            iso
          );


        // Submit केलेले नसेल तर skip

        if (
          !a ||
          a.submitted !== true
        ) {

          continue;

        }


        if (a.status === "Present") {

          present++;

        }

        else if (
          a.status === "Half Day"
        ) {

          half++;

        }

        else if (
          a.status === "Absent"
        ) {

          absent++;

        }


        otHours +=
          Number(
            a.otHours || 0
          );


        advance +=
          Number(
            a.advance || 0
          );


        if (a.payment) {

          payment =
            a.payment;

        }

      }


      const payableDays =
        present +
        half * 0.5;


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
              onchange="changeMonthlyPayment('${w.id}', this.value)"
            >

              <option
                value="Pending"
                ${payment === "Pending" ? "selected" : ""}
              >
                Pending
              </option>


              <option
                value="Paid"
                ${payment === "Paid" ? "selected" : ""}
              >
                Paid
              </option>

            </select>

          </td>

        </tr>

      `;

    }).join("");

}


// =====================================================
// MONTHLY PAYMENT
// =====================================================

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


    if (
      data.attendance[iso] &&
      data.attendance[iso][id] &&
      data.attendance[iso][id].submitted === true
    ) {

      data.attendance[iso][id].payment =
        value;

    }

  }


  saveData();

  render();

};


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(iso) {

  const [
    y,
    m,
    d
  ] =
    iso.split("-");


  return `${d}-${m}-${y}`;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function esc(s) {

  return String(s).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
  );

}


// =====================================================
// WORKER EDIT
// =====================================================

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


// =====================================================
// DELETE WORKER
// =====================================================

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
  ) {

    return;

  }


  data.workers =
    data.workers.filter(
      x => x.id !== id
    );


  Object.keys(
    data.attendance
  ).forEach(date => {

    delete data.attendance[
      date
    ][id];

  });


  saveData();

  render();

};


// =====================================================
// ADD WORKER
// =====================================================

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


// =====================================================
// CLOSE MODAL
// =====================================================

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
  e => {

    if (
      e.target === modal
    ) {

      closeModal();

    }

  }
);


// =====================================================
// SAVE WORKER
// =====================================================

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


  const id =
    editWorkerId.value;


  if (id) {

    const w =
      data.workers.find(
        x => x.id === id
      );


    if (w) {

      w.name = name;

      w.rate =
        Number(
          workerRate.value || 0
        );

      w.otRate =
        Number(
          workerOTRate.value || 0
        );

      w.phone =
        workerPhone.value.trim();

    }

  }

  else {

    data.workers.push({

      id:
        crypto.randomUUID(),

      name:
        name,

      rate:
        Number(
          workerRate.value || 0
        ),

      otRate:
        Number(
          workerOTRate.value || 0
        ),

      phone:
        workerPhone.value.trim()

    });

  }


  saveData();

  closeModal();

  render();

};


// =====================================================
// MARK ALL PRESENT
// =====================================================

document.getElementById(
  "allPresentBtn"
).onclick =
function() {

  if (
    !data.workers.length
  ) return;


  const date =
    selectedDate();


  if (
    !data.attendance[date]
  ) {

    data.attendance[date] = {};

  }


  data.workers.forEach(w => {

    data.attendance[date][w.id] = {

      status:
        "Present",

      otHours:
        0,

      advance:
        0,

      payment:
        "Pending",

      submitted:
        true

    };

  });


  saveData();

  render();

};


// =====================================================
// SEARCH / DATE
// =====================================================

dateInput.onchange =
render;


searchInput.oninput =
render;


// =====================================================
// PRINT
// =====================================================

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


// =====================================================
// EXPORT CSV
// =====================================================

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

    "OT Amount"

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


      if (
        !a ||
        a.submitted !== true
      ) {

        return;

      }


      rows.push([

        date,

        w.name,

        w.rate,

        a.status,

        a.otHours,

        a.advance,

        w.otRate,

        Number(
          a.otHours || 0
        ) *
        Number(
          w.otRate || 0
        )

      ]);

    });

  });


  if (rows.length === 1) {

    rows.push([
      selectedDate(),
      "No attendance submitted",
      "",
      "",
      "",
      "",
      "",
      ""
    ]);

  }


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


// =====================================================
// START
// =====================================================

render();
