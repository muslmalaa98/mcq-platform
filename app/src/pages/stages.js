export function Stages(el, state, { college }) {
  const c = state.structure.colleges.find((x) => x.id === college);
  const stages = c?.stages || [];

  el.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title">اختر المرحلة</h2>
        <p class="card-sub">${c?.nameAr || ""}</p>
      </div>
    </div>

    <div style="height:12px"></div>
    <div class="grid" id="grid"></div>
  `;

  const grid = el.querySelector("#grid");
  grid.innerHTML = stages.map((s) => `
    <div class="item" data-id="${s.id}">
      <h3>📚 ${s.nameAr}</h3>
      <p>${s.terms?.length || 0} كورسات</p>
    </div>
  `).join("");

  grid.querySelectorAll(".item").forEach((it) => {
    it.addEventListener("click", () => {
      location.hash = `#/colleges/${college}/${it.dataset.id}`;
    });
  });
}
