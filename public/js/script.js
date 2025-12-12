function setCurrentModule() {
  const path = window.location.pathname.split("/").slice(0, 4).join("/");
  const resource = document.querySelector(`ul li a[href="${path}"]`);

  // remove all actives
  const actives = document.querySelectorAll("a.adminjs_active");
  actives.forEach((active) => {
    active.classList.remove("adminjs_active");
  });

  // set current module
  if (resource) {
    const parent = resource.closest("li").parentElement.parentElement;
    const module = parent.querySelector("a");
    module.classList.add("adminjs_active");

    const version = document.querySelector("section.adminjs_Version");
    const title = module.querySelector('span + div').textContent.trim();
    version.innerHTML = title;
  }
}

window.onload = function () {
  setCurrentModule();
};

navigation.addEventListener("navigate", (e) => {
  setTimeout(() => {
    const url = e.destination.url;
    setCurrentModule();
  }, 0);
});
