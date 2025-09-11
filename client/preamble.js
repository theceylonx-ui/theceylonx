// React Fast Refresh preamble for CSP compliance
// This module provides the preamble that @vitejs/plugin-react expects
// but serves it as an external module instead of inline scripts
if (import.meta.env.DEV) {
  import('/@react-refresh').then((refreshModule) => {
    refreshModule.default.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    console.log('🔄 React Fast Refresh preamble loaded');
  }).catch(() => {
    // Fallback for cases where @react-refresh isn't available
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    console.log('🔄 React Fast Refresh preamble loaded (fallback mode)');
  });
}