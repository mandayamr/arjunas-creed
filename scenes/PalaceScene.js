import { GameState, HUD } from './GameState.js'

export default class PalaceScene extends Phaser.Scene {
  constructor() { super('PalaceScene') }

  create() {
    const W=1200, H=1200
    this.physics.world.setBounds(0,0,W,H)
    this.cameras.main.setBounds(0,0,W,H)

    this._drawPalaceWorld(W,H)

    this.player = this.physics.add.rectangle(600,1000,18,24,0xffbb88)
    this.player.setDepth(10)
    this.player.body.setCollideWorldBounds(true)
    this.playerHead = this.add.graphics().setDepth(11)
    this._drawPlayer()

    this.cameras.main.startFollow(this.player,true,0.1,0.1)
    this.cameras.main.setZoom(1.8)

    this._bossHP = 5
    this._bossMaxHP = 5
    this._bossDead = false
    this._caught = false
    this._spaceDown = false
    this._facingAngle = -Math.PI/2

    // Boss visual
    this.bossVis = this.add.graphics().setDepth(10)
    this._drawBoss(false)
    this.bossBody = this.add.rectangle(600,200,22,34,0x000000,0)
    this.physics.add.existing(this.bossBody)
    this.bossBody.body.setCollideWorldBounds(true)
    this.bossBody.body.setBounce(0.6)
    this.bossBody.body.setVelocity(120,80)

    // Spice pickups
    this.spices = this.physics.add.staticGroup()
    [[250,250],[950,250],[250,950],[950,950],[600,500]].forEach(([x,y])=>{
      const v = this.add.graphics().setDepth(6)
      v.fillStyle(0xff6600,1); v.fillCircle(0,0,12)
      v.fillStyle(0xffaa00,1); v.fillCircle(0,0,5)
      v.setPosition(x,y)
      this.tweens.add({targets:v, y:y-8, duration:800, yoyo:true, repeat:-1})
      this.add.text(x,y-22,'SPICE',{fontSize:'9px',fontFamily:'monospace',color:'#ff6600',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7)
      const h = this.add.rectangle(x,y,30,30,0,0)
      this.physics.add.existing(h,true)
      h.spiceVis = v
      this.spices.add(h)
    })

    // Boss bullets
    this.bossBullets = this.physics.add.group()
    // Player bullets
    this.playerBullets = this.physics.add.group()

    this.physics.add.overlap(this.player, this.spices, this._collectSpice, null, this)
    this.physics.add.overlap(this.player, this.bossBullets, this._hitBySpice, null, this)
    this.physics.add.overlap(this.playerBullets, this.bossBody, this._rotiBossHit, null, this)
    this.physics.add.overlap(this.player, this.bossBody, this._bossTouch, null, this)

    this.hud = new HUD(this)
    GameState.level = 2

    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      w:Phaser.Input.Keyboard.KeyCodes.W,
      a:Phaser.Input.Keyboard.KeyCodes.A,
      s:Phaser.Input.Keyboard.KeyCodes.S,
      d:Phaser.Input.Keyboard.KeyCodes.D,
      space:Phaser.Input.Keyboard.KeyCodes.SPACE
    })

    // Boss fires every 2s
    this.time.addEvent({delay:2000, callback:this._bossShoot, callbackScope:this, loop:true})
    this.time.addEvent({delay:5000, callback:this._bossRant, callbackScope:this, loop:true})

