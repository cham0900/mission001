const HINTS = [
  {
    level: 1,
    label: "CMYK CODE",
    value: "C100 M0 Y100 K0",
    display: "C100 M0 Y100 K0",
  },
  {
    level: 2,
    label: "RGB COLOR",
    value: "(255, 0, 0)",
    display: "(255, 0, 0)",
  },
  { level: 3, label: "HEX CODE", value: "#000000", display: "#000000" },
  {
    level: 4,
    label: "VISUAL INTEL",
    value:
      "https://a.storyblok.com/f/161938/1200x676/d33939c7f6/counting-cards-in-blackjack.jpg",
    display: "BLACKJACK IMAGE",
    isLink: true,
  },
  {
    level: 5,
    label: "AUDIO INTEL 1",
    value: "https://www.youtube.com/watch?v=ueNY30Cs8Lk",
    display: "youtu.be/ueNY30Cs8Lk",
    isLink: true,
  },
  {
    level: 6,
    label: "AUDIO INTEL 2",
    value:
      "https://www.youtube.com/watch?v=W_cWvabjG50&list=RDW_cWvabjG50&start_radio=1",
    display: "youtu.be/W_cWvabjG50",
    isLink: true,
  },
  {
    level: 7,
    label: "TEXT INTEL",
    value: "Me and Thee",
    display: "Me and Thee",
  },
  {
    level: 8,
    label: "EPISODE",
    value: "EP.7",
    display: "EP.7 (combine with Lvl 7)",
  },
  {
    level: 9,
    label: "CODENAME",
    value: "Pierre Gasly",
    display: "Pierre Gasly",
  },
  {
    level: "9b",
    label: "★ BONUS INTEL",
    value: "NUMBER C..",
    display: "NUMBER C..",
  },
  {
    level: 10,
    label: "LOCATION CODE",
    value: "bangkokth",
    display: "bangkokth",
  },
];

const LEVELS = [
  {
    id: 1,
    name: "REACTION PROTOCOL",
    desc: "Speed & precision test",
    time: 25,
    game: "reaction",
  },
  {
    id: 2,
    name: "MEMORY MATRIX",
    desc: "Pattern recognition challenge",
    time: 45,
    game: "memory",
  },
  {
    id: 3,
    name: "SEQUENCE BREACH",
    desc: "Order the Italian sequence",
    time: 60,
    game: "sequence",
  },
  {
    id: 4,
    name: "FIELD RUNNER",
    desc: "Mario-style — collect all stars",
    time: 999,
    game: "platformer",
  },
  {
    id: 5,
    name: "LOGIC OVERRIDE",
    desc: "Logic pattern challenge",
    time: 30,
    game: "logic",
  },
  {
    id: 6,
    name: "DATA SORT",
    desc: "Classify the data tokens",
    time: 45,
    game: "dragsort",
  },
  {
    id: 7,
    name: "CIPHER DECODE",
    desc: "Decrypt the hidden message",
    time: 35,
    game: "decode7",
  },
  {
    id: 8,
    name: "FREQUENCY SCAN",
    desc: "Binary-to-decimal challenge",
    time: 40,
    game: "frequency",
  },
  {
    id: 9,
    name: "ROAD RUNNER",
    desc: "Drive & collect — avoid danger",
    time: 999,
    game: "cardriving",
  },
  {
    id: 10,
    name: "CTF BREACH",
    desc: "The answer is in this page",
    time: 999,
    game: "ctf",
  },
];

let state = {
  completedLevels: [],
  collectedHints: [],
  skipsLeft: 2,
  agentId: "",
  bonusUnlocked: false,
};
let currentLevel = null,
  timerInterval = null,
  timeLeft = 0,
  gameActive = false;
let platformerInterval = null,
  carInterval = null;

// SOUND
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}
function playBeep(f, d, t = "sine", v = 0.2) {
  try {
    const c = getAudio(),
      o = c.createOscillator(),
      g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = t;
    o.frequency.value = f;
    g.gain.setValueAtTime(v, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
    o.start();
    o.stop(c.currentTime + d);
  } catch (e) {}
}
function playSuccess() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playBeep(f, 0.15), i * 110),
  );
}
function playClick() {
  playBeep(800, 0.05, "square", 0.1);
}
function playError() {
  playBeep(200, 0.2, "sawtooth", 0.15);
}
function playTick() {
  playBeep(1200, 0.03, "square", 0.05);
}

// BACKGROUND MUSIC
let bgmStarted = false;
function startBGM() {
  const bgm = document.getElementById("bgMusic");
  if (!bgm) return;
  bgm.volume = 0.75;
  if (bgm.paused) {
    bgm.play().catch(() => {}); // ignore autoplay policy errors
  }
  bgmStarted = true;
}
function stopBGM() {
  const bgm = document.getElementById("bgMusic");
  if (!bgm) return;
  // Fade out smoothly
  let vol = bgm.volume;
  const fade = setInterval(() => {
    vol = Math.max(0, vol - 0.05);
    bgm.volume = vol;
    if (vol <= 0) {
      bgm.pause();
      bgm.currentTime = 0;
      bgm.volume = 0.75;
      clearInterval(fade);
    }
  }, 40);
}
function pauseBGM() {
  const bgm = document.getElementById("bgMusic");
  if (!bgm) return;
  // Fade out smoothly without resetting position
  let vol = bgm.volume;
  const fade = setInterval(() => {
    vol = Math.max(0, vol - 0.05);
    bgm.volume = vol;
    if (vol <= 0) {
      bgm.pause();
      bgm.volume = 0.75;
      clearInterval(fade);
    }
  }, 40);
}
function resumeBGM() {
  const bgm = document.getElementById("bgMusic");
  if (!bgm || !bgmStarted) return;
  bgm.volume = 0;
  bgm.play().catch(() => {});
  // Fade in
  let vol = 0;
  const fade = setInterval(() => {
    vol = Math.min(0.35, vol + 0.03);
    bgm.volume = vol;
    if (vol >= 0.35) clearInterval(fade);
  }, 40);
}

// SAVE/LOAD
function saveState() {
  localStorage.setItem("fys2_state", JSON.stringify(state));
}
function loadState() {
  const s = localStorage.getItem("fys2_state");
  if (s)
    try {
      state = JSON.parse(s);
    } catch (e) {}
}
function resetGame() {
  if (confirm("Reset all progress?")) {
    localStorage.removeItem("fys2_state");
    location.reload();
  }
}

