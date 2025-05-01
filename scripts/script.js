// ================== Canvas Setup ====================
const display = document.querySelectorAll(".display");
const game_over = document.querySelector(".game_over");
const game = document.getElementById("game");
const ctx = game.getContext("2d");

// ========== Get window size ==========
const window_width = window.innerWidth;
const window_height = window.innerHeight;

// ============= Handle HiDPI screens =========
const scale = window.devicePixelRatio || 1;
game.width = window_width * scale;
game.height = window_height * scale;
game.style.width = `${window_width}px`;
game.style.height = `${window_height}px`;
ctx.scale(scale, scale);

// ========== Game Variables ==========
const plane = {
  x: window_width / 2,
  y: window_height - 100,
  width: 70,
  height: 120,
  speed: 30,
  bullets: [],
};

let enemies = [];
let start_game = false;
let auto_shoot = false;
let can_shoot = true;
let score = 0;
let generated_plane = 0;
const keys = {};

// ============== Load plane image once ===========
const plane_image = new Image();
plane_image.src = "./assets/fighter.svg";
let plane_image_loaded = false;
plane_image.onload = () => {
  plane_image_loaded = true;
};

const enemie_plane_image = new Image();
enemie_plane_image.src = "./assets/enemie_plane.svg";
let enemie_plane_image_loaded = false;
enemie_plane_image.onload = () => {
  enemie_plane_image_loaded = true;
};

// ============= load audio sounds ============
const shoot_sound = new Audio("./assets/sounds/laser_sound.wav");
const destroyed_sound = new Audio("./assets/sounds/explotion_sound.wav");
const bg_music = new Audio("./assets/sounds/bg_music.mp3");
bg_music.loop = true;
bg_music.volume = 1;

function start_music() {
  bg_music.play().catch((err) => console.error("Music playback blocked:", err));
  start_game = true;
}

function destroyed_enemie_plane() {
  destroyed_sound.currentTime = 0;
  destroyed_sound.play();
}

// ========== Input Handling ==========

game_over.addEventListener("click", () => {
  window.location.reload();
});

document.addEventListener("keydown", start_music, { once: true });

document.addEventListener("touchstart", start_music, { once: true });

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " " && can_shoot && !game_Over()) {
    can_shoot = false;
    setTimeout(() => (can_shoot = true), 500);
    assult_fire();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

game.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    const game_container = game.getBoundingClientRect();
    const touch = e.touches[0].clientX - game_container.left;
    plane.x = touch - plane.width / 2;
  },
  { passive: false }
);

game.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    auto_shoot = true;
    start_game = true;
  },
  { passive: false }
);

window.addEventListener("resize", () => {
  location.reload();
});

// ========== Game Logic ==========

// show high score from localhost
const high_score = localStorage.getItem("highest_score");
display[1].textContent = `Previous Destroyed : ${high_score || 0}`;

// shoot bullet
function shoot_bullet() {
  //play shoot sound
  shoot_sound.currentTime = 0;
  shoot_sound.play();

  //add bullets on screen
  plane.bullets.push({
    x: plane.x + plane.width / 2 - 2.5,
    y: plane.y,
    width: 4,
    height: 10,
  });
}

function assult_fire() {
  setTimeout(() => shoot_bullet(), 50);
  setTimeout(() => shoot_bullet(), 200);
  setTimeout(() => shoot_bullet(), 450);
}

// game Over
function game_Over() {
  const checkSum = generated_plane - score;
  if (checkSum >= 10) {
    display[2].textContent = `Health : 00%`;
    const previus_scrore = localStorage.getItem("highest_score");
    if (Number(previus_scrore) <= score) {
      localStorage.setItem("highest_score", score);
    }

    game_over.classList.remove("hidden");
    return true;
  } else {
    display[2].textContent = `Health : ${10 - checkSum}0%`;
    return false;
  }
}

// generate enemie_plane and spawn random position
function generate_random_enemie_plane() {
  function random_position() {
    const random_number = Math.round(Math.random() * window_width);
    if (80 <= random_number) {
      return random_number - 80;
    }
    return 0;
  }

  enemies.push({
    x: random_position(),
    y: -70,
    width: 80,
    height: 120,
    speed: Math.ceil(Math.random() * 10),
    bullets: [],
  });

  generated_plane += 1;
}

// Axis-Aligned Bounding Box (AABB) collision detection
function handle_collision(bullet, plane) {
  return (
    bullet.x < plane.x + plane.width &&
    bullet.x + bullet.width > plane.x &&
    bullet.y < plane.y + plane.height &&
    bullet.y + bullet.height > plane.y
  );
}

// game controller function
function handle_game() {
  // Move plane
  if (keys["ArrowLeft"] && plane.x > 0) {
    plane.x -= plane.speed;
  }
  if (keys["ArrowRight"] && plane.x + plane.width < window_width) {
    plane.x += plane.speed;
  }

  // Move bullets forward
  plane.bullets.forEach((b) => (b.y -= 10));
  plane.bullets = plane.bullets.filter((b) => b.y + b.height > 0);

  // Move enemie_plane downward
  enemies.forEach((enemie) => (enemie.y += enemie.speed));
  enemies = enemies.filter((enemie) => enemie.y < window_height);

  // detect collision
  plane.bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemie, enemieIndex) => {
      if (handle_collision(bullet, enemie)) {
        enemies.splice(enemieIndex, 1);
        plane.bullets.splice(bulletIndex, 1);
        destroyed_enemie_plane();
        score += 1;
      }
    });
  });
}

// ========== Draw Game ==========
function draw_game() {
  ctx.clearRect(0, 0, window_width, window_height);

  // Draw fighter plane
  if (plane_image_loaded) {
    ctx.drawImage(plane_image, plane.x, plane.y, plane.width, plane.height);
  }

  // Draw enemie plane
  if (enemie_plane_image_loaded) {
    enemies.forEach((enemie) =>
      ctx.drawImage(
        enemie_plane_image,
        enemie.x,
        enemie.y,
        enemie.width,
        enemie.height
      )
    );
  }

  // Draw bullets
  ctx.fillStyle = "red";
  plane.bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// ========== Game Loop ==========

// auto shoot
setInterval(() => {
  if (auto_shoot) {
    assult_fire();
  }
}, 1000);

// loop for generate enemie planes
setInterval(() => {
  if (game_Over()) {
    start_game = false;
    auto_shoot = false;
    return;
  }

  if (start_game) {
    generate_random_enemie_plane();
    return;
  }
  return;
}, 2000);

function main() {
  display[0].textContent = `Destroyed : ${score}`;
  handle_game();
  draw_game();
  requestAnimationFrame(main);
}

main();

//Gamer@Rakibul715523
