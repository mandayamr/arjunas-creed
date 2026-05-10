import { GameState, HUD } from './GameState.js'

export default class BazaarScene extends Phaser.Scene {
  constructor() { super('BazaarScene') }

  preload() {
    // Create a white pixel texture for sprites
    const g = this.make.graphics({x:0,y:0,add:false})
    g.fillStyle(0xffffff,1)
    g.fillRect(0,0,32,32)
    g.generateTexture('px',32,32)
    g.destroy()
  }

  create() {
    const W=1600, H=1600
    this.physics.world.setBounds(0,0,W,H)
    this.cameras.main.setBounds(0,0,W,H)
    this.cameras.main.setZoom(1.8)

    this._drawWorld()

    // Player as sprite
    this.player = this.physics.add.sprite(800,800,'px')
    this.player.setDisplaySize(18,24)
    this.player.setTint(0xffbb88)
    this.player.setDepth(10)
    this.player.body.setCollideWorldBounds(true)
    this.player.body.setAllowGravity(false)
    this.player.body.setSize(18,24)

    this.playerGfx = this.add.graphics().setDepth(11)
    this.cameras.main.startFollow(this.player,true,0.1,0.1)

    // Guards
    this.guards = this.physics.add.group()
    ;[
      [400,400,'Sharma'],[1200,400,'Dubey'],[400,1200,'Pandey'],
      [1200,1200,'Verma'],[800,300,'Raju'],[300,800,'Mohan'],
      [1300,800,'Gopal'],[800,1300,'Singh']
    ].forEach(([x,y,n])=>this._spawnGuard(x,y,n))

    // Chai
    this.chais = this.physics.add.staticGroup()
    ;[
      [300,300],[1300,300],[300,1300],[1300,1300],
      [800,400],[400,800],[1200,800],[800,1200],
      [600,600],[1000,600],[600,1000],[1000,1000],
      [200,600],[1400,600],[600,200],[1000,200]
    ].forEach(([x,y])=>{
      const v=this.add.graphics().setDepth(6)
      v.fillStyle(0x8B4513,1); v.fillRect(-9,-7,18,16)
      v.fillStyle(0xD2691E,1); v.fillRect(-7,-11,14,6)
      v.fillStyle(0xc8520a,1); v.fillRect(8,-4,5,6)
      v.fillStyle(0xffdd88,1); v.fillEllipse(0,-2,13,9)
      v.fillStyle(0xff9900,0.9); v.fillEllipse(0,-2,8,5)
      v.setPosition(x,y)
      this.tweens.add({targets:v,y:y-10,duration:900,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})
      this.add.text(x,y-24,'CHAI',{fontSize:'9px',fontFamily:'monospace',color:'#ffd700',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7)
      const h=this.physics.add.sprite(x,y,'px')
      h.setDisplaySize(30,30).setAlpha(0.01)
      h.body.setAllowGravity(false)
      h.chaiVis=v
      this.chais.add(h)
    })

    // Rotis
    this.rotiPickups = this.physics.add.staticGroup()
    ;[
      [500,300],[1100,300],[300,500],[1300,500],
      [500,1100],[1100,1100],[300,1100],[1300,1100],
      [700,700],[900,700],[700,900],[900,900],
      [400,600],[1200,600],[600,400],[1000,400],
      [600,1000],[1000,1000]
    ].forEach(([x,y])=>{
      const v=this.add.graphics().setDepth(6)
      v.fillStyle(0xD2691E,1); v.fillEllipse(0,0,26,19)
      v.fillStyle(0xC4A35A,1); v.fillEllipse(0,0,19,14)
      v.fillStyle(0xD2691E,0.6); v.fillEllipse(-4,-2,10,7)
      v.fillStyle(0xffffff,0.35); v.fillEllipse(-2,-4,6,5)
      v.setPosition(x,y)
      this.tweens.add({targets:v,angle:360,duration:1800,repeat:-1})
      this.add.text(x,y-20,'ROTI',{fontSize:'9px',fontFamily:'monospace',color:'#ffaa00',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7)
      const h=this.physics.add.sprite(x,y,'px')
      h.setDisplaySize(30,30).setAlpha(0.01)
      h.body.setAllowGravity(false)
      h.rotiVis=v
      this.rotiPickups.add(h)
    })

    // Portal
    const pv=this.add.graphics().setDepth(8)
    pv.fillStyle(0x00ffff,0.9); pv.fillRect(-24,-24,48,48)
    pv.fillStyle(0xffd700,1); pv.fillRect(-24,-24,48,8)
    pv.fillStyle(0xffd700,1); pv.fillRect(-24,16,48,8)
    pv.setPosition(1450,1450)
    this.tweens.add({targets:pv,alpha:{from:0.5,to:1},duration:600,yoyo:true,repeat:-1})
    this.add.text(1450,1415,'PALACE\nGATE',{fontSize:'11px',fontFamily:'monospace',color:'#00ffff',stroke:'#000',strokeThickness:2,align:'center'}).setOrigin(0.5).setDepth(9)
    this.portalSprite = this.physics.add.sprite(1450,1450,'px')
    this.portalSprite.setDisplaySize(55,55).setAlpha(0.01)
    this.portalSprite.body.setAllowGravity(false)
    this.portalSprite.body.setImmovable(true)

    // Dadi
    const dv=this.add.graphics().setDepth(8)
    this._drawDadiGfx(dv); dv.setPosition(800,700)
    this.add.text(800,665,'DADI -- walk here to\ngive rotis & lower aunty!',{fontSize:'9px',fontFamily:'monospace',color:'#ff88ff',stroke:'#000',strokeThickness:2,align:'center'}).setOrigin(0.5).setDepth(9)
    this.dadiSprite = this.physics.add.sprite(800,700,'px')
    this.dadiSprite.setDisplaySize(40,40).setAlpha(0.01)
    this.dadiSprite.body.setAllowGravity(false)
    this.dadiSprite.body.setImmovable(true)

    // Bullets
    this.bullets = this.physics.add.group()

    // Overlaps
    this.physics.add.overlap(this.player,this.chais,this._collectChai,null,this)
    this.physics.add.overlap(this.player,this.rotiPickups,this._collectRoti,null,this)
    this.physics.add.overlap(this.player,this.portalSprite,this._enterPortal,null,this)
    this.physics.add.overlap(this.player,this.dadiSprite,this._giveToDadi,null,this)
    this.physics.add.overlap(this.bullets,this.guards,this._rotiHit,null,this)
    this.physics.add.overlap(this.player,this.guards,this._guardCaught,null,this)

    this.hud = new HUD(this)
    GameState.level=1
    this._caught=false
    this._dadiGiven=false
    this._spaceDown=false
    this._bDown=false
    this._facingAngle=0
    this._enteringPortal=false

    this.cursors=this.input.keyboard.createCursorKeys()
    this.wasd=this.input.keyboard.addKeys({
      w:Phaser.Input.Keyboard.KeyCodes.W,
      a:Phaser.Input.Keyboard.KeyCodes.A,
      s:Phaser.Input.Keyboard.KeyCodes.S,
      d:Phaser.Input.Keyboard.KeyCodes.D,
      space:Phaser.Input.Keyboard.KeyCodes.SPACE,
      b:Phaser.Input.Keyboard.KeyCodes.B
    })

    this.time.addEvent({delay:2000,callback:()=>{GameState.auntyLevel=Math.max(0,GameState.auntyLevel-2)},loop:true})
    this.time.addEvent({delay:8000,callback:this._dadiPops,callbackScope:this,loop:true})

    const {width}=this.scale
    this.add.text(width/2,65,'WASD=Move  SPACE=Throw Roti at guards  B=Blend invisible',{
      fontSize:'11px',fontFamily:'monospace',color:'#ffd700',stroke:'#000',strokeThickness:3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(220)

    this.hud.showNotif('Walk over CHAI and spinning ROTIS to collect! SPACE to throw!','#ffd700',5000)
    this.cameras.main.fadeIn(600)
  }

  _drawPlayer() {
    const g=this.playerGfx
    g.clear()
    const x=this.player.x, y=this.player.y
    // Shadow
    g.fillStyle(0x000000,0.2); g.fillEllipse(x,y+14,22,8)
    // Legs
    g.fillStyle(0x2244aa,1); g.fillRect(x-8,y+4,7,16); g.fillRect(x+1,y+4,7,16)
    g.fillStyle(0x111111,1); g.fillRect(x-9,y+18,8,5); g.fillRect(x,y+18,8,5)
    // Body
    g.fillStyle(0xff6600,1); g.fillRect(x-10,y-14,20,20)
    // Vest detail
    g.fillStyle(0xdd4400,1); g.fillRect(x-10,y-14,20,3); g.fillRect(x-2,y-14,4,20)
    // Belt
    g.fillStyle(0xffd700,1); g.fillRect(x-10,y+3,20,3)
    // Arms
    g.fillStyle(0xffcc88,1); g.fillRect(x-16,y-12,6,16); g.fillRect(x+10,y-12,6,16)
    g.fillStyle(0x111111,1); g.fillRect(x-17,y+2,7,5); g.fillRect(x+10,y+2,7,5)
    // Head
    g.fillStyle(0xffcc88,1); g.fillCircle(x,y-22,10)
    // Hair
    g.fillStyle(0x111111,1); g.fillRect(x-10,y-32,20,12)
    g.fillStyle(0x222222,1); g.fillRect(x-10,y-24,4,6); g.fillRect(x+6,y-24,4,6)
    // Eyes
    g.fillStyle(0x000000,1); g.fillCircle(x-3,y-23,2); g.fillCircle(x+3,y-23,2)
    g.fillStyle(0xffffff,1); g.fillCircle(x-2,y-24,1); g.fillCircle(x+4,y-24,1)
    // Smile
    g.fillStyle(0xcc6644,1); g.fillRect(x-3,y-18,6,2)
  }

  _drawDadiGfx(g) {
    g.fillStyle(0xff88ff,0.3); g.fillCircle(0,0,28)
    g.fillStyle(0x9944aa,1); g.fillRect(-11,-13,22,28)
    g.fillStyle(0xffcc88,1); g.fillCircle(0,-22,10)
    g.fillStyle(0xffffff,1); g.fillRect(-12,-28,24,9)
    g.fillStyle(0xffcc88,1); g.fillRect(-15,-11,5,16); g.fillRect(10,-11,5,16)
    g.fillStyle(0x9944aa,1); g.fillRect(-6,15,6,16); g.fillRect(0,15,6,16)
  }

  _drawWorld() {
    const bg=this.add.graphics().setDepth(0)
    bg.fillStyle(0xd4a843,1); bg.fillRect(0,0,1600,1600)
    for(let i=0;i<120;i++){
      bg.fillStyle(i%2===0?0xc49a35:0xe4b853,0.4)
      bg.fillEllipse(Phaser.Math.Between(0,1600),Phaser.Math.Between(0,1600),Phaser.Math.Between(20,80),Phaser.Math.Between(8,25))
    }
    const road=this.add.graphics().setDepth(1)
    road.fillStyle(0xe8c878,0.5)
    road.fillRect(750,0,100,1600); road.fillRect(0,750,1600,100)

    const stalls=this.add.graphics().setDepth(2)
    ;[
      {x:200,y:200,c:0xff4444},{x:500,y:180,c:0x4488ff},
      {x:900,y:180,c:0x44cc44},{x:1200,y:200,c:0xffaa00},
      {x:180,y:500,c:0xaa44ff},{x:180,y:900,c:0xff44aa},
      {x:1400,y:500,c:0x00cccc},{x:1400,y:900,c:0xff8800},
      {x:500,y:1400,c:0x8800ff},{x:900,y:1400,c:0xff0088},
      {x:1200,y:1400,c:0x00ff88}
    ].forEach(s=>{
      stalls.fillStyle(s.c,1); stalls.fillRect(s.x-45,s.y-28,90,55)
      stalls.fillStyle(0x000000,0.2); stalls.fillRect(s.x-45,s.y+22,90,8)
      stalls.fillStyle(s.c,0.5); stalls.fillTriangle(s.x-55,s.y-28,s.x,s.y-56,s.x+55,s.y-28)
      stalls.fillStyle(0xffffff,0.2); stalls.fillRect(s.x-45,s.y-28,90,8)
      stalls.fillStyle(0x000000,0.3); stalls.fillRect(s.x-18,s.y-20,15,28); stalls.fillRect(s.x+4,s.y-20,15,24)
    })

    const trees=this.add.graphics().setDepth(3)
    ;[
      [180,680],[210,720],[195,760],[1380,680],[1410,720],
      [680,180],[720,210],[680,1380],[720,1410]
    ].forEach(([tx,ty])=>{
      trees.fillStyle(0x2288cc,0.7); trees.fillEllipse(tx,ty+15,55,35)
      trees.fillStyle(0x6B4226,1); trees.fillRect(tx-4,ty-10,8,28)
      trees.fillStyle(0x228822,1); trees.fillEllipse(tx,ty-15,38,30)
      trees.fillStyle(0x44aa44,0.7); trees.fillEllipse(tx+8,ty-22,26,20)
    })

    const cows=this.add.graphics().setDepth(3)
    ;[[550,550],[1050,550],[550,1050],[1050,1050]].forEach(([cx,cy])=>{
      cows.fillStyle(0xffffff,1); cows.fillRect(cx-25,cy-12,50,30)
      cows.fillStyle(0xdddddd,1)
      cows.fillRect(cx-18,cy+18,10,16); cows.fillRect(cx-4,cy+18,10,16)
      cows.fillRect(cx+8,cy+18,10,15); cows.fillRect(cx-24,cy+17,10,15)
      cows.fillStyle(0xffffff,1); cows.fillRect(cx-25,cy-26,22,16)
      cows.fillStyle(0xffaaaa,1); cows.fillRect(cx-25,cy-12,9,6)
      cows.fillStyle(0x333333,1); cows.fillCircle(cx-15,cy-23,3)
      cows.fillStyle(0xffd700,0.9); cows.fillRect(cx-13,cy-36,4,12); cows.fillRect(cx-7,cy-36,4,12)
      this.add.text(cx,cy-44,'SACRED COW',{fontSize:'9px',fontFamily:'monospace',color:'#fff',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(4)
    })

    const pal=this.add.graphics().setDepth(2)
    pal.fillStyle(0xf5e6c8,1); pal.fillRect(1260,1260,320,320)
    pal.fillStyle(0xe8d4a0,1)
    pal.fillRect(1260,1260,320,22); pal.fillRect(1260,1260,22,320)
    pal.fillRect(1558,1260,22,320); pal.fillRect(1260,1558,320,22)
    pal.fillStyle(0xd4b870,1)
    pal.fillTriangle(1280,1260,1315,1220,1350,1260)
    pal.fillTriangle(1360,1260,1395,1217,1430,1260)
    pal.fillTriangle(1450,1260,1485,1220,1520,1260)
    pal.fillStyle(0xffd700,0.7); pal.fillRect(1260,1258,320,5)
    pal.fillStyle(0x8B4513,0.6); pal.fillRect(1385,1380,70,200)
    pal.fillStyle(0x4444cc,0.35)
    pal.fillRect(1280,1290,65,85); pal.fillRect(1500,1290,65,85)
  }

  _spawnGuard(x,y,name) {
    const vis=this.add.graphics().setDepth(10)
    vis.fillStyle(0xffcc88,1); vis.fillCircle(0,-22,9)
    vis.fillStyle(0x111111,1); vis.fillRect(-7,-31,14,9)
    vis.fillStyle(0x8B0000,1); vis.fillRect(-10,-14,20,24)
    vis.fillStyle(0xffd700,1); vis.fillRect(-10,-14,20,3); vis.fillRect(-10,-8,20,3); vis.fillRect(-10,-2,20,3)
    vis.fillStyle(0xffcc88,1); vis.fillRect(-14,-12,4,16); vis.fillRect(10,-12,4,16)
    vis.fillStyle(0x8B4513,1); vis.fillRect(-7,10,6,16); vis.fillRect(1,10,6,16)
    vis.fillStyle(0x222222,1); vis.fillRect(-8,24,7,5); vis.fillRect(1,24,7,5)
    vis.setPosition(x,y)

    const s=this.physics.add.sprite(x,y,'px')
    s.setDisplaySize(18,30).setAlpha(0.01)
    s.body.setAllowGravity(false)
    s.body.setCollideWorldBounds(true)
    s.vis=vis
    s.guardName=name
    s.isChasing=false
    s.alertLevel=0
    s.dead=false
    s.patrolAngle=Math.random()*Math.PI*2
    s.patrolCX=x; s.patrolCY=y
    s.label=this.add.text(x,y-38,name,{fontSize:'10px',fontFamily:'monospace',color:'#ff4444',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(11)
    this.guards.add(s)
    return s
  }

  _collectChai(player,h) {
    if (!h.active) return
    if (h.chaiVis) this.tweens.add({targets:h.chaiVis,alpha:0,scaleX:2,scaleY:2,duration:300,onComplete:()=>h.chaiVis.destroy()})
    h.destroy()
    GameState.chai++; GameState.score+=100; GameState.rotis=Math.min(15,GameState.rotis+1)
    this.cameras.main.flash(180,255,215,0)
    this.hud.showNotif('CHAI! '+GameState.chai+'/3  +1 bonus roti!','#ffd700',1500)
    this.hud.update()
    if (GameState.chai>=3) this.time.delayedCall(400,()=>this.hud.showNotif('3 CHAI! Head to PALACE GATE bottom-right!','#00ffcc',4000))
  }

  _collectRoti(player,h) {
    if (!h.active) return
    if (h.rotiVis) this.tweens.add({targets:h.rotiVis,alpha:0,scaleX:1.5,scaleY:1.5,duration:250,onComplete:()=>h.rotiVis.destroy()})
    h.destroy()
    GameState.rotis=Math.min(15,GameState.rotis+2); GameState.score+=30
    this.hud.showNotif('+2 Rotis! Press SPACE to throw!','#ffcc88',1000)
    this.hud.update()
  }

  _throwRoti() {
    if (GameState.rotis<=0) { this.hud.showNotif('NO ROTIS! Walk over spinning brown circles!','#ff4444',2000); return }
    GameState.rotis--
    const px=this.player.x, py=this.player.y
    let angle=this._facingAngle
    let minD=Infinity
    this.guards.getChildren().forEach(g=>{
      if (!g.active||g.dead) return
      const d=Phaser.Math.Distance.Between(px,py,g.x,g.y)
      if (d<minD) { minD=d; angle=Phaser.Math.Angle.Between(px,py,g.x,g.y) }
    })
    const b=this.add.graphics().setDepth(12)
    b.fillStyle(0xD2691E,1); b.fillEllipse(0,0,24,18)
    b.fillStyle(0xC4A35A,1); b.fillEllipse(0,0,18,13)
    b.fillStyle(0xffffff,0.4); b.fillEllipse(-3,-3,8,6)
    this.physics.add.existing(b)
    b.setPosition(px,py)
    b.body.setSize(24,18)
    b.body.setAllowGravity(false)
    b.body.setVelocity(Math.cos(angle)*500,Math.sin(angle)*500)
    this.tweens.add({targets:b,angle:360,duration:280,repeat:-1})
    this.bullets.add(b)
    this.time.delayedCall(2200,()=>{ if(b.active) b.destroy() })
    this.hud.update()
  }

  _rotiHit(bullet,guard) {
    if (!guard.active||guard.dead) return
    bullet.destroy(); guard.dead=true; guard.body.setVelocity(0,0)
    GameState.score+=300
    if (guard.vis) { guard.vis.clear(); guard.vis.fillStyle(0x888888,0.5); guard.vis.fillEllipse(0,5,22,12) }
    const ko=this.add.text(guard.x,guard.y-30,'KO!',{fontSize:'20px',fontFamily:'monospace',color:'#ffff00',stroke:'#000',strokeThickness:4}).setOrigin(0.5).setDepth(20)
    this.tweens.add({targets:ko,y:guard.y-70,alpha:0,duration:1300,onComplete:()=>ko.destroy()})
    this.hud.showNotif(guard.guardName+' knocked out! +300pts','#00ff88',1500)
    if (guard.label) guard.label.setText('x').setColor('#888')
    this.time.delayedCall(1500,()=>{ if(guard.vis?.active) guard.vis.destroy(); if(guard.label?.active) guard.label.destroy(); if(guard.active) guard.destroy() })
    this.hud.update()
  }

  _guardCaught(player,guard) {
    if (this._caught||guard.dead||!guard.isChasing) return
    this._caught=true
    GameState.auntyLevel=Math.min(100,GameState.auntyLevel+20)
    this.cameras.main.shake(250,0.012)
    this.hud.showNotif('CAUGHT by '+guard.guardName+'! Aunty +20%!','#ff3333',2000)
    const angle=Phaser.Math.Angle.Between(guard.x,guard.y,player.x,player.y)
    player.body.setVelocity(Math.cos(angle)*300,Math.sin(angle)*300)
    this.time.delayedCall(700,()=>{ this._caught=false })
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'aunty'})
  }

  _enterPortal() {
    if (this._enteringPortal) return
    if (GameState.chai<3) { this.hud.showNotif('Need 3 CHAI! Have '+GameState.chai+'/3','#ff6666',1500); return }
    this._enteringPortal=true
    this.cameras.main.fadeOut(800,0,0,0)
    this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('PalaceScene'))
  }

  _giveToDadi() {
    if (this._dadiGiven||GameState.rotis<=0) return
    this._dadiGiven=true
    const given=GameState.rotis; GameState.rotis=0
    GameState.score+=given*80; GameState.auntyLevel=Math.max(0,GameState.auntyLevel-35)
    this.cameras.main.flash(300,255,100,255)
    this.hud.showNotif('Dadi got '+given+' rotis! Aunty -35%! +'+given*80+'pts!','#ff88ff',3000)
    this.hud.update()
    this.time.delayedCall(6000,()=>{ this._dadiGiven=false })
  }

  _dadiPops() {
    const msgs=['Dadi: "Beta! Give me rotis!"','Dadi: "Stop running!"','Dadi: "That guard is your cousin!"','Dadi: "Come here baba!"']
    const x=Phaser.Math.Between(400,1200),y=Phaser.Math.Between(400,1200)
    const g=this.add.graphics().setDepth(15)
    this._drawDadiGfx(g); g.setPosition(x,y)
    const b=this.add.text(x,y-42,Phaser.Utils.Array.GetRandom(msgs),{fontSize:'10px',fontFamily:'monospace',color:'#fff',backgroundColor:'#883388',padding:{x:5,y:3}}).setOrigin(0.5).setDepth(16)
    this.tweens.add({targets:[g,b],alpha:0,delay:3500,duration:700,onComplete:()=>{ g.destroy(); b.destroy() }})
  }

  _updateGuards(delta) {
    const px=this.player.x,py=this.player.y,blend=GameState.blendActive
    this.guards.getChildren().forEach(g=>{
      if (!g.active||g.dead) return
      if (g.vis) g.vis.setPosition(g.x,g.y)
      if (g.label) g.label.setPosition(g.x,g.y-38)
      const dist=Phaser.Math.Distance.Between(g.x,g.y,px,py)
      const range=blend?40:170
      if (dist<range&&!blend) {
        g.alertLevel=Math.min(100,g.alertLevel+delta*0.08)
        if (g.alertLevel>55&&!g.isChasing) {
          g.isChasing=true
          GameState.auntyLevel=Math.min(100,GameState.auntyLevel+10)
          this.hud.showNotif(g.guardName+': "AYE RUKO TUM!"','#ff4444',1200)
          if (g.vis) {
            g.vis.clear()
            g.vis.fillStyle(0xffcc88,1); g.vis.fillCircle(0,-22,9)
            g.vis.fillStyle(0x111111,1); g.vis.fillRect(-7,-31,14,9)
            g.vis.fillStyle(0xcc0000,1); g.vis.fillRect(-10,-14,20,24)
            g.vis.fillStyle(0xffd700,1); g.vis.fillRect(-10,-14,20,3); g.vis.fillRect(-10,-8,20,3)
            g.vis.fillStyle(0xffcc88,1); g.vis.fillRect(-14,-12,4,16); g.vis.fillRect(10,-12,4,16)
            g.vis.fillStyle(0x8B4513,1); g.vis.fillRect(-7,10,6,16); g.vis.fillRect(1,10,6,16)
            g.vis.fillStyle(0xff0000,0.4); g.vis.fillCircle(0,-8,22)
          }
        }
      } else {
        g.alertLevel=Math.max(0,g.alertLevel-delta*0.04)
        if (g.alertLevel<=0&&g.isChasing) {
          g.isChasing=false
          if (g.vis) {
            g.vis.clear()
            g.vis.fillStyle(0xffcc88,1); g.vis.fillCircle(0,-22,9)
            g.vis.fillStyle(0x111111,1); g.vis.fillRect(-7,-31,14,9)
            g.vis.fillStyle(0x8B0000,1); g.vis.fillRect(-10,-14,20,24)
            g.vis.fillStyle(0xffd700,1); g.vis.fillRect(-10,-14,20,3); g.vis.fillRect(-10,-8,20,3); g.vis.fillRect(-10,-2,20,3)
            g.vis.fillStyle(0xffcc88,1); g.vis.fillRect(-14,-12,4,16); g.vis.fillRect(10,-12,4,16)
            g.vis.fillStyle(0x8B4513,1); g.vis.fillRect(-7,10,6,16); g.vis.fillRect(1,10,6,16)
          }
        }
      }
      if (g.isChasing) { this.physics.moveToObject(g,this.player,85) }
      else {
        g.patrolAngle+=delta*0.0008
        this.physics.moveTo(g,g.patrolCX+Math.cos(g.patrolAngle)*120,g.patrolCY+Math.sin(g.patrolAngle)*120,35)
      }
    })
  }

  update(time,delta) {
    if (this._caught) return
    const speed=GameState.blendActive?65:160
    let vx=0,vy=0
    if (this.cursors.left.isDown||this.wasd.a.isDown) { vx=-speed; this._facingAngle=Math.PI }
    if (this.cursors.right.isDown||this.wasd.d.isDown) { vx=speed; this._facingAngle=0 }
    if (this.cursors.up.isDown||this.wasd.w.isDown) { vy=-speed; this._facingAngle=-Math.PI/2 }
    if (this.cursors.down.isDown||this.wasd.s.isDown) { vy=speed; this._facingAngle=Math.PI/2 }
    if (vx!==0&&vy!==0) { vx*=0.707; vy*=0.707 }
    this.player.body.setVelocity(vx,vy)
    this._drawPlayer()

    const spaceDown=this.cursors.space.isDown||this.wasd.space.isDown
    if (spaceDown&&!this._spaceDown) this._throwRoti()
    this._spaceDown=spaceDown

    const bDown=this.wasd.b.isDown
    if (bDown&&!this._bDown) {
      GameState.blendActive=!GameState.blendActive
      this.player.setAlpha(GameState.blendActive?0.3:1)
      this.hud.showNotif(GameState.blendActive?'BLEND ON -- invisible to guards for 7s!':'Blend OFF','#aaffaa',1500)
      if (GameState.blendActive) this.time.delayedCall(7000,()=>{ GameState.blendActive=false; this.player.setAlpha(1) })
    }
    this._bDown=bDown

    this._updateGuards(delta)
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'aunty'})
    this.hud.update()
  }
}
