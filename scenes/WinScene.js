import { GameState } from './GameState.js'

export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene')
  }

  create() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillStyle(0xff9933, 1)
    bg.fillRect(0, 0, width, height * 0.33)
    bg.fillStyle(0xffffff, 1)
    bg.fillRect(0, height * 0.33, width, height * 0.34)
    bg.fillStyle(0x138808, 1)
    bg.fillRect(0, height * 0.67, width, height * 0.33)

    bg.fillStyle(0x000080, 1)
    bg.fillCircle(width / 2, height / 2, 30)
    bg.fillStyle(0xffffff, 1)
    bg.fillCircle(width / 2, height / 2, 26)
    bg.fillStyle(0x000080, 1)
    bg.fillCircle(width / 2, height / 2, 8)

    this.time.addEvent({ delay: 300, callback: this._burst, callbackScope: this, loop: true })

    this.add.text(width / 2, 40, 'VICTORY!', {
      fontSize: '40px', fontFamily: 'monospace',
      color: '#000080', stroke: '#fff', strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(width / 2, 95, 'JAI HIND!', {
      fontSize: '24px', fontFamily: 'monospace',
      color: '#ff6600', stroke: '#fff', strokeThickness: 4
    }).setOrigin(0.5)

    const story = [
      'The Governor has been defeated',
      'by the power of carbohydrates!',
      '',
      'The turmeric is FREE once more!',
      '',
      'East Masala Company dissolved.',
      'They renamed themselves',
      '"EastMasala Tech Pvt. Ltd."',
      '',
      'Dadi: "Beta, now get married."',
      'Sacred Cow: *chews cud peacefully*',
      'Sharma: promoted to Senior Tiffin Inspector.'
    ]

    story.forEach((line, i) => {
      this.add.text(width / 2, 145 + i * 24, line, {
        fontSize: '13px', fontFamily: 'monospace',
        color: '#000080', stroke: '#fff', strokeThickness: 2
      }).setOrigin(0.5)
    })

    this.add.text(width / 2, height - 90, 'FINAL SCORE: ' + GameState.score, {
      fontSize: '20px', fontFamily: 'monospace',
      color: '#ff6600', stroke: '#fff', strokeThickness: 4
    }).setOrigin(0.5)

    const restart = this.add.text(width / 2, height - 45, 'PRESS ENTER TO PLAY AGAIN', {
      fontSize: '14px', fontFamily: 'monospace', color: '#000080'
    }).setOrigin(0.5)
    this.tweens.add({
      targets: restart, alpha: { from: 1, to: 0.2 }, duration: 700, yoyo: true, repeat: -1
    })

    this.input.keyboard.once('keydown-ENTER', () => {
      if (window.__maki_reset) window.__maki_reset.resetState()
      this.scene.start('TitleScene')
    })
    this.input.once('pointerdown', () => {
      if (window.__maki_reset) window.__maki_reset.resetState()
      this.scene.start('TitleScene')
    })
  }

  _burst() {
    const x = Phaser.Math.Between(80, this.scale.width - 80)
    const y = Phaser.Math.Between(80, this.scale.height - 80)
    const colors = [0xff9933, 0x138808, 0x000080, 0xffffff, 0xffd700]
    for (let i = 0; i < 8; i++) {
      const p = this.add.rectangle(x, y, 6, 6, Phaser.Utils.Array.GetRandom(colors))
      const angle = (i / 8) * Math.PI * 2
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * Phaser.Math.Between(40, 120),
        y: y + Math.sin(angle) * Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1200),
        onComplete: () => p.destroy()
      })
    }
  }
}
