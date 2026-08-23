const KEY = "ctd_worker_hajeri_v5";

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


// ===============================
// LOAD DATA
// ===============================

function loadData() {

  try {

    // New storage
    const newSaved = localStorage.getItem(KEY);

    if (newSaved) {

      const parsed = JSON.parse(newSaved);

      parsed.workers = parsed.workers || [];
      parsed.attendance = parsed.attendance || {};

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


    // Try old versions
    const oldKeys = [
      "ctd_worker_hajeri_v4",
      "ctd_worker_hajeri_v3",
      "ctd_worker_hajeri_v2"
    ];

    for (const oldKey of oldKeys) {

      const oldSaved = localStorage.getItem(oldKey);

      if (oldSaved) {

        const parsed = JSON.parse(oldSaved);

        parsed.workers = parsed.workers || [];
        parsed.attendance = parsed.attendance || {};

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

        localStorage.setItem(KEY, JSON.stringify(parsed));

        return parsed;
      }
    }


    return defaultData;

  } catch (error) {

    console.error("Load error:", error);

    return defaultData;
  }
}


// ===============================
// SAVE DATA
// ===============================

function saveData() {

  try {

    localStorage.setItem(
      KEY,
      JSON.stringify(data)
    );

  } catch (error) {

    console.error("Save error:", error);

    alert("Data save होत नाही. Browser storage check करा.");

  }
}


// ===============================
// DATE
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


if (dateInput) {
  dateInput.value = todayISO();
}


function selectedDate() {

  return dateInput?.value || todayISO();

}


function formatDate(iso) {

  const parts = iso.split("-");

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


// ===============================
// ESCAPE HTML
// ===============================

function esc(value) {

  return String(value)
    .replace(/[&<>"']/g, function(c) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];

    });

}


// ===============================
// ATTENDANCE READ
// IMPORTANT:
// render करताना नवीन attendance तयार करायची नाही
// ===============================

function readAttendance(workerId, date) {

  if (
    data.attendance &&
    data.attendance[date] &&
    data.attendance[date][workerId]
  ) {

    const a = data.attendance[date][workerId];

    return {
      status: a.status || "Present",
      otHours: Number(a.otHours || 0),
      advance: Number(a.advance || 0),
      payment: a.payment || "Pending",
      submitted: a.submitted === true
    };

  }


  // No attendance entered yet
  return {
    status: "",
    otHours: 0,
    advance: 0,
    payment: "Pending",
    submitted: false
  };

}


// ===============================
// ATTENDANCE CREATE / SAVE
// ===============================

function saveAttendance(workerId, values, date = selectedDate()) {

  if (!data.attendance[date]) {

    data.attendance[date] = {};

  }


  const old = readAttendance(workerId, date);


  data.attendance[date][workerId] = {

    status: values.status !== undefined
      ? values.status
      : old.status,

    otHours: values.otHours !== undefined
      ? Number(values.otHours || 0)
      : old.otHours,

    advance: values.advance !== undefined
      ? Number(values.advance || 0)
      : old.advance,

    payment: values.payment !== undefined
      ? values.payment
      : old.payment,

    submitted: values.submitted !== undefined
      ? values.submitted
      : old.submitted

  };


  saveData();

  render();

}


// ===============================
// WORKER SEARCH DROPDOWN
// ===============================

function setupWorkerDropdown() {

  if (!searchInput) return;


  let list = document.getElementById("workerNamesList");


  if (!list) {

    list = document.createElement("datalist");

    list.id = "workerNamesList";

    document.body.appendChild(list);

  }


  searchInput.setAttribute(
    "list",
    "workerNamesList"
  );

  searchInput.placeholder =
    "Select or search worker name";


  list.innerHTML = data.workers
    .map(w => `
      <option value="${esc(w.name)}"></option>
    `)
    .join("");

}


// ===============================
// FILTER
// ===============================

function filteredWorkers() {

  if (!searchInput) {

    return data.workers;

  }


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


// ===============================
// RENDER
// ===============================

function render() {

  setupWorkerDropdown();


  const workers =
    filteredWorkers();


  const date =
    selectedDate();


  const label =
    document.getElementById(
      "selectedDateLabel"
    );


  if (label) {

    label.textContent =
      formatDate(date);

  }


  // ============================
  // STATS
  // ============================

  let present = 0;
  let absent = 0;
  let half = 0;


  data.workers.forEach(w => {

    const a =
      readAttendance(
        w.id,
        date
      );


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


  const totalCount =
    document.getElementById(
      "totalCount"
    );

  const presentCount =
    document.getElementById(
      "presentCount"
    );

  const absentCount =
    document.getElementById(
      "absentCount"
    );

  const halfCount =
    document.getElementById(
      "halfCount"
    );


  if (totalCount)
    totalCount.textContent =
      data.workers.length;

  if (presentCount)
    presentCount.textContent =
      present;

  if (absentCount)
    absentCount.textContent =
      absent;

  if (halfCount)
    halfCount.textContent =
      half;


  // ============================
  // DAILY TABLE
  // ============================

  if (!workerTable) return;


  workerTable.innerHTML =
    workers.map((w, index) => {

      const a =
        readAttendance(
          w.id,
          date
        );


      const isSubmitted =
        a.submitted;


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
            class="status-select"
            ${isSubmitted ? "disabled" : ""}
            onchange="
              changeStatus(
                '${w.id}',
                this.value
              )
            "
          >

            <option value="">
              Select
            </option>

            <option value="Present"
              ${a.status === "Present" ? "selected" : ""}>
              Present
            </option>

            <option value="Absent"
              ${a.status === "Absent" ? "selected" : ""}>
              Absent
            </option>

            <option value="Half Day"
              ${a.status === "Half Day" ? "selected" : ""}>
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
            ${isSubmitted ? "disabled" : ""}
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
            value="${a.advance}"
            ${isSubmitted ? "disabled" : ""}
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
            isSubmitted
            ?

            `
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

            :

            `
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


// ===============================
// SUBMIT ATTENDANCE
// ===============================

window.submitAttendance =
function(id) {

  const date =
    selectedDate();


  const a =
    readAttendance(
      id,
      date
    );


  if (!a.status) {

    alert(
      "कृपया Present / Absent / Half Day select करा."
    );

    return;

  }


  saveAttendance(
    id,
    {
      ...a,
      submitted: true
    },
    date
  );

};


// ===============================
// EDIT ATTENDANCE
// ===============================

window.editAttendance =
function(id) {

  const date =
    selectedDate();


  const a =
    readAttendance(
      id,
      date
    );


  saveAttendance(
    id,
    {
      ...a,
      submitted: false
    },
    date
  );

};


// ===============================
// STATUS
// ===============================

window.changeStatus =
function(id, status) {

  saveAttendance(
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

  saveAttendance(
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

  saveAttendance(
    id,
    {
      advance:
        Number(value || 0)
    }
  );

};


// ===============================
// MONTHLY SUMMARY
// ===============================

function renderMonthly() {

  if (!monthlyTable) return;


  const selected =
    selectedDate();


  const [year, month] =
    selected
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


      // IMPORTANT:
      // Only saved attendance dates count.
      // Future/unfilled dates do NOT count.


      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const a =
          readAttendance(
            w.id,
            iso
          );


        // Empty = no attendance entered
        if (!a.status) {

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
        (half * 0.5);


      const dailyRate =
        Number(
          w.rate || 0
        );


      const otRate =
        Number(
          w.otRate || 0
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


      // Find payment status
      let payment =
        "Pending";


      // Check saved payment
      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        if (
          data.attendance[iso] &&
          data.attendance[iso][w.id] &&
          data.attendance[iso][w.id].payment
        ) {

          payment =
            data.attendance[iso][w.id].payment;

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

              <option value="Pending"
                ${payment === "Pending" ? "selected" : ""}>
                Pending
              </option>

              <option value="Paid"
                ${payment === "Paid" ? "selected" : ""}>
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
    let day = 1;
    day <= days;
    day++
  ) {

    const iso =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    // IMPORTANT:
    // Payment should be saved only
    // where attendance already exists.

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
// ADD / EDIT WORKER
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


const addWorkerBtn =
  document.getElementById(
    "addWorkerBtn"
  );


if (addWorkerBtn) {

  addWorkerBtn.onclick =
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

}


// ===============================
// SAVE WORKER
// ===============================

const saveWorkerBtn =
  document.getElementById(
    "saveWorkerBtn"
  );


if (saveWorkerBtn) {

  saveWorkerBtn.onclick =
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
        workerOTRate?.value || 0
      );


    const phone =
      workerPhone.value.trim();


    const id =
      editWorkerId.value;


    // EDIT EXISTING
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


    // ADD NEW
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


    saveData();

    setupWorkerDropdown();

    closeModal();

    render();

  };

}


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

  setupWorkerDropdown();

  render();

};


// ===============================
// MODAL
// ===============================

function closeModal() {

  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


const closeModalBtn =
  document.getElementById(
    "closeModal"
  );


if (closeModalBtn) {

  closeModalBtn.onclick =
    closeModal;

}


const cancelBtn =
  document.getElementById(
    "cancelBtn"
  );


if (cancelBtn) {

  cancelBtn.onclick =
    closeModal;

}


if (modal) {

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

}


// ===============================
// MARK ALL PRESENT
// ===============================

const allPresentBtn =
  document.getElementById(
    "allPresentBtn"
  );


if (allPresentBtn) {

  allPresentBtn.onclick =
  function() {

    if (
      !data.workers.length
    ) {

      return;

    }


    const date =
      selectedDate();


    if (!data.attendance[date]) {

      data.attendance[date] =
        {};

    }


    data.workers.forEach(
      w => {

        const old =
          readAttendance(
            w.id,
            date
          );


        data.attendance[date][w.id] = {

          status:
            "Present",

          otHours:
            old.otHours,

          advance:
            old.advance,

          payment:
            old.payment,

          submitted:
            false

        };

      }
    );


    saveData();

    render();

  };

}


// ===============================
// DATE CHANGE
// ===============================

if (dateInput) {

  dateInput.onchange =
    function() {

      render();

    };

}


// ===============================
// SEARCH CHANGE
// ===============================

if (searchInput) {

  searchInput.oninput =
    function() {

      render();

    };


  searchInput.onchange =
    function() {

      render();

    };

}


// ===============================
// PRINT
// ===============================

const printBtn =
  document.getElementById(
    "printBtn"
  );


if (printBtn) {

  printBtn.onclick =
    function() {

      window.print();

    };

}


// ===============================
// EXPORT CSV
// ===============================

const exportBtn =
  document.getElementById(
    "exportBtn"
  );


if (exportBtn) {

  exportBtn.onclick =
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
      "Payment"

    ]];


    const dates =
      Object.keys(
        data.attendance
      ).sort();


    dates.forEach(
      date => {

        data.workers.forEach(
          w => {

            if (
              !data.attendance[date] ||
              !data.attendance[date][w.id]
            ) {

              return;

            }


            const a =
              readAttendance(
                w.id,
                date
              );


            if (!a.status) {

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

              a.payment

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

}


// ===============================
// START APP
// ===============================

setupWorkerDropdown();

render();
