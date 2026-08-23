const KEY = "ctd_worker_hajeri_final_v1";


// ======================================================
// DEFAULT DATA
// ======================================================

const defaultData = {
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


// ======================================================
// LOAD DATA
// ======================================================

let data = loadData();

function loadData() {

  try {

    // New data
    const saved = localStorage.getItem(KEY);

    if (saved) {

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed.workers)) {
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

        if (!w.phone) {
          w.phone = "";
        }

      });

      return parsed;
    }


    // Try old v3 data
    const oldV3 =
      localStorage.getItem(
        "ctd_worker_hajeri_v3"
      );

    if (oldV3) {

      const parsed = JSON.parse(oldV3);

      if (Array.isArray(parsed.workers)) {

        parsed.workers.forEach(w => {

          if (!w.id) {
            w.id = crypto.randomUUID();
          }

          if (w.otRate === undefined) {
            w.otRate = 0;
          }

        });

      }

      return parsed;
    }


    // Try old v2 data
    const oldV2 =
      localStorage.getItem(
        "ctd_worker_hajeri_v2"
      );

    if (oldV2) {

      const parsed = JSON.parse(oldV2);

      if (Array.isArray(parsed.workers)) {

        parsed.workers.forEach(w => {

          if (!w.id) {
            w.id = crypto.randomUUID();
          }

          if (w.otRate === undefined) {
            w.otRate = 0;
          }

        });

      }

      return parsed;
    }


    return defaultData;

  }

  catch (error) {

    console.error(
      "Data loading error:",
      error
    );

    return defaultData;

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
// ELEMENTS
// ======================================================

const dateInput =
  document.getElementById("dateInput");

const searchInput =
  document.getElementById("searchInput");

const workerDropdown =
  document.getElementById("workerDropdown");

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


// Selected worker filter
let selectedWorkerId = "";


// ======================================================
// DATE
// ======================================================

dateInput.value = todayISO();


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


function selectedDate() {

  return (
    dateInput.value ||
    todayISO()
  );

}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(iso) {

  const parts =
    iso.split("-");

  return (
    parts[2] +
    "-" +
    parts[1] +
    "-" +
    parts[0]
  );

}


// ======================================================
// ATTENDANCE
// IMPORTANT:
// Only submitted attendance is counted.
// ======================================================

function getSavedAttendance(
  workerId,
  date
) {

  if (
    !data.attendance ||
    !data.attendance[date] ||
    !data.attendance[date][workerId]
  ) {

    return null;

  }

  return data.attendance[date][workerId];

}


function getDisplayAttendance(
  workerId,
  date
) {

  const saved =
    getSavedAttendance(
      workerId,
      date
    );


  if (!saved) {

    return {

      status: "Present",

      otHours: 0,

      advance: 0,

      payment: "Pending",

      submitted: false

    };

  }


  return {

    status:
      saved.status || "Present",

    otHours:
      Number(saved.otHours || 0),

    advance:
      Number(saved.advance || 0),

    payment:
      saved.payment || "Pending",

    submitted:
      saved.submitted === true

  };

}


// ======================================================
// SAVE DAILY ATTENDANCE
// ======================================================

function saveAttendance(
  workerId,
  date,
  values
) {

  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  const old =
    getSavedAttendance(
      workerId,
      date
    ) || {

      status: "Present",

      otHours: 0,

      advance: 0,

      payment: "Pending",

      submitted: false

    };


  data.attendance[date][workerId] = {

    ...old,

    ...values

  };


  saveData();

}


// ======================================================
// SEARCH WORKER DROPDOWN
// ======================================================

function renderWorkerDropdown() {

  const q =
    searchInput.value
      .trim()
      .toLowerCase();


  let workers =
    data.workers.filter(w =>
      w.name
        .toLowerCase()
        .includes(q)
    );


  workerDropdown.innerHTML = "";


  if (!workers.length) {

    workerDropdown.innerHTML = `
      <div class="worker-option">
        No worker found
      </div>
    `;

    workerDropdown.classList.remove(
      "hidden"
    );

    return;
  }


  workers.forEach(w => {

    const div =
      document.createElement("div");

    div.className =
      "worker-option";


    div.innerHTML = `
      <strong>
        ${esc(w.name)}
      </strong>

      <span>
        Daily Rate: ₹${Number(
          w.rate || 0
        ).toLocaleString("en-IN")}
      </span>
    `;


    div.onclick = function() {

      selectedWorkerId = w.id;

      searchInput.value =
        w.name;

      workerDropdown.classList.add(
        "hidden"
      );

      render();

    };


    workerDropdown.appendChild(
      div
    );

  });


  workerDropdown.classList.remove(
    "hidden"
  );

}


// ======================================================
// FILTER WORKERS
// ======================================================

function filteredWorkers() {

  // If worker selected
  if (selectedWorkerId) {

    return data.workers.filter(
      w => w.id === selectedWorkerId
    );

  }


  // Search typing
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


// ======================================================
// MAIN RENDER
// ======================================================

function render() {

  const date =
    selectedDate();


  const workers =
    filteredWorkers();


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  // -----------------------------------------
  // DAILY STATS
  // -----------------------------------------

  let present = 0;

  let absent = 0;

  let half = 0;


  data.workers.forEach(w => {

    const a =
      getSavedAttendance(
        w.id,
        date
      );


    // IMPORTANT:
    // Count ONLY submitted attendance

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


  // -----------------------------------------
  // DAILY TABLE
  // -----------------------------------------

  workerTable.innerHTML =
    workers.map(
      (w, index) => {

        const a =
          getDisplayAttendance(
            w.id,
            date
          );


        const disabled =
          a.submitted
            ? "disabled"
            : "";


        const attendanceButton =
          a.submitted

            ? `
              <button
                class="edit"
                onclick="editAttendance('${w.id}')"
              >
                Edit
              </button>
            `

            : `
              <button
                class="submit"
                onclick="submitAttendance('${w.id}')"
              >
                Submit
              </button>
            `;


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
                id="status_${w.id}"
                ${disabled}
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
                id="ot_${w.id}"
                class="small-input"
                type="number"
                min="0"
                step="0.5"
                value="${a.otHours}"
                ${disabled}
              >

            </td>


            <td>

              <input
                id="advance_${w.id}"
                class="small-input"
                type="number"
                min="0"
                step="1"
                value="${a.advance}"
                ${disabled}
              >

            </td>


            <td>

              ${attendanceButton}

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

      }
    ).join("");


  document.getElementById(
    "emptyState"
  ).style.display =
    workers.length
      ? "none"
      : "block";


  renderMonthly();

}


// ======================================================
// SUBMIT ATTENDANCE
// ======================================================

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();


  const status =
    document.getElementById(
      `status_${workerId}`
    ).value;


  const otHours =
    Number(
      document.getElementById(
        `ot_${workerId}`
      ).value || 0
    );


  const advance =
    Number(
      document.getElementById(
        `advance_${workerId}`
      ).value || 0
    );


  saveAttendance(
    workerId,
    date,
    {

      status:
        status,

      otHours:
        otHours,

      advance:
        advance,

      submitted:
        true

    }
  );


  render();

};


// ======================================================
// EDIT ATTENDANCE
// ======================================================

window.editAttendance =
function(workerId) {

  const date =
    selectedDate();


  const a =
    getSavedAttendance(
      workerId,
      date
    );


  if (!a) return;


  a.submitted = false;


  saveData();


  render();

};


// ======================================================
// MONTHLY REPORT
// ======================================================

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

      let payment =
        "Pending";


      // ---------------------------------------
      // ONLY SUBMITTED DAYS
      // ---------------------------------------

      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month)
            .padStart(2, "0")}-${String(d)
            .padStart(2, "0")}`;


        const a =
          getSavedAttendance(
            w.id,
            iso
          );


        // No attendance submitted
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
          a.payment === "Paid"
        ) {

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
            ₹${totalSalary.toLocaleString(
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


// ======================================================
// MONTHLY PAYMENT
// ======================================================

window.changeMonthlyPayment =
function(workerId, value) {

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
      `${year}-${String(month)
        .padStart(2, "0")}-${String(d)
        .padStart(2, "0")}`;


    const a =
      getSavedAttendance(
        workerId,
        iso
      );


    // Only submitted attendance
    if (
      a &&
      a.submitted === true
    ) {

      a.payment = value;

    }

  }


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


  workerOTRate.value =
    "";


  workerPhone.value =
    "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};


// ======================================================
// OPEN EDIT WORKER
// ======================================================

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


  const otRate =
    Number(
      workerOTRate.value || 0
    );


  const phone =
    workerPhone.value.trim();


  const id =
    editWorkerId.value;


  // ---------------------------------------
  // EDIT
  // ---------------------------------------

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


  // ---------------------------------------
  // ADD
  // ---------------------------------------

  else {

    const newWorker = {

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

    };


    data.workers.push(
      newWorker
    );

  }


  // SAVE
  saveData();


  // Clear search
  selectedWorkerId =
    "";


  searchInput.value =
    "";


  closeModal();


  render();


  // IMPORTANT confirmation
  console.log(
    "Worker saved successfully:",
    name
  );

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


  if (!w) return;


  const ok =
    confirm(
      `Delete worker "${w.name}"?`
    );


  if (!ok) return;


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


  selectedWorkerId =
    "";


  searchInput.value =
    "";


  render();

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


  data.workers.forEach(w => {

    saveAttendance(
      w.id,
      date,
      {

        status:
          "Present",

        otHours:
          0,

        advance:
          0,

        submitted:
          true

      }
    );

  });


  saveData();

  render();

};


// ======================================================
// CLEAR WORKER FILTER
// ======================================================

document.getElementById(
  "clearWorkerBtn"
).onclick =
function() {

  selectedWorkerId =
    "";


  searchInput.value =
    "";


  workerDropdown.classList.add(
    "hidden"
  );


  render();

};


// ======================================================
// SEARCH INPUT
// ======================================================

searchInput.addEventListener(
  "focus",
  function() {

    renderWorkerDropdown();

  }
);


searchInput.addEventListener(
  "input",
  function() {

    selectedWorkerId =
      "";


    renderWorkerDropdown();

    render();

  }
);


// ======================================================
// DATE CHANGE
// ======================================================

dateInput.onchange =
function() {

  render();

};


// ======================================================
// CLOSE DROPDOWN OUTSIDE
// ======================================================

document.addEventListener(
  "click",
  function(e) {

    if (
      !e.target.closest(
        ".worker-picker"
      )
    ) {

      workerDropdown.classList.add(
        "hidden"
      );

    }

  }
);


// ======================================================
// MODAL CLOSE
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

      "No submitted attendance",

      "",

      "",

      "",

      "",

      "",

      "",

      "No"

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
    document.createElement("a");


  a.href =
    URL.createObjectURL(blob);


  a.download =
    "CTD-Worker-Hajeri.csv";


  a.click();


  URL.revokeObjectURL(
    a.href
  );

};


// ======================================================
// ESC HTML
// ======================================================

function esc(s) {

  return String(s)
    .replace(
      /[&<>"']/g,
      function(c) {

        return {

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

        }[c];

      }
    );

}


// ======================================================
// INITIAL RENDER
// ======================================================

render();


// ======================================================
// SAVE CHECK
// ======================================================

console.log(
  "CTD Worker Hajeri loaded"
);

console.log(
  "Workers:",
  data.workers
);
