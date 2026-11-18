/* ZAMIN FK ARENA — THE CROWN
 * Premium architectural replacement for the procedural stadium shell.
 * The pitch, seat assignments, fan meshes, live data and city remain owned by the original app.
 * This module replaces only the old stadium architecture and adds a new landmark exterior.
 */
(function () {
  "use strict";
  function build(api) {
    const { THREE, scene, PW, PH, seats, ROW_D, ROW_H, rrLen, rrPoint } = api;
    if (!THREE || !scene || !seats || !seats.length) throw new Error("ZFK premium stadium: missing scene inputs");

    const root = new THREE.Group();
    root.name = "ZFK_CROWN_ARENA_PREMIUM_ARCHITECTURE";
    scene.add(root);

    const R = seats[seats.length - 1].ring + 1;
    const a = PW / 2 + 9 + R * ROW_D;
    const b = PH / 2 + 9 + R * ROW_D;
    const r = 10 + R * ROW_D;
    const perimeter = rrLen(a, b, r);
    const samples = Math.max(420, Math.ceil(perimeter / 1.6));
    const BLUE = 0x1557d6, NAVY = 0x071a3d, GOLD = 0xd8b45b;
    const STEEL = 0x9eabbc, GLASS = 0x15375b;

    const mat = (color, metalness, roughness, extra) =>
      new THREE.MeshStandardMaterial(Object.assign({ color, metalness, roughness }, extra || {}));
    const concrete = mat(0xcbd3dc, 0.22, 0.72);
    const darkConcrete = mat(0x26364c, 0.36, 0.55);
    const blueMetal = mat(0x123d91, 0.72, 0.3);
    const goldMetal = mat(GOLD, 0.82, 0.24);
    const steel = mat(STEEL, 0.82, 0.28);
    const glass = new THREE.MeshPhysicalMaterial({
      color: GLASS, metalness: 0.28, roughness: 0.12, transparent: true,
      opacity: 0.68, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xe8edf4, metalness: 0.68, roughness: 0.28,
      side: THREE.DoubleSide, envMapIntensity: 1.1
    });
    const roofUnderside = mat(0x142b4f, 0.62, 0.36, { side: THREE.DoubleSide });
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x4da8ff });
    const goldGlow = new THREE.MeshBasicMaterial({ color: 0xffd77a });

    function point(t, d) {
      const len = rrLen(a + d, b + d, r + d);
      const p = rrPoint(a + d, b + d, r + d, ((t % 1) + 1) % 1 * len);
      return p;
    }
    function beam(p1, p2, width, depth, material, parent = root) {
      const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
      const delta = new THREE.Vector3().subVectors(v2, v1);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, delta.length(), depth), material);
      mesh.position.copy(v1).add(v2).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      parent.add(mesh);
      return mesh;
    }
    function ringSurface(d0, y0, d1, y1, material, segments = samples, parent = root) {
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        for (const [d, y] of [[d0, y0], [d1, y1]]) {
          const p = point(t, d);
          pos.push(p[0], y, p[1]); uv.push(t * 18, d * 0.12);
        }
      }
      for (let i = 0; i < segments; i++) {
        const k = i * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, material); mesh.receiveShadow = true; parent.add(mesh);
      return mesh;
    }
    function verticalBand(d, y0, y1, material, segments = samples) {
      const pos = [], idx = [];
      for (let i = 0; i <= segments; i++) {
        const p = point(i / segments, d);
        pos.push(p[0], y0, p[1], p[0], y1, p[1]);
      }
      for (let i = 0; i < segments; i++) {
        const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, material); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
      return mesh;
    }

    // A deep, sculpted outer plinth gives the arena a monumental silhouette.
    ringSurface(5.2, 0.2, 8.8, 1.0, concrete);
    ringSurface(7.8, 1.0, 8.8, 7.8, darkConcrete);
    ringSurface(7.8, 7.8, 8.2, 8.3, goldMetal);
    ringSurface(7.9, 8.3, 8.2, 23.5, glass);
    ringSurface(8.2, 23.5, 9.4, 25.0, blueMetal);
    ringSurface(9.2, 25.0, 9.5, 26.0, goldMetal);
    ringSurface(8.9, 26.0, 9.6, 27.2, darkConcrete);

    // Architectural fins: repeated angled blades catch the stadium light.
    const finGeo = new THREE.BoxGeometry(0.72, 17.2, 1.05);
    const finCount = Math.floor(perimeter / 3.15);
    const fins = new THREE.InstancedMesh(finGeo, steel, finCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < finCount; i++) {
      const t = i / finCount, p = point(t, 9.1);
      const tangent = point(t + 0.001, 9.1);
      const angle = Math.atan2(tangent[1] - p[1], tangent[0] - p[0]);
      dummy.position.set(p[0], 16.2, p[1]);
      dummy.rotation.set(0, -angle, (i % 2 ? 1 : -1) * 0.035);
      dummy.scale.set(1, 1, 1); dummy.updateMatrix(); fins.setMatrixAt(i, dummy.matrix);
      fins.setColorAt(i, new THREE.Color(i % 5 === 0 ? 0xc7d5e8 : 0x8394aa));
    }
    root.add(fins);

    // Continuous illuminated belt: the signature ZAMIN blue/gold line.
    ringSurface(9.52, 22.8, 9.7, 23.2, ledMat);
    ringSurface(9.55, 7.5, 9.72, 7.72, goldGlow);

    // Four monumental entry portals with illuminated reveals and glass doors.
    const portalOffsets = [0.125, 0.375, 0.625, 0.875];
    portalOffsets.forEach((t, i) => {
      const p = point(t, 10.2);
      const tangent = point(t + 0.001, 10.2);
      const angle = Math.atan2(tangent[1] - p[1], tangent[0] - p[0]);
      const group = new THREE.Group();
      group.position.set(p[0], 0, p[1]); group.rotation.y = -angle;
      const width = i % 2 ? 18 : 22, height = 14;
      const portal = new THREE.Mesh(new THREE.BoxGeometry(width, height, 1.8), blueMetal);
      portal.position.y = height / 2 + 0.15; group.add(portal);
      const inset = new THREE.Mesh(new THREE.BoxGeometry(width - 2.2, height - 2.1, 0.45), glass);
      inset.position.set(0, height / 2 + 0.15, 1.05); group.add(inset);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(width + 1.2, 0.42, 2.5), goldMetal);
      lintel.position.set(0, height + 0.2, 0.25); group.add(lintel);
      for (const sx of [-1, 1]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, height - 1.2, 0.3), goldGlow);
        strip.position.set(sx * (width / 2 - 0.65), height / 2, 1.35); group.add(strip);
      }
      root.add(group);
    });

    // Sculptural roof: a continuous silver crown with a blue inner soffit.
    // Its outer edge floats above the façade; its inner edge shades the upper seating.
    const roofY = 45.5;
    ringSurface(-34, roofY + 2.6, 12.5, roofY, roofMat);
    ringSurface(-34, roofY + 2.55, 12.5, roofY + 2.6, roofUnderside);
    ringSurface(-35.0, roofY + 2.8, -33.5, roofY + 2.8, goldMetal);
    ringSurface(11.7, roofY - 0.05, 13.2, roofY + 0.35, blueMetal);

    // Radial roof ribs, perimeter ring beams and diagonal tension members.
    const ribCount = Math.floor(perimeter / 7.5);
    for (let i = 0; i < ribCount; i++) {
      const t = i / ribCount;
      const pA = point(t, -34), pB = point(t, 12.5);
      beam([pA[0], roofY + 2.8, pA[1]], [pB[0], roofY + 0.1, pB[1]], 0.48, 0.7, steel);
      const pC = point(t, -18);
      beam([pC[0], roofY + 1.7, pC[1]], [pB[0], roofY + 0.3, pB[1]], 0.16, 0.18, goldMetal);
    }
    for (const d of [-28, -20, -12, -4, 4, 10]) {
      const y = roofY + 2.8 - ((d + 34) / 46) * 2.7;
      ringSurface(d - 0.18, y - 0.15, d + 0.18, y + 0.15, steel, Math.floor(samples * 0.8));
    }

    // Four corner crown pylons, with tapered bases and warm beacon lights.
    for (const [sx, sz] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const x = sx * (a + 13), z = sz * (b + 13);
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.1, 34, 8), steel);
      pylon.position.set(x, 30, z); root.add(pylon);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 7), goldMetal);
      crown.position.set(x, 47.5, z); root.add(crown);
      const lamp = new THREE.PointLight(0x8bbdff, 1.1, 44);
      lamp.position.set(x, 48.5, z); root.add(lamp);
    }

    // Continuous glass VIP/concourse ribbon, with a fine mullion rhythm.
    const mullionGeo = new THREE.BoxGeometry(0.22, 14.5, 0.34);
    const mullions = new THREE.InstancedMesh(mullionGeo, steel, Math.floor(perimeter / 2.4));
    const mDummy = new THREE.Object3D();
    const mCount = Math.floor(perimeter / 2.4);
    for (let i = 0; i < mCount; i++) {
      const p = point(i / mCount, 8.45), q = point(i / mCount + 0.001, 8.45);
      const angle = Math.atan2(q[1] - p[1], q[0] - p[0]);
      mDummy.position.set(p[0], 15.8, p[1]); mDummy.rotation.set(0, -angle, 0);
      mDummy.updateMatrix(); mullions.setMatrixAt(i, mDummy.matrix);
    }
    root.add(mullions);

    // The main north stand receives a giant floating crest/nameplate.
    const sign = new THREE.Group();
    sign.position.set(0, 34, -b - 3.5);
    const signBack = new THREE.Mesh(new THREE.BoxGeometry(42, 11, 1.5), darkConcrete);
    sign.add(signBack);
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 1024; signCanvas.height = 256;
    const ctx = signCanvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 1024, 256);
    grad.addColorStop(0, "#071a3d"); grad.addColorStop(0.55, "#1557d6"); grad.addColorStop(1, "#071a3d");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = "#d8b45b"; ctx.lineWidth = 10; ctx.strokeRect(12, 12, 1000, 232);
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.font = "900 104px Arial";
    ctx.fillText("ZAMIN FK", 512, 132);
    ctx.fillStyle = "#ffd77a"; ctx.font = "700 34px Arial"; ctx.fillText("THE CROWN ARENA", 512, 196);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshBasicMaterial({ map: signTex }));
    signFace.position.z = 0.82; sign.add(signFace); root.add(sign);

    // Warm concourse lighting and subtle blue roof wash.
    for (let i = 0; i < 24; i++) {
      const t = i / 24, p = point(t, 8.0);
      const light = new THREE.PointLight(i % 3 === 0 ? 0xffd18a : 0x5b9dff, 0.65, 28);
      light.position.set(p[0], 11.5, p[1]); root.add(light);
    }

    // Premium plaza terraces and landscaped perimeter rings.
    const plaza = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 8), concrete);
    plaza.visible = false; root.add(plaza); // marker geometry intentionally hidden; plaza is supplied by the city layer.

    root.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    return root;
  }
  window.ZFKPremium = { build };
})();