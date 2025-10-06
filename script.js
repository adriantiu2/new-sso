/* script.js
   Controls:
   - category toggles (show/hide content blocks)
   - global play/pause and speed control
   - shop: bouncing images with links
   - about: hue-rotate animation applied to paragraph
   - stockists: 12 boxes swapping positions
   - interviews: falling names that loop
*/

/* --- Config --- */
const shopImageUrls = [
  "https://picsum.photos/200/310?random=1",
  "https://picsum.photos/200/310?random=2",
  "https://picsum.photos/200/310?random=3",
  "https://picsum.photos/200/310?random=4"
];
const numStockists = 12;
const interviewsList = Array.from({length:15}, (_,i) => `Interviewee ${i+1}`);

/* --- Global state --- */
let playing = true;
let speedMultiplier = 1.0;      // 1x normal, adjustable
const minSpeed = 0.15;
const maxSpeed = 4.0;

/* requestAnimationFrame bookkeeping */
let lastTs = null;
let rafId = null;

/* DOM refs */
const playPauseBtn = document.getElementById("playPauseBtn");
const slowBtn = document.getElementById("slowBtn");
const fastBtn = document.getElementById("fastBtn");
const speedDisplay = document.getElementById("speedDisplay");
const catButtons = document.querySelectorAll(".cat-btn");
const contentBlocks = {
  shop: document.getElementById("shop"),
  about: document.getElementById("about"),
  stockists: document.getElementById("stockists"),
  interviews: document.getElementById("interviews")
};

/* --- CATEGORY TOGGLE LOGIC --- */
catButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    btn.classList.toggle("active");
    const block = contentBlocks[target];
    if (!block) return;
    const isActive = btn.classList.contains("active");
    if (isActive) {
      block.classList.remove("hidden");
      block.setAttribute("aria-hidden", "false");
    } else {
      block.classList.add("hidden");
      block.setAttribute("aria-hidden", "true");
    }
  });
});

