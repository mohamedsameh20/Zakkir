import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let activeGarden = null;
let palaceModelUrl = globalThis.__ZAKKIR_PALACE_MODEL_URL__ || "";

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture) value.dispose();
  }
  material.dispose?.();
}

function disposeObject(root) {
  root.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
    else disposeMaterial(child.material);
  });
}

function addGardenBase(scene, enableLampLights = true) {
  const floatingRock = new THREE.Mesh(
    new THREE.CylinderGeometry(7.65, 2.7, 3.25, 12),
    [
      new THREE.MeshStandardMaterial({ color: 0x74634f, roughness: 1, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x8b765b, roughness: 0.96, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x4d453b, roughness: 1, flatShading: true }),
    ],
  );
  floatingRock.position.y = -1.9;
  floatingRock.castShadow = true;
  floatingRock.receiveShadow = true;
  scene.add(floatingRock);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7.7, 8.2, 0.55, 12),
    [
      new THREE.MeshStandardMaterial({ color: 0x4f8f47, roughness: 0.92, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x75b85e, roughness: 0.88, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x375f35, roughness: 1, flatShading: true }),
    ],
  );
  base.position.y = -0.275;
  base.receiveShadow = true;
  scene.add(base);

  const lawn = new THREE.Mesh(
    new THREE.CircleGeometry(7.45, 12),
    new THREE.MeshStandardMaterial({ color: 0x79bd62, roughness: 0.96, flatShading: true }),
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.012;
  lawn.receiveShadow = true;
  scene.add(lawn);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 5.4),
    new THREE.MeshStandardMaterial({ color: 0xb6a685, roughness: 1, flatShading: true }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.03, 4.75);
  path.receiveShadow = true;
  scene.add(path);

  const promenade = new THREE.Mesh(
    new THREE.RingGeometry(5.65, 6.15, 12),
    new THREE.MeshStandardMaterial({ color: 0x9d8c70, roughness: 1, flatShading: true }),
  );
  promenade.rotation.x = -Math.PI / 2;
  promenade.position.y = 0.025;
  promenade.receiveShadow = true;
  scene.add(promenade);

  const hedgeMaterial = new THREE.MeshStandardMaterial({ color: 0x27633d, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    if (Math.abs(Math.sin(angle)) < 0.28 && Math.cos(angle) > 0) continue;
    const hedge = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 + (i % 3) * 0.05, 0), hedgeMaterial);
    hedge.position.set(Math.sin(angle) * 6.75, 0.38, Math.cos(angle) * 6.75);
    hedge.scale.y = 0.82;
    hedge.castShadow = true;
    hedge.receiveShadow = true;
    scene.add(hedge);
  }

  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, 0.75, 6);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3b27, roughness: 1, flatShading: true });
  const cypressMaterial = new THREE.MeshStandardMaterial({ color: 0x1f6843, roughness: 0.88, flatShading: true });
  const cypressPositions = [[-5.15, -2.8], [-5.25, 2.15], [5.1, -2.65], [3.8, 4.85]];
  for (const [x, z] of cypressPositions) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.38;
    trunk.castShadow = true;
    tree.add(trunk);
    for (let layer = 0; layer < 3; layer += 1) {
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.72 - layer * 0.12, 1.35, 7),
        cypressMaterial,
      );
      crown.position.y = 0.9 + layer * 0.58;
      crown.castShadow = true;
      tree.add(crown);
    }
    tree.position.set(x, 0, z);
    tree.rotation.y = (x + z) * 0.37;
    scene.add(tree);
  }

  const fountain = new THREE.Group();
  const fountainStone = new THREE.MeshStandardMaterial({ color: 0x7b8586, roughness: 0.72, metalness: 0.08, flatShading: true });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.05, 0.28, 12), fountainStone);
  basin.position.y = 0.14;
  basin.castShadow = true;
  basin.receiveShadow = true;
  fountain.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.12, 6, 18), fountainStone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.31;
  rim.castShadow = true;
  fountain.add(rim);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x55bddd,
    emissive: 0x0a526e,
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: 0.78,
    roughness: 0.24,
    metalness: 0.05,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.68, 18), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.325;
  fountain.add(water);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.92, 8), fountainStone);
  pedestal.position.y = 0.72;
  pedestal.castShadow = true;
  fountain.add(pedestal);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.18, 0.18, 10), fountainStone);
  bowl.position.y = 1.16;
  bowl.castShadow = true;
  fountain.add(bowl);
  const waterJet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.065, 0.82, 6),
    new THREE.MeshBasicMaterial({ color: 0xa8e9f5, transparent: true, opacity: 0.66 }),
  );
  waterJet.position.y = 1.64;
  fountain.add(waterJet);
  fountain.position.set(4.45, 0, 1.5);
  scene.add(fountain);

  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x26312f, roughness: 0.62, metalness: 0.36, flatShading: true });
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd886,
    emissive: 0xffa329,
    emissiveIntensity: 2.1,
    roughness: 0.25,
  });
  const lampPositions = [[-0.9, 3.0], [0.9, 3.0], [-0.9, 5.25], [0.9, 5.25]];
  lampPositions.forEach(([x, z], index) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.9, 6), postMaterial);
    post.position.set(x, 0.45, z);
    post.castShadow = true;
    scene.add(post);
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), glowMaterial);
    lamp.position.set(x, 0.95, z);
    scene.add(lamp);
    if (enableLampLights && index < 2) {
      const light = new THREE.PointLight(0xffbd69, 0.55, 3.2, 2);
      light.position.set(x, 1.05, z);
      scene.add(light);
    }
  });

  const flowerPositions = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    flowerPositions.push([
      4.45 + Math.cos(angle) * (1.22 + (i % 2) * 0.16),
      1.5 + Math.sin(angle) * (1.22 + (i % 2) * 0.16),
    ]);
  }
  [[-3.9, 4.5], [-3.5, 4.7], [-4.3, 4.2], [-3.15, 4.3], [-4.6, 3.8], [-3.7, 3.9]].forEach((p) => flowerPositions.push(p));
  const stemMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.018, 0.028, 0.25, 5),
    new THREE.MeshStandardMaterial({ color: 0x2d733f, roughness: 1 }),
    flowerPositions.length,
  );
  const bloomMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.09, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }),
    flowerPositions.length,
  );
  const flowerMatrix = new THREE.Matrix4();
  const flowerColors = [0xf6c453, 0xf08ba5, 0xeee5ff, 0x8ccfed];
  flowerPositions.forEach(([x, z], index) => {
    flowerMatrix.makeTranslation(x, 0.14, z);
    stemMesh.setMatrixAt(index, flowerMatrix);
    flowerMatrix.makeTranslation(x, 0.31 + (index % 3) * 0.025, z);
    bloomMesh.setMatrixAt(index, flowerMatrix);
    bloomMesh.setColorAt(index, new THREE.Color(flowerColors[index % flowerColors.length]));
  });
  stemMesh.instanceMatrix.needsUpdate = true;
  bloomMesh.instanceMatrix.needsUpdate = true;
  bloomMesh.instanceColor.needsUpdate = true;
  stemMesh.castShadow = true;
  bloomMesh.castShadow = true;
  scene.add(stemMesh, bloomMesh);

  const fireflyPositions = new Float32Array(18 * 3);
  const fireflyBase = new Float32Array(18);
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.17;
    const radius = 4.4 + (i % 4) * 0.55;
    fireflyPositions[i * 3] = Math.sin(angle) * radius;
    fireflyPositions[i * 3 + 1] = fireflyBase[i] = 0.55 + (i % 5) * 0.28;
    fireflyPositions[i * 3 + 2] = Math.cos(angle) * radius;
  }
  const fireflyGeometry = new THREE.BufferGeometry();
  fireflyGeometry.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflies = new THREE.Points(
    fireflyGeometry,
    new THREE.PointsMaterial({ color: 0xffd36a, size: 0.075, transparent: true, opacity: 0.82, sizeAttenuation: true }),
  );
  scene.add(fireflies);

  return { water, waterJet, fireflies, fireflyBase };
}

