/**
 * High-Fidelity Generative WebGL Engine for "The Void at Crimson Sunset"
 * 
 * Implements:
 * 1. The Event Horizon (Ray-marched refraction)
 * 2. Neural Fluid Weave (FBM flow field)
 * 3. Abyssal Volumetrics (Rayleigh-like scattering)
 * 4. Temporal Lens (Chromatic blur/DoF simulation)
 * 5. Reality Displacement (Domain warping)
 */

(function initGenerativeWebGL() {
    'use strict';

    // State & ThreeJS Core
    let scene, camera, renderer, clock, uniforms;
    let isWebGLAvailable = true;
    let animationId = null;
    let targetTension = 0.0;
    let currentTension = 0.0;

    // Check for WebGL support
    function checkWebGLSupport() {
        try {
            const testCanvas = document.createElement('canvas');
            const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    // Fallback for no WebGL
    function showFallback() {
        console.warn('WebGL not available, using fallback background');
        const canvas = document.getElementById('bg-canvas') || document.getElementById('three-background');
        if (canvas) canvas.style.display = 'none';
        document.body.style.backgroundImage = 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0a0a 100%)';
    }

    // Initialize Three.js
    function init() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
            showFallback();
            return;
        }

        if (!checkWebGLSupport()) {
            isWebGLAvailable = false;
            showFallback();
            return;
        }

        try {
            // Find existing canvas or create one
            let canvas = document.getElementById('bg-canvas') || document.getElementById('three-background');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.id = 'bg-canvas';
                canvas.setAttribute('aria-hidden', 'true');
                document.body.insertBefore(canvas, document.body.firstChild);
            }

            // Make sure it's styled correctly
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.zIndex = '0';
            canvas.style.pointerEvents = 'none';

            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            
            renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            // Limit pixel ratio to 1.5 to maintain performance while keeping high-fidelity look
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

            clock = new THREE.Clock();

            createGenerativeShader();
            setupEventListeners();
            animate();

        } catch (error) {
            console.error('Three.js initialization failed:', error);
            isWebGLAvailable = false;
            showFallback();
        }
    }

    function createGenerativeShader() {
        // Determine theme based on page
        const path = window.location.pathname;
        const isMainPage = path.endsWith('/') || path.endsWith('index.html') || path.endsWith('index-refactored.html');

        // Uniforms for the fragment shader
        uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_tension: { value: 0.0 },     // Drives the "Horror" intensity
            u_scroll: { value: 0.0 },      // Drives the vertical flow
            u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
            u_themeColor: { value: new THREE.Color(0x8b0000) }, // Base dark red
            u_isMainPage: { value: isMainPage ? 1.0 : 0.0 }
        };

        if (path.includes('ACTII')) uniforms.u_themeColor.value.setHex(0x440044); // Purple/Red transition
        if (path.includes('ACTIII')) uniforms.u_themeColor.value.setHex(0x002244); // Deep void blue

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        // The Master Cosmic Horror Shader
        const fragmentShader = `
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_tension;
            uniform float u_scroll;
            uniform vec2 u_mouse;
            uniform vec3 u_themeColor;
            uniform float u_isMainPage;

            varying vec2 vUv;

            // --- NOISE & MATH UTILS ---
            mat2 rot(float a) {
                float c = cos(a), s = sin(a);
                return mat2(c, -s, s, c);
            }

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                           mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
            }

            // Fractional Brownian Motion
            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                vec2 shift = vec2(100.0);
                for (int i = 0; i < 5; ++i) {
                    v += a * noise(p);
                    p = rot(0.5) * p * 2.0 + shift;
                    a *= 0.5;
                }
                return v;
            }

            // --- THE SHADER ---
            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                vec2 uv = st * 2.0 - 1.0;
                uv.x *= u_resolution.x / u_resolution.y;

                float dist = length(uv);

                // 1. THE VORTEX / CHASM (Main Page Special)
                // Swirl logic that increases towards the center
                if (u_isMainPage > 0.5) {
                    float swirl = 4.0 * exp(-dist * 1.5);
                    uv *= rot(u_time * 0.2 + swirl);
                }

                // 2. THE EVENT HORIZON (Peripheral Refraction)
                float bend = smoothstep(0.3, 1.5, dist) * (0.1 + u_tension * 0.4);
                vec2 refractedUv = uv + normalize(uv) * bend * fbm(uv * 2.0 + u_time * 0.1);

                // 3. REALITY DISPLACEMENT (Domain Warping)
                vec2 q = vec2(0.0);
                q.x = fbm(refractedUv + 0.00 * u_time);
                q.y = fbm(refractedUv + vec2(1.0));

                vec2 r = vec2(0.0);
                r.x = fbm(refractedUv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
                r.y = fbm(refractedUv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

                float fluidNoise = fbm(refractedUv + r * (2.0 + u_tension * 2.0) - vec2(0.0, u_scroll * 2.0));

                // 4. ABYSSAL VOLUMETRICS
                float safeZone = 1.0 - smoothstep(0.1, 1.2, dist);
                if (u_isMainPage > 0.5) safeZone *= 0.8; // Darker center on main page
                
                float density = (1.0 - safeZone) * (0.5 + u_tension * 0.5);
                
                vec3 col = mix(vec3(0.01, 0.005, 0.005), u_themeColor * 1.5, fluidNoise);
                
                // Rotating Accretion Disk Rays
                float angle = atan(uv.y, uv.x);
                float rays = noise(vec2(angle * 3.0 + u_time * 0.1, dist * 0.5)) * 0.5 + 0.5;
                col += u_themeColor * rays * density * 0.4;

                // 5. THE CHASM CORE (Visualizing the Hole)
                if (u_isMainPage > 0.5) {
                    float hole = smoothstep(0.4, 0.0, dist);
                    col *= (1.0 - hole * 0.9); // Deep dark core
                    
                    // Jagged inner edge
                    float edge = noise(vec2(angle * 5.0, u_time)) * 0.1;
                    if (dist < 0.3 + edge) {
                        col *= 0.5;
                    }
                }

                // NEURAL FLUID WEAVE
                float weave = noise(refractedUv * 8.0 + r * 4.0) * density;
                col -= vec3(weave * 0.4);

                // TEMPORAL LENS
                float chromaticOffset = dist * (0.01 + u_tension * 0.03);
                float rColor = fbm(refractedUv + vec2(chromaticOffset, 0.0) + r);
                float bColor = fbm(refractedUv - vec2(chromaticOffset, 0.0) + r);
                col.r += rColor * 0.1 * density;
                col.b += bColor * 0.1 * density;

                // Final vignette
                col *= smoothstep(2.5, 0.1, dist * (0.7 + u_tension * 0.4));
                col += hash(uv * 100.0 + u_time) * 0.04; // Grain

                gl_FragColor = vec4(col, 1.0);
            }
        `;


        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            depthTest: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }

    function animate() {
        if (!isWebGLAvailable) return;

        animationId = requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Smoothly interpolate tension
        currentTension += (targetTension - currentTension) * 2.0 * delta;

        // Update Uniforms
        if (uniforms) {
            uniforms.u_time.value = time * 0.5;
            uniforms.u_tension.value = currentTension;
            
            // Normalize scroll to 0-1
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const scrollNorm = window.scrollY / maxScroll;
            uniforms.u_scroll.value = scrollNorm;
        }

        renderer.render(scene, camera);
    }

    function setupEventListeners() {
        window.addEventListener('resize', () => {
            if (!isWebGLAvailable || !renderer) return;
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (uniforms) {
                uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
            }
        });

        // Mouse tracking for subtle parallax in the fluid
        document.addEventListener('mousemove', (e) => {
            if (!uniforms) return;
            uniforms.u_mouse.value.set(
                e.clientX / window.innerWidth,
                1.0 - e.clientY / window.innerHeight
            );
        }, { passive: true });

        // Tension tracking (ties into HorrorEngine if available)
        window.addEventListener('scroll', () => {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const scrollNorm = window.scrollY / maxScroll;
            
            // Base tension grows with scroll depth
            let newTension = scrollNorm * 0.6;

            // If a horror trigger is active, it spikes
            if (document.body.classList.contains('horror-flicker') || 
                document.querySelector('.horror-glitch-overlay')) {
                newTension += 0.4;
            }

            targetTension = Math.min(1.0, newTension);
        }, { passive: true });

        // Expose a method for the horror engine to trigger reality bending
        window.spikeVisualTension = function(amount = 0.5) {
            targetTension = Math.min(1.0, targetTension + amount);
            setTimeout(() => {
                targetTension = Math.max(0.0, targetTension - amount);
            }, 2000);
        };

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (animationId) cancelAnimationFrame(animationId);
            if (scene) {
                scene.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
            if (renderer) renderer.dispose();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
