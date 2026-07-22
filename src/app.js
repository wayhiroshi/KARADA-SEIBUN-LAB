const params = new URLSearchParams(window.location.search);
const workMode = params.get("work") === "1";

if (workMode) {
  document.body.classList.add("work-mode");
  document.querySelector(".work-mode-guide")?.removeAttribute("hidden");
}

const progressBar = document.querySelector(".reading-progress span");

function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress = available > 0 ? Math.min(1, window.scrollY / available) : 0;
  if (progressBar) progressBar.style.width = `${progress * 100}%`;
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

for (const button of document.querySelectorAll(".copy-script")) {
  button.addEventListener("click", async () => {
    const panel = button.closest(".manga-panel");
    const id = panel?.querySelector(".panel-id")?.textContent?.trim() ?? "";
    const lines = [...(panel?.querySelectorAll(".script-line") ?? [])].map((line) => {
      const speaker = line.querySelector(".speaker")?.textContent?.trim();
      const clone = line.cloneNode(true);
      clone.querySelector(".speaker")?.remove();
      const text = clone.textContent.trim();
      return speaker ? `${speaker}\n${text}` : text;
    });
    const value = [id, ...lines].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(value);
      const original = button.textContent;
      button.textContent = "コピーしました";
      window.setTimeout(() => { button.textContent = original; }, 1500);
    } catch {
      button.textContent = "コピーできませんでした";
    }
  });
}
