document.addEventListener("DOMContentLoaded", () => {
  const navEl = document.querySelector(".navbar") || document.querySelector("header.navbar") || document.querySelector("header");
  if (!navEl) return;

  const isTailwindPage = Boolean(
    document.querySelector('script[src*="tailwindcss"]') ||
    document.getElementById("mainContent") ||
    document.body.classList.contains("tailwind")
  );

  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const currentFile = currentPath.split("/").pop() || "index.html";
  const isInSubfolder = /\/(aula|cswa)\//.test(currentPath);
  const prefix = isInSubfolder ? "../" : "./";

  const buildHref = (path) => {
    if (!path) return path;
    const clean = path.replace(/^\.?\/?/, "");
    return isInSubfolder ? `../${clean}` : `./${clean}`;
  };

  const navItems = [
    { label: "Inicio", href: buildHref("index.html"), id: "index.html" },
    { label: "Dashboard", href: buildHref("dashboard.html"), id: "dashboard.html" },
    { label: "Aula Virtual", href: buildHref("aula/index.html"), id: "aula" },
    { label: "Lab CAD", href: buildHref("index.html#laboratorio"), tabId: "laboratorio" },
    { label: "CSWA Center", href: buildHref("cswa/index.html"), id: "cswa", icon: "fa-award" },
    { label: "Proyecto Final", href: buildHref("proyecto.html"), id: "proyecto.html" },
    { label: "Recursos", href: buildHref("index.html#recursos"), tabId: "recursos" },
    { label: "Certificación CSWA", href: buildHref("index.html#certificacion"), tabId: "certificacion" }
  ];

  const isActive = item => {
    if (!item) return false;
    if (item.id === "aula" && currentPath.includes("/aula")) return true;
    if (item.id === "cswa" && currentPath.includes("/cswa")) return true;
    if (item.id === "index.html" && (currentFile === "index.html" || currentFile === "")) return true;
    return currentFile === item.id;
  };

  const renderTailwindNavbar = () => {
    navEl.className = "bg-swDark text-white shadow-lg flex-shrink-0 z-20";

    const desktopLinks = navItems.map(item => {
      const activeClass = isActive(item) ? "text-swCyan font-bold bg-swCyan/10" : "hover:text-swCyan";
      const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1"></i> ` : "";

      if (item.tabId && typeof window.switchTab === "function") {
        return `<button type="button" onclick="switchTab('${item.tabId}')" class="nav-item px-3 py-2 rounded-md ${activeClass} transition">${iconHTML}${item.label}</button>`;
      }

      return `<a href="${item.href}" class="nav-item px-3 py-2 rounded-md ${activeClass} transition">${iconHTML}${item.label}</a>`;
    }).join("");

    const mobileLinks = navItems.map(item => {
      const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1"></i> ` : "";

      if (item.tabId && typeof window.switchTab === "function") {
        return `<button type="button" onclick="switchTab('${item.tabId}')" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</button>`;
      }

      return `<a href="${item.href}" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</a>`;
    }).join("");

    navEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <a href="${prefix}index.html" class="flex items-center space-x-3 text-white no-underline">
            <div class="w-10 h-10 bg-swCyan rounded-lg flex items-center justify-center text-swDark text-xl font-black shadow-md">SW</div>
            <div>
              <div class="font-extrabold text-lg tracking-wider text-white leading-none">SOLIDWORKS ACADEMY</div>
              <div class="text-xs text-swCyan font-medium tracking-wide">CURSO Y PREPARACIÓN CSWA</div>
            </div>
          </a>

          <nav class="hidden lg:flex space-x-1 text-sm font-medium" aria-label="Navegación principal">
            ${desktopLinks}
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
        ${mobileLinks}
      </div>
    `;

    const mobileBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    if (mobileBtn && mobileMenu) {
      const setMenuState = expanded => {
        mobileMenu.classList.toggle("hidden", !expanded);
        mobileBtn.setAttribute("aria-expanded", String(expanded));
      };

      mobileBtn.addEventListener("click", () => setMenuState(mobileBtn.getAttribute("aria-expanded") !== "true"));

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
  };

  const renderStandardNavbar = () => {
    const linksHTML = navItems.map(item => {
      const active = isActive(item) ? 'class="active"' : "";
      const content = item.tabId ? `<a href="${item.href}" ${active}>${item.label}</a>` : `<a href="${item.href}" ${active}>${item.label}</a>`;
      return `<li>${content}</li>`;
    }).join("");

    navEl.className = "navbar";
    navEl.innerHTML = `
      <a href="${prefix}index.html" class="brand"><span>SOLIDWORKS</span> ACADEMY</a>
      <ul class="nav-links">${linksHTML}</ul>
    `;
  };

  if (isTailwindPage) {
    renderTailwindNavbar();
  } else {
    renderStandardNavbar();
  }
});

window.toggleMobileMenuNavbar = function () {
  const menu = document.getElementById("mobileMenu");
  const btn = document.getElementById("mobileMenuBtn");
  if (!menu || !btn) return;

  const shouldOpen = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !shouldOpen);
  btn.setAttribute("aria-expanded", String(shouldOpen));
};
