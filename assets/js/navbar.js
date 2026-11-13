document.addEventListener("DOMContentLoaded", () => {
  const navEl = document.querySelector(".navbar") || document.querySelector("header.navbar") || document.querySelector("header");
  if (!navEl) return;

  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const currentFile = currentPath.split("/").pop() || "index.html";
  const isSubfolder = /\/(aula|cswa)\//.test(currentPath);

  const navItems = [
    { label: "Inicio", href: isSubfolder ? "../index.html" : "./index.html", id: "index.html" },
    { label: "Dashboard", href: isSubfolder ? "../dashboard.html" : "./dashboard.html", id: "dashboard.html" },
    { label: "Aula Virtual", href: isSubfolder ? "../aula/index.html" : "./aula/index.html", id: "aula" },
    { label: "Lab CAD", href: isSubfolder ? "../index.html#laboratorio" : "./index.html#laboratorio", tabId: "laboratorio" },
    { label: "CSWA Center", href: isSubfolder ? "../cswa/index.html" : "./cswa/index.html", id: "cswa", icon: "fa-award" },
    { label: "Proyecto Final", href: isSubfolder ? "../proyecto.html" : "./proyecto.html", id: "proyecto.html" },
    { label: "Recursos", href: isSubfolder ? "../index.html#recursos" : "./index.html#recursos", tabId: "recursos" },
    { label: "Certificación CSWA", href: isSubfolder ? "../index.html#certificacion" : "./index.html#certificacion", tabId: "certificacion" }
  ];

  const isActive = item => {
    if (item.id === "aula" && currentPath.includes("/aula")) return true;
    if (item.id === "cswa" && currentPath.includes("/cswa")) return true;
    return currentFile === item.id;
  };

  const buildItemHTML = (item, mobile = false) => {
    const activeClass = isActive(item) ? "text-swCyan font-bold bg-swCyan/10" : "hover:text-swCyan";
    const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1"></i> ` : "";
    const baseClasses = mobile
      ? "block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700"
      : `nav-item px-3 py-2 rounded-md transition ${activeClass}`;

    const hasTabHandler = item.tabId && typeof window.switchTab === "function";

    if (hasTabHandler) {
      return `<button type="button" onclick="switchTab('${item.tabId}')" class="${baseClasses}">${iconHTML}${item.label}</button>`;
    }

    return `<a href="${item.href}" class="${baseClasses}">${iconHTML}${item.label}</a>`;
  };

  navEl.className = "bg-swDark text-white shadow-lg flex-shrink-0 z-20";
  navEl.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="${isSubfolder ? "../index.html" : "./index.html"}" class="flex items-center space-x-3 text-white no-underline">
          <div class="w-10 h-10 bg-swCyan rounded-lg flex items-center justify-center text-swDark text-xl font-black shadow-md">SW</div>
          <div>
            <div class="font-extrabold text-lg tracking-wider text-white leading-none">SOLIDWORKS ACADEMY</div>
            <div class="text-xs text-swCyan font-medium tracking-wide">CURSO Y PREPARACIÓN CSWA</div>
          </div>
        </a>

        <nav class="hidden lg:flex space-x-1 text-sm font-medium" aria-label="Navegación principal">
          ${navItems.map(item => buildItemHTML(item, false)).join("")}
        </nav>

        <button
          id="mobileMenuBtn"
          type="button"
          class="lg:hidden text-gray-300 hover:text-white focus:outline-none p-2"
          aria-expanded="false"
          aria-controls="mobileMenu"
          aria-label="Abrir menú móvil"
        >
          <i class="fa-solid fa-bars text-xl"></i>
        </button>
      </div>
    </div>

    <div id="mobileMenu" class="hidden lg:hidden bg-swDark/95 border-b border-gray-700 px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
      ${navItems.map(item => buildItemHTML(item, true)).join("")}
    </div>
  `;

  const mobileBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileBtn && mobileMenu) {
    const setMenuState = expanded => {
      mobileMenu.classList.toggle("hidden", !expanded);
      mobileBtn.setAttribute("aria-expanded", String(expanded));
    };

    mobileBtn.addEventListener("click", () => {
      const isOpen = mobileBtn.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });

    mobileMenu.querySelectorAll("a, button").forEach(item => {
      item.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("click", event => {
      if (!mobileMenu.contains(event.target) && !mobileBtn.contains(event.target)) {
        setMenuState(false);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") setMenuState(false);
    });
  }
});
