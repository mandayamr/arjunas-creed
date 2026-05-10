import { Scene, manager } from '@tialops/maki'
import { GameState, HUD } from './GameState.js'

export default class PalaceScene extends Scene {
  constructor() {
    super('PalaceScene')
  }

  preload() {
    this._makiPlayers = []
    super.preload()
    this.arjun = this.maki.player('ash')
    manager.map(this, 'default_map')
    manager.preload(this)
  }

  create() {
    super.create()
    manager.create(this)

    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor('#2a1500')
    this.cameras.main.setZoom(1.5)
    this.arjun.sprite.setPosition(400, 680)
    this.arjun.sprite.setTint(0xffbb88)
    this.physics.add.collider(this.arjun.sprite, manager.getWallGroup(this, 'default_map'))
    this.cameras.main.startFollow(this.arjun.sprite, true, 0.1, 0.1)

    this._drawPalace()

    this.hud = new HUD(this)
    GameState.level = 2

    const banner = this.add.text(width / 2, 60, 'THE PALACE -- Defeat The Governor!', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(110)
    this.tweens.add({ targets: banner, alpha: 0, delay: 3000, duration: 1000 })

    this._bossHP = 5
    this._bossMaxHP = 5
    this._bossDead = false

    this.boss = this.add.graphics().setDepth(10)
    this._drawBoss()
    this.physics.add.existing(this.boss)
    this.boss.body.setCollideWorldBounds(true)
    this.boss.body.setBounce(0.4)
    this.boss.body.setVelocity(60, 40)
    this.boss.body.setSize(20, 30)

    this.bossHPBg = this.add.graphics().setScrollFactor(0).setDepth(102)
    this.bossHPFill = this.add.graphics().setScrollFactor(0).setDepth(103)
    this.bossLabel = this.add.text(width / 2, 50, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffcccc',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104)
    this._drawBossHPBar()

    this.spiceShots = this.physics.add.group()
    this.rotiBullets = this.physics.add.group()

    this.spicePickups = this.physics.add.group()
    const spicePositions = [[200,200],[600,200],[200,600],[600,600],[400,400]]
    spicePositions.forEach(([x, y]) => {
      const s = this.add.graphics().setDepth(4)
      s.fillStyle(0xff6600, 1)
      s.fillStar(0, 0, 5, 10, 5, 0)
      s.fillStyle(0xffaa00, 1)
      s.fillCircle(0, 0, 4)
      s.setPosition(x, y)
      this.physics.add.existing(s, true)
      this.tweens.add({ targets: s, y: y - 6, duration: 900, yoyo: true, repeat: -1 })
      this.spicePickups.add(s)
      this.add.text(x, y - 18, 'SPICE', { fontSize: '8px', fontFamily: 'monospace', color: '#ff6600', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(5)
    })

    this.physics.add.overlap(this.arjun.sprite, this.spiceShots, this._hitBySpice, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.boss, this._bossTouch, null, this)
    this.physics.add.overlap(this.rotiBullets, this.boss, this._rotiBossHit, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.spicePickups, this._collectSpice, null, this)

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    this.time.addEvent({ delay: 1800, callback: this._bossShoot, callbackScope: this, loop: true })
    this.time.addEvent({ delay: Phaser.Math.Between(4000, 8000), callback: this._bossRant, callbackScope: this, loop: true })

    this._caught = false

    this.hud.showNotif('Collect SPICE then SPACE to throw Rotis at the Governor!', '#ffd700', 4000)
    this.time.delayedCall(4500, () => {
      this.hud.showNotif('Governor: "Jolly good! Now prepare to face British justice!"', '#ffaaaa', 3000)
    })
    this.cameras.main.fadeIn(600)
  }

  _drawPalace() {
    const g = this.add.graphics().setDepth(0)

    g.fillStyle(0xc8a06e, 1)
    g.fillRect(0, 0, 800, 800)

    g.fillStyle(0xd4b07e, 1)
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 2 === 0) g.fillRect(i * 80, j * 80, 80, 80)
      }
    }

    g.fillStyle(0xa07040, 1)
    g.fillRect(0, 0, 800, 30)
    g.fillRect(0, 770, 800, 30)
    g.fillRect(0, 0, 30, 800)
    g.fillRect(770, 0, 30, 800)

    const pillars = [[80,80],[80,400],[80,720],[400,80],[720,80],[720,400],[720,720],[400,720]]
    pillars.forEach(([x, y]) => {
      g.fillStyle(0xe8c898, 1)
      g.fillRect(x - 15, y - 40, 30, 80)
      g.fillStyle(0xffd700, 0.4)
      g.fillRect(x - 15, y - 40, 30, 8)
      g.fillRect(x - 15, y + 32, 30, 8)
    })

    g.fillStyle(0x8B0000, 0.3)
    g.fillRect(300, 50, 200, 120)
    g.fillStyle(0xffd700, 0.5)
    g.fillTriangle(300, 50, 400, 10, 500, 50)
    g.fillStyle(0x8B0000, 1)
    g.fillRect(370, 100, 60, 70)

    g.fillStyle(0x4444ff, 0.4)
    g.fillRect(100, 100, 120, 80)
    g.fillRect(580, 100, 120, 80)
    g.fillRect(100, 620, 120, 80)
    g.fillRect(580, 620, 120, 80)
  }

  _drawBoss() {
    this.boss.clear()
    this.boss.fillStyle(0x1a3a6e, 1)
    this.boss.fillRect(-10, -14, 20, 22)
    this.boss.fillStyle(0xffcc99, 1)
    this.boss.fillRect(-6, -24, 12, 14)
    this.boss.fillStyle(0x000080, 1)
    this.boss.fillRect(-8, -28, 16, 8)
    this.boss.fillStyle(0xffd700, 1)
    this.boss.fillRect(-10, -16, 20, 3)
    this.boss.fillRect(-10, -10, 20, 3)
    this.boss.fillStyle(0xffcc99, 1)
    this.boss.fillRect(-14, -10, 4, 12)
    this.boss.fillRect(10, -10, 4, 12)
    this.boss.fillRect(-4, 8, 4, 14)
    this.boss.fillRect(0, 8, 4, 14)
    this.boss.fillStyle(0xffd700, 1)
    this.boss.fillCircle(12, -22, 4)
  }

  _drawBossHPBar() {
    const { width } = this.scale
    this.bossHPBg.clear()
    this.bossHPBg.fillStyle(0x330000, 0.9)
    this.bossHPBg.fillRect(width / 2 - 110, 54, 220, 18)
    this.bossHPBg.lineStyle(1, 0xff6666)
    this.bossHPBg.strokeRect(width / 2 - 110, 54, 220, 18)
    const pct = this._bossHP / this._bossMaxHP
    const col = pct > 0.6 ? 0xff3333 : pct > 0.3 ? 0xff9900 : 0xff00ff
    this.bossHPFill.clear()
    this.bossHPFill.fillStyle(col, 1)
    this.bossHPFill.fillRect(width / 2 - 109, 55, Math.floor(218 * pct), 16)
    this.bossLabel.setText('THE GOVERNOR  HP: ' + this._bossHP + '/' + this._bossMaxHP)
  }

  _bossShoot() {
    if (this._bossDead) return
    const bx = this.boss.x, by = this.boss.y
    const px = this.arjun.sprite.x, py = this.arjun.sprite.y
    const angle = Phaser.Math.Angle.Between(bx, by, px, py)
    const shots = this._bossHP <= 2 ? 3 : 1
    for (let i = 0; i < shots; i++) {
      const spread = (i - Math.floor(shots / 2)) * 0.35
      const bullet = this.add.graphics().setDepth(9)
      bullet.fillStyle(0xff6600, 1)
      bullet.fillStar(0, 0, 5, 7, 4, 0)
      this.physics.add.existing(bullet)
      bullet.setPosition(bx, by)
      const speed = 150 + (this._bossMaxHP - this._bossHP) * 25
      bullet.body.setVelocity(Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed)
      this.spiceShots.add(bullet)
      this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy() })
    }
  }

  _bossRant() {
    if (this._bossDead) return
    const rants = [
      'Governor: "Most irregular, old chap!"',
      'Governor: "Our spice monopoly shall prevail!"',
      'Governor: "Jolly good try, old bean!"',
      'Governor: "I am allergic to democracy!"',
      'Governor: "Guards? ...typical, not listening."'
    ]
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(rants), '#ffccaa', 2000)
  }

  _rotiBossHit(roti, boss) {
    if (this._bossDead) return
    roti.destroy()
    this._bossHP--
    GameState.score += 300
    this._drawBossHPBar()
    if (this._bossHP <= 0) { this._bossKilled(); return }
    const msgs = [
      'Governor: "Ow! Carbohydrate assault!"',
      'Governor: "My monocle! You cracked it!"',
      'Governor: "This is NOT cricket!"',
      'Governor: "I demand your manager!"'
    ]
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(msgs), '#ff9900', 1800)
    this.tweens.add({ targets: boss, alpha: 0.2, duration: 80, yoyo: true, repeat: 4 })
  }

  _bossKilled() {
    this._bossDead = true
    this.boss.body.setVelocity(0, 0)
    this.boss.clear()
    this.boss.fillStyle(0x666666, 0.6)
    this.boss.fillRect(-10, -8, 20, 10)
    GameState.score += 2000

    const msgs = [
      'Governor: "Defeated... by a flatbread..."',
      'Governor: "The spice... was not worth it..."',
      'Governor: "Tell mum I was brave. And British."'
    ]
    let delay = 800
    msgs.forEach(msg => {
      this.time.delayedCall(delay, () => { this.hud.showNotif(msg, '#ffd700', 2200) })
      delay += 2800
    })
    this.time.delayedCall(delay + 800, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('WinScene') })
    })
  }

  _hitBySpice(player, spice) {
    spice.destroy()
    GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 12)
    this.hud.showNotif('Spice hit! Aunty Meter +12%!', '#ff6666', 1000)
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'spice' })
  }

  _bossTouch(player, boss) {
    if (this._caught) return
    this._caught = true
    GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 15)
    this.hud.showNotif('Governor bumped you! +15% Aunty!', '#ff6666', 1200)
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y)
    player.body.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220)
    this.time.delayedCall(400, () => { this._caught = false })
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'spice' })
  }

  _collectSpice(player, spice) {
    spice.destroy()
    GameState.rotis = Math.min(15, GameState.rotis + 3)
    GameState.score += 50
    this.hud.showNotif('Spice! +3 Rotis to throw!', '#ff9933', 1000)
    this.hud.update()
  }

  _throwRoti() {
    if (GameState.rotis <= 0) {
      this.hud.showNotif('No rotis! Collect the SPICE stars!', '#ff6666', 1500)
      return
    }
    GameState.rotis--
    const dx = this.arjun.sprite.x, dy = this.arjun.sprite.y
    const bullet = this.add.graphics().setDepth(9)
    bullet.fillStyle(0xD2691E, 1)
    bullet.fillEllipse(0, 0, 18, 14)
    bullet.fillStyle(0xC4A35A, 1)
    bullet.fillEllipse(0, 0, 14, 10)
    this.physics.add.existing(bullet)
    bullet.setPosition(dx, dy)
    const angle = Phaser.Math.Angle.Between(dx, dy, this.boss.x, this.boss.y)
    bullet.body.setVelocity(Math.cos(angle) * 380, Math.sin(angle) * 380)
    this.tweens.add({ targets: bullet, angle: 360, duration: 300, repeat: -1 })
    this.rotiBullets.add(bullet)
    this.time.delayedCall(2500, () => { if (bullet.active) bullet.destroy() })
    this.hud.update()
  }

  update() {
    if (this._bossDead) return
    this.maki.move(this.arjun)
    const body = this.arjun.sprite.body
    if (this.keys.left.isDown || this.keys.a.isDown) body.setVelocityX(-130)
    if (this.keys.right.isDown || this.keys.d.isDown) body.setVelocityX(130)
    if (this.keys.up.isDown || this.keys.w.isDown) body.setVelocityY(-130)
    if (this.keys.down.isDown || this.keys.s.isDown) body.setVelocityY(130)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this._throwRoti()
    const speed = 45 + (this._bossMaxHP - this._bossHP) * 15
    this.physics.moveToObject(this.boss, this.arjun.sprite, speed)
    this.hud.update()
  }
}
