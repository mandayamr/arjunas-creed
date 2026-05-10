import { n as __toESM, t as require_phaser } from "./phaser-D_P5b8Tq.js";
//#region ../../../usr/local/nvm/versions/node/v24.15.0/lib/node_modules/@tialops/maki/src/MakiPlayer.js
var import_phaser = /* @__PURE__ */ __toESM(require_phaser(), 1);
var MakiPlayer = class {
	constructor(scene, name = "lia") {
		this.scene = scene;
		this.name = name;
		this.sprite = null;
		this.keys = null;
		this.speed = 160;
	}
	preload(config) {
		this.config = config;
		const { sprite } = config;
		if (!this.scene.textures.exists(this.name)) this.scene.load.spritesheet(this.name, `sprites/${sprite.file}`, {
			frameWidth: sprite.frameWidth,
			frameHeight: sprite.frameHeight
		});
	}
	init() {
		const { sprite } = this.config;
		Object.keys(sprite.directions).forEach((dir) => {
			const { start, end } = sprite.directions[dir];
			const animKey = `${this.name}-${dir}`;
			if (!this.scene.anims.exists(animKey)) this.scene.anims.create({
				key: animKey,
				frames: this.scene.anims.generateFrameNumbers(this.name, {
					start,
					end
				}),
				frameRate: 8,
				repeat: -1
			});
		});
		this.sprite = this.scene.physics.add.sprite(this.scene.scale.width / 2, this.scene.scale.height / 2, this.name);
		this.sprite.setDepth(1);
		this.keys = this.scene.input.keyboard.createCursorKeys();
	}
	move() {
		if (!this.sprite) return;
		this.sprite.setVelocity(0);
		if (this.keys.left.isDown) {
			this.sprite.setVelocityX(-this.speed);
			this.sprite.anims.play(`${this.name}-left`, true);
		} else if (this.keys.right.isDown) {
			this.sprite.setVelocityX(this.speed);
			this.sprite.anims.play(`${this.name}-right`, true);
		} else if (this.keys.up.isDown) {
			this.sprite.setVelocityY(-this.speed);
			this.sprite.anims.play(`${this.name}-up`, true);
		} else if (this.keys.down.isDown) {
			this.sprite.setVelocityY(this.speed);
			this.sprite.anims.play(`${this.name}-down`, true);
		} else this.sprite.anims.stop();
	}
	onCollide(other) {}
	onOverlap(other) {}
};
//#endregion
//#region ../../../usr/local/nvm/versions/node/v24.15.0/lib/node_modules/@tialops/maki/lib/manager.js
var _sceneMaps = /* @__PURE__ */ new Map();
var _wallGroups = /* @__PURE__ */ new Map();
function getMapsForScene(scene) {
	const key = scene.sys.settings.key;
	if (!_sceneMaps.has(key)) _sceneMaps.set(key, /* @__PURE__ */ new Set());
	return _sceneMaps.get(key);
}
var manager = {
	map(scene, mapName) {
		getMapsForScene(scene).add(mapName);
	},
	preload(scene) {
		for (const mapName of getMapsForScene(scene)) {
			scene.load.json(mapName, `maps/${mapName}.json`);
			scene.load.once(`filecomplete-json-${mapName}`, () => {
				const mapData = scene.cache.json.get(mapName);
				const tilesetUrl = mapData.tileset.replace(/^assets\//, "");
				scene.load.spritesheet(`${mapName}_tileset`, tilesetUrl, {
					frameWidth: mapData.tileSize,
					frameHeight: mapData.tileSize
				});
				const furniture = mapData.layers?.furniture ?? [];
				const seen = /* @__PURE__ */ new Set();
				furniture.forEach(({ src }) => {
					if (seen.has(src)) return;
					seen.add(src);
					const key = `${mapName}_furniture_${src}`;
					if (!scene.textures.exists(key)) scene.load.image(key, src.replace(/^assets\//, ""));
				});
			});
		}
	},
	create(scene) {
		for (const mapName of getMapsForScene(scene)) {
			const { tileSize, layers, collisions } = scene.cache.json.get(mapName);
			const tilesetKey = `${mapName}_tileset`;
			(layers.floor ?? layers.wall ?? []).forEach((row, rowIndex) => {
				row.forEach((tileId, colIndex) => {
					if (tileId !== 0) scene.add.image(colIndex * tileSize, rowIndex * tileSize, tilesetKey, tileId - 1).setOrigin(0, 0).setDepth(0);
				});
			});
			(layers.furniture ?? []).forEach(({ src, x, y, w, h }) => {
				const key = `${mapName}_furniture_${src}`;
				if (scene.textures.exists(key)) scene.add.image(x + w / 2, y + h / 2, key).setOrigin(.5, .5).setDepth(1);
			});
			const wallGroup = scene.physics.add.staticGroup();
			(collisions ?? []).forEach(({ x, y, w, h }) => {
				const rect = scene.add.rectangle(x + w / 2, y + h / 2, w, h);
				scene.physics.add.existing(rect, true);
				wallGroup.add(rect);
			});
			_wallGroups.set(`${scene.sys.settings.key}:${mapName}`, wallGroup);
		}
	},
	getWallGroup(scene, mapName) {
		return _wallGroups.get(`${scene.sys.settings.key}:${mapName}`);
	}
};
//#endregion
//#region ../../../usr/local/nvm/versions/node/v24.15.0/lib/node_modules/@tialops/maki/index.js
var Scene = class extends import_phaser.default.Scene {
	constructor(config) {
		super(config);
		this._makiPlayers = [];
	}
	preload() {
		this.maki = {
			player: (name = "lia") => {
				const p = new MakiPlayer(this, name);
				p.preload(this._getConfig());
				this._makiPlayers.push(p);
				return p;
			},
			move: (player) => {
				player.move();
			}
		};
	}
	create() {
		this._makiPlayers.forEach((p) => p.init());
	}
	_getConfig() {
		return { sprite: {
			file: "lia.png",
			layout: "row",
			cols: 24,
			rows: 1,
			frameWidth: 32,
			frameHeight: 64,
			directions: {
				right: {
					start: 0,
					end: 5
				},
				up: {
					start: 6,
					end: 11
				},
				left: {
					start: 12,
					end: 17
				},
				down: {
					start: 18,
					end: 23
				}
			}
		} };
	}
};
//#endregion
export { MakiPlayer, Scene, manager };

//# sourceMappingURL=@tialops_maki.js.map