function fitPalace(model) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const largestDimension = Math.max(size.x, size.y, size.z);
  const scale = largestDimension > 0 ? 6.8 / largestDimension : 1;
  model.scale.setScalar(scale);

  const scaledBounds = new THREE.Box3().setFromObject(model);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z + 0.35;
  model.position.y -= scaledBounds.min.y;
  model.rotation.y = Math.PI;

  const colorfulMaterials = new Map();
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const enhanced = materials.map((source) => {
      if (!source) return source;
      if (colorfulMaterials.has(source)) return colorfulMaterials.get(source);

      const material = source.clone();
      material.envMapIntensity = 0.82;
      material.roughness = Math.min(0.82, material.roughness ?? 0.82);
      material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vPalaceWorldPosition;")
          .replace(
            "#include <worldpos_vertex>",
            "#include <worldpos_vertex>\nvPalaceWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vPalaceWorldPosition;")
          .replace(
            "#include <opaque_fragment>",
            `float palaceHeight = smoothstep(0.35, 6.0, vPalaceWorldPosition.y);
            float palaceVariation = 0.5 + 0.5 * sin(vPalaceWorldPosition.x * 1.55 + vPalaceWorldPosition.y * 0.62);
            vec3 palaceRose = vec3(1.16, 0.86, 0.78);
            vec3 palaceBlue = vec3(0.76, 0.92, 1.18);
            vec3 palaceGold = vec3(1.18, 1.04, 0.69);
            vec3 palaceTint = mix(palaceRose, palaceBlue, palaceHeight);
            palaceTint = mix(palaceTint, palaceGold, palaceVariation * 0.28);
            outgoingLight *= mix(vec3(1.0), palaceTint, 0.38);
            float palaceLuma = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
            outgoingLight = mix(vec3(palaceLuma), outgoingLight, 1.24);
            #include <opaque_fragment>`,
          );
      };
      material.customProgramCacheKey = () => "zakkir-colorful-palace-v1";
      material.needsUpdate = true;
      colorfulMaterials.set(source, material);
      return material;
    });
    child.material = Array.isArray(child.material) ? enhanced : enhanced[0];
  });
}

