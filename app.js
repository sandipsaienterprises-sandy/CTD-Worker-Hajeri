// ============================================================
// CTD WORKER HAJERI
// STABLE FINAL VERSION
// ============================================================

const KEY = "ctd_worker_hajeri_v3";

// ============================================================
// DEFAULT DATA
// ============================================================

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


// ============================================================
// LOAD DATA
// ============================================================

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

    if (
      !parsed.attendance ||
      typeof parsed.attendance !== "object"
    ) {
      parsed.attendance = {};
    }

    parsed.workers.forEach(worker => {

      if (worker.otRate === undefined) {
        worker.otRate = 0;
      }

      if (worker.phone === undefined) {
        worker.phone = "";
      }

      if (worker.rate === undefined) {
        worker.rate = 0;
      }

    });

    return parsed;

  } catch (error) {

    console.error(
      "Load data error:",
      error
    );

    return defaultData;
  }
}


// ============================================================
// SAVE DATA
// ============================================================

function saveData() {

  try {

    localStorage.setItem(
      KEY,
      JSON.stringify(data)
    );

  } catch (error) {

    console.error(
      "Save data error:",
      error
    );

    alert(
      "Data save failed."
    );
  }
}


// ============================================================
// ELEMENTS
// ============================================================

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


// ============================================================
// TODAY
// ============================================================

function todayISO() {

  const d = new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}


if (
  dateInput &&
  !dateInput.value
) {

  dateInput.value =
    todayISO();
}


// ============================================================
// SELECTED DATE
// ============================================================

function selectedDate() {

  return (
    dateInput?.value ||
    todayISO()
  );
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(iso) {

  if (!iso) return "";

  const parts =
    iso.split("-");

  if (parts.length !== 3) {
    return iso;
  }

  return (
    parts[2] +
    "-" +
    parts[1] +
    "-" +
    parts[0]
  );
}


// ============================================================
// ESCAPE HTML
// ============================================================

function esc(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
    );
}


// ============================================================
// SET TEXT
// ============================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value;
  }
}


// ============================================================
// GET ATTENDANCE
// IMPORTANT:
// DOES NOT CREATE RECORD
// ============================================================

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


// ============================================================
// CREATE ATTENDANCE
// ============================================================

function createAttendance(
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

  return data.attendance[date][workerId];
}


// ============================================================
// GET SELECTED WORKER
// ============================================================

function getSelectedWorker() {

  const text =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();

  if (!text) {
    return null;
  }

  return (
    data.workers.find(
      worker =>
        String(worker.name || "")
          .trim()
          .toLowerCase() === text
    ) || null
  );
}


// ============================================================
// FILTER WORKERS
// ============================================================

function filteredWorkers() {

  const q =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();

  if (!q) {
    return data.workers;
  }

  return data.workers.filter(
    worker =>
      String(worker.name || "")
        .toLowerCase()
        .includes(q)
  );
}


// ============================================================
// MAIN RENDER
// ============================================================

function render() {

  const date =
    selectedDate();

  const workers =
    filteredWorkers();

  // ----------------------------------------------------------
  // DATE LABEL
  // ----------------------------------------------------------

  setText(
    "selectedDateLabel",
    formatDate(date)
  );


  // ----------------------------------------------------------
  // DAILY STATS
  // ONLY SUBMITTED
  // ----------------------------------------------------------

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
        a.submitted !== true
      ) {
        return;
      }

      if (
        a.status === "Present"
      ) {
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
  );


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


  // ----------------------------------------------------------
  // DAILY TABLE
  // ----------------------------------------------------------

  if (workerTable) {

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
            a?.otHours ??
            0;

          const advance =
            a?.advance ??
            0;

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
                  id="status-${worker.id}"
                  class="status-select"
                  ${
                    submitted
                      ? "disabled"
                      : ""
                  }
                  onchange="
                    changeStatus(
                      '${worker.id}',
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
                  id="ot-${worker.id}"
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
                    changeOT(
                      '${worker.id}',
                      this.value
                    )
                  "
                >

              </td>


              <td>

                <input
                  id="advance-${worker.id}"
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
                    changeAdvance(
                      '${worker.id}',
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
                      class="submitted-btn"
                      onclick="
                        editAttendance(
                          '${worker.id}'
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
                          '${worker.id}'
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

  }


  // ----------------------------------------------------------
  // EMPTY STATE
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // MONTHLY
  // ----------------------------------------------------------

  renderMonthly();


  // ----------------------------------------------------------
  // WORKER DROPDOWN
  // ----------------------------------------------------------

  updateWorkerDropdown();


  // ----------------------------------------------------------
  // ATTENDANCE DATES
  // ----------------------------------------------------------

  updateAttendanceDates();


  // ----------------------------------------------------------
  // DATE STATUS
  // ----------------------------------------------------------

  updateDateStatus();


  // ----------------------------------------------------------
  // GREEN SELECTED DATE
  // ----------------------------------------------------------

  updateDateBoxColor();

}


// ============================================================
// SUBMIT ATTENDANCE
// ============================================================

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();

  const a =
    createAttendance(
      workerId,
      date
    );

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


  if (statusElement) {

    a.status =
      statusElement.value;

  }


  if (otElement) {

    a.otHours =
      Number(
        otElement.value || 0
      );

  }


  if (advanceElement) {

    a.advance =
      Number(
        advanceElement.value || 0
      );

  }


  a.payment =
    a.payment ||
    "Pending";


  a.submitted =
    true;


  saveData();

  render();

};


// ============================================================
// EDIT ATTENDANCE
// ============================================================

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


  a.submitted =
    false;


  saveData();

  render();

};


