import * as THREE from 'three/webgpu'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { Inputs } from '../../Inputs/Inputs.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'

export class LandingArea extends Area
{
    constructor(model)
    {
        super(model)

        this.localTime = uniform(0)

        this.setLetters()
        this.setKiosk()
        this.setControls()
        this.setBonfire()
        this.setAchievement()
    }

    setLetters()
    {
        // Rebuild the landing name as actual extruded physical letters.
        // Keep upstream's rigid-body/reset/collision machinery and scene placement.
        const references = this.references.items.get('letters')
        const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(references[0].quaternion)
        references.sort((a, b) => a.position.dot(axis) - b.position.dot(axis))
        const center = new THREE.Vector3()
        for(const reference of references) center.add(reference.position)
        center.divideScalar(references.length)
        const material = new MeshDefaultMaterial({ colorNode: color('#eeb868') })
        const paths = {
            S: [[1,1],[0,1],[0,0.43],[0.72,0.43],[0.72,0.22],[0,0.22],[0,0],[1,0],[1,0.65],[0.28,0.65],[0.28,0.78],[1,0.78]],
            E: [[0,0],[1,0],[1,0.22],[0.28,0.22],[0.28,0.42],[0.85,0.42],[0.85,0.64],[0.28,0.64],[0.28,0.78],[1,0.78],[1,1],[0,1]],
            R: [[0,0],[0.28,0],[0.28,0.4],[0.48,0.4],[0.76,0],[1,0],[0.7,0.43],[1,0.43],[1,1],[0,1]],
            K: [[0,0],[0.28,0],[0.28,0.4],[0.7,0],[1,0],[0.49,0.52],[1,1],[0.69,1],[0.28,0.62],[0.28,1],[0,1]],
            O: [[0.15,0],[0.85,0],[1,0.15],[1,0.85],[0.85,1],[0.15,1],[0,0.85],[0,0.15]],
            N: [[0,0],[0.26,0],[0.26,0.62],[0.75,0],[1,0],[1,1],[0.74,1],[0.74,0.38],[0.25,1],[0,1]]
        }
        const makePath = (points, hole = false) =>
        {
            const path = hole ? new THREE.Path() : new THREE.Shape()
            points.forEach(([x, y], i) => i ? path.lineTo(x * 1.25, y * 1.45) : path.moveTo(x * 1.25, y * 1.45))
            path.closePath()
            return path
        }
        const letters = 'SERKON'
        for(let i = 0; i < references.length; i++)
        {
            const reference = references[i]
            const object = reference.userData.object
            const physical = object.physical
            if(i >= letters.length)
            {
                object.visual.object3D.visible = false
                physical.body.setEnabled(false)
                continue
            }
            const letter = letters[i]
            const shape = makePath(paths[letter])
            if(letter === 'O') shape.holes.push(makePath([[0.29,0.24],[0.29,0.76],[0.71,0.76],[0.71,0.24]], true))
            if(letter === 'R') shape.holes.push(makePath([[0.28,0.63],[0.28,0.78],[0.72,0.78],[0.72,0.63]], true))
            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: 0.42, bevelEnabled: true, bevelSegments: 2,
                bevelSize: 0.035, bevelThickness: 0.025, curveSegments: 2, steps: 1
            })
            geometry.translate(-0.625, -0.725, -0.21)
            reference.geometry = geometry
            reference.material = material
            reference.castShadow = true
            reference.receiveShadow = true
            const position = center.clone().addScaledVector(axis, (i - 2.5) * 1.53)
            reference.position.copy(position)
            physical.body.setTranslation(position, false)
            physical.initialState.position = { x: position.x, y: position.y, z: position.z }
            physical.colliders[0].setHalfExtents({ x: 0.66, y: 0.75, z: 0.245 })
            physical.colliders[0].setActiveEvents(this.game.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
            physical.colliders[0].setContactForceEventThreshold(5)
            physical.onCollision = (force, position) =>
            {
                this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
            }
        }
    }

    setKiosk()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('kioskInteractivePoint')[0].position,
            '世界地图',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('map')
                // interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // this.game.map.items.get('map').events.on('close', () =>
        // {
        //     interactivePoint.show()
        // })
    }

    setControls()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('controlsInteractivePoint')[0].position,
            '驾驶指南',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.menu.open('controls')
                interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // Menu instance
        const menuInstance = this.game.menu.items.get('controls')

        menuInstance.events.on('close', () =>
        {
            interactivePoint.show()
        })

        menuInstance.events.on('open', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                menuInstance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                menuInstance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                menuInstance.tabs.goTo('touch')
        })
    }

    setBonfire()
    {
        const position = this.references.items.get('bonfireHashes')[0].position

        // Particles
        let particles = null
        {
            const emissiveMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
    
            const count = 30
            const elevation = uniform(5)
            const positions = new Float32Array(count * 3)
            const scales = new Float32Array(count)
    
    
            for(let i = 0; i < count; i++)
            {
                const i3 = i * 3
    
                const angle = Math.PI * 2 * Math.random()
                const radius = Math.pow(Math.random(), 1.5) * 1
                positions[i3 + 0] = Math.cos(angle) * radius
                positions[i3 + 1] = Math.random()
                positions[i3 + 2] = Math.sin(angle) * radius
    
                scales[i] = 0.02 + Math.random() * 0.06
            }
            
            const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
            const scaleAttribute = instancedArray(scales, 'float').toAttribute()
    
            const material = new THREE.SpriteNodeMaterial()
            material.outputNode = emissiveMaterial.outputNode
    
            const progress = float(0).toVar()
    
            material.positionNode = Fn(() =>
            {
                const newPosition = positionAttribute.toVar()
                progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())
    
                newPosition.y.assign(progress.mul(elevation))
                newPosition.xz.addAssign(this.game.wind.direction.mul(progress))
    
                const progressHide = step(0.8, progress).mul(100)
                newPosition.y.addAssign(progressHide)
                
                return newPosition
            })()
            material.scaleNode = Fn(() =>
            {
                const progressScale = progress.remapClamp(0.5, 1, 1, 0)
                return scaleAttribute.mul(progressScale)
            })()
    
            const geometry = new THREE.CircleGeometry(0.5, 8)
    
            particles = new THREE.Mesh(geometry, material)
            particles.visible = false
            particles.position.copy(position)
            particles.count = count
            this.game.scene.add(particles)
        }

        // Hashes
        {
            const alphaNode = Fn(() =>
            {
                const baseUv = uv(1)
                const distanceToCenter = baseUv.sub(0.5).length()
    
                const voronoi = texture(
                    this.game.noises.voronoi,
                    baseUv
                ).g
    
                voronoi.subAssign(distanceToCenter.remap(0, 0.5, 0.3, 0))
    
                return voronoi
            })()
    
            const material = new MeshDefaultMaterial({
                colorNode: color(0x6F6A87),
                alphaNode: alphaNode,
                hasWater: false,
                hasLightBounce: false
            })
    
            const mesh = this.references.items.get('bonfireHashes')[0]
            mesh.material = material
        }

        // Burn
        const burn = this.references.items.get('bonfireBurn')[0]
        burn.visible = false

        // Interactive point
        this.game.interactivePoints.create(
            this.references.items.get('bonfireInteractivePoint')[0].position,
            'Res(e)t',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.reset()

                gsap.delayedCall(2, () =>
                {
                    // Bonfire
                    particles.visible = true
                    burn.visible = true
                    this.game.ticker.wait(2, () =>
                    {
                        particles.geometry.boundingSphere.center.y = 2
                        particles.geometry.boundingSphere.radius = 2
                    })

                    // Sound
                    this.game.audio.groups.get('campfire').items[0].positions.push(position)
                })
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'landing')
        })
        this.events.on('boundingOut', () =>
        {
            this.game.achievements.setProgress('landingLeave', 1)
        })
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}