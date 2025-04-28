let initialized = false;
let terminated = false;
let errorCode = "0";
let currentCourseId = null;

// Gör API-objektet globalt tillgängligt OMEDELBART


const API = {
  LMSInitialize: (param) => {
    console.log("LMSInitialize CALLED with:", param);
    if (initialized) {
      console.log("LMSInitialize: Already initialized, returning true.");
      return "true";
    }
    initialized = true;
    errorCode = "0";
    currentCourseId = getCurrentCourseId();
    console.log("LMSInitialize: Initialized successfully, currentCourseId:", currentCourseId);
    return "true";
  },

  LMSGetValue: (cmiElement) => {
    console.log("LMSGetValue CALLED for:", cmiElement);
    if (!initialized || terminated || !currentCourseId) {
      console.log("LMSGetValue: Not initialized or terminated, returning empty string.");
      return "";
    }
    errorCode = "0";
    console.log("LMSGetValue: Fetching data from backend for:", cmiElement);
    return new Promise((resolve) => {
      api.post('/scorm/data/get/', { courseId: currentCourseId, cmiElement })
        .then(response => {
          console.log("LMSGetValue: Backend response:", response.data.value);
          resolve(response.data.value);
        })
        .catch(error => {
          console.error("LMSGetValue: Error fetching from backend:", error);
          errorCode = "401";
          resolve("");
        });
    });
  },

  LMSSetValue: (cmiElement, value) => {
    console.log("LMSSetValue CALLED for:", cmiElement, "value:", value);
    if (!initialized || terminated || !currentCourseId) {
      console.log("LMSSetValue: Not initialized or terminated, returning false.");
      return "false";
    }
    errorCode = "0";
    console.log("LMSSetValue: Sending data to backend:", cmiElement, value);
    api.post('/scorm/data/set/', { courseId: currentCourseId, cmiElement, value })
      .catch(error => {
        console.error("LMSSetValue: Error sending to backend:", error);
        errorCode = "405";
        return "false";
      });
    console.log("LMSSetValue: Data sent to backend (asynchronously), returning true.");
    return "true";
  },

  LMSCommit: (param) => {
    console.log("LMSCommit CALLED with:", param);
    if (!initialized || terminated || !currentCourseId) {
      console.log("LMSCommit: Not initialized or terminated, returning false.");
      return "false";
    }
    errorCode = "0";
    console.log("LMSCommit: Sending commit request to backend.");
    api.post('/scorm/data/commit/', { courseId: currentCourseId })
      .catch(error => {
        console.error("LMSCommit: Error during commit:", error);
        return "false";
      });
    console.log("LMSCommit: Commit request sent (asynchronously), returning true.");
    return "true";
  },

  LMSFinish: (param) => {
    console.log("LMSFinish CALLED with:", param);
    if (terminated || !currentCourseId) {
      console.log("LMSFinish: Already terminated or no course ID, returning true.");
      return "true";
    }
    terminated = true;
    errorCode = "0";
    console.log("LMSFinish: Sending finish request to backend.");
    api.post('/scorm/session/end/', { courseId: currentCourseId })
      .catch(error => {
        console.error("LMSFinish: Error during session end:", error);
      });
    console.log("LMSFinish: Finish request sent (asynchronously), returning true.");
    return "true";
  },

  LMSGetLastError: () => {
    console.log("LMSGetLastError CALLED:", errorCode);
    return errorCode;
  },

  LMSGetErrorString: (errorCode) => {
    console.log("LMSGetErrorString CALLED for:", errorCode);
    return "Ingen felbeskrivning tillgänglig";
  },

  LMSGetDiagnostic: (param) => {
    console.log("LMSGetDiagnostic CALLED for:", param);
    return "";
  },
};

// Gör API-objektet globalt tillgängligt EFTER att det har skapats
window.API = API;
window.API_1483_2004_API = API;
window.top.API = API;
window.top.API_1483_2004_API = API;

function getCurrentCourseId() {
  const pathParts = window.location.pathname.split('/');
  const courseIdIndex = pathParts.indexOf('coursetobuy') + 1;
  const id = courseIdIndex > 0 ? pathParts[courseIdIndex] : null;
  console.log("getCurrentCourseId: Returning", id);
  return id;
}