// SCREENS
function showScreen(id) {
  stop_all();
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function stop_all() {
  clearInterval(timerInterval);
  timerInterval = null;
  clearInterval(platformerInterval);
  platformerInterval = null;
  clearInterval(carInterval);
  carInterval = null;
  gameActive = false;
}
function startGame() {
  loadState();
  if (!state.agentId)
    state.agentId = "AGT-" + Math.floor(Math.random() * 9000 + 1000);
  if (state.skipsLeft === undefined) state.skipsLeft = 2;
  if (state.bonusUnlocked === undefined) state.bonusUnlocked = false;
  document.getElementById("agentId").textContent = state.agentId;
  updateMap();
  showScreen("screen-map");
  playSuccess();
  startBGM();
}
function goToMap() {
  updateMap();
  showScreen("screen-map");
}

// MAP
function updateMap() {
  const done = state.completedLevels || [];
  const hints = state.collectedHints || [];
  document.getElementById("progressText").textContent = done.length + " / 10";
  document.getElementById("progressFill").style.width =
    (done.length / 10) * 100 + "%";
  document.getElementById("skipsLeft").textContent = state.skipsLeft;

  // Sidebar hints
  const hl = document.getElementById("hintsList");
  hl.innerHTML = "";
  HINTS.forEach((h) => {
    const isBonus = h.level === "9b";
    const collected = isBonus
      ? state.bonusUnlocked
      : hints.find((x) => x.level === h.level);
    if (isBonus && !state.bonusUnlocked && !done.includes(9)) return;
    const div = document.createElement("div");
    div.className =
      "hint-item" +
      (collected ? (isBonus ? " bonus-hint" : "") : "  hint-locked");
    const lvl = isBonus ? "9★" : h.level;
    if (collected) {
      if (h.isLink)
        div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><div class="hint-text"><a class="hint-link" href="${h.value}" target="_blank">${h.display}</a></div>`;
      else if (h.isImage)
        div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><img src="https://a.storyblok.com/f/161938/1200x676/d33939c7f6/counting-cards-in-blackjack.jpg" alt="Blackjack" style="max-width:100%;max-height:80px;display:block;margin-top:4px;border:1px solid var(--border)">`;
      else
        div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><div class="hint-text">${h.display}</div>`;
    } else {
      div.className = "hint-item hint-locked";
      div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><div class="hint-text">[ LOCKED ]</div>`;
    }
    hl.appendChild(div);
  });

  // Level cards — ALL unlocked
  const grid = document.getElementById("levelGrid");
  grid.innerHTML = "";
  LEVELS.forEach((lvl) => {
    const isDone = done.includes(lvl.id);
    const card = document.createElement("div");
    card.className = "level-card" + (isDone ? " completed" : "");
    card.innerHTML = `<div class="level-num">MISSION ${String(lvl.id).padStart(2, "0")}</div><div class="level-name">${lvl.name}</div><div class="level-desc">${lvl.desc}</div><div class="level-status ${isDone ? "status-done" : "status-ready"}">${isDone ? "✓ COMPLETED" : "▶ READY"}</div>`;
    card.onclick = () => startLevel(lvl.id);
    grid.appendChild(card);
  });

  // Bonus card (shows after mission 9 completed)
  if (done.includes(9)) {
    const bonusCard = document.createElement("div");
    bonusCard.className =
      "level-card bonus-card" + (state.bonusUnlocked ? " completed" : "");
    bonusCard.innerHTML = `<div class="level-num" style="color:var(--warn)">MISSION 09 ★ BONUS</div><div class="level-name" style="color:var(--warn)">BONUS ROUND</div><div class="level-desc">Extra challenge — unlocked by Road Runner</div><div class="level-status" style="color:${state.bonusUnlocked ? "var(--accent2)" : "var(--warn)"}">${state.bonusUnlocked ? "✓ BONUS COLLECTED" : "▶ BONUS AVAILABLE"}</div>`;
    bonusCard.onclick = () => startBonusLevel();
    grid.appendChild(bonusCard);
  }
}

// LEVEL START
function startLevel(levelId) {
  stop_all();
  currentLevel = LEVELS.find((l) => l.id === levelId);
  if (!currentLevel) return;
  playClick();
  document.getElementById("gameLevelNum").textContent =
    "MISSION " + String(levelId).padStart(2, "0");
  document.getElementById("gameLevelTitle").textContent = currentLevel.name;
  updateSideHints();
  document.getElementById("skipCount").textContent = state.skipsLeft;
  document.getElementById("skipBtn").style.opacity =
    state.skipsLeft > 0 ? "1" : "0.4";
  showScreen("screen-game");
  buildGame(currentLevel.game, levelId);
  if (currentLevel.time < 999) startTimer(currentLevel.time);
  else {
    gameActive = true;
    document.getElementById("timerValue").textContent = "∞";
    document.getElementById("timerValue").className = "timer-value";
    document.getElementById("timerBar").style.width = "100%";
  }
}

function startBonusLevel() {
  stop_all();
  currentLevel = {
    id: "9b",
    name: "REBORN TRIVIA",
    game: "bonus",
    time: 999,
  };
  document.getElementById("gameLevelNum").textContent = "MISSION 09 ★ BONUS";
  document.getElementById("gameLevelTitle").textContent = "REBORN TRIVIA";
  document.getElementById("gameInstructions").textContent =
    "ตอบคำถามเกี่ยวกับอนิเมะเรื่อง Katekyo Hitman Reborn! ให้ครบ 5 ข้อ เพื่อปลดล็อค ข้อbonus!";
  document.getElementById("skipCount").textContent = state.skipsLeft;
  document.getElementById("skipBtn").style.opacity = "0.4";
  showScreen("screen-game");
  buildGame("bonus", "9b");
  gameActive = true;
  document.getElementById("timerValue").textContent = "∞";
  document.getElementById("timerValue").className = "timer-value";
  document.getElementById("timerBar").style.width = "100%";
}

function updateSideHints() {
  const shl = document.getElementById("sideHintsList");
  shl.innerHTML = "";
  (state.collectedHints || []).forEach((h) => {
    const hd = HINTS.find((x) => x.level === h.level);
    if (!hd) return;
    const div = document.createElement("div");
    div.className = "hint-item";
    div.style.marginBottom = "6px";
    div.innerHTML = `<div class="hint-level">LVL ${h.level}</div><div class="hint-text" style="font-size:11px">${hd.display.substring(0, 38)}${hd.display.length > 38 ? "..." : ""}</div>`;
    shl.appendChild(div);
  });
}

// TIMER
function startTimer(seconds) {
  clearInterval(timerInterval);
  timeLeft = seconds;
  const max = seconds;
  const tv = document.getElementById("timerValue"),
    tb = document.getElementById("timerBar");
  gameActive = true;
  tv.textContent = timeLeft;
  tv.className = "timer-value";
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    timeLeft--;
    tv.textContent = timeLeft;
    tv.className = "timer-value" + (timeLeft <= 5 ? " urgent" : "");
    tb.style.width = (timeLeft / max) * 100 + "%";
    if (timeLeft <= 5) playTick();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      onTimeOut();
    }
  }, 1000);
}
function onTimeOut() {
  gameActive = false;
  playError();
  showNotification("⚠ TIME OUT — TRY AGAIN OR USE A SKIP");
  setTimeout(() => {
    if (currentLevel) startLevel(currentLevel.id);
  }, 2000);
}

// SKIP
function skipLevel() {
  if (currentLevel && currentLevel.id === "9b") {
    showNotification("⊘ CANNOT SKIP BONUS LEVEL");
    return;
  }
  if (state.skipsLeft <= 0) {
    showNotification("⊘ NO SKIPS REMAINING");
    return;
  }
  if (!currentLevel) return;
  state.skipsLeft--;
  playSuccess();
  completeLevel(currentLevel.id);
}

