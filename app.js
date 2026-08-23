const KEY = "ctd_worker_hajeri_v3";

/* ======================================================
   DEFAULT DATA
====================================================== */

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


/* ======================================================
   ELEMENTS
====================================================== */

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


/* ======================================================
   DATE
====================================================== */

if (dateInput) {
  dateInput.value = todayISO();
}


/* ======================================================
   LOAD DATA
====================================================== */

function loadData() {

  try {

    const saved =
      localStorage.getItem(KEY);

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

  } catch (error) {

    console.error(error);

    return defaultData;
  }
}


/* ======================================================
   SAVE DATA
====================================================== */

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );
}


/* ======================================================
   TODAY
====================================================== */

function todayISO() {

  const d =
    new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}


/* ======================================================
   SELECTED DATE
====================================================== */

function selectedDate() {

  return (
    dateInput?.value ||
    todayISO()
  );
}


/* ======================================================
   GET ATTENDANCE
====================================================== */

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


/* ======================================================
   CREATE ATTENDANCE
====================================================== */

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


/* ======================================================
   FILTER WORKERS
====================================================== */

function filteredWorkers() {

  const q =
    searchInput?.value
      ?.trim()
      .toLowerCase() || "";

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


/* ======================================================
   MAIN RENDER
====================================================== */

function render() {

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


  /* ----------------------------------------------------
     DAILY COUNTS
  ---------------------------------------------------- */

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
      !a ||
      a.submitted !== true
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

  });


  setText(
    "totalCount",
    data.workers.length
  );

  setText(
    "presentCount",
    present
  );

  setText(
    "absentCount",
    absent
  );

  setText(
    "halfCount",
    half
  );


  /* ----------------------------------------------------
     DAILY TABLE
  ---------------------------------------------------- */

  if (!workerTable) {
    return;
  }

  workerTable.innerHTML =
    workers.map(
      (w, i) => {

        const a =
          getAttendance(
            w.id,
            date
          );

        const status =
          a?.status ||
          "Present";

        const ot =
          a?.otHours ||
          0;

        const advance =
          a?.advance ||
          0;

        const submitted =
          a?.submitted === true;


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
              value="${advance}"
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

      }
    ).join("");


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

  updateWorkerDropdown();

  updateAttendanceDates();

}


/* ======================================================
   SUBMIT ATTENDANCE
====================================================== */

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      workerId,
      date
    );

  a.submitted = true;

  saveData();

  render();

};


/* ======================================================
   EDIT ATTENDANCE
====================================================== */

window.editAttendance =
function(workerId) {

  const date =
    selectedDate();

  const a =
    getAttendance(
      workerId,
      date
    );

  if (!a) {
    return;
  }

  a.submitted = false;

  saveData();

  render();

};


/* ======================================================
   STATUS
====================================================== */

window.changeStatus =
function(
  id,
  status
) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.status =
    status;

  saveData();

  render();

};


/* ======================================================
   OT
====================================================== */

window.changeOT =
function(
  id,
  value
) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.otHours =
    Number(
      value || 0
    );

  saveData();

  render();

};


/* ======================================================
   ADVANCE
====================================================== */

window.changeAdvance =
function(
  id,
  value
) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      id,
      date
    );

  a.advance =
    Number(
      value || 0
    );

  saveData();

  render();

};


/* ======================================================
   MONTHLY DATE FILTER
====================================================== */

