import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { TerminalProfile, CRTEffectConfig } from '../types'
import { TextTextureGenerator } from '../utils/textTextureGenerator'

interface RetroTerminalWebGLProps {
  id: string
  imageSrc: string | null
  profile: TerminalProfile
  crtConfig: CRTEffectConfig
}

export interface RetroTerminalWebGLRef {
  captureFrame: (frameIndex: number) => Promise<void>
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float time;
  uniform vec2 resolution;

  uniform float curveIntensity;
  uniform float scanlineCount;
  uniform float scanlineIntensity;
  uniform float rgbOffset;
  uniform float vignetteSize;
  uniform float vignetteRoundness;
  uniform float brightnessBoost;
  uniform float noiseStrength;
  uniform float flickerIntensity;

  varying vec2 vUv;

  // CRT screen curvature
  vec2 curve(vec2 uv) {
    uv = (uv - 0.5) * 2.0;
    vec2 offset = uv.yx / vec2(resolution.x / resolution.y, 1.0);
    uv = uv + uv * offset * offset * curveIntensity;
    return uv * 0.5 + 0.5;
  }

  void main() {
    vec2 q = vUv;
    vec2 uv = curve(q);

    // Discard pixels outside curved screen
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // RGB chromatic aberration
    float r = texture2D(tDiffuse, uv + vec2(rgbOffset, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(rgbOffset, 0.0)).b;
    vec3 color = vec3(r, g, b);

    // Scanlines
    float scanline = sin((uv.y * scanlineCount + time * 20.0) * 3.14159 * 2.0);
    float scanlineEffect = 1.0 - scanlineIntensity * (scanline * 0.5 + 0.5);
    color *= scanlineEffect;

    // Vignette
    float dist = distance(uv, vec2(0.5));
    float vignette = smoothstep(vignetteSize + 0.2, vignetteSize - vignetteRoundness, dist);
    color *= vignette;

    // Noise
    float noise = fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * noiseStrength;

    // Flicker
    color *= 1.0 - flickerIntensity * 0.5 + flickerIntensity * sin(time * 30.0);

    // Brightness
    color *= brightnessBoost;

    gl_FragColor = vec4(color, 1.0);
  }
`

export const RetroTerminalWebGL = forwardRef<RetroTerminalWebGLRef, RetroTerminalWebGLProps>(
  ({ id, imageSrc, profile, crtConfig }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
    const materialRef = useRef<THREE.ShaderMaterial | null>(null)
    const textureGeneratorRef = useRef<TextTextureGenerator | null>(null)
    const clockRef = useRef<THREE.Clock | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // Expose captureFrame method for GIF export
    useImperativeHandle(ref, () => ({
      captureFrame: async (frameIndex: number) => {
        if (!materialRef.current) return

        // Set time uniform to specific frame time
        const fps = 15
        materialRef.current.uniforms.time.value = frameIndex / fps

        // Render one frame
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current)
        }

        // Wait for render to complete
        await new Promise((resolve) => requestAnimationFrame(resolve))
      },
    }))

    // Initialize Three.js scene
    useEffect(() => {
      if (!containerRef.current) return

      const container = containerRef.current

      // Create texture generator
      textureGeneratorRef.current = new TextTextureGenerator()

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: true, // Required for GIF export
      })
      renderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = renderer

      // Append canvas with ID for GIF export
      const canvas = renderer.domElement
      canvas.id = id
      container.appendChild(canvas)

      // Create scene
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Create clock
      const clock = new THREE.Clock()
      clockRef.current = clock

      // Cleanup function
      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (rendererRef.current) {
          rendererRef.current.dispose()
        }
        if (materialRef.current) {
          materialRef.current.dispose()
        }
        if (textureGeneratorRef.current) {
          const canvas = textureGeneratorRef.current.getCanvas()
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas)
          }
        }
        if (container && canvas.parentNode === container) {
          container.removeChild(canvas)
        }
      }
    }, [id])

    // Update content texture when profile or imageSrc changes
    useEffect(() => {
      const updateTexture = async () => {
        if (!textureGeneratorRef.current || !rendererRef.current || !containerRef.current) return

        // Wait for next frame to ensure container dimensions are ready
        await new Promise((resolve) => requestAnimationFrame(resolve))

        if (!containerRef.current) return

        try {
          // Generate new texture
          const texture = await textureGeneratorRef.current.generateTexture(
            profile,
            imageSrc,
            crtConfig.showGrid,
          )
          const dimensions = textureGeneratorRef.current.getDimensions()

          // Use actual texture dimensions (accounting for 2x scale)
          const width = dimensions.width / 2
          const height = dimensions.height / 2

          // Calculate scale to fit within container without scrollbars
          const containerRect = containerRef.current.getBoundingClientRect()
          const maxWidth = containerRect.width - 32 // Account for padding
          const maxHeight = containerRect.height - 32

          // Ensure container has valid dimensions before calculating scale
          const scaleToFit = maxWidth > 0 && maxHeight > 0
            ? Math.min(
                maxWidth / width,
                maxHeight / height,
                1.2, // Maximum scale to prevent too large display
              )
            : 1 // Fallback to 1:1 scale if container not ready

          const displayWidth = width * scaleToFit
          const displayHeight = height * scaleToFit

          // Update renderer size
          rendererRef.current.setSize(displayWidth, displayHeight)

          // Create or update camera (use original dimensions for ortho camera)
          if (!cameraRef.current) {
            const camera = new THREE.OrthographicCamera(
              displayWidth / -2,
              displayWidth / 2,
              displayHeight / 2,
              displayHeight / -2,
              1,
              1000,
            )
            camera.position.z = 10
            cameraRef.current = camera
          } else {
            cameraRef.current.left = displayWidth / -2
            cameraRef.current.right = displayWidth / 2
            cameraRef.current.top = displayHeight / 2
            cameraRef.current.bottom = displayHeight / -2
            cameraRef.current.updateProjectionMatrix()
          }

          // Create or update shader material
          if (!materialRef.current) {
            const uniforms = {
              tDiffuse: { value: texture },
              time: { value: 0.0 },
              resolution: { value: new THREE.Vector2(width, height) },
              curveIntensity: { value: crtConfig.curveIntensity },
              scanlineCount: { value: crtConfig.scanlineCount },
              scanlineIntensity: { value: crtConfig.scanlineIntensity },
              rgbOffset: { value: crtConfig.rgbOffset },
              vignetteSize: { value: crtConfig.vignetteSize },
              vignetteRoundness: { value: crtConfig.vignetteRoundness },
              brightnessBoost: { value: crtConfig.brightnessBoost },
              noiseStrength: { value: crtConfig.noiseStrength },
              flickerIntensity: { value: crtConfig.flickerIntensity },
            }

            const material = new THREE.ShaderMaterial({
              uniforms,
              vertexShader,
              fragmentShader,
              transparent: false,
            })
            materialRef.current = material

            // Create geometry and mesh (use display dimensions)
            const geometry = new THREE.PlaneGeometry(displayWidth, displayHeight)
            const mesh = new THREE.Mesh(geometry, material)
            sceneRef.current?.add(mesh)

            // Start animation loop
            const animate = () => {
              animationFrameRef.current = requestAnimationFrame(animate)

              if (clockRef.current && materialRef.current) {
                materialRef.current.uniforms.time.value = clockRef.current.getElapsedTime()
              }

              if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current)
              }
            }
            animate()
          } else {
            // Update existing texture
            materialRef.current.uniforms.tDiffuse.value = texture
            materialRef.current.uniforms.resolution.value.set(width, height)

            // Update mesh geometry size if dimensions changed
            const mesh = sceneRef.current?.children.find(
              (child) => child instanceof THREE.Mesh,
            ) as THREE.Mesh
            if (mesh && mesh.geometry) {
              mesh.geometry.dispose()
              mesh.geometry = new THREE.PlaneGeometry(displayWidth, displayHeight)
            }
          }
        } catch (error) {
          console.error('Error updating texture:', error)
        }
      }

      updateTexture()
    }, [profile, imageSrc, crtConfig.showGrid])

    // Update shader uniforms when crtConfig changes
    useEffect(() => {
      if (!materialRef.current) return

      materialRef.current.uniforms.curveIntensity.value = crtConfig.curveIntensity
      materialRef.current.uniforms.scanlineCount.value = crtConfig.scanlineCount
      materialRef.current.uniforms.scanlineIntensity.value = crtConfig.scanlineIntensity
      materialRef.current.uniforms.rgbOffset.value = crtConfig.rgbOffset
      materialRef.current.uniforms.vignetteSize.value = crtConfig.vignetteSize
      materialRef.current.uniforms.vignetteRoundness.value = crtConfig.vignetteRoundness
      materialRef.current.uniforms.brightnessBoost.value = crtConfig.brightnessBoost
      materialRef.current.uniforms.noiseStrength.value = crtConfig.noiseStrength
      materialRef.current.uniforms.flickerIntensity.value = crtConfig.flickerIntensity
    }, [crtConfig])

    return <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
  },
)

RetroTerminalWebGL.displayName = 'RetroTerminalWebGL'
