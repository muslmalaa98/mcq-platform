export function renderOrientationHint(el) {
  const isPortrait = window.matchMedia?.("(orientation: portrait)")?.matches;
  const isSmall = window.innerWidth < 900;

  if (isPortrait && isSmall) {
    el.innerHTML = `
      <div class="rotate-hint">
        💡 تلميح: تجربة القراءة أفضل عند تدوير الجهاز للوضع الأفقي (Landscape)، لكن يمكنك المتابعة الآن.
      </div>
    `;
  } else {
    el.innerHTML = "";
  }
}
