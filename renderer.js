const scheduleDiv = document.getElementById("schedule");

// Modal elements
const openModalBtn = document.getElementById("openModal");
const modal = document.getElementById("taskModal");
const closeModalBtn = document.getElementById("closeModal");
const saveTaskBtn = document.getElementById("saveTask");

const taskNameInput = document.getElementById("taskName");
const startTimeSelect = document.getElementById("startTime");
const endTimeSelect = document.getElementById("endTime");
const bgSoundToggle = document.getElementById("bgSoundToggle");

let tasks = [];

// Audio feedback
let clickAudio, typeAudio, endNotifyAudio, bg1, bg2;
try {
  clickAudio = new Audio('sounds/click.mp3');
  typeAudio = new Audio('sounds/type.mp3');
  endNotifyAudio = new Audio('sounds/birdnotiftrimmed.mp3');
  bg1 = new Audio('sounds/bedtimestory.mp3');
  bg2 = new Audio('sounds/birdbackground.wav');
  [bg1, bg2].forEach(a => { if (a) { a.loop = true; a.volume = 0.4; a.addEventListener('ended', () => { a.currentTime = 0; a.play().catch(()=>{}); }); } });
} catch (e) {
  // ignore if Audio not supported
}

// Format hours for dropdown + display
function formatHour(hour) {
  const base = ((hour % 24) + 24) % 24; // normalize
  const ampm = base >= 12 ? "PM" : "AM";
  const displayHour = ((base + 11) % 12) + 1;
  return `${displayHour} ${ampm}`;
}

// Populate dropdowns: start 0–23, end 1–24
for (let i = 0; i < 24; i++) {
  const opt1 = document.createElement("option");
  opt1.value = i;
  opt1.textContent = formatHour(i);
  startTimeSelect.appendChild(opt1);

  const opt2 = document.createElement("option");
  opt2.value = i + 1; // 1..24 (24 represents 12 AM at bottom)
  opt2.textContent = formatHour(i + 1);
  endTimeSelect.appendChild(opt2);
}

function renderSchedule() {
  scheduleDiv.innerHTML = "";

  // Create time slots for 0..23
  for (let hour = 0; hour < 24; hour++) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.innerHTML = `
      <div class=\"time-label\">${formatHour(hour)}</div>
      <div class=\"task-area\"></div>
    `;
    scheduleDiv.appendChild(slot);
  }

  // Bottom 12 AM label
  const bottom = document.createElement("div");
  bottom.className = "time-slot";
  bottom.innerHTML = `<div class=\"time-label\">${formatHour(24)}</div>`;
  scheduleDiv.appendChild(bottom);

  const rowHeight = 40; // match .time-slot height
  const inset = 6; // snug gap from divider lines

  tasks.forEach((task, taskIndex) => {
    const start = task.start; // 0..23
    const end = Math.min(24, task.end); // allow 24
    const duration = Math.max(0, end - start);
    if (duration <= 0 || start < 0 || start > 23) return;

    const slot = scheduleDiv.children[start];
    const area = slot.querySelector('.task-area');
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';
    taskDiv.textContent = task.name;

    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.onclick = () => {
      tasks.splice(taskIndex, 1);
      renderSchedule();
    };
    taskDiv.appendChild(delBtn);

    // Snug positioning inside the time rows
    taskDiv.style.top = `${inset}px`;
    taskDiv.style.height = `${Math.max(0, duration * rowHeight - inset * 2)}px`;
    taskDiv.style.position = 'absolute';
    taskDiv.style.left = '6px';
    taskDiv.style.right = '6px';

    area.appendChild(taskDiv);
  });
}

// Modal open/close
openModalBtn.onclick = () => {
  modal.style.display = "flex";
  if (clickAudio) clickAudio.play().catch(() => {});
};
closeModalBtn.onclick = () => {
  modal.style.display = "none";
  if (clickAudio) clickAudio.play().catch(() => {});
};

// Save task
saveTaskBtn.onclick = () => {
  const name = taskNameInput.value;
  const start = parseInt(startTimeSelect.value);
  const end = parseInt(endTimeSelect.value);

  if (!name || isNaN(start) || isNaN(end) || start >= end) {
    alert("Enter valid task info!");
    return;
  }

  tasks.push({ name, start, end });
  renderSchedule();
  if (clickAudio) clickAudio.play().catch(() => {});

  // Reset + close modal
  taskNameInput.value = "";
  modal.style.display = "none";
};

// Type sound on inputs within modal
[taskNameInput, startTimeSelect, endTimeSelect].forEach(el => {
  if (!el) return;
  const handler = () => { if (typeAudio) typeAudio.currentTime = 0; if (typeAudio) typeAudio.play().catch(() => {}); };
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
  el.addEventListener('keydown', handler);
});

// Initial render
// Internal clock: notify only when a task ends at current hour top
const firedHours = new Set();
function checkTaskEndNotifications() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${hour}`;
  if (minute !== 0) {
    firedHours.delete(key);
    return;
  }
  if (firedHours.has(key)) return;
  if (tasks.length && tasks.some(t => t.end === hour)) {
    if (endNotifyAudio) { endNotifyAudio.currentTime = 0; endNotifyAudio.play().catch(() => {}); }
    firedHours.add(key);
  }
}

setInterval(checkTaskEndNotifications, 15 * 1000);

renderSchedule();

// Background sound toggle: cycles none -> bg1 -> bg2 -> none
let bgMode = 0; // 0 none, 1 bg1, 2 bg2
function stopAllBg() { try { if (bg1) bg1.pause(); if (bg2) bg2.pause(); } catch (e) {} }
function applyBgMode() {
  stopAllBg();
  if (bgMode === 1 && bg1) { bg1.currentTime = 0; bg1.play().catch(()=>{}); }
  if (bgMode === 2 && bg2) { bg2.currentTime = 0; bg2.play().catch(()=>{}); }
}
if (bgSoundToggle) {
  bgSoundToggle.addEventListener('click', () => {
    if (clickAudio) clickAudio.play().catch(() => {});
    bgMode = (bgMode + 1) % 3;
    applyBgMode();
  });
}
