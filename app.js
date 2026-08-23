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


const dateInput =
  document.getElementById("dateInput");

const searchInput =
  document.getElementById("searchInput");

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

const workerSuggestions =
  document.getElementById("workerSuggestions");

const savedDates =
  document.getElementById("savedDates");

const dateStatus =
  document.getElementById("dateStatus");


dateInput.value = todayISO();



/* =========================
   LOAD DATA
========================= */

function loadData() {

  try {

    let saved =
      localStorage.getItem(KEY);

    if (!saved) {

      saved =
        localStorage.getItem(OLD_KEY);

    }


    if (!saved) {

      return defaultData;

    }


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

  catch (e) {

    console.error(e);

    return defaultData;

  }

}



/* =========================
   SAVE DATA
========================= */

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}



/* =========================
   TODAY
========================= */

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime()
    -
    d.getTimezoneOffset() * 60000
  )
  .toISOString()
  .slice(0, 10);

}



/* =========================
   SELECTED DATE
========================= */

function selectedDate() {

  return dateInput.value || todayISO();

}



/* =========================
   DATE FORMAT
========================= */

function formatDate(iso) {

  if (!iso) return "";

  const [
    y,
    m,
    d
  ] = iso.split("-");

  return `${d}-${m}-${y}`;

}



/* =========================
   ATTENDANCE OBJECT
========================= */

