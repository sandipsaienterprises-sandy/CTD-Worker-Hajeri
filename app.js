const KEY = "ctd_worker_hajeri_v3";

/* =========================
   DEFAULT DATA
========================= */

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

/* =========================
   ELEMENTS
========================= */

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

/* =========================
   LOAD / SAVE
========================= */

function loadData() {

  try {

    const saved =
      localStorage.getItem(KEY);

    if (saved) {

      const parsed =
        JSON.parse(saved);

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

    return defaultData;

  } catch (e) {

    return defaultData;

  }

}

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}

/* =========================
   DATE
========================= */

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

  return (
    dateInput.value ||
    todayISO()
  );

}

function formatDate(iso) {

  const [
    y,
    m,
    d
  ] = iso.split("-");

  return `${d}-${m}-${y}`;

}

/* =========================
   ATTENDANCE
========================= */

function getAttendance(
  workerId,
  date
) {

  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }

  if (
    !data.attendance[date][workerId]
  ) {

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

  return a;

}

/* =========================
   FILTER WORKERS
========================= */

function filteredWorkers() {

  const q =
    String(
      searchInput.value || ""
    )
      .trim()
      .toLowerCase();

  if (!q) {

    return data.workers;

  }

  return data.workers.filter(w =>

    String(w.name || "")
      .toLowerCase()
      .includes(q)

  );

}

/* =========================
   WORKER LIST / DROPDOWN
========================= */

function updateWorkerList() {

  const list =
    document.getElementById(
      "workerList"
    );

  if (!list) return;

  list.innerHTML =
    data.workers
      .map(w =>
        `<option value="${esc(w.name)}"></option>`
      )
      .join("");

}

/* =========================
   RENDER
========================= */

