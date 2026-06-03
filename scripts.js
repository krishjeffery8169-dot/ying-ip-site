const copyButtons = document.querySelectorAll("[data-copy-target]");

window.addEventListener("load", () => {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  target?.scrollIntoView({ block: "start" });
});

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target) return;

    const originalText = button.textContent;
    const text = target.textContent.trim();

    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!fallbackCopy()) {
        throw new Error("Copy failed");
      }
      button.textContent = "已复制";
      button.classList.add("is-copied");
      window.setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("is-copied");
      }, 1500);
    } catch {
      if (fallbackCopy()) {
        button.textContent = "已复制";
        button.classList.add("is-copied");
        window.setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("is-copied");
        }, 1500);
      } else {
        button.textContent = "请手动复制";
        window.setTimeout(() => {
          button.textContent = originalText;
        }, 1500);
      }
    }
  });
});

document.querySelectorAll(".post-slider").forEach((slider) => {
  const track = slider.querySelector(".slider-track");
  const cards = Array.from(slider.querySelectorAll(".social-card-img"));
  const currentLabel = slider.querySelector("[data-gallery-current]");

  if (!track || cards.length < 2) return;

  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let autoTimer = 0;
  let resumeTimer = 0;
  let scrollFrame = 0;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const getCardLeft = (card) => {
    const cardRect = card.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    return cardRect.left - trackRect.left + track.scrollLeft;
  };

  const getActiveIndex = () => {
    return cards.reduce(
      (closest, card, index) => {
        const distance = Math.abs(getCardLeft(card) - track.scrollLeft);
        return distance < closest.distance ? { index, distance } : closest;
      },
      { index: 0, distance: Infinity }
    ).index;
  };

  const updateCounter = () => {
    if (!currentLabel) return;
    currentLabel.textContent = String(getActiveIndex() + 1).padStart(2, "0");
  };

  const scrollToIndex = (index, behavior = "smooth") => {
    const target = cards[index];
    if (!target) return;
    track.scrollTo({ left: getCardLeft(target), behavior });
  };

  const pauseAuto = () => {
    window.clearInterval(autoTimer);
    window.clearTimeout(resumeTimer);
  };

  const startAuto = () => {
    pauseAuto();
    if (prefersReducedMotion.matches) return;

    autoTimer = window.setInterval(() => {
      if (document.hidden || isDragging) return;
      scrollToIndex((getActiveIndex() + 1) % cards.length);
    }, 4200);
  };

  const resumeAutoSoon = () => {
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(startAuto, 2600);
  };

  const snapToNearestCard = () => {
    scrollToIndex(getActiveIndex());
  };

  const stopDragging = () => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");
    snapToNearestCard();
    resumeAutoSoon();
  };

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pauseAuto();
    isDragging = true;
    startX = event.clientX;
    startScrollLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    event.preventDefault();
    const distance = event.clientX - startX;
    track.scrollLeft = startScrollLeft - distance;
  });

  track.addEventListener("scroll", () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(updateCounter);
  }, { passive: true });
  track.addEventListener("wheel", () => {
    pauseAuto();
    resumeAutoSoon();
  }, { passive: true });
  track.addEventListener("focusin", pauseAuto);
  track.addEventListener("focusout", resumeAutoSoon);
  track.addEventListener("pointerup", stopDragging);
  track.addEventListener("pointercancel", stopDragging);
  track.addEventListener("pointerleave", stopDragging);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAuto();
    } else {
      resumeAutoSoon();
    }
  });

  updateCounter();
  startAuto();
});