function getAttendance(
  workerId,
  date,
  create = true
) {

  if (!data.attendance[date]) {

    if (!create) {
      return null;
    }

    data.attendance[date] = {};

  }


  if (
    !data.attendance[date][workerId]
  ) {

    if (!create) {
      return null;
    }


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


  if (a.payment === undefined) {

    a.payment = "Pending";

  }


  if (a.otHours === undefined) {

    a.otHours = 0;

  }


  if (a.advance === undefined) {

    a.advance = 0;

  }


  return a;

}



/* =========================
   SUBMITTED DATE CHECK
========================= */

function dateHasSubmitted(date) {

  const day =
    data.attendance[date];

  if (!day) return false;


  return Object.values(day)
    .some(a => a && a.submitted === true);

}



/* =========================
   WORKER SEARCH
========================= */

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



/* =========================
   RENDER
========================= */

function render() {

  const workers =
    filteredWorkers();

  const date =
    selectedDate();


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  /* COUNTS */

  let present = 0;

  let absent = 0;

  let half = 0;


  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date,
        false
      );


    if (
      !a ||
      !a.submitted
    ) {
      return;
    }


    if (a.status === "Present") {

      present++;

    }

    else if (
      a.status === "Absent"
    ) {

      absent++;

    }

    else if (
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


  /* DAILY TABLE */

  workerTable.innerHTML =
    workers.map((w, i) => {

      const a =
        getAttendance(
          w.id,
          date,
          true
        );


      const submitted =
        a.submitted === true;


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
              ${submitted ? "disabled" : ""}
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
              type="number"
              min="0"
              step="0.5"
              value="${a.otHours || 0}"
              ${submitted ? "disabled" : ""}
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
              ${submitted ? "disabled" : ""}
              onchange="
                changeAdvance(
                  '${w.id}',
                  this.value
                )
              "
            >

          </td>


          <td>

            ${
              submitted

              ?

              `
                <button
                  class="edit attendance-edit"
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
                  class="submit-btn"
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


  renderDateStatus();

  renderSavedDates();

  renderMonthly();

  renderSuggestions();

}



/* =========================
   DATE STATUS
========================= */

function renderDateStatus() {

  const date =
    selectedDate();


  if (
    dateHasSubmitted(date)
  ) {

    dateStatus.innerHTML =
      `<span class="saved-badge">
        ✓ Hajeri Submitted
      </span>`;

  }

  else {

    dateStatus.innerHTML =
      `<span class="not-saved-badge">
        Hajeri Not Submitted
      </span>`;

  }

}



/* =========================
   SAVED DATES
========================= */

function renderSavedDates() {

  const dates =
    Object.keys(
      data.attendance
    )
    .filter(date =>
      dateHasSubmitted(date)
    )
    .sort();


  if (!dates.length) {

    savedDates.innerHTML =
      `<span class="no-dates">
        No submitted attendance dates yet
      </span>`;

    return;

  }


  savedDates.innerHTML =
    dates.map(date => {

      const selected =
        date === selectedDate();


      return `

        <button
          type="button"
          class="
            saved-date
            ${selected ? "selected-date" : ""}
          "
          onclick="
            selectSavedDate(
              '${date}'
            )
          "
        >
          ✓ ${formatDate(date)}
        </button>

      `;

    }).join("");

}



/* =========================
   SELECT SAVED DATE
========================= */

window.selectSavedDate =
function(date) {

  dateInput.value = date;

  searchInput.value = "";

  render();

};



/* =========================
   WORKER SUGGESTIONS
========================= */

function renderSuggestions() {

  const q =
    searchInput.value
      .trim()
      .toLowerCase();


  if (!q) {

    workerSuggestions.classList.remove(
      "show"
    );

    workerSuggestions.innerHTML =
      "";

    return;

  }


  const matches =
    data.workers.filter(w =>
      w.name
        .toLowerCase()
        .includes(q)
    );


  if (!matches.length) {

    workerSuggestions.innerHTML =
      `<div class="no-worker">
        Worker not found
      </div>`;

    workerSuggestions.classList.add(
      "show"
    );

    return;

  }


  workerSuggestions.innerHTML =
    matches.map(w => `

      <button
        type="button"
        onclick="
          selectWorker(
            '${w.id}'
          )
        "
      >
        ${esc(w.name)}
      </button>

    `).join("");


  workerSuggestions.classList.add(
    "show"
  );

}



/* =========================
   SELECT WORKER
========================= */

window.selectWorker =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) return;


  searchInput.value =
    w.name;


  workerSuggestions.classList.remove(
    "show"
  );


  render();

};



/* =========================
   SHOW ALL
========================= */

document.getElementById(
  "showAllBtn"
).onclick = function() {

  searchInput.value = "";

  workerSuggestions.classList.remove(
    "show"
  );

  workerSuggestions.innerHTML =
    "";

  render();

};



/* =========================
   CHANGE STATUS
========================= */

window.changeStatus =
function(id, status) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );


  if (a.submitted) {
    return;
  }


  a.status = status;

  saveData();

  render();

};



/* =========================
   CHANGE OT
========================= */

window.changeOT =
function(id, value) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );


  if (a.submitted) {
    return;
  }


  a.otHours =
    Number(value || 0);


  saveData();

  render();

};



/* =========================
   CHANGE ADVANCE
========================= */

window.changeAdvance =
function(id, value) {

  const a =
    getAttendance(
      id,
      selectedDate()
    );


  if (a.submitted) {
    return;
  }


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

  const date =
    selectedDate();


  const a =
    getAttendance(
      id,
      date
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

  const date =
    selectedDate();


  const a =
    getAttendance(
      id,
      date
    );


  a.submitted = false;


  saveData();

  render();

};



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

      let lastPayment =
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
            iso,
            false
          );


        /* IMPORTANT:
           ONLY SUBMITTED
        */

        if (
          !a ||
          !a.submitted
        ) {

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


        if (
          a.payment
        ) {

          lastPayment =
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
              ₹${(
                netSalary +
                overtimeAmount
              ).toLocaleString("en-IN")}
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



/* =========================
   MONTHLY PAYMENT
========================= */

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
        iso,
        false
      );


    if (
      a &&
      a.submitted
    ) {

      a.payment =
        value;

    }

  }


  saveData();

  render();

};



/* =========================
   ADD / EDIT WORKER
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
   MODAL
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
  function(e) {

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

  searchInput.value = "";

  render();

};



/* =========================
   MARK ALL PRESENT
========================= */

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


  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date
      );


    if (
      !a.submitted
    ) {

      a.status =
        "Present";

    }

  });


  saveData();

  render();

};



/* =========================
   DATE CHANGE
========================= */

dateInput.onchange =
function() {

  searchInput.value = "";

  render();

};



/* =========================
   SEARCH
========================= */

searchInput.oninput =
function() {

  render();

};



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


  dates.forEach(date => {

    data.workers.forEach(w => {

      const a =
        getAttendance(
          w.id,
          date,
          false
        );


      if (
        !a ||
        !a.submitted
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
        ),

        "Yes"

      ]);

    });

  });


  if (
    rows.length === 1
  ) {

    rows.push([

      selectedDate(),

      "",

      "",

      "",

      "",

      "",

      "",

      "",

      "No submitted attendance"

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



/* =========================
   ESCAPE HTML
========================= */

function esc(s) {

  return String(s).replace(
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
   CLOSE SEARCH
========================= */

document.addEventListener(
  "click",
  function(e) {

    if (
      !e.target.closest(
        ".grow"
      )
    ) {

      workerSuggestions.classList.remove(
        "show"
      );

    }

  }
);



/* START */

render();
