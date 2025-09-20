/**
 * Component Loader - Dynamically loads HTML components
 * Handles loading of reusable HTML partials like navbar, footer, etc.
 */

const BASE_URL = window.location.origin + '/api/preview-68ceb45b2ff125979136950b/';

/**
 * Load a component from a file and inject it into a container
 * @param {string} containerSelector - CSS selector for the container
 * @param {string} componentPath - Path to the component file (optional, can be read from data-source)
 * @returns {Promise<void>}
 */
export async function loadComponent(containerSelector, componentPath = null) {
  try {
    const container = document.querySelector(containerSelector);
    
    if (!container) {
      console.warn(`Container not found: ${containerSelector}`);
      return;
    }

    // Get component path from data-source attribute or parameter
    const filePath = componentPath || container.getAttribute('data-source');
    
    if (!filePath) {
      console.warn(`No component path specified for ${containerSelector}`);
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="animate-pulse bg-gray-200 h-16 w-full rounded"></div>';

    // Fetch the component
    const response = await fetch(BASE_URL + filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load component: ${response.status} ${response.statusText}`);
    }

    const componentHTML = await response.text();
    
    // Inject the component
    container.innerHTML = componentHTML;
    
    // Initialize any scripts in the loaded component
    initializeComponentScripts(container);
    
    console.log(`✅ Component loaded: ${filePath}`);
    
  } catch (error) {
    console.error(`Failed to load component ${containerSelector}:`, error);
    
    // Show error state
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <i data-lucide="alert-circle" class="w-5 h-5 text-red-500 mx-auto mb-2"></i>
          <p class="text-red-600 text-sm">Failed to load component</p>
        </div>
      `;
    }
  }
}

/**
 * Load multiple components simultaneously
 * @param {Array<{selector: string, path?: string}>} components - Array of component configurations
 * @returns {Promise<void>}
 */
export async function loadComponents(components) {
  const loadPromises = components.map(({ selector, path }) => 
    loadComponent(selector, path)
  );
  
  try {
    await Promise.all(loadPromises);
    console.log(`✅ All components loaded successfully`);
  } catch (error) {
    console.error('Some components failed to load:', error);
  }
}

/**
 * Initialize scripts within a loaded component
 * @param {Element} container - The container element with loaded component
 */
function initializeComponentScripts(container) {
  // Find and execute script tags in the loaded component
  const scripts = container.querySelectorAll('script');
  
  scripts.forEach(script => {
    if (script.src) {
      // External script - create new script element
      const newScript = document.createElement('script');
      newScript.src = script.src;
      newScript.async = script.async;
      newScript.defer = script.defer;
      document.head.appendChild(newScript);
    } else {
      // Inline script - execute directly
      try {
        eval(script.textContent);
      } catch (error) {
        console.error('Error executing component script:', error);
      }
    }
  });
  
  // Initialize Lucide icons for the loaded component
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Reload a specific component
 * @param {string} containerSelector - CSS selector for the container
 * @returns {Promise<void>}
 */
export async function reloadComponent(containerSelector) {
  const container = document.querySelector(containerSelector);
  
  if (!container) {
    console.warn(`Container not found: ${containerSelector}`);
    return;
  }

  const filePath = container.getAttribute('data-source');
  
  if (!filePath) {
    console.warn(`No component path specified for ${containerSelector}`);
    return;
  }

  await loadComponent(containerSelector, filePath);
}

/**
 * Check if a component is loaded
 * @param {string} containerSelector - CSS selector for the container
 * @returns {boolean}
 */
export function isComponentLoaded(containerSelector) {
  const container = document.querySelector(containerSelector);
  
  if (!container) return false;
  
  // Check if container has actual content (not loading state)
  const hasLoadingState = container.querySelector('.animate-pulse');
  const hasContent = container.children.length > 0;
  
  return hasContent && !hasLoadingState;
}

/**
 * Wait for component to be loaded
 * @param {string} containerSelector - CSS selector for the container
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>}
 */
export function waitForComponent(containerSelector, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkComponent = () => {
      if (isComponentLoaded(containerSelector)) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }
      
      setTimeout(checkComponent, 100);
    };
    
    checkComponent();
  });
}

/**
 * Auto-load components with data-source attribute
 * Call this function to automatically load all components on page load
 */
export function autoLoadComponents() {
  const containers = document.querySelectorAll('[data-source]');
  
  containers.forEach(container => {
    const selector = `#${container.id}` || container.tagName.toLowerCase();
    loadComponent(selector);
  });
}

/**
 * Component loader with caching
 */
class ComponentCache {
  constructor() {
    this.cache = new Map();
  }
  
  async get(filePath) {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }
    
    try {
      const response = await fetch(BASE_URL + filePath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      this.cache.set(filePath, html);
      return html;
    } catch (error) {
      console.error(`Failed to fetch component ${filePath}:`, error);
      throw error;
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

// Export cached loader instance
export const componentCache = new ComponentCache();

/**
 * Load component with caching
 * @param {string} containerSelector - CSS selector for the container
 * @param {string} componentPath - Path to the component file
 * @returns {Promise<void>}
 */
export async function loadComponentCached(containerSelector, componentPath = null) {
  try {
    const container = document.querySelector(containerSelector);
    
    if (!container) {
      console.warn(`Container not found: ${containerSelector}`);
      return;
    }

    const filePath = componentPath || container.getAttribute('data-source');
    
    if (!filePath) {
      console.warn(`No component path specified for ${containerSelector}`);
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="animate-pulse bg-gray-200 h-16 w-full rounded"></div>';

    // Get component from cache
    const componentHTML = await componentCache.get(filePath);
    
    // Inject the component
    container.innerHTML = componentHTML;
    
    // Initialize any scripts in the loaded component
    initializeComponentScripts(container);
    
    console.log(`✅ Component loaded (cached): ${filePath}`);
    
  } catch (error) {
    console.error(`Failed to load component ${containerSelector}:`, error);
    
    // Show error state
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <i data-lucide="alert-circle" class="w-5 h-5 text-red-500 mx-auto mb-2"></i>
          <p class="text-red-600 text-sm">Failed to load component</p>
        </div>
      `;
    }
  }
}

// Default export
export default {
  loadComponent,
  loadComponents,
  reloadComponent,
  isComponentLoaded,
  waitForComponent,
  autoLoadComponents,
  loadComponentCached,
  componentCache
};