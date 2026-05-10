export const GameState = {
  auntyLevel: 0,
  chai: 0,
  rotis: 5,
  chaiVisionActive: false,
  blendActive: false,
  score: 0,
  level: 1
}

export function resetState() {
  GameState.auntyLevel = 0
  GameState.chai = 0
  GameState.rotis = 5
  GameState.chaiVisionActive = false
  GameState.blendActive = false
  GameState.score = 0
  GameState.level = 1
}

export class HUD {
  constructor(scene) {
    this.scene = scene
    const { width } = scene.scale

    this.bg = scene.add.graphics().setScrollFactor(0).setDepth(100)
    this.bg.fillStyle(0x000000, 0.75)
    this.bg.fillRect(0, 0, width, 44)
    this.bg.lineStyle(1, 0xff9933)
    this.bg.lineBetween(0, 44, width, 44)

    scene.add.text(8, 6, 'Aunty Meter:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffcccc'
    }).setScrollFactor(0).setDepth(101)

    this.meterBg = scene.add.graphics().setScrollFactor(0).setDepth(101)
    this.meterFill = scene.add.graphics().setScrollFactor(0).setDepth(102)
    this._drawMeterBg()

    this.statsText = scene.add.text(8, 26, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffffff'
    }).setScrollFactor(0).setDepth(101)

    this.levelText = scene.add.text(width - 8, 6, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffd700', align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101)

    this.notifText = scene.add.text(width / 2, 70, '', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(110).setAlpha(0)

    this.update()
  }

  _drawMeterBg() {
    this.meterBg.clear()
    this.meterBg.lineStyle(1, 0xffffff, 0.6)
    this.meterBg.strokeRect(120, 6, 160, 14)
  }

  showNotif(msg, color = '#ffd700', duration = 2000) {
    this.notifText.setText(msg).setColor(color).setAlpha(1)
    this.scene.tweens.add({
      targets: this.notifText,
      alpha: 0,
      delay: duration - 400,
      duration: 400
    })
  }

  update() {
    const gs = GameState
    const pct = gs.auntyLevel / 100
    const r = Math.floor(pct * 255)
    const g2 = Math.floor((1 - pct) * 200)
    const colour = (r << 16) | (g2 << 8)

    this.meterFill.clear()
    this.meterFill.fillStyle(colour, 1)
    this.meterFill.fillRect(121, 7, Math.floor(158 * pct), 12)

    const blend = gs.blendActive ? ' BLEND' : ''
    const vision = gs.chaiVisionActive ? ' VISION' : ''
    this.statsText.setText(`Rotis:${gs.rotis}  Chai:${gs.chai}${blend}${vision}`)
    this.levelText.setText(`LVL ${gs.level}  ${gs.score}pts`)
  }
}
