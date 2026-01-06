export function Subjects(el, state, { college, stage, term, course }) {
  const c = state.structure.colleges.find((x) => x.id === college);
  const st = c?.stages?.find((x) => x.id === stage);
  const tr = st?.terms?.find((x) => x.id === term);
  const co = tr?.courses?.find((x) => x.id === course);
  const subjects = co?.subjects || [];

  el.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title">اختر المادة</h2>
        <p class="card-sub">${c?.nameAr || ""} — ${st?.nameAr || ""} — ${tr?.nameAr || ""} — ${co?.nameAr || ""}</p>
      </div>
    </div>

    <div style="height:12px"></div>
    <div class="grid" id="grid"></div>
  `;

  const grid = el.querySelector("#grid");
  grid.innerHTML = subjects.map((s) => `
    <div class="item" data-id="${s.id}">
      <h3>📌 ${s.nameAr}</h3>
      <p>اضغط لبدء القراءة</p>
    </div>
  `).join("");

  grid.querySelectorAll(".item").forEach((it) => {
    it.addEventListener("click", () => {
      location.hash = `#/colleges/${college}/${stage}/${term}/${course}/${it.dataset.id}`;
    });
  });
}