// ============================================================
// CHANGE STATUS
// ============================================================

window.changeStatus =
function(
  id,
  status
) {

  const a =
    createAttendance(
      id,
      selectedDate()
    );

  a.status =
    status;

  saveData();

};


// ============================================================
// CHANGE OT
// ============================================================

window.changeOT =
function(
  id,
  value
) {

  const a =
    createAttendance(
      id,
      selectedDate()
    );

  a.otHours =
    Number(value || 0);

  saveData();

};


// ============================================================
// CHANGE ADVANCE
// ============================================================

window.changeAdvance =
function(
  id,
  value
) {

  const a =
    createAttendance(
      id,
      selectedDate()
    );

  a.advance =
    Number(value || 0);

  saveData();

};


// ============================================================
// MONTHLY SALARY SUMMARY
// ONLY SUBMITTED ATTENDANCE
// ============================================================

function renderMonthly() {

  if (!monthlyTable) {
    return;
  }


  const parts =
    selectedDate()
      .split("-")
      .map(Number);

  const year =
    parts[0];

  const month =
    parts[1];


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

        let paid =
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


          // IMPORTANT
          // ONLY SUBMITTED RECORDS COUNT

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


          if (a.payment) {

            paid =
              a.payment;

          }

        }


        const payableDays =
          present +
          half * 0.5;


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
                class="payment-select"
                onchange="
                  changeMonthlyPayment(
                    '${worker.id}',
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


// ============================================================
// MONTHLY PAYMENT
// ============================================================

window.changeMonthlyPayment =
function(
  id,
  value
) {

  const parts =
    selectedDate()
      .split("-")
      .map(Number);

  const year =
    parts[0];

  const month =
    parts[1];


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

  }


  saveData();

  render();

};


// ============================================================
// ADD WORKER
// ============================================================

