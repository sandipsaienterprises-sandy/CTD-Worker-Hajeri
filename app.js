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
const workerPhone = document.getElementById("workerPhone");
const editWorkerId = document.getElementById("editWorkerId");

const workerOTRate = document.getElementById("workerOTRate");

dateInput.value = todayISO();


// ======================================================
// LOAD DATA
// ======================================================

function loadData() {

  try {

    let saved = localStorage.getItem(KEY);

    // Old version migration
    if (!saved) {
      saved = localStorage.getItem("ctd_worker_hajeri_v4");
    }

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
          w.id = crypto.randomUUID();
        }

        if (w.rate === undefined) {
          w.rate = 0;
        }

        if (w.otRate === undefined) {
          w.otRate = 0;
        }

        if (w.phone === undefined) {
          w.phone = "";
        }

      });

      return parsed;
    }

    // First time
    return {
      workers: [
        {
          id: crypto.randomUUID(),
          name: "ARMAN",
          rate: 500,
          otRate: 0,
          phone: ""
        }
      ],
      attendance: {}
    };

  } catch (error) {

    console.log(error);

    return {
      workers: [
        {
          id: crypto.randomUUID(),
          name: "ARMAN",
          rate: 500,
          otRate: 0,
          phone: ""
        }
      ],
      attendance: {}
    };

  }

}


// ======================================================
// SAVE DATA
// ======================================================

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}


// ======================================================
// TODAY
// ======================================================

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

}


// ======================================================
// SELECTED DATE
// ======================================================

function selectedDate() {

  return dateInput.value || todayISO();

}


// ======================================================
// ATTENDANCE
// ======================================================

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

  const a =
    data.attendance[date][workerId];

  if (a.submitted === undefined) {
    a.submitted = false;
  }

  if (a.otHours === undefined) {
    a.otHours = 0;
  }

  if (a.advance === undefined) {
    a.advance = 0;
  }

  if (!a.payment) {
    a.payment = "Pending";
  }

  return a;

}


// ======================================================
// SEARCH
// ======================================================

function filteredWorkers() {

  const q =
    searchInput.value
      .trim()
      .toLowerCase();

  if (!q) {
    return data.workers;
  }

  return data.workers.filter(w =>
    String(w.name)
      .toLowerCase()
      .includes(q)
  );

}


// ======================================================
// RENDER
// ======================================================

function render() {

  const workers =
    filteredWorkers();

  const date =
    selectedDate();

  const selectedDateLabel =
    document.getElementById(
      "selectedDateLabel"
    );

  if (selectedDateLabel) {

    selectedDateLabel.textContent =
      formatDate(date);

  }


  let present = 0;
  let absent = 0;
  let half = 0;


  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date
      );

    if (!a.submitted) {
      return;
    }

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


  // ====================================================
  // DAILY HAJERI
  // ====================================================

  workerTable.innerHTML =
    workers.map((w, i) => {

      const a =
        getAttendance(
          w.id,
          date
        );

      const locked =
        a.submitted;


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
              id="status_${w.id}"
              ${locked ? "disabled" : ""}
            >

              <option value="Present"
                ${a.status === "Present"
                  ? "selected"
                  : ""}>
                Present
              </option>

              <option value="Absent"
                ${a.status === "Absent"
                  ? "selected"
                  : ""}>
                Absent
              </option>

              <option value="Half Day"
                ${a.status === "Half Day"
                  ? "selected"
                  : ""}>
                Half Day
              </option>

            </select>

          </td>


          <td>

            <input
              class="small-input"
              id="ot_${w.id}"
              type="number"
              min="0"
              step="0.5"
              value="${a.otHours || 0}"
              ${locked ? "disabled" : ""}
            >

          </td>


          <td>

            <input
              class="small-input"
              id="advance_${w.id}"
              type="number"
              min="0"
              step="1"
              value="${a.advance || 0}"
              ${locked ? "disabled" : ""}
            >

          </td>


          <td class="actions">

            ${
              locked

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
                  class="primary"
                  onclick="submitAttendance('${w.id}')"
                >
                  Submit
                </button>
              `
            }


            <button
              class="edit"
              onclick="openEdit('${w.id}')"
            >
              Edit Worker
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


  const emptyState =
    document.getElementById(
      "emptyState"
    );

  if (emptyState) {

    emptyState.style.display =
      workers.length
        ? "none"
        : "block";

  }


  renderMonthly();

}


// ======================================================
// SUBMIT DAILY HAJERI
// ======================================================

window.submitAttendance =
function(id) {

  const date =
    selectedDate();


  const status =
    document.getElementById(
      `status_${id}`
    );

  const ot =
    document.getElementById(
      `ot_${id}`
    );

  const advance =
    document.getElementById(
      `advance_${id}`
    );


  if (!status) {
    alert("Status not found.");
    return;
  }


  const a =
    getAttendance(
      id,
      date
    );


  a.status =
    status.value;


  a.otHours =
    Number(
      ot ? ot.value : 0
    );


  a.advance =
    Number(
      advance ? advance.value : 0
    );


  a.submitted =
    true;


  saveData();

  render();

};


// ======================================================
// EDIT DAILY HAJERI
// ======================================================

window.editAttendance =
function(id) {

  const date =
    selectedDate();


  const a =
    getAttendance(
      id,
      date
    );


  a.submitted =
    false;


  saveData();

  render();

};


// ======================================================
// MONTHLY SUMMARY
// ======================================================

function renderMonthly() {

  if (!monthlyTable) {
    return;
  }


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


        if (!a.submitted) {
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

      }


      const payableDays =
        present +
        half * 0.5;


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
            ₹${grossSalary.toLocaleString(
              "en-IN"
            )}
          </td>

          <td>
            ₹${advance.toLocaleString(
              "en-IN"
            )}
          </td>

          <td>
            <strong>
              ₹${netSalary.toLocaleString(
                "en-IN"
              )}
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

              <option value="Pending">
                Pending
              </option>

              <option value="Paid">
                Paid
              </option>

            </select>

          </td>

        </tr>

      `;

    }).join("");

}


