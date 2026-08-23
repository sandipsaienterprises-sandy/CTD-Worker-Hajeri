const KEY = "ctd_worker_hajeri_final";

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


dateInput.value = todayISO();


/* =========================
   LOAD DATA
========================= */

function loadData() {

  try {

    let saved =
      localStorage.getItem(KEY);

    /*
      If final version doesn't exist,
      try old v3 data.
    */

    if (!saved) {

      saved =
        localStorage.getItem(OLD_KEY);

    }


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


    return defaultData;

  }

  catch (error) {

    console.error(error);

    return defaultData;

  }

}


/* =========================
   SAVE
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

  return (
    dateInput.value ||
    todayISO()
  );

}


/* =========================
   GET SAVED ATTENDANCE
========================= */

function getSavedAttendance(
  workerId,
  date
) {

  if (
    data.attendance[date] &&
    data.attendance[date][workerId]
  ) {

    const a =
      data.attendance[date][workerId];


    return {

      status:
        a.status || "Present",

      otHours:
        Number(a.otHours || 0),

      advance:
        Number(a.advance || 0),

      payment:
        a.payment || "Pending"

    };

  }


  /*
    IMPORTANT:
    New date is NOT automatically saved
    as Present.
  */

  return {

    status: "",

    otHours: 0,

    advance: 0,

    payment: "Pending"

  };

}


/* =========================
   SAVE ATTENDANCE
========================= */

function setAttendance(
  workerId,
  values,
  date = selectedDate()
) {

  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  const old =
    getSavedAttendance(
      workerId,
      date
    );


  data.attendance[date][workerId] = {

    ...old,

    ...values

  };


  saveData();

  render();

}


/* =========================
   WORKER LIST
========================= */

function renderWorkerSelect() {

  const oldValue =
    workerSelect.value;


  workerSelect.innerHTML = "";


  const allOption =
    document.createElement("option");

  allOption.value = "";

  allOption.textContent =
    "All Workers";

  workerSelect.appendChild(
    allOption
  );


  const sortedWorkers =
    [...data.workers].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );


  sortedWorkers.forEach(
    worker => {

      const option =
        document.createElement(
          "option"
        );

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
    oldValue &&
    data.workers.some(
      w => w.id === oldValue
    )
  ) {

    workerSelect.value =
      oldValue;

  }

}


/* =========================
   FILTER WORKERS
========================= */

function filteredWorkers() {

  const id =
    workerSelect.value;


  if (!id) {

    return data.workers;

  }


  return data.workers.filter(
    w => w.id === id
  );

}


/* =========================
   RENDER
========================= */

