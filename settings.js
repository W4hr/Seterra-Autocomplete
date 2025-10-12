function saveOptions(event) {
  const skipFillInEl = document.getElementById("skip_fill_in");
  const forceTypeoutEl = document.getElementById("force_typeout");
  const autosubmitEl = document.getElementById("autosubmit");

  let currentForceTypeout = forceTypeoutEl.checked;
  let currentAutosubmit = autosubmitEl.checked;

  if (event && event.target) {
    if (event.target.id === "force_typeout" && currentForceTypeout) {
      autosubmitEl.checked = false
      currentAutosubmit = false
    } else if (event.target.id === "autosubmit" && currentAutosubmit) {
      forceTypeoutEl.checked = false;
      currentForceTypeout = false;
    }
  }

  browser.storage.sync.set({
    skip_fill_in: skipFillInEl.checked,
    force_typeout: currentForceTypeout,
    autosubmit: currentAutosubmit,
  });
}

function restoreOptions() {
  browser.storage.sync.get({
    skip_fill_in: true,
    force_typeout: false,
    autosubmit: false
  }).then((items) => {
    let forceTypeoutChecked = items.force_typeout;
    let autosubmitChecked = items.autosubmit;

    if (forceTypeoutChecked && autosubmitChecked) {
      autosubmitChecked = false;
    }

    document.getElementById("skip_fill_in").checked = items.skip_fill_in;
    document.getElementById("force_typeout").checked = forceTypeoutChecked;
    document.getElementById("autosubmit").checked = autosubmitChecked;
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelectorAll("input").forEach(el => {
  el.addEventListener("change", (event) => saveOptions(event));
})