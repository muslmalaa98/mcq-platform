export function Colleges(el, state) {
  const colleges = state.structure?.colleges || [];

  el.innerHTML = `
    <div class="card page-hero">
  <div class="card-body">
    <h2 class="page-title">اختر الكلية</h2>
  </div>
</div>


    <div style="height:12px"></div>

    <div class="grid" id="grid"></div>
  `;

  const grid = el.querySelector("#grid");

  grid.innerHTML = colleges.map((c) => `
    <div class="item" data-id="${c.id}">
      <h3>🎓 ${c.nameAr}</h3>
      <p>${c.stages?.length || 0} مراحل</p>
    </div>
  `).join("");

  grid.querySelectorAll(".item").forEach((it) => {
    it.addEventListener("click", () => {
      location.hash = `#/colleges/${it.dataset.id}`;
    });
  });
}
