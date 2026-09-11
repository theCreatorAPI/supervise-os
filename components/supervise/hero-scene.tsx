"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The hero's organic surface, as a live WebGL scene.
 *
 * This is the three-dimensional counterpart to `hero-backdrop.tsx`: the same
 * sculptural moss-green dune forms lit from the upper left, but displaced by
 * animated noise so the surface drifts slowly instead of sitting still. The SVG
 * backdrop stays mounted underneath as the instant paint and the fallback for
 * anyone without WebGL.
 *
 * Guardrails, because this is a marketing background and must never cost a
 * visitor their battery or their scroll performance:
 *   - the render loop stops when the hero scrolls out of view or the tab hides
 *   - `prefers-reduced-motion` renders a single static frame and no loop at all
 *   - pixel ratio is capped, and the mesh is coarser on small screens
 *   - everything is disposed on unmount
 */

const VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vHeight;

  //
  // Simplex noise — Ashima Arts / Stefan Gustavson, the standard public-domain
  // implementation. Used here to displace the plane into dune forms.
  //
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Layered noise: broad dunes first, then gentler swells on top.
  //
  // Every frequency here has to stay well below the mesh's sampling rate. The
  // plane is 90 units across at 200 segments, so a quad is ~0.45 units; an
  // octave fine enough to turn over within a few quads aliases into hard shards
  // rather than reading as surface detail.
  float dunes(vec2 p, float t) {
    float h  = snoise(vec3(p * 0.045, t)) * 1.0;
    h       += snoise(vec3(p * 0.095, t * 1.25 + 11.0)) * 0.42;
    h       += snoise(vec3(p * 0.190, t * 1.60 + 23.0)) * 0.14;
    return h;
  }

  void main() {
    vec3 pos = position;
    float t = uTime * 0.045;

    const float amp = 4.2;

    float h = dunes(pos.xy, t);
    pos.z += h * amp;

    // Normals from finite differences of the same field, so the lighting in the
    // fragment stage follows the displaced surface. The step is a little wider
    // than one quad, which smooths the slope instead of chasing per-vertex noise.
    float e = 0.9;
    float hx = dunes(pos.xy + vec2(e, 0.0), t);
    float hy = dunes(pos.xy + vec2(0.0, e), t);
    vec3 tangentX = normalize(vec3(e, 0.0, (hx - h) * amp));
    vec3 tangentY = normalize(vec3(0.0, e, (hy - h) * amp));
    vNormal = normalize(cross(tangentX, tangentY));

    vHeight = h;

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uLightDir;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uLit;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vHeight;

  void main() {
    vec3 n = normalize(vNormal);

    // Key light from the upper left, matching the SVG backdrop's lighting.
    float key = clamp(dot(n, normalize(uLightDir)), 0.0, 1.0);
    // A dim fill from the opposite side keeps the troughs from going pure black.
    float fill = clamp(dot(n, normalize(vec3(0.4, -0.6, 0.3))), 0.0, 1.0) * 0.22;

    // Crests catch more light than troughs.
    float crest = smoothstep(-0.6, 1.4, vHeight);

    vec3 color = mix(uDeep, uMid, crest);
    color = mix(color, uLit, key * 0.85 * (0.35 + crest * 0.65));
    color += uMid * fill;

    // Distance fog folds the far edge into the page background.
    float depth = length(vWorld - cameraPosition);
    float fog = smoothstep(uFogNear, uFogFar, depth);
    color = mix(color, uDeep * 0.18, fog);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function srgb(hex: number) {
  return new THREE.Color(hex).convertSRGBToLinear();
}

export function HeroScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return; // No WebGL — the SVG backdrop underneath is already the fallback.
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, host.clientWidth / host.clientHeight, 0.1, 200);
    camera.position.set(0, -16, 9.5);
    camera.lookAt(0, 6, 0);

    // The plane runs well past the frustum on every side — at 90x70 its far
    // corner cut a hard diagonal edge across the top of the shot.
    // Coarser mesh on phones: the silhouette barely changes but the vertex
    // shader runs on a fraction of the points.
    const segments = window.innerWidth < 768 ? 120 : 200;
    const geometry = new THREE.PlaneGeometry(200, 170, segments, segments);

    const uniforms = {
      uTime: { value: 0 },
      uLightDir: { value: new THREE.Vector3(-0.55, 0.5, 0.75) },
      uDeep: { value: srgb(0x0a1206) },
      uMid: { value: srgb(0x3f5426) },
      uLit: { value: srgb(0xc3daa0) },
      uFogNear: { value: 26 },
      uFogFar: { value: 78 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.62;
    scene.add(mesh);

    // Pointer parallax, damped so it glides rather than snaps.
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      renderer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    // Only run while the hero is actually on screen.
    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !reduced) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(host);

    // Elapsed time is accumulated by hand rather than with THREE.Clock, which is
    // deprecated in r186. Tracking accumulated seconds (instead of wall-clock
    // delta from a start point) also means pausing and resuming doesn't jump the
    // animation forward by however long the hero was off screen.
    let elapsed = 0;
    let lastTs = 0;
    let frame = 0;

    const render = () => {
      eased.x += (pointer.x - eased.x) * 0.04;
      eased.y += (pointer.y - eased.y) * 0.04;
      camera.position.x = eased.x * 1.6;
      camera.position.z = 9.5 - eased.y * 0.9;
      camera.lookAt(0, 6, 0);
      renderer.render(scene, camera);
    };

    const loop = (ts: number) => {
      if (lastTs) elapsed += (ts - lastTs) / 1000;
      lastTs = ts;
      uniforms.uTime.value = elapsed;
      render();
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (frame || reduced) return;
      lastTs = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTs = 0;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // One frame either way, so reduced-motion visitors still get the scene.
    render();
    if (!reduced) start();

    return () => {
      stop();
      io.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="absolute inset-0 size-full" />;
}

export default HeroScene;
