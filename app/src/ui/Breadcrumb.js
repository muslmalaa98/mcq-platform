function crumb(label, href) {
  return `<span class="crumb">${href ? `<a href="${href}">${label}</a>` : label}</span>`;
}

export function renderBreadcrumb(el, parts, state) {
  const [p0, collegeId, stageId, termId, courseId, subjectId] = parts;

  if (p0 !== "colleges") {
    el.innerHTML = "";
    return;
  }

  const s = state.structure;
  const college = s?.colleges?.find((c) => c.id === collegeId);
  const stage = college?.stages?.find((x) => x.id === stageId);
  const term = stage?.terms?.find((x) => x.id === termId);
  const course = term?.courses?.find((x) => x.id === courseId);
  const subject = course?.subjects?.find((x) => x.id === subjectId);

  const items = [];
  items.push(crumb("الكليات", "#/colleges"));

  if (college) items.push(`<span class="sep">›</span>${crumb(college.nameAr, `#/colleges/${college.id}`)}`);
  if (stage) items.push(`<span class="sep">›</span>${crumb(stage.nameAr, `#/colleges/${college.id}/${stage.id}`)}`);
  if (term) items.push(`<span class="sep">›</span>${crumb(term.nameAr, `#/colleges/${college.id}/${stage.id}/${term.id}`)}`);
  if (course) items.push(`<span class="sep">›</span>${crumb(course.nameAr, `#/colleges/${college.id}/${stage.id}/${term.id}/${course.id}`)}`);
  if (subject) items.push(`<span class="sep">›</span>${crumb(subject.nameAr, null)}`);

  el.innerHTML = `<div class="breadcrumb">${items.join("")}</div>`;
}
