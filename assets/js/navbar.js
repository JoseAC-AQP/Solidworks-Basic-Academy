/**
 * SOLIDWORKS ACADEMY - Dynamic Universal Navbar Engine
 * Automáticamente renderiza y unifica la barra de navegación principal
 * adaptándose dinámicamente a rutas relativas (raíz vs subcarpetas)
 * y resolviendo enlaces activos e interacciones móviles.
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Detectar o crear el contenedor principal de la navegación
  let navHeader = document.querySelector("header") || document.querySelector("nav.navbar");

  // 2. Determinar profundidad de carpeta para resolver rutas relativas
  const currentPath = window.location.pathname;
  const isInSubfolder = currentPath.includes('/aula/') || currentPath.includes('/cswa/');
  const prefix = isInSubfolder ? '../' : './';
  const pageName = currentPath.split('/').pop() || 'index.html';
  const isHomePage = (pageName === 'index.html' || pageName === '') && !isInSubfolder;

  // 3. Estructura de navegación unificada
  const navItems = [
    { label: "Inicio", type: "page", url: `${prefix}index.html`, id: "index.html", tabId: "inicio" },
    { label: "Dashboard", type: "page", url: `${prefix}dashboard.html`, id: "dashboard.html" },
    { label: "Aula Virtual", type: "page", url: `${prefix}aula/index.html`, id: "aula" },
    { label: "Lab CAD", type: "tab", tabId: "laboratorio", fallbackUrl: `${prefix}index.html#laboratorio` },
    { label: "CSWA Center", type: "page", url: `${prefix}cswa/index.html`, id: "cswa", icon: "fa-award" },
    { label: "Proyecto Final", type: "page", url: `${prefix}proyecto.html`, id: "proyecto.html" },
    { label: "Recursos", type: "tab", tabId: "recursos", fallbackUrl: `${prefix}index.html#recursos` },
    { label: "Certificación CSWA", type: "tab", tabId: "certificacion", fallbackUrl: `${prefix}index.html#certificacion` }
  ];

  // 4. Renderizado para páginas basadas en Tailwind (ej. index.html principal)
  if (document.querySelector('script[src*="tailwindcss"]') || document.getElementById('mainContent')) {
    renderTailwindNavbar(navHeader, navItems, pageName, currentPath, isHomePage, prefix);
  } else {
    // Renderizado para páginas basadas en CSS Tradicional (components.css / style.css)
    renderStandardNavbar(navHeader, navItems, pageName, currentPath, isHomePage);
  }
});

/**
 * Renderizador de Barra para la Landing Page / Tailwind Layout
 */
function renderTailwindNavbar(headerEl, navItems, pageName, currentPath, isHomePage, prefix) {
  if (!headerEl) return;

  let desktopNavHTML = navItems.map(item => {
    let isActive = false;
    if (item.id === "aula" && currentPath.includes('/aula/')) isActive = true;
    else if (item.id === "cswa" && currentPath.includes('/cswa/')) isActive = true;
    else if (pageName === item.id) isActive = true;

    const activeClass = isActive ? "text-swCyan font-bold bg-swCyan/10" : "hover:text-swCyan";
    const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1"></i> ` : '';

    if (item.type === "page") {
      return `<a href="${item.url}" class="nav-item px-3 py-2 rounded-md ${activeClass} transition">${iconHTML}${item.label}</a>`;
    } else {
      if (isHomePage) {
        return `<button onclick="switchTab('${item.tabId}')" class="nav-item px-3 py-2 rounded-md hover:text-swCyan transition">${iconHTML}${item.label}</button>`;
      } else {
        return `<a href="${item.fallbackUrl}" class="nav-item px-3 py-2 rounded-md hover:text-swCyan transition">${iconHTML}${item.label}</a>`;
      }
    }
  }).join('');

  let mobileNavHTML = navItems.map(item => {
    const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1"></i> ` : '';
    if (item.type === "page") {
      return `<a href="${item.url}" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</a>`;
    } else {
      if (isHomePage) {
        return `<button onclick="switchTab('${item.tabId}')" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</button>`;
      } else {
        return `<a href="${item.fallbackUrl}" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</a>`;
      }
    }
  }).join('');

  headerEl.className = "bg-swDark text-white shadow-lg flex-shrink-0 z-20";
  headerEl.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="${prefix}index.html" class="flex items-center space-x-3 text-white no-underline">
          <div class="w-10 h-10 bg-swCyan rounded-lg flex items-center justify-center text-swDark text-xl font-black shadow-md">
            SW
          </div>
          <div>
            <div class="font-extrabold text-lg tracking-wider text-white leading-none">SOLIDWORKS ACADEMY</div>
            <div class="text-xs text-swCyan font-medium tracking-wide">CURSO Y PREPARACIÓN CSWA</div>
          </div>
        </a>
        <nav class="hidden lg:flex space-x-1 text-sm font-medium">
          ${desktopNavHTML}
        </nav>
        <div class="lg:hidden">
          <button id="mobileMenuBtn" onclick="toggleMobileMenuNavbar()" class="text-gray-300 hover:text-white focus:outline-none p-2">
            <i class="fa-solid fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </div>
    <div id="mobileMenu" class="hidden lg:hidden bg-swDark/95 border-b border-gray-700 px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
      ${mobileNavHTML}
    </div>
  `;
}

/**
 * Renderizador de Barra para las Lecciones del Aula y CSWA (components.css)
 */
function renderStandardNavbar(navEl, navItems, pageName, currentPath, isHomePage) {
  if (!navEl) return;

  let linksHTML = navItems.map(item => {
    let isActive = false;
    if (item.id === "aula" && currentPath.includes('/aula/')) isActive = true;
    else if (item.id === "cswa" && currentPath.includes('/cswa/')) isActive = true;
    else if (pageName === item.id) isActive = true;

    const activeClass = isActive ? 'class="active"' : '';

    if (item.type === "page") {
      return `<li><a href="${item.url}" ${activeClass}>${item.label}</a></li>`;
    } else {
      return `<li><a href="${item.fallbackUrl}">${item.label}</a></li>`;
    }
  }).join('');

  navEl.className = "navbar";
  navEl.innerHTML = `
    <a href="${navItems[0].url}" class="brand"><span>SOLIDWORKS</span> ACADEMY</a>
    <ul class="nav-links">
      ${linksHTML}
    </ul>
  `;
}

/**
 * Función global auxiliar para desplegar menú móvil en Tailwind
 */
window.toggleMobileMenuNavbar = function() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden');
};
