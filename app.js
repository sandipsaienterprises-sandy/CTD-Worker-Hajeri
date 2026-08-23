const KEY = "ctd_worker_hajeri_v5";

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


// ===============================
// LOAD DATA
// ===============================

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

        if (w.rate === undefined) {
          w.rate = 0;
        }

      });

      return parsed;
    }

    return defaultData;

  } catch (e) {

    console.log(e);

    return defaultData;

  }

}


// ===============================
// SAVE DATA
// ===============================

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}


// ===============================
// TODAY
// ===============================

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

}


// ===============================
// SELECTED DATE
// ===============================

function selectedDate() {

  return dateInput.value || todayISO();

}


// ===============================
// GET SAVED ATTENDANCE
// IMPORTANT:
// DO NOT CREATE RECORD HERE
// ===============================

function getSavedAttendance(workerId, date) {

  if (
    data.attendance[date] &&
    data.attendance[date][workerId]
  ) {

    return data.attendance[date][workerId];

  }

  return null;

}


// ===============================
// DISPLAY ATTENDANCE
// If not saved -> Present visually
// But NOT saved automatically
// ===============================

function getDisplayAttendance(workerId, date) {

  const saved =
    getSavedAttendance(workerId, date);

  if (saved) {
    return saved;
  }

  return {
    status: "Present",
    otHours: 0,
    advance: 0,
    payment: "Pending"
  };

}


// ===============================
// SAVE ATTENDANCE
// ===============================

function setAttendance(
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
      payment: "Pending"
    };

  data.attendance[date][workerId] = {

    ...old,
    ...values

  };

  saveData();

  render();

}


// ===============================
// FILTER WORKERS
// ===============================

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


// ===============================
// RENDER
// ===============================

