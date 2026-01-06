import { toggleTheme, getTheme } from "../storage.js";
import { logout } from "../api.js";

export function renderHeader(el) {
  el.innerHTML = `
    <div class="brand" style="cursor:pointer" id="brand">
      <div class="brand-badge" aria-hidden="true">MCQ</div>
      <div>
        <div style="font-size:14px; font-weight:900;">منصة MCQ</div>
        <div style="font-size:12px; color: var(--muted);">قراءة فقط — بدون حفظ درجات</div>
      </div>
    </div>
    <div class="toolbar">
      <button class="btn" id="themeBtn" title="تبديل الوضع">
        ${getTheme() === "dark" ? "🌙" : "☀️"}
      </button>
      <button class="btn btn-danger" id="logoutBtn" title="تسجيل خروج">
        خروج
      </button>
    </div>
  `;

  el.querySelector("#brand").addEventListener("click", () => {
    location.hash = "#/colleges";
  });

  el.querySelector("#themeBtn").addEventListener("click", (e) => {
    const t = toggleTheme();
    e.currentTarget.textContent = t === "dark" ? "🌙" : "☀️";
  });

  el.querySelector("#logoutBtn").addEventListener("click", async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      location.hash = "#/lock";
      location.reload();
    }
  });
}