// COMPLETE
function completeLevel(levelId) {
  stop_all();
  const isBonus = levelId === "9b";
  if (isBonus) {
    if (!state.bonusUnlocked) {
      state.bonusUnlocked = true;
      saveState();
    }
    playSuccess();
    showCompletionOverlay(
      "★ BONUS INTEL UNLOCKED ★",
      "Exceptional! A secret clue has been added.",
      "NUMBER C..",
      "var(--warn)",
      false,
    );
    return;
  }
  if (!state.completedLevels.includes(levelId))
    state.completedLevels.push(levelId);
  const hd = HINTS.find((h) => h.level === levelId);
  if (hd && !state.collectedHints.find((h) => h.level === levelId))
    state.collectedHints.push({ level: levelId, value: hd.value });
  saveState();
  playSuccess();
  showCompletionOverlay(
    "MISSION " + String(levelId).padStart(2, "0") + " COMPLETE",
    "Intel secured. New intelligence added to your dossier.",
    null,
    "var(--accent)",
    true,
    hd,
  );
}

function showCompletionOverlay(title, text, directVal, color, showHint, hd) {
  document.getElementById("completionTitle").textContent = title;
  document.getElementById("completionTitle").style.color = color;
  document.getElementById("completionText").textContent = text;
  document.getElementById("hintRevealLabel").style.color = color;
  document.getElementById("completionHintReveal").style.borderLeftColor = color;
  document.getElementById("completionHintReveal").style.borderColor = color;
  const hval = document.getElementById("completionHintValue");
  if (directVal) {
    hval.textContent = directVal;
  } else if (hd) {
    if (hd.isLink)
      hval.innerHTML = `<a class="hint-link" href="${hd.value}" target="_blank">${hd.display}</a>`;
    else if (hd.isImage)
      hval.innerHTML = `<div style="font-family:var(--mono);font-size:11px;color:var(--accent);letter-spacing:2px;margin-bottom:8px">◈ VISUAL INTEL — BLACKJACK</div><img src="https://a.storyblok.com/f/161938/1200x676/d33939c7f6/counting-cards-in-blackjack.jpg" alt="Blackjack intel" style="max-width:100%;max-height:180px;display:block;border:1px solid var(--border)">`;
    else hval.textContent = hd.display;
  } else {
    hval.textContent = "";
  }
  document.getElementById("completionOverlay").classList.add("active");
}

function nextLevel() {
  document.getElementById("completionOverlay").classList.remove("active");
  updateMap();
  showScreen("screen-map");
}

// NAME STAGE
function openNameStage() {
  playClick();
  const hints = state.collectedHints || [];
  const fhl = document.getElementById("finalHintsList");
  fhl.innerHTML = "";
  HINTS.forEach((h) => {
    const isBonus = h.level === "9b";
    const collected = isBonus
      ? state.bonusUnlocked
      : hints.find((x) => x.level === h.level);
    if (!collected) return;
    const div = document.createElement("div");
    div.className = "hint-item" + (isBonus ? " bonus-hint" : "");
    const lvl = isBonus ? "9★" : h.level;
    if (h.isLink)
      div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><div class="hint-text"><a class="hint-link" href="${h.value}" target="_blank">${h.display}</a></div>`;
    else if (h.isImage)
      div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><img src="https://a.storyblok.com/f/161938/1200x676/d33939c7f6/counting-cards-in-blackjack.jpg" alt="Blackjack" style="max-width:100%;max-height:90px;display:block;margin-top:6px;border:1px solid var(--border)">`;
    else
      div.innerHTML = `<div class="hint-level">◈ LVL ${lvl} — ${h.label}</div><div class="hint-text">${h.display}</div>`;
    fhl.appendChild(div);
  });
  document.getElementById("finalAnswer").value = "";
  document.getElementById("finalResponse").textContent = "";
  showScreen("screen-final");
}

function onNameInput() {
  const val = document.getElementById("finalAnswer").value.trim();
  document.getElementById("finalResponse").textContent =
    val.length > 0 ? "ไม่บอกหรอก555 😛" : "";
}

// NOTIFICATIONS
function showNotification(msg) {
  const n = document.createElement("div");
  n.className = "notification";
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// GAME BUILDER
function buildGame(type, levelId) {
  const c = document.getElementById("gameContainer");
  c.innerHTML = "";
  const builders = {
    reaction: buildReaction,
    memory: buildMemory,
    sequence: buildSequenceOrder,
    platformer: buildPlatformer,
    logic: buildLogic,
    dragsort: buildDragSort,
    decode7: buildDecode7,
    frequency: buildFrequency,
    cardriving: buildCarDriving,
    ctf: buildCTF,
    bonus: buildBonusGame,
  };
  if (builders[type]) builders[type](c, levelId);
}

// GAME 1: REACTION
function buildReaction(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Click 5 glowing targets before they disappear!";
  container.innerHTML = `<div style="font-family:var(--mono);font-size:13px;color:var(--text2);margin-bottom:12px;letter-spacing:2px">TARGETS: <span id="rScore" class="text-accent">0</span> / 5</div><div class="reaction-area" id="reactionArea"></div>`;
  let score = 0;
  const area = document.getElementById("reactionArea");
  function spawn() {
    if (!gameActive) return;
    const old = area.querySelector(".reaction-target");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "reaction-target";
    const mx = area.offsetWidth - 90,
      my = area.offsetHeight - 90;
    t.style.left = 20 + Math.random() * mx + "px";
    t.style.top = 20 + Math.random() * my + "px";
    t.onclick = (e) => {
      e.stopPropagation();
      if (!gameActive) return;
      playBeep(600, 0.08, "sine", 0.15);
      score++;
      document.getElementById("rScore").textContent = score;
      t.remove();
      if (score >= 5) {
        completeLevel(levelId);
        return;
      }
      setTimeout(spawn, 250);
    };
    area.appendChild(t);
    setTimeout(() => {
      if (t.parentNode && gameActive) {
        t.remove();
        setTimeout(spawn, 150);
      }
    }, 1800);
  }
  setTimeout(spawn, 500);
}

// GAME 2: MEMORY (bigger)
function buildMemory(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Watch the pattern, then click the same cells. 3 rounds — pattern grows each round.";
  const SIZE = 4;
  let pattern = [],
    playerInput = [],
    phase = "show",
    round = 1;
  container.innerHTML = `<div class="memory-status" id="memStatus">MEMORIZE...</div><div class="memory-grid" id="memGrid"></div>`;
  const grid = document.getElementById("memGrid"),
    status = document.getElementById("memStatus");
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "memory-cell";
    cell.dataset.idx = i;
    grid.appendChild(cell);
  }
  function getCells() {
    return grid.querySelectorAll(".memory-cell");
  }
  function showPattern() {
    phase = "show";
    status.textContent = "ROUND " + round + "/3 — MEMORIZE...";
    getCells().forEach((c) => c.classList.remove("lit", "correct", "wrong"));
    let i = 0;
    function litNext() {
      if (i >= pattern.length) {
        setTimeout(startInput, 700);
        return;
      }
      getCells()[pattern[i]].classList.add("lit");
      setTimeout(() => {
        getCells()[pattern[i]].classList.remove("lit");
        i++;
        setTimeout(litNext, 350);
      }, 550);
    }
    setTimeout(litNext, 500);
  }
  function startInput() {
    phase = "input";
    playerInput = [];
    status.textContent = "REPRODUCE: 0/" + pattern.length;
    getCells().forEach((cell, idx) => {
      cell.onclick = () => {
        if (phase !== "input" || !gameActive) return;
        playClick();
        playerInput.push(idx);
        if (
          playerInput[playerInput.length - 1] !==
          pattern[playerInput.length - 1]
        ) {
          cell.classList.add("wrong");
          setTimeout(() => {
            cell.classList.remove("wrong");
            playerInput = [];
            status.textContent = "WRONG! REPLAYING...";
            playError();
            setTimeout(showPattern, 700);
          }, 500);
          return;
        }
        cell.classList.add("correct");
        setTimeout(() => cell.classList.remove("correct"), 350);
        status.textContent =
          "REPRODUCE: " + playerInput.length + "/" + pattern.length;
        if (playerInput.length === pattern.length) {
          round++;
          if (round > 3) {
            completeLevel(levelId);
            return;
          }
          pattern.push(Math.floor(Math.random() * SIZE * SIZE));
          status.textContent = "✓ CORRECT! NEXT ROUND...";
          setTimeout(showPattern, 900);
        }
      };
    });
  }
  for (let i = 0; i < 3; i++)
    pattern.push(Math.floor(Math.random() * SIZE * SIZE));
  showPattern();
}

