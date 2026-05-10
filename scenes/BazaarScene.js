import { GameState, HUD } from './GameState.js'

export default class BazaarScene extends Phaser.Scene {
  constructor() { super('BazaarScene') }

  create() {
    const W = 1600, H = 1600
    this.physics.world.setBounds(0, 0, W, H)
    this.cameras.main.setBounds(0, 0, W, H)

    this._drawWorld(W, H)

    // Player
    this.player = this.add.rectangle(800, 800, 18, 24, 0xffbb88)
    this.physics.add.existing(this.player)
    this.player.body.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.player.body.setCollideWorldBounds(true)

    // Player head
    this.playerHead = this.add.graphics().setDepth(11)
    this._drawPlayer()

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.8)

    // Guards
    this.guards = this.physics.add.group()
    const spots = [
      [400,400,'Sharma'],[1200,400,'Dubey'],[400,1200,'Pandey'],
      [1200,1200,'Verma'],[800,300,'Raju'],[300,800,'Mohan'],
      [1300,800,'Gopal'],[800,1300,'Singh']
    ]
    spots.forEach(([x,y,n]) => this._spawnGuard(x,y,n))

    // Chai collectibles
    this.chais = this.physics.add.staticGroup()
    const chaiSpots = [
      [300,300],[1300,300],[300,1300],[1300,1300],
      [800,400],[400,800],[1200,800],[800,1200],
      [600,600],[1000,600],[600,1000],[1000,1000],
      [200,600],[1400,600],[600,200],[1000,200]
    ]
    chaiSpots.forEach(([x,y]) => {
      const c = this.add.graphics().setDepth(6)
      c.fillStyle(0x8B4513,1); c.fillRect(-9,-7,18,16)
      c.fillStyle(0xD2691E,1); c.fillRect(-7,-11,14,6)
      c.fillStyle(0xc8520a,1); c.fillRect(8,-4,5,6)
      c.fillStyle(0xffdd88,1); c.fillEllipse(0,-2,13,9)
      c.fillStyle(0xff9900,0.9); c.fillEllipse(0,-2,8,5)
      c.setPosition(x,y)
      this.tweens.add({targets:c, y:y-10, duration:900, yoyo:true, repeat:-1, ease:'Sine.easeInOut'})
      this.add.text(x,y-24,'CHAI',{fontSize:'9px',fontFamily:'monospace',color:'#ffd700',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7)
      const h = this.add.rectangle(x,y,30,30,0,0)
      this.physics.add.existing(h,true)
      h.chaiVis = c
      this.chais.add(h)
    })

    // Roti pickups
    this.rotis = this.physics.add.staticGroup()
    const rotiSpots = [
      [500,300],[1100,300],[300,500],[1300,500],
      [500,1100],[1100,1100],[300,1100],[1300,1100],
      [700,700],[900,700],[700,900],[900,900],
      [400,400],[1200,400],[400,1200],[1200,1200],
      [600,400],[1000,400]
    ]
    rotiSpots.forEach(([x,y]) => {
      const r = this.add.graphics().setDepth(6)
      r.fillStyle(0xD2691E,1); r.fillEllipse(0,0,26,19)
      r.fillStyle(0xC4A35A,1); r.fillEllipse(0,0,19,14)
      r.fillStyle(0xD2691E,0.6); r.fillEllipse(-4,-2,10,7)
      r.fillStyle(0xffffff,0.35); r.fillEllipse(-2,-4,6,5)
      r.setPosition(x,y)
      this.tweens.add({targets:r, angle:360, duration:1800, repeat:-1})
      this.add.text(x,y-20,'ROTI',{fontSize:'9px',fontFamily:'monospace',color:'#ffaa00',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(7)
      const h = this.add.rectangle(x,y,30,30,0,0)
      this.physics.add.existing(h,true)
      h.rotiVis = r
      this.rotis.add(h)
    })

    // Portal
    this.portalVis = this.add.graphics().setDepth(8)
    this.portalVis.fillStyle(0x00ffff,0.9); this.portalVis.fillRect(-22,-22,44,44)
    this.portalVis.fillStyle(0xffd700,1); this.portalVis.fillRect(-22,-22,44,7)
    this.portalVis.fillStyle(0xffd700,1); this.portalVis.fillRect(-22,15,44,7)
    this.portalVis.setPosition(1450,1450)
    this.tweens.add({targets:this.portalVis, alpha:{from:0.5,to:1}, duration:600, yoyo:true, repeat:-1})
    this.add.text(1450,1420,'PALACE\nGATE',{fontSize:'10px',fontFamily:'monospace',color:'#00ffff',stroke:'#000',strokeThickness:2,align:'center'}).setOrigin(0.5).setDepth(9)
    this.portal = this.add.rectangle(1450,1450,50,50,0,0)
    this.physics.add.existing(this.portal,true)

    // Dadi
    this.dadiVis = this.add.graphics().setDepth(8)
    this._drawDadiGraphic(this.dadiVis)
    this.dadiVis.setPosition(800,700)
    this.add.text(800,668,'DADI -- give rotis!',{fontSize:'9px',fontFamily:'monospace',color:'#ff88ff',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(9)
    this.dadi = this.add.rectangle(800,700,40,40,0,0)
    this.physics.add.existing(this.dadi,true)

    // Bullets
    this.bullets = this.physics.add.group()

    // Overlaps
    this.physics.add.overlap(this.player, this.chais, this._collectChai, null, this)
    this.physics.add.overlap(this.player, this.rotis, this._collectRoti, null, this)
    this.physics.add.overlap(this.player, this.portal, this._enterPortal, null, this)
    this.physics.add.overlap(this.player, this.dadi, this._giveToDadi, null, this)
    this.physics.add.overlap(this.bullets, this.guards, this._rotiHit, null, this)
    this.physics.add.overlap(this.player, this.guards, this._guardCaught, null, this)

    // HUD
    this.hud = new HUD(this)
    GameState.level = 1
    this._caught = false
    this._dadiGiven = false
    this._spaceDown = false
    this._bDown = false
    this._facingAngle = 0

    // Keys
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      b: Phaser.Input.Keyboard.KeyCodes.B
    })

    this.time.addEvent({delay:2000, callback:()=>{ GameState.auntyLevel = Math.max(0,GameState.auntyLevel-2) }, loop:true})
    this.time.addEvent({delay:8000, callback:this._dadiPops, callbackScope:this, loop:true})

    const {width} = this.scale
    this.add.text(width/2,65,'WASD/Arrows=Move  SPACE=Throw Roti  B=Blend (invisible)',{
      fontSize:'11px',fontFamily:'monospace',color:'#ffd700',stroke:'#000',strokeThickness:3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(220)

    this.hud.showNotif('Walk over CHAI cups and spinning ROTIS to collect! SPACE to throw!','#ffd700',5000)
    this.cameras.main.fadeIn(600)
  }

  _drawPlayer() {
    this.playerHead.clear()
    const x = this.player.x
    const y = this.player.y
    // Body (rectangle handles this via tint)
    // Head
    this.playerHead.fillStyle(0xffcc88,1)
    this.playerHead.fillCircle(x, y-20, 9)
    // Hair (dark)
    this.playerHead.fillStyle(0x222222,1)
    this.playerHead.fillRect(x-9, y-29, 18, 8)
    // Eyes
    this.playerHead.fillStyle(0x000000,1)
    this.playerHead.fillCircle(x-3, y-21, 2)
    this.playerHead.fillCircle(x+3, y-21, 2)
    // Arms
    this.playerHead.fillStyle(0xffcc88,1)
    this.playerHead.fillRect(x-18, y-14, 5, 16)
    this.playerHead.fillRect(x+13, y-14, 5, 16)
    // Legs
    this.playerHead.fillStyle(0x4444cc,1)
    this.playerHead.fillRect(x-8, y+4, 7, 16)
    this.playerHead.fillRect(x+1, y+4, 7, 16)
    // Vest
    this.playerHead.fillStyle(0xff6600,0.6)
    this.playerHead.fillRect(x-9, y-14, 18, 18)
    // Belt
    this.playerHead.fillStyle(0xffd700,1)
    this.playerHead.fillRect(x-9, y-2, 18, 3)
  }

  _drawWorld(W, H) {
    // Sand base
    const bg = this.add.graphics().setDepth(0)
    bg.fillStyle(0xd4a843,1)
    bg.fillRect(0,0,W,H)

    // Sand dunes
    for (let i=0;i<120;i++) {
      bg.fillStyle(i%2===0?0xc49a35:0xe4b853,0.4)
      bg.fillEllipse(Phaser.Math.Between(0,W),Phaser.Math.Between(0,H),Phaser.Math.Between(20,80),Phaser.Math.Between(8,25))
    }

    // Roads
    const road = this.add.graphics().setDepth(1)
    road.fillStyle(0xe8c878,0.55)
    road.fillRect(W/2-50,0,100,H)
    road.fillRect(0,H/2-50,W,100)

    // Market stalls
    const stalls = this.add.graphics().setDepth(2)
    const stallData = [
      {x:200,y:200,c:0xff4444},{x:500,y:180,c:0x4488ff},
      {x:900,y:180,c:0x44cc44},{x:1200,y:200,c:0xffaa00},
      {x:180,y:500,c:0xaa44ff},{x:180,y:900,c:0xff44aa},
      {x:1400,y:500,c:0x00cccc},{x:1400,y:900,c:0xff8800},
      {x:500,y:1400,c:0x8800ff},{x:900,y:1400,c:0xff0088},
      {x:1200,y:1400,c:0x00ff88},{x:700,y:700,c:0xffcc00},
    ]
    stallData.forEach(s=>{
      stalls.fillStyle(s.c,1); stalls.fillRect(s.x-45,s.y-28,90,55)
      stalls.fillStyle(0x000000,0.2); stalls.fillRect(s.x-45,s.y+22,90,8)
      stalls.fillStyle(s.c,0.5); stalls.fillTriangle(s.x-55,s.y-28,s.x,s.y-56,s.x+55,s.y-28)
      stalls.fillStyle(0xffffff,0.2); stalls.fillRect(s.x-45,s.y-28,90,8)
      stalls.fillStyle(0x000000,0.3)
      stalls.fillRect(s.x-18,s.y-20,15,28)
      stalls.fillRect(s.x+4,s.y-20,15,24)
    })

    // Palm trees / oasis
    const trees = this.add.graphics().setDepth(3)
    const treeSpots = [
      [180,680],[210,720],[195,760],
      [1380,680],[1410,720],[1395,760],
      [680,180],[720,210],[700,160],
      [680,1380],[720,1410],[700,1360],
    ]
    treeSpots.forEach(([tx,ty])=>{
      trees.fillStyle(0x2288cc,0.7); trees.fillEllipse(tx,ty+15,55,35)
      trees.fillStyle(0x6B4226,1); trees.fillRect(tx-4,ty-10,8,28)
      trees.fillStyle(0x228822,1); trees.fillEllipse(tx,ty-15,38,30)
      trees.fillStyle(0x44aa44,0.7); trees.fillEllipse(tx+8,ty-22,26,20)
      trees.fillStyle(0x33cc33,0.5); trees.fillEllipse(tx-6,ty-20,20,16)
    })

    // Sacred cows
    const cows = this.add.graphics().setDepth(3)
    const cowSpots = [[550,550],[1050,550],[550,1050],[1050,1050]]
    cowSpots.forEach(([cx,cy])=>{
      cows.fillStyle(0xffffff,1); cows.fillRect(cx-25,cy-12,50,30)
      cows.fillStyle(0xdddddd,1)
      cows.fillRect(cx-18,cy+18,10,16); cows.fillRect(cx-4,cy+18,10,16)
      cows.fillRect(cx+8,cy+18,10,15); cows.fillRect(cx-24,cy+17,10,15)
      cows.fillStyle(0xffffff,1); cows.fillRect(cx-25,cy-26,22,16)
      cows.fillStyle(0xffaaaa,1); cows.fillRect(cx-25,cy-12,9,6)
      cows.fillStyle(0x333333,1); cows.fillCircle(cx-15,cy-23,3)
      cows.fillStyle(0xffd700,0.9); cows.fillRect(cx-13,cy-36,4,12); cows.fillRect(cx-7,cy-36,4,12)
      cows.fillStyle(0xff8888,0.4); cows.fillEllipse(cx+8,cy+8,18,12)
      this.add.text(cx,cy-44,'SACRED COW',{fontSize:'9px',fontFamily:'monospace',color:'#fff',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(4)
    })

    // Palace in corner
    const pal = this.add.graphics().setDepth(2)
    pal.fillStyle(0xf5e6c8,1); pal.fillRect(1250,1250,340,340)
    pal.fillStyle(0xe8d4a0,1)
    pal.fillRect(1250,1250,340,25); pal.fillRect(1250,1250,25,340)
    pal.fillRect(1565,1250,25,340); pal.fillRect(1250,1565,340,25)
    pal.fillStyle(0xd4b870,1)
    pal.fillTriangle(1280,1250,1315,1210,1350,1250)
    pal.fillTriangle(1360,1250,1395,1207,1430,1250)
    pal.fillTriangle(1440,1250,1475,1210,1510,1250)
    pal.fillStyle(0xffd700,0.7); pal.fillRect(1250,1248,340,5)
    pal.fillStyle(0x8B4513,0.6); pal.fillRect(1380,1380,80,210)
    pal.fillStyle(0x4444cc,0.35)
    pal.fillRect(1270,1290,70,90); pal.fillRect(1500,1290,70,90)
    pal.fillStyle(0xffd700,0.4)
    pal.fillRect(1268,1288,74,94); pal.strokeRect(1268,1288,74,94)

    // Well
    const well = this.add.graphics().setDepth(3)
    well.fillStyle(0x999999,1); well.fillEllipse(1000,400,55,38)
    well.fillStyle(0x777777,1); well.fillRect(973,400,54,28)
    well.fillStyle(0x555555,1); well.fillEllipse(1000,428,52,26)
    well.fillStyle(0x8B4513,1)
    well.fillRect(969,392,6,34); well.fillRect(1025,392,6,34); well.fillRect(969,392,62,6)
  }

  _spawnGuard(x, y, name) {
    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0xffcc88,1); g.fillCircle(0,-22,9)
    g.fillStyle(0x111111,1); g.fillRect(-7,-31,14,9)
    g.fillStyle(0x8B0000,1); g.fillRect(-10,-14,20,24)
    g.fillStyle(0xffd700,1); g.fillRect(-10,-14,20,3); g.fillRect(-10,-8,20,3); g.fillRect(-10,-2,20,3)
    g.fillStyle(0xffcc88,1); g.fillRect(-14,-12,4,16); g.fillRect(10,-12,4,16)
    g.fillStyle(0x8B4513,1); g.fillRect(-7,10,6,16); g.fillRect(1,10,6,16)
    g.fillStyle(0x222222,1); g.fillRect(-8,24,7,5); g.fillRect(1,24,7,5)
    g.setPosition(x,y)

    const body = this.add.rectangle(x,y,18,30,0x000000,0)
    this.physics.add.existing(body)
    body.body.setAllowGravity(false)
    body.body.setCollideWorldBounds(true)
    body.vis = g
    body.guardName = name
    body.isChasing = false
    body.alertLevel = 0
    body.dead = false
    body.patrolAngle = Math.random()*Math.PI*2
    body.patrolCenterX = x
    body.patrolCenterY = y

    body.label = this.add.text(x,y-38,name,{
      fontSize:'10px',fontFamily:'monospace',color:'#ff4444',stroke:'#000',strokeThickness:2
    }).setOrigin(0.5).setDepth(11)

    this.guards.add(body)
    return body
  }

  _drawDadiGraphic(g) {
    g.clear()
    g.fillStyle(0xff88ff,0.3); g.fillCircle(0,0,26)
    g.fillStyle(0x9944aa,1); g.fillRect(-11,-13,22,28)
    g.fillStyle(0xffcc88,1); g.fillCircle(0,-22,10)
    g.fillStyle(0xffffff,1); g.fillRect(-12,-28,24,9)
    g.fillStyle(0xffcc88,1); g.fillRect(-15,-11,5,16); g.fillRect(10,-11,5,16)
    g.fillStyle(0x9944aa,1); g.fillRect(-6,15,6,16); g.fillRect(0,15,6,16)
  }

  _collectChai(player, hitbox) {
    if (!hitbox.active) return
    if (hitbox.chaiVis) {
      this.tweens.add({targets:hitbox.chaiVis, alpha:0, scaleX:2, scaleY:2, duration:300, onComplete:()=>hitbox.chaiVis.destroy()})
    }
    hitbox.destroy()
    GameState.chai++
    GameState.score += 100
    GameState.rotis = Math.min(15, GameState.rotis+1)
    this.cameras.main.flash(180,255,215,0)
    this.hud.showNotif('CHAI! '+GameState.chai+'/3  +1 bonus roti!','#ffd700',1500)
    this.hud.update()
    if (GameState.chai>=3) this.time.delayedCall(400,()=>this.hud.showNotif('3 CHAI! Go to PALACE GATE (bottom-right corner)!','#00ffcc',4000))
  }

  _collectRoti(player, hitbox) {
    if (!hitbox.active) return
    if (hitbox.rotiVis) {
      this.tweens.add({targets:hitbox.rotiVis, alpha:0, scaleX:1.5, scaleY:1.5, duration:250, onComplete:()=>hitbox.rotiVis.destroy()})
    }
    hitbox.destroy()
    GameState.rotis = Math.min(15, GameState.rotis+2)
    GameState.score += 30
    this.hud.showNotif('+2 Rotis! SPACE to throw!','#ffcc88',1000)
    this.hud.update()
  }

  _throwRoti() {
    if (GameState.rotis<=0) {
      this.hud.showNotif('NO ROTIS! Walk over spinning brown circles!','#ff4444',2000)
      return
    }
    GameState.rotis--

    const px = this.player.x
    const py = this.player.y

    // Find nearest guard
    let nearest = null, minD = Infinity
    this.guards.getChildren().forEach(g=>{
      if (!g.active||g.dead) return
      const d = Phaser.Math.Distance.Between(px,py,g.x,g.y)
      if (d<minD) { minD=d; nearest=g }
    })

    let angle = this._facingAngle
    if (nearest) angle = Phaser.Math.Angle.Between(px,py,nearest.x,nearest.y)

    const bullet = this.add.graphics().setDepth(12)
    bullet.fillStyle(0xD2691E,1); bullet.fillEllipse(0,0,24,18)
    bullet.fillStyle(0xC4A35A,1); bullet.fillEllipse(0,0,18,13)
    bullet.fillStyle(0xffffff,0.4); bullet.fillEllipse(-3,-3,8,6)
    this.physics.add.existing(bullet)
    bullet.setPosition(px,py)
    bullet.body.setSize(24,18)
    const spd = 500
    bullet.body.setVelocity(Math.cos(angle)*spd, Math.sin(angle)*spd)
    bullet.body.setAllowGravity(false)
    this.tweens.add({targets:bullet, angle:360, duration:280, repeat:-1})
    this.bullets.add(bullet)
    this.time.delayedCall(2200,()=>{ if(bullet.active) bullet.destroy() })
    this.hud.update()
  }

  _rotiHit(bullet, guard) {
    if (!guard.active||guard.dead) return
    bullet.destroy()
    guard.dead = true
    guard.body.setVelocity(0,0)
    GameState.score += 300

    if (guard.vis) {
      guard.vis.clear()
      guard.vis.fillStyle(0x888888,0.5); guard.vis.fillEllipse(0,5,22,12)
      guard.vis.fillStyle(0xffcc88,0.4); guard.vis.fillCircle(0,-5,8)
    }

    const ko = this.add.text(guard.x,guard.y-30,'KO!',{
      fontSize:'20px',fontFamily:'monospace',color:'#ffff00',stroke:'#000',strokeThickness:4
    }).setOrigin(0.5).setDepth(20)
    this.tweens.add({targets:ko, y:guard.y-70, alpha:0, duration:1300, onComplete:()=>ko.destroy()})
    this.hud.showNotif(guard.guardName+' knocked out! +300pts','#00ff88',1500)
    if (guard.label) { guard.label.setText('x').setColor('#888') }

    this.time.delayedCall(1500,()=>{
      if (guard.vis?.active) guard.vis.destroy()
      if (guard.label?.active) guard.label.destroy()
      if (guard.active) guard.destroy()
    })
    this.hud.update()
  }

  _guardCaught(player, guard) {
    if (this._caught||guard.dead||!guard.isChasing) return
    this._caught = true
    GameState.auntyLevel = Math.min(100,GameState.auntyLevel+20)
    this.cameras.main.shake(250,0.012)
    this.hud.showNotif('CAUGHT by '+guard.guardName+'! Aunty +20%!','#ff3333',2000)
    const angle = Phaser.Math.Angle.Between(guard.x,guard.y,player.x,player.y)
    player.body.setVelocity(Math.cos(angle)*300,Math.sin(angle)*300)
    this.time.delayedCall(700,()=>{ this._caught=false })
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'aunty'})
  }

  _enterPortal() {
    if (this._enteringPortal) return
    if (GameState.chai<3) {
      this.hud.showNotif('Need 3 CHAI! You have '+GameState.chai+'/3','#ff6666',1500)
      return
    }
    this._enteringPortal = true
    this.cameras.main.fadeOut(800,0,0,0)
    this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('PalaceScene'))
  }

  _giveToDadi() {
    if (this._dadiGiven||GameState.rotis<=0) return
    this._dadiGiven = true
    const given = GameState.rotis
    GameState.rotis = 0
    GameState.score += given*80
    GameState.auntyLevel = Math.max(0,GameState.auntyLevel-35)
    this.cameras.main.flash(300,255,100,255)
    this.hud.showNotif('Dadi got '+given+' rotis! Aunty -35%! +'+given*80+'pts!','#ff88ff',3000)
    this.hud.update()
    this.time.delayedCall(6000,()=>{ this._dadiGiven=false })
  }

  _dadiPops() {
    const msgs = ['Dadi: "Beta! Give me rotis!"','Dadi: "Stop running!"','Dadi: "That guard is your cousin!"','Dadi: "Come here baba!"']
    const x = Phaser.Math.Between(400,1200), y = Phaser.Math.Between(400,1200)
    const g = this.add.graphics().setDepth(15)
    this._drawDadiGraphic(g); g.setPosition(x,y)
    const b = this.add.text(x,y-42,Phaser.Utils.Array.GetRandom(msgs),{fontSize:'10px',fontFamily:'monospace',color:'#fff',backgroundColor:'#883388',padding:{x:5,y:3}}).setOrigin(0.5).setDepth(16)
    this.tweens.add({targets:[g,b], alpha:0, delay:3500, duration:700, onComplete:()=>{ g.destroy(); b.destroy() }})
  }

  _updateGuards(delta) {
    const px = this.player.x, py = this.player.y
    const blend = GameState.blendActive
    this.guards.getChildren().forEach(g=>{
      if (!g.active||g.dead) return
      if (g.vis) g.vis.setPosition(g.x,g.y)
      if (g.label) g.label.setPosition(g.x,g.y-38)

      const dist = Phaser.Math.Distance.Between(g.x,g.y,px,py)
      const range = blend ? 40 : 170

      if (dist<range&&!blend) {
        g.alertLevel = Math.min(100,g.alertLevel+delta*0.08)
        if (g.alertLevel>55&&!g.isChasing) {
          g.isChasing = true
          GameState.auntyLevel = Math.min(100,GameState.auntyLevel+10)
          this.hud.showNotif(g.guardName+': "AYE RUKO TUM!"','#ff4444',1200)
          if (g.vis) {
            g.vis.clear()
            g.vis.fillStyle(0xffcc88,1); g.vis.fillCircle(0,-22,9)
            g.vis.fillStyle(0x111111,1); g.vis.fillRect(-7,-31,14,9)
            g.vis.fillStyle(0xcc0000,1); g.vis.fillRect(-10,-14,20,24)
            g.vis.fillStyle(0xffd700,1); g.vis.fillRect(-10,-14,20,3); g.vis.fillRect(-10,-8,20,3)
            g.vis.fillStyle(0xffcc88,1); g.vis.fillRect(-14,-12,4,16); g.vis.fillRect(10,-12,4,16)
            g.vis.fillStyle(0x8B4513,1); g.vis.fillRect(-7,10,6,16); g.vis.fillRect(1,10,6,16)
            g.vis.fillStyle(0xff0000,0.4); g.vis.fillCircle(0,-8,20)
          }
        }
      } else {
        g.alertLevel = Math.max(0,g.alertLevel-delta*0.04)
        if (g.alertLevel<=0&&g.isChasing) {
          g.isChasing = false
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

      if (g.isChasing) {
        this.physics.moveToObject(g,this.player,85)
      } else {
        g.patrolAngle += delta*0.0008
        const tx = g.patrolCenterX+Math.cos(g.patrolAngle)*120
        const ty = g.patrolCenterY+Math.sin(g.patrolAngle)*120
        this.physics.moveTo(g,tx,ty,35)
      }
    })
  }

  update(time, delta) {
    if (this._caught) return

    const speed = GameState.blendActive ? 65 : 160
    let vx=0, vy=0

    if (this.cursors.left.isDown||this.wasd.a.isDown) { vx=-speed; this._facingAngle=Math.PI }
    if (this.cursors.right.isDown||this.wasd.d.isDown) { vx=speed; this._facingAngle=0 }
    if (this.cursors.up.isDown||this.wasd.w.isDown) { vy=-speed; this._facingAngle=-Math.PI/2 }
    if (this.cursors.down.isDown||this.wasd.s.isDown) { vy=speed; this._facingAngle=Math.PI/2 }
    if (vx!==0&&vy!==0) { vx*=0.707; vy*=0.707 }

    this.player.body.setVelocity(vx,vy)
    this._drawPlayer()

    // Space to throw
    const spaceDown = this.cursors.space.isDown||this.wasd.space.isDown
    if (spaceDown&&!this._spaceDown) this._throwRoti()
    this._spaceDown = spaceDown

    const bDown = this.wasd.b.isDown
    if (bDown&&!this._bDown) {
      GameState.blendActive = !GameState.blendActive
      this.player.setAlpha(GameState.blendActive?0.3:1)
      this.hud.showNotif(GameState.blendActive?'BLEND ON -- invisible!':'Blend OFF','#aaffaa',1500)
      if (GameState.blendActive) this.time.delayedCall(7000,()=>{ GameState.blendActive=false; this.player.setAlpha(1) })
    }
    this._bDown = bDown

    this._updateGuards(delta)
    if (GameState.auntyLevel>=100) this.scene.start('GameOverScene',{reason:'aunty'})
    // Distance-based portal check as backup
    const distPortal = Phaser.Math.Distance.Between(this.player.x,this.player.y,1450,1450)
    if (distPortal<60) this._enterPortal()
    this.hud.update()
  }
}