function ensureMonthlyDateFilter() {

  if (!monthlyTable) {
    return;
  }


  let filter =
    document.getElementById(
      "monthlyDateFilter"
    );


  if (!filter) {

    const card =
      monthlyTable.closest(
        ".card"
      );

    if (!card) {
      return;
    }


    const title =
      card.querySelector(
        ".section-title"
      );


    filter =
      document.createElement(
        "div"
      );

    filter.id =
      "monthlyDateFilter";

    filter.className =
      "monthly-date-filter";


    filter.innerHTML = `

      <div>
        <label>From Date</label>

        <input
          type="date"
          id="monthlyFromDate"
        >
      </div>


      <div>
        <label>To Date</label>

        <input
          type="date"
          id="monthlyToDate"
        >
      </div>


      <button
        id="generateMonthlyBtn"
        class="primary"
        type="button"
      >
        Generate Report
      </button>

    `;


    if (title) {

      title.appendChild(
        filter
      );

    }

    else {

      card.insertBefore(
        filter,
        monthlyTable.parentElement
      );

    }


    const from =
      document.getElementById(
        "monthlyFromDate"
      );

    const to =
      document.getElementById(
        "monthlyToDate"
      );

    const generate =
      document.getElementById(
        "generateMonthlyBtn"
      );


    generate?.addEventListener(
      "click",
      function() {

        if (
          !from.value ||
          !to.value
        ) {

          alert(
            "Please select From Date and To Date."
          );

          return;

        }


        if (
          from.value >
          to.value
        ) {

          alert(
            "From Date cannot be greater than To Date."
          );

          return;

        }


        renderMonthly();

      }
    );


    from?.addEventListener(
      "change",
      renderMonthly
    );


    to?.addEventListener(
      "change",
      renderMonthly
    );

  }


  const from =
    document.getElementById(
      "monthlyFromDate"
    );

  const to =
    document.getElementById(
      "monthlyToDate"
    );


  if (!from || !to) {
    return;
  }


  if (
    !from.value ||
    !to.value
  ) {

    const [
      year,
      month
    ] =
      selectedDate()
        .split("-")
        .map(Number);


    const first =
      `${year}-${String(month).padStart(2, "0")}-01`;


    const lastDay =
      new Date(
        year,
        month,
        0
      ).getDate();


    const last =
      `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;


    from.value =
      first;

    to.value =
      last;

  }

}


/* ======================================================
   MONTHLY SUMMARY
   DATE RANGE
====================================================== */

function renderMonthly() {

  if (!monthlyTable) {
    return;
  }


  ensureMonthlyDateFilter();


  const fromInput =
    document.getElementById(
      "monthlyFromDate"
    );

  const toInput =
    document.getElementById(
      "monthlyToDate"
    );


  const fromDate =
    fromInput?.value ||
    "";

  const toDate =
    toInput?.value ||
    "";


  if (
    !fromDate ||
    !toDate
  ) {

    return;

  }


  if (
    fromDate >
    toDate
  ) {

    monthlyTable.innerHTML = `

      <tr>

        <td
          colspan="10"
          style="
            text-align:center;
            color:#dc3545;
            font-weight:700;
            padding:20px;
          "
        >
          From Date cannot be greater than To Date.
        </td>

      </tr>

    `;

    return;

  }


  monthlyTable.innerHTML =
    data.workers.map(
      w => {

        let present = 0;
        let half = 0;
        let absent = 0;
        let otHours = 0;
        let advance = 0;

        let paid =
          "Pending";


        let current =
          new Date(
            fromDate +
            "T00:00:00"
          );


        const end =
          new Date(
            toDate +
            "T00:00:00"
          );


        while (
          current <= end
        ) {

          const iso =
            current
              .toISOString()
              .slice(0, 10);


          const a =
            getAttendance(
              w.id,
              iso
            );


          /* ONLY SUBMITTED */

          if (
            a &&
            a.submitted === true
          ) {

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


            if (a.payment) {

              paid =
                a.payment;

            }

          }


          current.setDate(
            current.getDate() + 1
          );

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

                <option
                  value="Pending"
                  ${
                    paid === "Pending"
                      ? "selected"
                      : ""
                  }
                >
                  Pending
                </option>


                <option
                  value="Paid"
                  ${
                    paid === "Paid"
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

      }
    ).join("");

}


/* ======================================================
   MONTHLY PAYMENT
   SAME DATE RANGE
====================================================== */

window.changeMonthlyPayment =
function(
  id,
  value
) {

  const fromInput =
    document.getElementById(
      "monthlyFromDate"
    );

  const toInput =
    document.getElementById(
      "monthlyToDate"
    );


  const fromDate =
    fromInput?.value ||
    "";

  const toDate =
    toInput?.value ||
    "";


  if (
    !fromDate ||
    !toDate ||
    fromDate > toDate
  ) {

    return;

  }


  let current =
    new Date(
      fromDate +
      "T00:00:00"
    );


  const end =
    new Date(
      toDate +
      "T00:00:00"
    );


  while (
    current <= end
  ) {

    const iso =
      current
        .toISOString()
        .slice(0, 10);


    const a =
      getAttendance(
        id,
        iso
      );


    if (
      a &&
      a.submitted === true
    ) {

      a.payment =
        value;

    }


    current.setDate(
      current.getDate() + 1
    );

  }


  saveData();

  render();

};


/* ======================================================
   ADD WORKER
====================================================== */

document.getElementById(
  "addWorkerBtn"
)?.addEventListener(
  "click",
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

  }
);


/* ======================================================
   OPEN EDIT WORKER
====================================================== */

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


/* ======================================================
   DELETE WORKER
====================================================== */

window.deleteWorker =
function(id) {

  const w =
    data.workers.find(
      x => x.id === id
    );


  if (!w) {
    return;
  }


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
  ).forEach(
    date => {

      if (
        data.attendance[date]
      ) {

        delete data.attendance[
          date
        ][id];

      }

    }
  );


  saveData();

  render();

};


/* ======================================================
   CLOSE MODAL
====================================================== */

function closeModal() {

  modal.classList.add(
    "hidden"
  );

}


document.getElementById(
  "closeModal"
)?.addEventListener(
  "click",
  closeModal
);


document.getElementById(
  "cancelBtn"
)?.addEventListener(
  "click",
  closeModal
);


modal?.addEventListener(
  "click",
  function(e) {

    if (
      e.target === modal
    ) {

      closeModal();

    }

  }
);


/* ======================================================
   SAVE WORKER
====================================================== */

document.getElementById(
  "saveWorkerBtn"
)?.addEventListener(
  "click",
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

    render();

  }
);


/* ======================================================
   MARK ALL PRESENT
====================================================== */

document.getElementById(
  "allPresentBtn"
)?.addEventListener(
  "click",
  function() {

    const date =
      selectedDate();


    if (
      !data.workers.length
    ) {

      return;

    }


    data.workers.forEach(
      w => {

        const a =
          createAttendance(
            w.id,
            date
          );


        a.status =
          "Present";


        a.submitted =
          true;

      }
    );


    saveData();

    render();

  }
);


/* ======================================================
   SHOW ALL
====================================================== */

document.getElementById(
  "showAllBtn"
)?.addEventListener(
  "click",
  function() {

    if (searchInput) {

      searchInput.value =
        "";

    }


    render();

  }
);


/* ======================================================
   DATE CHANGE
====================================================== */

dateInput?.addEventListener(
  "change",
  function() {

    render();

  }
);


/* ======================================================
   SEARCH
====================================================== */

searchInput?.addEventListener(
  "input",
  function() {

    render();

  }
);


/* ======================================================
   WORKER DROPDOWN
====================================================== */

function updateWorkerDropdown() {

  if (!searchInput) {
    return;
  }


  let list =
    document.getElementById(
      "workerDropdown"
    );


  if (!list) {

    list =
      document.createElement(
        "div"
      );


    list.id =
      "workerDropdown";


    list.style.position =
      "absolute";


    list.style.left =
      "0";


    list.style.right =
      "0";


    list.style.top =
      "100%";


    list.style.background =
      "white";


    list.style.border =
      "1px solid #ddd";


    list.style.borderRadius =
      "8px";


    list.style.boxShadow =
      "0 5px 15px rgba(0,0,0,.15)";


    list.style.zIndex =
      "9999";


    list.style.maxHeight =
      "250px";


    list.style.overflowY =
      "auto";


    searchInput.parentElement.style.position =
      "relative";


    searchInput.parentElement.appendChild(
      list
    );

  }


  list.innerHTML =
    "";


  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const workers =
    data.workers.filter(
      worker =>
        !search ||
        worker.name
          .toLowerCase()
          .includes(search)
    );


  workers.forEach(
    worker => {

      const item =
        document.createElement(
          "div"
        );


      item.textContent =
        worker.name;


      item.style.padding =
        "10px 14px";


      item.style.cursor =
        "pointer";


      item.addEventListener(
        "mouseenter",
        function() {

          item.style.background =
            "#f0f0f0";

        }
      );


      item.addEventListener(
        "mouseleave",
        function() {

          item.style.background =
            "white";

        }
      );


      item.addEventListener(
        "click",
        function() {

          searchInput.value =
            worker.name;


          list.style.display =
            "none";


          render();

        }
      );


      list.appendChild(
        item
      );

    }
  );


  searchInput.onclick =
    function() {

      updateWorkerDropdown();

      list.style.display =
        "block";

    };


  searchInput.onfocus =
    function() {

      updateWorkerDropdown();

      list.style.display =
        "block";

    };

}


/* ======================================================
   CLOSE DROPDOWN
====================================================== */

document.addEventListener(
  "click",
  function(e) {

    const list =
      document.getElementById(
        "workerDropdown"
      );


    if (
      list &&
      !searchInput.contains(
        e.target
      ) &&
      !list.contains(
        e.target
      )
    ) {

      list.style.display =
        "none";

    }

  }
);


/* ======================================================
   ATTENDANCE DATES
   WORKER-WISE
====================================================== */

function updateAttendanceDates() {

  const box =
    document.getElementById(
      "submittedDates"
    ) ||
    document.getElementById(
      "attendanceDates"
    );


  if (!box) {
    return;
  }


  box.innerHTML =
    "";


  const workerText =
    String(
      searchInput?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  let selectedWorker =
    null;


  if (workerText) {

    selectedWorker =
      data.workers.find(
        w =>
          w.name
            .trim()
            .toLowerCase() ===
          workerText
      );

  }


  if (!selectedWorker) {

    box.innerHTML = `

      <span class="no-dates">

        Select a worker to see
        attendance dates.

      </span>

    `;

    return;

  }


  const submittedDates =
    Object.keys(
      data.attendance
    )
    .filter(
      date => {

        const a =
          getAttendance(
            selectedWorker.id,
            date
          );


        return (
          a &&
          a.submitted === true
        );

      }
    )
    .sort();


  if (
    !submittedDates.length
  ) {

    box.innerHTML = `

      <span class="no-dates">

        No attendance submitted for
        ${esc(selectedWorker.name)}.

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


      btn.textContent =
        "🟢 " +
        formatDate(date);


      btn.className =
        "date-chip";


      if (
        date === selectedDate()
      ) {

        btn.classList.add(
          "active"
        );

      }


      btn.onclick =
        function() {

          if (dateInput) {

            dateInput.value =
              date;

          }


          render();

        };


      box.appendChild(
        btn
      );

    }
  );

}


/* ======================================================
   PRINT
====================================================== */

document.getElementById(
  "printBtn"
)?.addEventListener(
  "click",
  function() {

    window.print();

  }
);


/* ======================================================
   EXPORT CSV
====================================================== */

document.getElementById(
  "exportBtn"
)?.addEventListener(
  "click",
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

          }
        );

      }
    );


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


    setTimeout(
      () =>
        URL.revokeObjectURL(
          a.href
        ),
      1000
    );

  }
);


/* ======================================================
   HELPERS
====================================================== */

function setText(
  id,
  value
) {

  const el =
    document.getElementById(
      id
    );


  if (el) {

    el.textContent =
      value;

  }

}


function formatDate(
  iso
) {

  if (!iso) {
    return "";
  }


  const [
    y,
    m,
    d
  ] =
    iso.split("-");


  return `${d}-${m}-${y}`;

}


function esc(s) {

  return String(s)
    .replace(
      /[&<>"']/g,
      c =>
        ({
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


/* ======================================================
   START APP
====================================================== */

render();
