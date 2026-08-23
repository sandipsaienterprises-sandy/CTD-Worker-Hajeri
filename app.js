/* =========================================================
   CTD WORKER HAJERI - STABLE VERSION
   ========================================================= */

const KEY = "ctd_worker_hajeri_final_v1";

/* ---------------------------------------------------------
   DEFAULT DATA
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   LOAD DATA
--------------------------------------------------------- */

let data = loadData();

function loadData() {

  try {

    const oldData =
      localStorage.getItem(KEY);

    if (oldData) {

      const parsed =
        JSON.parse(oldData);

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

    /* Old version migration */

    const oldKeys = [
      "ctd_worker_hajeri_v3",
      "ctd_worker_hajeri_v4"
    ];

    for (const oldKey of oldKeys) {

      const old =
        localStorage.getItem(oldKey);

      if (old) {

        const parsed =
          JSON.parse(old);

        if (parsed.workers) {

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

          return {
            workers: parsed.workers,
            attendance: parsed.attendance || {}
          };

        }

      }

    }

    return defaultData;

  } catch (error) {

    console.error(error);

    return defaultData;
  }

}

/* ---------------------------------------------------------
   SAVE
--------------------------------------------------------- */

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );

}

/* ---------------------------------------------------------
   ELEMENTS
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   TODAY
--------------------------------------------------------- */

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

  if (!dateInput.value) {
    dateInput.value = todayISO();
  }

}

/* ---------------------------------------------------------
   SELECTED DATE
--------------------------------------------------------- */

function selectedDate() {

  return dateInput.value || todayISO();

}

/* ---------------------------------------------------------
   DATE FORMAT
--------------------------------------------------------- */

function formatDate(iso) {

  if (!iso) return "";

  const parts =
    iso.split("-");

  return `${parts[2]}-${parts[1]}-${parts[0]}`;

}

/* ---------------------------------------------------------
   GET ATTENDANCE
   IMPORTANT:
   DO NOT CREATE ATTENDANCE HERE
--------------------------------------------------------- */

function getAttendance(
  workerId,
  date
) {

  if (
    data.attendance[date] &&
    data.attendance[date][workerId]
  ) {

    return data.attendance[date][workerId];

  }

  return null;

}

/* ---------------------------------------------------------
   CREATE ATTENDANCE ONLY WHEN SUBMIT
--------------------------------------------------------- */

function createAttendance(
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

  return data.attendance[date][workerId];

}

/* ---------------------------------------------------------
   IS SUBMITTED
--------------------------------------------------------- */

function isSubmitted(
  workerId,
  date
) {

  const a =
    getAttendance(workerId, date);

  return !!(
    a &&
    a.submitted === true
  );

}

/* ---------------------------------------------------------
   SEARCH WORKERS
--------------------------------------------------------- */

