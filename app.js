const KEY = "ctd_worker_hajeri_v5";


/* =====================================================
   DEFAULT DATA
===================================================== */

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


/* =====================================================
   LOAD DATA
===================================================== */

let data = loadData();


function loadData() {

  try {

    const saved =
      localStorage.getItem(KEY);

    if (!saved) {

      return defaultData;

    }

    const parsed =
      JSON.parse(saved);


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

      if (w.phone === undefined) {
        w.phone = "";
      }

    });


    return parsed;

  }

  catch (error) {

    console.error(error);

    return defaultData;

  }

}


/* =====================================================
   SAVE
===================================================== */

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}


/* =====================================================
   ELEMENTS
===================================================== */

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


/* =====================================================
   TODAY
===================================================== */

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

}


dateInput.value =
  todayISO();


/* =====================================================
   SELECTED DATE
===================================================== */

function selectedDate() {

  return dateInput.value ||
    todayISO();

}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(iso) {

  if (!iso) return "";

  const parts =
    iso.split("-");

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


/* =====================================================
   GET ATTENDANCE
===================================================== */

function getAttendance(
  workerId,
  date
) {

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


/* =====================================================
   ESCAPE HTML
===================================================== */

function esc(value) {

  return String(value)
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


/* =====================================================
   FILTER WORKERS
===================================================== */

function filteredWorkers() {

  const q =
    searchInput.value
      .trim()
      .toLowerCase();


  if (!q) {

    return data.workers;

  }


  return data.workers.filter(
    w =>
      w.name
        .toLowerCase()
        .includes(q)
  );

}


/* =====================================================
   WORKER DROPDOWN / DATALIST
===================================================== */

function renderWorkerList() {

  workerList.innerHTML = "";


  data.workers
    .slice()
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    .forEach(w => {

      const option =
        document.createElement("option");

      option.value =
        w.name;

      workerList.appendChild(
        option
      );

    });

}


/* =====================================================
   DATE SUBMITTED?
===================================================== */

function isDateSubmitted(date) {

  const records =
    data.attendance[date];

  if (!records) {
    return false;
  }


  const ids =
    Object.keys(records);


  if (!ids.length) {
    return false;
  }


  return data.workers.some(
    w =>
      records[w.id] &&
      records[w.id].submitted === true
  );

}


/* =====================================================
   DATE STATUS
===================================================== */

function renderDateStatus() {

  const box =
    document.getElementById(
      "dateStatus"
    );

  if (isDateSubmitted(selectedDate())) {

    box.textContent =
      "✓ Attendance Submitted";

    box.className =
      "date-status done";

    dateInput.classList.add(
      "date-submitted"
    );

  }

  else {

    box.textContent =
      "Attendance not submitted";

    box.className =
      "date-status not-done";

    dateInput.classList.remove(
      "date-submitted"
    );

  }

}


/* =====================================================
   SUBMITTED DATES
===================================================== */

function renderSubmittedDates() {

  const box =
    document.getElementById(
      "submittedDates"
    );


  const dates =
    Object.keys(data.attendance)
      .filter(date =>
        isDateSubmitted(date)
      )
      .sort()
      .reverse();


  if (!dates.length) {

    box.innerHTML =
      `<span class="no-dates">
        No attendance submitted yet.
      </span>`;

    return;

  }


  box.innerHTML =
    dates.map(date => {

      return `
        <button
          class="date-chip"
          onclick="selectDate('${date}')"
        >
          🟢 ${formatDate(date)}
        </button>
      `;

    }).join("");

}


/* =====================================================
   SELECT DATE
===================================================== */

window.selectDate =
function(date) {

  dateInput.value =
    date;

  searchInput.value =
    "";

  render();

};


/* =====================================================
   RENDER
===================================================== */

function render() {

  renderWorkerList();

  renderDateStatus();

  renderSubmittedDates();


  const workers =
    filteredWorkers();

  const date =
    selectedDate();


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);


  /* =============================
     DAILY STATS
  ============================= */

  let present = 0;
  let absent = 0;
  let half = 0;


  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date
      );


    if (a.submitted !== true) {
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


  /* =============================
     DAILY TABLE
  ============================= */

  workerTable.innerHTML =
    workers.map(
      (w, i) => {

        const a =
          getAttendance(
            w.id,
            date
          );


        const submitted =
          a.submitted === true;


        return `

          <tr
            class="${submitted ? "submitted-row" : ""}"
          >

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
                ${submitted ? "disabled" : ""}
                onchange="
                  changeStatus(
                    '${w.id}',
                    this.value
                  )
                "
              >

                <option
                  value="Present"
                  ${a.status === "Present"
                    ? "selected"
                    : ""}
                >
                  Present
                </option>


                <option
                  value="Absent"
                  ${a.status === "Absent"
                    ? "selected"
                    : ""}
                >
                  Absent
                </option>


                <option
                  value="Half Day"
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

                `<button
                  class="submitted-btn"
                  disabled
                >
                  ✓ Submitted
                </button>`

                :

                `<button
                  class="submit-btn"
                  onclick="
                    submitAttendance(
                      '${w.id}'
                    )
                  "
                >
                  Submit
                </button>`
              }

            </td>


            <td class="actions">

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


              <button
                class="edit"
                onclick="
                  openEdit(
                    '${w.id}'
                  )
                "
              >
                Worker Edit
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


/* =====================================================
   SUBMIT ATTENDANCE
===================================================== */

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();


  const a =
    getAttendance(
      workerId,
      date
    );


  a.submitted =
    true;


  saveData();

  render();

};


/* =====================================================
   EDIT ATTENDANCE
===================================================== */

window.editAttendance =
function(workerId) {

  const date =
    selectedDate();


  const a =
    getAttendance(
      workerId,
      date
    );


  a.submitted =
    false;


  saveData();

  render();

};


/* =====================================================
   STATUS
===================================================== */

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


  if (a.submitted) {
    return;
  }


  a.status =
    status;


  saveData();

  render();

};


/* =====================================================
   OT
===================================================== */

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


  if (a.submitted) {
    return;
  }


  a.otHours =
    Number(value || 0);


  saveData();

  render();

};


/* =====================================================
   ADVANCE
===================================================== */

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


  if (a.submitted) {
    return;
  }


  a.advance =
    Number(value || 0);


  saveData();

  render();

};


/* =====================================================
   MARK ALL PRESENT
===================================================== */

document.getElementById(
  "allPresentBtn"
).onclick =
function() {

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


/* =====================================================
   SHOW ALL
===================================================== */

document.getElementById(
  "showAllBtn"
).onclick =
function() {

  searchInput.value = "";

  render();

};


/* =====================================================
   SEARCH
===================================================== */

searchInput.oninput =
function() {

  render();

};


/* =====================================================
   DATE CHANGE
===================================================== */

dateInput.onchange =
function() {

  searchInput.value = "";

  render();

};


/* =====================================================
   MONTHLY SUMMARY
===================================================== */

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
    data.workers
      .map(w => {

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
            `${year}-${String(month)
              .padStart(2, "0")}-${String(d)
              .padStart(2, "0")}`;


          const records =
            data.attendance[iso];


          if (!records) {
            continue;
          }


          const a =
            records[w.id];


          if (!a) {
            continue;
          }


          /*
            IMPORTANT:
            फक्त SUBMITTED attendance
            report मध्ये count होईल
          */

          if (a.submitted !== true) {
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


        /*
          Payment status
        */

        let payment = "Pending";


        const dates =
          Object.keys(
            data.attendance
          );


        for (
          const date of dates
        ) {

          const rec =
            data.attendance[date];


          if (
            rec &&
            rec[w.id] &&
            rec[w.id].submitted === true
          ) {

            if (
              rec[w.id].payment === "Paid"
            ) {

              payment = "Paid";

            }

          }

        }


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
                  changePayment(
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

      })
      .join("");

}


/* =====================================================
   PAYMENT
===================================================== */

window.changePayment =
function(
  workerId,
  value
) {

  const dates =
    Object.keys(
      data.attendance
    );


  dates.forEach(date => {

    const rec =
      data.attendance[date];


    if (
      rec &&
      rec[workerId] &&
      rec[workerId].submitted === true
    ) {

      rec[workerId].payment =
        value;

    }

  });


  saveData();

  render();

};


/* =====================================================
   ADD WORKER
===================================================== */

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


/* =====================================================
   EDIT WORKER
===================================================== */

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


  workerOTRate.value =
    w.otRate || "";


  workerPhone.value =
    w.phone || "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};


/* =====================================================
   SAVE WORKER
===================================================== */

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


  /*
    EDIT
  */

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


  /*
    NEW WORKER
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
        "Worker with this name already exists."
      );

      return;

    }


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


/* =====================================================
   DELETE WORKER
===================================================== */

window.deleteWorker =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) {
    return;
  }


  const ok =
    confirm(
      `Delete worker "${w.name}"?`
    );


  if (!ok) {
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


/* =====================================================
   CLOSE MODAL
===================================================== */

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


/* =====================================================
   PRINT
===================================================== */

document.getElementById(
  "printBtn"
).onclick =
function() {

  window.print();

};


/* =====================================================
   EXPORT CSV
===================================================== */

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

      const rec =
        data.attendance[date];


      if (!rec) {
        return;
      }


      const a =
        rec[w.id];


      if (!a) {
        return;
      }


      if (a.submitted !== true) {
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

};


/* =====================================================
   INITIAL RENDER
===================================================== */

render();
