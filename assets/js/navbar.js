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
      const activeClass = isActive(item)
        ? "text-swCyan font-bold bg-swCyan/10"
        : "hover:text-swCyan";
      const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1" aria-hidden="true"></i>` : "";
      return `<a href="${item.href}" class="px-3 py-2 rounded-md ${activeClass} transition">${iconHTML}${item.label}</a>`;
    }).join("");

    const mobileLinks = navItems.map(item => {
      const activeClass = isActive(item) ? "text-swCyan font-semibold bg-swCyan/10" : "hover:bg-gray-700 hover:text-swCyan";
      const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1" aria-hidden="true"></i>` : "";
      return `<a href="${item.href}" class="block px-3 py-2 rounded-md ${activeClass}">${iconHTML}${item.label}</a>`;
    }).join("");

    navEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between min-h-16 py-2">
          <a href="${prefix}index.html" class="flex items-center gap-3 text-white no-underline" aria-label="SOLIDWORKS ACADEMY, inicio">
            <span class="w-10 h-10 bg-swCyan rounded-lg flex items-center justify-center text-swDark text-xl font-black shadow-md">SW</span>
            <span>
              <span class="block font-extrabold text-base sm:text-lg tracking-wider leading-none">SOLIDWORKS ACADEMY</span>
              <span class="block text-xs text-swCyan font-medium tracking-wide mt-1">CURSO Y PREPARACIÓN CSWA</span>
            </span>
          </a>

          <nav class="hidden lg:flex items-center gap-1 text-sm font-medium" aria-label="Navegación principal">
            ${desktopLinks}
          </nav>

          <button id="mobileMenuBtn" type="button" class="lg:hidden text-gray-200 hover:text-white p-2 rounded" aria-expanded="false" aria-controls="mobileMenu" aria-label="Abrir menú móvil">
            <i class="fa-solid fa-bars text-xl" aria-hidden="true"></i>
          </button>
        </div>

        <nav id="mobileMenu" class="hidden lg:hidden border-t border-gray-700 bg-swDark/95 px-2 pb-3 pt-2 space-y-1 text-sm font-medium" aria-label="Navegación móvil">
          ${mobileLinks}
        </nav>
      </div>
    `;

    const mobileBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    if (mobileBtn && mobileMenu) {
      const setMenuState = expanded => {
        mobileMenu.classList.toggle("hidden", !expanded);
        mobileBtn.setAttribute("aria-expanded", String(expanded));
        mobileBtn.setAttribute("aria-label", expanded ? "Cerrar menú móvil" : "Abrir menú móvil");
        mobileBtn.innerHTML = expanded
          ? '<i class="fa-solid fa-xmark text-xl" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-bars text-xl" aria-hidden="true"></i>';
      };

      mobileBtn.addEventListener("click", () => {
        setMenuState(mobileBtn.getAttribute("aria-expanded") !== "true");
      });

      mobileMenu.querySelectorAll("a").forEach(item => {
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
      return `<li><a href="${item.href}" ${active}>${item.label}</a></li>`;
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