function filteredWorkers() {

  const q =
    (searchInput?.value || "")
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

/* ---------------------------------------------------------
   SEARCH DROPDOWN
--------------------------------------------------------- */

function createWorkerDropdown() {

  if (!searchInput) return;

  let box =
    document.getElementById(
      "workerDropdown"
    );

  if (!box) {

    box =
      document.createElement("div");

    box.id =
      "workerDropdown";

    box.style.position =
      "absolute";

    box.style.background =
      "#ffffff";

    box.style.border =
      "1px solid #ddd";

    box.style.borderRadius =
      "8px";

    box.style.boxShadow =
      "0 5px 15px rgba(0,0,0,.15)";

    box.style.zIndex =
      "9999";

    box.style.maxHeight =
      "250px";

    box.style.overflowY =
      "auto";

    box.style.display =
      "none";

    document.body.appendChild(box);

  }

  const rect =
    searchInput.getBoundingClientRect();

  box.style.left =
    `${rect.left + window.scrollX}px`;

  box.style.top =
    `${rect.bottom + window.scrollY + 4}px`;

  box.style.width =
    `${rect.width}px`;

  box.innerHTML = "";

  const q =
    searchInput.value
      .trim()
      .toLowerCase();

  const workers =
    data.workers.filter(w =>
      !q ||
      w.name
        .toLowerCase()
        .includes(q)
    );

  if (!workers.length) {

    box.innerHTML =
      `<div style="
        padding:12px;
        color:#777;
        text-align:center;
      ">
        No worker found
      </div>`;

  } else {

    workers.forEach(w => {

      const item =
        document.createElement("div");

      item.textContent =
        w.name;

      item.style.padding =
        "11px 14px";

      item.style.cursor =
        "pointer";

      item.style.borderBottom =
        "1px solid #eee";

      item.onmouseenter =
        () => {
          item.style.background =
            "#f3f6ff";
        };

      item.onmouseleave =
        () => {
          item.style.background =
            "#fff";
        };

      item.onclick =
        () => {

          searchInput.value =
            w.name;

          box.style.display =
            "none";

          render();

        };

      box.appendChild(item);

    });

  }

  box.style.display =
    "block";

}

/* ---------------------------------------------------------
   HIDE DROPDOWN
--------------------------------------------------------- */

function hideWorkerDropdown() {

  const box =
    document.getElementById(
      "workerDropdown"
    );

  if (box) {

    box.style.display =
      "none";

  }

}

/* ---------------------------------------------------------
   ATTENDANCE DATES
--------------------------------------------------------- */

function renderAttendanceDates() {

  let section =
    document.getElementById(
      "attendanceDates"
    );

  if (!section) {

    section =
      document.createElement("section");

    section.id =
      "attendanceDates";

    section.className =
      "card";

    const container =
      document.querySelector(
        ".container"
      );

    if (container) {

      container.insertBefore(
        section,
        container.children[1]
      );

    }

  }

  const dates =
    Object.keys(data.attendance)
      .filter(date => {

        const day =
          data.attendance[date];

        return Object.values(day)
          .some(a =>
            a &&
            a.submitted === true
          );

      })
      .sort();

  section.innerHTML = `

    <div class="section-title">

      <div>

        <h2>Attendance Dates</h2>

        <p>
          Green dates = attendance submitted
        </p>

      </div>

    </div>

    <div style="
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      padding-top:10px;
    ">

      ${
        dates.length
        ?
        dates.map(date => `

          <button
            type="button"
            onclick="goToDate('${date}')"
            style="
              background:#22c55e;
              color:white;
              border:none;
              border-radius:7px;
              padding:8px 12px;
              cursor:pointer;
              font-weight:600;
            "
          >
            ${formatDate(date)}
          </button>

        `).join("")
        :
        `
        <span style="
          color:#777;
          padding:8px 0;
        ">
          No attendance submitted yet.
        </span>
        `
      }

    </div>
  `;

}

/* ---------------------------------------------------------
   GO TO DATE
--------------------------------------------------------- */

window.goToDate =
function(date) {

  dateInput.value =
    date;

  hideWorkerDropdown();

  render();

};

/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

function render() {

  if (!dateInput) return;

  const date =
    selectedDate();

  const workers =
    filteredWorkers();

  const label =
    document.getElementById(
      "selectedDateLabel"
    );

  if (label) {

    label.textContent =
      formatDate(date);

  }

  let present = 0;
  let absent = 0;
  let half = 0;

  /*
    ONLY SUBMITTED ATTENDANCE
    IS COUNTED
  */

  data.workers.forEach(w => {

    const a =
      getAttendance(
        w.id,
        date
      );

    if (
      a &&
      a.submitted === true
    ) {

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

    }

  });

  const total =
    document.getElementById(
      "totalCount"
    );

  if (total) {

    total.textContent =
      data.workers.length;

  }

  const pc =
    document.getElementById(
      "presentCount"
    );

  if (pc) {

    pc.textContent =
      present;

  }

  const ac =
    document.getElementById(
      "absentCount"
    );

  if (ac) {

    ac.textContent =
      absent;

  }

  const hc =
    document.getElementById(
      "halfCount"
    );

  if (hc) {

    hc.textContent =
      half;

  }

  /* -------------------------------------------------------
     DAILY TABLE
  ------------------------------------------------------- */

  if (workerTable) {

    workerTable.innerHTML =
      workers.map((w, i) => {

        const a =
          getAttendance(
            w.id,
            date
          );

        const submitted =
          !!(
            a &&
            a.submitted === true
          );

        const status =
          a?.status || "Present";

        const ot =
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
              ₹${Number(
                w.rate || 0
              ).toLocaleString("en-IN")}
            </td>

            <td>

              <select
                class="status-select"
                ${
                  submitted
                  ? "disabled"
                  : ""
                }
                onchange="
                  changeDraftStatus(
                    '${w.id}',
                    this.value
                  )
                "
              >

                <option
                  value="Present"
                  ${
                    status === "Present"
                    ? "selected"
                    : ""
                  }
                >
                  Present
                </option>

                <option
                  value="Absent"
                  ${
                    status === "Absent"
                    ? "selected"
                    : ""
                  }
                >
                  Absent
                </option>

                <option
                  value="Half Day"
                  ${
                    status === "Half Day"
                    ? "selected"
                    : ""
                  }
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
                value="${ot}"
                ${
                  submitted
                  ? "disabled"
                  : ""
                }
                onchange="
                  changeDraftOT(
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
                value="${advance}"
                ${
                  submitted
                  ? "disabled"
                  : ""
                }
                onchange="
                  changeDraftAdvance(
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
                  class="secondary"
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

  }

  const empty =
    document.getElementById(
      "emptyState"
    );

  if (empty) {

    empty.style.display =
      workers.length
      ? "none"
      : "block";

  }

  renderMonthly();

  renderAttendanceDates();

}

/* ---------------------------------------------------------
   DRAFT STATUS
--------------------------------------------------------- */

window.changeDraftStatus =
function(id, value) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.status =
    value;

  saveData();

};

/* ---------------------------------------------------------
   DRAFT OT
--------------------------------------------------------- */

window.changeDraftOT =
function(id, value) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.otHours =
    Number(value || 0);

  saveData();

};

/* ---------------------------------------------------------
   DRAFT ADVANCE
--------------------------------------------------------- */

window.changeDraftAdvance =
function(id, value) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.advance =
    Number(value || 0);

  saveData();

};

/* ---------------------------------------------------------
   SUBMIT ATTENDANCE
--------------------------------------------------------- */

window.submitAttendance =
function(id) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.submitted =
    true;

  saveData();

  render();

};

/* ---------------------------------------------------------
   EDIT ATTENDANCE
--------------------------------------------------------- */

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

  a.submitted =
    false;

  saveData();

  render();

};

