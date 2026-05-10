import { Scene } from '@tialops/maki'
import { GameState, HUD } from './GameState.js'

const STATE = { PATROL: 'patrol', CHASE: 'chase', DISTRACTED: 'distracted', DEAD: 'dead' }

export default class BazaarScene extends Scene {
  constructor() {
    super('BazaarScene')
  }

  preload() {
    this._makiPlayers = []
    super.preload()
    this.arjun = this.maki.player('lia')
  }

  create() {
    super.create()

    const W = 1600, H = 1600
    this.physics.world.setBounds(0, 0, W, H)

    this.cameras.main.setBounds(0, 0, W, H)
    this.cameras.main.setZoom(2)

    this._drawDesertWorld(W, H)

    this.arjun.sprite.setPosition(800, 800)
    this.arjun.sprite.setTint(0xffbb88)
    this.arjun.sprite.setDepth(10)
    this.arjun.sprite.body.setCollideWorldBounds(true)
    this.cameras.main.startFollow(this.arjun.sprite, true, 0.08, 0.08)

    this.walls = this.physics.add.staticGroup()
    this._buildWalls(W, H)
    this.physics.add.collider(this.arjun.sprite, this.walls)

    this.guards = this.physics.add.group()
    const guardSpots = [
      [400, 400, 'Sharma'], [1200, 400, 'Dubey'],
      [400, 1200, 'Pandey'], [1200, 1200, 'Verma'],
      [800, 300, 'Raju'], [300, 800, 'Mohan'], [1300, 800, 'Gopal']
    ]
    guardSpots.forEach(([x, y, n]) => this._spawnGuard(x, y, n))

    this.chais = this.physics.add.staticGroup()
    this._spawnChais()

    this.rotiPickups = this.physics.add.staticGroup()
    this._spawnRotis()

    this.portal = this.add.graphics().setDepth(8)
    this.portal.fillStyle(0x00ffff, 0.9)
    this.portal.fillRect(-20, -20, 40, 40)
    this.portal.fillStyle(0xffd700, 1)
    this.portal.fillTriangle(0, -30, -12, -18, 12, -18)
    this.portal.setPosition(1450, 1450)
    this.physics.add.existing(this.portal, true)
    this.add.text(1450, 1420, 'PALACE', {
      fontSize: '14px', fontFamily: 'monospace', color: '#00ffff',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(9)
    this.tweens.add({ targets: this.portal, alpha: { from: 0.5, to: 1 }, duration: 600, yoyo: true, repeat: -1 })

    this.dadiSpot = this.add.graphics().setDepth(8)
    this._drawDadi(this.dadiSpot)
    this.dadiSpot.setPosition(750, 850)
    this.physics.add.existing(this.dadiSpot, true)
    this.add.text(750, 820, 'DADI', { fontSize: '12px', fontFamily: 'monospace', color: '#ff88ff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(9)

    this.rotiBullets = this.physics.add.group()
    this.physics.add.overlap(this.rotiBullets, this.guards, this._rotiHit, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.guards, this._guardCaught, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.chais, this._collectChai, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.rotiPickups, this._collectRoti, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.portal, this._enterPortal, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.dadiSpot, this._giveToDadi, null, this)

    this.hud = new HUD(this)
    GameState.level = 1
    this._caught = false
    this._dadiGiven = false
    this._lastThrow = 0

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      b: Phaser.Input.Keyboard.KeyCodes.B
    })

    this.time.addEvent({ delay: 2000, callback: this._decayAunty, callbackScope: this, loop: true })
    this.time.addEvent({ delay: 8000, callback: this._dadiPops, callbackScope: this, loop: true })

    const { width } = this.scale
    const banner = this.add.text(width / 2, 60, 'THE DESERT BAZAAR  --  Collect CHAI + ROTI, defeat guards!', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(120)
    this.tweens.add({ targets: banner, alpha: 0, delay: 4000, duration: 1000 })

    this.hud.showNotif('Walk over CHAI to collect! SPACE = throw ROTI to kill guards!', '#ffd700', 5000)
    this.cameras.main.fadeIn(800)
  }

  _drawDesertWorld(W, H) {
    const bg = this.add.graphics().setDepth(0)
    bg.fillStyle(0xd4a843, 1)
    bg.fillRect(0, 0, W, H)

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W)
      const y = Phaser.Math.Between(0, H)
      bg.fillStyle(i % 3 === 0 ? 0xc49a35 : 0xe4b853, 0.6)
      bg.fillEllipse(x, y, Phaser.Math.Between(20, 60), Phaser.Math.Between(8, 20))
    }

    const paths = this.add.graphics().setDepth(1)
    paths.fillStyle(0xe8c878, 0.6)
    paths.fillRect(W / 2 - 40, 0, 80, H)
    paths.fillRect(0, H / 2 - 40, W, 80)

    const buildings = this.add.graphics().setDepth(2)
    const bldgs = [
      { x: 100, y: 100, w: 160, h: 120, col: 0xe8c898, roof: 0xc8a070 },
      { x: 400, y: 80, w: 200, h: 140, col: 0xf0d0a0, roof: 0xd0a060 },
      { x: 1000, y: 80, w: 180, h: 130, col: 0xe8c090, roof: 0xc89050 },
      { x: 1350, y: 100, w: 160, h: 120, col: 0xf0c880, roof: 0xd0a860 },
      { x: 80, y: 1300, w: 200, h: 180, col: 0xe0c890, roof: 0xc0a070 },
      { x: 1350, y: 1300, w: 180, h: 160, col: 0xf0d0a0, roof: 0xd0b080 },
      { x: 650, y: 1350, w: 300, h: 200, col: 0xe8c898, roof: 0xc8a878 },
    ]
    bldgs.forEach(b => {
      buildings.fillStyle(b.col, 1)
      buildings.fillRect(b.x, b.y, b.w, b.h)
      buildings.fillStyle(b.roof, 1)
      buildings.fillRect(b.x, b.y, b.w, 18)
      buildings.fillStyle(0x000000, 0.2)
      buildings.fillRect(b.x + b.w * 0.3, b.y + 20, b.w * 0.25, b.h * 0.5)
      buildings.fillRect(b.x + b.w * 0.6, b.y + 20, b.w * 0.2, b.h * 0.45)
      buildings.fillStyle(0xffd700, 0.4)
      buildings.fillRect(b.x, b.y, b.w, 6)
    })

    const palace = this.add.graphics().setDepth(2)
    palace.fillStyle(0xf5e6c8, 1)
    palace.fillRect(1200, 1200, 380, 380)
    palace.fillStyle(0xe8d4a0, 1)
    palace.fillRect(1200, 1200, 380, 30)
    palace.fillRect(1200, 1200, 30, 380)
    palace.fillRect(1550, 1200, 30, 380)
    palace.fillRect(1200, 1550, 380, 30)
    palace.fillStyle(0xd4b870, 1)
    palace.fillTriangle(1270, 1200, 1310, 1155, 1350, 1200)
    palace.fillTriangle(1360, 1200, 1395, 1152, 1430, 1200)
    palace.fillTriangle(1450, 1200, 1485, 1155, 1520, 1200)
    palace.fillStyle(0xffd700, 0.6)
    palace.fillRect(1200, 1198, 380, 5)
    palace.fillStyle(0x8B4513, 0.5)
    palace.fillRect(1365, 1350, 70, 230)
    palace.fillStyle(0x4444cc, 0.3)
    palace.fillRect(1250, 1260, 60, 80)
    palace.fillRect(1470, 1260, 60, 80)

    const oasis = this.add.graphics().setDepth(2)
    oasis.fillStyle(0x2288cc, 0.85)
    oasis.fillEllipse(300, 700, 100, 70)
    oasis.fillStyle(0x1a6699, 0.5)
    oasis.fillEllipse(300, 710, 80, 50)
    const trees = [[265, 670], [310, 660], [335, 675], [280, 685]]
    trees.forEach(([tx, ty]) => {
      oasis.fillStyle(0x6B4226, 1)
      oasis.fillRect(tx - 3, ty, 6, 20)
      oasis.fillStyle(0x228822, 1)
      oasis.fillEllipse(tx, ty - 5, 28, 22)
      oasis.fillStyle(0x44aa44, 0.6)
      oasis.fillEllipse(tx + 5, ty - 10, 18, 14)
    })

    const oasis2 = this.add.graphics().setDepth(2)
    oasis2.fillStyle(0x2288cc, 0.85)
    oasis2.fillEllipse(1300, 700, 90, 60)
    const trees2 = [[1270, 665], [1315, 658], [1330, 672]]
    trees2.forEach(([tx, ty]) => {
      oasis2.fillStyle(0x6B4226, 1)
      oasis2.fillRect(tx - 3, ty, 6, 18)
      oasis2.fillStyle(0x228822, 1)
      oasis2.fillEllipse(tx, ty - 4, 26, 20)
    })

    const well = this.add.graphics().setDepth(3)
    well.fillStyle(0x888888, 1)
    well.fillEllipse(800, 500, 50, 35)
    well.fillStyle(0x666666, 1)
    well.fillRect(776, 500, 48, 25)
    well.fillStyle(0x444444, 1)
    well.fillEllipse(800, 525, 46, 22)
    well.fillStyle(0x8B4513, 1)
    well.fillRect(772, 490, 6, 30)
    well.fillRect(822, 490, 6, 30)
    well.fillRect(772, 490, 56, 6)

    const stalls = this.add.graphics().setDepth(3)
    const stallData = [
      { x: 550, y: 180, col: 0xff4444 },
      { x: 850, y: 180, col: 0x4488ff },
      { x: 180, y: 550, col: 0xffaa00 },
      { x: 180, y: 850, col: 0x44cc44 },
      { x: 1380, y: 550, col: 0xff44aa },
      { x: 1380, y: 850, col: 0xaa44ff },
      { x: 550, y: 1380, col: 0xff8800 },
      { x: 850, y: 1380, col: 0x00cccc },
    ]
    stallData.forEach(s => {
      stalls.fillStyle(s.col, 1)
      stalls.fillRect(s.x - 40, s.y - 25, 80, 50)
      stalls.fillStyle(0x000000, 0.25)
      stalls.fillRect(s.x - 40, s.y + 20, 80, 8)
      stalls.fillStyle(0xffffff, 0.2)
      stalls.fillRect(s.x - 40, s.y - 25, 80, 7)
      stalls.fillStyle(s.col, 0.4)
      stalls.fillTriangle(s.x - 50, s.y - 25, s.x, s.y - 45, s.x + 50, s.y - 25)
    })

    const cows = this.add.graphics().setDepth(4)
    [[600, 600], [1000, 500], [500, 1100]].forEach(([cx, cy]) => {
      cows.fillStyle(0xffffff, 1)
      cows.fillRect(cx - 22, cy - 10, 44, 28)
      cows.fillStyle(0xdddddd, 1)
      cows.fillRect(cx - 15, cy + 18, 10, 16)
      cows.fillRect(cx - 2, cy + 18, 10, 16)
      cows.fillRect(cx + 8, cy + 18, 10, 14)
      cows.fillRect(cx - 22, cy + 16, 10, 14)
      cows.fillStyle(0xffffff, 1)
      cows.fillRect(cx - 22, cy - 22, 20, 16)
      cows.fillStyle(0xffaaaa, 1)
      cows.fillRect(cx - 22, cy - 10, 8, 6)
      cows.fillStyle(0x333333, 1)
      cows.fillCircle(cx - 14, cy - 20, 3)
      cows.fillStyle(0xffd700, 0.7)
      cows.fillRect(cx - 12, cy - 30, 4, 10)
      cows.fillRect(cx - 8, cy - 30, 4, 10)
      cows.fillStyle(0xff8888, 0.5)
      cows.fillEllipse(cx + 5, cy + 8, 15, 10)
      this.add.text(cx, cy - 38, 'SACRED COW', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffffff', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(5)
    })
  }

  _buildWalls(W, H) {
    const addWall = (x, y, w, h) => {
      const wall = this.add.rectangle(x + w/2, y + h/2, w, h, 0x000000, 0)
      this.physics.add.existing(wall, true)
      this.walls.add(wall)
    }
    addWall(0, 0, W, 10)
    addWall(0, H - 10, W, 10)
    addWall(0, 0, 10, H)
    addWall(W - 10, 0, 10, H)
    const bldgs = [
      [100, 100, 160, 120], [400, 80, 200, 140], [1000, 80, 180, 130],
      [1350, 100, 160, 120], [80, 1300, 200, 180], [1350, 1300, 180, 160],
      [650, 1350, 300, 200],
    ]
    bldgs.forEach(([x, y, w, h]) => addWall(x, y, w, h))
  }

  _spawnGuard(x, y, name) {
    const g = this.add.graphics().setDepth(10)
    this._drawGuardGraphic(g, false)
    this.physics.add.existing(g)
    g.body.setCollideWorldBounds(true)
    g.body.setSize(16, 28)
    g.setPosition(x, y)

    g.nameLabel = this.add.text(x, y - 30, name, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11)

    g.guardName = name
    g.state = STATE.PATROL
    g.hp = 1
    g.alertLevel = 0
    g.chasing = false
    g.patrolPoints = [
      new Phaser.Math.Vector2(x - 120, y),
      new Phaser.Math.Vector2(x + 120, y),
      new Phaser.Math.Vector2(x, y - 120),
      new Phaser.Math.Vector2(x, y + 120)
    ]
    g.patrolIndex = 0

    this.time.addEvent({
      delay: Phaser.Math.Between(10000, 20000),
      callback: () => this._distractGuard(g), loop: true
    })
    this.guards.add(g)
    return g
  }

  _drawGuardGraphic(g, chasing) {
    g.clear()
    const bodyCol = chasing ? 0xcc0000 : 0x8B0000
    g.fillStyle(0xffcc88, 1)
    g.fillCircle(0, -20, 8)
    g.fillStyle(0x222222, 1)
    g.fillRect(-5, -28, 10, 6)
    g.fillStyle(bodyCol, 1)
    g.fillRect(-9, -13, 18, 22)
    g.fillStyle(0xffd700, 1)
    g.fillRect(-9, -13, 18, 3)
    g.fillRect(-9, -7, 18, 3)
    g.fillRect(-9, -1, 18, 3)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(-13, -12, 4, 14)
    g.fillRect(9, -12, 4, 14)
    g.fillStyle(0x8B4513, 1)
    g.fillRect(-6, 9, 5, 14)
    g.fillRect(1, 9, 5, 14)
    g.fillStyle(0x333333, 1)
    g.fillRect(-7, 20, 6, 5)
    g.fillRect(1, 20, 6, 5)
    if (chasing) {
      g.fillStyle(0xff4444, 0.6)
      g.fillCircle(0, -20, 10)
    }
  }

  _spawnChais() {
    const positions = [
      [500,500],[1100,500],[500,1100],[1100,1100],
      [800,400],[400,800],[1200,800],[800,1200],
      [650,650],[950,650],[650,950],[950,950],
      [200,400],[1400,400],[200,1000],[1400,1000]
    ]
    positions.forEach(([x, y]) => {
      const c = this.add.graphics().setDepth(6)
      c.fillStyle(0x8B4513, 1)
      c.fillRect(-9, -7, 18, 16)
      c.fillStyle(0xD2691E, 1)
      c.fillRect(-7, -10, 14, 5)
      c.fillStyle(0xc8520a, 1)
      c.fillRect(8, -4, 5, 6)
      c.fillStyle(0xffdd88, 1)
      c.fillEllipse(0, -3, 12, 8)
      c.fillStyle(0xff9900, 0.8)
      c.fillEllipse(0, -3, 8, 5)
      c.setPosition(x, y)
      this.physics.add.existing(c, true)
      this.tweens.add({ targets: c, y: y - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.chais.add(c)
      this.add.text(x, y - 22, 'CHAI', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffd700', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(7)
    })
  }

  _spawnRotis() {
    const positions = [
      [350,350],[1250,350],[350,1250],[1250,1250],
      [800,600],[600,800],[1000,800],[800,1000],
      [450,600],[1150,600],[450,1000],[1150,1000],
      [700,300],[900,300],[300,600],[1300,600],
      [700,1100],[900,1100]
    ]
    positions.forEach(([x, y]) => {
      const r = this.add.graphics().setDepth(6)
      r.fillStyle(0xD2691E, 1)
      r.fillEllipse(0, 0, 24, 18)
      r.fillStyle(0xC4A35A, 1)
      r.fillEllipse(0, 0, 18, 13)
      r.fillStyle(0xD2691E, 0.6)
      r.fillEllipse(-4, -2, 9, 7)
      r.fillEllipse(4, 3, 7, 6)
      r.fillStyle(0xffffff, 0.3)
      r.fillEllipse(-2, -4, 5, 4)
      r.setPosition(x, y)
      this.physics.add.existing(r, true)
      this.tweens.add({ targets: r, angle: 360, duration: 1800, repeat: -1 })
      this.rotiPickups.add(r)
      this.add.text(x, y - 18, 'ROTI', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffaa00', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(7)
    })
  }

  _drawDadi(g) {
    g.clear()
    g.fillStyle(0x9944aa, 1)
    g.fillRect(-10, -12, 20, 24)
    g.fillStyle(0xffcc88, 1)
    g.fillCircle(0, -20, 9)
    g.fillStyle(0xffffff, 1)
    g.fillRect(-11, -25, 22, 7)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(-14, -10, 4, 14)
    g.fillRect(10, -10, 4, 14)
    g.fillStyle(0x9944aa, 1)
    g.fillRect(-5, 12, 5, 14)
    g.fillRect(0, 12, 5, 14)
    g.fillStyle(0xff88ff, 0.4)
    g.fillCircle(0, 0, 22)
  }

  _updateGuards(delta) {
    const px = this.arjun.sprite.x
    const py = this.arjun.sprite.y
    const blending = GameState.blendActive

    this.guards.getChildren().forEach(g => {
      if (!g.active || g.state === STATE.DEAD) return
      g.nameLabel.setPosition(g.x, g.y - 30)
      const dist = Phaser.Math.Distance.Between(g.x, g.y, px, py)
      const range = blending ? 40 : 160

      if (g.state === STATE.DISTRACTED) {
        g.body.setVelocity(0, 0)
        return
      }

      if (dist < range && !blending) {
        g.alertLevel = Math.min(100, g.alertLevel + delta * 0.08)
        if (g.alertLevel > 50) {
          if (g.state !== STATE.CHASE) {
            g.state = STATE.CHASE
            GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 10)
            this.hud.showNotif(g.guardName + ': "AYE RUKO TUM!"', '#ff4444', 1200)
          }
        }
      } else {
        g.alertLevel = Math.max(0, g.alertLevel - delta * 0.05)
        if (g.alertLevel <= 0 && g.state === STATE.CHASE) {
          g.state = STATE.PATROL
          this._drawGuardGraphic(g, false)
        }
      }

      if (g.state === STATE.CHASE) {
        this.physics.moveToObject(g, this.arjun.sprite, 80)
        this._drawGuardGraphic(g, true)
      } else {
        const target = g.patrolPoints[g.patrolIndex]
        const td = Phaser.Math.Distance.Between(g.x, g.y, target.x, target.y)
        if (td < 15) g.patrolIndex = (g.patrolIndex + 1) % g.patrolPoints.length
        this.physics.moveToObject(g, target, 35)
      }
    })
  }

  _distractGuard(g) {
    if (!g.active || g.state === STATE.DEAD || g.state === STATE.CHASE) return
    g.state = STATE.DISTRACTED
    g.body.setVelocity(0, 0)
    const bubble = this.add.text(g.x, g.y - 45, 'mmm tiffin time...', {
      fontSize: '10px', fontFamily: 'monospace', color: '#fff',
      backgroundColor: '#333', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(4500, () => {
      if (bubble.active) bubble.destroy()
      if (g.active) { g.state = STATE.PATROL; this._drawGuardGraphic(g, false) }
    })
  }

  _throwRoti() {
    const now = this.time.now
    if (now - this._lastThrow < 300) return
    this._lastThrow = now

    if (GameState.rotis <= 0) {
      this.hud.showNotif('NO ROTIS! Walk over the spinning brown circles!', '#ff4444', 2000)
      return
    }
    GameState.rotis--

    const dx = this.arjun.sprite.x
    const dy = this.arjun.sprite.y

    const bullet = this.add.graphics().setDepth(12)
    bullet.fillStyle(0xD2691E, 1)
    bullet.fillEllipse(0, 0, 22, 16)
    bullet.fillStyle(0xC4A35A, 1)
    bullet.fillEllipse(0, 0, 16, 11)
    bullet.fillStyle(0xffffff, 0.4)
    bullet.fillEllipse(-3, -3, 7, 5)
    this.physics.add.existing(bullet)
    bullet.setPosition(dx, dy)
    bullet.body.setSize(22, 16)

    const nearest = this._nearestActiveGuard()
    let vx = 400, vy = 0
    if (nearest) {
      const angle = Phaser.Math.Angle.Between(dx, dy, nearest.x, nearest.y)
      vx = Math.cos(angle) * 420
      vy = Math.sin(angle) * 420
    }
    bullet.body.setVelocity(vx, vy)
    this.tweens.add({ targets: bullet, angle: 360, duration: 350, repeat: -1 })
    this.rotiBullets.add(bullet)
    this.time.delayedCall(2500, () => { if (bullet.active) bullet.destroy() })
    this.hud.update()
  }

  _toggleBlend() {
    GameState.blendActive = !GameState.blendActive
    if (GameState.blendActive) {
      this.arjun.sprite.setAlpha(0.4)
      this.hud.showNotif('BLEND MODE -- you are invisible to guards!', '#aaffaa', 2000)
      this.time.delayedCall(7000, () => {
        GameState.blendActive = false
        this.arjun.sprite.setAlpha(1)
      })
    } else {
      this.arjun.sprite.setAlpha(1)
      this.hud.showNotif('Blend OFF', '#ffaaaa', 1000)
    }
    this.hud.update()
  }

  _guardCaught(player, guard) {
    if (this._caught || guard.state !== STATE.CHASE || !guard.active) return
    this._caught = true
    GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 20)
    this.cameras.main.shake(300, 0.01)
    this.hud.showNotif('CAUGHT by ' + guard.guardName + '! Aunty Meter +20%!', '#ff3333', 2000)
    const angle = Phaser.Math.Angle.Between(guard.x, guard.y, player.x, player.y)
    player.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300)
    this.time.delayedCall(700, () => { this._caught = false })
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'aunty' })
  }

  _collectChai(player, chai) {
    chai.destroy()
    GameState.chai++
    GameState.score += 100
    GameState.rotis = Math.min(15, GameState.rotis + 1)
    this.cameras.main.flash(200, 255, 215, 0)
    this.hud.showNotif('CHAI! Power up! ' + GameState.chai + '/3  +1 Roti!', '#ffd700', 1500)
    this.hud.update()
    if (GameState.chai >= 3) {
      this.time.delayedCall(200, () => {
        this.hud.showNotif('3 CHAI collected! Go to PALACE portal (bottom-right corner)!', '#00ffcc', 4000)
      })
    }
  }

  _collectRoti(player, roti) {
    roti.destroy()
    GameState.rotis = Math.min(15, GameState.rotis + 2)
    GameState.score += 30
    this.hud.showNotif('+2 Rotis! SPACE to throw!', '#ffcc88', 1000)
    this.hud.update()
  }

  _rotiHit(roti, guard) {
    if (!guard.active || guard.state === STATE.DEAD) return
    roti.destroy()
    guard.state = STATE.DEAD
    guard.body.setVelocity(0, 0)
    GameState.score += 300

    guard.clear()
    guard.fillStyle(0x888888, 0.5)
    guard.fillEllipse(0, 5, 20, 10)
    guard.fillStyle(0xffcc88, 0.5)
    guard.fillCircle(0, -5, 7)

    this.add.text(guard.x, guard.y - 35, 'KO!', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffff00',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(15)

    this.hud.showNotif(guard.guardName + ' KOd by roti! +300pts', '#00ff88', 1500)
    guard.nameLabel.setText('x')
    guard.nameLabel.setColor('#888888')

    this.time.delayedCall(1500, () => {
      if (guard.nameLabel?.active) guard.nameLabel.destroy()
      if (guard.active) guard.destroy()
    })
    this.hud.update()
  }

  _giveToDadi(player, dadi) {
    if (this._dadiGiven || GameState.rotis <= 0) return
    this._dadiGiven = true
    const given = GameState.rotis
    GameState.rotis = 0
    GameState.score += given * 80
    GameState.auntyLevel = Math.max(0, GameState.auntyLevel - 40)
    this.hud.showNotif('Dadi: "Shukriya beta! Aunty level -40%!" +' + (given * 80) + 'pts', '#ff88ff', 3000)
    this.hud.update()
    this.time.delayedCall(6000, () => { this._dadiGiven = false })
  }

  _enterPortal() {
    if (GameState.chai < 3) {
      this.hud.showNotif('Need 3 CHAI first! (' + GameState.chai + '/3)', '#ff6666', 1500)
      return
    }
    this.cameras.main.fadeOut(800, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('PalaceScene') })
  }

  _nearestActiveGuard() {
    let nearest = null, minD = Infinity
    this.guards.getChildren().forEach(g => {
      if (!g.active || g.state === STATE.DEAD) return
      const d = Phaser.Math.Distance.Between(this.arjun.sprite.x, this.arjun.sprite.y, g.x, g.y)
      if (d < minD) { minD = d; nearest = g }
    })
    return nearest
  }

  _decayAunty() {
    if (GameState.auntyLevel > 0) GameState.auntyLevel = Math.max(0, GameState.auntyLevel - 2)
  }

  _dadiPops() {
    const msgs = [
      'Dadi: "Beta give me your rotis!"',
      'Dadi: "Stop running, eat something!"',
      'Dadi: "That Sharma is your cousin!"',
      'Dadi: "Rotis! Come here baba!"',
      'Dadi: "Why are you running??"'
    ]
    const x = Phaser.Math.Between(400, 1200)
    const y = Phaser.Math.Between(400, 1200)
    const g = this.add.graphics().setDepth(15)
    this._drawDadi(g)
    g.setPosition(x, y)
    const bubble = this.add.text(x, y - 38, Phaser.Utils.Array.GetRandom(msgs), {
      fontSize: '11px', fontFamily: 'monospace', color: '#fff',
      backgroundColor: '#883388', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(16)
    this.tweens.add({ targets: [g, bubble], alpha: 0, delay: 4000, duration: 800, onComplete: () => { g.destroy(); bubble.destroy() } })
  }

  update(time, delta) {
    if (this._caught) return
    this.maki.move(this.arjun)
    const body = this.arjun.sprite.body
    const speed = GameState.blendActive ? 60 : 150
    if (this.keys.left.isDown || this.keys.a.isDown) body.setVelocityX(-speed)
    if (this.keys.right.isDown || this.keys.d.isDown) body.setVelocityX(speed)
    if (this.keys.up.isDown || this.keys.w.isDown) body.setVelocityY(-speed)
    if (this.keys.down.isDown || this.keys.s.isDown) body.setVelocityY(speed)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this._throwRoti()
    if (Phaser.Input.Keyboard.JustDown(this.keys.b)) this._toggleBlend()
    this._updateGuards(delta)
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'aunty' })
    this.hud.update()
  }
}
