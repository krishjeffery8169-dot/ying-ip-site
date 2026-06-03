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

document.querySelectorAll("[data-slider]").forEach((slider) => {
  const track = slider.querySelector(".slider-track");
  const cards = Array.from(slider.querySelectorAll(".post-card"));
  const dots = slider.querySelector(".slider-dots");
  const prev = slider.querySelector("[data-slider-prev]");
  const next = slider.querySelector("[data-slider-next]");

  if (!track || !cards.length || !dots || !prev || !next) return;

  const dotButtons = cards.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "slider-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `第 ${index + 1} 张`);
    dots.appendChild(dot);
    dot.addEventListener("click", () => {
      cards[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    });
    return dot;
  });

  const getActiveIndex = () => {
    const trackLeft = track.getBoundingClientRect().left;
    return cards.reduce((closest, card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
      return distance < closest.distance ? { index, distance } : closest;
    }, { index: 0, distance: Infinity }).index;
  };

  const updateDots = () => {
    const activeIndex = getActiveIndex();
    dotButtons.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const scrollByCard = (direction) => {
    const activeIndex = getActiveIndex();
    const nextIndex = Math.max(0, Math.min(cards.length - 1, activeIndex + direction));
    cards[nextIndex].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    window.setTimeout(updateDots, 350);
  };

  prev.addEventListener("click", () => scrollByCard(-1));
  next.addEventListener("click", () => scrollByCard(1));
  track.addEventListener("scroll", () => window.requestAnimationFrame(updateDots), { passive: true });
  window.addEventListener("resize", updateDots);
  updateDots();
});