// GAME 3: SEQUENCE (Italian)
function buildSequenceOrder(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Drag the items to the correct order.";
  const correctOrder = ["Primo", "Secondo", "Terzo", "Quarto", "Quinto"];
  let order = [...correctOrder].sort(() => Math.random() - 0.5);
  container.innerHTML = `<div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-bottom:16px;letter-spacing:2px;text-align:center">Arrange in the correct order</div><div class="sequence-items" id="seqList"></div><div class="mt16"><button class="btn-sm" onclick="_checkItalian()">▶ VERIFY ORDER</button></div>`;
  function renderList() {
    const list = document.getElementById("seqList");
    list.innerHTML = "";
    order.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "seq-item";
      div.draggable = true;
      div.innerHTML = `<span class="seq-handle">⠿</span><span class="seq-num">${i + 1}</span><span style="font-size:18px;font-family:var(--body);font-weight:600">${item}</span>`;
      div.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", i);
        div.classList.add("dragging");
      };
      div.ondragend = () => div.classList.remove("dragging");
      div.ondragover = (e) => {
        e.preventDefault();
        div.classList.add("drag-over");
      };
      div.ondragleave = () => div.classList.remove("drag-over");
      div.ondrop = (e) => {
        e.preventDefault();
        div.classList.remove("drag-over");
        const f = parseInt(e.dataTransfer.getData("text/plain"));
        const tmp = order[f];
        order[f] = order[i];
        order[i] = tmp;
        playClick();
        renderList();
      };
      list.appendChild(div);
    });
  }
  window._checkItalian = () => {
    if (order.every((item, i) => item === correctOrder[i]))
      completeLevel(levelId);
    else {
      showNotification("⊘ WRONG ORDER — TRY AGAIN");
      playError();
    }
  };
  renderList();
}
// GAME 4: PLATFORMER
function buildPlatformer(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Arrow keys / WASD to move & jump. Collect all ★ stars!";
  const W = 640,
    H = 380;
  container.innerHTML = `<div style="font-family:var(--mono);font-size:13px;color:var(--text2);margin-bottom:10px;letter-spacing:2px">STARS: <span id="pStars" class="text-accent">0</span> / 5</div><canvas id="pfCanvas" width="${W}" height="${H}" style="max-width:100%;border:1px solid var(--border);image-rendering:pixelated"></canvas>`;
  const canvas = document.getElementById("pfCanvas"),
    ctx = canvas.getContext("2d");
  const GRAV = 0.55,
    JUMP = -13,
    SPD = 4;
  const plats = [
    { x: 0, y: 340, w: W, h: 40 },
    { x: 110, y: 260, w: 130, h: 14 },
    { x: 300, y: 190, w: 130, h: 14 },
    { x: 480, y: 260, w: 130, h: 14 },
    { x: 190, y: 125, w: 120, h: 14 },
  ];
  const stars = [
    { x: 155, y: 228, c: false },
    { x: 345, y: 158, c: false },
    { x: 520, y: 228, c: false },
    { x: 235, y: 94, c: false },
    { x: 55, y: 308, c: false },
  ];
  const p = { x: 40, y: 280, w: 26, h: 34, vx: 0, vy: 0, ground: false };
  const keys = {};
  let sc = 0;
  const kd = (e) => {
    keys[e.key] = true;
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
    )
      e.preventDefault();
  };
  const ku = (e) => {
    keys[e.key] = false;
  };
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  function aabb(a, b) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }
  function update() {
    if (!gameActive) return;
    const L = keys["ArrowLeft"] || keys["a"] || keys["A"];
    const R = keys["ArrowRight"] || keys["d"] || keys["D"];
    const J = keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "];
    if (L) p.vx = -SPD;
    else if (R) p.vx = SPD;
    else p.vx *= 0.7;
    if (J && p.ground) {
      p.vy = JUMP;
      p.ground = false;
      playBeep(500, 0.08);
    }
    p.vy += GRAV;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > W) p.x = W - p.w;
    if (p.y > H) {
      p.y = 0;
      p.vy = 0;
    }
    p.ground = false;
    plats.forEach((pl) => {
      if (aabb(p, pl)) {
        const ox = Math.min(p.x + p.w - pl.x, pl.x + pl.w - p.x),
          oy = Math.min(p.y + p.h - pl.y, pl.y + pl.h - p.y);
        if (oy < ox) {
          if (p.vy > 0 && p.y + p.h - p.vy <= pl.y + 2) {
            p.y = pl.y - p.h;
            p.vy = 0;
            p.ground = true;
          } else if (p.vy < 0) {
            p.y = pl.y + pl.h;
            p.vy = 0;
          }
        } else {
          p.x += p.vx > 0 ? -ox : ox;
          p.vx = 0;
        }
      }
    });
    stars.forEach((s) => {
      if (
        !s.c &&
        Math.abs(p.x + p.w / 2 - s.x) < 24 &&
        Math.abs(p.y + p.h / 2 - s.y) < 24
      ) {
        s.c = true;
        sc++;
        document.getElementById("pStars").textContent = sc;
        playBeep(880, 0.1);
        setTimeout(() => playBeep(1100, 0.1), 100);
        if (sc >= stars.length) completeLevel(levelId);
      }
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a1520";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,229,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#1a3a50";
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    plats.forEach((pl) => {
      ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
    });
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    stars.forEach((s) => {
      if (!s.c) {
        ctx.fillStyle = "#ffcc00";
        ctx.fillText("★", s.x, s.y);
      }
    });
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#007a99";
    ctx.fillRect(p.x + 4, p.y, 18, 12);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(p.x - 4, p.y + 12, 8, 10);
    ctx.fillRect(p.x + p.w - 4, p.y + 12, 8, 10);
    ctx.fillRect(p.x - 4, p.y + 30, 8, 10);
    ctx.fillRect(p.x + p.w - 4, p.y + 30, 8, 10);
  }
  platformerInterval = setInterval(() => {
    update();
    draw();
  }, 1000 / 60);
}