// ======================================================
// PAYMENT
// ======================================================

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


    if (a.submitted) {

      a.payment =
        value;

    }

  }


  saveData();

  render();

};


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(iso) {

  const [
    y,
    m,
    d
  ] =
    iso.split("-");


  return `${d}-${m}-${y}`;

}


// ======================================================
// ESCAPE
// ======================================================

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


// ======================================================
// OPEN EDIT WORKER
// ======================================================

window.openEdit =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) {
    return;
  }


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


  if (workerOTRate) {

    workerOTRate.value =
      w.otRate || "";

  }


  workerPhone.value =
    w.phone || "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};


// ======================================================
// DELETE WORKER
// ======================================================

window.deleteWorker =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) {
    return;
  }


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

      delete data.attendance[
        date
      ][id];

    }

  });


  saveData();

  render();

};


// ======================================================
// ADD WORKER
// ======================================================

document.getElementById(
  "addWorkerBtn"
).onclick =
function() {

  document.getElementById(
    "modalTitle"
  ).textContent =
    "Add Worker";


  editWorkerId.value =
    "";


  workerName.value =
    "";


  workerRate.value =
    "";


  if (workerOTRate) {

    workerOTRate.value =
      "";

  }


  workerPhone.value =
    "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};


// ======================================================
// CLOSE MODAL
// ======================================================

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


// ======================================================
// SAVE WORKER
// ======================================================

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


  let otRate = 0;

  if (workerOTRate) {

    otRate =
      Number(
        workerOTRate.value || 0
      );

  }


  const phone =
    workerPhone.value.trim();


  const id =
    editWorkerId.value;


  // ============================
  // EDIT EXISTING WORKER
  // ============================

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


  // ============================
  // ADD NEW WORKER
  // ============================

  else {

    const alreadyExists =
      data.workers.some(
        w =>
          w.name.trim().toLowerCase() ===
          name.toLowerCase()
      );


    if (alreadyExists) {

      alert(
        "This worker name already exists."
      );

      workerName.focus();

      return;

    }


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


  // VERY IMPORTANT
  saveData();


  closeModal();


  render();


  alert(
    "Worker saved successfully."
  );

};


// ======================================================
// MARK ALL PRESENT
// ======================================================

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


  data.workers.forEach(
    w => {

      const a =
        getAttendance(
          w.id,
          date
        );


      if (!a.submitted) {

        a.status =
          "Present";

      }

    }
  );


  saveData();

  render();

};


// ======================================================
// DATE
// ======================================================

dateInput.onchange =
function() {

  render();

};


// ======================================================
// SEARCH
// ======================================================

searchInput.oninput =
function() {

  render();

};


// ======================================================
// PRINT
// ======================================================

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


// ======================================================
// EXPORT CSV
// ======================================================

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
    "Submitted"

  ]];


  const dates =
    Object.keys(
      data.attendance
    ).sort();


  dates.forEach(
    date => {

      data.workers.forEach(
        w => {

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

            Number(
              a.otHours || 0
            ) *
            Number(
              w.otRate || 0
            ),

            a.submitted
              ? "Yes"
              : "No"

          ]);

        }
      );

    }
  );


  const csv =
    rows.map(
      row =>
        row.map(
          value =>
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


// ======================================================
// START
// ======================================================

render();
