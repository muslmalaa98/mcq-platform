export function Terms(el, state, { college, stage }) {
  const c = state.structure.colleges.find((x) => x.id === college);
  const st = c?.stages?.find((x) => x.id === stage);
  const terms = st?.terms || [];

  el.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title">اختر الكورس</h2>
        <p class="card-sub">${c?.nameAr || ""} — ${st?.nameAr || ""}</p>
      </div>
    </div>

    <div style="height:12px"></div>
    <div class="grid" id="grid"></div>
  `;

  const grid = el.querySelector("#grid");
  grid.innerHTML = terms.map((t) => `
    <div class="item" data-id="${t.id}">
      <h3>🧾 ${t.nameAr}</h3>
      <p>${t.courses?.length || 0} مواد/مجموعات</p>
    </div>
  `).join("");

  grid.querySelectorAll(".item").forEach((it) => {
    it.addEventListener("click", () => {
      location.hash = `#/colleges/${college}/${stage}/${it.dataset.id}`;
    });
  });
}
