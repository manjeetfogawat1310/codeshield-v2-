import * as THREE from "three";

// Decorative 3D backdrop only; it does not participate in CodeShield logic.
const canvas = document.getElementById("bg");
if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 9;

    const count = 520;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0x6ee7ff, size: 0.035, transparent: true, opacity: 0.72, depthWrite: false
    }));
    scene.add(particles);

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.4, 2.4, 2, 2, 2),
      new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.15 })
    );
    cube.position.set(5.3, 1.2, -1.5);
    scene.add(cube);

    const ring = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 28; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 7), ringMaterial);
      const angle = (i / 28) * Math.PI * 2;
      dot.position.set(Math.cos(angle) * 3.1, Math.sin(angle) * 3.1, 0);
      ring.add(dot);
    }
    ring.position.set(-5.2, -1.6, -2);
    scene.add(ring);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      particles.rotation.y += 0.00025;
      particles.rotation.x += 0.0001;
      cube.rotation.x += 0.0015;
      cube.rotation.y += 0.0018;
      ring.rotation.z += 0.001;
      renderer.render(scene, camera);
    };
    animate();
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
  } catch (error) {
    // If WebGL is unavailable, the CSS gradients still provide a polished background.
    console.warn("CodeShield 3D background unavailable:", error);
  }
}
