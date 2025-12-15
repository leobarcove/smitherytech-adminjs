function setCurrentModule() {
  const path = window.location.pathname.split("/").slice(0, 4).join("/");
  const resource = document.querySelector(`ul li a[href="${path}"]`);
  const version = document.querySelector("section.adminjs_Version");

  // remove all actives
  version.textContent = "";
  const actives = document.querySelectorAll("a.adminjs_active");
  actives.forEach((active) => {
    active.classList.remove("adminjs_active");
  });

  // set current module
  if (resource) {
    const parent = resource.closest("li").parentElement.parentElement;
    const module = parent.querySelector("a");
    module.classList.add("adminjs_active");

    const title = module.querySelector("span + div").textContent.trim();
    version.textContent = title;
  }
}

function setSubmenuHeight(menu) {
  const submenu = menu.parentElement.querySelector("ul");
  const height = submenu?.scrollHeight;
  if (!submenu && !height) {
    return;
  }

  // expand submenu
  submenu.style.height = height + "px";
  setTimeout(() => {
    submenu.style.overflow = "visible";
  }, 500);
}

function initSubmenu() {
  const menus = document.querySelectorAll(
    `[data-css="sidebar-resources"] .adminjs_Label + ul > li > a.adminjs_Box`
  );

  menus.forEach((menu) => {
    menu.addEventListener(
      "click",
      (e) => {
        setTimeout(() => {
          setSubmenuHeight(menu);
        });
      },
      0
    );

    // initial expand
    setSubmenuHeight(menu);
  });
}

window.onload = function () {
  initSubmenu();
  setCurrentModule();
};

navigation.addEventListener("navigate", (e) => {
  setTimeout(() => {
    const url = e.destination.url;
    setCurrentModule();
  }, 0);
});