function render() {

  renderWorkerSelect();


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


  data.workers.forEach(
    worker => {

      const a =
        getSavedAttendance(
          worker.id,
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


  workerTable.innerHTML =
    workers.map(
      (worker, index) => {

        const a =
          getSavedAttendance(
            worker.id,
            date
          );


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
                onchange="
                  changeStatus(
                    '${worker.id}',
                    this.value
                  )
                "
              >

                <option
                  value=""
                  ${a.status === ""
                    ? "selected"
                    : ""}
                >
                  Select
                </option>


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
                value="${a.otHours}"
                onchange="
                  changeOT(
                    '${worker.id}',
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
                value="${a.advance}"
                onchange="
                  changeAdvance(
                    '${worker.id}',
                    this.value
                  )
                "
              >

            </td>


            <td class="actions">

              <button
                class="edit"
                onclick="
                  openEdit(
                    '${worker.id}'
                  )
                "
              >
                Edit
              </button>


              <button
                class="danger"
                onclick="
                  deleteWorker(
                    '${worker.id}'
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


  const today =
    todayISO();


  const currentYear =
    Number(today.split("-")[0]);


  const currentMonth =
    Number(today.split("-")[1]);


  const selectedYear =
    year;


  const selectedMonth =
    month;


  monthlyTable.innerHTML =
    data.workers.map(
      worker => {

        let present = 0;

        let half = 0;

        let absent = 0;

        let otHours = 0;

        let advance = 0;

        let paid =
          false;


        for (
          let day = 1;
          day <= daysInMonth;
          day++
        ) {

          const iso =
            `${year}-${String(
              month
            ).padStart(
              2,
              "0"
            )}-${String(
              day
            ).padStart(
              2,
              "0"
            )}`;


          /*
            Future dates are ignored.
          */

          if (
            iso > today
          ) {

            continue;

          }


          const a =
            getSavedAttendance(
              worker.id,
              iso
            );


          if (
            a.status ===
            "Present"
          ) {

            present++;

          }

          else if (
            a.status ===
            "Half Day"
          ) {

            half++;

          }

          else if (
            a.status ===
            "Absent"
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

            paid = true;

          }

        }


        const payableDays =
          present +
          (half * 0.5);


        const dailyRate =
          Number(
            worker.rate || 0
          );


        const otRate =
          Number(
            worker.otRate || 0
          );


        const grossSalary =
          payableDays *
          dailyRate;


        const overtimeAmount =
          otHours *
          otRate;


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
                    '${worker.id}',
                    this.value
                  )
                "
              >

                <option
                  value="Pending"
                  ${!paid
                    ? "selected"
                    : ""}
                >
                  Pending
                </option>


                <option
                  value="Paid"
                  ${paid
                    ? "selected"
                    : ""}
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
   DATE FORMAT
========================= */

function formatDate(iso) {

  const [
    y,
    m,
    d
  ] =
    iso.split("-");


  return `${d}-${m}-${y}`;

}


/* =========================
   HTML ESCAPE
========================= */

function esc(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      char => ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#39;"

      }[char])
    );

}


/* =========================
   STATUS
========================= */

window.changeStatus =
function(
  id,
  status
) {

  setAttendance(
    id,
    {
      status:
        status
    }
  );

};


/* =========================
   OT
========================= */

window.changeOT =
function(
  id,
  value
) {

  setAttendance(
    id,
    {
      otHours:
        Number(value || 0)
    }
  );

};


/* =========================
   ADVANCE
========================= */

window.changeAdvance =
function(
  id,
  value
) {

  setAttendance(
    id,
    {
      advance:
        Number(value || 0)
    }
  );

};


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


  const today =
    todayISO();


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
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}`;


    if (
      iso > today
    ) {

      continue;

    }


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

        status: "",

        otHours: 0,

        advance: 0,

        payment: value

      };

    }

    else {

      data.attendance[
        iso
      ][id].payment =
        value;

    }

  }


  saveData();

  render();

};


/* =========================
   OPEN EDIT
========================= */

window.openEdit =
function(id) {

  const worker =
    data.workers.find(
      w => w.id === id
    );


  if (!worker) {
    return;
  }


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
   DELETE
========================= */

window.deleteWorker =
function(id) {

  const worker =
    data.workers.find(
      w => w.id === id
    );


  if (!worker) {
    return;
  }


  if (
    !confirm(
      `Delete worker "${worker.name}"?`
    )
  ) {

    return;

  }


  data.workers =
    data.workers.filter(
      w => w.id !== id
    );


  Object.keys(
    data.attendance
  ).forEach(
    date => {

      delete data.attendance[
        date
      ][id];

    }
  );


  workerSelect.value =
    "";


  saveData();

  render();

};


/* =========================
   ADD WORKER BUTTON
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
  function(event) {

    if (
      event.target === modal
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


  if (
    !data.attendance[date]
  ) {

    data.attendance[date] =
      {};

  }


  data.workers.forEach(
    worker => {

      const old =
        getSavedAttendance(
          worker.id,
          date
        );


      data.attendance[
        date
      ][worker.id] = {

        ...old,

        status:
          "Present"

      };

    }
  );


  saveData();

  render();

};


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
   CSV EXPORT
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

    "OT Amount"

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
            getSavedAttendance(
              worker.id,
              date
            );


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
            )
            *
            Number(
              worker.otRate || 0
            )

          ]);

        }
      );

    }
  );


  const csv =
    rows
      .map(
        row =>
          row
            .map(
              value =>
                `"${String(
                  value
                ).replaceAll(
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


  const link =
    document.createElement(
      "a"
    );


  link.href =
    URL.createObjectURL(
      blob
    );


  link.download =
    "CTD-Worker-Hajeri.csv";


  link.click();

};


/* =========================
   START
========================= */

render();
