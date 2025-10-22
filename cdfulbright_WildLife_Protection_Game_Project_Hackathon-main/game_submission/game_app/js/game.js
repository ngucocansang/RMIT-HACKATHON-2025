document.addEventListener("DOMContentLoaded", () => {
  console.log("Initialize successfully");
  // --- 1. GET ALL THE HTML ELEMENTS WE NEED ---
  const readyScreen = document.getElementById("ready-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");
  const startBtn = document.getElementById("start-game-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const playerNameInput = document.getElementById("player-name-input");
  const cursorHand = document.getElementById("cursor-hand");
  const finalScoreSpan = document.getElementById("final-score");
  const highScoresList = document.getElementById("high-scores-list");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const warningModal = document.getElementById("warning-modal");
  const continueBtn = document.getElementById("continue-btn");

  // --- 2. DEFINE GAME ASSETS ---
  const SPEED_INCREASE = 1;
  const professorAssets = [
    {
      id: 0,
      name: "Touchable 1",
      selected: "assets/images/touchable_1.png",
    },
    {
      id: 1,
      name: "Touchable 2",
      selected: "assets/images/touchable_2.png",
    },
    {
      id: 2,
      name: "Touchable 3",
      selected: "assets/images/touchable_3.png",
    },
    {
      id: 3,
      name: "Touchable 4",
      selected: "assets/images/touchable_4.png",
    },
    {
      id: 4,
      name: "Touchable 5",
      selected: "assets/images/touchable_5.png",
    },
    {
      id: 5,
      name: "Touchable 6",
      selected: "assets/images/touchable_6.png",
    },
    {
      id: 6,
      name: "Touchable 7",
      selected: "assets/images/touchable_7.png",
    },
  ];
  const unwantedAssets = [
    { src: "assets/images/untouchable_1.png", width: 90, height: 90 },
    { src: "assets/images/untouchable_2.png", width: 90, height: 90 },
    { src: "assets/images/untouchable_3.png", width: 90, height: 90 },
    { src: "assets/images/untouchable_4.png", width: 90, height: 90 },
    { src: "assets/images/untouchable_5.png", width: 90, height: 90 },
  ];

  // --- 3. GAME STATE VARIABLES ---
  let playerName = "";
  let score, lives, fallSpeed, currentLevel;
  let gameObjects = [];
  let unwantedObjects = [];
  let animationFrameId;
  let mousePos = { x: 0, y: 0 };
  let loadedImages = {};
  let encounteredUnwanteds;

  // --- 4. HELPER FUNCTIONS ---
  function showScreen(screenToShow) {
    [readyScreen, gameScreen, endScreen].forEach((screen) =>
      screen.classList.remove("active")
    );
    screenToShow.classList.add("active");
  }

  function preloadImages(callback) {
    // Debug: Announce the start of the function and list all sources
    console.log("--- Starting Image Preload ---");
    const sources = ["assets/images/heart.png", "assets/images/bg.png"];
    professorAssets.forEach((p) => sources.push(p.selected));
    unwantedAssets.forEach((u) => sources.push(u.src));
    console.log("Sources to load:", sources);

    let loadedCount = 0;
    const totalImages = sources.length;
    // Debug: State how many images are in the queue
    console.log(`Total images to process: ${totalImages}`);

    // Handle the case of no images to prevent getting stuck
    if (totalImages === 0) {
      console.log("No images to preload. Calling callback immediately.");
      callback();
      return;
    }

    sources.forEach((src) => {
      if (!loadedImages[src]) {
        // Debug: Announce loading of a new image
        console.log(`Attempting to load new image: ${src}`);
        const img = new Image();
        img.src = src;

        img.onload = () => {
          // Debug: Confirm successful load
          console.log(`✅ Successfully loaded: ${src}`);
          loadedImages[src] = img;
          loadedCount++;
          console.log(`Progress: ${loadedCount}/${totalImages}`);
          if (loadedCount === totalImages) {
            // Debug: Announce completion before calling the callback
            console.log("--- Preloading Complete. Executing callback. ---");
            callback();
          }
        };

        img.onerror = () => {
          // Debug: Add an error handler to catch broken image paths
          console.error(`❌ FAILED to load image: ${src}. Check the path.`);
          // Still increment to avoid getting stuck, but the image will be broken.
          loadedCount++;
          console.log(`Progress: ${loadedCount}/${totalImages}`);
          if (loadedCount === totalImages) {
            console.log(
              "--- Preloading Complete (with errors). Executing callback. ---"
            );
            callback();
          }
        };
      } else {
        // Debug: Announce that an image is already in the cache
        console.log(`Image already cached: ${src}`);
        loadedCount++;
        console.log(`Progress: ${loadedCount}/${totalImages}`);
        if (loadedCount === totalImages) {
          // Debug: Announce completion
          console.log("--- Preloading Complete. Executing callback. ---");
          callback();
        }
      }
    });
  }

  // --- 5. READY SCREEN LOGIC ---
  function setupReadyScreen() {
    playerNameInput.value = "";
    validateReadyState();
    showScreen(readyScreen);
  }

  function validateReadyState() {
    playerName = playerNameInput.value.trim();
    startBtn.disabled = !(playerName.length > 0);
  }

  // --- 6. MAIN GAME FUNCTIONS ---
  function startGame() {
    score = 0;
    lives = 5;
    fallSpeed = 2;
    currentLevel = 1;
    gameObjects = [];
    unwantedObjects = [];
    encounteredUnwanteds = new Set();
    const availableProfImages = professorAssets.map(
      (p) => loadedImages[p.selected]
    );
    for (let i = 0; i < 5; i++)
      gameObjects.push(createGameObject(availableProfImages));
    for (let i = 0; i < 3; i++) unwantedObjects.push(createUnwantedObject());
    showScreen(gameScreen);
    cursorHand.style.display = "block";
    resumeGame();
  }

  function createGameObject(profImages) {
    return {
      x: Math.random() * (canvas.width - 100) + 50,
      y: -100 - Math.random() * 500,
      img: profImages[Math.floor(Math.random() * profImages.length)],
      width: 90,
      height: 90,
    };
  }

  function createUnwantedObject() {
    const randomAsset =
      unwantedAssets[Math.floor(Math.random() * unwantedAssets.length)];
    return {
      x: Math.random() * (canvas.width - 90) + 45,
      y: -100 - Math.random() * 500,
      img: loadedImages[randomAsset.src],
      width: randomAsset.width,
      height: randomAsset.height,
    };
  }

  function pauseGame() {
    cancelAnimationFrame(animationFrameId);
    warningModal.style.display = "flex";
  }

  function resumeGame() {
    warningModal.style.display = "none";
    if (lives > 0) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function gameLoop() {
    ctx.drawImage(
      loadedImages["assets/images/bg.png"],
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Handle Touchable Objects
    gameObjects.forEach((obj) => {
      obj.y += fallSpeed;
      const distance = Math.hypot(mousePos.x - obj.x, mousePos.y - obj.y);
      if (distance < obj.width / 2) {
        score++;
        if (score >= currentLevel * 10) {
          currentLevel++;
          fallSpeed += SPEED_INCREASE;
          unwantedObjects.push(createUnwantedObject());
        }
        const availableProfImages = professorAssets.map(
          (p) => loadedImages[p.selected]
        );
        Object.assign(obj, createGameObject(availableProfImages));
      }
      if (obj.y > canvas.height) {
        const availableProfImages = professorAssets.map(
          (p) => loadedImages[p.selected]
        );
        Object.assign(obj, createGameObject(availableProfImages));
      }
      ctx.drawImage(
        obj.img,
        obj.x - obj.width / 2,
        obj.y - obj.height / 2,
        obj.width,
        obj.height
      );
    });

    // --- BUG FIX IS HERE ---
    // Use a standard `for` loop to allow an early return from the function
    for (let i = 0; i < unwantedObjects.length; i++) {
      const obj = unwantedObjects[i];
      obj.y += fallSpeed;
      const distance = Math.hypot(mousePos.x - obj.x, mousePos.y - obj.y);

      if (distance < obj.width / 2) {
        if (!encounteredUnwanteds.has(obj.img.src)) {
          encounteredUnwanteds.add(obj.img.src);
          Object.assign(obj, createUnwantedObject());
          pauseGame();
          // This is the crucial change: it stops the gameLoop immediately
          return;
        } else {
          lives--;
          Object.assign(obj, createUnwantedObject());
          if (lives <= 0) {
            endGame();
            // Also stop the loop immediately on game over
            return;
          }
        }
      }
      if (obj.y > canvas.height) {
        Object.assign(obj, createUnwantedObject());
      }
      ctx.drawImage(
        obj.img,
        obj.x - obj.width / 2,
        obj.y - obj.height / 2,
        obj.width,
        obj.height
      );
    }

    drawUI();
    // This line is now only reached if the game was not paused or ended in this frame.
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function drawUI() {
    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.fillText(`Score: ${score}`, 20, 50);
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(
        loadedImages["assets/images/heart.png"],
        20 + i * 35,
        70,
        30,
        30
      );
    }
  }

  function endGame() {
    cancelAnimationFrame(animationFrameId);
    cursorHand.style.display = "none";
    finalScoreSpan.textContent = score;
    const scores = JSON.parse(localStorage.getItem("highScores")) || [];
    scores.push({ name: playerName, score: score });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem("highScores", JSON.stringify(scores.slice(0, 5)));
    highScoresList.innerHTML = scores
      .slice(0, 5)
      .map((s) => `<li>${s.name}: ${s.score}</li>`)
      .join("");
    showScreen(endScreen);
  }

  // --- 7. EVENT LISTENERS ---
  playAgainBtn.addEventListener("click", () => setupReadyScreen());
  playerNameInput.addEventListener("input", validateReadyState);
  startBtn.addEventListener("click", () => preloadImages(startGame));
  continueBtn.addEventListener("click", resumeGame);

  gameScreen.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
    cursorHand.style.left = `${mousePos.x}px`;
    cursorHand.style.top = `${mousePos.y}px`;
  });

  // --- 8. INITIALIZATION ---
  setupReadyScreen();
});
