import { renderHeader } from "./ui/Header.js";
import { renderBreadcrumb } from "./ui/Breadcrumb.js";
import { renderOrientationHint } from "./ui/OrientationHint.js";
import * as Pages from "./pages/index.js";
import { getStructure } from "./api.js";

const state = {
  structure: null,
  authed: false
};

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "").trim();
  const parts = raw ? raw.split("/") : [];
  return parts;
}

async function ensureStructureOrLock() {
  try {
    state.structure = await getStructure();
    state.authed = true;
    return true;
  } catch (e) {
    if (e?.status === 401) {
      state.authed = false;
      state.structure = null;
      location.hash = "#/lock";
      return false;
    }
    throw e;
  }
}

function mount(layoutRoot) {
  layoutRoot.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner container" id="topbar"></div>
    </div>
    <div class="container">
      <div id="orientation"></div>
      <div id="breadcrumb"></div>
      <div id="view"></div>
    </div>
  `;

  const topbar = layoutRoot.querySelector("#topbar");
  const orientation = layoutRoot.querySelector("#orientation");
  const breadcrumb = layoutRoot.querySelector("#breadcrumb");
  const view = layoutRoot.querySelector("#view");

  renderHeader(topbar);

  function render() {
    renderOrientationHint(orientation);

    const parts = parseHash();
    const [p0, p1, p2, p3, p4, p5] = parts;

    // Breadcrumb (lock page hides it)
    if (p0 !== "lock") {
      renderBreadcrumb(breadcrumb, parts, state);
    } else {
      breadcrumb.innerHTML = "";
    }

    // Route table
    if (!p0) {
      // Default route
      if (state.authed) location.hash = "#/colleges";
      else location.hash = "#/lock";
      return;
    }

    switch (p0) {
      case "lock":
        Pages.Lock(view, state);
        return;

      case "colleges":
        // hierarchy:
        // #/colleges
        // #/colleges/:college
        // #/colleges/:college/:stage
        // #/colleges/:college/:stage/:term
        // #/colleges/:college/:stage/:term/:course
        // #/colleges/:college/:stage/:term/:course/:subject
        if (!state.authed) {
          location.hash = "#/lock";
          return;
        }
        if (!p1) Pages.Colleges(view, state);
        else if (!p2) Pages.Stages(view, state, { college: p1 });
        else if (!p3) Pages.Terms(view, state, { college: p1, stage: p2 });
        else if (!p4) Pages.Courses(view, state, { college: p1, stage: p2, term: p3 });
        else if (!p5) Pages.Subjects(view, state, { college: p1, stage: p2, term: p3, course: p4 });
        else Pages.Reader(view, state, { college: p1, stage: p2, term: p3, course: p4, subject: p5 });
        return;

      default:
        location.hash = "#/lock";
    }
  }

  window.addEventListener("hashchange", render);

  // initial
  (async () => {
    const parts = parseHash();
    if (parts[0] !== "lock") {
      await ensureStructureOrLock();
    }
    render();
  })().catch((err) => {
    view.innerHTML = `
      <div class="card"><div class="card-body">
        <h2 class="card-title">حدث خطأ</h2>
        <p class="card-sub">${err?.message || "Unknown error"}</p>
      </div></div>
    `;
    console.error(err);
  });
}

export function mountApp(root) {
  mount(root);
}
