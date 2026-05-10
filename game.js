import Phaser from 'phaser'
import TitleScene from './scenes/TitleScene.js'
import BazaarScene from './scenes/BazaarScene.js'
import PalaceScene from './scenes/PalaceScene.js'
import GameOverScene from './scenes/GameOverScene.js'
import WinScene from './scenes/WinScene.js'
import { resetState } from './scenes/GameState.js'

window.__maki_reset = { resetState }

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [TitleScene, BazaarScene, PalaceScene, GameOverScene, WinScene]
})
