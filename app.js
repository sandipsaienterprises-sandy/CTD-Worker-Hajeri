const KEY = "ctd_worker_hajeri_v4";

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

dateInput.value = dateInput.value || todayISO();


// ======================================================
// LOAD / SAVE DATA
// ======================================================

function loadData() {
  try {
    const saved = localStorage.getItem(KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed.workers)) {
      parsed.workers = [];
    }

    if (!parsed.attendance || typeof parsed.attendance !== "object") {
      parsed.attendance = {};
    }

    parsed.workers = parsed.workers.map(w => ({
      id: w.id || crypto.randomUUID(),
      name: String(w.name || "").trim(),
      rate: Number(w.rate || 0),
      otRate: Number(w.otRate || 0),
      phone: String(w.phone || "")
    }));

    return parsed;

  } catch (error) {
    console.error("Load error:", error);
    return structuredClone(defaultData);
  }
}


function saveData() {
  localStorage.setItem(KEY, JSON.stringify(data));
}


// ======================================================
// DATE
// ======================================================

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}


function selectedDate() {
  return dateInput.value || todayISO();
}


function formatDate(iso) {

  if (!iso) return "";

  const parts = iso.split("-");

  if (parts.length !== 3) return iso;

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


// ======================================================
// ATTENDANCE
// IMPORTANT: THIS DOES NOT CREATE ATTENDANCE
// ======================================================

function getSavedAttendance(workerId, date) {

  if (
    !data.attendance[date] ||
    !data.attendance[date][workerId]
  ) {
    return null;
  }

  return data.attendance[date][workerId];
}


function createAttendance(workerId, date) {

  if (!data.attendance[date]) {
    data.attendance[date] = {};
  }

  if (!data.attendance[date][workerId]) {

    data.attendance[date][workerId] = {
      status: "Present",
      otHours: 0,
      advance: 0,
      payment: "Pending",
      submitted: true
    };
  }

  return data.attendance[date][workerId];
}


// ======================================================
// SEARCH
// ======================================================

function filteredWorkers() {

  const q = String(searchInput.value || "")
    .trim()
    .toLowerCase();

  if (!q) {
    return data.workers;
  }

  return data.workers.filter(w =>
    w.name.toLowerCase().includes(q)
  );
}


// ======================================================
// WORKER DROPDOWN
// ======================================================

function setupWorkerDropdown() {

  if (!searchInput) return;

  let box = document.getElementById("workerDropdownBox");

  if (!box) {

    box = document.createElement("div");

    box.id = "workerDropdownBox";

    box.style.position = "absolute";
    box.style.background = "#ffffff";
    box.style.border = "1px solid #ccc";
    box.style.borderRadius = "8px";
    box.style.boxShadow = "0 5px 15px rgba(0,0,0,.15)";
    box.style.zIndex = "99999";
    box.style.maxHeight = "240px";
    box.style.overflowY = "auto";
    box.style.display = "none";

    document.body.appendChild(box);
  }


  function positionBox() {

    const rect =
      searchInput.getBoundingClientRect();

    box.style.left =
      rect.left + window.scrollX + "px";

    box.style.top =
      rect.bottom + window.scrollY + "px";

    box.style.width =
      rect.width + "px";
  }


  function renderDropdown() {

    const q =
      String(searchInput.value || "")
        .trim()
        .toLowerCase();

    const workers =
      data.workers.filter(w =>
        !q ||
        w.name.toLowerCase().includes(q)
      );

    box.innerHTML = "";

    if (!workers.length) {

      box.innerHTML = `
        <div style="
          padding:12px;
          color:#777;
          text-align:center;
        ">
          No worker found
        </div>
      `;

      positionBox();

      box.style.display = "block";

      return;
    }


    workers.forEach(w => {

      const item =
        document.createElement("div");

      item.textContent = w.name;

      item.style.padding = "11px 14px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";
      item.style.fontWeight = "600";

      item.onmouseenter = function() {
        item.style.background = "#f0f7ff";
      };

      item.onmouseleave = function() {
        item.style.background = "#fff";
      };

      item.onclick = function() {

        searchInput.value = w.name;

        box.style.display = "none";

        render();
      };

      box.appendChild(item);
    });


    positionBox();

    box.style.display = "block";
  }


  searchInput.addEventListener(
    "focus",
    renderDropdown
  );

  searchInput.addEventListener(
    "input",
    function() {
      renderDropdown();
      render();
    }
  );


  document.addEventListener(
    "click",
    function(e) {

      if (
        e.target !== searchInput &&
        !box.contains(e.target)
      ) {
        box.style.display = "none";
      }

    }
  );


  window.addEventListener(
    "resize",
    positionBox
  );

  window.addEventListener(
    "scroll",
    positionBox
  );
}


// ======================================================
// RENDER MAIN
// ======================================================

function render() {

  const workers = filteredWorkers();

  const date = selectedDate();


  // Selected date
  const dateLabel =
    document.getElementById("selectedDateLabel");

  if (dateLabel) {
    dateLabel.textContent =
      formatDate(date);
  }


  // ====================================================
  // DAILY COUNTS
  // ONLY SAVED / SUBMITTED ATTENDANCE
  // ====================================================

  let present = 0;
  let absent = 0;
  let half = 0;

  data.workers.forEach(w => {

    const a =
      getSavedAttendance(w.id, date);

    if (!a) return;

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


  const totalCount =
    document.getElementById("totalCount");

  const presentCount =
    document.getElementById("presentCount");

  const absentCount =
    document.getElementById("absentCount");

  const halfCount =
    document.getElementById("halfCount");


  if (totalCount) {
    totalCount.textContent =
      data.workers.length;
  }

  if (presentCount) {
    presentCount.textContent =
      present;
  }

  if (absentCount) {
    absentCount.textContent =
      absent;
  }

  if (halfCount) {
    halfCount.textContent =
      half;
  }


  // ====================================================
  // DAILY TABLE
  // ====================================================

  workerTable.innerHTML =
    workers.map((w, i) => {

      const a =
        getSavedAttendance(w.id, date);

      const submitted =
        !!a && a.submitted === true;


      const status =
        a?.status || "Present";

      const otHours =
        a?.otHours || 0;

      const advance =
        a?.advance || 0;


      return `

        <tr>

          <td>${i + 1}</td>

          <td>
            <strong>
              ${esc(w.name)}
            </strong>
          </td>

          <td>
            ₹${Number(w.rate || 0)
              .toLocaleString("en-IN")}
          </td>


          <td>

            <select
              class="status-select"
              id="status-${w.id}"
              ${submitted ? "disabled" : ""}
              onchange="
                temporaryStatus(
                  '${w.id}',
                  this.value
                )
              "
            >

              <option
                value="Present"
                ${status === "Present" ? "selected" : ""}
              >
                Present
              </option>

              <option
                value="Absent"
                ${status === "Absent" ? "selected" : ""}
              >
                Absent
              </option>

              <option
                value="Half Day"
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
              value="${otHours}"
              id="ot-${w.id}"
              ${submitted ? "disabled" : ""}
            >

          </td>


          <td>

            <input
              class="small-input"
              type="number"
              min="0"
              step="1"
              value="${advance}"
              id="advance-${w.id}"
              ${submitted ? "disabled" : ""}
            >

          </td>


          <td class="attendance-action">

            ${
              submitted

              ?

              `
                <button
                  class="edit"
                  onclick="
                    editAttendance('${w.id}')
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
                    submitAttendance('${w.id}')
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
                openEdit('${w.id}')
              "
            >
              Edit
            </button>


            <button
              class="danger"
              onclick="
                deleteWorker('${w.id}')
              "
            >
              Delete
            </button>

          </td>

        </tr>

      `;

    }).join("");


  const emptyState =
    document.getElementById("emptyState");

  if (emptyState) {

    emptyState.style.display =
      workers.length
        ? "none"
        : "block";
  }


  renderAttendanceDates();

  renderMonthly();
}


// ======================================================
// TEMPORARY STATUS
// DOES NOT SAVE UNTIL SUBMIT
// ======================================================

window.temporaryStatus =
function(id, value) {

  const input =
    document.getElementById(
      `status-${id}`
    );

  if (input) {
    input.value = value;
  }

};


// ======================================================
// SUBMIT ATTENDANCE
// ======================================================

window.submitAttendance =
function(id) {

  const date =
    selectedDate();


  const statusElement =
    document.getElementById(
      `status-${id}`
    );

  const otElement =
    document.getElementById(
      `ot-${id}`
    );

  const advanceElement =
    document.getElementById(
      `advance-${id}`
    );


  const status =
    statusElement
      ? statusElement.value
      : "Present";


  const otHours =
    Number(
      otElement?.value || 0
    );


  const advance =
    Number(
      advanceElement?.value || 0
    );


  if (!data.attendance[date]) {
    data.attendance[date] = {};
  }


  data.attendance[date][id] = {

    status: status,

    otHours: otHours,

    advance: advance,

    payment:
      data.attendance[date][id]?.payment
      || "Pending",

    submitted: true

  };


  saveData();

  render();

};


// ======================================================
// EDIT ATTENDANCE
// ======================================================

window.editAttendance =
function(id) {

  const date =
    selectedDate();


  const a =
    getSavedAttendance(id, date);


  if (!a) return;


  const statusElement =
    document.getElementById(
      `status-${id}`
    );

  const otElement =
    document.getElementById(
      `ot-${id}`
    );

  const advanceElement =
    document.getElementById(
      `advance-${id}`
    );


  if (statusElement) {
    statusElement.disabled = false;
  }

  if (otElement) {
    otElement.disabled = false;
  }

  if (advanceElement) {
    advanceElement.disabled = false;
  }


  // Mark as not submitted temporarily
  a.submitted = false;

  saveData();

  render();
};


// ======================================================
// ALL PRESENT
// ======================================================

document.getElementById(
  "allPresentBtn"
).onclick = function() {

  const date =
    selectedDate();


  if (!data.workers.length) {
    return;
  }


  if (
    !confirm(
      "Mark all workers Present for this date?"
    )
  ) {
    return;
  }


  if (!data.attendance[date]) {
    data.attendance[date] = {};
  }


  data.workers.forEach(w => {

    data.attendance[date][w.id] = {

      status: "Present",

      otHours: 0,

      advance: 0,

      payment:
        data.attendance[date][w.id]?.payment
        || "Pending",

      submitted: true

    };

  });


  saveData();

  render();

};


// ======================================================
// MONTHLY SUMMARY
// ONLY SUBMITTED RECORDS
// ======================================================

function renderMonthly() {

  if (!monthlyTable) return;


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

      let paid =
        false;


      for (
        let d = 1;
        d <= daysInMonth;
        d++
      ) {

        const iso =
          `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


        const a =
          getSavedAttendance(
            w.id,
            iso
          );


        // VERY IMPORTANT
        // Ignore dates not submitted

        if (
          !a ||
          a.submitted !== true
        ) {
          continue;
        }


        if (a.status === "Present") {

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
          paid = true;
        }

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
            ₹${grossSalary
              .toLocaleString("en-IN")}
          </td>

          <td>
            ₹${advance
              .toLocaleString("en-IN")}
          </td>

          <td>
            <strong>
              ₹${netSalary
                .toLocaleString("en-IN")}
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
                ${!paid ? "selected" : ""}
              >
                Pending
              </option>

              <option
                value="Paid"
                ${paid ? "selected" : ""}
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
    let d = 1;
    d <= days;
    d++
  ) {

    const iso =
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


    const a =
      getSavedAttendance(
        id,
        iso
      );


    // Only submitted dates
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
// ATTENDANCE DATES
// GREEN = SUBMITTED
// ======================================================

function renderAttendanceDates() {

  const section =
    document.getElementById(
      "attendanceDates"
    );


  if (!section) return;


  const title =
    section.querySelector(
      ".attendance-dates-list"
    );


  let list =
    title;


  if (!list) {

    list =
      document.createElement("div");

    list.className =
      "attendance-dates-list";

    section.appendChild(list);

  }


  const dates =
    Object.keys(
      data.attendance
    )
    .filter(date => {

      return Object.values(
        data.attendance[date] || {}
      )
      .some(a =>
        a &&
        a.submitted === true
      );

    })
    .sort();


  if (!dates.length) {

    list.innerHTML = `
      <div style="
        color:#777;
        padding:10px 0;
      ">
        No attendance submitted yet.
      </div>
    `;

    return;
  }


  list.innerHTML = dates.map(date => {

    const selected =
      date === selectedDate();


    return `

      <button
        type="button"
        onclick="
          selectAttendanceDate('${date}')
        "
        style="
          margin:5px;
          padding:8px 12px;
          border-radius:8px;
          border:1px solid #35a853;
          background:#dff6df;
          color:#168329;
          font-weight:700;
          cursor:pointer;
          ${
            selected
              ? "box-shadow:0 0 0 2px #168329;"
              : ""
          }
        "
      >
        ✓ ${formatDate(date)}
      </button>

    `;

  }).join("");

}


// ======================================================
// SELECT ATTENDANCE DATE
// ======================================================

window.selectAttendanceDate =
function(date) {

  dateInput.value = date;

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};


// ======================================================
// SHOW ALL
// ======================================================

const showAllBtn =
  document.getElementById(
    "showAllBtn"
  );


if (showAllBtn) {

  showAllBtn.onclick =
    function() {

      searchInput.value = "";

      render();

      searchInput.focus();

    };

}


// ======================================================
// ADD WORKER
// ======================================================

document.getElementById(
  "addWorkerBtn"
).onclick = function() {

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


// ======================================================
// EDIT WORKER
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
// DELETE WORKER
// ======================================================

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

    const duplicate =
      data.workers.some(
        w =>
          w.name.toLowerCase() ===
          name.toLowerCase()
      );


    if (duplicate) {

      alert(
        "Worker name already exists."
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

  searchInput.value = "";

  render();

};


// ======================================================
// DATE CHANGE
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


// ======================================================
// EXPORT CSV
// ======================================================

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

            Number(a.otHours || 0) *
            Number(w.otRate || 0)

          ]);

        });

      });


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
        document.createElement("a");


      a.href =
        URL.createObjectURL(
          blob
        );


      a.download =
        "CTD-Worker-Hajeri.csv";


      a.click();

    };

}


// ======================================================
// START
// ======================================================

setupWorkerDropdown();

render();
