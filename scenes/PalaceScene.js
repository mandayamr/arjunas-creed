import { GameState, HUD } from './GameState.js'

export default class PalaceScene extends Phaser.Scene {
  constructor() { super('PalaceScene') }

  preload() {
    const g=this.make.graphics({x:0,y:0,add:false})
    g.fillStyle(0xffffff,1); g.fillRect(0,0,32,32)
    g.generateTexture('white2',32,32); g.destroy()
  }

  create() {
    const W=1200,H=1200
    this.physics.world.setBounds(0,0,W,H)
    this.cameras.main.setBounds(0,0,W,H)
    this.cameras.main.setZoom(1.8)
    this._drawPalace(W,H)

    this.player=this.physics.add.sprite(600,1000,'white2')
    this.player.setDisplaySize(18,24).setTint(0xffbb88).setDepth(10)
    this.player.body.setAllowGravity(false)
    this.player.body.setCollideWorldBounds(true)
    this.player.body.setSize(18,24)
    this.playerGfx=this.add.graphics().setDepth(11)
    this.cameras.main.startFollow(this.player,true,0.1,0.1)

    this._bossHP=5; this._bossMaxHP=5; this._bossDead=false
    this._caught=false; this._spaceDown=false; this._facingAngle=-Math.PI/2

    this.bossVis=this.add.graphics().setDepth(10)
    this.bossSprite=this.physics.add.sprite(600,200,'white2')
    this.bossSprite.setDisplaySize(22,34).setAlpha(0.01)
    this.bossSprite.body.setAllowGravity(false)
    this.bossSprite.body.setCollideWorldBounds(true)
    this.bossSprite.body.setBounce(0.6)
    this.bossSprite.body.setVelocity(120,80)
    this._drawBoss(false)

    this.spices=this.physics.add.staticGroup()
    ;[[250,250],[950,250],[250,950],[950,950],[600,500]].forEach(([x,y])=>{
      const v=this.add.graphics().setDepth(6)
      v.fillStyle(0xff6600,1); v.fillCircle(0,0,12)
      v.fillStyle(0xffaa00,1); v.fillCircle(0,0,7)
      v.fillStyle(0xffffff,0.5); v.fillCircle(-3,-3,4)
      v.setPosition(x,y)
      this.tweens.add({targets:v,y:y-8,duration:800,yoyo:true,repeat:-1})
      this.add.text(x,y-22,'SPICE',{fontSize:'9px',fontFamily:'monospace',color:'#ff6600',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7)
      const h=this.physics.add.sprite(x,y,'white2')
      h.setDisplaySize(30,30).setAlpha(0.01)
      h.body.setAllowGravity(false)
      h.spiceVis=v
      this.spices.add(h)
    })

    this.bossBullets=this.physics.add.group()
    this.playerBullets=this.physics.add.group()

    this.physics.add.overlap(this.player,this.spices,this._collectSpice,null,this)
    this.physics.add.overlap(this.player,this.bossBullets,this._hitBySpice,null,this)
    this.physics.add.overlap(this.playerBullets,this.bossSprite,this._rotiBossHit,null,this)
    this.physics.add.overlap(this.player,this.bossSprite,this._bossTouch,null,this)

    this.hud=new HUD(this)
    GameState.level=2

    const {width}=this.scale
    this.hpBg=this.add.graphics().setScrollFactor(0).setDepth(202)
    this.hpFill=this.add.graphics().setScrollFactor(0).setDepth(203)
    this.hpLabel=this.add.text(width/2,50,'',{fontSize:'13px',fontFamily:'monospace',color:'#ffcccc',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(204)
    this._drawHPBar()

    this.cursors=this.input.keyboard.createCursorKeys()
    this.wasd=this.input.keyboard.addKeys({
      w:Phaser.Input.Keyboard.KeyCodes.W,
      a:Phaser.Input.Keyboard.KeyCodes.A,
      s:Phaser.Input.Keyboard.KeyCodes.S,
      d:Phaser.Input.Keyboard.KeyCodes.D,
      space:Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    this.time.addEvent({delay:2000,callback:this._bossShoot,callbackScope:this,loop:true})
    this.time.addEvent({delay:5000,callback:this._bossRant,callbackScope:this,loop:true})

    const banner=this.add.text(width/2,68,'Collect SPICE circles  |  SPACE=throw roti at the Governor  |  Hit him 5 times!',{
      fontSize:'11px',fontFamily:'monospace',color:'#ffd700',stroke:'#000',strokeThickness:3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(220)
    this.tweens.add({targets:banner,alpha:0,delay:5000,duration:1000})

    this.hud.showNotif('Collect SPICE then throw ROTIS at The Governor!','#ffd700',4000)
    this.time.delayedCall(4500,()=>this.hud.showNotif('Governor: "Jolly good! Prepare for British justice!"','#ffaaaa',3000))
    this.cameras.main.fadeIn(600)
  }

  _drawPlayer() {
    const g=this.playerGfx; g.clear()
    const x=this.player.x,y=this.player.y
    g.fillStyle(0x000000,0.2); g.fillEllipse(x,y+14,22,8)
    g.fillStyle(0x2244aa,1); g.fillRect(x-8,y+4,7,16); g.fillRect(x+1,y+4,7,16)
    g.fillStyle(0x111111,1); g.fillRect(x-9,y+18,8,5); g.fillRect(x,y+18,8,5)
    g.fillStyle(0xff6600,1); g.fillRect(x-10,y-14,20,20)
    g.fillStyle(0xdd4400,1); g.fillRect(x-10,y-14,20,3); g.fillRect(x-2,y-14,4,20)
    g.fillStyle(0xffd700,1); g.fillRect(x-10,y+3,20,3)
    g.fillStyle(0xffcc88,1); g.fillRect(x-16,y-12,6,16); g.fillRect(x+10,y-12,6,16)
    g.fillStyle(0x111111,1); g.fillRect(x-17,y+2,7,5); g.fillRect(x+10,y+2,7,5)
    g.fillStyle(0xffcc88,1); g.fillCircle(x,y-22,10)
    g.fillStyle(0x111111,1); g.fillRect(x-10,y-32,20,12)
    g.fillStyle(0x000000,1); g.fillCircle(x-3,y-23,2); g.fillCircle(x+3,y-23,2)
    g.fillStyle(0xffffff,1); g.fillCircle(x-2,y-24,1); g.fillCircle(x+4,y-24,1)
    g.fillStyle(0xcc6644,1); g.fillRect(x-3,y-18,6,2)
  }

  _drawBoss(angry) {
    const g=this.bossVis; g.clear()
    if (!this.bossSprite) return
    const x=this.bossSprite.x,y=this.bossSprite.y
    g.fillStyle(0x000000,0.2); g.fillEllipse(x,y+18,28,10)
    g.fillStyle(0x333366,1); g.fillRect(x-7,y+11,6,16); g.fillRect(x+1,y+11,6,16)
    g.fillStyle(0x111133,1); g.fillRect(x-8,y+25,7,5); g.fillRect(x+1,y+25,7,5)
    g.fillStyle(angry?0xff0000:0x1a3a6e,1); g.fillRect(x-11,y-15,22,26)
    g.fillStyle(0xffd700,1); g.fillRect(x-11,y-15,22,3); g.fillRect(x-11,y-9,22,3); g.fillRect(x-11,y-3,22,3)
    g.fillStyle(0xffcc99,1); g.fillRect(x-15,y-13,4,16); g.fillRect(x+11,y-13,4,16)
    g.fillStyle(0xffcc99,1); g.fillCircle(x,y-24,10)
    g.fillStyle(0x000080,1); g.fillRect(x-9,y-34,18,12)
    g.fillStyle(0xffd700,1); g.fillCircle(x+12,y-30,5)
    if (angry) { g.fillStyle(0xff0000,0.3); g.fillCircle(x,y,30) }
  }

  _drawHPBar() {
    const {width}=this.scale
    this.hpBg.clear(); this.hpBg.fillStyle(0x330000,0.9); this.hpBg.fillRect(width/2-120,54,240,20)
    this.hpBg.lineStyle(1,0xff6666); this.hpBg.strokeRect(width/2-120,54,240,20)
    const pct=this._bossHP/this._bossMaxHP
    this.hpFill.clear(); this.hpFill.fillStyle(pct>0.6?0xff3333:pct>0.3?0xff9900:0xff00ff,1)
    this.hpFill.fillRect(width/2-119,55,Math.floor(238*pct),18)
    this.hpLabel.setText('THE GOVERNOR  HP: '+this._bossHP+'/'+this._bossMaxHP)
  }

  _drawPalace(W,H) {
    const bg=this.add.graphics().setDepth(0)
    bg.fillStyle(0xc8a06e,1); bg.fillRect(0,0,W,H)
    for(let i=0;i<12;i++) for(let j=0;j<12;j++) {
      if((i+j)%2===0) { bg.fillStyle(0xd4b07e,1); bg.fillRect(i*100,j*100,100,100) }
    }
    const walls=this.add.graphics().setDepth(1)
    walls.fillStyle(0xa07040,1)
    walls.fillRect(0,0,W,28); walls.fillRect(0,H-28,W,28)
    walls.fillRect(0,0,28,H); walls.fillRect(W-28,0,28,H)
    walls.fillStyle(0xffd700,0.5)
    walls.fillRect(0,26,W,4); walls.fillRect(0,H-32,W,4)
    walls.fillRect(26,0,4,H); walls.fillRect(W-32,0,4,H)
    const pillars=this.add.graphics().setDepth(2)
    const pillarSpots=[[100,100],[100,600],[100,1100],[600,100],[1100,100],[1100,600],[1100,1100],[600,1100]]
    pillarSpots.forEach(([x,y])=>{
      pillars.fillStyle(0xe8c898,1); pillars.fillRect(x-16,y-44,32,88)
      pillars.fillStyle(0xffd700,0.5); pillars.fillRect(x-16,y-44,32,9); pillars.fillRect(x-16,y+35,32,9)
      pillars.fillStyle(0xc8a870,1); pillars.fillEllipse(x,y-44,40,16); pillars.fillEllipse(x,y+44,40,16)
    })
    const deco=this.add.graphics().setDepth(2)
    deco.fillStyle(0x8B0000,0.4); deco.fillRect(350,50,500,130)
    deco.fillStyle(0xffd700,0.6); deco.fillTriangle(350,50,600,10,850,50)
    deco.fillStyle(0x8B0000,1); deco.fillRect(580,100,40,80)
    deco.fillStyle(0x4444cc,0.4)
    deco.fillRect(120,120,130,100); deco.fillRect(950,120,130,100)
    deco.fillRect(120,980,130,100); deco.fillRect(950,980,130,100)
    deco.fillStyle(0xff0000,0.1)
    for(let i=0;i<8;i++) deco.fillRect(0,i*150,W,3)
    for(let j=0;j<8;j++) deco.fillRect(j*150,0,3,H)
  }

  _bossShoot() {
    if (this._bossDead) return
    const bx=this.bossSprite.x,by=this.bossSprite.y
    const angle=Phaser.Math.Angle.Between(bx,by,this.player.x,this.player.y)
    const shots=this._bossHP<=2?3:1
    for(let i=0;i<shots;i++) {
      const spread=(i-Math.floor(shots/2))*0.38
      const b=this.add.graphics().setDepth(9)
      b.fillStyle(0xff6600,1); b.fillCircle(0,0,9)
      b.fillStyle(0xffaa00,1); b.fillCircle(0,0,5)
      this.physics.add.existing(b)
      b.setPosition(bx,by); b.body.setSize(18,18); b.body.setAllowGravity(false)
      const spd=160+(this._bossMaxHP-this._bossHP)*30
      b.body.setVelocity(Math.cos(angle+spread)*spd,Math.sin(angle+spread)*spd)
      this.tweens.add({targets:b,angle:360,duration:400,repeat:-1})
      this.bossBullets.add(b)
      this.time.delayedCall(3500,()=>{ if(b.active) b.destroy() })
    }
  }

  _bossRant() {
    if (this._bossDead) return
    const rants=['Governor: "Most irregular, old chap!"','Governor: "Spice monopoly SHALL prevail!"','Governor: "Is that a FLATBREAD?!"','Governor: "I am allergic to democracy!"','Governor: "Guards?... typical."']
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(rants),'#ffccaa',2200)
  }

  _collectSpice(player,h) {
    if (!h.active) return
    if (h.spiceVis) this.tweens.add({targets:h.spiceVis,alpha:0,scaleX:2,scaleY:2,duration:300,onComplete:()=>h.spiceVis.destroy()})
    h.destroy()
    GameState.rotis=Math.min(15,GameState.rotis+3); GameState.score+=50
    this.hud.showNotif('SPICE! +3 Rotis!','#ff9933',1000)
    this.hud.update()
  }

  _hitBySpice(player,b) {
    b.destroy()
    GameState.auntyLevel=Math.min(100,GameState.auntyLevel+12)
    this.cameras.main.shake(200,0.01)
    this.hud.showNotif('Spice hit! Aunty +12%!','#ff6666',1000)
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'spice'})
    this.hud.update()
  }

  _bossTouch(player,boss) {
    if (this._caught||this._bossDead) return
    this._caught=true
    GameState.auntyLevel=Math.min(100,GameState.auntyLevel+15)
    this.cameras.main.shake(200,0.01)
    this.hud.showNotif('Governor bumped you! +15%!','#ff6666',1200)
    const angle=Phaser.Math.Angle.Between(boss.x,boss.y,player.x,player.y)
    player.body.setVelocity(Math.cos(angle)*280,Math.sin(angle)*280)
    this.time.delayedCall(500,()=>{ this._caught=false })
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'spice'})
  }

  _throwRoti() {
    if (GameState.rotis<=0) { this.hud.showNotif('No rotis! Collect SPICE circles!','#ff4444',1500); return }
    GameState.rotis--
    const px=this.player.x,py=this.player.y
    const angle=Phaser.Math.Angle.Between(px,py,this.bossSprite.x,this.bossSprite.y)
    const b=this.add.graphics().setDepth(12)
    b.fillStyle(0xD2691E,1); b.fillEllipse(0,0,24,18)
    b.fillStyle(0xC4A35A,1); b.fillEllipse(0,0,18,13)
    b.fillStyle(0xffffff,0.4); b.fillEllipse(-3,-3,8,6)
    this.physics.add.existing(b)
    b.setPosition(px,py); b.body.setSize(24,18); b.body.setAllowGravity(false)
    b.body.setVelocity(Math.cos(angle)*480,Math.sin(angle)*480)
    this.tweens.add({targets:b,angle:360,duration:280,repeat:-1})
    this.playerBullets.add(b)
    this.time.delayedCall(2500,()=>{ if(b.active) b.destroy() })
    this.hud.update()
  }

  _rotiBossHit(bullet,boss) {
    if (this._bossDead) return
    bullet.destroy(); this._bossHP--; GameState.score+=300
    this._drawHPBar(); this._drawBoss(true)
    this.time.delayedCall(300,()=>{ if(!this._bossDead) this._drawBoss(false) })
    this.cameras.main.shake(150,0.008)
    if (this._bossHP<=0) { this._killBoss(); return }
    const msgs=['Governor: "Ow! Carb assault!"','Governor: "My monocle!"','Governor: "NOT cricket!"','Governor: "I want your manager!"']
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(msgs),'#ff9900',1800)
  }

  _killBoss() {
    this._bossDead=true
    this.bossSprite.body.setVelocity(0,0)
    this.bossVis.clear()
    this.bossVis.fillStyle(0x888888,0.5); this.bossVis.fillEllipse(this.bossSprite.x,this.bossSprite.y+8,28,14)
    this.bossVis.fillStyle(0xffcc99,0.5); this.bossVis.fillCircle(this.bossSprite.x,this.bossSprite.y-5,10)
    GameState.score+=2000
    const msgs=['Governor: "Defeated... by flatbread..."','Governor: "The spice was not worth it..."','Governor: "Tell mum I was British and brave."']
    let delay=800
    msgs.forEach(m=>{ this.time.delayedCall(delay,()=>this.hud.showNotif(m,'#ffd700',2200)); delay+=2800 })
    this.time.delayedCall(delay+800,()=>{
      this.cameras.main.fadeOut(800,0,0,0)
      this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('WinScene'))
    })
  }

  update(time,delta) {
    if (this._bossDead) return
    const speed=160
    let vx=0,vy=0
    if (this.cursors.left.isDown||this.wasd.a.isDown) { vx=-speed; this._facingAngle=Math.PI }
    if (this.cursors.right.isDown||this.wasd.d.isDown) { vx=speed; this._facingAngle=0 }
    if (this.cursors.up.isDown||this.wasd.w.isDown) { vy=-speed; this._facingAngle=-Math.PI/2 }
    if (this.cursors.down.isDown||this.wasd.s.isDown) { vy=speed; this._facingAngle=Math.PI/2 }
    if (vx!==0&&vy!==0) { vx*=0.707; vy*=0.707 }
    this.player.body.setVelocity(vx,vy)
    this._drawPlayer()
    this._drawBoss(false)

    const spaceDown=this.cursors.space.isDown||this.wasd.space.isDown
    if (spaceDown&&!this._spaceDown) this._throwRoti()
    this._spaceDown=spaceDown

    const bspd=50+(this._bossMaxHP-this._bossHP)*18
    this.physics.moveToObject(this.bossSprite,this.player,bspd)
    this.hud.update()
  }
}
