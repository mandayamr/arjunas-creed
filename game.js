import Phaser from 'phaser'
import TitleScene from './scenes/TitleScene.js'
import BazaarScene from './scenes/BazaarScene.js'
import PalaceScene from './scenes/PalaceScene.js'
import GameOverScene from './scenes/GameOverScene.js'
import WinScene from './scenes/WinScene.js'
import { resetState } from './scenes/GameState.js'

window.__maki_reset = { resetState }

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }
  create() {
    const g = this.make.graphics({x:0,y:0,add:false})
    g.fillStyle(0xffffff,1)
    g.fillRect(0,0,32,32)
    g.generateTexture('px',32,32)
    g.destroy()
    this.scene.start('TitleScene')
  }
}

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#d4a843',
    physics: {
        default: 'arcade',
        arcade: { debug: false, gravity: { y: 0 } }
    },
    scene: [BootScene, TitleScene, BazaarScene, PalaceScene, GameOverScene, WinScene]
})