function render() {

  updateWorkerList();

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

    if (
      a.status === "Present"
    ) {

      present++;

    }

    if (
      a.status === "Absent"
    ) {

      absent++;

    }

    if (
      a.status === "Half Day"
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


  /* =========================
     DAILY TABLE
  ========================= */

  workerTable.innerHTML =
    workers.map((w, i) => {

      const a =
        getAttendance(
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
              ${
                a.submitted
                  ? "disabled"
                  : ""
              }
            >

              <option value="Present"
                ${
                  a.status === "Present"
                    ? "selected"
                    : ""
                }>
                Present
              </option>

              <option value="Absent"
                ${
                  a.status === "Absent"
                    ? "selected"
                    : ""
                }>
                Absent
              </option>

              <option value="Half Day"
                ${
                  a.status === "Half Day"
                    ? "selected"
                    : ""
                }>
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
              ${
                a.submitted
                  ? "disabled"
                  : ""
              }
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
              ${
                a.submitted
                  ? "disabled"
                  : ""
              }
            >

          </td>

          <td>

            ${
              a.submitted
                ? `
                  <button
                    class="primary"
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
                openEdit(
                  '${w.id}'
                )
              "
            >
              Edit Worker
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


  /* IMPORTANT */

  updateAttendanceDates();

  renderMonthly();

}

/* =========================
   STATUS
========================= */

window.changeStatus =
function(
  id,
  status
) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );

  if (a.submitted) return;

  a.status = status;

  saveData();

  render();

};

/* =========================
   OT
========================= */

window.changeOT =
function(
  id,
  value
) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );

  if (a.submitted) return;

  a.otHours =
    Number(value || 0);

  saveData();

  render();

};

/* =========================
   ADVANCE
========================= */

window.changeAdvance =
function(
  id,
  value
) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );

  if (a.submitted) return;

  a.advance =
    Number(value || 0);

  saveData();

  render();

};

/* =========================
   SUBMIT ATTENDANCE
========================= */

window.submitAttendance =
function(id) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );

  a.submitted = true;

  saveData();

  render();

};

/* =========================
   EDIT ATTENDANCE
========================= */

window.editAttendance =
function(id) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );

  a.submitted = false;

  saveData();

  render();

};

/* =========================
   ALL PRESENT
========================= */

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

/* =========================
   WORKER EDIT
========================= */

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

/* =========================
   DELETE WORKER
========================= */

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

/* =========================
   ADD WORKER
========================= */

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

  workerOTRate.value =
    "";

  workerPhone.value =
    "";

  modal.classList.remove(
    "hidden"
  );

  workerName.focus();

};

/* =========================
   CLOSE MODAL
========================= */

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

/* =========================
   SAVE WORKER
========================= */

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

  } else {

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

/* ======================================================
   ATTENDANCE DATES
   ONLY SELECTED WORKER
   GREEN = SUBMITTED
====================================================== */

function updateAttendanceDates() {

  const box =
    document.getElementById(
      "submittedDates"
    ) ||
    document.getElementById(
      "attendanceDates"
    );

  if (!box) return;

  box.innerHTML = "";

  const workerText =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();

  const selectedWorker =
    data.workers.find(
      w =>
        String(w.name || "")
          .trim()
          .toLowerCase() ===
        workerText
    );

  if (!selectedWorker) {

    box.innerHTML = `
      <span class="no-dates">
        Select a worker to see attendance dates
      </span>
    `;

    return;

  }

  const submittedDates =
    Object.keys(
      data.attendance
    )
      .filter(date => {

        const day =
          data.attendance[date];

        if (!day) {
          return false;
        }

        const a =
          day[selectedWorker.id];

        return (
          a &&
          a.submitted === true
        );

      })
      .sort();

  if (
    !submittedDates.length
  ) {

    box.innerHTML = `
      <span class="no-dates">
        No attendance submitted for
        <strong>
          ${esc(selectedWorker.name)}
        </strong>
      </span>
    `;

    return;

  }

  submittedDates.forEach(
    date => {

      const btn =
        document.createElement(
          "button"
        );

      btn.type =
        "button";

      btn.textContent =
        "🟢 " +
        formatDate(date);

      btn.className =
        "attendance-date-green";

      if (
        date === selectedDate()
      ) {

        btn.classList.add(
          "selected"
        );

      }

      btn.onclick =
        function() {

          dateInput.value =
            date;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        };

      box.appendChild(
        btn
      );

    }
  );

}

/* =========================
   MONTHLY SUMMARY
========================= */

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

      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const day =
          data.attendance[iso];

        const a =
          day
            ? day[w.id]
            : null;

        // ONLY SUBMITTED ATTENDANCE
        if (
          !a ||
          a.submitted !== true
        ) {
          continue;
        }

        if (
          a.status === "Present"
        ) {

          present++;

        } else if (
          a.status === "Half Day"
        ) {

          half++;

        } else if (
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

/* =========================
   PAYMENT
========================= */

window.changeMonthlyPayment =
function(
  id,
  value
) {

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
      !data.attendance[iso]
    ) {

      data.attendance[iso] =
        {};

    }

    if (
      !data.attendance[iso][id]
    ) {

      data.attendance[iso][id] = {

        status:
          "Present",

        otHours:
          0,

        advance:
          0,

        payment:
          value,

        submitted:
          false

      };

    }

    data.attendance[
      iso
    ][id].payment =
      value;

  }

  saveData();

  render();

};

/* =========================
   SEARCH / DATE
========================= */

dateInput.onchange =
function() {

  render();

};

searchInput.oninput =
function() {

  render();

};

/* =========================
   SHOW ALL
========================= */

const showAllBtn =
  document.getElementById(
    "showAllBtn"
  );

if (showAllBtn) {

  showAllBtn.onclick =
    function() {

      searchInput.value =
        "";

      render();

    };

}

/* =========================
   PRINT
========================= */

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};

/* =========================
   EXPORT CSV
========================= */

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

/* =========================
   ESCAPE HTML
========================= */

function esc(s) {

  return String(s)
    .replace(
      /[&<>"']/g,
      c => ({
        "&":
          "&amp;",
        "<":
          "&lt;",
        ">":
          "&gt;",
        '"':
          "&quot;",
        "'":
          "&#39;"
      }[c])
    );

}

/* =========================
   START
========================= */

render();
