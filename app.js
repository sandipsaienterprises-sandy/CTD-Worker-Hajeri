/* =====================================================
   CTD WORKER HAJERI
   Stable Version
   ===================================================== */

const KEY = "ctd_worker_hajeri_v6";


// -----------------------------------------------------
// DEFAULT DATA
// -----------------------------------------------------

const defaultData = {
  workers: [],
  attendance: {},
  payments: {}
};


// -----------------------------------------------------
// LOAD DATA
// -----------------------------------------------------

let data = loadData();

function loadData() {

  try {

    const saved = localStorage.getItem(KEY);

    if (saved) {

      const parsed = JSON.parse(saved);

      return {
        workers: Array.isArray(parsed.workers)
          ? parsed.workers
          : [],

        attendance:
          parsed.attendance &&
          typeof parsed.attendance === "object"
            ? parsed.attendance
            : {},

        payments:
          parsed.payments &&
          typeof parsed.payments === "object"
            ? parsed.payments
            : {}
      };

    }


    /*
      OLD VERSION MIGRATION

      Old worker data will be copied.
      Old automatic attendance will NOT be counted.
    */

    const oldKeys = [
      "ctd_worker_hajeri_v5",
      "ctd_worker_hajeri_v4",
      "ctd_worker_hajeri_v3"
    ];

    for (const oldKey of oldKeys) {

      const oldSaved =
        localStorage.getItem(oldKey);

      if (!oldSaved) continue;

      const oldData =
        JSON.parse(oldSaved);

      if (
        oldData &&
        Array.isArray(oldData.workers)
      ) {

        const workers =
          oldData.workers.map(w => ({
            id: w.id || crypto.randomUUID(),
            name: w.name || "",
            rate: Number(w.rate || 0),
            otRate: Number(w.otRate || 0),
            phone: w.phone || ""
          }));

        return {
          workers,
          attendance: {},
          payments: {}
        };

      }

    }


    return defaultData;

  }

  catch (error) {

    console.error(error);

    return defaultData;

  }

}


// -----------------------------------------------------
// SAVE
// -----------------------------------------------------

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}


// -----------------------------------------------------
// ELEMENTS
// -----------------------------------------------------

const dateInput =
  document.getElementById("dateInput");

const searchInput =
  document.getElementById("searchInput");

const workerList =
  document.getElementById("workerList");

const workerTable =
  document.getElementById("workerTable");

const monthlyTable =
  document.getElementById("monthlyTable");

const modal =
  document.getElementById("modal");

const workerName =
  document.getElementById("workerName");

const workerRate =
  document.getElementById("workerRate");

const workerOTRate =
  document.getElementById("workerOTRate");

const workerPhone =
  document.getElementById("workerPhone");

const editWorkerId =
  document.getElementById("editWorkerId");


// -----------------------------------------------------
// TODAY
// -----------------------------------------------------

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


// -----------------------------------------------------
// SELECTED DATE
// -----------------------------------------------------

function selectedDate() {

  return dateInput.value || todayISO();

}


// -----------------------------------------------------
// FORMAT DATE
// -----------------------------------------------------