/* ---------------------------------------------------------
   MARK ALL PRESENT
--------------------------------------------------------- */

const allPresentBtn =
  document.getElementById(
    "allPresentBtn"
  );

if (allPresentBtn) {

  allPresentBtn.onclick =
  function() {

    const date =
      selectedDate();

    data.workers.forEach(w => {

      const a =
        createAttendance(
          w.id,
          date
        );

      a.status =
        "Present";

      /*
        Mark All Present
        does NOT submit automatically
      */

    });

    saveData();

    render();

  };

}

/* ---------------------------------------------------------
   MONTHLY SUMMARY
--------------------------------------------------------- */

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

      let payment =
        "Pending";

      /*
        ONLY SUBMITTED DAYS
      */

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
          getAttendance(
            w.id,
            iso
          );

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

          payment =
            "Paid";

        }

      }

      const payableDays =
        present +
        (half * 0.5);

      const dailyRate =
        Number(
          w.rate || 0
        );

      const grossSalary =
        payableDays *
        dailyRate;

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
                ${
                  payment !== "Paid"
                  ? "selected"
                  : ""
                }
              >
                Pending
              </option>

              <option
                value="Paid"
                ${
                  payment === "Paid"
                  ? "selected"
                  : ""
                }
              >
                Paid
              </option>

            </select>

          </td>

        </tr>

      `;

    }).join("");

}

/* ---------------------------------------------------------
   MONTHLY PAYMENT
--------------------------------------------------------- */

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
      `${year}-${String(month)
        .padStart(2, "0")}-${String(d)
        .padStart(2, "0")}`;

    const a =
      getAttendance(
        id,
        iso
      );

    /*
      Only submitted attendance
    */

    if (
      a &&
      a.submitted === true
    ) {

      a.payment =
        value;

    }

  }

  saveData();

  renderMonthly();

};

/* ---------------------------------------------------------
   ADD / EDIT WORKER
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   OPEN EDIT WORKER
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   SAVE WORKER
--------------------------------------------------------- */

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
            workerOTRate
            ? workerOTRate.value || 0
            : 0
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
            workerOTRate
            ? workerOTRate.value || 0
            : 0
          ),

        phone:
          workerPhone.value.trim()

      });

    }

    saveData();

    closeModal();

    render();

  };

}

/* ---------------------------------------------------------
   DELETE WORKER
--------------------------------------------------------- */

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

      delete data.attendance[date][id];

    }

  });

  saveData();

  render();

};

/* ---------------------------------------------------------
   MODAL CLOSE
--------------------------------------------------------- */

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
    e => {

      if (
        e.target === modal
      ) {

        closeModal();

      }

    }
  );

}

/* ---------------------------------------------------------
   DATE CHANGE
--------------------------------------------------------- */

if (dateInput) {

  dateInput.onchange =
  function() {

    hideWorkerDropdown();

    render();

  };

}

/* ---------------------------------------------------------
   SEARCH
--------------------------------------------------------- */

if (searchInput) {

  searchInput.oninput =
  function() {

    createWorkerDropdown();

    render();

  };

  searchInput.onfocus =
  function() {

    createWorkerDropdown();

  };

}

/* ---------------------------------------------------------
   SHOW ALL BUTTON
--------------------------------------------------------- */

let showAllBtn =
  document.getElementById(
    "showAllBtn"
  );

if (!showAllBtn) {

  showAllBtn =
    document.createElement(
      "button"
    );

  showAllBtn.id =
    "showAllBtn";

  showAllBtn.textContent =
    "Show All";

  showAllBtn.className =
    "secondary";

  if (
    searchInput &&
    searchInput.parentElement
  ) {

    searchInput.parentElement
      .appendChild(
        showAllBtn
      );

  }

}

showAllBtn.onclick =
function() {

  if (searchInput) {

    searchInput.value =
      "";

  }

  hideWorkerDropdown();

  render();

};

/* ---------------------------------------------------------
   CLICK OUTSIDE DROPDOWN
--------------------------------------------------------- */

document.addEventListener(
  "click",
  function(e) {

    const box =
      document.getElementById(
        "workerDropdown"
      );

    if (!box) return;

    if (
      e.target !== searchInput &&
      !box.contains(e.target)
    ) {

      hideWorkerDropdown();

    }

  }
);

/* ---------------------------------------------------------
   PRINT
--------------------------------------------------------- */

const printBtn =
  document.getElementById(
    "printBtn"
  );

if (printBtn) {

  printBtn.onclick =
    () => window.print();

}

/* ---------------------------------------------------------
   EXPORT CSV
--------------------------------------------------------- */

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

    dates.forEach(date => {

      data.workers.forEach(w => {

        const a =
          getAttendance(
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

          a.otHours || 0,

          a.advance || 0,

          w.otRate || 0,

          Number(
            a.otHours || 0
          ) *
          Number(
            w.otRate || 0
          ),

          a.payment ||
            "Pending"

        ]);

      });

    });

    const csv =
      rows
        .map(row =>
          row.map(value =>
            `"${String(value)
              .replaceAll(
                '"',
                '""'
              )}"`
          ).join(",")
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

/* ---------------------------------------------------------
   ESCAPE HTML
--------------------------------------------------------- */

function esc(value) {

  return String(value)
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

/* ---------------------------------------------------------
   INITIAL RENDER
--------------------------------------------------------- */

render();
