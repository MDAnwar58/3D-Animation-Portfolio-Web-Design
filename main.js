let scene, camera, renderer, particles, lines, centralObject;
let mouseX = 0, mouseY = 0;
let objects = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  createCentralObjects();
  createParticles();
  createLines();

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
}

function createCentralObjects() {
  const geometries = [
    new THREE.IcosahedronGeometry(2, 2),
    new THREE.OctahedronGeometry(1.5, 2),
    new THREE.TetrahedronGeometry(2, 2)
  ];
  
  const colors = [0x667eea, 0x764ba2, 0xff6b6b];
  
  geometries.forEach((geometry, i) => {
    const material = new THREE.MeshBasicMaterial({ 
      color: colors[i], 
      transparent: true, 
      opacity: 0.8,
      wireframe: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (i - 1) * 6;
    mesh.userData = { 
      rotationSpeed: 0.005 + i * 0.003,
      floatSpeed: 0.001 + i * 0.0005,
      originalY: 0
    };
    objects.push(mesh);
    scene.add(mesh);
  });
}

function createParticles() {
  const geometry = new THREE.SphereGeometry(0.2, 12, 12);
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 50 : 150;
  
  const material = new THREE.MeshBasicMaterial({ color: 0x667eea, transparent: true, opacity: 0.7 });
  
  particles = new THREE.Group();
  for (let i = 0; i < particleCount; i++) {
    const sphere = new THREE.Mesh(geometry, material.clone());
    const radius = 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    sphere.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    sphere.userData.velocity = {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02
    };
    particles.add(sphere);
  }
  scene.add(particles);
}

function createLines() {
  const lineGeometry = new THREE.BufferGeometry();
  const isMobile = window.innerWidth < 768;
  const lineOpacity = isMobile ? 0.1 : 0.2;
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x764ba2, 
    transparent: true, 
    opacity: lineOpacity 
  });
  
  const positions = [];
  const particlePositions = [];
  particles.children.forEach(p => particlePositions.push(p.position));
  
  for (let i = 0; i < particlePositions.length; i++) {
    for (let j = i + 1; j < particlePositions.length; j++) {
      const dist = particlePositions[i].distanceTo(particlePositions[j]);
      if (dist < 8) {
        positions.push(
          particlePositions[i].x, particlePositions[i].y, particlePositions[i].z,
          particlePositions[j].x, particlePositions[j].y, particlePositions[j].z
        );
      }
    }
  }
  
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);
}

function animate() {
  requestAnimationFrame(animate);
  
  const time = Date.now() * 0.001;
  
  objects.forEach((obj, i) => {
    obj.rotation.x += obj.userData.rotationSpeed;
    obj.rotation.y += obj.userData.rotationSpeed * 0.7;
    obj.position.y = obj.userData.originalY + Math.sin(time * obj.userData.floatSpeed) * 0.5;
  });
  
  particles.rotation.y += 0.001;
  particles.rotation.x += mouseY * 0.002;
  particles.rotation.y += mouseX * 0.002;
  
  particles.children.forEach(sphere => {
    sphere.position.add(sphere.userData.velocity);
    if (Math.abs(sphere.position.x) > 25) sphere.userData.velocity.x *= -1;
    if (Math.abs(sphere.position.y) > 25) sphere.userData.velocity.y *= -1;
    if (Math.abs(sphere.position.z) > 25) sphere.userData.velocity.z *= -1;
  });
  
  renderer.render(scene, camera);
}