// GAME 5: LOGIC
function buildLogic(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Answer 3 logic questions correctly to complete.";
  const qs = [
    {
      q: "Which completes the pattern? 2, 4, 8, 16, ?",
      opts: ["24", "28", "32", "36"],
      correct: 2,
    },
    {
      q: 'Caesar +3: "EHOOR" decodes to?',
      opts: ["BONJOUR", "HELLO", "WORLD", "CYBER"],
      correct: 1,
    },
    {
      q: "Odd one out: AGENT, CIPHER, DECODE, BAKERY, SIGNAL",
      opts: ["AGENT", "CIPHER", "BAKERY", "SIGNAL"],
      correct: 2,
    },
  ];
  let qi = 0,
    cc = 0;
  function showQ() {
    const q = qs[qi];
    container.innerHTML = `<div style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:2px;margin-bottom:16px">Q ${qi + 1}/3  ✓ ${cc}</div><div class="logic-question">${q.q}</div><div class="logic-options">${q.opts.map((o, i) => `<div class="logic-opt" data-i="${i}">${o}</div>`).join("")}</div>`;
    container.querySelectorAll(".logic-opt").forEach((btn, i) => {
      btn.onclick = () => {
        if (!gameActive) return;
        if (i === q.correct) {
          btn.classList.add("correct");
          playBeep(660, 0.1);
          cc++;
          qi++;
          if (qi >= qs.length) {
            setTimeout(() => completeLevel(levelId), 500);
            return;
          }
          setTimeout(showQ, 700);
        } else {
          btn.classList.add("wrong");
          playError();
          container
            .querySelectorAll(".logic-opt")
            [q.correct].classList.add("correct");
          setTimeout(showQ, 1000);
        }
      };
    });
  }
  showQ();
}

// GAME 6: DRAG SORT
function buildDragSort(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Drag each token to the correct category: IMAGE or MEDIA. Sort all 6 correctly.";
  const tokens = [
    { label: "AUDIO", cat: "MEDIA" },
    { label: "JPEG", cat: "IMAGE" },
    { label: "MP3", cat: "MEDIA" },
    { label: "PNG", cat: "IMAGE" },
    { label: "VIDEO", cat: "MEDIA" },
    { label: "SVG", cat: "IMAGE" },
  ];
  let sorted = { IMAGE: [], MEDIA: [] };
  const shuffled = [...tokens].sort(() => Math.random() - 0.5);
  function render() {
    container.innerHTML = `<div style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:2px;margin-bottom:16px">DRAG TOKENS TO CORRECT CATEGORY</div><div class="drop-zones"><div><div style="font-family:var(--mono);font-size:10px;color:var(--accent2);letter-spacing:2px;margin-bottom:6px">IMAGE FILES</div><div class="drop-zone ${sorted.IMAGE.length ? "filled" : ""}" id="zoneI">${sorted.IMAGE.length ? sorted.IMAGE.join(", ") : "DROP HERE"}</div></div><div><div style="font-family:var(--mono);font-size:10px;color:var(--accent);letter-spacing:2px;margin-bottom:6px">MEDIA FILES</div><div class="drop-zone ${sorted.MEDIA.length ? "filled" : ""}" id="zoneM">${sorted.MEDIA.length ? sorted.MEDIA.join(", ") : "DROP HERE"}</div></div></div><div class="drag-tokens" id="tokenBag"></div><div class="mt16"><button class="btn-sm" onclick="_checkSort()">▶ VERIFY SORTING</button></div>`;
    const bag = document.getElementById("tokenBag");
    const placed = [...sorted.IMAGE, ...sorted.MEDIA];
    shuffled.forEach((tok) => {
      if (placed.includes(tok.label)) return;
      const el = document.createElement("div");
      el.className = "drag-token";
      el.draggable = true;
      el.textContent = tok.label;
      el.ondragstart = (e) =>
        e.dataTransfer.setData("text/plain", tok.label + "|" + tok.cat);
      bag.appendChild(el);
    });
    [
      ["IMAGE", "zoneI"],
      ["MEDIA", "zoneM"],
    ].forEach(([cat, zid]) => {
      const zone = document.getElementById(zid);
      zone.ondragover = (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
      };
      zone.ondragleave = () => zone.classList.remove("drag-over");
      zone.ondrop = (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        const [label, tc] = e.dataTransfer.getData("text/plain").split("|");
        if (cat === tc && !sorted[cat].includes(label)) {
          sorted[cat].push(label);
          playBeep(660, 0.08);
        } else {
          playError();
          showNotification("⊘ WRONG CATEGORY");
        }
        render();
      };
    });
    window._checkSort = () => {
      if (sorted.IMAGE.length + sorted.MEDIA.length < 6) {
        showNotification("⊘ SORT ALL TOKENS FIRST");
        return;
      }
      const ok =
        sorted.IMAGE.every(
          (l) => tokens.find((t) => t.label === l).cat === "IMAGE",
        ) &&
        sorted.MEDIA.every(
          (l) => tokens.find((t) => t.label === l).cat === "MEDIA",
        );
      if (ok) completeLevel(levelId);
      else {
        showNotification("⊘ INCORRECT SORTING");
        playError();
        sorted = { IMAGE: [], MEDIA: [] };
        render();
      }
    };
  }
  render();
}

// GAME 7: CIPHER DECODE (original gameplay) — image unlocked in hint panel after completion
function buildDecode7(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    'Caesar cipher +3 shift. Decode "EOXHMDFN" → shift each letter back 3. Type the answer and submit.';
  const encoded = "EOXHMDFN",
    answer = "BLACKJACK";
  container.innerHTML = `
    <div style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:2px;margin-bottom:14px">SHIFT CIPHER — DECODE BY MOVING EACH LETTER BACK 3</div>
    <div style="font-family:var(--mono);font-size:32px;letter-spacing:10px;color:var(--accent);text-align:center;background:var(--bg2);border:1px solid var(--border);padding:20px 32px;margin-bottom:20px;position:relative;overflow:hidden">
      <span style="position:relative;z-index:1">${encoded}</span>
      <span style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent,rgba(0,229,255,0.04),transparent);animation:sweep 2s linear infinite"></span>
    </div>
    <style>@keyframes sweep{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:20px" id="d7inputs"></div>
    <button class="btn-sm" onclick="_checkDecode7('${answer}',${levelId})">▶ VERIFY DECODE</button>
    <div id="d7err" style="font-family:var(--mono);font-size:11px;color:var(--danger);height:18px;margin-top:8px;letter-spacing:1px"></div>`;
  const inp = document.getElementById("d7inputs");
  for (let i = 0; i < 9; i++) {
    const el = document.createElement("input");
    el.maxLength = 1;
    el.style.cssText =
      "width:38px;height:48px;background:var(--bg2);border:1px solid var(--border);color:var(--accent);font-family:var(--mono);font-size:20px;text-align:center;text-transform:uppercase;outline:none;transition:border-color 0.2s";
    el.addEventListener(
      "focus",
      () => (el.style.borderColor = "var(--accent)"),
    );
    el.addEventListener("blur", () => (el.style.borderColor = "var(--border)"));
    el.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
      if (e.target.value && i < 8) inp.querySelectorAll("input")[i + 1].focus();
      playClick();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && i > 0)
        inp.querySelectorAll("input")[i - 1].focus();
    });
    inp.appendChild(el);
  }
  inp.querySelectorAll("input")[0].focus();
  window._checkDecode7 = (ans, lvl) => {
    const typed = Array.from(inp.querySelectorAll("input"))
      .map((i) => i.value)
      .join("")
      .toUpperCase();
    if (typed === ans) {
      completeLevel(lvl);
    } else {
      const e = document.getElementById("d7err");
      if (e) {
        e.textContent =
          "⊘ WRONG — TRY AGAIN (hint: shift A→X, B→Y, C→Z, D→A...)";
        setTimeout(() => {
          if (e) e.textContent = "";
        }, 3000);
      }
      playError();
    }
  };
}

