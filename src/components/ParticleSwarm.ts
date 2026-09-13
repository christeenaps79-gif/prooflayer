import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export class ParticlesSwarm {
    private container: HTMLElement;
    private count: number;

    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;

    private geometry: THREE.TetrahedronGeometry;
    private material: THREE.MeshBasicMaterial;
    private mesh: THREE.InstancedMesh;

    private dummy: THREE.Object3D;
    private positions: THREE.Vector3[];
    private target: THREE.Vector3;
    private particleColor: THREE.Color;
    private clock: THREE.Clock;

    private animationFrame = 0;

    constructor(
        container: HTMLElement,
        count = 12000
    ) {
        this.container = container;
        this.count = count;

        // --------------------------------
        // SCENE
        // --------------------------------

        this.scene = new THREE.Scene();

        this.scene.fog = new THREE.FogExp2(
            0x080b0d,
            0.009
        );

        // --------------------------------
        // CAMERA
        // --------------------------------

        this.camera =
            new THREE.PerspectiveCamera(
                60,
                window.innerWidth /
                window.innerHeight,
                0.1,
                2000
            );

        this.camera.position.set(
            0,
            0,
            100
        );

        // --------------------------------
        // RENDERER
        // --------------------------------

        this.renderer =
            new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference:
                    "high-performance",
            });

        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                1.5
            )
        );

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        this.renderer.setClearColor(
            0x080b0d,
            1
        );

        this.container.appendChild(
            this.renderer.domElement
        );

        // --------------------------------
        // POST PROCESSING
        // --------------------------------

        this.composer =
            new EffectComposer(
                this.renderer
            );

        const renderPass =
            new RenderPass(
                this.scene,
                this.camera
            );

        this.composer.addPass(
            renderPass
        );

        const bloomPass =
            new UnrealBloomPass(
                new THREE.Vector2(
                    window.innerWidth,
                    window.innerHeight
                ),
                0.8,
                0.3,
                0.2
            );

        this.composer.addPass(
            bloomPass
        );

        // --------------------------------
        // PARTICLE GEOMETRY
        // --------------------------------

        this.geometry =
            new THREE.TetrahedronGeometry(
                0.18
            );

        this.material =
            new THREE.MeshBasicMaterial({
                color: 0x57c8b3,
                transparent: true,
                opacity: 0.7,
            });

        this.mesh =
            new THREE.InstancedMesh(
                this.geometry,
                this.material,
                this.count
            );

        this.mesh.instanceMatrix.setUsage(
            THREE.DynamicDrawUsage
        );

        this.scene.add(
            this.mesh
        );

        // --------------------------------
        // HELPERS
        // --------------------------------

        this.dummy =
            new THREE.Object3D();

        this.target =
            new THREE.Vector3();

        this.particleColor =
            new THREE.Color();

        this.positions = [];

        // --------------------------------
        // INITIAL PARTICLE POSITIONS
        // --------------------------------

        for (
            let i = 0;
            i < this.count;
            i++
        ) {
            this.positions.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) *
                    100,

                    (Math.random() - 0.5) *
                    100,

                    (Math.random() - 0.5) *
                    100
                )
            );

            this.mesh.setColorAt(
                i,
                new THREE.Color(
                    0x57c8b3
                )
            );
        }

        // --------------------------------
        // CLOCK
        // --------------------------------

        this.clock =
            new THREE.Clock();

        // --------------------------------
        // EVENTS
        // --------------------------------

        window.addEventListener(
            "resize",
            this.handleResize
        );

        // --------------------------------
        // START
        // --------------------------------

        this.animate();
    }

    // ====================================
    // ANIMATION
    // ====================================

    private animate = () => {
        this.animationFrame =
            requestAnimationFrame(
                this.animate
            );

        const time =
            this.clock.getElapsedTime();

        const scale = 45;
        const flow = 0.7;
        const chaos = 0.65;
        const twist = 1.4;

        // --------------------------------
        // UPDATE EVERY PARTICLE
        // --------------------------------

        for (
            let i = 0;
            i < this.count;
            i++
        ) {
            const u =
                i /
                Math.max(
                    this.count - 1,
                    1
                );

            const band =
                Math.floor(
                    u * 120
                );

            const local =
                u * 120 - band;

            // --------------------------------
            // ANGLE
            // --------------------------------

            const angle =
                local *
                Math.PI *
                2 +

                band *
                0.618 +

                time *
                flow;

            // --------------------------------
            // WAVES
            // --------------------------------

            const waveA =
                Math.sin(
                    angle * 3 +
                    band * 0.13 +
                    time * flow
                );

            const waveB =
                Math.cos(
                    angle * 2 -
                    band * 0.09 +
                    time *
                    flow *
                    0.7
                );

            const waveC =
                Math.sin(
                    band * 0.21 +
                    time *
                    flow *
                    0.5
                );

            // --------------------------------
            // RADIUS
            // --------------------------------

            const radius =
                scale *
                (
                    0.35 +

                    0.28 *
                    Math.sin(
                        band *
                        0.17 +
                        time *
                        flow
                    ) +

                    0.22 *
                    waveA
                );

            // --------------------------------
            // SPIRAL
            // --------------------------------

            const spiral =
                band *
                0.055 +

                time *
                flow *
                0.2;

            const distortion =
                chaos *
                scale *
                0.18;

            // --------------------------------
            // X
            // --------------------------------

            const x =
                Math.cos(
                    angle +
                    spiral
                ) *
                radius +

                Math.sin(
                    band *
                    0.31 +
                    time *
                    flow
                ) *
                distortion;

            // --------------------------------
            // Y
            // --------------------------------

            const y =
                (band - 60) *
                scale *
                0.028 +

                waveA *
                scale *
                0.22 +

                waveB *
                distortion;

            // --------------------------------
            // Z
            // --------------------------------

            const z =
                Math.sin(
                    angle *
                    twist +
                    spiral
                ) *
                radius +

                waveC *
                scale *
                0.35;

            // --------------------------------
            // TARGET POSITION
            // --------------------------------

            this.target.set(
                x,
                y,
                z
            );

            // --------------------------------
            // SMOOTH MOVEMENT
            // --------------------------------

            this.positions[
                i
            ].lerp(
                this.target,
                0.08
            );

            // --------------------------------
            // APPLY POSITION
            // --------------------------------

            this.dummy.position.copy(
                this.positions[i]
            );

            // --------------------------------
            // PARTICLE ROTATION
            // --------------------------------

            this.dummy.rotation.x =
                time *
                0.15 +

                i *
                0.0001;

            this.dummy.rotation.y =
                time *
                0.12 +

                i *
                0.00015;

            this.dummy.rotation.z =
                time *
                0.05;

            // --------------------------------
            // UPDATE MATRIX
            // --------------------------------

            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(
                i,
                this.dummy.matrix
            );

            // --------------------------------
            // PARTICLE COLOR
            // --------------------------------

            const hue =
                0.45 +

                0.04 *
                (
                    0.5 +

                    0.5 *
                    Math.sin(
                        angle +
                        time *
                        flow *
                        0.4
                    )
                );

            const light =
                0.28 +

                0.25 *
                (
                    0.5 +

                    0.5 *
                    Math.sin(
                        band *
                        0.12 +
                        angle *
                        2
                    )
                );

            this.particleColor.setHSL(
                hue,
                0.55,
                light
            );

            this.mesh.setColorAt(
                i,
                this.particleColor
            );
        }

        // --------------------------------
        // TELL THREE.JS TO UPDATE
        // --------------------------------

        this.mesh.instanceMatrix.needsUpdate =
            true;

        if (
            this.mesh.instanceColor
        ) {
            this.mesh.instanceColor.needsUpdate =
                true;
        }

        // --------------------------------
        // RENDER
        // --------------------------------

        this.composer.render();
    };

    // ====================================
    // RESIZE
    // ====================================

    private handleResize = () => {
        const width =
            window.innerWidth;

        const height =
            window.innerHeight;

        this.camera.aspect =
            width / height;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            width,
            height
        );

        this.composer.setSize(
            width,
            height
        );
    };

    // ====================================
    // CLEANUP
    // ====================================

    dispose() {
        cancelAnimationFrame(
            this.animationFrame
        );

        window.removeEventListener(
            "resize",
            this.handleResize
        );

        this.geometry.dispose();

        this.material.dispose();

        this.composer.dispose();

        this.renderer.dispose();

        if (
            this.renderer.domElement
                .parentElement ===
            this.container
        ) {
            this.container.removeChild(
                this.renderer.domElement
            );
        }
    }
}