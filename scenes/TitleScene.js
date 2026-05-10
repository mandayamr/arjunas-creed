import { resetState } from './GameState.js'

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  create() {
    resetState()

    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0xff6b00, 0xff9933, 1)
    bg.fillRect(0, 0, width, height)

    for (let i = 0; i < 60; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.5),
        2, 2, 0xffffff
      )
      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1
      })
    }

    bg.fillStyle(0x0d0820, 1)
    bg.fillRect(0, height * 0.82, width, height * 0.18)
    bg.fillTriangle(80, height * 0.82, 120, height * 0.6, 160, height * 0.82)
    bg.fillRect(100, height * 0.55, 40, height * 0.27)
    bg.fillTriangle(580, height * 0.82, 620, height * 0.58, 660, height * 0.82)
    bg.fillRect(600, height * 0.53, 40, height * 0.29)
    bg.fillRect(340, height * 0.5, 20, height * 0.32)
    bg.fillTriangle(330, height * 0.5, 350, height * 0.4, 370, height * 0.5)
    bg.fillRect(0, height * 0.78, 80, height * 0.22)
    bg.fillRect(180, height * 0.75, 140, height * 0.25)
    bg.fillRect(420, height * 0.77, 160, height * 0.23)
    bg.fillRect(680, height * 0.75, 120, height * 0.25)

    const titleBox = this.add.graphics()
    titleBox.fillStyle(0x000000, 0.7)
    titleBox.fillRect(width * 0.05, height * 0.1, width * 0.9, 120)
    titleBox.lineStyle(3, 0xff9933)
    titleBox.strokeRect(width * 0.05, height * 0.1, width * 0.9, 120)

    this.add.text(width / 2, height * 0.1 + 30, "ARJUN'S CREED", {
      fontSize: '32px', fontFamily: 'monospace',
      color: '#ff9933', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.1 + 75, 'The Chai & Blade Chronicles', {
      fontSize: '16px', fontFamily: 'monospace',
      color: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)

    const storyBox = this.add.graphics()
    storyBox.fillStyle(0x000000, 0.75)
    storyBox.fillRect(40, height * 0.31, width - 80, 185)
    storyBox.lineStyle(2, 0x138808)
    storyBox.strokeRect(40, height * 0.31, width - 80, 185)

    const story = [
      'THE LEGEND OF THE EAST MASALA COMPANY',
      '',
      'The evil East Masala Company has stolen ALL the turmeric',
      'from the sacred spice markets of the land!',
      '',
      'You are ARJUN -- assassin of the Brotherhood of the Biryani.',
      'Sneak past Constable Sharma, avoid Sacred Cows,',
      'collect chai cups, and defeat the Governor!',
      '',
      'WARNING: Aunty Suspicion Level must stay below 100%'
    ]

    story.forEach((line, i) => {
      this.add.text(width / 2, height * 0.31 + 18 + i * 18, line, {
        fontSize: '12px', fontFamily: 'monospace',
        color: i === 0 ? '#ffd700' : '#ffffff'
      }).setOrigin(0.5)
    })

    const ctrlBox = this.add.graphics()
    ctrlBox.fillStyle(0x000000, 0.7)
    ctrlBox.fillRect(40, height * 0.74, width - 80, 85)
    ctrlBox.lineStyle(2, 0xff9933)
    ctrlBox.strokeRect(40, height * 0.74, width - 80, 85)

    const controls = [
      'CONTROLS',
      'Arrow Keys / WASD -- Move Arjun',
      'SPACE -- Throw Roti Shuriken',
      'E -- Chai Vision  |  B -- Blend Mode'
    ]
    controls.forEach((line, i) => {
      this.add.text(width / 2, height * 0.74 + 14 + i * 20, line, {
        fontSize: '13px', fontFamily: 'monospace',
        color: i === 0 ? '#ffd700' : '#ccffcc'
      }).setOrigin(0.5)
    })

    const startText = this.add.text(width / 2, height - 28, 'PRESS ENTER OR SPACE TO START', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)

    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0 },
      duration: 600, yoyo: true, repeat: -1
    })

    const startGame = () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BazaarScene')
      })
    }

    this.input.keyboard.on('keydown-ENTER', startGame)
    this.input.keyboard.on('keydown-SPACE', startGame)
    this.input.once('pointerdown', startGame)
  }
}
