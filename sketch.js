let stopSprite, walkSprite, walk2Sprite, jumpSprite, pushSprite, attackSprite;
const STOP_FRAMES = 5;
const STOP_TOTAL_W = 155;
const STOP_TOTAL_H = 27;
const STOP_W = STOP_TOTAL_W / STOP_FRAMES;
const STOP_H = STOP_TOTAL_H;

const WALK_FRAMES = 8;
const WALK_TOTAL_W = 214;
const WALK_TOTAL_H = 23;
const WALK_W = WALK_TOTAL_W / WALK_FRAMES;
const WALK_H = WALK_TOTAL_H;

// walk2 現在為 9 幀，圖檔尺寸 265x25（9張圖片）
const WALK2_FRAMES = 9;
const WALK2_TOTAL_W = 265;
const WALK2_TOTAL_H = 25;
const WALK2_W = WALK2_TOTAL_W / WALK2_FRAMES;
const WALK2_H = WALK2_TOTAL_H;

// 新增 PUSH 動作的常數 (發射前搖)
const PUSH_FRAMES = 7;
const PUSH_TOTAL_W = 252; // 252 / 7 = 36
const PUSH_TOTAL_H = 23;
const PUSH_W = PUSH_TOTAL_W / PUSH_FRAMES;
const PUSH_H = PUSH_TOTAL_H;

// 新增 ATTACK 動作的常數 (投射物)
const ATTACK_FRAMES = 11;
const ATTACK_TOTAL_W = 391;
const ATTACK_TOTAL_H = 19;
const ATTACK_W = ATTACK_TOTAL_W / ATTACK_FRAMES;
const ATTACK_H = ATTACK_TOTAL_H;

// 新增 JUMP 動作的常數
const JUMP_FRAMES = 5;
const JUMP_TOTAL_W = 155;
const JUMP_TOTAL_H = 25;
const JUMP_W = JUMP_TOTAL_W / JUMP_FRAMES;
const JUMP_H = JUMP_TOTAL_H;

const ANIM_FPS = 8; // 可調整動畫速度
const MOVE_SPEED = 200; // 像素/秒，按鍵時的移動速度
const ATTACK_SPEED = 300; // 投射物的移動速度

let posX, posY; // 角色中心位置
let lastDirection = 'right'; // 追蹤角色最後的面向
let isJumping = false; // 新增狀態：是否正在執行 jump 動作
let jumpStartTime = 0; // jump 動作的開始時間
let isPushing = false; // 新增狀態：是否正在發射前搖
let pushStartTime = 0; // 發射前搖的開始時間
let attackLaunchedThisPush = false; // 確保在一次 push 中只發射一次

// 投射物物件
let attackProjectile = {
  active: false,
  x: 0,
  y: 0,
  direction: 'right',
  startTime: 0,
};

