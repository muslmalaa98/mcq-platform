import { verifyCode } from "../api.js";
import { getOrCreateDeviceId } from "../storage.js";

export function Lock(el) {
  el.innerHTML = `
    <div class="lock-wrap">
      <div class="card lock-card">
        <div class="card-body">
          <h2 class="card-title">إدخال كود الطالب</h2>
          <p class="card-sub">لن يظهر محتوى الأسئلة قبل إدخال كود صحيح.</p>

          <div class="field">
            <span class="label">كود الطالب</span>
            <input class="input" id="code" placeholder="مثال: MED-2026-0001" autocomplete="one-time-code" />
          </div>

          <div class="row" style="margin-top:12px;">
            <button class="btn btn-primary" id="btn">تفعيل</button>
            <span class="small" id="status"></span>
          </div>

          <p class="hint">إذا فشل الكود عدة مرات، سيتم التقييد مؤقتًا (Rate limit).</p>
        </div>
      </div>
    </div>
  `;

  const code = el.querySelector("#code");
  const btn = el.querySelector("#btn");
  const status = el.querySelector("#status");

  async function run() {
    status.textContent = "";
    btn.disabled = true;

    try {
      const deviceId = getOrCreateDeviceId();
      await verifyCode(code.value.trim(), deviceId);

      status.textContent = "✅ تم التفعيل. يتم فتح المحتوى...";
      location.hash = "#/colleges";
      location.reload();
    } catch (e) {
      status.textContent = `❌ ${e?.message || "فشل التفعيل"}`;
      btn.disabled = false;
    }
  }

  btn.addEventListener("click", run);
  code.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });

  setTimeout(() => code.focus(), 50);
}