/* --- CONTROL PANEL --- */
function updateSpeedDisplay() {
  speedDisplay.textContent = `${Math.round(speedMultiplier*100)/100}×`;
}
playPauseBtn.addEventListener("click", () => {
  playing = !playing;
  // Show the next state icon: if currently playing, show Play (▶); if paused, show Pause (⏸)
  playPauseBtn.textContent = playing ? "⏸" : "▶";
  if (playing) {
    lastTs = null;
    loop(performance.now());
  } else {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
});

slowBtn.addEventListener("click", () => {
  speedMultiplier = Math.max(minSpeed, speedMultiplier * 0.75);
  updateSpeedDisplay();
});

fastBtn.addEventListener("click", () => {
  speedMultiplier = Math.min(maxSpeed, speedMultiplier * 1.25);
  updateSpeedDisplay();
});
updateSpeedDisplay();

/* --- SHOP: bouncing images --- */
const shopArea = document.getElementById("shopArea");
const shopItems = []; // {el, x,y, vx, vy, w,h, link}
function initShop() {
  shopImageUrls.forEach((url,idx) => {
    const a = document.createElement("a");
    a.href = "https://www.w3schools.com"; // placeholder external link
    a.target = "_blank";
    const img = document.createElement("img");
    img.src = url;
    img.className = "shop-item";
    a.appendChild(img);
    shopArea.appendChild(a);
    // random position inside area (use client size for accurate inner bounds)
    const areaW = shopArea.clientWidth;
    const areaH = shopArea.clientHeight;
    const w = 90, h = 140;
    const x = Math.random() * Math.max(1, areaW - w);
    const y = Math.random() * Math.max(1, areaH - h);
    const speed = 80 + Math.random()*120; // px/sec baseline
    const angle = Math.random()*Math.PI*2;
    shopItems.push({ el: a, img, x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, w, h });
    // initialize style: lock left/top to 0 so transform is the sole position source
    a.style.left = `0px`;
    a.style.top = `0px`;
    a.style.width = `${w}px`;
    a.style.height = `${h}px`;
    // set initial transform to match starting position
    a.style.transform = `translate(${x}px, ${y}px)`;
  });
}

/* --- ABOUT: hue rotation --- */
const aboutText = document.getElementById("aboutText");
let aboutHue = 0;

/* --- STOCKISTS: boxes that shuffle/build shapes --- */
const stockistsArea = document.getElementById("stockistsArea");
const stockistBoxes = []; // {el, homeX, homeY, idx}
function initStockists() {
  // create 12 identical boxes with sample addresses
  const area = stockistsArea;
  const areaRect = area.getBoundingClientRect();
  
  // Detect mobile layout (2x6) vs desktop (4x3)
  const isMobile = window.innerWidth <= 800;
  const cols = isMobile ? 2 : 4;
  const rows = isMobile ? 6 : 3;
  
  const pad = 12;
  const boxW = 120;
  const boxH = 70;
  // compute top-left aligned grid within area
  const startX = 8; // near left
  const startY = 8; // near top
  for (let i=0;i<numStockists;i++) {
    const el = document.createElement("div");
    el.className = "stockist-box";
    const shopName = `Shop ${i+1}`;
    const address = `123${i} Star Ave, Suite ${10+i}`;
    el.innerHTML = `<strong>${shopName}</strong><br><small>${address}</small>`;
    area.appendChild(el);
    // compute grid pos
    const r = Math.floor(i/cols);
    const c = i % cols;
    const tx = startX + c * (boxW + pad);
    const ty = startY + r * (boxH + pad);
    el.style.transform = `translate(${tx}px, ${ty}px)`;
    stockistBoxes.push({el, tx, ty, idx: i});
  }
  // start the periodic reshuffle timer handled by animation loop
  stockistsShuffleTimer = 0;
}
let stockistsShuffleTimer = 0;
let stockistsShuffleInterval = 2000; // ms baseline (modified by speed)

/* --- INTERVIEWS: falling names --- */
const interviewsArea = document.getElementById("interviewsArea");
const interviewEls = [];
function initInterviews() {
  // Ensure area has dimensions before positioning
  const areaW = Math.max(interviewsArea.clientWidth, 300); // fallback width
  const areaH = Math.max(interviewsArea.clientHeight, 200); // fallback height
  
  for (let i=0;i<interviewsList.length;i++) {
    const a = document.createElement("a");
    a.href = `#interview-${i+1}`;
    a.className = "interview-name";
    a.textContent = interviewsList[i];
    interviewsArea.appendChild(a);
    
    // random x across full width, random start y (above top)
    const x = Math.random() * Math.max(1, areaW - 40);
    const y = -Math.random() * areaH;
    const speed = 30 + Math.random()*80; // px/sec baseline
    
    // set position immediately
    a.style.left = `${x}px`;
    a.style.top = `${y}px`;
    interviewEls.push({el: a, x, y, speed});
  }
}

/* --- Resizing concerns --- */
window.addEventListener("resize", () => {
  // If necessary, reflow initial placements for some components
  // Note: for simplicity we do not fully recompute everything on resize,
  // but ensure shop and stockists have correct bounding sizes for collisions.
});

/* --- Animation loop --- */
function loop(ts) {
  if (!playing) return;
  if (!lastTs) lastTs = ts;
  const deltaMs = ts - lastTs;
  lastTs = ts;
  const dt = deltaMs / 1000; // seconds

  // update shop motion
  updateShop(dt * speedMultiplier);

  // update about hue
  updateAbout(dt * speedMultiplier);

  // update stockists shuffle
  updateStockists(dt * speedMultiplier);

  // update interviews falling
  updateInterviews(dt * speedMultiplier);

  rafId = requestAnimationFrame(loop);
}

/* SHOP update */
function updateShop(deltaSeconds) {
  if (!shopItems.length) return;
  const areaW = shopArea.clientWidth;
  const areaH = shopArea.clientHeight;
  shopItems.forEach(item => {
    item.x += item.vx * deltaSeconds;
    item.y += item.vy * deltaSeconds;
    // collision with walls: bounce
    if (item.x < 0) {
      item.x = 0;
      item.vx *= -1;
    } else if (item.x + item.w > areaW) {
      item.x = Math.max(0, areaW - item.w);
      item.vx *= -1;
    }
    if (item.y < 0) {
      item.y = 0;
      item.vy *= -1;
    } else if (item.y + item.h > areaH) {
      item.y = Math.max(0, areaH - item.h);
      item.vy *= -1;
    }
    item.el.style.transform = `translate(${item.x}px, ${item.y}px)`;
  });
}

/* ABOUT update */
function updateAbout(deltaSeconds) {
  if (!aboutText) return;
  // hue shift speed baseline: 30 degrees per second
  aboutHue += 30 * deltaSeconds;
  aboutHue = aboutHue % 360;
  // apply CSS filter hue-rotate
  aboutText.style.filter = `hue-rotate(${aboutHue}deg)`;
}

/* STOCKISTS update - shuffle positions periodically */
function updateStockists(deltaSeconds) {
  if (!stockistBoxes.length) return;
  // decrease timer
  stockistsShuffleTimer -= deltaSeconds * 1000 * (1/speedMultiplier); // speed affects frequency inversely for variety
  if (stockistsShuffleTimer <= 0) {
    // create a random permutation of target positions
    const targets = stockistBoxes.map(b => ({tx: b.tx, ty: b.ty}));
    // shuffle targets
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }
    // assign new transforms
    stockistBoxes.forEach((box, idx) => {
      const t = targets[idx];
      // small random jitter to make shapes different
      const jitterX = (Math.random()-0.5) * 20;
      const jitterY = (Math.random()-0.5) * 20;
      box.el.style.transform = `translate(${t.tx + jitterX}px, ${t.ty + jitterY}px)`;
    });
    // set next interval smaller when speed higher
    const base = 2000; // ms
    const next = Math.max(400, base / speedMultiplier);
    stockistsShuffleTimer = next;
  }
}

/* INTERVIEWS update: falling names */
function updateInterviews(deltaSeconds) {
  if (!interviewEls.length) return;
  const areaH = interviewsArea.clientHeight;
  const areaW = interviewsArea.clientWidth;
  interviewEls.forEach(obj => {
    obj.y += obj.speed * deltaSeconds * speedMultiplier;
    if (obj.y > areaH + 40) {
      // reset to top with new random x
      obj.y = -20 - Math.random() * 100;
      obj.x = Math.random() * Math.max(1, areaW - 40);
      obj.el.style.left = `${obj.x}px`;
    }
    obj.el.style.top = `${obj.y}px`;
  });
}

/* Initialize everything, then start RAF */
function init() {
  // Start with all content hidden and no buttons active
  Object.values(contentBlocks).forEach(block => {
    block.classList.add("hidden");
    block.setAttribute("aria-hidden", "true");
  });
  // No buttons start active
  catButtons.forEach(btn => btn.classList.remove("active"));

  initShop();
  initStockists();
  initInterviews();
  // start animation
  lastTs = null;
  if (playing) loop(performance.now());
}

init();

/* Ensure that when the user toggles content visibility while paused/playing,
   elements continue to update appropriately. */
/* Expose some debug on window (optional) */
window._superstars = {
  setSpeed: (v) => { speedMultiplier = Math.max(minSpeed, Math.min(maxSpeed, v)); updateSpeedDisplay(); },
  play: () => { if (!playing) { playing = true; lastTs = null; loop(performance.now()); } },
  pause: () => { if (playing) { playing = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; } }
};
