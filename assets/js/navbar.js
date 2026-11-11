/**
 * SOLIDWORKS ACADEMY - Dynamic Universal Navbar
 * Handles responsive navigation, active page resolution,
 * and relative path alignment across all subfolders.
 * Updated 2026.
 */

document.addEventListener("DOMContentLoaded", function () {
  const navContainer = document.querySelector("header") || document.querySelector("nav.navbar");
  if (!navContainer) return;

  // Detect directory depth for relative path resolution
  const currentPath = window.location.pathname;
  const isInSubfolder = currentPath.includes('/aula/') || currentPath.includes('/cswa/');
  const prefix = isInSubfolder ? '../' : './';
  const pageName = currentPath.split('/').pop() || 'index.html';
  const isHomePage = pageName === 'index.html' || pageName === '';

  // Unified Navigation Structure
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

  // Desktop Navigation Builder
  let desktopNavHTML = `<nav class="hidden lg:flex space-x-1 text-sm font-medium">`;
  
  // Mobile Navigation Builder
  let mobileNavHTML = `<div id="mobileMenu" class="hidden lg:hidden bg-swDark/95 border-b border-gray-700 px-4 pt-2 pb-4 space-y-2 text-sm font-medium">`;

  navItems.forEach(item => {
    let isActive = false;
    if (item.id === "aula" && currentPath.includes('/aula/')) isActive = true;
    else if (item.id === "cswa" && currentPath.includes('/cswa/')) isActive = true;
    else if (pageName === item.id) isActive = true;

    const activeClass = isActive ? "text-swCyan font-bold bg-swCyan/10" : "hover:text-swCyan";
    const iconHTML = item.icon ? `<i class="fa-solid ${item.icon} mr-1"></i> ` : '';

    if (item.type === "page") {
      desktopNavHTML += `<a href="${item.url}" class="nav-item px-3 py-2 rounded-md ${activeClass} transition">${iconHTML}${item.label}</a>`;
      mobileNavHTML += `<a href="${item.url}" class="block w-full text-left px-3 py-2 rounded-md ${activeClass}">${iconHTML}${item.label}</a>`;
    } else {
      if (isHomePage) {
        desktopNavHTML += `<button onclick="switchTab('${item.tabId}')" class="nav-item px-3 py-2 rounded-md hover:text-swCyan transition">${iconHTML}${item.label}</button>`;
        mobileNavHTML += `<button onclick="switchTab('${item.tabId}')" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</button>`;
      } else {
        desktopNavHTML += `<a href="${item.fallbackUrl}" class="nav-item px-3 py-2 rounded-md hover:text-swCyan transition">${iconHTML}${item.label}</a>`;
        mobileNavHTML += `<a href="${item.fallbackUrl}" class="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700">${iconHTML}${item.label}</a>`;
      }
    }
  });

  desktopNavHTML += `</nav>`;
  mobileNavHTML += `</div>`;

  // DOM Injection
  const targetNav = navContainer.querySelector('nav.hidden.lg\\:flex') || navContainer.querySelector('.nav-links');
  if (targetNav) {
    targetNav.outerHTML = desktopNavHTML;
  }
  
  const targetMobile = document.getElementById('mobileMenu');
  if (targetMobile) {
    targetMobile.outerHTML = mobileNavHTML;
  }
});
