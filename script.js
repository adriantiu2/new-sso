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
const interviewsList = [
  "Yuan Lee",
  "Alex auder", 
  "Molly soda",
  "Princess Demeny",
  "Princess superstar",
  "Eric Heinz",
  "Neghasi armada",
  "Kevin rezvani",
  "Melanie Wu",
  "Ingrid Lu",
  "Lizzi Bougatsos",
  "Rachel Giannascoli",
  "Liana Satenstein",
  "Lexi Langil",
  "Garret Sander",
  "Puppeteer collective",
  "Moh motion"
];

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
      
      // Reinitialize sections when they become visible to ensure proper positioning
      if (target === "stockists") {
        setTimeout(() => {
          // Clear existing stockist boxes
          stockistBoxes.forEach(box => box.el.remove());
          stockistBoxes.length = 0;
          // Reinitialize with proper dimensions
          initStockists();
        }, 50);
                  } else if (target === "interviews") {
                    // Check if other sections are active - if so, use longer delay
                    const otherActiveSections = document.querySelectorAll('.content-block:not(.hidden)');
                    const delay = otherActiveSections.length > 1 ? 300 : 200; // Increased delays
                    
                    setTimeout(() => {
                      // Clear existing interview elements
                      interviewEls.forEach(el => el.remove());
                      interviewEls.length = 0;
                      // Reinitialize with proper dimensions
                      initInterviews();
                    }, delay);
                  }
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

/* --- ABOUT: hue rotation and word spinning --- */
const aboutText = document.getElementById("aboutText");
let aboutHue = 0;
const aboutWords = []; // {el, rotation, speed}
let currentSpinningWord = 0;
let wordSwitchTimer = 0;
const wordSwitchInterval = 1.5; // seconds between word switches

function initAbout() {
  if (!aboutText) return;
  
  // Get the text content and split into words
  const text = aboutText.textContent;
  const words = text.split(/\s+/);
  
  // Clear the paragraph and rebuild with spinning words
  aboutText.innerHTML = '';
  
  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.className = 'about-word';
    span.style.display = 'inline-block';
    span.style.transformOrigin = 'center';
    aboutText.appendChild(span);
    
    // Add a space after each word (except the last one)
    if (index < words.length - 1) {
      aboutText.appendChild(document.createTextNode(' '));
    }
    
    // All words start with no rotation, only one will spin at a time
    aboutWords.push({ el: span, rotation: 0, speed: 0 });
  });
}

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
  
  // Get the actual area dimensions for better spacing
  // Use getBoundingClientRect for more reliable dimensions
  const rect = area.getBoundingClientRect();
  const areaW = rect.width || area.clientWidth || 400;
  const areaH = rect.height || area.clientHeight || 300;
  
  const pad = 20; // increased padding
  const boxW = 120;
  const boxH = 70;
  
  // Calculate spacing to use more of the available area
  const availableWidth = areaW - 40; // leave some margin
  const availableHeight = areaH - 40; // leave some margin
  
  // Calculate spacing between boxes to fill more space
  const spacingX = Math.max(pad, (availableWidth - (cols * boxW)) / (cols - 1));
  const spacingY = Math.max(pad, (availableHeight - (rows * boxH)) / (rows - 1));
  
  // Center the grid in the available space
  const totalGridWidth = (cols * boxW) + ((cols - 1) * spacingX);
  const totalGridHeight = (rows * boxH) + ((rows - 1) * spacingY);
  const startX = Math.max(20, (areaW - totalGridWidth) / 2);
  const startY = Math.max(20, (areaH - totalGridHeight) / 2);
  
  for (let i=0;i<numStockists;i++) {
    const el = document.createElement("div");
    el.className = "stockist-box";
    const shopName = `Shop ${i+1}`;
    const address = `123${i} Star Ave, Suite ${10+i}`;
    el.innerHTML = `<strong>${shopName}</strong><br><small>${address}</small>`;
    area.appendChild(el);
    // compute grid pos with better spacing
    const r = Math.floor(i/cols);
    const c = i % cols;
    const tx = startX + c * (boxW + spacingX);
    const ty = startY + r * (boxH + spacingY);
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
  // Force a more reliable width calculation
  let areaW = 0;
  let areaH = 0;
  
  // Try multiple methods to get dimensions
  const rect = interviewsArea.getBoundingClientRect();
  const clientW = interviewsArea.clientWidth;
  const clientH = interviewsArea.clientHeight;
  
  // Use the largest available width
  areaW = Math.max(rect.width, clientW, 0);
  areaH = Math.max(rect.height, clientH, 200);
  
  // If we still don't have a good width, force a calculation
  if (areaW < 400) {
    const isMobile = window.innerWidth <= 800;
    if (isMobile) {
      areaW = window.innerWidth - 40; // Full width minus padding
    } else {
      // Desktop: main column is 3/6 of total width
      areaW = (window.innerWidth * 0.5) - 40;
    }
    console.log('Forced width calculation:', { isMobile, windowWidth: window.innerWidth, calculatedWidth: areaW });
  }
  
  // Additional check: if other sections are active, force a larger width
  const activeSections = document.querySelectorAll('.content-block:not(.hidden)');
  if (activeSections.length > 1 && areaW < 600) {
    areaW = Math.max(window.innerWidth * 0.4, 600);
  }
  
  // Final safety check - ensure we never have a width that's too small
  areaW = Math.max(areaW, 500);
  
  // Debug: log dimensions to see what we're getting
  console.log('Interview area dimensions:', { 
    areaW, 
    areaH, 
    rectWidth: rect.width, 
    clientWidth: interviewsArea.clientWidth, 
    windowWidth: window.innerWidth,
    activeSectionsCount: activeSections.length,
    activeSections: Array.from(activeSections).map(s => s.id)
  });
  
  // Create URL-friendly names for links
  const interviewUrls = interviewsList.map(name => 
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  );
  
  for (let i=0;i<interviewsList.length;i++) {
    const a = document.createElement("a");
    a.href = `${interviewUrls[i]}.html`;
    a.className = "interview-name";
    a.textContent = interviewsList[i];
    interviewsArea.appendChild(a);
    
    // random x across full width, random start y (above top with more variation)
    // Ensure x is well distributed across the available width
    const availableWidth = Math.max(areaW - 40, 400); // Leave minimal margin, ensure good width
    const x = Math.random() * availableWidth;
    const y = -Math.random() * areaH * 2; // Start from further above with more variation
    const speed = 30 + Math.random()*80; // px/sec baseline
    
    // Debug log for first few elements to see positioning
    if (i < 3) {
      console.log(`Interview ${i}: x=${x}, availableWidth=${availableWidth}, areaW=${areaW}`);
    }
    
    // set position immediately
    a.style.left = `${x}px`;
    a.style.top = `${y}px`;
    interviewEls.push({el: a, x, y, speed});
  }
}

