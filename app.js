const KEY = "ctd_worker_hajeri_v3";

const defaultData = {
  workers: [],
  attendance: {}
};

let data = loadData();

const dateInput =
  document.getElementById("dateInput");

const workerSelect =
  document.getElementById("workerSelect");

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



/* =========================
   LOAD DATA
========================= */

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

    return parsed;

  }

  catch (error) {

    console.log(error);

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
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
  .toISOString()
  .slice(0, 10);

}


dateInput.value = todayISO();



/* =========================
   SELECTED DATE
========================= */

function selectedDate() {

  return (
    dateInput.value ||
    todayISO()
  );

}



/* =========================
   ATTENDANCE
========================= */

/*
IMPORTANT:

No attendance = NOTHING

Attendance will count only after
Submit button is clicked.
*/

function getAttendance(
  workerId,
  date
) {

  if (
    !data.attendance[date]
  ) {

    return null;

  }

  return (
    data.attendance[date][workerId] ||
    null
  );

}



function saveAttendance(
  workerId,
  values,
  date = selectedDate()
) {

  if (
    !data.attendance[date]
  ) {

    data.attendance[date] = {};

  }


  const old =
    data.attendance[date][workerId] || {

      status: "Present",

      otHours: 0,

      advance: 0,

      submitted: false,

      payment: "Pending"

    };


  data.attendance[date][workerId] = {

    ...old,

    ...values

  };


  saveData();

  render();

}



/* =========================
   WORKER DROPDOWN
========================= */

function renderWorkerDropdown() {

  const current =
    workerSelect.value;


  workerSelect.innerHTML = `
    <option value="">
      All Workers
    </option>
  `;


  data.workers.forEach(
    worker => {

      const option =
        document.createElement("option");

      option.value =
        worker.id;

      option.textContent =
        worker.name;

      workerSelect.appendChild(
        option
      );

    }
  );


  if (
    data.workers.some(
      w => w.id === current
    )
  ) {

    workerSelect.value =
      current;

  }

}



/* =========================
   FILTER WORKERS
========================= */

function filteredWorkers() {

  const selected =
    workerSelect.value;


  if (!selected) {

    return data.workers;

  }


  return data.workers.filter(
    worker =>
      worker.id === selected
  );

}



/* =========================
   RENDER
========================= */

