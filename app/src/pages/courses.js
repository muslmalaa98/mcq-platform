export function Courses(el, state, { college, stage, term }) {
  const c = state.structure.colleges.find((x) => x.id === college);
  const st = c?.stages?.find((x) => x.id === stage);
  const tr = st?.terms?.find((x) => x.id === term);
  const courses = tr?.courses || [];

  el.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title">اختر المجموعة</h2>
        <p class="card-sub">${c?.nameAr || ""} — ${st?.nameAr || ""} — ${tr?.nameAr || ""}</p>
      </div>
    </div>

    <div style="height:12px"></div>
    <div class="grid" id="grid"></div>
  `;

  const grid = el.querySelector("#grid");
  grid.innerHTML = courses.map((co) => `
    <div class="item" data-id="${co.id}">
      <h3>🧩 ${co.nameAr}</h3>
      <p>${co.subjects?.length || 0} مواد</p>
    </div>
  `).join("");

  grid.querySelectorAll(".item").forEach((it) => {
    it.addEventListener("click", () => {
      location.hash = `#/colleges/${college}/${stage}/${term}/${it.dataset.id}`;
    });
  });
}
