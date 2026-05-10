export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene')
  }

  init(data) {
    this.reason = data?.reason || 'caught'
  }

  create() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillStyle(0x1a0000, 1)
    bg.fillRect(0, 0, width, height)

    const border = this.add.graphics()
    border.lineStyle(4, 0xff3333)
    border.strokeRect(10, 10, width - 20, height - 20)
    this.tweens.add({
      targets: border, alpha: { from: 1, to: 0.2 },
      duration: 500, yoyo: true, repeat: -1
    })

    this.add.text(width / 2, 60, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'monospace',
      color: '#ff3333', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5)

    const msgs = {
      aunty: [
        'THE AUNTIES HAVE SPOKEN.',
        '',
        'Your Aunty Suspicion Level hit 100%.',
        'Every aunty in a 5km radius is now',
        'calling your mother.',
        '',
        '"Beta, what are you doing with your life?',
        'Why cant you be like Dr. Mehtas son?"',
        '',
        '-- Your honour has left the building.'
      ],
      spice: [
        'DEFEATED BY SPICE.',
        '',
        'The Governor\'s turmeric barrage was too much.',
        'You are now permanently yellow.',
        '',
        '"Haldi lagao!" -- Dadi (probably)',
        '',
        'The East Masala Company wins... for now.'
      ],
      caught: [
        'CONSTABLE SHARMA GOT YOU.',
        '',
        '"Aye! Main tumhe jaanta hoon!"',
        '-- Sharma, before calling his cousin',
        '   who is also a constable.',
        '',
        'You have been booked for:',
        '* Unauthorized roti throwing',
        '* Blending without a license',
        '* General suspicious behavior'
      ]
    }

    const lines = msgs[this.reason] || msgs.caught
    lines.forEach((line, i) => {
      this.add.text(width / 2, 140 + i * 26, line, {
        fontSize: '14px', fontFamily: 'monospace',
        color: i === 0 ? '#ff9933' : '#ffcccc'
      }).setOrigin(0.5)
    })

    this.add.text(width / 2, height - 100, 'Final Score: ' + (window._arjunScore || 0), {
      fontSize: '18px', fontFamily: 'monospace',
      color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)

    const restart = this.add.text(width / 2, height - 55, 'PRESS ENTER TO TRY AGAIN', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5)
    this.tweens.add({
      targets: restart, alpha: { from: 1, to: 0 }, duration: 700, yoyo: true, repeat: -1
    })

    this.input.keyboard.once('keydown-ENTER', () => { this.scene.start('TitleScene') })
    this.input.keyboard.once('keydown-SPACE', () => { this.scene.start('TitleScene') })
    this.input.once('pointerdown', () => { this.scene.start('TitleScene') })
  }
}
