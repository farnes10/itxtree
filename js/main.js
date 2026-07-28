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
const projectCards = document.querySelectorAll(".project-card");
if (filterBtns.length) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const category = btn.dataset.filter;
      projectCards.forEach((card) => {
        const show = category === "all" || card.dataset.category === category;
        card.hidden = !show;
      });
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

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (msg) msg.classList.remove("show");

    if (!validate()) return;

    if (submitBtn) {
      submitBtn.setAttribute("disabled", "true");
      submitBtn.innerHTML = '<span class="spinner"></span> Envoi en cours…';
    }

    // Démo front-end uniquement : aucun backend n'est branché ici.
    setTimeout(() => {
      if (submitBtn) {
        submitBtn.removeAttribute("disabled");
        submitBtn.textContent = submitLabel;
      }
      if (msg) {
        msg.classList.add("show");
        msg.textContent = "Message envoyé — nous revenons vers vous rapidement.";
      }
      contactForm.reset();
    }, 700);
  });
}