function palaceIslandLayout(count) {
  if (count <= 1) return { scale: 1, positions: [[0, 0]] };
  if (count === 2) return { scale: 0.52, positions: [[-4.25, 0], [4.25, 0]] };
  if (count === 3) return { scale: 0.43, positions: [[-5.8, 0.6], [0, -0.45], [5.8, 0.6]] };
  if (count === 4) return { scale: 0.39, positions: [[-4.3, -2.7], [4.3, -2.7], [-4.3, 3.2], [4.3, 3.2]] };
  if (count === 5) return { scale: 0.35, positions: [[-5.5, -2.8], [0, -3.1], [5.5, -2.8], [-2.8, 3.1], [2.8, 3.1]] };
  if (count === 6) return { scale: 0.33, positions: [[-5.6, -2.8], [0, -3.1], [5.6, -2.8], [-5.6, 3.2], [0, 3.5], [5.6, 3.2]] };
  return { scale: 0.31, positions: [[-6.3, -3], [-2.1, -3.35], [2.1, -3.35], [6.3, -3], [-4.2, 3.1], [0, 3.55], [4.2, 3.1]] };
}

function createGarden(container, initialPalaceCount = 0) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9dcf1);
  scene.fog = new THREE.Fog(0xb9dcf1, 20, 42);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const cameraTarget = new THREE.Vector3(0, 2.15, 0);
  let orbitAngle = 0.72;
  let orbitRadius = 17;
  let userInteracting = false;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-label", "Interactive 3D garden with 0 palaces");
  renderer.domElement.setAttribute("role", "img");
  container.appendChild(renderer.domElement);

  const status = document.createElement("div");
  status.className = "garden-loading";
  status.setAttribute("role", "status");
  status.textContent = "Preparing palace…";
  container.appendChild(status);

  scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x315735, 2.1));
  const sunlight = new THREE.DirectionalLight(0xfff2d5, 3.1);
  sunlight.position.set(8, 13, 9);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -10;
  sunlight.shadow.camera.right = 10;
  sunlight.shadow.camera.top = 10;
  sunlight.shadow.camera.bottom = -10;
  scene.add(sunlight);

  const roseLight = new THREE.PointLight(0xff789f, 3.2, 11, 2);
  roseLight.position.set(-4.8, 3.1, 4.8);
  scene.add(roseLight);
  const blueLight = new THREE.PointLight(0x63aaff, 3.0, 11, 2);
  blueLight.position.set(4.8, 4.2, 2.4);
  scene.add(blueLight);
  const goldLight = new THREE.PointLight(0xffc95f, 2.5, 9, 2);
  goldLight.position.set(0, 2.3, 6.2);
  scene.add(goldLight);
  const loader = new GLTFLoader();
  const collection = new THREE.Group();
  scene.add(collection);
  let palace = null;
  let palaceCount = THREE.MathUtils.clamp(Math.floor(Number(initialPalaceCount) || 0), 0, 7);
  let islands = [];
  let gardenMotions = [];
  let loadingUrl = "";
  let disposed = false;
  let frameId = 0;
  let lastTime = performance.now();

  const updateCamera = () => {
    camera.position.set(Math.sin(orbitAngle) * orbitRadius, 7.2, Math.cos(orbitAngle) * orbitRadius);
    camera.lookAt(cameraTarget);
  };
  updateCamera();

  const clearIslands = () => {
    for (const island of islands) {
      collection.remove(island);
      disposeObject(island);
    }
    islands = [];
    gardenMotions = [];
  };

  const layoutIslands = () => {
    if (!palace) return;
    const visibleCount = Math.max(1, palaceCount);
    const layout = palaceIslandLayout(visibleCount);
    islands.forEach((island, index) => {
      island.visible = index < visibleCount;
      if (!island.visible) return;
      const [x, z] = layout.positions[index];
      const floatingY = 1.05 + (index % 2) * 0.32;
      island.userData.baseY = floatingY;
      island.position.set(x, floatingY, z);
      island.scale.setScalar(layout.scale);
      island.rotation.y = (index - (visibleCount - 1) / 2) * -0.08;
    });
    renderer.domElement.setAttribute(
      "aria-label",
      palaceCount === 0
        ? "Interactive 3D garden with a palace preview"
        : `Interactive 3D garden with ${palaceCount} ${palaceCount === 1 ? "palace" : "palaces"}`,
    );
  };

  const ensureIslandCount = (count) => {
    if (!palace) return;
    while (islands.length < count) {
      const index = islands.length;
      const island = new THREE.Group();
      const motion = addGardenBase(island, index === 0);
      const palaceCopy = palace.clone(true);
      island.add(palaceCopy);
      island.userData.floatPhase = index * 0.83;
      collection.add(island);
      islands.push(island);
      gardenMotions.push(motion);
    }
  };

  const buildIslands = () => {
    clearIslands();
    ensureIslandCount(Math.max(1, palaceCount));
    layoutIslands();
  };

  const setPalaceCount = (count) => {
    palaceCount = THREE.MathUtils.clamp(Math.floor(Number(count) || 0), 0, 7);
    ensureIslandCount(Math.max(1, palaceCount));
    layoutIslands();
  };

  function loadPalace(url) {
    if (!url || disposed || url === loadingUrl) return;
    loadingUrl = url;
    status.hidden = false;
    status.classList.remove("is-error");
    status.textContent = "Loading palace…";
    loader.load(
      url,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        if (palace) {
          clearIslands();
        }
        palace = gltf.scene;
        fitPalace(palace);
        buildIslands();
        status.hidden = true;
      },
      undefined,
      (error) => {
        console.error("Could not load Gothic palace model", error);
        const detail = error?.message
          || (error?.target?.status ? `HTTP ${error.target.status}` : "Network or file access error");
        status.classList.add("is-error");
        status.textContent = `The palace model could not be loaded: ${detail}`;
        try {
          globalThis.ReactNativeWebView?.postMessage(JSON.stringify({
            type: "garden-error",
            detail,
            url,
          }));
        } catch (_) {}
      },
    );
  }

  let pointerX = 0;
  const onPointerDown = (event) => {
    userInteracting = true;
    pointerX = event.clientX;
    renderer.domElement.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!userInteracting) return;
    const delta = event.clientX - pointerX;
    pointerX = event.clientX;
    orbitAngle -= delta * 0.008;
  };
  const onPointerUp = (event) => {
    userInteracting = false;
    renderer.domElement.releasePointerCapture?.(event.pointerId);
  };
  const onWheel = (event) => {
    event.preventDefault();
    orbitRadius = THREE.MathUtils.clamp(orbitRadius + event.deltaY * 0.012, 11, 24);
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const animate = (time) => {
    if (disposed) return;
    const delta = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    if (!userInteracting && !reducedMotion) orbitAngle += delta * 0.055;
    if (!reducedMotion) {
      const elapsed = time * 0.001;
      gardenMotions.forEach((gardenMotion, index) => {
        if (!islands[index]?.visible) return;
        gardenMotion.water.material.opacity = 0.73 + Math.sin(elapsed * 1.7 + index) * 0.07;
        gardenMotion.water.rotation.z += delta * 0.08;
        gardenMotion.waterJet.scale.y = 0.92 + Math.sin(elapsed * 2.4 + index) * 0.08;
        const positions = gardenMotion.fireflies.geometry.attributes.position;
        for (let i = 0; i < gardenMotion.fireflyBase.length; i += 1) {
          positions.setY(i, gardenMotion.fireflyBase[i] + Math.sin(elapsed * 0.75 + i * 1.9) * 0.11);
        }
        positions.needsUpdate = true;
        islands[index].position.y = islands[index].userData.baseY + Math.sin(elapsed * 0.55 + islands[index].userData.floatPhase) * 0.1;
      });
    }
    updateCamera();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };
  frameId = requestAnimationFrame(animate);

  loadPalace(palaceModelUrl || globalThis.__ZAKKIR_PALACE_MODEL_URL__ || "gothic_palace_optimized.glb");

  return {
    loadPalace,
    setPalaceCount,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      status.remove();
    },
  };
}

export function mountGarden(container, modelUrl, palaceCount = 0) {
  unmountGarden();
  if (!container) return;
  if (modelUrl) palaceModelUrl = modelUrl;
  try {
    activeGarden = createGarden(container, palaceCount);
  } catch (error) {
    console.error("Could not start the 3D garden", error);
    container.innerHTML = `<div class="garden-loading is-error" role="status">3D garden is unavailable on this device.</div>`;
  }
}

export function setModelUrl(url) {
  if (!url) return;
  palaceModelUrl = url;
  globalThis.__ZAKKIR_PALACE_MODEL_URL__ = url;
  activeGarden?.loadPalace(url);
}

export function setPalaceCount(count) {
  activeGarden?.setPalaceCount(count);
}

export function unmountGarden() {
  activeGarden?.dispose();
  activeGarden = null;
}
