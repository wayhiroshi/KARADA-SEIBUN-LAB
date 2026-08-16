const progressBar = document.querySelector(".reading-progress span");

function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress = available > 0 ? Math.min(1, window.scrollY / available) : 0;
  if (progressBar) progressBar.style.width = `${progress * 100}%`;
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest("a[data-analytics-event]");
  if (!link || typeof window.gtag !== "function") return;

  const destination = new URL(link.href, window.location.href);
  const isInternal = destination.origin === window.location.origin;

  window.gtag("event", link.dataset.analyticsEvent, {
    link_destination: isInternal ? destination.pathname : destination.hostname,
    link_location: link.dataset.analyticsLocation || "",
    content_id: link.dataset.contentId || "",
    transport_type: "beacon"
  });
});
