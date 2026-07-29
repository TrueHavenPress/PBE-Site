document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  wireAjaxForm("contactForm", "contactStatus", {
    successMessage: "Thanks — Debra will reply within 1 business day.",
    probableSuccessMessage: "Your request was sent. If you don't hear back within 2 business days, email theprobookeditor@outlook.com.",
    errorMessage: "Something went wrong. Please email theprobookeditor@outlook.com directly."
  });

  wireAjaxForm("toolkitForm", "toolkitStatus", {
    successMessage: "Success! Check your inbox for the free toolkit.",
    probableSuccessMessage: "Signed up! If nothing arrives shortly, email theprobookeditor@outlook.com.",
    errorMessage: "Something went wrong. Please email theprobookeditor@outlook.com directly."
  });
});

// Checkbox groups can't express "at least one required" with native HTML
// validation — a `required` checkbox only requires that specific box.
function checkboxGroupsValid(form) {
  var groups = form.querySelectorAll("[data-group-required]");
  for (var i = 0; i < groups.length; i++) {
    var name = groups[i].getAttribute("data-group-required");
    var boxes = form.querySelectorAll('input[name="' + name + '"]');
    var anyChecked = Array.prototype.some.call(boxes, function (b) { return b.checked; });
    boxes.forEach(function (b) { b.setCustomValidity(anyChecked ? "" : "Please choose at least one option."); });
    if (!anyChecked) {
      boxes[0].reportValidity();
      return false;
    }
  }
  return true;
}

function wireAjaxForm(formId, statusId, opts) {
  var form = document.getElementById(formId);
  if (!form) return;
  var status = document.getElementById(statusId);
  var btn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    status.textContent = "";
    status.className = "submit-status";

    var honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) {
      status.textContent = opts.successMessage;
      status.classList.add("is-success");
      form.reset();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!checkboxGroupsValid(form)) return;

    btn.disabled = true;
    var originalLabel = btn.textContent;
    btn.textContent = "Sending…";

    var fd = new FormData();
    for (var el of form.elements) {
      if (!el.name || el.name === "website") continue;
      if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked) fd.append(el.name, el.value);
        continue;
      }
      if (el.type === "submit" || el.type === "button") continue;
      fd.append(el.name, el.value);
    }

    try {
      var res = await fetch(form.action, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Server responded " + res.status);
      status.textContent = opts.successMessage;
      status.classList.add("is-success");
      form.reset();
    } catch (err) {
      if (err instanceof TypeError) {
        console.warn("Network/CORS error — submission was likely sent but the response was unreadable:", err);
        status.textContent = opts.probableSuccessMessage;
        status.classList.add("is-success");
        form.reset();
      } else {
        console.error("Submission failed:", err);
        status.textContent = opts.errorMessage;
        status.classList.add("is-error");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}
