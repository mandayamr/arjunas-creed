import { Scene, manager } from '@tialops/maki'
import { GameState, HUD } from './GameState.js'

const STATE = { PATROL: 'patrol', ALERT: 'alert', CHASE: 'chase', DISTRACTED: 'distracted' }

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

    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor('#3d1f00')
    this.arjun.sprite.setPosition(400, 400)
    this.arjun.sprite.setTint(0xffbb88)
    this.physics.add.collider(this.arjun.sprite, manager.getWallGroup(this, 'default_map'))
    this.cameras.main.startFollow(this.arjun.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)

    this.guards = this.physics.add.group()
    this._spawnGuard(200, 200, 'Sharma')
    this._spawnGuard(600, 200, 'Dubey')
    this._spawnGuard(600, 600, 'Pandey')

    this.cows = this.physics.add.staticGroup()
    this._spawnCow(400, 220)
    this._spawnCow(400, 580)

    this.chais = this.physics.add.staticGroup()
    this._spawnChais()

    this.rotiPickups = this.physics.add.staticGroup()
    this._spawnRotis()

    this.portal = this.add.rectangle(720, 720, 32, 32, 0x00ffff, 0.8)
    this.physics.add.existing(this.portal, true)
    this.tweens.add({
      targets: this.portal,
      alpha: { from: 0.4, to: 1 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.1 },
      duration: 800, yoyo: true, repeat: -1
    })
    this.add.text(720, 700, 'PALACE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#00ffff'
    }).setOrigin(0.5)

    this.physics.add.overlap(this.arjun.sprite, this.guards, this._guardCaught, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.chais, this._collectChai, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.rotiPickups, this._collectRoti, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.portal, this._enterPortal, null, this)
    this.physics.add.collider(this.arjun.sprite, this.cows)
    this.physics.add.collider(this.guards, this.cows)

    this.rotiBullets = this.physics.add.group()
    this.physics.add.overlap(this.rotiBullets, this.guards, this._rotiHit, null, this)

    this.hud = new HUD(this)
    GameState.level = 1

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
      e: Phaser.Input.Keyboard.KeyCodes.E,
      b: Phaser.Input.Keyboard.KeyCodes.B
    })

    this.time.addEvent({ delay: 2000, callback: this._decayAunty, callbackScope: this, loop: true })
    this.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: this._dadiAppears, callbackScope: this
    })

    this._caught = false

    const zoneBanner = this.add.text(width / 2, 60, 'THE BAZAAR -- Level 1', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(105)
    this.tweens.add({ targets: zoneBanner, alpha: 0, delay: 3000, duration: 1000 })

    this.hud.showNotif('Collect 3 Chai to open the palace gate!', '#ffd700', 3500)
    this.time.delayedCall(4000, () => {
      this.hud.showNotif('SPACE=throw Roti  B=Blend  E=Chai Vision', '#aaffaa', 3000)
    })

    this.cameras.main.fadeIn(600)
  }

  _spawnGuard(x, y, name) {
    const g = this.add.graphics()
    g.fillStyle(0xff3333, 1)
    g.fillRect(-7, -7, 14, 14)
    this.physics.add.existing(g)
    g.body.setCollideWorldBounds(true)
    g.setPosition(x, y)
    g.setDepth(5)
    g.nameLabel = this.add.text(x, y - 14, 'Guard ' + name, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffffff',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(6)
    g.guardName = name
    g.state = STATE.PATROL
    g.hp = 2
    g.alertLevel = 0
    g.currentColor = 0xff3333
    g.patrolPoints = [
      new Phaser.Math.Vector2(x - 80, y),
      new Phaser.Math.Vector2(x + 80, y),
      new Phaser.Math.Vector2(x, y - 80),
      new Phaser.Math.Vector2(x, y + 80)
    ]
    g.patrolIndex = 0
    this.time.addEvent({
      delay: Phaser.Math.Between(15000, 25000),
      callback: () => this._distractGuard(g),
      callbackScope: this, loop: true
    })
    this.guards.add(g)
    return g
  }

  _setGuardColor(g, color) {
    if (g.currentColor === color) return
    g.currentColor = color
    g.clear()
    g.fillStyle(color, 1)
    g.fillRect(-7, -7, 14, 14)
  }

  _spawnCow(x, y) {
    const cow = this.add.text(x, y, 'COW', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#8B4513', padding: { x: 4, y: 2 }
    })
    this.physics.add.existing(cow, true)
    cow.setDepth(4)
    this.cows.add(cow)
  }

  _spawnChais() {
    [[150,150],[650,150],[150,650],[650,650],[400,280],[280,500],[520,500]].forEach(([x,y]) => {
      const c = this.add.text(x, y, 'CHAI', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffd700',
        backgroundColor: '#333', padding: { x: 3, y: 2 }
      })
      this.physics.add.existing(c, true)
      c.setDepth(3)
      this.tweens.add({ targets: c, y: y - 6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.chais.add(c)
    })
  }

  _spawnRotis() {
    [[240,350],[560,350],[400,160],[400,640]].forEach(([x,y]) => {
      const r = this.add.text(x, y, 'ROTI', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffaa00',
        backgroundColor: '#333', padding: { x: 3, y: 2 }
      })
      this.physics.add.existing(r, true)
      r.setDepth(3)
      this.rotiPickups.add(r)
    })
  }

  _updateGuards(delta) {
    const px = this.arjun.sprite.x
    const py = this.arjun.sprite.y
    const blending = GameState.blendActive

    this.guards.getChildren().forEach(g => {
      if (!g.active) return
      g.nameLabel.setPosition(g.x, g.y - 14)
      const dist = Phaser.Math.Distance.Between(g.x, g.y, px, py)
      const detectionRange = blending ? 60 : 120

      if (g.state === STATE.DISTRACTED) {
        g.body.setVelocity(0, 0)
        return
      }

      if (dist < detectionRange && !blending) {
        g.state = STATE.ALERT
        g.alertLevel += delta * 0.05
        if (g.alertLevel > 60) {
          g.state = STATE.CHASE
          GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 15)
          this.hud.showNotif(g.guardName + ': "Aye ruko tum!"', '#ff6666', 1500)
        }
      } else {
        g.alertLevel = Math.max(0, g.alertLevel - delta * 0.03)
        if (g.alertLevel <= 0 && g.state !== STATE.PATROL) g.state = STATE.PATROL
      }

      if (g.state === STATE.CHASE) {
        this.physics.moveToObject(g, this.arjun.sprite, 60)
        this._setGuardColor(g, 0xff0000)
      } else if (g.state === STATE.PATROL) {
        this._setGuardColor(g, 0xff3333)
        const target = g.patrolPoints[g.patrolIndex]
        const td = Phaser.Math.Distance.Between(g.x, g.y, target.x, target.y)
        if (td < 10) g.patrolIndex = (g.patrolIndex + 1) % g.patrolPoints.length
        this.physics.moveToObject(g, target, 28)
      } else {
        this.physics.moveToObject(g, this.arjun.sprite, 35)
        this._setGuardColor(g, 0xffaa00)
      }
    })
  }

  _distractGuard(g) {
    if (g.state === STATE.CHASE) return
    g.state = STATE.DISTRACTED
    g.body.setVelocity(0, 0)
    const bubble = this.add.text(g.x, g.y - 30, 'mmm tiffin...', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#333', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(4000, () => { bubble.destroy(); g.state = STATE.PATROL })
  }

  _throwRoti() {
    if (GameState.rotis <= 0) {
      this.hud.showNotif('No rotis left! Find more!', '#ff6666', 1200)
      return
    }
    GameState.rotis--
    const dx = this.arjun.sprite.x
    const dy = this.arjun.sprite.y
    const roti = this.add.text(dx, dy, 'o', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffaa00'
    })
    roti.setDepth(8)
    this.physics.add.existing(roti)
    const nearestGuard = this._nearestGuard()
    let vx = 200, vy = 0
    if (nearestGuard) {
      const angle = Phaser.Math.Angle.Between(dx, dy, nearestGuard.x, nearestGuard.y)
      vx = Math.cos(angle) * 280
      vy = Math.sin(angle) * 280
    }
    roti.body.setVelocity(vx, vy)
    this.rotiBullets.add(roti)
    this.time.delayedCall(1500, () => { if (roti.active) roti.destroy() })
    this.hud.update()
  }

  _toggleChaiVision() {
    GameState.chaiVisionActive = !GameState.chaiVisionActive
    if (GameState.chaiVisionActive) {
      
      this.hud.showNotif('CHAI VISION ACTIVE!', '#ff9933', 2000)
      this.time.delayedCall(5000, () => {
        
        
      })
    } else {
      
    }
  }

  _toggleBlend() {
    if (GameState.blendActive) {
      GameState.blendActive = false
      this.hud.showNotif('Blend OFF', '#ffaaaa', 1200)
    } else {
      GameState.blendActive = true
      this.hud.showNotif('BLEND MODE -- pretending to sell coconuts!', '#aaffaa', 2000)
      this.time.delayedCall(6000, () => { GameState.blendActive = false })
    }
    this.hud.update()
  }

  _guardCaught(player, guard) {
    if (this._caught || guard.state !== STATE.CHASE) return
    this._caught = true
    GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 25)
    this.hud.showNotif('CAUGHT by ' + guard.guardName + '! Aunty Level +25%!', '#ff3333', 2000)
    const angle = Phaser.Math.Angle.Between(guard.x, guard.y, player.x, player.y)
    player.body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200)
    this.time.delayedCall(500, () => { this._caught = false })
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'aunty' })
  }

  _collectChai(player, chai) {
    chai.destroy()
    GameState.chai++
    GameState.score += 50
    this.hud.showNotif('Chai collected! +50pts', '#ffd700', 1000)
    this.hud.update()
    if (GameState.chai >= 3) this.hud.showNotif('3 Chai! Palace gate OPEN! Go to PALACE portal!', '#00ffcc', 3000)
  }

  _collectRoti(player, roti) {
    roti.destroy()
    GameState.rotis = Math.min(10, GameState.rotis + 3)
    this.hud.showNotif('+3 Rotis!', '#ffcc88', 1000)
    this.hud.update()
  }

  _rotiHit(roti, guard) {
    roti.destroy()
    guard.hp--
    GameState.score += 100
    this.hud.showNotif('Roti hit ' + guard.guardName + '! +100pts', '#ffff00', 1000)
    if (guard.hp <= 0) {
      guard.nameLabel.destroy()
      guard.destroy()
      GameState.score += 200
      this.hud.showNotif(guard.guardName + ' passed out from carbs! +200pts', '#00ff88', 2000)
    }
  }

  _enterPortal() {
    if (GameState.chai < 3) {
      this.hud.showNotif('Need 3 Chai first!', '#ff6666', 1500)
      return
    }
    this.cameras.main.fadeOut(600, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('PalaceScene') })
  }

  _nearestGuard() {
    let nearest = null, minD = Infinity
    this.guards.getChildren().forEach(g => {
      const d = Phaser.Math.Distance.Between(this.arjun.sprite.x, this.arjun.sprite.y, g.x, g.y)
      if (d < minD) { minD = d; nearest = g }
    })
    return nearest
  }

  _decayAunty() {
    if (GameState.auntyLevel > 0) GameState.auntyLevel = Math.max(0, GameState.auntyLevel - 3)
  }

  _dadiAppears() {
    const x = Phaser.Math.Between(100, 700)
    const y = Phaser.Math.Between(100, 700)
    const messages = [
      'Dadi: "Beta, have you eaten?"',
      'Dadi: "Stop this and get married!"',
      'Dadi: "Your uncle Sharma is a guard!"',
      'Dadi: "I teleported here. Don\'t ask."',
      'Dadi: "Is that a roti? Give me!"'
    ]
    const bubble = this.add.text(x, y, Phaser.Utils.Array.GetRandom(messages), {
      fontSize: '11px', fontFamily: 'monospace', color: '#fff',
      backgroundColor: '#553300', padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setDepth(30)
    this.time.delayedCall(3000, () => bubble.destroy())
    this.time.addEvent({
      delay: Phaser.Math.Between(8000, 15000),
      callback: this._dadiAppears, callbackScope: this
    })
  }

  update(time, delta) {
    if (this._caught) return
    this.maki.move(this.arjun)
    const body = this.arjun.sprite.body
    const speed = GameState.blendActive ? 50 : 120
    if (this.keys.left.isDown || this.keys.a.isDown) body.setVelocityX(-speed)
    if (this.keys.right.isDown || this.keys.d.isDown) body.setVelocityX(speed)
    if (this.keys.up.isDown || this.keys.w.isDown) body.setVelocityY(-speed)
    if (this.keys.down.isDown || this.keys.s.isDown) body.setVelocityY(speed)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this._throwRoti()
    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) this._toggleChaiVision()
    if (Phaser.Input.Keyboard.JustDown(this.keys.b)) this._toggleBlend()
    this._updateGuards(delta)
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'aunty' })
    this.hud.update()
  }
}
