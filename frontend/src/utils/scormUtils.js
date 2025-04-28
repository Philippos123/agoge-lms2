export const setupScormAPI = (iframe) => {
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.API = window.API;
      iframe.contentWindow.API_1483_2004_API = window.API;
      window.parent.API = window.API;
      window.parent.API_1483_2004_API = window.API;
      console.log("SCORM API (window.API) kopplat till iframe och parent.");
    } catch (error) {
      console.error("Kunde inte koppla SCORM API till iframe/parent:", error);
    }
  }
};