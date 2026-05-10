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
    this.cameras.main.setBackgroundColor('#1a0a00')
    this.cameras.main.setZoom(1.5)
    this.arjun.sprite.setPosition(400, 700)
    this.arjun.sprite.setTint(0xffbb88)
    this.physics.add.collider(this.arjun.sprite, manager.getWallGroup(this, 'default_map'))
    this.cameras.main.startFollow(this.arjun.sprite, true, 0.1, 0.1)

    this.hud = new HUD(this)
    GameState.level = 2

    const banner = this.add.text(width / 2, 60, 'THE PALACE -- Level 2: Boss Fight!', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(105)
    this.tweens.add({ targets: banner, alpha: 0, delay: 3000, duration: 1000 })

    this._bossHP = 5
    this._bossMaxHP = 5

    this.boss = this.add.text(400, 150, 'GOV', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ff0000',
      backgroundColor: '#330000', padding: { x: 6, y: 4 }
    }).setDepth(10)
    this.physics.add.existing(this.boss)
    this.boss.body.setCollideWorldBounds(true)
    this.boss.body.setBounce(0.5)
    this.boss.body.setVelocity(50, 30)

    this.bossHPBg = this.add.graphics().setScrollFactor(0).setDepth(102)
    this.bossHPFill = this.add.graphics().setScrollFactor(0).setDepth(103)
    this.bossLabel = this.add.text(width / 2, 50, '', {
      fontSize: '12px', fontFamily: 'monospace',
      color: '#ffcccc', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104)
    this._drawBossHPBar()

    this.spiceShots = this.physics.add.group()
    this.rotiBullets = this.physics.add.group()

    this.physics.add.overlap(this.arjun.sprite, this.spiceShots, this._hitBySpice, null, this)
    this.physics.add.overlap(this.arjun.sprite, this.boss, this._bossTouch, null, this)
    this.physics.add.overlap(this.rotiBullets, this.boss, this._rotiBossHit, null, this)

    this.spicePickups = this.physics.add.staticGroup()
    [[200,200],[600,200],[200,600],[600,600],[400,400]].forEach(([x,y]) => {
      const s = this.add.text(x, y, 'SPICE', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ff6600',
        backgroundColor: '#330000', padding: { x: 3, y: 2 }
      })
      this.physics.add.existing(s, true)
      this.spicePickups.add(s)
    })
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
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      e: Phaser.Input.Keyboard.KeyCodes.E
    })

    this.time.addEvent({ delay: 2000, callback: this._bossShoot, callbackScope: this, loop: true })
    this.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: this._bossRant, callbackScope: this, loop: true
    })

    this._caught = false
    this._bossDead = false

    this.hud.showNotif('Collect SPICE pickups then throw Rotis at the Governor!', '#ffd700', 4000)
    this.time.delayedCall(4500, () => {
      this.hud.showNotif('Governor: "Jolly good spices old chap! Now DIE!"', '#ffaaaa', 3000)
    })

    this.cameras.main.fadeIn(600)
  }

  _drawBossHPBar() {
    const { width } = this.scale
    this.bossHPBg.clear()
    this.bossHPBg.fillStyle(0x330000, 0.9)
    this.bossHPBg.fillRect(width / 2 - 100, 56, 200, 16)
    this.bossHPBg.lineStyle(1, 0xff6666)
    this.bossHPBg.strokeRect(width / 2 - 100, 56, 200, 16)
    const pct = this._bossHP / this._bossMaxHP
    const col = pct > 0.5 ? 0xff3333 : pct > 0.25 ? 0xff9900 : 0xff00ff
    this.bossHPFill.clear()
    this.bossHPFill.fillStyle(col, 1)
    this.bossHPFill.fillRect(width / 2 - 99, 57, Math.floor(198 * pct), 14)
    const hearts = 'HP: ' + this._bossHP + '/' + this._bossMaxHP
    this.bossLabel.setText('THE GOVERNOR -- ' + hearts)
  }

  _bossShoot() {
    if (this._bossDead) return
    const bx = this.boss.x, by = this.boss.y
    const px = this.arjun.sprite.x, py = this.arjun.sprite.y
    const angle = Phaser.Math.Angle.Between(bx, by, px, py)
    const shots = this._bossHP <= 2 ? 3 : 1
    for (let i = 0; i < shots; i++) {
      const spread = (i - Math.floor(shots / 2)) * 0.3
      const bullet = this.add.text(bx, by, '*', {
        fontSize: '14px', fontFamily: 'monospace', color: '#ff6600'
      })
      this.physics.add.existing(bullet)
      const speed = 140 + (this._bossMaxHP - this._bossHP) * 20
      bullet.body.setVelocity(Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed)
      bullet.setDepth(9)
      this.spiceShots.add(bullet)
      this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy() })
    }
  }

  _bossRant() {
    if (this._bossDead) return
    const rants = [
      'Governor: "I say, most irregular!"',
      'Governor: "Our spice monopoly shall prevail!"',
      'Governor: "Jolly good attempt, old boy."',
      'Governor: "Have you tried Bland Biryani?"',
      'Governor: "Guards! ...typical, not listening."',
      'Governor: "I am allergic to democracy!"'
    ]
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(rants), '#ffccaa', 2500)
  }

  _rotiBossHit(roti, boss) {
    roti.destroy()
    this._bossHP--
    GameState.score += 200
    this._drawBossHPBar()
    if (this._bossHP <= 0) { this._bossKilled(); return }
    const msgs = [
      'Governor: "Ow! A carbohydrate assault!"',
      'Governor: "My monocle!"',
      'Governor: "This is NOT cricket!"',
      'Governor: "I demand your manager!"'
    ]
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(msgs), '#ff9900', 2000)
    this.tweens.add({ targets: boss, alpha: 0, duration: 100, yoyo: true, repeat: 3 })
  }

  _bossKilled() {
    this._bossDead = true
    this.boss.body.setVelocity(0, 0)
    this.boss.setText('DEAD')
    GameState.score += 1000
    const msgs = [
      'Governor: "Defeated by a flatbread..."',
      'Governor: "The spice was not worth it..."',
      'Governor: "Tell mum I was brave. And British."'
    ]
    let delay = 500
    msgs.forEach(msg => {
      this.time.delayedCall(delay, () => { this.hud.showNotif(msg, '#ffd700', 2000) })
      delay += 2500
    })
    this.time.delayedCall(delay + 500, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('WinScene') })
    })
  }

  _hitBySpice(player, spice) {
    spice.destroy()
    GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 10)
    this.hud.showNotif('Spice hit! Aunty Level +10%', '#ff6666', 1000)
    if (GameState.auntyLevel >= 100) this.scene.start('GameOverScene', { reason: 'spice' })
  }

  _bossTouch(player, boss) {
    if (this._caught) return
    this._caught = true
    GameState.auntyLevel = Math.min(100, GameState.auntyLevel + 15)
    this.hud.showNotif('Governor bumped you! +15% Aunty!', '#ff6666', 1200)
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y)
    player.body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200)
    this.time.delayedCall(400, () => { this._caught = false })
  }

  _collectSpice(player, spice) {
    spice.destroy()
    GameState.rotis = Math.min(10, GameState.rotis + 2)
    this.hud.showNotif('Spice collected! +2 Rotis!', '#ff9933', 1000)
    this.hud.update()
  }

  _throwRoti() {
    if (GameState.rotis <= 0) {
      this.hud.showNotif('No rotis! Collect SPICE pickups!', '#ff6666', 1200)
      return
    }
    GameState.rotis--
    const dx = this.arjun.sprite.x, dy = this.arjun.sprite.y
    const roti = this.add.text(dx, dy, 'o', { fontSize: '14px', fontFamily: 'monospace', color: '#ffaa00' })
    roti.setDepth(8)
    this.physics.add.existing(roti)
    const angle = Phaser.Math.Angle.Between(dx, dy, this.boss.x, this.boss.y)
    roti.body.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320)
    this.rotiBullets.add(roti)
    this.time.delayedCall(2000, () => { if (roti.active) roti.destroy() })
    this.hud.update()
  }

  update() {
    if (this._bossDead) return
    this.maki.move(this.arjun)
    const body = this.arjun.sprite.body
    const speed = 120
    if (this.keys.left.isDown || this.keys.a.isDown) body.setVelocityX(-speed)
    if (this.keys.right.isDown || this.keys.d.isDown) body.setVelocityX(speed)
    if (this.keys.up.isDown || this.keys.w.isDown) body.setVelocityY(-speed)
    if (this.keys.down.isDown || this.keys.s.isDown) body.setVelocityY(speed)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this._throwRoti()
    const speed2 = 40 + (this._bossMaxHP - this._bossHP) * 12
    this.physics.moveToObject(this.boss, this.arjun.sprite, speed2)
    this.hud.update()
  }
}
