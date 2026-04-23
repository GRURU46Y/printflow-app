"use client";
import React from 'react';

import { useEffect, useRef } from "react";

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We are loading Three.js from a CDN in layout.tsx.
    // Give it a small delay to ensure it's loaded if navigating quickly
    const initThree = () => {
      // @ts-ignore
      if (typeof window === "undefined" || !window.THREE) {
        setTimeout(initThree, 100);
        return;
      }
      
      // @ts-ignore
      const THREE = window.THREE;

      // --- Background Particle Network --- //
      if (canvasRef.current) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 700;
        
        const posArray = new Float32Array(particlesCount * 3);
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x6366f1, // Indigo
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, material);
        scene.add(particlesMesh);
        
        camera.position.z = 3;
        
        let mouseX = 0;
        let mouseY = 0;
        
        const animate = () => {
            requestAnimationFrame(animate);
            particlesMesh.rotation.y += 0.001;
            particlesMesh.rotation.x += 0.0005;
            
            // Mouse interaction
            particlesMesh.rotation.y += mouseX * 0.0005;
            particlesMesh.rotation.x += mouseY * 0.0005;
            
            renderer.render(scene, camera);
        };
        
        animate();
        
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        const handleMouseMove = (event: MouseEvent) => {
            mouseX = event.clientX - window.innerWidth / 2;
            mouseY = event.clientY - window.innerHeight / 2;
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousemove', handleMouseMove);

        return () => {
          window.removeEventListener('resize', handleResize);
          document.removeEventListener('mousemove', handleMouseMove);
          renderer.dispose();
        };
      }
    };

    initThree();
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas"></canvas>;
}
