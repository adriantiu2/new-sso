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
  "assets/shop/sso2cover.png",
  "assets/shop/sso3cover.png",
  "assets/shop/sso4cover.png",
  "assets/shop/sso5cover.png"
];
const numStockists = 12;
const stockistsData = [
  {
    name: "Oven Universe",
    address: "Japan, 〒060-0042 Hokkaido, Sapporo, Chuo Ward, Odorinishi, 17 Chome−1-7 庭ビル 1F"
  },
  {
    name: "Sheep Harajuku",
    address: "1F Laforet Harajuku, 1-11-6 Jingumae, Shibuya, Tokyo 1500001"
  },
  {
    name: "Susan Unique Market",
    address: "大手2-10-1神沢屋ビル1F, Matsumoto, Nagano 3900874"
  },
  {
    name: "Printed Matter",
    address: "231 11th Ave, New York, NY 10001"
  },
  {
    name: "Bungee Space",
    address: "13 Stanton St, New York, NY 10002"
  },
  {
    name: "Iconic Magazines",
    address: "188 Mulberry St, New York, NY 10012"
  },
  {
    name: "Casa Magazines",
    address: "22 8th Ave, New York, NY 10014"
  },
  {
    name: "Dale Zine",
    address: "50 NE 40th St, Miami, FL 33137"
  },
  {
    name: "Heavy Manners Library",
    address: "1200 N Alvarado St Los Angeles, CA 90026"
  },
  {
    name: "Homebody LA",
    address: "1011 E. Main St., Alhambra, CA 91801"
  },
  {
    name: "Toutoune Gallery",
    address: "998 Bathurst St, Toronto ON"
  },
  {
    name: "Gutter Pop Comics",
    address: "1421 Hertel Ave, Buffalo, NY 14216"
  }
];
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
  "Moh motion",
  "Caveh Zahedi"
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
    // Set links based on image
    if (url.includes("sso5cover.png")) {
      a.href = "https://superstarsonly.metalabel.com/bagazine?variantId=1";
      a.target = "_blank";
    } else if (url.includes("sso4cover.png")) {
      a.href = "https://superstarsonly.metalabel.com/record_koxa7zrdrxo7k34zb?variantId=1";
      a.target = "_blank";
    } else {
      // No link for sso2cover.png and sso3cover.png
      a.href = "#";
      a.onclick = (e) => e.preventDefault();
    }
    const img = document.createElement("img");
    img.src = url;
    img.className = "shop-item";
    
    // Add sold out overlay for sso2cover.png and sso3cover.png
    if (url.includes("sso2cover.png") || url.includes("sso3cover.png")) {
      img.classList.add("shop-item-sold-out");
      const overlay = document.createElement("div");
      overlay.className = "sold-out-overlay";
      const soldOutText = document.createElement("div");
      soldOutText.className = "sold-out-text";
      soldOutText.textContent = "Sold Out";
      overlay.appendChild(soldOutText);
      a.appendChild(img);
      a.appendChild(overlay);
      
      // Add click handler to toggle active state
      a.addEventListener("click", (e) => {
        e.preventDefault();
        // Set overlay dimensions to match image's current rendered size
        const rect = img.getBoundingClientRect();
        overlay.style.width = rect.width + "px";
        overlay.style.height = rect.height + "px";
        a.classList.toggle("active");
      });
    } else {
      a.appendChild(img);
    }
    shopArea.appendChild(a);
    // random position inside area (use client size for accurate inner bounds)
    const areaW = shopArea.clientWidth;
    const areaH = shopArea.clientHeight;
    const w = 135;
    const x = Math.random() * Math.max(1, areaW - w);
    const y = Math.random() * Math.max(1, areaH - 200); // Use max expected height for collision detection
    const speed = 80 + Math.random()*120; // px/sec baseline
    const angle = Math.random()*Math.PI*2;
    shopItems.push({ el: a, img, x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, w, h: 200 }); // Store max height for collision
    // initialize style: lock left/top to 0 so transform is the sole position source
    a.style.left = `0px`;
    a.style.top = `0px`;
    a.style.width = `${w}px`;
    a.style.height = `auto`;
    // set initial transform to match starting position
    a.style.transform = `translate(${x}px, ${y}px)`;
  });
}