    // HP bar
    const {width} = this.scale
    this.hpBg = this.add.graphics().setScrollFactor(0).setDepth(202)
    this.hpFill = this.add.graphics().setScrollFactor(0).setDepth(203)
    this.hpLabel = this.add.text(width/2,50,'',{fontSize:'13px',fontFamily:'monospace',color:'#ffcccc',stroke:'#000',strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(204)
    this._drawHPBar()

    const banner = this.add.text(width/2,68,'PALACE  |  Collect SPICE then SPACE to throw rotis at THE GOVERNOR!',{
      fontSize:'11px',fontFamily:'monospace',color:'#ffd700',stroke:'#000',strokeThickness:3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(220)
    this.tweens.add({targets:banner, alpha:0, delay:5000, duration:1000})

    this.hud.showNotif('Collect SPICE stars then throw ROTIS at the Governor!','#ffd700',4000)
    this.time.delayedCall(4500,()=>this.hud.showNotif('Governor: "Jolly good! Prepare for British justice!"','#ffaaaa',3000))
    this.cameras.main.fadeIn(600)
  }

  _drawPlayer() {
    this.playerHead.clear()
    const x=this.player.x, y=this.player.y
    this.playerHead.fillStyle(0xffcc88,1); this.playerHead.fillCircle(x,y-20,9)
    this.playerHead.fillStyle(0x222222,1); this.playerHead.fillRect(x-9,y-29,18,8)
    this.playerHead.fillStyle(0x000000,1); this.playerHead.fillCircle(x-3,y-21,2); this.playerHead.fillCircle(x+3,y-21,2)
    this.playerHead.fillStyle(0xffcc88,1); this.playerHead.fillRect(x-18,y-14,5,16); this.playerHead.fillRect(x+13,y-14,5,16)
    this.playerHead.fillStyle(0x4444cc,1); this.playerHead.fillRect(x-8,y+4,7,16); this.playerHead.fillRect(x+1,y+4,7,16)
    this.playerHead.fillStyle(0xff6600,0.7); this.playerHead.fillRect(x-9,y-14,18,18)
    this.playerHead.fillStyle(0xffd700,1); this.playerHead.fillRect(x-9,y-2,18,3)
  }

  _drawBoss(angry) {
    this.bossVis.clear()
    const x=this.bossBody?this.bossBody.x:600, y=this.bossBody?this.bossBody.y:200
    this.bossVis.setPosition(x,y)
    this.bossVis.fillStyle(0xffcc99,1); this.bossVis.fillCircle(0,-24,10)
    this.bossVis.fillStyle(0x000080,1); this.bossVis.fillRect(-9,-34,18,12)
    this.bossVis.fillStyle(0xffd700,1); this.bossVis.fillCircle(12,-30,5)
    this.bossVis.fillStyle(angry?0xff0000:0x1a3a6e,1); this.bossVis.fillRect(-11,-15,22,26)
    this.bossVis.fillStyle(0xffd700,1)
    this.bossVis.fillRect(-11,-15,22,3); this.bossVis.fillRect(-11,-9,22,3); this.bossVis.fillRect(-11,-3,22,3)
    this.bossVis.fillStyle(0xffcc99,1)
    this.bossVis.fillRect(-15,-13,4,16); this.bossVis.fillRect(11,-13,4,16)
    this.bossVis.fillStyle(0x333366,1)
    this.bossVis.fillRect(-7,11,6,16); this.bossVis.fillRect(1,11,6,16)
    this.bossVis.fillStyle(0x111133,1)
    this.bossVis.fillRect(-8,25,7,5); this.bossVis.fillRect(1,25,7,5)
    if (angry) { this.bossVis.fillStyle(0xff0000,0.3); this.bossVis.fillCircle(0,0,28) }
  }

  _drawHPBar() {
    const {width}=this.scale
    this.hpBg.clear(); this.hpBg.fillStyle(0x330000,0.9); this.hpBg.fillRect(width/2-120,54,240,20)
    this.hpBg.lineStyle(1,0xff6666); this.hpBg.strokeRect(width/2-120,54,240,20)
    const pct=this._bossHP/this._bossMaxHP
    const col=pct>0.6?0xff3333:pct>0.3?0xff9900:0xff00ff
    this.hpFill.clear(); this.hpFill.fillStyle(col,1)
    this.hpFill.fillRect(width/2-119,55,Math.floor(238*pct),18)
    this.hpLabel.setText('THE GOVERNOR  HP: '+this._bossHP+'/'+this._bossMaxHP)
  }

  _drawPalaceWorld(W,H) {
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
    [[100,100],[100,600],[100,1100],[600,100],[1100,100],[1100,600],[1100,1100],[600,1100]].forEach(([x,y])=>{
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
    deco.fillStyle(0xff0000,0.15)
    for(let i=0;i<8;i++) { deco.fillRect(0,i*150,W,4) }
    for(let j=0;j<8;j++) { deco.fillRect(j*150,0,4,H) }
  }

  _bossShoot() {
    if (this._bossDead) return
    const bx=this.bossBody.x, by=this.bossBody.y
    const px=this.player.x, py=this.player.y
    const angle=Phaser.Math.Angle.Between(bx,by,px,py)
    const shots=this._bossHP<=2?3:1
    for(let i=0;i<shots;i++) {
      const spread=(i-Math.floor(shots/2))*0.38
      const b=this.add.graphics().setDepth(9)
      b.fillStyle(0xff6600,1); b.fillCircle(0,0,9)
      this.physics.add.existing(b)
      b.setPosition(bx,by); b.body.setSize(18,18)
      const spd=160+(this._bossMaxHP-this._bossHP)*30
      b.body.setVelocity(Math.cos(angle+spread)*spd,Math.sin(angle+spread)*spd)
      b.body.setAllowGravity(false)
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

  _collectSpice(player,hitbox) {
    if (!hitbox.active) return
    if (hitbox.spiceVis) { this.tweens.add({targets:hitbox.spiceVis,alpha:0,scaleX:2,scaleY:2,duration:300,onComplete:()=>hitbox.spiceVis.destroy()}) }
    hitbox.destroy()
    GameState.rotis=Math.min(15,GameState.rotis+3)
    GameState.score+=50
    this.hud.showNotif('SPICE! +3 Rotis to throw!','#ff9933',1000)
    this.hud.update()
  }

  _hitBySpice(player,bullet) {
    bullet.destroy()
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
    this.hud.showNotif('Governor bumped you! +15% Aunty!','#ff6666',1200)
    const angle=Phaser.Math.Angle.Between(boss.x,boss.y,player.x,player.y)
    player.body.setVelocity(Math.cos(angle)*280,Math.sin(angle)*280)
    this.time.delayedCall(500,()=>{ this._caught=false })
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'spice'})
  }

  _throwRoti() {
    if (GameState.rotis<=0) {
      this.hud.showNotif('No rotis! Collect SPICE stars!','#ff4444',1500)
      return
    }
    GameState.rotis--
    const px=this.player.x, py=this.player.y
    const angle=Phaser.Math.Angle.Between(px,py,this.bossBody.x,this.bossBody.y)
    const b=this.add.graphics().setDepth(12)
    b.fillStyle(0xD2691E,1); b.fillEllipse(0,0,24,18)
    b.fillStyle(0xC4A35A,1); b.fillEllipse(0,0,18,13)
    b.fillStyle(0xffffff,0.4); b.fillEllipse(-3,-3,8,6)
    this.physics.add.existing(b)
    b.setPosition(px,py); b.body.setSize(24,18)
    b.body.setVelocity(Math.cos(angle)*480,Math.sin(angle)*480)
    b.body.setAllowGravity(false)
    this.tweens.add({targets:b,angle:360,duration:280,repeat:-1})
    this.playerBullets.add(b)
    this.time.delayedCall(2500,()=>{ if(b.active) b.destroy() })
    this.hud.update()
  }

  _rotiBossHit(bullet,boss) {
    if (this._bossDead) return
    bullet.destroy()
    this._bossHP--
    GameState.score+=300
    this._drawHPBar()
    this._drawBoss(true)
    this.time.delayedCall(300,()=>{ if(!this._bossDead) this._drawBoss(false) })
    if (this._bossHP<=0) { this._killBoss(); return }
    const msgs=['Governor: "Ow! Carb assault!"','Governor: "My monocle!"','Governor: "NOT cricket!"','Governor: "I want your manager!"']
    this.hud.showNotif(Phaser.Utils.Array.GetRandom(msgs),'#ff9900',1800)
    this.cameras.main.shake(150,0.008)
  }

  _killBoss() {
    this._bossDead=true
    this.bossBody.body.setVelocity(0,0)
    this.bossVis.clear()
    this.bossVis.fillStyle(0x888888,0.5); this.bossVis.fillEllipse(0,8,28,14)
    this.bossVis.fillStyle(0xffcc99,0.5); this.bossVis.fillCircle(0,-5,10)
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
    if (this.bossBody) this.bossVis.setPosition(this.bossBody.x,this.bossBody.y)

    const spaceDown=this.cursors.space.isDown||this.wasd.space.isDown
    if (spaceDown&&!this._spaceDown) this._throwRoti()
    this._spaceDown=spaceDown

    // Boss chases at increasing speed
    if (!this._bossDead) {
      const bspd=50+(this._bossMaxHP-this._bossHP)*18
      this.physics.moveToObject(this.bossBody,this.player,bspd)
    }
    this.hud.update()
  }
}
