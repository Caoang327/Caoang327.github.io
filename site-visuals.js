const canvas = document.getElementById("world-canvas");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

setupSiteNavigation();
setupPublicationTabs();
setupFeaturedCarousel();

if (canvas) {
  bootHeroScene().catch(() => {
    drawCanvasFallback(canvas);
  });
}

function setupSiteNavigation() {
  const views = document.querySelectorAll("[data-site-view]");
  const links = document.querySelectorAll("[data-site-nav]");
  const validViews = new Set(Array.from(views, (view) => view.dataset.siteView));

  if (!views.length || !links.length) {
    return;
  }

  const activateView = (requestedView) => {
    const activeView = validViews.has(requestedView) ? requestedView : "home";

    views.forEach((view) => {
      const active = view.dataset.siteView === activeView;
      view.classList.toggle("is-active", active);
      view.setAttribute("aria-hidden", active ? "false" : "true");
    });

    links.forEach((link) => {
      const active = link.dataset.siteNav === activeView;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    document.body.dataset.activeView = activeView;
  };

  document.body.classList.add("views-ready");
  activateView(window.location.hash.slice(1) || "home");

  links.forEach((link) => {
    link.addEventListener("click", () => {
      activateView(link.dataset.siteNav);
    });
  });

  window.addEventListener("hashchange", () => {
    activateView(window.location.hash.slice(1) || "home");
  });
}

function setupPublicationTabs() {
  const paperTabs = document.querySelectorAll("[data-paper-filter]");
  const topicTabs = document.querySelectorAll("[data-topic-filter]");
  const rows = document.querySelectorAll(".paper-row");
  const state = {
    paper: "selected",
    topic: "all",
  };

  if (!paperTabs.length || !rows.length) {
    return;
  }

  const applyFilters = () => {
    rows.forEach((row) => {
      const inPaperScope = state.paper === "all" || row.dataset.selected === "true";
      const topics = (row.dataset.topics || "").split(" ");
      const inTopicScope = state.topic === "all" || topics.includes(state.topic);
      const shouldHide = !inPaperScope || !inTopicScope;
      row.classList.toggle("is-hidden", shouldHide);
    });

    paperTabs.forEach((tab) => {
      const active = tab.dataset.paperFilter === state.paper;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    topicTabs.forEach((tab) => {
      const active = tab.dataset.topicFilter === state.topic;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", active ? "true" : "false");
    });
  };

  paperTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.paper = tab.dataset.paperFilter;
      applyFilters();
    });
  });

  topicTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.topic = tab.dataset.topicFilter;
      applyFilters();
    });
  });

  applyFilters();
}

function setupFeaturedCarousel() {
  const items = Array.from(document.querySelectorAll("[data-featured-item]"));
  const controls = document.querySelectorAll("[data-featured-shift]");

  if (!items.length || !controls.length) {
    return;
  }

  let start = 0;
  const visibleCount = () => {
    if (window.innerWidth <= 620) return 1;
    if (window.innerWidth <= 900) return 2;
    return 4;
  };

  const render = () => {
    const count = Math.min(visibleCount(), items.length);
    items.forEach((item, index) => {
      const offset = (index - start + items.length) % items.length;
      item.classList.toggle("is-hidden", offset >= count);
    });
  };

  const shift = (amount) => {
    start = (start + amount + items.length) % items.length;
    render();
  };

  controls.forEach((control) => {
    control.addEventListener("click", () => {
      shift(Number(control.dataset.featuredShift));
    });
  });

  window.addEventListener("resize", render);
  render();

  if (!reduceMotion) {
    window.setInterval(() => {
      shift(1);
    }, 7000);
  }
}

async function bootHeroScene() {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  const group = new THREE.Group();
  group.position.set(2.2, 0, 0);
  scene.add(group);

  const palette = [new THREE.Color("#23636c"), new THREE.Color("#cf6f35"), new THREE.Color("#1f2a2e")];
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 2.2 + Math.random() * 4.6;
    const angle = i * 0.18;
    const layer = (i % 9) - 4;
    positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.4;
    positions[i * 3 + 1] = Math.sin(angle * 0.72) * 2.6 + layer * 0.16;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.46 + (Math.random() - 0.5) * 2.2;

    const color = palette[i % palette.length];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    })
  );
  group.add(particles);

  const planes = new THREE.Group();
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: "#2f7770",
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });

  for (let i = 0; i < 6; i += 1) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.1, 9, 5), planeMaterial.clone());
    plane.rotation.x = (Math.PI / 3) * (i % 3);
    plane.rotation.y = (Math.PI / 3) * Math.floor(i / 2);
    plane.rotation.z = i * 0.21;
    plane.position.x = 2.2 + Math.cos(i) * 0.9;
    plane.position.y = Math.sin(i * 1.7) * 0.8;
    plane.position.z = -1.5 + i * 0.14;
    planes.add(plane);
  }
  group.add(planes);

  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    mouse.x = (event.clientX / window.innerWidth - 0.5) * 0.6;
    mouse.y = (event.clientY / window.innerHeight - 0.5) * 0.4;
  });

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  window.addEventListener("resize", resize);
  resize();

  let frame = 0;
  const render = () => {
    frame += 1;
    const t = frame * 0.006;
    group.rotation.y = -0.34 + Math.sin(t) * 0.08 + mouse.x;
    group.rotation.x = 0.12 + Math.cos(t * 0.7) * 0.04 + mouse.y;
    particles.rotation.z = t * 0.16;
    planes.rotation.y = t * 0.22;
    renderer.render(scene, camera);

    if (!reduceMotion) {
      requestAnimationFrame(render);
    }
  };

  render();
}

function drawCanvasFallback(targetCanvas) {
  const ctx = targetCanvas.getContext("2d");
  const points = Array.from({ length: 120 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0007,
    vy: (Math.random() - 0.5) * 0.0007,
    color: index % 3 === 0 ? "#23636c" : index % 3 === 1 ? "#cf6f35" : "#1f2a2e",
  }));

  const resize = () => {
    const rect = targetCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    targetCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
    targetCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const render = () => {
    const width = targetCanvas.clientWidth;
    const height = targetCanvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f3f7f6";
    ctx.fillRect(0, 0, width, height);

    points.forEach((point, index) => {
      if (!reduceMotion) {
        point.x = (point.x + point.vx + 1) % 1;
        point.y = (point.y + point.vy + 1) % 1;
      }

      const x = point.x * width;
      const y = point.y * height;
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(x, y, index % 4 === 0 ? 2.2 : 1.4, 0, Math.PI * 2);
      ctx.fill();

      if (index % 3 === 0) {
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = point.color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(width * (0.55 + Math.sin(index) * 0.18), height * (0.5 + Math.cos(index) * 0.2));
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
    if (!reduceMotion) {
      requestAnimationFrame(render);
    }
  };

  window.addEventListener("resize", resize);
  resize();
  render();
}
