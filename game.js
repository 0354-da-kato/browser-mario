// ゲーム定数
const GRAVITY = 0.6;
const JUMP_STRENGTH = 12;
const PLAYER_SPEED = 5;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

// キャンバス設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// キャンバスのサイズを強制設定
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ゲーム状態
let gameState = 'playing'; // playing, gameOver, cleared
let score = 0;
let coinsCollected = 0;
const TOTAL_COINS = 10;

// キー入力の状態
const keys = {};

// プレイヤークラス
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 48;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isJumping = false;
        this.direction = 1; // 1: 右, -1: 左
    }

    update(platforms) {
        // 水平移動
        this.velocityX = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        }

        this.x += this.velocityX;

        // 画面端の処理
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

        // 重力
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // ジャンプ
        if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && !this.isJumping) {
            this.velocityY = -JUMP_STRENGTH;
            this.isJumping = true;
        }

        // プラットフォームとの衝突判定
        let isOnGround = false;
        platforms.forEach(platform => {
            if (this.isCollidingWith(platform)) {
                // 上からの衝突
                if (this.velocityY >= 0 && this.y + this.height - this.velocityY <= platform.y + 10) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    isOnGround = true;
                    
                    // 移動するプラットフォームの上にいるとき、その速度を引き継ぐ
                    if (platform.type === 'moving') {
                        this.x += platform.moveDirection * 2;
                    }
                }
                // 下からの衝突
                else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height - 10) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
            }
        });

        // 落下死
        if (this.y > CANVAS_HEIGHT) {
            return false;
        }

        return true;
    }

    isCollidingWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw() {
        // 頭
        ctx.fillStyle = '#FFDBAC';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 6, 8, 0, Math.PI * 2);
        ctx.fill();

        // 目
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 6, this.y + 3, 3, 3);
        ctx.fillRect(this.x + 15, this.y + 3, 3, 3);

        // 口
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 8, 3, 0, Math.PI);
        ctx.stroke();

        // 帽子
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(this.x + 4, this.y - 2, 16, 5);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y + 2, 24, 3);

        // 胴体
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 4, this.y + 14, 16, 16);

        // 腕
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(this.x - 2, this.y + 14, 6, 4);
        ctx.fillRect(this.x + 20, this.y + 14, 6, 4);

        // ズボン（青）
        ctx.fillStyle = '#0000AA';
        ctx.fillRect(this.x + 6, this.y + 30, 6, 10);
        ctx.fillRect(this.x + 12, this.y + 30, 6, 10);

        // 靴
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 5, this.y + 40, 7, 4);
        ctx.fillRect(this.x + 12, this.y + 40, 7, 4);
    }
}

// プラットフォームクラス
class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'normal', 'moving'
        this.moveDirection = 1;
        this.moveRange = 100;
        this.baseX = x;
    }

    update() {
        if (this.type === 'moving') {
            this.x += this.moveDirection * 2;
            if (Math.abs(this.x - this.baseX) > this.moveRange) {
                this.moveDirection *= -1;
            }
        }
    }

    draw() {
        if (this.type === 'moving') {
            ctx.fillStyle = '#8B4513';
            ctx.globalAlpha = 0.8;
        } else {
            ctx.fillStyle = '#228B22';
            ctx.globalAlpha = 1;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1;

        // ブロックのテクスチャ
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// 敵クラス
class Enemy {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.direction = 1;
        this.speed = 2;
        this.moveRange = 150;
        this.baseX = x;
        this.isDefeated = false;
        this.defeatedTime = 0;
    }

    update() {
        if (!this.isDefeated) {
            this.x += this.direction * this.speed;
            if (Math.abs(this.x - this.baseX) > this.moveRange) {
                this.direction *= -1;
            }
        } else {
            // 倒れている状態の時間をカウント
            this.defeatedTime++;
            if (this.defeatedTime > 120) { // 2秒後に復活
                this.isDefeated = false;
                this.defeatedTime = 0;
            }
        }
    }

    isCollidingWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    defeat() {
        this.isDefeated = true;
        this.defeatedTime = 0;
    }

    draw() {
        if (this.isDefeated) {
            // 倒れている状態
            ctx.fillStyle = '#FF8C00';
            ctx.fillRect(this.x, this.y + 8, this.width, 8);
            
            // 目（×になっている）
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 4, this.y + 2);
            ctx.lineTo(this.x + 8, this.y + 6);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y + 2);
            ctx.lineTo(this.x + 4, this.y + 6);
            ctx.stroke();
        } else {
            // 立っている状態
            // 体
            ctx.fillStyle = '#FF8C00';
            ctx.fillRect(this.x, this.y, this.width, this.height - 10);

            // 頭
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + 8, 10, 0, Math.PI * 2);
            ctx.fill();

            // 目
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 5, this.y + 4, 4, 4);
            ctx.fillRect(this.x + this.width - 9, this.y + 4, 4, 4);

            // 角
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y - 2);
            ctx.lineTo(this.x + 4, this.y - 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 8, this.y - 2);
            ctx.lineTo(this.x + this.width - 4, this.y - 8);
            ctx.stroke();
        }
    }
}