document
  .getElementById(
    "addWorkerBtn"
  )
  ?.addEventListener(
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


// ============================================================
// EDIT WORKER
// ============================================================

window.openEdit =
function(id) {

  const worker =
    data.workers.find(
      w => w.id === id
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


// ============================================================
// DELETE WORKER
// ============================================================

window.deleteWorker =
function(id) {

  const worker =
    data.workers.find(
      w => w.id === id
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
      w => w.id !== id
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


  if (searchInput) {
    searchInput.value = "";
  }


  render();

};


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


document
  .getElementById(
    "closeModal"
  )
  ?.addEventListener(
    "click",
    closeModal
  );


document
  .getElementById(
    "cancelBtn"
  )
  ?.addEventListener(
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


// ============================================================
// SAVE WORKER
// ============================================================

document
  .getElementById(
    "saveWorkerBtn"
  )
  ?.addEventListener(
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


      // --------------------------------------------------------
      // EDIT EXISTING WORKER
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // ADD NEW WORKER
      // --------------------------------------------------------

      else {

        const duplicate =
          data.workers.some(
            worker =>
              String(
                worker.name || ""
              )
                .trim()
                .toLowerCase() ===
              name
                .trim()
                .toLowerCase()
          );


        if (duplicate) {

          alert(
            "This worker already exists."
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

    }
  );


// ============================================================
// MARK ALL PRESENT
// ============================================================

document
  .getElementById(
    "allPresentBtn"
  )
  ?.addEventListener(
    "click",
    function() {

      const date =
        selectedDate();


      if (
        !data.workers.length
      ) {
        return;
      }


      if (
        !confirm(
          "Mark all workers Present for this date?"
        )
      ) {
        return;
      }


      data.workers.forEach(
        worker => {

          const a =
            createAttendance(
              worker.id,
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


// ============================================================
// SHOW ALL
// ============================================================

document
  .getElementById(
    "showAllBtn"
  )
  ?.addEventListener(
    "click",
    function() {

      if (searchInput) {

        searchInput.value =
          "";

      }


      const list =
        document.getElementById(
          "workerDropdown"
        );


      if (list) {

        list.style.display =
          "none";

      }


      render();

    }
  );


// ============================================================
// DATE CHANGE
// ============================================================

dateInput?.addEventListener(
  "change",
  function() {

    render();

  }
);


// ============================================================
// WORKER SEARCH
// ============================================================

searchInput?.addEventListener(
  "input",
  function() {

    updateWorkerDropdown();


    const list =
      document.getElementById(
        "workerDropdown"
      );


    if (list) {

      list.style.display =
        "block";

    }


    render();

  }
);


// ============================================================
// WORKER DROPDOWN
// ============================================================

function updateWorkerDropdown() {

  if (!searchInput) {
    return;
  }


  // Remove browser datalist
  // so custom dropdown works

  searchInput.removeAttribute(
    "list"
  );


  let list =
    document.getElementById(
      "workerDropdown"
    );


  // ----------------------------------------------------------
  // CREATE DROPDOWN
  // ----------------------------------------------------------

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
      "calc(100% + 4px)";


    list.style.background =
      "#ffffff";


    list.style.border =
      "1px solid #d9d9d9";


    list.style.borderRadius =
      "8px";


    list.style.boxShadow =
      "0 8px 20px rgba(0,0,0,.15)";


    list.style.zIndex =
      "99999";


    list.style.maxHeight =
      "250px";


    list.style.overflowY =
      "auto";


    const parent =
      searchInput.parentElement;


    if (parent) {

      parent.style.position =
        "relative";


      parent.appendChild(
        list
      );

    }

  }


  const q =
    String(
      searchInput.value || ""
    )
      .trim()
      .toLowerCase();


  const workers =
    data.workers.filter(
      worker =>
        !q ||
        String(
          worker.name || ""
        )
          .toLowerCase()
          .includes(q)
    );


  list.innerHTML =
    "";


  // ----------------------------------------------------------
  // NO WORKER
  // ----------------------------------------------------------

  if (!workers.length) {

    const noItem =
      document.createElement(
        "div"
      );


    noItem.textContent =
      "No worker found";


    noItem.style.padding =
      "12px";


    noItem.style.color =
      "#777";


    list.appendChild(
      noItem
    );


    return;

  }


  // ----------------------------------------------------------
  // WORKER LIST
  // ----------------------------------------------------------

  workers.forEach(
    worker => {

      const item =
        document.createElement(
          "div"
        );


      item.textContent =
        worker.name;


      item.style.padding =
        "12px 14px";


      item.style.cursor =
        "pointer";


      item.style.background =
        "#ffffff";


      item.style.borderBottom =
        "1px solid #eeeeee";


      item.addEventListener(
        "mouseenter",
        function() {

          item.style.background =
            "#f1f7ff";

        }
      );


      item.addEventListener(
        "mouseleave",
        function() {

          item.style.background =
            "#ffffff";

        }
      );


      item.addEventListener(
        "click",
        function(e) {

          e.stopPropagation();


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

}


// ============================================================
// OPEN DROPDOWN ON FOCUS
// ============================================================

searchInput?.addEventListener(
  "focus",
  function() {

    updateWorkerDropdown();


    const list =
      document.getElementById(
        "workerDropdown"
      );


    if (list) {

      list.style.display =
        "block";

    }

  }
);


// ============================================================
// OPEN DROPDOWN ON CLICK
// ============================================================

searchInput?.addEventListener(
  "click",
  function(e) {

    e.stopPropagation();


    updateWorkerDropdown();


    const list =
      document.getElementById(
        "workerDropdown"
      );


    if (list) {

      list.style.display =
        "block";

    }

  }
);


// ============================================================
// CLOSE DROPDOWN
// ============================================================

document.addEventListener(
  "click",
  function(e) {

    const list =
      document.getElementById(
        "workerDropdown"
      );


    if (!list) {
      return;
    }


    if (
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


// ============================================================
// ATTENDANCE DATES
// PARTICULAR WORKER ONLY
// ============================================================

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


  const worker =
    getSelectedWorker();


  // ----------------------------------------------------------
  // NO WORKER SELECTED
  // ----------------------------------------------------------

  if (!worker) {

    box.innerHTML = `

      <span class="no-dates">
        Select a worker to see attendance dates.
      </span>

    `;

    return;

  }


  // ----------------------------------------------------------
  // FIND ONLY SELECTED WORKER'S SUBMITTED DATES
  // ----------------------------------------------------------

  const dates =
    Object.keys(
      data.attendance
    )
      .filter(
        date => {

          const a =
            data.attendance[
              date
            ]?.[
              worker.id
            ];


          return (
            a &&
            a.submitted === true
          );

        }
      )
      .sort();


  // ----------------------------------------------------------
  // NO ATTENDANCE
  // ----------------------------------------------------------

  if (!dates.length) {

    box.innerHTML = `

      <span class="no-dates">

        No attendance submitted for

        <strong>
          ${esc(worker.name)}
        </strong>.

      </span>

    `;

    return;

  }


  // ----------------------------------------------------------
  // TITLE
  // ----------------------------------------------------------

  const title =
    document.createElement(
      "div"
    );


  title.style.marginBottom =
    "8px";


  title.style.fontWeight =
    "600";


  title.innerHTML =
    `
      Attendance of
      <strong>
        ${esc(worker.name)}
      </strong>
    `;


  box.appendChild(
    title
  );


  // ----------------------------------------------------------
  // GREEN DATE BUTTONS
  // ----------------------------------------------------------

  dates.forEach(
    date => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.textContent =
        "✓ " +
        formatDate(date);


      button.style.margin =
        "5px";


      button.style.padding =
        "9px 13px";


      button.style.borderRadius =
        "8px";


      button.style.border =
        "1px solid #2e9b4b";


      button.style.background =
        "#dff6e4";


      button.style.color =
        "#167a32";


      button.style.fontWeight =
        "700";


      button.style.cursor =
        "pointer";


      // Selected date

      if (
        date ===
        selectedDate()
      ) {

        button.style.background =
          "#16a34a";

        button.style.color =
          "#ffffff";

        button.style.boxShadow =
          "0 0 0 3px rgba(22,163,74,.20)";

      }


      // Click date

      button.onclick =
        function() {

          if (dateInput) {

            dateInput.value =
              date;

          }


          render();


          window.scrollTo({

            top: 0,

            behavior:
              "smooth"

          });

        };


      box.appendChild(
        button
      );

    }
  );

}


// ============================================================
// DATE STATUS
// ============================================================

function updateDateStatus() {

  const statusBox =
    document.getElementById(
      "dateStatus"
    );


  if (!statusBox) {
    return;
  }


  const worker =
    getSelectedWorker();


  if (!worker) {

    statusBox.textContent =
      "";


    return;

  }


  const a =
    getAttendance(
      worker.id,
      selectedDate()
    );


  if (
    a &&
    a.submitted === true
  ) {

    statusBox.textContent =
      "✓ Attendance submitted for this worker on this date";


    statusBox.className =
      "date-status submitted";


  } else {

    statusBox.textContent =
      "Attendance not submitted for this worker on this date";


    statusBox.className =
      "date-status not-submitted";

  }

}


// ============================================================
// GREEN DATE INPUT BOX
// ============================================================

function updateDateBoxColor() {

  if (!dateInput) {
    return;
  }


  const worker =
    getSelectedWorker();


  const dateBox =
    dateInput.closest(
      ".date-box"
    );


  if (!dateBox) {
    return;
  }


  if (!worker) {

    dateBox.classList.remove(
      "submitted-date"
    );

    return;

  }


  const a =
    getAttendance(
      worker.id,
      selectedDate()
    );


  if (
    a &&
    a.submitted === true
  ) {

    dateBox.classList.add(
      "submitted-date"
    );

  } else {

    dateBox.classList.remove(
      "submitted-date"
    );

  }

}


// ============================================================
// PRINT
// ============================================================

document
  .getElementById(
    "printBtn"
  )
  ?.addEventListener(
    "click",
    function() {

      window.print();

    }
  );


// ============================================================
// EXPORT CSV
// ============================================================

document
  .getElementById(
    "exportBtn"
  )
  ?.addEventListener(
    "click",
    function() {

      const rows = [

        [
          "Date",
          "Worker Name",
          "Daily Rate",
          "Status",
          "OT Hours",
          "Advance",
          "OT Rate",
          "OT Amount",
          "Submitted"
        ]

      ];


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
                a.submitted !== true
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


      const link =
        document.createElement(
          "a"
        );


      const url =
        URL.createObjectURL(
          blob
        );


      link.href =
        url;


      link.download =
        "CTD-Worker-Hajeri.csv";


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );

    }
  );


// ============================================================
// START APP
// ============================================================

render();