// GAME 8: FREQUENCY
function buildFrequency(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "Convert each binary number to decimal. Answer 3 correctly.";
  const patterns = [
    { bits: "1010", decimal: 10, options: ["8", "10", "12", "14"] },
    { bits: "0110", decimal: 6, options: ["4", "5", "6", "7"] },
    { bits: "1100", decimal: 12, options: ["10", "11", "12", "13"] },
  ];
  let round = 0;
  function showRound() {
    const p = patterns[round];
    container.innerHTML = `<div style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:2px;margin-bottom:16px">ROUND ${round + 1}/3 — BINARY → DECIMAL</div><div class="binary-display">BINARY: <span style="color:var(--accent);font-size:28px;letter-spacing:10px">${p.bits}</span></div><div style="font-family:var(--mono);font-size:12px;color:var(--text3);text-align:center;margin:16px 0;letter-spacing:2px">DECIMAL VALUE?</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:260px">${p.options.map((o) => `<div class="cipher-btn" onclick="_checkFreq(${parseInt(o)},${p.decimal},${levelId})">${o}</div>`).join("")}</div>`;
  }
  window._checkFreq = (val, correct, lvl) => {
    if (!gameActive) return;
    const btns = container.querySelectorAll(".cipher-btn");
    if (val === correct) {
      btns.forEach((b) => {
        if (parseInt(b.textContent) === val) b.classList.add("correct");
      });
      playBeep(660, 0.1);
      setTimeout(() => playBeep(880, 0.1), 120);
      round++;
      if (round >= patterns.length) {
        setTimeout(() => completeLevel(lvl), 400);
        return;
      }
      setTimeout(showRound, 600);
    } else {
      btns.forEach((b) => {
        if (parseInt(b.textContent) === val) b.classList.add("wrong");
      });
      playError();
      setTimeout(() => btns.forEach((b) => b.classList.remove("wrong")), 400);
    }
  };
  showRound();
}