function render() {

  const workers =
    filteredWorkers();

  const date =
    selectedDate();

  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  // -------------------------------
  // DAILY COUNTS
  // -------------------------------

  let present = 0;
  let absent = 0;
  let half = 0;


  data.workers.forEach(w => {

    const a =
      getDisplayAttendance(
        w.id,
        date
      );

    if (a.status === "Present") {
      present++;
    }

    if (a.status === "Absent") {
      absent++;
    }

    if (a.status === "Half Day") {
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


  // -------------------------------
  // DAILY TABLE
  // -------------------------------

  workerTable.innerHTML =
    workers.map((w, i) => {

      const a =
        getDisplayAttendance(
          w.id,
          date
        );

      const saved =
        getSavedAttendance(
          w.id,
          date
        );

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
              value="${a.otHours || 0}"
              onchange="
                changeOT(
                  '${w.id}',
                  this.value
                )
              "
            >

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="1"
              value="${a.advance || 0}"
              onchange="
                changeAdvance(
                  '${w.id}',
                  this.value
                )
              "
            >

          </td>


          <td class="actions">

            ${
              saved
                ? `
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
                : `
                  <button
                    class="edit"
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


            <button
              class="edit"
              onclick="
                openEdit(
                  '${w.id}'
                )
              "
            >
              Edit
            </button>


            <button
              class="danger"
              onclick="
                deleteWorker(
                  '${w.id}'
                )
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


// ===============================
// SUBMIT DAILY ATTENDANCE
// ===============================

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();

  const existing =
    getSavedAttendance(
      workerId,
      date
    );

  if (existing) {
    return;
  }


  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  data.attendance[date][workerId] = {

    status: "Present",
    otHours: 0,
    advance: 0,
    payment: "Pending"

  };


  saveData();

  render();

};


// ===============================
// EDIT DAILY ATTENDANCE
// ===============================

window.editAttendance =
function(workerId) {

  const date =
    selectedDate();

  if (
    !data.attendance[date] ||
    !data.attendance[date][workerId]
  ) {
    return;
  }

  const a =
    data.attendance[date][workerId];

  const status =
    prompt(
      "Enter Status: Present / Absent / Half Day",
      a.status
    );

  if (
    status !== "Present" &&
    status !== "Absent" &&
    status !== "Half Day"
  ) {

    return;

  }


  a.status = status;

  saveData();

  render();

};


// ===============================
// STATUS
// ===============================

window.changeStatus =
function(id, status) {

  setAttendance(
    id,
    {
      status: status
    }
  );

};


// ===============================
// OT
// ===============================

window.changeOT =
function(id, value) {

  setAttendance(
    id,
    {
      otHours:
        Number(value || 0)
    }
  );

};


// ===============================
// ADVANCE
// ===============================

window.changeAdvance =
function(id, value) {

  setAttendance(
    id,
    {
      advance:
        Number(value || 0)
    }
  );

};


// ===============================
// MONTHLY SUMMARY
// IMPORTANT FIX
// ONLY SAVED DAYS COUNT
// ===============================

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


      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month)
            .padStart(2, "0")}-${String(d)
            .padStart(2, "0")}`;


        // IMPORTANT:
        // Get ONLY SAVED attendance
        const a =
          getSavedAttendance(
            w.id,
            iso
          );


        // If no attendance saved
        // DO NOT COUNT THIS DAY
        if (!a) {
          continue;
        }


        if (
          a.status === "Present"
        ) {

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
        (half * 0.5);


      const grossSalary =
        payableDays *
        Number(
          w.rate || 0
        );


      const overtimeAmount =
        otHours *
        Number(
          w.otRate || 0
        );


      const totalSalary =
        grossSalary +
        overtimeAmount;


      const netSalary =
        Math.max(
          0,
          totalSalary -
          advance
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
                ${payment === "Pending"
                  ? "selected"
                  : ""}
              >
                Pending
              </option>


              <option
                value="Paid"
                ${payment === "Paid"
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


// ===============================
// MONTHLY PAYMENT
// ===============================

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
      `${year}-${String(month)
        .padStart(2, "0")}-${String(d)
        .padStart(2, "0")}`;


    // IMPORTANT:
    // Do NOT create attendance
    // for every day.
    if (
      data.attendance[iso] &&
      data.attendance[iso][id]
    ) {

      data.attendance[iso][id].payment =
        value;

    }

  }


  saveData();

  render();

};


// ===============================
// FORMAT DATE
// ===============================

function formatDate(iso) {

  const [
    y,
    m,
    d
  ] =
    iso.split("-");

  return `${d}-${m}-${y}`;

}


// ===============================
// ESCAPE HTML
// ===============================

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


// ===============================
// EDIT WORKER
// ===============================

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


// ===============================
// DELETE WORKER
// ===============================

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

    if (
      data.attendance[date]
    ) {

      delete data.attendance[date][id];

    }

  });


  saveData();

  render();

};


// ===============================
// ADD WORKER
// ===============================

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


// ===============================
// CLOSE MODAL
// ===============================

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


// ===============================
// SAVE WORKER
// ===============================

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

      w.name =
        name;


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


// ===============================
// MARK ALL PRESENT
// ===============================

document.getElementById(
  "allPresentBtn"
).onclick =
function() {

  if (
    !data.workers.length
  ) {
    return;
  }


  const date =
    selectedDate();


  if (
    !data.attendance[date]
  ) {

    data.attendance[date] = {};

  }


  data.workers.forEach(w => {

    const old =
      data.attendance[date][w.id] ||
      {
        status: "Present",
        otHours: 0,
        advance: 0,
        payment: "Pending"
      };


    data.attendance[date][w.id] = {

      ...old,

      status: "Present"

    };

  });


  saveData();

  render();

};


// ===============================
// DATE CHANGE
// ===============================

dateInput.onchange =
render;


// ===============================
// SEARCH
// ===============================

searchInput.oninput =
render;


// ===============================
// PRINT
// ===============================

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


// ===============================
// EXPORT CSV
// ===============================

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


      // Only export saved attendance
      if (!a) {
        return;
      }


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
        )

      ]);

    });

  });


  if (
    rows.length === 1
  ) {

    rows.push([

      selectedDate(),

      "No attendance saved",

      "",

      "",
      "",
      "",
      "",
      ""

    ]);

  }


  const csv =
    rows
      .map(row =>
        row
          .map(value =>
            `"${String(value)
              .replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");


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


// ===============================
// START
// ===============================

render();
