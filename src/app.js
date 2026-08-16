const progressBar = document.querySelector(".reading-progress span");

function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress = available > 0 ? Math.min(1, window.scrollY / available) : 0;
  if (progressBar) progressBar.style.width = `${progress * 100}%`;
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