// GAME 9: PIXEL CAR DRIVING — HARD MODE
function buildCarDriving(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "← → / A D to steer. Collect ★ stars (need 12). Avoid ✕ obstacles & ◆ moving enemies. 3 lives. Must survive 45s!";
  const W = 640,
    H = 420;
  // Narrower road
  const RL = 140,
    RR = W - 140,
    RW = W - 280;
  container.innerHTML = `
    <div style="font-family:var(--mono);font-size:12px;color:var(--text2);margin-bottom:8px;letter-spacing:2px;display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
      <span>STARS: <span id="cStars" class="text-accent" style="font-size:15px">0</span>/12</span>
      <span>LIVES: <span id="cLives" class="text-accent2" style="font-size:15px">3</span></span>
      <span>TIME: <span id="cTimer" style="color:var(--warn);font-size:15px">45</span>s</span>
    </div>
    <canvas id="carCanvas" width="${W}" height="${H}" style="max-width:100%;border:1px solid var(--border);image-rendering:pixelated"></canvas>
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:6px;letter-spacing:2px;text-align:center">← → or A D to move | Collect ★, avoid ✕ and ◆</div>`;
  const canvas = document.getElementById("carCanvas"),
    ctx = canvas.getContext("2d");
  let cstars = [],
    cobs = [],
    cenemies = [],
    cparts = [];
  let cx = W / 2 - 16,
    cy = H - 110,
    cvx = 0;
  let sc = 0,
    lives = 3,
    invincible = 0,
    spawnT = 0,
    starT = 0,
    enemyT = 0,
    bonusDone = false;
  let surviveTimer = 45,
    surviveInterval = null;
  const keys2 = {};
  const kd2 = (e) => {
    keys2[e.key] = true;
  };
  const ku2 = (e) => {
    keys2[e.key] = false;
  };
  window.addEventListener("keydown", kd2);
  window.addEventListener("keyup", ku2);

  // Countdown timer
  surviveInterval = setInterval(() => {
    if (!gameActive) {
      clearInterval(surviveInterval);
      return;
    }
    surviveTimer--;
    const te = document.getElementById("cTimer");
    if (te) te.textContent = surviveTimer;
    if (surviveTimer <= 0) {
      clearInterval(surviveInterval);
    }
  }, 1000);

  function upd() {
    if (!gameActive) return;
    const L = keys2["ArrowLeft"] || keys2["a"] || keys2["A"];
    const R = keys2["ArrowRight"] || keys2["d"] || keys2["D"];
    if (L) cvx -= 1.1;
    if (R) cvx += 1.1;
    cvx *= 0.8;
    cx += cvx;
    if (cx < RL + 4) {
      cx = RL + 4;
      cvx = 0;
    }
    if (cx + 32 > RR) {
      cx = RR - 32;
      cvx = 0;
    }

    const spd = 6; // faster base speed
    // Spawn static obstacles — faster & more frequent
    spawnT++;
    if (spawnT > 28) {
      cobs.push({
        x: RL + 10 + Math.random() * (RW - 50),
        y: -44,
        vy: 5 + Math.random() * 4,
        w: 38,
        h: 26,
      });
      if (Math.random() > 0.5)
        cobs.push({
          x: RL + 10 + Math.random() * (RW - 50),
          y: -90,
          vy: 4 + Math.random() * 4,
          w: 38,
          h: 26,
        });
      spawnT = 0;
    }
    // Stars — more frequent
    starT++;
    if (starT > 22) {
      cstars.push({
        x: RL + 14 + Math.random() * (RW - 28),
        y: -30,
        vy: 4 + Math.random() * 2,
      });
      starT = 0;
    }
    // Moving enemies that zigzag
    enemyT++;
    if (enemyT > 60) {
      const side = Math.random() > 0.5 ? 1 : -1;
      cenemies.push({
        x: RL + RW / 2,
        y: -50,
        vy: 4 + Math.random() * 3,
        vx: side * 2.5,
        w: 34,
        h: 34,
        phase: Math.random() * Math.PI * 2,
      });
      enemyT = 0;
    }

    cobs.forEach((o) => (o.y += spd));
    cstars.forEach((s) => (s.y += spd));
    // Enemies zigzag
    cenemies.forEach((e) => {
      e.y += spd;
      e.phase += 0.06;
      e.x += Math.sin(e.phase) * 3.5;
      if (e.x < RL + 4) e.x = RL + 4;
      if (e.x + e.w > RR) e.x = RR - e.w;
    });

    cobs = cobs.filter((o) => o.y < H + 60);
    cstars = cstars.filter((s) => s.y < H + 60);
    cenemies = cenemies.filter((e) => e.y < H + 60);
    if (invincible > 0) invincible--;

    // Collect stars
    cstars = cstars.filter((s) => {
      const hit =
        cx < s.x + 14 &&
        cx + 32 > s.x - 14 &&
        cy < s.y + 14 &&
        cy + 44 > s.y - 14;
      if (hit) {
        sc++;
        const se = document.getElementById("cStars");
        if (se) se.textContent = sc;
        playBeep(880, 0.08);
        setTimeout(() => playBeep(1100, 0.08), 90);
        if (sc >= 6 && !bonusDone) {
          bonusDone = true;
          showNotification("★ BONUS ROUND UNLOCKED!");
        }
        if (sc >= 12 && surviveTimer <= 0) {
          completeLevel(levelId);
        } else if (sc >= 12) {
          showNotification("★ Keep driving — survive the timer!");
          playBeep(600, 0.1);
        }
      }
      return !hit;
    });

    // Check win condition: 12 stars AND timer done
    if (sc >= 12 && surviveTimer <= 0 && gameActive) {
      completeLevel(levelId);
    }

    // Static obstacle collision — PENALTY: lose a star too
    if (invincible === 0) {
      let hitObs = false;
      cobs = cobs.filter((o) => {
        const hit =
          cx < o.x + o.w && cx + 32 > o.x && cy < o.y + o.h && cy + 44 > o.y;
        if (hit && !hitObs) {
          hitObs = true;
          lives--;
          invincible = 80;
          playError();
          if (sc > 0) {
            sc = Math.max(0, sc - 1);
            const se = document.getElementById("cStars");
            if (se) se.textContent = sc;
          } // star penalty
          const le = document.getElementById("cLives");
          if (le) le.textContent = lives;
          for (let i = 0; i < 10; i++)
            cparts.push({
              x: cx + 16,
              y: cy + 22,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 35,
              col: "#ff3366",
            });
          if (lives <= 0) {
            clearInterval(surviveInterval);
            gameActive = false;
            showNotification("⚠ OUT OF LIVES — RESTARTING...");
            setTimeout(() => startLevel(levelId), 2000);
          }
        }
        return !hit;
      });
      // Enemy collision — BIGGER penalty: lose 2 stars
      cenemies = cenemies.filter((e) => {
        const hit =
          cx < e.x + e.w && cx + 32 > e.x && cy < e.y + e.h && cy + 44 > e.y;
        if (hit && !hitObs) {
          hitObs = true;
          lives--;
          invincible = 100;
          playError();
          sc = Math.max(0, sc - 2);
          const se = document.getElementById("cStars");
          if (se) se.textContent = sc;
          const le = document.getElementById("cLives");
          if (le) le.textContent = lives;
          for (let i = 0; i < 14; i++)
            cparts.push({
              x: cx + 16,
              y: cy + 22,
              vx: (Math.random() - 0.5) * 9,
              vy: (Math.random() - 0.5) * 9,
              life: 40,
              col: "#ff6b35",
            });
          if (lives <= 0) {
            clearInterval(surviveInterval);
            gameActive = false;
            showNotification("⚠ OUT OF LIVES — RESTARTING...");
            setTimeout(() => startLevel(levelId), 2000);
          }
        }
        return !hit;
      });
    }
    cparts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.life--;
    });
    cparts = cparts.filter((p) => p.life > 0);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Background
    ctx.fillStyle = "#0a1520";
    ctx.fillRect(0, 0, W, H);
    // Grass (narrower)
    ctx.fillStyle = "#0d2a0d";
    ctx.fillRect(0, 0, RL, H);
    ctx.fillRect(RR, 0, W - RR, H);
    // Road
    ctx.fillStyle = "#1a2a3a";
    ctx.fillRect(RL, 0, RW, H);
    // Dashed center line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.setLineDash([28, 28]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
    // Road edges
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(RL, 0);
    ctx.lineTo(RL, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(RR, 0);
    ctx.lineTo(RR, H);
    ctx.stroke();

    // Static obstacles (red)
    cobs.forEach((o) => {
      ctx.fillStyle = "#ff3366";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#fff";
      ctx.font = "13px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✕", o.x + o.w / 2, o.y + o.h / 2);
    });
    // Moving enemies (orange diamond)
    cenemies.forEach((e) => {
      ctx.fillStyle = "#ff6b35";
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect((-e.w / 2) * 0.8, (-e.h / 2) * 0.8, e.w * 0.8, e.h * 0.8);
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("◆", e.x + e.w / 2, e.y + e.h / 2);
    });
    // Stars
    cstars.forEach((s) => {
      ctx.fillStyle = "#ffcc00";
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", s.x, s.y);
    });

    // Player car
    const alpha =
      invincible > 0 ? (Math.floor(invincible / 6) % 2 ? 0.25 : 1) : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(cx, cy + 10, 32, 34);
    ctx.fillStyle = "#007a99";
    ctx.fillRect(cx + 4, cy, 24, 14);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(cx - 4, cy + 14, 10, 10);
    ctx.fillRect(cx + 26, cy + 14, 10, 10);
    ctx.fillRect(cx - 4, cy + 32, 10, 10);
    ctx.fillRect(cx + 26, cy + 32, 10, 10);
    ctx.globalAlpha = 1;

    // Particles
    cparts.forEach((p) => {
      ctx.globalAlpha = p.life / 40;
      ctx.fillStyle = p.col || "#ff6b35";
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.globalAlpha = 1;
    });

    // Survive timer overlay warning
    if (surviveTimer > 0 && surviveTimer <= 10) {
      ctx.fillStyle = `rgba(255,51,102,${0.08 + 0.04 * Math.sin(Date.now() / 200)})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Win condition status
    if (sc >= 12 && surviveTimer > 0) {
      ctx.fillStyle = "rgba(0,255,136,0.12)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "var(--accent2)";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("★ STARS COLLECTED — SURVIVE THE TIMER! ★", W / 2, 12);
    }
  }
  carInterval = setInterval(() => {
    upd();
    draw();
  }, 1000 / 60);
}

// GAME 10: CTF — answer hidden as HTML comment "<!-- answer: bangkokth -->"
function buildCTF(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "This page looks empty. Only the input box and one hint are visible. The answer is hidden in the HTML source of this page. Right-click → View Page Source to find it!";
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;gap:24px;width:100%">
      <div style="font-family:var(--mono);font-size:13px;color:var(--text3);letter-spacing:2px;text-align:center">The answer is in this page</div>
      <input id="ctfInput" type="text" placeholder="ENTER THE ANSWER..." autocomplete="off" maxlength="30"
        style="background:var(--bg2);border:1px solid var(--border);border-bottom:2px solid var(--accent);color:var(--text);font-family:var(--mono);font-size:16px;padding:12px 20px;outline:none;width:300px;letter-spacing:2px;text-align:center">
      <button class="btn-sm" onclick="_checkCTF(${levelId})">▶ SUBMIT</button>
      <div id="ctfErr" style="font-family:var(--mono);font-size:11px;color:var(--danger);height:18px;letter-spacing:1px;text-align:center"></div>
    </div>`;
  document.getElementById("ctfInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && window._checkCTF) window._checkCTF(levelId);
  });
  window._checkCTF = (lvl) => {
    const val = document
      .getElementById("ctfInput")
      .value.trim()
      .toLowerCase()
      .replace(/\s/g, "");
    if (val === "bangkokth" || val === "bangkok") {
      completeLevel(lvl);
    } else {
      const e = document.getElementById("ctfErr");
      if (e) {
        e.textContent =
          "⊘ WRONG — CHECK THE PAGE SOURCE (right-click → View Page Source)";
        setTimeout(() => {
          if (e) e.textContent = "";
        }, 3000);
      }
      playError();
    }
  };
}