/* --- Resizing concerns --- */
window.addEventListener("resize", () => {
  // Reinitialize stockists on resize to recalculate spacing
  if (stockistBoxes.length > 0) {
    // Clear existing boxes
    stockistBoxes.forEach(box => box.el.remove());
    stockistBoxes.length = 0;
    // Reinitialize with new spacing
    initStockists();
  }
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
  
  // update word switching timer
  wordSwitchTimer += deltaSeconds;
  if (wordSwitchTimer >= wordSwitchInterval) {
    // Switch to random word
    wordSwitchTimer = 0;
    const newSpinningWord = Math.floor(Math.random() * aboutWords.length);
    currentSpinningWord = newSpinningWord;
    
    // Reset all words to no rotation and ensure they're at original position
    aboutWords.forEach(word => {
      word.rotation = 0;
      word.speed = 0;
      word.el.style.transform = 'rotate(0deg)';
    });
    
    // Set the new random spinning word with faster speed
    const spinningWord = aboutWords[currentSpinningWord];
    spinningWord.speed = 360; // 360 degrees per second (1 full rotation per second)
  }
  
  // update word spinning - only the current word spins
  aboutWords.forEach(word => {
    if (word.speed > 0) {
      word.rotation += word.speed * deltaSeconds;
      // Keep rotation clean by using modulo to prevent accumulation issues
      const cleanRotation = word.rotation % 360;
      word.el.style.transform = `rotate(${cleanRotation}deg)`;
    } else {
      word.el.style.transform = `rotate(0deg)`;
    }
  });
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
  initInterviews();
  initAbout();
  
  // Initialize stockists immediately - they'll be repositioned when shown
  initStockists();
  
  // Make shop button active by default
  const shopBtn = document.getElementById("btn-shop");
  const shopBlock = contentBlocks.shop;
  if (shopBtn && shopBlock) {
    shopBtn.classList.add("active");
    shopBlock.classList.remove("hidden");
    shopBlock.setAttribute("aria-hidden", "false");
  }
  
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
