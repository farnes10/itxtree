// ITXTREE — scripts partagés

// Menu mobile
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    const expanded = navLinks.classList.contains("open");
    navToggle.setAttribute("aria-expanded", String(expanded));
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

// Année automatique dans le footer
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Filtres — page Nos projets
const filterBtns = document.querySelectorAll(".filter-btn");

// Map filter keys to one or more categories they should match
const filterMap = {
  all:     null,
  web:     ["web", "mobile"],
  desktop: ["desktop"],
  iot:     ["iot"],
  design:  ["design"],
  video:   ["video"]
};

function applyFilter(category) {
  const allowed = filterMap[category];
  const cards = document.querySelectorAll(".project-card");
  cards.forEach((card) => {
    const match = allowed === null || allowed.includes(card.dataset.category);
    card.hidden = !match;
  });
}

if (filterBtns.length) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.dataset.filter);
    });
  });
}

// Apparition au scroll (cartes, étapes, timeline...)
const revealTargets = document.querySelectorAll(
  ".card, .step, .timeline-item, .value-card, .cta-band, .hero-visual"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("in-view"));
}

// Nav : ombre + fond renforcé après un léger scroll
const navEl = document.querySelector(".nav");
if (navEl) {
  const onScroll = () => navEl.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Barre de progression de lecture
const progressBar = document.querySelector("#scrollProgress");
if (progressBar) {
  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
}

// Bouton retour en haut
const backToTop = document.querySelector("#backToTop");
if (backToTop) {
  const toggleBackToTop = () => backToTop.classList.toggle("visible", window.scrollY > 480);
  toggleBackToTop();
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Copier email / téléphone
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy;
    const tooltip = btn.parentElement.querySelector(".copy-tooltip");
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      // Environnement sans presse-papiers accessible : on ignore silencieusement.
    }
    if (tooltip) {
      tooltip.classList.add("show");
      setTimeout(() => tooltip.classList.remove("show"), 1400);
    }
  });
});

// Compteur de caractères — message de contact
const messageField = document.querySelector("#message");
const messageCount = document.querySelector("#messageCount");
if (messageField && messageCount) {
  const max = Number(messageField.getAttribute("maxlength")) || 600;
  const updateCount = () => {
    const len = messageField.value.length;
    messageCount.textContent = `${len} / ${max}`;
    messageCount.classList.toggle("limit", len >= max);
  };
  updateCount();
  messageField.addEventListener("input", updateCount);
}

// Formulaire de contact (démo front-end uniquement) — validation + état de chargement
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  const msg = document.querySelector("#form-msg");
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const submitLabel = submitBtn ? submitBtn.textContent : "";

  const requiredFields = contactForm.querySelectorAll("[required]");

  function validate() {
    let valid = true;
    requiredFields.forEach((input) => {
      const field = input.closest(".field");
      const isEmpty = !input.value.trim();
      const isBadEmail = input.type === "email" && input.value.trim() && !input.validity.valid;
      if (field) field.classList.toggle("invalid", isEmpty || isBadEmail);
      if (isEmpty || isBadEmail) valid = false;
    });
    return valid;
  }

  requiredFields.forEach((input) => {
    input.addEventListener("input", () => {
      const field = input.closest(".field");
      if (field) field.classList.remove("invalid");
    });
  });

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.classList.remove("show");

    if (!validate()) return;

    if (submitBtn) {
      submitBtn.setAttribute("disabled", "true");
      submitBtn.innerHTML = '<span class="spinner"></span> Envoi en cours…';
    }

    const data = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      subject: document.getElementById("subject") ? document.getElementById("subject").value : "",
      message: document.getElementById("message").value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (submitBtn) {
        submitBtn.removeAttribute("disabled");
        submitBtn.textContent = submitLabel;
      }
      
      if (res.ok) {
        const result = await res.json();
        if (msg) {
          msg.classList.add("show");
          msg.textContent = result.message || "Message envoyé avec succès.";
        }
        contactForm.reset();
      } else {
        let errorMsg = "Une erreur s'est produite.";
        try {
          const result = await res.json();
          if (result.error) errorMsg = result.error;
        } catch (e) {
          errorMsg = `Erreur HTTP: ${res.status} ${res.statusText}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.removeAttribute("disabled");
        submitBtn.textContent = submitLabel;
      }
      console.error(err);
      alert("Erreur de connexion : assurez-vous d'accéder au site via http://localhost:3000 (et non via Live Server ou file://).");
    }
  });
}

// Fetch projects if on projects page
const projectsGrid = document.querySelector(".grid.grid-3");
if (projectsGrid && window.location.pathname.includes("projects.html")) {
  fetch('/api/projects')
    .then(res => res.json())
    .then(projects => {
      projectsGrid.innerHTML = "";
      if (projects.length === 0) {
        projectsGrid.innerHTML = "<p>Aucun projet trouvé.</p>";
        return;
      }
      projects.forEach(p => {
        const stackItems = p.stack.split(',').map(s => `<span>${s.trim()}</span>`).join('');
        let thumbHtml = '';
        if (p.thumb_type === 'image') {
          thumbHtml = `<img src="${p.thumb_content}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        } else {
          thumbHtml = p.thumb_content;
        }

        const card = document.createElement("div");
        card.className = "card project-card reveal in-view";
        card.dataset.category = p.category.toLowerCase().trim();
        card.innerHTML = `
          <div class="project-thumb">${thumbHtml}</div>
          <div class="project-body">
            <span class="project-tag">${p.category}</span>
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <div class="project-stack">${stackItems}</div>
          </div>
        `;
        projectsGrid.appendChild(card);
      });
      
      // Apply the currently active filter after cards are loaded
      const activeBtn = document.querySelector(".filter-btn.active");
      if (activeBtn) {
        applyFilter(activeBtn.dataset.filter);
      }
    })
    .catch(err => {
      console.error("Erreur de chargement des projets", err);
      projectsGrid.innerHTML = "<p>Impossible de charger les projets.</p>";
    });
}