/* --- ABOUT: diagonal wave color effect --- */
const aboutText = document.getElementById("aboutText");
const aboutWords = []; // {el, colorIndex}
const waveColors = [
  'rgb(255, 0, 0)',     // Red
  'rgb(0, 0, 255)',     // Blue
  'rgb(0, 255, 0)',     // Green
  '#FF00FB'             // Pink
];
let waveOffset = 0;
const waveSpeed = 2; // words per second

function initAbout() {
  if (!aboutText) return;
  
  // Get the innerHTML to preserve HTML structure
  const html = aboutText.innerHTML;
  
  // Use a temporary container to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Clear the paragraph and rebuild with color wave words
  aboutText.innerHTML = '';
  
  let wordIndex = 0;
  
  // Process nodes recursively
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Split text into words
      const text = node.textContent;
      const words = text.split(/(\s+)/);
      
      words.forEach(word => {
        if (word.trim() === '' || word.match(/^\s+$/)) {
          // Preserve whitespace
          aboutText.appendChild(document.createTextNode(word));
        } else {
          // Create colored word span
          const span = document.createElement('span');
          span.textContent = word;
          span.className = 'about-word';
          span.style.display = 'inline-block';
          span.style.transition = 'color 0.3s ease';
          aboutText.appendChild(span);
          
          // Each word gets a color index based on its position
          aboutWords.push({ el: span, colorIndex: wordIndex % waveColors.length });
          wordIndex++;
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'BR') {
        // Preserve line breaks
        aboutText.appendChild(document.createElement('br'));
      } else if (node.tagName === 'A') {
        // Create link element
        const link = document.createElement('a');
        link.href = node.getAttribute('href') || '';
        const target = node.getAttribute('target');
        if (target) {
          link.setAttribute('target', target);
        }
        
        // Process link text into word spans for color wave effect
        const linkText = node.textContent;
        const linkWords = linkText.split(/(\s+)/);
        
        linkWords.forEach(word => {
          if (word.trim() === '' || word.match(/^\s+$/)) {
            // Preserve whitespace
            link.appendChild(document.createTextNode(word));
          } else {
            // Create colored word span
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'about-word';
            span.style.display = 'inline-block';
            span.style.transition = 'color 0.3s ease';
            link.appendChild(span);
            
            // Each word gets a color index based on its position
            aboutWords.push({ el: span, colorIndex: wordIndex % waveColors.length });
            wordIndex++;
          }
        });
        
        aboutText.appendChild(link);
      } else {
        // For other elements, process their children
        Array.from(node.childNodes).forEach(child => {
          processNode(child);
        });
      }
    }
  }
  
  // Process all nodes from the temporary container
  Array.from(temp.childNodes).forEach(child => {
    processNode(child);
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
    const stockist = stockistsData[i];
    const shopName = stockist ? stockist.name : `Shop ${i+1}`;
    const address = stockist ? stockist.address : `123${i} Star Ave, Suite ${10+i}`;
    el.innerHTML = `<strong>${shopName}</strong><small>${address}</small>`;
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
  
  // Resize title to fit new column width
  resizeTitle();
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
  
  // Update wave offset for diagonal wave effect (left to right)
  waveOffset += waveSpeed * deltaSeconds;
  
  // Apply color wave to each word
  aboutWords.forEach((word, index) => {
    // Calculate the color index for this word based on its position and wave offset
    // The diagonal effect is created by subtracting the word's index from the wave offset for left-to-right flow
    const colorIndex = Math.floor((waveOffset - index) % waveColors.length);
    // Ensure positive index for proper color cycling
    const positiveIndex = colorIndex < 0 ? (colorIndex % waveColors.length) + waveColors.length : colorIndex;
    word.el.style.color = waveColors[positiveIndex % waveColors.length];
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

/* All read-more links now use consistent layout (handled by CSS) */
function initReadMoreThumbnails() {
  // No special handling needed - all articles use consistent layout
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
  
  // Apply full-width thumbnails to some read-more links
  initReadMoreThumbnails();
  
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
