import { Scene, manager } from '@tialops/maki'
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
    manager.map(this, 'default_map')
    manager.preload(this)
  }

  create() {
    super.create()
    manager.create(this)

    const W = 800, H = 800
    this.cameras.main.setBackgroundColor('#d4a843')
    this.cameras.main.setZoom(1)
    this.cameras.main.setBounds(0, 0, W, H)

    this._drawDesertWorld()

    this.arjun.sprite.setPosition(400, 400)
    this.arjun.sprite.setTint(0xffbb88)
    this.arjun.sprite.setDepth(10)
    this.arjun.sprite.body.setCollideWorldBounds(true)
    this.cameras.main.startFollow(this.arjun.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)

    this.guards = this.physics.add.group()
    this._spawnGuard(200, 200, 'Sharma')
    this._spawnGuard(600, 200, 'Dubey')
    this._spawnGuard(200, 600, 'Pandey')
    this._spawnGuard(600, 600, 'Verma')
    this._spawnGuard(400, 150, 'Raju')
    this._spawnGuard(150, 400, 'Mohan')
    this._spawnGuard(650, 400, 'Gopal')

    this.chais = this.physics.add.staticGroup()
    this.chaiVisuals = []
    this._spawnChais()

    this.rotiPickups = this.physics.add.staticGroup()
    this.rotiVisuals = []
    this._spawnRotis()

    const portalVis = this.add.graphics().setDepth(8)
    portalVis.fillStyle(0x00ffff, 0.9)
    portalVis.fillRect(-18, -18, 36, 36)
    portalVis.fillStyle(0xffd700, 1)
    portalVis.fillRect(-18, -18, 36, 6)
    portalVis.fillRect(-18, 12, 36, 6)
    portalVis.setPosition(720, 720)
    this.tweens.add({ targets: portalVis, alpha: { from: 0.5, to: 1 }, duration: 600, yoyo: true, repeat: -1 })
    this.add.text(720, 698, 'PALACE GATE', {
      fontSize: '9px', fontFamily: 'monospace', color: '#00ffff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(9)
    this.portal = this.add.rectangle(720, 720, 40, 40, 0x000000, 0)
    this.physics.add.existing(this.portal, true)

    const dadiVis = this.add.graphics().setDepth(8)
    this._drawDadiGraphic(dadiVis)
    dadiVis.setPosition(400, 350)
    this.add.text(400, 322, 'DADI -- give rotis!', {
      fontSize: '9px', fontFamily: 'monospace', color: '#ff88ff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(9)
    this.dadiZone = this.add.rectangle(400, 350, 40, 40, 0x000000, 0)
    this.physics.add.existing(this.dadiZone, true)

    this.rotiBullets = this.physics.add.group()

    this.physics.add.overlap(this.rotiBullets, this.guards, this._rotiHit, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.guards, this._guardCaught, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.chais, this._collectChai, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.rotiPickups, this._collectRoti, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.portal, this._enterPortal, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.dadiZone, this._giveToDadi, null, this)

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
    this.time.addEvent({ delay: 7000, callback: this._dadiPops, callbackScope: this, loop: true })

    const { width } = this.scale
    const banner = this.add.text(width / 2, 65, 'DESERT BAZAAR  |  Collect CHAI+ROTI  |  SPACE=throw roti  |  B=blend', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(220)
    this.tweens.add({ targets: banner, alpha: 0, delay: 5000, duration: 1000 })

    this.hud.showNotif('Walk over CHAI cups and ROTI circles to collect them!', '#ffd700', 4000)
    this.cameras.main.fadeIn(600)
  }

  _drawDesertWorld() {
    const bg = this.add.graphics().setDepth(0)
    bg.fillStyle(0xd4a843, 1)
    bg.fillRect(0, 0, 800, 800)

    for (let i = 0; i < 40; i++) {
      bg.fillStyle(i % 2 === 0 ? 0xc49a35 : 0xe4b853, 0.5)
      bg.fillEllipse(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(15, 50),
        Phaser.Math.Between(6, 16)
      )
    }

    const road = this.add.graphics().setDepth(1)
    road.fillStyle(0xe8c878, 0.5)
    road.fillRect(360, 0, 80, 800)
    road.fillRect(0, 360, 800, 80)

    const stalls = this.add.graphics().setDepth(2)
    const stallData = [
      { x: 80, y: 80, col: 0xff4444 },
      { x: 220, y: 80, col: 0x4488ff },
      { x: 500, y: 80, col: 0x44cc44 },
      { x: 650, y: 80, col: 0xffaa00 },
      { x: 80, y: 680, col: 0xaa44ff },
      { x: 650, y: 680, col: 0xff44aa },
      { x: 350, y: 680, col: 0x00cccc },
      { x: 80, y: 350, col: 0xff8800 },
      { x: 680, y: 350, col: 0x8800ff },
    ]
    stallData.forEach(s => {
      stalls.fillStyle(s.col, 1)
      stalls.fillRect(s.x - 35, s.y - 20, 70, 44)
      stalls.fillStyle(0x000000, 0.2)
      stalls.fillRect(s.x - 35, s.y + 18, 70, 7)
      stalls.fillStyle(s.col, 0.5)
      stalls.fillTriangle(s.x - 42, s.y - 20, s.x, s.y - 44, s.x + 42, s.y - 20)
      stalls.fillStyle(0xffffff, 0.25)
      stalls.fillRect(s.x - 35, s.y - 20, 70, 6)
    })

    const trees = this.add.graphics().setDepth(2)
    const treeSpots = [[130, 480], [160, 520], [145, 560], [600, 150], [630, 190], [615, 170]]
    treeSpots.forEach(([tx, ty]) => {
      trees.fillStyle(0x1a6699, 0.8)
      trees.fillEllipse(tx - 20, ty + 10, 50, 30)
      trees.fillStyle(0x6B4226, 1)
      trees.fillRect(tx - 3, ty, 6, 22)
      trees.fillStyle(0x228822, 1)
      trees.fillEllipse(tx, ty - 6, 30, 24)
      trees.fillStyle(0x44aa44, 0.6)
      trees.fillEllipse(tx + 6, ty - 12, 20, 16)
    })

    const well = this.add.graphics().setDepth(3)
    well.fillStyle(0x999999, 1)
    well.fillEllipse(500, 300, 44, 30)
    well.fillStyle(0x777777, 1)
    well.fillRect(479, 300, 42, 22)
    well.fillStyle(0x555555, 1)
    well.fillEllipse(500, 322, 40, 20)
    well.fillStyle(0x8B4513, 1)
    well.fillRect(476, 293, 5, 28)
    well.fillRect(519, 293, 5, 28)
    well.fillRect(476, 293, 48, 5)

    const cows = this.add.graphics().setDepth(3)
    const cowSpots = [[280, 280], [520, 520]]
    cowSpots.forEach(([cx, cy]) => {
      cows.fillStyle(0xffffff, 1)
      cows.fillRect(cx - 22, cy - 10, 44, 26)
      cows.fillStyle(0xdddddd, 1)
      cows.fillRect(cx - 14, cy + 16, 9, 14)
      cows.fillRect(cx - 2, cy + 16, 9, 14)
      cows.fillRect(cx + 8, cy + 16, 9, 13)
      cows.fillRect(cx - 21, cy + 15, 9, 13)
      cows.fillStyle(0xffffff, 1)
      cows.fillRect(cx - 22, cy - 22, 18, 14)
      cows.fillStyle(0xffaaaa, 1)
      cows.fillRect(cx - 22, cy - 10, 7, 5)
      cows.fillStyle(0x333333, 1)
      cows.fillCircle(cx - 13, cy - 20, 3)
      cows.fillStyle(0xffd700, 0.8)
      cows.fillRect(cx - 11, cy - 30, 4, 10)
      cows.fillRect(cx - 7, cy - 30, 4, 10)
      this.add.text(cx, cy - 38, 'SACRED COW', {
        fontSize: '8px', fontFamily: 'monospace', color: '#ffffff', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(4)
    })

    const palace = this.add.graphics().setDepth(2)
    palace.fillStyle(0xf5e6c8, 1)
    palace.fillRect(650, 650, 140, 140)
    palace.fillStyle(0xd4b870, 1)
    palace.fillTriangle(665, 650, 690, 622, 715, 650)
    palace.fillTriangle(710, 650, 735, 620, 760, 650)
    palace.fillStyle(0xe8d4a0, 1)
    palace.fillRect(650, 650, 140, 18)
    palace.fillRect(650, 650, 18, 140)
    palace.fillRect(772, 650, 18, 140)
    palace.fillRect(650, 772, 140, 18)
    palace.fillStyle(0x8B4513, 0.6)
    palace.fillRect(706, 700, 38, 90)
    palace.fillStyle(0xffd700, 0.5)
    palace.fillRect(650, 648, 140, 4)
  }

  _spawnGuard(x, y, name) {
    const vis = this.add.graphics().setDepth(10)
    this._drawGuardGraphic(vis, false)
    vis.setPosition(x, y)

    const hitbox = this.add.rectangle(x, y, 16, 28, 0x000000, 0)
    this.physics.add.existing(hitbox)
    hitbox.body.setCollideWorldBounds(true)

    hitbox.vis = vis
    hitbox.guardName = name
    hitbox.state = STATE.PATROL
    hitbox.hp = 1
    hitbox.alertLevel = 0
    hitbox.patrolPoints = [
      new Phaser.Math.Vector2(x - 100, y),
      new Phaser.Math.Vector2(x + 100, y),
      new Phaser.Math.Vector2(x, y - 100),
      new Phaser.Math.Vector2(x, y + 100)
    ]
    hitbox.patrolIndex = 0

    hitbox.nameLabel = this.add.text(x, y - 32, name, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11)

    this.time.addEvent({
      delay: Phaser.Math.Between(10000, 20000),
      callback: () => this._distractGuard(hitbox),
      loop: true
    })

    this.guards.add(hitbox)
    return hitbox
  }

  _drawGuardGraphic(g, chasing) {
    g.clear()
    g.fillStyle(0xffcc88, 1)
    g.fillCircle(0, -20, 8)
    g.fillStyle(0x111111, 1)
    g.fillRect(-5, -28, 10, 7)
    g.fillStyle(chasing ? 0xcc0000 : 0x8B0000, 1)
    g.fillRect(-9, -13, 18, 22)
    g.fillStyle(0xffd700, 1)
    g.fillRect(-9, -13, 18, 3)
    g.fillRect(-9, -7, 18, 3)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(-13, -12, 4, 14)
    g.fillRect(9, -12, 4, 14)
    g.fillStyle(0x8B4513, 1)
    g.fillRect(-6, 9, 5, 14)
    g.fillRect(1, 9, 5, 14)
    g.fillStyle(0x333333, 1)
    g.fillRect(-7, 21, 6, 4)
    g.fillRect(1, 21, 6, 4)
    if (chasing) {
      g.fillStyle(0xff0000, 0.35)
      g.fillCircle(0, -8, 18)
    }
  }

  _drawDadiGraphic(g) {
    g.clear()
    g.fillStyle(0x9944aa, 1)
    g.fillRect(-10, -12, 20, 26)
    g.fillStyle(0xffcc88, 1)
    g.fillCircle(0, -20, 9)
    g.fillStyle(0xffffff, 1)
    g.fillRect(-12, -26, 24, 8)
    g.fillStyle(0xffcc88, 1)
    g.fillRect(-14, -10, 4, 14)
    g.fillRect(10, -10, 4, 14)
    g.fillStyle(0x9944aa, 1)
    g.fillRect(-5, 14, 5, 14)
    g.fillRect(0, 14, 5, 14)
    g.fillStyle(0xff88ff, 0.3)
    g.fillCircle(0, 0, 24)
  }

  _spawnChais() {
    const positions = [
      [150,150],[650,150],[150,550],[650,550],
      [400,200],[200,400],[600,400],[400,600],
      [300,300],[500,300],[300,500],[500,500],
      [100,700],[700,700],[700,100]
    ]
    positions.forEach(([x, y]) => {
      const vis = this.add.graphics().setDepth(6)
      vis.fillStyle(0x8B4513, 1)
      vis.fillRect(-9, -7, 18, 16)
      vis.fillStyle(0xD2691E, 1)
      vis.fillRect(-7, -10, 14, 5)
      vis.fillStyle(0xc8520a, 1)
      vis.fillRect(8, -4, 5, 6)
      vis.fillStyle(0xffdd88, 1)
      vis.fillEllipse(0, -2, 12, 8)
      vis.fillStyle(0xff9900, 0.8)
      vis.fillEllipse(0, -2, 8, 5)
      vis.setPosition(x, y)
      this.chaiVisuals.push({ vis, x, y })
      this.tweens.add({ targets: vis, y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

      this.add.text(x, y - 22, 'CHAI', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffd700', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(7)

      const hitbox = this.add.rectangle(x, y, 28, 28, 0x000000, 0)
      this.physics.add.existing(hitbox, true)
      hitbox.vis = vis
      this.chais.add(hitbox)
    })
  }

  _spawnRotis() {
    const positions = [
      [250,250],[550,250],[250,550],[550,550],
      [400,120],[120,400],[680,400],[400,680],
      [180,180],[620,180],[180,620],[620,620],
      [350,450],[450,350],[350,350],[450,450]
    ]
    positions.forEach(([x, y]) => {
      const vis = this.add.graphics().setDepth(6)
      vis.fillStyle(0xD2691E, 1)
      vis.fillEllipse(0, 0, 24, 18)
      vis.fillStyle(0xC4A35A, 1)
      vis.fillEllipse(0, 0, 18, 13)
      vis.fillStyle(0xD2691E, 0.6)
      vis.fillEllipse(-4, -2, 9, 7)
      vis.fillEllipse(4, 3, 7, 6)
      vis.fillStyle(0xffffff, 0.3)
      vis.fillEllipse(-2, -4, 5, 4)
      vis.setPosition(x, y)
      this.rotiVisuals.push({ vis, x, y })
      this.tweens.add({ targets: vis, angle: 360, duration: 1600, repeat: -1 })

      this.add.text(x, y - 18, 'ROTI', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffaa00', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(7)

      const hitbox = this.add.rectangle(x, y, 28, 28, 0x000000, 0)
      this.physics.add.existing(hitbox, true)
      hitbox.vis = vis
      this.rotiPickups.add(hitbox)
    })
  }

  _updateGuards(delta) {
    if (!this.guards) return
    const children = this.guards.getChildren()
    if (!children || children.length === 0) return

    const px = this.arjun.sprite.x
    const py = this.arjun.sprite.y
    const blending = GameState.blendActive

    children.forEach(g => {
      if (!g || !g.active || g.state === STATE.DEAD) return
      if (g.vis) g.vis.setPosition(g.x, g.y)
      if (g.nameLabel) g.nameLabel.setPosition(g.x, g.y - 32)

      const dist = Phaser.Math.Distance.Between(g.x, g.y, px, py)
      const range = blending ? 40 : 150

      if (g.state === STATE.DISTRACTED) {
        g.body.setVelocity(0, 0)
        return
      }

      if (dist < range && !blending) {
        g.alertLevel = Math.min(100, g.alertLevel + delta * 0.07)
        if (g.alertLevel > 50 && g.state !== STATE.CHASE) {
          g.state = STATE.CHASE
          GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 10)
          this.hud.showNotif(g.guardName + ': "AYE RUKO TUM!"', '#ff4444', 1200)
          if (g.vis) this._drawGuardGraphic(g.vis, true)
        }
      } else {
        g.alertLevel = Math.max(0, g.alertLevel - delta * 0.05)
        if (g.alertLevel <= 0 && g.state === STATE.CHASE) {
          g.state = STATE.PATROL
          if (g.vis) this._drawGuardGraphic(g.vis, false)
        }
      }

      if (g.state === STATE.CHASE) {
        this.physics.moveToObject(g, this.arjun.sprite, 80)
      } else {
        const target = g.patrolPoints[g.patrolIndex]
        const td = Phaser.Math.Distance.Between(g.x, g.y, target.x, target.y)
        if (td < 12) g.patrolIndex = (g.patrolIndex + 1) % g.patrolPoints.length
        this.physics.moveToObject(g, target, 32)
      }
    })
  }

  _distractGuard(g) {
    if (!g.active || g.state === STATE.DEAD || g.state === STATE.CHASE) return
    g.state = STATE.DISTRACTED
    g.body.setVelocity(0, 0)
    const bubble = this.add.text(g.x, g.y - 46, 'mmm tiffin...', {
      fontSize: '10px', fontFamily: 'monospace', color: '#fff',
      backgroundColor: '#333', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(4500, () => {
      if (bubble.active) bubble.destroy()
      if (g.active) { g.state = STATE.PATROL; if (g.vis) this._drawGuardGraphic(g.vis, false) }
    })
  }

  _throwRoti() {
    const now = this.time.now
    if (now - this._lastThrow < 350) return
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
      vx = Math.cos(angle) * 450
      vy = Math.sin(angle) * 450
    }
    bullet.body.setVelocity(vx, vy)
    this.tweens.add({ targets: bullet, angle: 360, duration: 300, repeat: -1 })
    this.rotiBullets.add(bullet)
    this.time.delayedCall(2000, () => { if (bullet.active) bullet.destroy() })
    this.hud.update()
  }

  _toggleBlend() {
    GameState.blendActive = !GameState.blendActive
    if (GameState.blendActive) {
      this.arjun.sprite.setAlpha(0.35)
      this.hud.showNotif('BLEND MODE -- invisible to guards for 7 seconds!', '#aaffaa', 2500)
      this.time.delayedCall(7000, () => {
        GameState.blendActive = false
        this.arjun.sprite.setAlpha(1)
        this.hud.showNotif('Blend OFF -- guards can see you again!', '#ffaaaa', 1500)
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
    this.cameras.main.shake(250, 0.012)
    this.hud.showNotif('CAUGHT by ' + guard.guardName + '! Aunty +20%!', '#ff3333', 2000)
    const angle = Phaser.Math.Angle.Between(guard.x, guard.y, player.x, player.y)
    player.body.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280)
    this.time.delayedCall(700, () => { this._caught = false })
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'aunty' })
  }

  _collectChai(player, hitbox) {
    if (!hitbox.active) return
    hitbox.destroy()
    if (hitbox.vis) {
      this.tweens.add({ targets: hitbox.vis, alpha: 0, scaleX: 2, scaleY: 2, duration: 300, onComplete: () => hitbox.vis.destroy() })
    }
    GameState.chai++
    GameState.score += 100
    GameState.rotis = Math.min(15, GameState.rotis + 1)
    this.cameras.main.flash(180, 255, 215, 0)
    this.hud.showNotif('CHAI collected! ' + GameState.chai + '/3  +1 bonus roti!', '#ffd700', 1500)
    this.hud.update()
    if (GameState.chai >= 3) {
      this.time.delayedCall(300, () => {
        this.hud.showNotif('3 CHAI! Head to the PALACE GATE (bottom-right)!', '#00ffcc', 4000)
      })
    }
  }

  _collectRoti(player, hitbox) {
    if (!hitbox.active) return
    hitbox.destroy()
    if (hitbox.vis) {
      this.tweens.add({ targets: hitbox.vis, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 250, onComplete: () => hitbox.vis.destroy() })
    }
    GameState.rotis = Math.min(15, GameState.rotis + 2)
    GameState.score += 30
    this.hud.showNotif('+2 Rotis! Press SPACE to throw!', '#ffcc88', 1000)
    this.hud.update()
  }

  _rotiHit(roti, guard) {
    if (!guard.active || guard.state === STATE.DEAD) return
    roti.destroy()
    guard.state = STATE.DEAD
    guard.body.setVelocity(0, 0)
    GameState.score += 300

    if (guard.vis) {
      guard.vis.clear()
      guard.vis.fillStyle(0x888888, 0.5)
      guard.vis.fillEllipse(0, 5, 20, 10)
      guard.vis.fillStyle(0xffcc88, 0.4)
      guard.vis.fillCircle(0, -5, 7)
    }

    const ko = this.add.text(guard.x, guard.y - 30, 'KO!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffff00', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(15)
    this.tweens.add({ targets: ko, y: guard.y - 60, alpha: 0, duration: 1200, onComplete: () => ko.destroy() })

    this.hud.showNotif(guard.guardName + ' knocked out! +300pts', '#00ff88', 1500)
    if (guard.nameLabel) guard.nameLabel.setText('x ' + guard.guardName).setColor('#666666')

    this.time.delayedCall(1500, () => {
      if (guard.nameLabel?.active) guard.nameLabel.destroy()
      if (guard.vis?.active) guard.vis.destroy()
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
    GameState.auntyLevel = Math.max(0, GameState.auntyLevel - 35)
    this.cameras.main.flash(300, 255, 100, 255)
    this.hud.showNotif('Dadi got ' + given + ' rotis! Aunty -35%! +' + (given * 80) + 'pts!', '#ff88ff', 3000)
    this.hud.update()
    this.time.delayedCall(6000, () => { this._dadiGiven = false })
  }

  _enterPortal() {
    if (GameState.chai < 3) {
      this.hud.showNotif('Need 3 CHAI! You have ' + GameState.chai + '/3', '#ff6666', 1500)
      return
    }
    this.cameras.main.fadeOut(800, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('PalaceScene') })
  }

  _nearestActiveGuard() {
    if (!this.guards) return null
    let nearest = null, minD = Infinity
    this.guards.getChildren().forEach(g => {
      if (!g || !g.active || g.state === STATE.DEAD) return
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
    const x = Phaser.Math.Between(200, 600)
    const y = Phaser.Math.Between(200, 600)
    const g = this.add.graphics().setDepth(15)
    this._drawDadiGraphic(g)
    g.setPosition(x, y)
    const bubble = this.add.text(x, y - 40, Phaser.Utils.Array.GetRandom(msgs), {
      fontSize: '10px', fontFamily: 'monospace', color: '#fff',
      backgroundColor: '#883388', padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(16)
    this.tweens.add({
      targets: [g, bubble], alpha: 0, delay: 3500, duration: 700,
      onComplete: () => { g.destroy(); bubble.destroy() }
    })
  }

  update(time, delta) {
    if (this._caught) return
    const body = this.arjun.sprite.body
    const speed = GameState.blendActive ? 60 : 140
    let vx = 0, vy = 0
    if (this.keys.left.isDown || this.keys.a.isDown) vx = -speed
    if (this.keys.right.isDown || this.keys.d.isDown) vx = speed
    if (this.keys.up.isDown || this.keys.w.isDown) vy = -speed
    if (this.keys.down.isDown || this.keys.s.isDown) vy = speed
    body.setVelocity(vx, vy)
    if (this.keys.space.isDown && !this._spaceWasDown) this._throwRoti()
    this._spaceWasDown = this.keys.space.isDown
    if (this.keys.b.isDown && !this._bWasDown) this._toggleBlend()
    this._bWasDown = this.keys.b.isDown
    this._updateGuards(delta)
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'aunty' })
    this.hud.update()
  }
}