// コイン/アイテムクラス
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.bobbing = 0;
        this.bobbingSpeed = 0.1;
        this.baseY = y;
    }

    update() {
        this.bobbing += this.bobbingSpeed;
        this.y = this.baseY + Math.sin(this.bobbing) * 5;
    }

    isCollidingWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ゴールクラス
class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
    }

    isCollidingWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw() {
        // ポール
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 15, this.y, 10, this.height);

        // フラッグ
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y + 10);
        ctx.lineTo(this.x + 25, this.y + 30);
        ctx.lineTo(this.x + 40, this.y + 20);
        ctx.closePath();
        ctx.fill();

        // 星
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = this.x + 20 + 8 * Math.cos(angle);
            const y = this.y + 50 + 8 * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}

// ゲーム初期化
let player;
let platforms = [];
let enemies = [];
let coins = [];
let goal;

function initGame() {
    gameState = 'playing';
    score = 0;
    coinsCollected = 0;
    player = new Player(50, CANVAS_HEIGHT - 100);

    // プラットフォーム配置
    platforms = [
        new Platform(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40, 'normal'), // 地面
        new Platform(200, 300, 150, 20, 'normal'),
        new Platform(450, 280, 150, 20, 'normal'),
        new Platform(100, 220, 120, 20, 'moving'),
        new Platform(550, 200, 120, 20, 'moving'),
        new Platform(300, 150, 150, 20, 'normal'),
    ];

    // 敵配置 - プラットフォームの上に配置
    enemies = [
        new Enemy(250, 270, 30, 20),
        new Enemy(500, 250, 30, 20),
    ];

    // コイン配置
    coins = [
        new Coin(250, 260),
        new Coin(300, 230),
        new Coin(450, 240),
        new Coin(500, 210),
        new Coin(150, 180),
        new Coin(350, 120),
        new Coin(600, 160),
        new Coin(200, 100),
        new Coin(700, 80),
        new Coin(400, 60),
    ];

    // ゴール
    goal = new Goal(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 120);

    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coinsCollected;
}

// メインゲームループ
function gameLoop() {
    // 背景クリア
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ゲームが実行中の場合
    if (gameState === 'playing') {
        // プレイヤー更新
        if (!player.update(platforms)) {
            endGame('ゲームオーバー', 'あなたは落ちてしまいました...');
        }

        // プラットフォーム更新と描画
        platforms.forEach(platform => {
            platform.update();
            platform.draw();
        });

        // 敵の更新と描画
        enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();

            // プレイヤーとの衝突判定
            if (player.isCollidingWith(enemy)) {
                // 上からの踏みつけチェック
                if (player.velocityY > 0 && player.y + player.height - 10 < enemy.y + 10) {
                    // 敵を倒す
                    enemy.defeat();
                    player.velocityY = -JUMP_STRENGTH * 0.7; // ジャンプを少し弾ませる
                    score += 200;
                    document.getElementById('score').textContent = score;
                } else if (!enemy.isDefeated) {
                    // 倒れていない敵に接触したらゲームオーバー
                    endGame('ゲームオーバー', 'クッパにやられてしまった...');
                }
            }
        });

        // コイン更新と描画
        coins.forEach((coin, index) => {
            coin.update();
            coin.draw();

            if (player.isCollidingWith(coin)) {
                coins.splice(index, 1);
                coinsCollected++;
                score += 100;
                document.getElementById('coins').textContent = coinsCollected;
                document.getElementById('score').textContent = score;
            }
        });

        // ゴール描画と判定
        goal.draw();
        if (player.isCollidingWith(goal)) {
            const bonus = (TOTAL_COINS - coinsCollected) * 500 + 1000;
            score += bonus;
            document.getElementById('score').textContent = score;
            endGame('クリア！', `おめでとう！\nスコア: ${score}`);
        }

        // プレイヤー描画
        player.draw();
    }

    requestAnimationFrame(gameLoop);
}

// ゲーム終了
function endGame(title, message) {
    gameState = 'gameOver';
    document.getElementById('gameOverTitle').textContent = title;
    document.getElementById('gameOverMessage').textContent = message;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// イベントリスナー
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initGame();
    document.getElementById('gameOverScreen').classList.add('hidden');
});

document.getElementById('retryBtn').addEventListener('click', () => {
    initGame();
    document.getElementById('gameOverScreen').classList.add('hidden');
});

// ゲーム開始
initGame();
gameLoop();