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
    const roofInner = -Math.min(24, r - 3);
    const roofMid = roofInner * 0.72;
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
      color: 0xbfc9d2, metalness: 0.82, roughness: 0.38,
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

    // Match the roof to the original upper-tier geometry instead of using a fixed, oversized height.
    // Upper tier: 8 rows at 0.62m rise, first floor HW + 0.9m; roof clears its top by 3.4m.
    const HW = R * ROW_H + 3;
    const upperTierTop = HW + 0.9 + 7 * 0.62;
    const roofY = upperTierTop + 3.4;
    // Sculptural roof: a continuous silver crown with a blue inner soffit, aligned to the seats.
    ringSurface(roofInner, roofY + 2.6, 12.5, roofY, roofMat);
    ringSurface(roofInner, roofY + 2.55, 12.5, roofY + 2.6, roofUnderside);
    ringSurface(roofInner - 1, roofY + 2.8, roofInner + 0.5, roofY + 2.8, goldMetal);
    ringSurface(11.7, roofY - 0.05, 13.2, roofY + 0.35, blueMetal);

    // Radial roof ribs, perimeter ring beams and diagonal tension members.
    const ribCount = Math.floor(perimeter / 7.5);
    for (let i = 0; i < ribCount; i++) {
      const t = i / ribCount;
      const pA = point(t, roofInner), pB = point(t, 12.5);
      beam([pA[0], roofY + 2.8, pA[1]], [pB[0], roofY + 0.1, pB[1]], 0.48, 0.7, steel);
      const pC = point(t, roofMid);
      beam([pC[0], roofY + 1.7, pC[1]], [pB[0], roofY + 0.3, pB[1]], 0.16, 0.18, goldMetal);
    }
    for (const d of [roofInner + 2, roofMid, roofInner * 0.32, -2, 4, 10]) {
      const y = roofY + 2.8 - ((d - roofInner) / (12.5 - roofInner)) * 2.7;
      ringSurface(d - 0.18, y - 0.15, d + 0.18, y + 0.15, steel, Math.floor(samples * 0.8));
    }

    // 32 compact Golden VIP lounges integrated into the upper grandstand.
    // They are visual reservations only; payment/ownership is intentionally not simulated.
    const vipCabinGroup = new THREE.Group();
    vipCabinGroup.name = "ZFK_GOLD_VIP_CABINS";
    root.add(vipCabinGroup);
    // Brighter VIP finish: gold remains premium, but reduced metalness keeps it readable
    // without relying on environment reflections; navy upholstery is lifted for visibility.
    const vipGold = mat(0xe4bd62, 0.42, 0.34);
    const vipGoldBright = mat(0xffdf83, 0.38, 0.28);
    const vipNavy = mat(0x203b62, 0.22, 0.48);
    const vipLeather = mat(0x526d96, 0.08, 0.72, { emissive: 0x14243c, emissiveIntensity: 0.28 });
    const vipLeatherLight = mat(0x7892b5, 0.06, 0.68, { emissive: 0x1a2c45, emissiveIntensity: 0.22 });
    const vipGlass = new THREE.MeshPhysicalMaterial({
      color: 0xd7edff, metalness: 0.04, roughness: 0.16, transparent: true,
      opacity: 0.10, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide, depthWrite: false
    });
    const vipBox = new THREE.BoxGeometry(1, 1, 1);
    const vipSphere = new THREE.SphereGeometry(0.43, 20, 14);
    const vipCylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
    function vipPart(parent, geometry, material, size, pos, name) {
      const m = new THREE.Mesh(geometry, material);
      m.scale.set(size[0], size[1], size[2]);
      m.position.set(pos[0], pos[1], pos[2]);
      if (name) m.name = name;
      m.castShadow = true; m.receiveShadow = true; parent.add(m);
      return m;
    }
    function vipLabel(no) {
      const c = document.createElement("canvas"); c.width = 512; c.height = 128;
      const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 512, 128);
      g.addColorStop(0, "#091a38"); g.addColorStop(.5, "#203c63"); g.addColorStop(1, "#091a38");
      x.fillStyle = g; x.fillRect(0, 0, 512, 128);
      x.strokeStyle = "#e2b84f"; x.lineWidth = 8; x.strokeRect(7, 7, 498, 114);
      x.fillStyle = "#ffe19a"; x.font = "900 62px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("VIP " + String(no).padStart(2, "0"), 256, 64);
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      return new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    }
    const vipCabinMeshes = [];
    const vipCount = 32, vipWidth = 6.4, vipDepth = 4.2, vipHeight = 4.2;
    const vipBaseY = HW + 1.0, vipOffset = 3.9;
    for (let i = 0; i < vipCount; i++) {
      const t = (i + 0.5) / vipCount, p = point(t, vipOffset);
      const inward = new THREE.Vector3(-p[0], 0, -p[1]).normalize();
      const cabin = new THREE.Group();
      cabin.name = "ZFK_GOLD_VIP_" + String(i + 1).padStart(2, "0");
      cabin.position.set(p[0], vipBaseY, p[1]);
      cabin.rotation.y = Math.atan2(inward.x, inward.z);
      cabin.userData.vipCabinIndex = i + 1;
      // Gold-edged plinth and dark floor.
      vipPart(cabin, vipBox, vipNavy, [vipWidth + .35, .28, vipDepth + .35], [0, .14, 0], "VIP plinth");
      vipPart(cabin, vipBox, vipGold, [vipWidth + .5, .10, vipDepth + .5], [0, .04, 0], "Gold floor reveal");
      vipPart(cabin, vipBox, vipNavy, [vipWidth, .12, vipDepth], [0, .32, 0], "Cabin floor");
      // Panoramic glass frontage and side glazing.
      vipPart(cabin, vipBox, vipGlass, [vipWidth - .28, vipHeight - .55, .08], [0, vipHeight / 2 + .18, vipDepth / 2 - .06], "Panoramic glass frontage");
      vipPart(cabin, vipBox, vipGlass, [.08, vipHeight - .55, vipDepth - .25], [-vipWidth / 2 + .06, vipHeight / 2 + .18, 0], "Left glass wall");
      vipPart(cabin, vipBox, vipGlass, [.08, vipHeight - .55, vipDepth - .25], [vipWidth / 2 - .06, vipHeight / 2 + .18, 0], "Right glass wall");
      vipPart(cabin, vipBox, vipNavy, [vipWidth, vipHeight - .15, .18], [0, vipHeight / 2 + .12, -vipDepth / 2 + .05], "Rear privacy wall");
      // Brushed-gold frame and roof canopy.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        vipPart(cabin, vipBox, vipGoldBright, [.16, vipHeight, .16], [sx * (vipWidth / 2 - .08), vipHeight / 2 + .3, sz * (vipDepth / 2 - .08)], "Gold corner post");
      }
      for (const sz of [-1, 1]) vipPart(cabin, vipBox, vipGold, [vipWidth + .2, .16, .18], [0, vipHeight + .28, sz * (vipDepth / 2)], "Gold lintel");
      for (const sx of [-1, 1]) vipPart(cabin, vipBox, vipGold, [.18, .16, vipDepth + .1], [sx * vipWidth / 2, vipHeight + .28, 0], "Gold side rail");
      vipPart(cabin, vipBox, vipNavy, [vipWidth + .28, .24, vipDepth + .28], [0, vipHeight + .12, 0], "Dark canopy");
      vipPart(cabin, vipBox, vipGoldBright, [vipWidth + .34, .07, vipDepth + .34], [0, vipHeight + .28, 0], "Canopy gold edge");
      // Compact deep-blue leather sofa facing the pitch.
      vipPart(cabin, vipBox, vipLeather, [2.55, .52, 1.0], [-.95, .72, -.35], "VIP sofa cushion");
      vipPart(cabin, vipBox, vipLeatherLight, [2.55, 1.0, .25], [-.95, 1.3, -.72], "VIP sofa back");
      for (const sx of [-1, 1]) {
        vipPart(cabin, vipBox, vipLeather, [.28, .7, 1.0], [-.95 + sx * 1.28, .92, -.35], "VIP sofa arm");
        for (const sz of [-1, 1]) vipPart(cabin, vipCylinder, vipGold, [.11, .48, .11], [-.95 + sx * .98, .37, -.35 + sz * .33], "Sofa foot");
      }
      // Gold side table with a polished golden football ornament.
      vipPart(cabin, vipCylinder, vipGold, [.13, .62, .13], [1.65, .62, .35], "Side table pedestal");
      vipPart(cabin, vipCylinder, vipGoldBright, [.88, .10, .88], [1.65, .98, .35], "Side table top");
      vipPart(cabin, vipCylinder, vipGold, [.52, .12, .52], [1.65, 1.12, .35], "Golden ball trophy plinth");
      vipPart(cabin, vipSphere, vipGoldBright, [.8, .8, .8], [1.65, 1.46, .35], "Golden football trophy ornament");
      const ballBand = new THREE.Mesh(new THREE.TorusGeometry(.36, .016, 6, 32), vipNavy);
      ballBand.position.set(1.65, 1.46, .35); ballBand.rotation.x = Math.PI / 2; cabin.add(ballBand);
      const ballBand2 = new THREE.Mesh(new THREE.TorusGeometry(.36, .016, 6, 32), vipNavy);
      ballBand2.position.set(1.65, 1.46, .35); ballBand2.rotation.y = Math.PI / 2; cabin.add(ballBand2);
      // Warm architectural light strip (emissive, no extra point-light cost).
      const warmStrip = new THREE.Mesh(
        new THREE.BoxGeometry(vipWidth - .8, .045, .045),
        new THREE.MeshStandardMaterial({ color: 0xffd47a, emissive: 0xffb83d, emissiveIntensity: 1.15, metalness: .55, roughness: .28 })
      );
      warmStrip.position.set(0, vipHeight + .005, vipDepth / 2 - .18); cabin.add(warmStrip);
      // Real, shadowless warm fill light makes the sofa, side table and trophy readable.
      // One low-cost light per cabin; deliberately no shadow map.
      const cabinLight = new THREE.PointLight(0xffd49a, 2.4, 10, 2);
      cabinLight.position.set(0, 2.85, 0.05);
      cabin.add(cabinLight);
      const cabinFill = new THREE.PointLight(0xffe7bd, 0.85, 7, 2);
      cabinFill.position.set(1.45, 1.9, 1.25);
      cabin.add(cabinFill);
      // Soft luminous ceiling panel supplements the point lights without casting shadows.
      const ceilingGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(vipWidth - 1.0, vipDepth - 0.8),
        new THREE.MeshBasicMaterial({ color: 0xffdca5, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
      );
      ceilingGlow.rotation.x = Math.PI / 2;
      ceilingGlow.position.set(0, vipHeight + .005, 0);
      cabin.add(ceilingGlow);
      // Small ZAMIN FK gold pennant inside each lounge.
      vipPart(cabin, vipCylinder, vipGoldBright, [.055, 1.45, .055], [-vipWidth / 2 + .55, 1.05, -vipDepth / 2 + .38], "ZFK flag pole");
      const pennant = vipPart(cabin, vipBox, vipGoldBright, [.72, .48, .045], [-vipWidth / 2 + .93, 1.43, -vipDepth / 2 + .38], "ZFK gold pennant");
      pennant.rotation.y = -.08;
      // Two-line owner plate: cabin number now, buyer's verified username after purchase.
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .46), vipLabel(i + 1));
      plate.position.set(0, vipHeight - .42, vipDepth / 2 + .055); cabin.add(plate);
      const ownerCanvas = document.createElement("canvas"); ownerCanvas.width = 512; ownerCanvas.height = 96;
      const oc = ownerCanvas.getContext("2d");
      oc.fillStyle = "#081a38"; oc.fillRect(0, 0, 512, 96);
      oc.strokeStyle = "#d9ad45"; oc.lineWidth = 5; oc.strokeRect(3, 3, 506, 90);
      oc.fillStyle = "#f3d58a"; oc.font = "bold 34px Arial"; oc.textAlign = "center"; oc.textBaseline = "middle";
      oc.fillText("OWNER NAMEPLATE", 256, 48);
      const ownerMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(ownerCanvas), toneMapped: false });
      const ownerPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .34), ownerMat);
      ownerPlate.position.set(0, vipHeight - .92, vipDepth / 2 + .057); cabin.add(ownerPlate);
      cabin.traverse(o => { if (o.isMesh) { o.userData.vipCabinIndex = i + 1; vipCabinMeshes.push(o); } });
      vipCabinGroup.add(cabin);
    }

    // Four corner crown pylons, with tapered bases and warm beacon lights.
    for (const [sx, sz] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const x = sx * (a + 13), z = sz * (b + 13);
      const pylonHeight = roofY + 5.5;
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.1, pylonHeight, 8), steel);
      pylon.position.set(x, pylonHeight / 2, z); root.add(pylon);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 7), goldMetal);
      crown.position.set(x, pylonHeight + 0.6, z); root.add(crown);
      const lamp = new THREE.PointLight(0x8bbdff, 0.55, 36);
      lamp.position.set(x, pylonHeight + 1.6, z); root.add(lamp);
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