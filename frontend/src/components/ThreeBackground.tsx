import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup ---
    const scene = new THREE.Scene();
    
    // Hardcoded Dark Theme Colors
    const darkBg = 0x0F172A; // Slate 900
    scene.background = new THREE.Color(darkBg); 
    scene.fog = new THREE.FogExp2(darkBg, 0.02);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Mouse Tracking
    const mouse = new THREE.Vector2(-9999, -9999);
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Objects ---

    // 1. Digital Particles
    const particleGroup = new THREE.Group();
    particleGroup.position.y = -5; 

    const particleGeometry = new THREE.IcosahedronGeometry(1, 0);
    const colors = [0x6366F1, 0x10B981, 0xF59E0B]; 

    for (let i = 0; i < 35; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({ 
        color: color, 
        wireframe: true,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(particleGeometry, material);
      
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 30;

      mesh.position.set(x, y, z);
      mesh.scale.setScalar(Math.random() * 1.2 + 0.3);
      
      (mesh as any).userData = {
        originalPos: new THREE.Vector3(x, y, z),
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01
        },
        floatSpeed: (Math.random() * 0.02) + 0.005,
        mouseOffset: new THREE.Vector3(0, 0, 0),
        baseOpacity: 0.3
      };
      
      particleGroup.add(mesh);
    }
    scene.add(particleGroup);

    // 2. Soft Gradient Blobs
    const blobGroup = new THREE.Group();
    const blobGeometry = new THREE.SphereGeometry(12, 32, 32);
    
    const blobMaterials = colors.map(c => new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0.04, 
      depthWrite: false,
    }));

    for (let i = 0; i < 6; i++) {
      const material = blobMaterials[i % blobMaterials.length];
      const mesh = new THREE.Mesh(blobGeometry, material);
      
      const x = (Math.random() - 0.5) * 70;
      const y = (Math.random() - 0.5) * 40;
      const z = -15;

      mesh.position.set(x, y, z);
      
       (mesh as any).userData = {
         originalPos: new THREE.Vector3(x, y, z),
         timeOffset: Math.random() * 100, 
         speed: {
           x: 0.2 + Math.random() * 0.2,
           y: 0.2 + Math.random() * 0.2
         }
       };

      blobGroup.add(mesh);
    }
    scene.add(blobGroup);

    // 3. Giant Background Gradient Blob
    const giantGeometry = new THREE.SphereGeometry(35, 64, 64);
    const giantMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366F1, 
      transparent: true,
      opacity: 0.02, 
      depthWrite: false,
    });
    const giantBlob = new THREE.Mesh(giantGeometry, giantMaterial);
    giantBlob.position.set(0, 0, -25);
    scene.add(giantBlob);

    // --- Animation Loop ---
    const startTime = Date.now();
    const tempV = new THREE.Vector3();

    const animate = () => {
      requestAnimationFrame(animate);
      
      const now = Date.now();
      const time = now * 0.001;
      const elapsed = now - startTime;

      let entranceProgress = 0;
      if (elapsed > 200) {
        entranceProgress = Math.max(0, Math.min((elapsed - 200) / 600, 1));
        entranceProgress = 1 - Math.pow(1 - entranceProgress, 3);
      }
      
      particleGroup.position.y = -5 + (entranceProgress * 5);

      particleGroup.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const data = (mesh as any).userData;
        
        mesh.rotation.x += data.rotationSpeed.x;
        mesh.rotation.y += data.rotationSpeed.y;
        
        data.originalPos.y += data.floatSpeed;
        if (data.originalPos.y > 30) data.originalPos.y = -30;

        // Interaction logic
        tempV.set(
            data.originalPos.x + data.mouseOffset.x,
            data.originalPos.y + data.mouseOffset.y,
            data.originalPos.z
        );
        
        tempV.project(camera);
        
        const dx = tempV.x - mouse.x;
        const dy = tempV.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const targetOffset = new THREE.Vector3(0, 0, 0);
        let targetOpacity = data.baseOpacity * entranceProgress;
        
        if (dist < 0.5) { // Radius
            const force = Math.max(0, 1 - (dist / 0.5)); // Normalized force 0 to 1
            const angle = Math.atan2(dy, dx);
            const push = 5 * force; // Push strength
            
            targetOffset.x = Math.cos(angle) * push;
            targetOffset.y = Math.sin(angle) * push;
            targetOpacity += 0.4 * force;
        }

        // Smooth lerp
        data.mouseOffset.lerp(targetOffset, 0.08);

        mesh.position.x = data.originalPos.x + data.mouseOffset.x;
        mesh.position.y = data.originalPos.y + data.mouseOffset.y;
        mesh.position.z = data.originalPos.z;
        (mesh.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
      });

      blobGroup.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const data = (mesh as any).userData;

        mesh.position.x = data.originalPos.x + Math.sin(time * data.speed.x + data.timeOffset) * 4;
        mesh.position.y = data.originalPos.y + Math.cos(time * data.speed.y + data.timeOffset) * 3;
      });
      
      giantBlob.position.x = Math.sin(time * 0.5) * 10;
      giantBlob.position.y = Math.cos(time * 0.3) * 5;
      giantBlob.scale.setScalar(1 + Math.sin(time * 0.2) * 0.05);

      particleGroup.rotation.y += 0.0003;
      particleGroup.rotation.x += 0.0001;

      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 top-0 left-0 -z-10 pointer-events-none transition-colors duration-500" />;
};

export default ThreeBackground;