function formatDate(iso) {

  if (!iso) return "";

  const parts = iso.split("-");

  if (parts.length !== 3) return iso;

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


// -----------------------------------------------------
// MONTH KEY
// -----------------------------------------------------

function monthKey(date) {

  return date.slice(0, 7);

}


// -----------------------------------------------------
// ESCAPE HTML
// -----------------------------------------------------

function esc(value) {

  return String(value ?? "")
    .replace(
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


// -----------------------------------------------------
// WORKER LIST / DROPDOWN
// -----------------------------------------------------

function renderWorkerDropdown() {

  workerList.innerHTML =
    data.workers
      .slice()
      .sort((a,b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          { sensitivity: "base" }
        )
      )
      .map(w =>
        `<option value="${esc(w.name)}"></option>`
      )
      .join("");

}


// -----------------------------------------------------
// FILTER WORKERS
// -----------------------------------------------------

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


// -----------------------------------------------------
// ATTENDANCE EXISTS?
// -----------------------------------------------------

function getAttendance(workerId, date) {

  if (
    data.attendance[date] &&
    data.attendance[date][workerId] &&
    data.attendance[date][workerId].submitted === true
  ) {

    return data.attendance[date][workerId];

  }

  return null;

}


// -----------------------------------------------------
// SUBMIT ATTENDANCE
// -----------------------------------------------------

function submitAttendance(
  workerId,
  status,
  otHours,
  advance
) {

  const date =
    selectedDate();


  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  data.attendance[date][workerId] = {

    status: status,

    otHours:
      Number(otHours || 0),

    advance:
      Number(advance || 0),

    submitted: true,

    submittedAt:
      new Date().toISOString()

  };


  saveData();

  render();

}


// -----------------------------------------------------
// DELETE ATTENDANCE
// -----------------------------------------------------

function deleteAttendance(
  workerId
) {

  const date =
    selectedDate();


  if (
    !data.attendance[date] ||
    !data.attendance[date][workerId]
  ) {

    return;

  }


  if (
    !confirm(
      "Delete this day's attendance?"
    )
  ) {

    return;

  }


  delete data.attendance[date][workerId];


  if (
    Object.keys(data.attendance[date]).length === 0
  ) {

    delete data.attendance[date];

  }


  saveData();

  render();

}


// -----------------------------------------------------
// DAILY TABLE
// -----------------------------------------------------

function renderDaily() {

  const workers =
    filteredWorkers();

  const date =
    selectedDate();


  let present = 0;
  let absent = 0;
  let half = 0;


  /*
    Count ONLY SUBMITTED attendance
  */

  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date
      );


    if (!a) return;


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


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  if (!workers.length) {

    workerTable.innerHTML = "";

    document.getElementById(
      "emptyState"
    ).style.display = "block";

    return;

  }


  document.getElementById(
    "emptyState"
  ).style.display = "none";


  workerTable.innerHTML =
    workers.map((w, index) => {

      const a =
        getAttendance(
          w.id,
          date
        );


      const status =
        a
          ? a.status
          : "Present";


      const otHours =
        a
          ? a.otHours
          : 0;


      const advance =
        a
          ? a.advance
          : 0;


      return `

        <tr>

          <td>
            ${index + 1}
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
              id="status-${w.id}"
              class="status-select"
              ${a ? "disabled" : ""}
            >

              <option
                value="Present"
                ${status === "Present"
                  ? "selected"
                  : ""}
              >
                Present
              </option>

              <option
                value="Absent"
                ${status === "Absent"
                  ? "selected"
                  : ""}
              >
                Absent
              </option>

              <option
                value="Half Day"
                ${status === "Half Day"
                  ? "selected"
                  : ""}
              >
                Half Day
              </option>

            </select>

          </td>


          <td>

            <input
              id="ot-${w.id}"
              class="small-input"
              type="number"
              min="0"
              step="0.5"
              value="${otHours}"
              ${a ? "disabled" : ""}
            >

          </td>


          <td>

            <input
              id="advance-${w.id}"
              class="small-input"
              type="number"
              min="0"
              step="1"
              value="${advance}"
              ${a ? "disabled" : ""}
            >

          </td>


          <td>

            ${
              a

              ? `
                <button
                  class="edit-attendance"
                  onclick="editAttendance('${w.id}')"
                >
                  Edit
                </button>
              `

              : `
                <button
                  class="submit-btn"
                  onclick="submitWorker('${w.id}')"
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

}


// -----------------------------------------------------
// SUBMIT WORKER
// -----------------------------------------------------

window.submitWorker =
function(id) {

  const status =
    document.getElementById(
      `status-${id}`
    ).value;


  const otHours =
    document.getElementById(
      `ot-${id}`
    ).value;


  const advance =
    document.getElementById(
      `advance-${id}`
    ).value;


  submitAttendance(
    id,
    status,
    otHours,
    advance
  );

};


// -----------------------------------------------------
// EDIT ATTENDANCE
// -----------------------------------------------------

window.editAttendance =
function(id) {

  const date =
    selectedDate();


  const a =
    getAttendance(
      id,
      date
    );


  if (!a) return;


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


  if (status) status.disabled = false;

  if (ot) ot.disabled = false;

  if (advance) advance.disabled = false;


  const cell =
    document.querySelector(
      `#status-${id}`
    )
      ?.closest("tr")
      ?.querySelector(
        "td:nth-child(7)"
      );


  if (!cell) return;


  cell.innerHTML = `

    <button
      class="submit-btn"
      onclick="submitWorker('${id}')"
    >
      Submit
    </button>

  `;

};


// -----------------------------------------------------
// MARK ALL PRESENT
// -----------------------------------------------------

document.getElementById(
  "allPresentBtn"
).onclick =
function() {

  if (!data.workers.length) {

    alert(
      "Please add workers first."
    );

    return;

  }


  const date =
    selectedDate();


  if (!confirm(
    `Mark all workers Present for ${formatDate(date)}?`
  )) {

    return;

  }


  data.workers.forEach(w => {

    submitAttendance(
      w.id,
      "Present",
      0,
      0
    );

  });


  saveData();

  render();

};


// -----------------------------------------------------
// MONTHLY SUMMARY
// -----------------------------------------------------

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


      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;


        const a =
          getAttendance(
            w.id,
            iso
          );


        /*
          IMPORTANT:
          No attendance = NO COUNT
        */

        if (!a) continue;


        if (a.status === "Present") {

          present++;

        }
        else if (a.status === "Half Day") {

          half++;

        }
        else if (a.status === "Absent") {

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


      const paymentKey =
        `${year}-${String(month).padStart(2,"0")}-${w.id}`;


      const payment =
        data.payments[paymentKey] ||
        "Pending";


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
              class="payment-select"
              onchange="changePayment('${w.id}', this.value)"
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


// -----------------------------------------------------
// CHANGE PAYMENT
// -----------------------------------------------------

window.changePayment =
function(id, value) {

  const key =
    `${monthKey(selectedDate())}-${id}`;


  data.payments[key] =
    value;


  saveData();

  renderMonthly();

};


// -----------------------------------------------------
// RENDER SUBMITTED DATES
// -----------------------------------------------------

function renderSubmittedDates() {

  const container =
    document.getElementById(
      "submittedDates"
    );


  const month =
    monthKey(
      selectedDate()
    );


  const dates =
    Object.keys(data.attendance)
      .filter(date => {

        if (!date.startsWith(month)) {
          return false;
        }


        return Object.values(
          data.attendance[date] || {}
        ).some(a =>
          a &&
          a.submitted === true
        );

      })
      .sort();


  if (!dates.length) {

    container.innerHTML =
      `<span class="no-dates">
        No attendance submitted for this month.
      </span>`;

    return;

  }


  container.innerHTML =
    dates.map(date => {

      const active =
        date === selectedDate();


      return `

        <button
          class="date-chip ${active ? "active" : ""}"
          onclick="selectDate('${date}')"
        >
          ✓ ${formatDate(date)}
        </button>

      `;

    }).join("");

}


// -----------------------------------------------------
// DATE STATUS
// -----------------------------------------------------

function renderDateStatus() {

  const date =
    selectedDate();


  const hasSubmission =
    data.attendance[date] &&
    Object.values(
      data.attendance[date]
    ).some(a =>
      a &&
      a.submitted === true
    );


  const box =
    document.querySelector(
      ".date-box"
    );


  const status =
    document.getElementById(
      "dateStatus"
    );


  if (hasSubmission) {

    box.classList.add(
      "submitted-date"
    );

    status.className =
      "date-status submitted";

    status.textContent =
      "✓ Attendance submitted";

  }
  else {

    box.classList.remove(
      "submitted-date"
    );

    status.className =
      "date-status not-submitted";

    status.textContent =
      "Attendance not submitted";

  }

}


// -----------------------------------------------------
// SELECT DATE
// -----------------------------------------------------

window.selectDate =
function(date) {

  dateInput.value =
    date;

  searchInput.value =
    "";

  render();

};


// -----------------------------------------------------
// WORKER MODAL
// -----------------------------------------------------

function openAddWorker() {

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


  workerOTRate.value =
    "";


  workerPhone.value =
    "";


  modal.classList.remove(
    "hidden"
  );


  setTimeout(() =>
    workerName.focus(),
    100
  );

}


document.getElementById(
  "addWorkerBtn"
).onclick =
openAddWorker;


// -----------------------------------------------------
// EDIT WORKER
// -----------------------------------------------------

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


// -----------------------------------------------------
// DELETE WORKER
// -----------------------------------------------------

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

    if (
      data.attendance[date] &&
      data.attendance[date][id]
    ) {

      delete data.attendance[date][id];

    }

  });


  saveData();

  render();

};


// -----------------------------------------------------
// CLOSE MODAL
// -----------------------------------------------------

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


// -----------------------------------------------------
// SAVE WORKER
// -----------------------------------------------------

document.getElementById(
  "saveWorkerBtn"
).onclick =
function() {

  const name =
    workerName.value
      .trim()
      .toUpperCase();


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


  /*
    EDIT EXISTING
  */

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


  /*
    ADD NEW
  */

  else {

    const duplicate =
      data.workers.some(
        w =>
          w.name.toLowerCase() ===
          name.toLowerCase()
      );


    if (duplicate) {

      alert(
        "This worker already exists."
      );

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


  saveData();

  closeModal();

  searchInput.value =
    "";

  render();

};


// -----------------------------------------------------
// DATE CHANGE
// -----------------------------------------------------

dateInput.onchange =
function() {

  searchInput.value =
    "";

  render();

};


// -----------------------------------------------------
// SEARCH
// -----------------------------------------------------

searchInput.oninput =
function() {

  renderDaily();

};


// -----------------------------------------------------
// SHOW ALL
// -----------------------------------------------------

document.getElementById(
  "showAllBtn"
).onclick =
function() {

  searchInput.value =
    "";

  render();

};


// -----------------------------------------------------
// PRINT
// -----------------------------------------------------

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


// -----------------------------------------------------
// EXPORT CSV
// -----------------------------------------------------

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
        getAttendance(
          w.id,
          date
        );


      if (!a) return;


      rows.push([

        date,

        w.name,

        w.rate,

        a.status,

        a.otHours,

        a.advance,

        w.otRate,

        Number(a.otHours || 0) *
        Number(w.otRate || 0)

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


// -----------------------------------------------------
// MAIN RENDER
// -----------------------------------------------------

function render() {

  renderWorkerDropdown();

  renderDaily();

  renderMonthly();

  renderSubmittedDates();

  renderDateStatus();

}


// -----------------------------------------------------
// START
// -----------------------------------------------------

render();