function preload() {
  // 預載入三組精靈圖，避免切換時閃爍
  stopSprite = loadImage('1/stop/stop.png');
  walkSprite = loadImage('1/walk/walk.png');
  walk2Sprite = loadImage('1/walk2/walk2.png');
  jumpSprite = loadImage('1/jump/jump.png');
  // 預載入 push 和 attack 精靈圖
  pushSprite = loadImage('1/push/push.png');
  attackSprite = loadImage('1/attack/attack.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth(); // 若要保持像素化可開啟
  posX = width / 2;
  posY = height / 2;
}

function draw() {
  background('#f5ebe0');
  
  const frameDurationMs = 1000 / ANIM_FPS;
  let currentPosY = posY; // 角色的 Y 軸位置，預設為中央

  // 檢查 jump 動畫是否結束
  if (isJumping) {
    const jumpAnimDuration = JUMP_FRAMES * frameDurationMs;
    if (millis() - jumpStartTime > jumpAnimDuration) {
      isJumping = false; // 動畫結束，重設狀態
    }
  }

  // 檢查 push 動畫是否結束，若結束則觸發 attack
  if (isPushing) {
    const pushAnimDuration = PUSH_FRAMES * frameDurationMs;
    const elapsed = millis() - pushStartTime;

    // 當動畫時間到，重設狀態
    if (elapsed > pushAnimDuration) {
      isPushing = false; // 動畫結束，重設狀態
    }

    // 當動畫進行到一半且尚未發射時，啟動投射物
    if (!attackLaunchedThisPush && elapsed >= pushAnimDuration / 2) {
      attackProjectile.active = true;
      attackProjectile.x = posX;
      attackProjectile.y = posY;
      attackProjectile.direction = lastDirection;
      attackProjectile.startTime = millis();
      attackLaunchedThisPush = true; // 標記為已發射
    }
  }
  
  // 如果投射物是活動的，就更新它
  if (attackProjectile.active) {
    updateAttackProjectile(frameDurationMs);
  }

  // 判斷按鍵：左優先（按左則走左），否則若按右則走右，否則停住
  const usingLeft = keyIsDown(LEFT_ARROW);
  const usingRight = keyIsDown(RIGHT_ARROW);

  let frames, spriteImg, singleW, singleH;
  let frameIndex = 0; // <<<<<<< 在此處初始化 frameIndex

  // 狀態判斷：優先處理一次性動作 (JUMP, PUSH)
  if (isJumping) {
    frames = JUMP_FRAMES;
    spriteImg = jumpSprite;
    singleW = JUMP_W;
    singleH = JUMP_H;

    // 計算 JUMP 動畫的當前幀，播完就停在最後一幀
    const elapsed = millis() - jumpStartTime;
    frameIndex = floor(elapsed / frameDurationMs);
    frameIndex = min(frameIndex, frames - 1); // 避免超出範圍

    // 製作上下移動效果
    const jumpProgress = (elapsed / (JUMP_FRAMES * frameDurationMs)); // 0.0 to 1.0
    // 使用 sin 函數製造一個上升再下降的弧線
    const verticalOffset = sin(jumpProgress * PI) * -80; // 調整這個值來改變跳躍高度
    currentPosY += verticalOffset;

  } else if (isPushing) {
    frames = PUSH_FRAMES;
    spriteImg = pushSprite;
    singleW = PUSH_W;
    singleH = PUSH_H;

    // 計算 PUSH 動畫的當前幀，播完就停在最後一幀
    const elapsed = millis() - pushStartTime;
    frameIndex = floor(elapsed / frameDurationMs);
    frameIndex = min(frameIndex, frames - 1); // 避免超出範圍

    // 新增：在 PUSH 期間也稍微向上跳一下
    const pushProgress = (elapsed / (PUSH_FRAMES * frameDurationMs)); // 計算動畫進度 (0.0 to 1.0)
    const verticalOffset = sin(pushProgress * PI) * -15; // -15 是向上的幅度，可以調整
    currentPosY += verticalOffset;

    // 新增：在 PUSH 期間前半段前進
    const pushMoveSpeed = 50; // 移動速度（像素/秒），可以調整這個值
    if (pushProgress < 0.5) {
      // 前半段：前進
      if (lastDirection === 'right') posX += pushMoveSpeed * (deltaTime / 1000);
      else posX -= pushMoveSpeed * (deltaTime / 1000);
    }

  } else if (usingLeft) {
    lastDirection = 'left'; // 更新最後面向
    frames = WALK2_FRAMES;
    spriteImg = walk2Sprite;
    singleW = WALK2_W;
    singleH = WALK2_H;
    // 持續移動
    posX -= MOVE_SPEED * (deltaTime / 1000);
    frameIndex = floor(millis() / frameDurationMs) % frames; // 計算循環動畫的當前幀

  } else if (usingRight) {
    lastDirection = 'right'; // 更新最後面向
    frames = WALK_FRAMES;
    spriteImg = walkSprite;
    singleW = WALK_W;
    singleH = WALK_H;
    // 持續移動
    posX += MOVE_SPEED * (deltaTime / 1000);
    // 計算循環動畫的當前幀
    frameIndex = floor(millis() / frameDurationMs) % frames;

  } else {
    // 預設為站立狀態
    frames = STOP_FRAMES;
    spriteImg = stopSprite;
    singleW = STOP_W;
    singleH = STOP_H;
    // 計算循環動畫的當前幀
    frameIndex = floor(millis() / frameDurationMs) % frames;
  }

  // 依畫面大小縮放角色
  const scale = min(windowWidth, windowHeight) / 8 / singleH;
  const drawW = singleW * scale;
  const drawH = singleH * scale;
  const halfDrawW = drawW / 2;
  
  // 限制角色不會移出畫布
  posX = constrain(posX, halfDrawW, width - halfDrawW);

  // 從精靈圖取出當前幀並繪製在畫布
  const sx = frameIndex * singleW;
  image(spriteImg, posX, currentPosY, drawW, drawH, sx, 0, singleW, singleH);
  
  // 如果投射物是活動的，就繪製它
  if (attackProjectile.active) {
    drawAttackProjectile();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  posY = height / 2;
  // 也要確保在 resize 後仍在畫面內
  const conservativeScale = min(windowWidth, windowHeight) / 8 / STOP_H;
  const conservativeHalfW = (STOP_W * conservativeScale) / 2;
  posX = constrain(posX, conservativeHalfW, width - conservativeHalfW);
}

// 新增 keyPressed 函數來監聽一次性的按鍵事件
function keyPressed() {
  // 當按下向上鍵，且角色不在任何一次性動作狀態時觸發跳躍
  if (keyCode === UP_ARROW && !isJumping && !isPushing) {
    isJumping = true;
    jumpStartTime = millis(); // 記錄動畫開始時間
  }
  // 當按下空白鍵，且角色不在任何一次性動作狀態時觸發發射
  if (key === ' ' && !isJumping && !isPushing) {
    isPushing = true;
    pushStartTime = millis();
    attackLaunchedThisPush = false; // 重設發射旗標
  }
}

function updateAttackProjectile(frameDurationMs) {
  const attackAnimDuration = ATTACK_FRAMES * frameDurationMs;
  // 檢查動畫是否結束
  if (millis() - attackProjectile.startTime > attackAnimDuration) {
    attackProjectile.active = false; // 動畫結束，設為非活動
    return;
  }

  // 根據方向移動投射物
  const moveDistance = ATTACK_SPEED * (deltaTime / 1000);
  if (attackProjectile.direction === 'right') {
    attackProjectile.x += moveDistance;
  } else {
    attackProjectile.x -= moveDistance;
  }
}

// 繪製投射物的函數
function drawAttackProjectile() {
  const frameDurationMs = 1000 / ANIM_FPS;
  const elapsed = millis() - attackProjectile.startTime;
  let frameIndex = floor(elapsed / frameDurationMs);
  frameIndex = min(frameIndex, ATTACK_FRAMES - 1);

  const sx = frameIndex * ATTACK_W;
  const scale = min(windowWidth, windowHeight) / 8 / ATTACK_H;
  const drawW = ATTACK_W * scale;
  const drawH = ATTACK_H * scale;

  push(); // 保存當前的繪圖狀態
  if (attackProjectile.direction === 'left') {
    scale(-1, 1); // 水平翻轉畫布
    image(attackSprite, -attackProjectile.x, attackProjectile.y, drawW, drawH, sx, 0, ATTACK_W, ATTACK_H);
  } else {
    image(attackSprite, attackProjectile.x, attackProjectile.y, drawW, drawH, sx, 0, ATTACK_W, ATTACK_H);
  }
  pop(); // 恢復繪圖狀態
}
