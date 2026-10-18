import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createRoom(container, books, onReady, onFailure) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, .1, 100);
  camera.position.set(8, 6.6, 13);
  camera.lookAt(0, 2.6, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  // A locally generated studio environment gives metal and glaze real reflections.
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .28;
  environment.dispose();
  pmrem.dispose();
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.className = 'room-canvas';
  container.prepend(renderer.domElement);
  const room = new THREE.Group();
  scene.add(room);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let seed = 714;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...options });
  const cream = mat('#d8d4bf');
  const sageWall = mat('#c5c9b4');
  const ivory = new THREE.MeshPhysicalMaterial({ color: '#e6dfcd', roughness: .32, clearcoat: .35, clearcoatRoughness: .28 });
  const metal = mat('#364038', { metalness: .35, roughness: .55 });
  const dark = mat('#242e2b', { roughness: .55 });
  const brass = mat('#b19255', { metalness: .6, roughness: .36 });
  const white = mat('#eee7d9');
  const terracotta = mat('#9d5a3f');
  const canvasTexture = (width, height, draw) => {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
  };
  const woodTexture = canvasTexture(2048, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ae8051'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const y = random() * h;
      ctx.strokeStyle = `rgba(${random() > .5 ? '62,35,15' : '242,212,164'},${random() * .18})`;
      ctx.lineWidth = .3 + random() * 1.6;
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * .3, y + random() * 20, w * .7, y - random() * 20, w, y + random() * 6); ctx.stroke();
    }
  });
  const woodRelief = woodTexture.clone(); woodRelief.colorSpace = THREE.NoColorSpace;
  const wood = mat('#e0ccb0', { map: woodTexture, bumpMap: woodRelief, bumpScale: .018, roughness: .48 });
  const darkWood = mat('#9b7556', { map: woodTexture, bumpMap: woodRelief, bumpScale: .012, roughness: .6 });
  // Shared fine-scale relief stays subtle, even on high-density screens.
  const grain = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18000; i++) {
      const value = 100 + Math.floor(random() * 56);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(random() * w, random() * h, 1, 1);
    }
  });
  grain.colorSpace = THREE.NoColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(4, 4);
  for (const material of [cream, sageWall, terracotta]) { material.bumpMap = grain; material.bumpScale = .012; }
  const fabric = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#aaa08a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 4) {
      ctx.fillStyle = i % 8 ? '#c5bba5' : '#8c826e'; ctx.fillRect(i, 0, 1, h);
      ctx.fillStyle = i % 8 ? '#b9ae98' : '#958b77'; ctx.fillRect(0, i, w, 1);
    }
  });
  fabric.colorSpace = THREE.NoColorSpace;
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
  fabric.repeat.set(3, 2);
  const geometries = new Map();
  function box(w, h, d, material, x, y, z, parent = room, rounded = 0) {
    if (!rounded && (material === wood || material === darkWood || material === metal)) rounded = Math.min(.012, w / 5, h / 5, d / 5);
    const key = `${w}/${h}/${d}/${rounded}`;
    if (!geometries.has(key)) geometries.set(key, rounded ? new RoundedBoxGeometry(w, h, d, 3, rounded) : new THREE.BoxGeometry(w, h, d));
    const geometry = geometries.get(key);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function cylinder(rt, rb, h, material, x, y, z, parent = room) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 48), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sphere(r, material, x, y, z, parent = room) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function tube(points, radius, material, parent = room) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), material);
    parent.add(mesh); mesh.castShadow = true; return mesh;
  }
  // A cutaway room follows the window / desk / bookshelf arrangement of the supplied reference.
  box(7.5, .22, 4.65, darkWood, 0, -.12, .2);
  const floorTexture = woodTexture.clone();
  floorTexture.center.set(.5, .5); floorTexture.rotation = Math.PI / 2;
  const floorRelief = floorTexture.clone(); floorRelief.colorSpace = THREE.NoColorSpace;
  const floorMaterials = ['#dfc9a8', '#cbb18e', '#d5bb97', '#e4ceb0'].map(color => mat(color, { map: floorTexture, bumpMap: floorRelief, bumpScale: .012, roughness: .57 }));
  for (let i = 0; i < 17; i++) {
    // Offset the end joints, as in a real timber floor.
    let start = -2.1;
    const firstLength = i % 2 ? .78 : 1.53;
    for (let j = 0; start < 2.49; j++) {
      const length = Math.min(j === 0 ? firstLength : 1.53, 2.5 - start);
      box(.431, .035, length - .012, floorMaterials[(i + j) % 4], -3.52 + i * .44, .012, start + length / 2, room, .005);
      start += length;
    }
  }
  box(7.5, 5.15, .13, cream, 0, 2.55, -2.08);
  box(.13, 5.15, 4.65, sageWall, -3.77, 2.55, .2);
  box(7.4, .14, .08, ivory, 0, .12, -1.96);
  box(.08, .14, 4.5, ivory, -3.67, .12, .2);
  // Tall, luminous window with a softly painted outdoor view.
  const viewTexture = canvasTexture(1024, 1536, (ctx, w, h) => {
    ctx.scale(2, 2); w /= 2; h /= 2;
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#bed4c9'); sky.addColorStop(.7, '#f0eed4'); sky.addColorStop(1, '#a7b899');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 75; i++) {
      ctx.fillStyle = `rgba(94,126,103,${.025 + random() * .09})`;
      ctx.beginPath(); ctx.ellipse(random() * w, h * (.5 + random() * .6), 25 + random() * 90, 50 + random() * 130, 0, 0, Math.PI * 2); ctx.fill();
    }
  });
  box(2.45, 3.65, .13, ivory, -1.96, 3.06, -1.91);
  const windowMaterial = new THREE.MeshBasicMaterial({ map: viewTexture });
  box(2.23, 3.43, .02, windowMaterial, -1.96, 3.06, -1.831);
  for (const x of [-3.14, -.78]) box(.1, 3.6, .17, white, x, 3.06, -1.77);
  for (const y of [1.29, 3.04, 4.83]) box(2.46, .09, .17, white, -1.96, y, -1.77);
  box(.055, 3.5, .12, white, -1.96, 3.06, -1.77);
  box(2.65, .12, .44, wood, -1.96, 1.27, -1.68);
  // Subtle sunlight stripes on the floor.
  const sunPatch = mat('#f9df9c', { transparent: true, opacity: .15, depthWrite: false });
  for (let i = 0; i < 3; i++) { const patch = box(.6, .005, 1.8, sunPatch, -.8 + i * .65, .04, 1.15); patch.rotation.y = -.4; patch.castShadow = false; }
  // Plant construction: curved stems and individually oriented leaves.
  const leafTexture = canvasTexture(128, 256, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#8c9c6e'); gradient.addColorStop(.48, '#d1d9a7'); gradient.addColorStop(.52, '#a4b37d'); gradient.addColorStop(1, '#6b8259');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#dfe7b677'; ctx.lineWidth = 1.5;
    for (let y = 24; y < h; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y - 32); ctx.lineTo(w / 2, y); ctx.lineTo(w, y - 32); ctx.stroke();
    }
    ctx.fillStyle = '#e1e5b6'; ctx.fillRect(w / 2 - 1, 0, 2, h);
  });
  const leafMats = ['#526c3b', '#6c8849', '#809951', '#455f35'].map(c => mat(c, { map: leafTexture, roughness: .48, side: THREE.DoubleSide }));
  const stemMat = mat('#50603a');
  const leafGeometry = new THREE.PlaneGeometry(2, 2, 8, 12);
  const leafPositions = leafGeometry.attributes.position;
  for (let i = 0; i < leafPositions.count; i++) {
    const x = leafPositions.getX(i), y = leafPositions.getY(i);
    const taper = Math.pow(Math.max(0, Math.sin((y + 1) * Math.PI / 2)), .85);
    leafPositions.setXYZ(i, x * taper, y, .22 * x * x * taper + .18 * y * y);
  }
  leafGeometry.computeVertexNormals();
  function leaf(x, y, z, size, angle, parent) {
    const mesh = new THREE.Mesh(leafGeometry, leafMats[Math.floor(random() * leafMats.length)]);
    mesh.position.set(x, y, z); mesh.scale.set(size * .48, size, size);
    mesh.rotation.set(random() * .8 - .4, random() * Math.PI, angle);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function plant(x, y, z, scale = 1, hanging = false) {
    const group = new THREE.Group(); group.position.set(x, y, z); group.scale.setScalar(scale); room.add(group);
    cylinder(.23, .17, .37, terracotta, 0, .19, 0, group);
    cylinder(.25, .25, .055, terracotta, 0, .35, 0, group);
    cylinder(.21, .21, .02, mat('#3d3427'), 0, .375, 0, group);
    for (let i = 0; i < (hanging ? 8 : 11); i++) {
      const angle = i * 2.4, reach = .22 + random() * .3, height = .3 + random() * .55;
      const end = [Math.cos(angle) * reach, .4 + height, Math.sin(angle) * reach];
      tube([[0, .35, 0], [end[0] * .3, .5 + height * .5, end[2] * .3], end], .009, stemMat, group);
      leaf(...end, .19 + random() * .09, -Math.cos(angle) * .9, group);
      leaf(end[0] * .65, .48 + height * .4, end[2] * .65, .16, Math.cos(angle) * 1.2, group);
    }
    if (hanging) for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * .17, length = .6 + random() * 1.5;
      const points = [[0, .4, 0], [dx, .3, .3], [dx * 1.6, -.2, .45], [dx * 1.9 + .12, -length, .48]];
      tube(points, .012, stemMat, group);
      for (let j = 0; j < 9; j++) {
        const t = j / 8;
        leaf(dx * (1 + t) + Math.sin(j * 2) * .13, .2 - t * length, .43 + random() * .1, .13 + random() * .06, (j % 2 ? 1 : -1) * .8, group);
      }
    }
    return group;
  }
  box(2.8, .12, .52, wood, -1.95, 4.98, -1.68);
  plant(-2.8, 5.05, -1.64, .68, true);
  plant(-1.1, 5.05, -1.64, .75, true);
  // Shelving: light framing, warm wood boards, two full rows of readable books.
  const shelfX = 1.72;
  for (const x of [.03, 3.4]) {
    box(.095, 4.35, .095, metal, x, 2.18, -.15);
    box(.095, 4.35, .095, metal, x, 2.18, -1.36);
  }
  for (const y of [.22, 1.48, 2.77, 4.13]) box(3.55, .12, 1.35, wood, shelfX, y, -.76);
  box(3.31, 1.07, .85, mat('#5f6653'), 1.72, .82, -.87, room, .025);
  for (const x of [.87, 2.57]) {
    box(1.58, 1, .04, mat('#69705b'), x, .82, -.42, room, .015);
    box(.3, .035, .07, brass, x, 1.14, -.365, room, .014);
  }
  // Folio labels printed on textured book spines.
  const bookObjects = [];
  const pageTexture = canvasTexture(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#e7dcc2'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3 + Math.floor(random() * 4)) {
      ctx.fillStyle = `rgba(100,79,48,${.1 + random() * .16})`;
      ctx.fillRect(0, y, w, 1);
    }
  });
  const pageEdges = mat('#fff7e4', { map: pageTexture, roughness: .95 });
  const paper = mat('#e7dcc2', { roughness: .95 });
  books.forEach((book, index) => {
    const row = index < 6 ? 0 : 1, column = index % 6;
    const width = [.43, .47, .39, .49, .4, .44][column];
    const height = [1.04, 1.13, .98, 1.1, 1.04, 1.14][column] - row * .04;
    const group = new THREE.Group();
    const x = .29 + column * .53;
    const base = row === 0 ? 2.84 : 1.55;
    group.position.set(x, base + height / 2, -.67);
    room.add(group);
    const cover = mat(book.color, { bumpMap: fabric, bumpScale: .006, roughness: .68 });
    box(width - .055, height - .065, .78, [pageEdges, pageEdges, paper, paper, pageEdges, pageEdges], 0, 0, -.02, group);
    box(.028, height, .86, cover, -width / 2 + .014, 0, 0, group, .008);
    box(.028, height, .86, cover, width / 2 - .014, 0, 0, group, .008);
    const tex = canvasTexture(512, 1536, (ctx, w, h) => {
      ctx.scale(2, 2); w /= 2; h /= 2;
      ctx.fillStyle = book.color; ctx.fillRect(0, 0, w, h);
      for (let j = 0; j < 9000; j++) { ctx.fillStyle = `rgba(255,255,255,${random() * .05})`; ctx.fillRect(random() * w, random() * h, 1, 2); }
      const shade = ctx.createLinearGradient(0, 0, w, 0); shade.addColorStop(0, '#00000035'); shade.addColorStop(.2, '#ffffff09'); shade.addColorStop(.8, '#ffffff00'); shade.addColorStop(1, '#00000035'); ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e5d2a080'; ctx.lineWidth = 2;
      for (const yy of [43, 52, 704, 713]) { ctx.beginPath(); ctx.moveTo(25, yy); ctx.lineTo(w - 25, yy); ctx.stroke(); }
      ctx.fillStyle = '#f3e8cd'; ctx.textAlign = 'center'; ctx.font = '28px Georgia'; ctx.fillText(book.number, w / 2, 105);
      ctx.save(); ctx.translate(w / 2, 390); ctx.rotate(-Math.PI / 2); ctx.font = 'bold 39px Georgia'; ctx.fillText(book.spine, 0, 13, 480); ctx.restore();
      ctx.font = '34px Georgia'; ctx.fillText('✦', w / 2, 664);
    });
    const spineMaterial = mat('#ffffff', { map: tex, bumpMap: fabric, bumpScale: .004, roughness: .62 });
    const spine = box(width, height, .07, [cover, cover, cover, cover, spineMaterial, cover], 0, 0, .42, group, .018);
    for (const y of [-height * .42, height * .42]) {
      box(width * .92, .014, .012, brass, 0, y, .458, group, .004);
    }
    const ribbon = box(.035, .16, .015, mat('#c7ac76'), width * .24, -height / 2 - .045, .39, group);
    ribbon.rotation.z = -.06;
    bookObjects.push({ group, spine, width, height, baseZ: -.67, baseY: group.position.y, book });
  });
  // Objects above the shelf are decorative only.
  plant(.5, 4.2, -.83, .8, true);
  plant(3.02, 4.2, -.85, .65);
  for (let i = 0; i < 3; i++) {
    const b = box(.83 + i * .07, .12, .65, mat(['#9f704e', '#435f59', '#c1ac83'][i]), 2.12, 4.25 + i * .13, -.77, room, .012); b.rotation.y = i % 2 ? -.06 : .04;
    box(.73 + i * .07, .065, .02, white, 2.12, 4.25 + i * .13, -.435);
  }
  cylinder(.15, .18, .39, ivory, 1.27, 4.39, -.83);
  const vaseTop = sphere(.17, ivory, 1.27, 4.59, -.83); vaseTop.scale.y = 1.15;
  cylinder(.07, .1, .23, ivory, 1.27, 4.78, -.83);
  // Desk and drawers, following the reference's timber desktop and dark cabinetry.
  box(3.55, .14, 1.68, wood, -1.78, 1.66, .67, room, .045);
  for (const x of [-3.12, -.47]) {
    box(.7, 1.5, 1.33, dark, x, .8, .7, room, .025);
    for (let i = 0; i < 3; i++) {
      box(.64, .44, .04, mat('#414941'), x, .37 + i * .46, 1.38, room, .012);
      box(.28, .035, .045, metal, x, .49 + i * .46, 1.415, room, .012);
    }
  }
  // Monitor with a custom illustrated woodland wallpaper.
  const screenTex = canvasTexture(1536, 900, (ctx, w, h) => {
    ctx.scale(1.5, 1.5); w /= 1.5; h /= 1.5;
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#b8cdb6'); sky.addColorStop(1, '#445f53'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#eef0d4'; ctx.beginPath(); ctx.arc(w * .7, h * .29, 68, 0, Math.PI * 2); ctx.fill();
    for (let layer = 0; layer < 4; layer++) {
      ctx.fillStyle = ['#91ac91', '#6f917d', '#456f60', '#294d44'][layer];
      ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * (.5 + layer * .1) + Math.sin(x * .007 + layer * 2) * 55); ctx.lineTo(w, h); ctx.fill();
      for (let i = 0; i < 15; i++) { const x = random() * w, y = h * (.53 + layer * .1) + Math.sin(x * .007 + layer * 2) * 55, size = 45 + random() * 90; ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x - size * .23, y + 20); ctx.lineTo(x + size * .23, y + 20); ctx.fill(); }
    }
    ctx.fillStyle = '#ffffffdd'; ctx.font = '20px monospace'; ctx.fillText('make something meaningful.', 36, h - 40);
  });
  box(1.83, 1.12, .1, dark, -1.76, 2.5, .11, room, .035);
  box(1.69, .96, .014, new THREE.MeshBasicMaterial({ map: screenTex }), -1.76, 2.52, .17);
  box(.09, .3, .09, metal, -1.76, 1.92, .11);
  box(.65, .04, .36, metal, -1.76, 1.76, .18, room, .02);
  box(2.03, .018, .66, mat('#41483f'), -1.68, 1.743, .96, room, .06);
  box(1.14, .045, .36, dark, -1.88, 1.78, .95, room, .02);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 13; col++) {
    box(.069, .018, .057, mat((row + col) % 7 === 0 ? '#a9b5a0' : '#65766b'), -2.39 + col * .082, 1.815, .82 + row * .079, room, .007);
  }
  const mouse = sphere(.13, dark, -.94, 1.79, .98); mouse.scale.set(.6, .34, 1);
  plant(-.4, 1.74, .04, .54);
  plant(-3.15, 1.74, .13, .55, true);
  // Warm articulated desk lamp.
  const lampGroup = new THREE.Group(); room.add(lampGroup);
  cylinder(.19, .2, .04, metal, -2.98, 1.75, .91, lampGroup);
  tube([[-2.98, 1.78, .91], [-3.05, 2.3, .91], [-2.77, 2.69, .75], [-2.58, 2.65, .7]], .026, brass, lampGroup);
  const lampHead = new THREE.Group();
  lampHead.position.set(-2.58, 2.57, .7);
  const beamDirection = new THREE.Vector3(.35, -1, .18).normalize();
  lampHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), beamDirection);
  lampGroup.add(lampHead);
  // An open shade lets the light leave through the aperture instead of a solid cap.
  const shadeGeometry = new THREE.CylinderGeometry(.08, .23, .23, 32, 1, true);
  const shade = new THREE.Mesh(shadeGeometry, mat('#c6a165', { metalness: .65, roughness: .3, side: THREE.DoubleSide }));
  shade.castShadow = true; shade.receiveShadow = true; lampHead.add(shade);
  const shadeLining = new THREE.Mesh(
    new THREE.CylinderGeometry(.074, .224, .225, 32, 1, true),
    mat('#eadcb7', { side: THREE.BackSide, roughness: .6, emissive: '#ffcf84', emissiveIntensity: .45 }),
  );
  shadeLining.receiveShadow = true; lampHead.add(shadeLining);
  const bulbMaterial = mat('#ffe7ad', { emissive: '#ffd287', emissiveIntensity: 4 });
  const bulb = sphere(.065, bulbMaterial, 0, -.09, 0, lampHead);
  // The emitting bulb must not shadow its own light.
  bulb.castShadow = false;
  lampHead.updateWorldMatrix(true, false);
  const aperture = lampHead.localToWorld(new THREE.Vector3(0, -.155, 0));
  const lamp = new THREE.SpotLight('#ffd49b', 9, 6.5, Math.PI * .31, .85, 2);
  lamp.position.copy(aperture);
  lamp.target.position.copy(aperture).add(beamDirection);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = .04;
  lamp.shadow.camera.far = 6.5;
  lamp.shadow.bias = -.0001;
  lamp.shadow.normalBias = .012;
  scene.add(lamp, lamp.target);
  const glowTexture = canvasTexture(64, 64, (ctx) => {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, '#ffe3a570'); gradient.addColorStop(.25, '#ffd28a28'); gradient.addColorStop(1, '#ffd28a00');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  });
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  lampGlow.position.copy(aperture); lampGlow.scale.set(.5, .5, 1); room.add(lampGlow);
  const warmLight = new THREE.Color('#ffd49b'), coolingLight = new THREE.Color('#ff9e46');
  const unlitBulb = new THREE.Color('#b9b3a4'), litBulb = new THREE.Color('#ffe7ad');
  // A small thermal lag models a filament warming and cooling, without flicker.
  let lampLevel = 1, lampTarget = 1;
  const viewToLamp = camera.position.clone().sub(aperture).normalize();
  const glowVisibility = THREE.MathUtils.smoothstep(viewToLamp.dot(beamDirection), -.25, .5);
  function updateLamp(delta) {
    if (reducedMotion.matches) lampLevel = lampTarget;
    else {
      const responseTime = lampTarget > lampLevel ? .075 : .11;
      lampLevel = THREE.MathUtils.lerp(lampTarget, lampLevel, Math.exp(-delta / responseTime));
      if (Math.abs(lampLevel - lampTarget) < .001) lampLevel = lampTarget;
    }
    // Inverse-square distance decay and a feathered cone are handled by SpotLight.
    const power = lampLevel * lampLevel;
    lamp.intensity = 9 * power;
    lamp.color.copy(coolingLight).lerp(warmLight, lampLevel);
    bulbMaterial.emissive.copy(lamp.color);
    bulbMaterial.emissiveIntensity = 4 * power;
    shadeLining.material.emissiveIntensity = .45 * power;
    bulbMaterial.color.copy(unlitBulb).lerp(litBulb, lampLevel);
    lampGlow.material.color.copy(lamp.color);
    lampGlow.material.opacity = power * glowVisibility;
    lampGlow.scale.setScalar(.3 + .2 * lampLevel);
    lampGlow.visible = lampLevel > 0;
    // Keep the shadow-casting light in the shader as it fades, avoiding recompilation.
  }
  updateLamp(0);
  // Mug, notebook, and pencil.
  cylinder(.105, .09, .2, ivory, -2.77, 1.85, 1.2);
  cylinder(.085, .085, .005, mat('#4a3426'), -2.77, 1.955, 1.2);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.07, .017, 16, 40), ivory); handle.position.set(-2.66, 1.85, 1.2); handle.castShadow = true; room.add(handle);
  const mugRim = new THREE.Mesh(new THREE.TorusGeometry(.096, .009, 12, 48), ivory);
  mugRim.rotation.x = Math.PI / 2; mugRim.position.set(-2.77, 1.952, 1.2); room.add(mugRim);
  box(.4, .045, .53, mat('#ab7459'), -.35, 1.77, 1.08, room, .008);
  const pencil = cylinder(.013, .013, .43, brass, -.33, 1.81, 1.08); pencil.rotation.z = Math.PI / 2; pencil.rotation.y = -.4;
  // Framed botanical print on the side wall.
  const artTexture = canvasTexture(900, 1260, (ctx, w, h) => {
    ctx.scale(3, 3); w /= 3; h /= 3;
    ctx.fillStyle = '#e5dcc0'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#5c6845'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) { const x = 70 + i * 78; ctx.beginPath(); ctx.moveTo(x, 350); ctx.quadraticCurveTo(x - 22, 220, x + 10, 90 + i * 30); ctx.stroke(); for (let j = 0; j < 6; j++) { ctx.fillStyle = ['#657449', '#8e9968', '#475e3c'][i]; ctx.beginPath(); ctx.ellipse(x + (j % 2 ? 15 : -15), 130 + j * 33, 12, 27, j % 2 ? .7 : -.7, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = '#80785e'; ctx.font = '12px Georgia'; ctx.textAlign = 'center'; ctx.fillText('F L O R A  /  S T U D Y  N ° 0 1', w / 2, 392);
  });
  const frame = new THREE.Group(); frame.position.set(-3.66, 3.18, .48); frame.rotation.y = Math.PI / 2; room.add(frame);
  box(1.02, 1.4, .07, darkWood, 0, 0, 0, frame);
  box(.89, 1.27, .012, mat('#ffffff', { map: artTexture }), 0, 0, .045, frame);
  // Small floor plant and woven rug anchor the open edge of the room.
  plant(2.9, .05, 1.75, 1.25);
  const rugMaterial = mat('#c1b393', { bumpMap: fabric, bumpScale: .025, roughness: 1 });
  box(2.95, .025, 1.38, rugMaterial, -.4, .055, 1.7, room, .01);
  const rugThread = mat('#d3c7ac', { bumpMap: fabric, bumpScale: .015, roughness: 1 });
  for (let i = 0; i < 32; i++) box(.016, .004, 1.26, rugThread, -1.8 + i * .09, .07, 1.7);
  for (let i = 0; i < 44; i++) for (const z of [.97, 2.43]) {
    box(.013, .012, .12, rugThread, -1.82 + i * .066, .055, z, room, .004);
  }
  // Desk stool keeps the bookshelf fully visible.
  cylinder(.4, .4, .1, mat('#646d55', { bumpMap: fabric, bumpScale: .018 }), -1.6, .96, 2.1);
  const seatSeam = new THREE.Mesh(new THREE.TorusGeometry(.39, .008, 8, 64), mat('#8a9174'));
  seatSeam.rotation.x = Math.PI / 2; seatSeam.position.set(-1.6, 1.008, 2.1); room.add(seatSeam);
  for (const [dx, dz] of [[-.23, -.23], [.23, -.23], [-.23, .23], [.23, .23]]) cylinder(.035, .045, .88, darkWood, -1.6 + dx, .49, 2.1 + dz);
  // Soft studio illumination and late-afternoon sunlight.
  const ambient = new THREE.AmbientLight('#fff2d4', .5); scene.add(ambient);
  const hemisphere = new THREE.HemisphereLight('#f5f0d8', '#8b8872', 1.25); scene.add(hemisphere);
  const sunlight = new THREE.DirectionalLight('#ffe7bd', 2.6);
  sunlight.position.set(-3, 8, 5); sunlight.castShadow = true;
  sunlight.target.position.set(0, 2, 0);
  const shadowSize = Math.min(renderer.capabilities.maxTextureSize, window.innerWidth <= 760 ? 2048 : 4096);
  sunlight.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sunlight.shadow.camera, { left: -5.8, right: 5.8, top: 5.4, bottom: -5, near: .5, far: 20 });
  sunlight.shadow.normalBias = .018; sunlight.shadow.bias = -.00008;
  scene.add(sunlight, sunlight.target);
  const fill = new THREE.DirectionalLight('#edf2df', .85); fill.position.set(5, 4, 3); scene.add(fill);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .11 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.245; shadow.receiveShadow = true; scene.add(shadow);

  let activeBook = null, frameId, previousFrameTime = 0;
  const hits = document.getElementById('book-targets');
  const lampHit = document.getElementById('lamp-toggle');
  const lampBounds = new THREE.Box3().setFromObject(lampGroup);
  function projectTargets() {
    const w = container.clientWidth, h = container.clientHeight;
    bookObjects.forEach(({ group, width, height, book }) => {
      const points = [new THREE.Vector3(-width / 2, -height / 2, .46), new THREE.Vector3(width / 2, -height / 2, .46), new THREE.Vector3(width / 2, height / 2, .46), new THREE.Vector3(-width / 2, height / 2, .46)];
      // Target positions stay on the resting spines so a pulling book cannot trigger hover flicker.
      points.forEach(p => { p.add(new THREE.Vector3(group.position.x, group.userData.baseY, -.67)); p.project(camera); p.set((p.x + 1) * w / 2, (-p.y + 1) * h / 2, 0); });
      const minX = Math.min(...points.map(p => p.x)), minY = Math.min(...points.map(p => p.y));
      const maxX = Math.max(...points.map(p => p.x)), maxY = Math.max(...points.map(p => p.y));
      const button = hits.querySelector(`[data-book="${book.id}"]`);
      if (button) { Object.assign(button.style, { left: `${minX - 1}px`, top: `${minY - 1}px`, width: `${maxX - minX + 2}px`, height: `${maxY - minY + 2}px` }); }
    });
    const corners = [];
    for (const x of [lampBounds.min.x, lampBounds.max.x])
      for (const y of [lampBounds.min.y, lampBounds.max.y])
        for (const z of [lampBounds.min.z, lampBounds.max.z]) {
          const p = new THREE.Vector3(x, y, z).project(camera);
          corners.push({ x: (p.x + 1) * w / 2, y: (1 - p.y) * h / 2 });
        }
    const left = Math.min(...corners.map(p => p.x)), right = Math.max(...corners.map(p => p.x));
    const top = Math.min(...corners.map(p => p.y)), bottom = Math.max(...corners.map(p => p.y));
    const hitWidth = Math.max(44, right - left + 12), hitHeight = Math.max(44, bottom - top + 12);
    Object.assign(lampHit.style, { left: `${(left + right - hitWidth) / 2}px`, top: `${(top + bottom - hitHeight) / 2}px`, width: `${hitWidth}px`, height: `${hitHeight}px` });
  }
  bookObjects.forEach(o => o.group.userData.baseY = o.baseY);
  function render(time = 0) {
    const delta = Math.min(Math.max((time - previousFrameTime) / 1000, 0), .1);
    previousFrameTime = time;
    updateLamp(delta);
    let booksMoving = false;
    for (const object of bookObjects) {
      const selected = activeBook === object.book.id;
      const target = object.baseZ + (selected ? .36 : 0);
      const tilt = reducedMotion.matches ? 0 : selected ? -.045 : 0;
      const oldZ = object.group.position.z, oldTilt = object.group.rotation.x;
      const blend = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / .08);
      object.group.position.z = THREE.MathUtils.lerp(oldZ, target, blend);
      object.group.rotation.x = THREE.MathUtils.lerp(oldTilt, tilt, blend);
      if (Math.abs(object.group.position.z - target) < .0005) object.group.position.z = target;
      if (Math.abs(object.group.rotation.x - tilt) < .0001) object.group.rotation.x = tilt;
      if (oldZ !== object.group.position.z || oldTilt !== object.group.rotation.x) renderer.shadowMap.needsUpdate = true;
      booksMoving ||= object.group.position.z !== target || object.group.rotation.x !== tilt;
    }
    renderer.render(scene, camera);
    // Static lighting changes reuse shadow maps; stop drawing once motion settles.
    if ((booksMoving || lampLevel !== lampTarget) && !document.hidden) frameId = requestAnimationFrame(render);
    else frameId = null;
  }
  function requestRender() {
    if (!frameId) {
      previousFrameTime = performance.now();
      frameId = requestAnimationFrame(render);
    }
  }
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    // Supersample standard displays too, with a pixel budget for large screens.
    const compact = window.innerWidth <= 760;
    const desiredRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), compact ? 2 : 2.5);
    const pixelBudget = compact ? 1600000 : 5000000;
    const ratio = Math.min(desiredRatio, Math.sqrt(pixelBudget / (w * h)), renderer.capabilities.maxTextureSize / Math.max(w, h));
    renderer.setPixelRatio(ratio);
    const aspect = w / h;
    const verticalSize = Math.max(8.6, 10.8 / aspect);
    camera.left = -verticalSize * aspect / 2; camera.right = verticalSize * aspect / 2;
    camera.top = verticalSize / 2; camera.bottom = -verticalSize / 2;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(); renderer.setSize(w, h);
    projectTargets(); requestRender();
  }
  const observer = new ResizeObserver(resize); observer.observe(container);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestRender(); });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(frameId); onFailure(); });
  resize();
  requestAnimationFrame(() => { onReady(); projectTargets(); });
  return {
    hover(id) { activeBook = id; requestRender(); },
    setLamp(on) {
      lampTarget = on ? 1 : 0;
      if (reducedMotion.matches) updateLamp(0);
      requestRender();
    },
    setTheme(theme) {
      const night = theme === 'dark';
      scene.environmentIntensity = night ? .1 : .28;
      ambient.intensity = night ? .22 : .5;
      ambient.color.set(night ? '#b8cbe0' : '#fff2d4');
      hemisphere.intensity = night ? .5 : 1.25;
      hemisphere.color.set(night ? '#9aafd0' : '#f5f0d8');
      hemisphere.groundColor.set(night ? '#343d40' : '#8b8872');
      sunlight.intensity = night ? .45 : 2.6;
      sunlight.color.set(night ? '#9eb8e4' : '#ffe7bd');
      fill.intensity = night ? .3 : .85;
      fill.color.set(night ? '#b4c9e7' : '#edf2df');
      windowMaterial.color.set(night ? '#415575' : '#ffffff');
      sunPatch.opacity = night ? 0 : .15;
      requestRender();
    },
    resize, renderer, scene,
  };
}
