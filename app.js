// ============================================================
// CTD WORKER HAJERI
// STABLE VERSION
// ============================================================

const KEY = "ctd_worker_hajeri_v4";


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

const submittedDates =
  document.getElementById("submittedDates");

const dateStatus =
  document.getElementById("dateStatus");

const dateBox =
  document.getElementById("dateBox");


// ============================================================
// DATA
// ============================================================

let data = loadData();


// ============================================================
// LOAD DATA
// ============================================================

function loadData() {

  try {

    const saved =
      localStorage.getItem(KEY);

    if (!saved) {
      return structuredClone(defaultData);
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

    parsed.workers =
      parsed.workers.map(w => ({
        id:
          w.id ||
          crypto.randomUUID(),

        name:
          String(
            w.name || ""
          ).trim(),

        rate:
          Number(
            w.rate || 0
          ),

        otRate:
          Number(
            w.otRate || 0
          ),

        phone:
          String(
            w.phone || ""
          )
      }));

    return parsed;

  } catch (error) {

    console.error(
      "Load error:",
      error
    );

    return structuredClone(
      defaultData
    );
  }
}


// ============================================================
// SAVE DATA
// ============================================================

function saveData() {

  localStorage.setItem(
    KEY,
    JSON.stringify(data)
  );
}


// ============================================================
// DATE HELPERS
// ============================================================

function todayISO() {

  const d =
    new Date();

  return new Date(
    d.getTime() -
    d.getTimezoneOffset() *
    60000
  )
    .toISOString()
    .slice(0, 10);
}


if (!dateInput.value) {

  dateInput.value =
    todayISO();

}


function selectedDate() {

  return (
    dateInput.value ||
    todayISO()
  );
}


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


// ============================================================
// GET ATTENDANCE
// IMPORTANT:
// DOES NOT CREATE NEW ATTENDANCE
// ============================================================

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


// ============================================================
// CREATE ATTENDANCE
// ============================================================

function createAttendance(
  workerId,
  date
) {

  if (
    !data.attendance[date]
  ) {

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
// FILTER WORKERS
// ============================================================

function filteredWorkers() {

  const q =
    String(
      searchInput.value || ""
    )
      .trim()
      .toLowerCase();


  if (!q) {

    return data.workers;

  }


  return data.workers.filter(
    worker =>
      worker.name
        .toLowerCase()
        .includes(q)
  );
}


// ============================================================
// SELECTED WORKER
// ============================================================

function getSelectedWorker() {

  const text =
    String(
      searchInput.value || ""
    )
      .trim()
      .toLowerCase();


  if (!text) {
    return null;
  }


  return (
    data.workers.find(
      worker =>
        worker.name
          .trim()
          .toLowerCase() === text
    ) || null
  );
}


// ============================================================
// WORKER DROPDOWN
// ============================================================

function createWorkerDropdown() {

  let box =
    document.getElementById(
      "workerDropdown"
    );


  if (box) {
    return box;
  }


  box =
    document.createElement("div");

  box.id =
    "workerDropdown";

  box.className =
    "worker-dropdown";


  const parent =
    searchInput.parentElement;


  if (parent) {

    parent.appendChild(box);

  }


  return box;
}


function renderWorkerDropdown() {

  const box =
    createWorkerDropdown();


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
        worker.name
          .toLowerCase()
          .includes(q)
    );


  box.innerHTML = "";


  if (!workers.length) {

    const no =
      document.createElement("div");

    no.className =
      "worker-option no-worker";

    no.textContent =
      "No worker found";

    box.appendChild(no);

    box.classList.add("show");

    return;
  }


  workers.forEach(
    worker => {

      const item =
        document.createElement("div");

      item.className =
        "worker-option";

      item.textContent =
        worker.name;


      item.addEventListener(
        "mousedown",
        function(e) {

          e.preventDefault();

          searchInput.value =
            worker.name;

          box.classList.remove(
            "show"
          );

          render();

        }
      );


      box.appendChild(item);

    }
  );


  box.classList.add("show");
}


function hideWorkerDropdown() {

  const box =
    document.getElementById(
      "workerDropdown"
    );

  if (box) {

    box.classList.remove(
      "show"
    );

  }
}


// ============================================================
// SEARCH EVENTS
// ============================================================

searchInput.addEventListener(
  "focus",
  function() {

    renderWorkerDropdown();

  }
);


searchInput.addEventListener(
  "input",
  function() {

    renderWorkerDropdown();

    render();

  }
);


document.addEventListener(
  "click",
  function(e) {

    const box =
      document.getElementById(
        "workerDropdown"
      );


    if (
      e.target !== searchInput &&
      box &&
      !box.contains(e.target)
    ) {

      hideWorkerDropdown();

    }

  }
);


// ============================================================
// RENDER MAIN
// ============================================================

function render() {

  const workers =
    filteredWorkers();

  const date =
    selectedDate();


  // ----------------------------------------------------------
  // DATE LABEL
  // ----------------------------------------------------------

  const dateLabel =
    document.getElementById(
      "selectedDateLabel"
    );

  if (dateLabel) {

    dateLabel.textContent =
      formatDate(date);

  }


  // ----------------------------------------------------------
  // DAILY COUNTS
  // ONLY SUBMITTED ATTENDANCE
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


  // ----------------------------------------------------------
  // DAILY TABLE
  // ----------------------------------------------------------

  if (!workers.length) {

    workerTable.innerHTML = "";

  } else {

    workerTable.innerHTML =
      workers
        .map(
          (worker, index) => {

            const a =
              getAttendance(
                worker.id,
                date
              );


            const submitted =
              !!a &&
              a.submitted === true;


            const status =
              a?.status ||
              "Present";


            const otHours =
              a?.otHours || 0;


            const advance =
              a?.advance || 0;


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

                    <option
                      value="Present"
                      ${status === "Present"
                        ? "selected"
                        : ""}
                    >
                      Present
                    </option>

                    <option
                      value="Absent"
                      ${status === "Absent"
                        ? "selected"
                        : ""}
                    >
                      Absent
                    </option>

                    <option
                      value="Half Day"
                      ${status === "Half Day"
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
                    id="ot-${worker.id}"
                    value="${otHours}"
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

                    `
                      <button
                        class="edit"
                        type="button"
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
                        type="button"
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
                    type="button"
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
                    type="button"
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
        )
        .join("");

  }


  // ----------------------------------------------------------
  // EMPTY
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
  // ATTENDANCE DATES
  // ----------------------------------------------------------

  renderAttendanceDates();


  // ----------------------------------------------------------
  // DATE STATUS
  // ----------------------------------------------------------

  updateDateStatus();


  // ----------------------------------------------------------
  // MONTHLY
  // ----------------------------------------------------------

  renderMonthly();

}


// ============================================================
// SUBMIT ATTENDANCE
// ============================================================

window.submitAttendance =
function(workerId) {

  const date =
    selectedDate();


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


  if (
    !data.attendance[date]
  ) {

    data.attendance[date] = {};

  }


  const old =
    data.attendance[date][workerId];


  data.attendance[date][workerId] = {

    status:

      status,

    otHours:

      otHours,

    advance:

      advance,

    payment:

      old?.payment ||
      "Pending",

    submitted:

      true

  };


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


  if (!a) {
    return;
  }


  a.submitted =
    false;


  saveData();

  render();

};


// ============================================================
// MARK ALL PRESENT
// ============================================================

document
  .getElementById(
    "allPresentBtn"
  )
  .addEventListener(
    "click",
    function() {

      if (
        !data.workers.length
      ) {

        alert(
          "No workers available."
        );

        return;

      }


      const date =
        selectedDate();


      if (
        !confirm(
          "Mark all workers Present for this date?"
        )
      ) {

        return;

      }


      if (
        !data.attendance[date]
      ) {

        data.attendance[date] =
          {};

      }


      data.workers.forEach(
        worker => {

          const old =
            data.attendance[
              date
            ][worker.id];


          data.attendance[
            date
          ][worker.id] = {

            status:
              "Present",

            otHours:
              old?.otHours || 0,

            advance:
              old?.advance || 0,

            payment:
              old?.payment ||
              "Pending",

            submitted:
              true

          };

        }
      );


      saveData();

      render();

    }
  );


// ============================================================
// ATTENDANCE DATES
// PARTICULAR WORKER
// ============================================================

function renderAttendanceDates() {

  if (!submittedDates) {
    return;
  }


  const worker =
    getSelectedWorker();


  // ----------------------------------------------------------
  // NO WORKER SELECTED
  // ----------------------------------------------------------

  if (!worker) {

    submittedDates.innerHTML = `

      <div class="no-dates">

        Select a worker name above
        to see that worker's attendance dates.

      </div>

    `;

    return;

  }


  // ----------------------------------------------------------
  // FIND ONLY THIS WORKER'S DATES
  // ----------------------------------------------------------

  const dates =
    Object.keys(
      data.attendance
    )
      .filter(
        date => {

          const a =
            getAttendance(
              worker.id,
              date
            );


          return (
            a &&
            a.submitted === true
          );

        }
      )
      .sort();


  // ----------------------------------------------------------
  // NO DATES
  // ----------------------------------------------------------

  if (!dates.length) {

    submittedDates.innerHTML = `

      <div class="no-dates">

        No attendance submitted for
        <strong>
          ${esc(worker.name)}
        </strong>.

      </div>

    `;

    return;

  }


  // ----------------------------------------------------------
  // GREEN DATES
  // ----------------------------------------------------------

  submittedDates.innerHTML =
    dates
      .map(
        date => {

          const active =
            date === selectedDate();


          return `

            <button
              type="button"
              class="
                date-chip
                present-date
                ${active ? "active" : ""}
              "
              onclick="
                selectAttendanceDate(
                  '${date}'
                )
              "
            >

              ${formatDate(date)}

            </button>

          `;

        }
      )
      .join("");

}


// ============================================================
// SELECT ATTENDANCE DATE
// ============================================================

window.selectAttendanceDate =
function(date) {

  dateInput.value =
    date;


  render();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

};


// ============================================================
// DATE STATUS
// GREEN DATE INDICATOR
// ============================================================

function updateDateStatus() {

  const date =
    selectedDate();


  const worker =
    getSelectedWorker();


  let submitted =
    false;


  if (worker) {

    const a =
      getAttendance(
        worker.id,
        date
      );


    submitted =
      !!a &&
      a.submitted === true;

  } else {

    submitted =
      Object.values(
        data.attendance[date] || {}
      )
        .some(
          a =>
            a &&
            a.submitted === true
        );

  }


  if (dateBox) {

    if (submitted) {

      dateBox.classList.add(
        "submitted-date"
      );

    } else {

      dateBox.classList.remove(
        "submitted-date"
      );

    }

  }


  if (dateStatus) {

    if (submitted) {

      dateStatus.className =
        "date-status submitted";

      dateStatus.textContent =
        worker
          ? `✓ Attendance submitted for ${worker.name}`
          : "✓ Attendance submitted";

    } else {

      dateStatus.className =
        "date-status not-submitted";

      dateStatus.textContent =
        "Attendance not submitted";

    }

  }

}


// ============================================================
// SHOW ALL
// ============================================================

document
  .getElementById(
    "showAllBtn"
  )
  .addEventListener(
    "click",
    function() {

      searchInput.value =
        "";

      hideWorkerDropdown();

      render();

    }
  );


// ============================================================
// ADD WORKER
// ============================================================

document
  .getElementById(
    "addWorkerBtn"
  )
  .addEventListener(
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
      w =>
        w.id === id
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


// ============================================================
// DELETE WORKER
// ============================================================

window.deleteWorker =
function(id) {

  const worker =
    data.workers.find(
      w =>
        w.id === id
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
      w =>
        w.id !== id
    );


  Object.keys(
    data.attendance
  ).forEach(
    date => {

      if (
        data.attendance[date]
      ) {

        delete data
          .attendance[date][id];

      }

    }
  );


  saveData();


  searchInput.value =
    "";


  render();

};


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

  modal.classList.add(
    "hidden"
  );

}


document
  .getElementById(
    "closeModal"
  )
  .addEventListener(
    "click",
    closeModal
  );


document
  .getElementById(
    "cancelBtn"
  )
  .addEventListener(
    "click",
    closeModal
  );


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


// ============================================================
// SAVE WORKER
// ============================================================

document
  .getElementById(
    "saveWorkerBtn"
  )
  .addEventListener(
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


      // ------------------------------------------------------
      // EDIT
      // ------------------------------------------------------

      if (id) {

        const worker =
          data.workers.find(
            w =>
              w.id === id
          );


        if (worker) {

          worker.name =
            name;


          worker.rate =
            Number(
              workerRate.value ||
              0
            );


          worker.otRate =
            Number(
              workerOTRate.value ||
              0
            );


          worker.phone =
            workerPhone.value.trim();

        }

      }


      // ------------------------------------------------------
      // ADD
      // ------------------------------------------------------

      else {

        const duplicate =
          data.workers.some(
            worker =>
              worker.name
                .trim()
                .toLowerCase() ===
              name
                .trim()
                .toLowerCase()
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
              workerRate.value ||
              0
            ),

          otRate:
            Number(
              workerOTRate.value ||
              0
            ),

          phone:
            workerPhone.value.trim()

        });

      }


      saveData();

      closeModal();


      searchInput.value =
        "";


      render();

    }
  );


// ============================================================
// DATE CHANGE
// ============================================================

dateInput.addEventListener(
  "change",
  function() {

    render();

  }
);


// ============================================================
// MONTHLY SALARY SUMMARY
// ONLY SUBMITTED RECORDS
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


  if (!year || !month) {
    return;
  }


  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();


  monthlyTable.innerHTML =
    data.workers
      .map(
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
              `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;


            const a =
              getAttendance(
                worker.id,
                iso
              );


            // ONLY SUBMITTED
            if (
              !a ||
              a.submitted !== true
            ) {

              continue;

            }


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
              a.payment ===
              "Paid"
            ) {

              payment =
                "Paid";

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

        }
      )
      .join("");

}


// ============================================================
// MONTHLY PAYMENT
// ============================================================

window.changeMonthlyPayment =
function(
  workerId,
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
      `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;


    const a =
      getAttendance(
        workerId,
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
// PRINT
// ============================================================

document
  .getElementById(
    "printBtn"
  )
  .addEventListener(
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
  .addEventListener(
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
          "OT Amount"
        ]

      ];


      const dates =
        Object.keys(
          data.attendance
        )
        .sort();


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


      link.href =
        URL.createObjectURL(
          blob
        );


      link.download =
        "CTD-Worker-Hajeri.csv";


      link.click();


      URL.revokeObjectURL(
        link.href
      );

    }
  );


// ============================================================
// START
// ============================================================

render();