function render() {

  renderWorkerDropdown();


  const workers =
    filteredWorkers();

  const date =
    selectedDate();


  document.getElementById(
    "selectedDateLabel"
  ).textContent =
    formatDate(date);



  /* =========================
     DAILY COUNTS
  ========================= */

  let present = 0;

  let absent = 0;

  let half = 0;


  data.workers.forEach(
    worker => {

      const a =
        getAttendance(
          worker.id,
          date
        );


      if (
        !a ||
        !a.submitted
      ) {

        return;

      }


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

    }
  );



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
    workers.map(
      (worker, index) => {

        const a =
          getAttendance(
            worker.id,
            date
          );


        const status =
          a?.status ||
          "Present";


        const ot =
          a?.otHours || 0;


        const advance =
          a?.advance || 0;


        const submitted =
          a?.submitted === true;


        return `

        <tr>

          <td>
            ${index + 1}
          </td>


          <td>
            <strong>
              ${esc(worker.name)}
            </strong>
          </td>


          <td>
            ₹${Number(
              worker.rate || 0
            ).toLocaleString("en-IN")}
          </td>


          <td>

            <select
              class="status-select"
              id="status-${worker.id}"
              ${submitted ? "disabled" : ""}
            >

              <option value="Present"
                ${status === "Present" ? "selected" : ""}
              >
                Present
              </option>

              <option value="Absent"
                ${status === "Absent" ? "selected" : ""}
              >
                Absent
              </option>

              <option value="Half Day"
                ${status === "Half Day" ? "selected" : ""}
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
              id="ot-${worker.id}"
              value="${ot}"
              ${submitted ? "disabled" : ""}
            >

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="1"
              id="advance-${worker.id}"
              value="${advance}"
              ${submitted ? "disabled" : ""}
            >

          </td>


          <td>

            ${
              submitted

              ?

              `<button
                class="edit"
                onclick="editAttendance('${worker.id}')"
              >
                Edit
              </button>`

              :

              `<button
                class="primary"
                onclick="submitAttendance('${worker.id}')"
              >
                Submit
              </button>`
            }

          </td>


          <td class="actions">

            <button
              class="edit"
              onclick="openEdit('${worker.id}')"
            >
              Edit
            </button>


            <button
              class="danger"
              onclick="deleteWorker('${worker.id}')"
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



/* =========================
   SUBMIT ATTENDANCE
========================= */

window.submitAttendance =
function(workerId) {

  const statusElement =
    document.getElementById(
      `status-${workerId}`
    );


  const otElement =
    document.getElementById(
      `ot-${workerId}`
    );


  const advanceElement =
    document.getElementById(
      `advance-${workerId}`
    );


  const status =
    statusElement.value;


  const otHours =
    Number(
      otElement.value || 0
    );


  const advance =
    Number(
      advanceElement.value || 0
    );


  saveAttendance(
    workerId,
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

};



/* =========================
   EDIT ATTENDANCE
========================= */

window.editAttendance =
function(workerId) {

  const date =
    selectedDate();


  const a =
    getAttendance(
      workerId,
      date
    );


  if (!a) return;


  saveAttendance(
    workerId,
    {

      submitted: false

    }
  );

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
  ) return;


  const date =
    selectedDate();


  data.workers.forEach(
    worker => {

      data.attendance[date] =
        data.attendance[date] || {};


      const old =
        data.attendance[date][worker.id] || {};


      data.attendance[date][worker.id] = {

        ...old,

        status: "Present",

        otHours:
          old.otHours || 0,

        advance:
          old.advance || 0,

        payment:
          old.payment || "Pending",

        submitted: true

      };

    }
  );


  saveData();

  render();

};



/* =========================
   MONTHLY REPORT
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
    data.workers.map(
      worker => {

        let present = 0;

        let half = 0;

        let absent = 0;

        let otHours = 0;

        let advance = 0;

        let payment =
          "Pending";


        for (
          let day = 1;
          day <= daysInMonth;
          day++
        ) {

          const iso =
            `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


          const a =
            getAttendance(
              worker.id,
              iso
            );


          /*
          VERY IMPORTANT:
          Only submitted attendance
          is counted.
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
          Number(
            worker.rate || 0
          );


        const overtimeAmount =
          otHours *
          Number(
            worker.otRate || 0
          );


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
              ${esc(worker.name)}
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
              onchange="changeMonthlyPayment('${worker.id}', this.value)"
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

      }
    ).join("");

}



/* =========================
   PAYMENT
========================= */

window.changeMonthlyPayment =
function(workerId, value) {

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
    let day = 1;
    day <= days;
    day++
  ) {

    const iso =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const a =
      getAttendance(
        workerId,
        iso
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
   EDIT WORKER
========================= */

window.openEdit =
function(workerId) {

  const worker =
    data.workers.find(
      w => w.id === workerId
    );


  if (!worker) return;


  document.getElementById(
    "modalTitle"
  ).textContent =
    "Edit Worker";


  editWorkerId.value =
    worker.id;


  workerName.value =
    worker.name;


  workerRate.value =
    worker.rate || "";


  workerOTRate.value =
    worker.otRate || "";


  workerPhone.value =
    worker.phone || "";


  modal.classList.remove(
    "hidden"
  );


  workerName.focus();

};



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

    const worker =
      data.workers.find(
        w => w.id === id
      );


    if (worker) {

      worker.name =
        name;

      worker.rate =
        Number(
          workerRate.value || 0
        );

      worker.otRate =
        Number(
          workerOTRate.value || 0
        );

      worker.phone =
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



/* =========================
   DELETE WORKER
========================= */

window.deleteWorker =
function(workerId) {

  const worker =
    data.workers.find(
      w => w.id === workerId
    );


  if (!worker) return;


  if (
    !confirm(
      `Delete worker "${worker.name}"?`
    )
  ) {

    return;

  }


  data.workers =
    data.workers.filter(
      w => w.id !== workerId
    );


  Object.keys(
    data.attendance
  ).forEach(
    date => {

      delete data.attendance[
        date
      ][workerId];

    }
  );


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
  function(event) {

    if (
      event.target === modal
    ) {

      closeModal();

    }

  }
);



/* =========================
   DATE CHANGE
========================= */

dateInput.onchange =
function() {

  render();

};



/* =========================
   WORKER SELECT CHANGE
========================= */

workerSelect.onchange =
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


  dates.forEach(
    date => {

      data.workers.forEach(
        worker => {

          const a =
            getAttendance(
              worker.id,
              date
            );


          if (
            !a ||
            !a.submitted
          ) {

            return;

          }


          rows.push([

            date,

            worker.name,

            worker.rate,

            a.status,

            a.otHours,

            a.advance,

            worker.otRate,

            Number(
              a.otHours || 0
            ) *
            Number(
              worker.otRate || 0
            ),

            "Yes"

          ]);

        }
      );

    }
  );


  if (
    rows.length === 1
  ) {

    rows.push([

      selectedDate(),

      "",

      "",

      "No submitted attendance",

      "",

      "",

      "",

      "",

      "No"

    ]);

  }


  const csv =
    rows
      .map(
        row =>
          row
            .map(
              value =>
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

function esc(value) {

  return String(value)
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



/* =========================
   START
========================= */

render();