// BONUS GAME: Katekyo Hitman Reborn! Trivia Quiz
function buildBonusGame(container, levelId) {
  document.getElementById("gameInstructions").textContent =
    "ตอบคำถามเกี่ยวกับ Katekyo Hitman Reborn! ให้ครบ 5 ข้อ เพื่อ unlock bonus intel!";

  const questions = [
    {
      q: "ตัวละครหลักของ Katekyo Hitman Reborn! ชื่อว่าอะไร?",
      opts: [
        "Sawada Tsunayoshi",
        "Gokudera Hayato",
        "Sasagawa Ryohei",
        "Hibari Kyoya",
      ],
      ans: 0,
    },
    {
      q: "Reborn ใช้ปืนชนิดใดยิง Tsuna เพื่อเปลี่ยนเขาเป็น Hyper Dying Will Mode?",
      opts: [
        "Dying Will Bullet",
        "Rebuke Bullet",
        "Criticism Shot",
        "Mach Bullet",
      ],
      ans: 0,
    },
    {
      q: "Arcobaleno ที่เป็นครูของ Tsuna และเป็นทารกสวมหมวกสีดำคือใคร?",
      opts: ["Reborn", "Colonnello", "Skull", "Viper"],
      ans: 0,
    },
    {
      q: '"Cloud Flame" เป็น Flame สีอะไร?',
      opts: ["ม่วง", "ส้ม", "เขียว", "แดง"],
      ans: 0,
    },
    {
      q: "อาวุธเด่นของ Gokudera Hayato คืออะไร?",
      opts: ["ไดนาไมต์", "กีตาร์ไฟฟ้า", "ดาบ", "โซ่"],
      ans: 0,
    },
    {
      q: "ครอบครัวมาเฟียที่ Tsuna เป็นทายาทคือ?",
      opts: ["Vongola", "Millefiore", "Cavallone", "Giglio Nero"],
      ans: 0,
    },
    {
      q: "Hibari Kyoya มักพูดประโยคใดบ่อยที่สุด?",
      opts: [
        '\"I\'ll bite you to death\"',
        '\"Extreme!\"',
        '\"I\'ll destroy you\"',
        '\"Ten times better\"',
      ],
      ans: 0,
    },
    {
      q: "X-BURNER เป็นท่าไม้ตายของ?",
      opts: ["Tsuna", "Gokudera", "Yamamoto", "Ryohei"],
      ans: 0,
    },
    {
      q: "อาวุธของ Yamamoto Takeshi ที่แท้จริงคืออะไร?",
      opts: ["ดาบซามูไร (Shigure Kintoki)", "ไม้เบสบอล", "หอก", "โซ่สมอ"],
      ans: 0,
    },
    {
      q: "Varia คือกลุ่มนักฆ่าชั้นยอดของครอบครัวใด?",
      opts: ["Vongola", "Millefiore", "Simon", "Giglio Nero"],
      ans: 0,
    },
  ];

  // Shuffle and pick 5
  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
  let current = 0,
    correct = 0;

  function render() {
    if (current >= shuffled.length) {
      if (correct >= 5) {
        container.innerHTML = `<div style="text-align:center;font-family:var(--mono)">
          <div style="font-size:48px;margin-bottom:16px">🔥</div>
          <div style="font-size:18px;color:var(--warn);letter-spacing:2px;margin-bottom:8px">★ HYPER DYING WILL MODE ★</div>
          <div style="color:var(--text2);font-size:14px">ตอบถูกครบ ${correct}/5 ข้อ — Bonus Intel ถูก unlock แล้ว!</div>
        </div>`;
        setTimeout(() => completeLevel(levelId), 1800);
      } else {
        container.innerHTML = `<div style="text-align:center;font-family:var(--mono)">
          <div style="font-size:40px;margin-bottom:16px">💀</div>
          <div style="font-size:16px;color:var(--danger);letter-spacing:2px;margin-bottom:12px">ตอบถูก ${correct}/5 ข้อ — ไม่ผ่าน!</div>
          <button class="btn-sm" style="margin-top:8px" onclick="startBonusLevel()">▶ ลองใหม่</button>
        </div>`;
      }
      return;
    }
    const q = shuffled[current];
    const shuffledOpts = [
      ...q.opts.map((o, i) => ({ text: o, correct: i === q.ans })),
    ].sort(() => Math.random() - 0.5);
    container.innerHTML = `
      <div style="width:100%;max-width:540px">
        <div style="font-family:var(--mono);font-size:11px;color:var(--warn);letter-spacing:2px;margin-bottom:16px;text-align:center">
          ★ REBORN TRIVIA ★ &nbsp;|&nbsp; ข้อ ${current + 1}/5 &nbsp;|&nbsp; ถูก: <span style="color:var(--accent2)">${correct}</span>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--warn);padding:20px 24px;margin-bottom:20px;font-family:var(--body);font-size:17px;font-weight:600;color:var(--text);line-height:1.5">
          ${q.q}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${shuffledOpts
            .map(
              (o, i) => `
            <button class="logic-opt" data-correct="${o.correct}" onclick="bonusAnswer(this,${o.correct})">${o.text}</button>
          `,
            )
            .join("")}
        </div>
        <div id="bonusFeedback" style="font-family:var(--mono);font-size:12px;text-align:center;margin-top:14px;min-height:20px;letter-spacing:1px"></div>
      </div>`;
  }

  window.bonusAnswer = (btn, isCorrect) => {
    if (!gameActive) return;
    const allBtns = container.querySelectorAll(".logic-opt");
    allBtns.forEach((b) => {
      b.onclick = null;
      b.style.pointerEvents = "none";
    });
    const fb = document.getElementById("bonusFeedback");
    if (isCorrect) {
      btn.classList.add("correct");
      correct++;
      playBeep(880, 0.08);
      setTimeout(() => playBeep(1100, 0.08), 80);
      fb.style.color = "var(--accent2)";
      fb.textContent = "✓ ถูกต้อง!";
    } else {
      btn.classList.add("wrong");
      // show correct
      allBtns.forEach((b) => {
        if (b.dataset.correct === "true") b.classList.add("correct");
      });
      playError();
      fb.style.color = "var(--danger)";
      fb.textContent = "✗ ผิด!";
    }
    setTimeout(() => {
      current++;
      render();
    }, 1200);
  };

  render();
}

// INIT
loadState();
if (state.skipsLeft === undefined) state.skipsLeft = 2;
if (state.bonusUnlocked === undefined) state.bonusUnlocked = false;
if (!state.agentId) {
  state.agentId = "AGT-" + Math.floor(Math.random() * 9000 + 1000);
  saveState();
}
console.log(
  "%c FIND YOUR SENIOR v3 — CLASSIFIED ",
  "background:#00e5ff;color:#050a0e;font-family:monospace;font-size:14px;font-weight:bold;padding:8px",
);
console.log(
  "%c MISSION 10: Right-click the page → View Page Source to find the hidden answer ",
  "color:#ffcc00;font-family:monospace;font-size:12px",
);
