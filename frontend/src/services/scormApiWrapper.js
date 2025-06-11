var SCORM_API_wrapper = (function() {
  'use strict';

  var t = {};
  t.SCORM = {};
  t.SCORM.version = null;
  t.SCORM.API = {
      handle: null,
      isFound: false,
      
      // Fix the API finder to handle cross-origin frames
      find: function() {
          var win = window;
          var attempts = 0;
          var limit = 500;
          
          // First try to find the API in current window
          if (win.API) {
              this.handle = win.API;
              this.isFound = true;
              return true;
          } else if (win.API_1484_11) {
              this.handle = win.API_1484_11;
              this.isFound = true;
              t.SCORM.version = "2004";
              return true;
          }
          
          // Try to find API in parent windows using postMessage if possible
          // This is the cross-origin safe approach
          if (window.parent !== window && window.parent.postMessage) {
              // Setup message listener for API response
              window.addEventListener('message', function(event) {
                  // Verify origin is trusted (replace with your LMS domain)
                  if (event.origin === "https://your-django-app-domain.com") {
                      if (event.data.SCORMAPIFound) {
                          console.log("SCORM API found via postMessage");
                          t.SCORM.API.isFound = true;
                          // Use a proxy approach instead of direct access
                          t.SCORM.API.useProxy = true;
                          return true;
                      }
                  }
              }, false);
              
              // Request API from parent
              window.parent.postMessage({findSCORMAPI: true}, '*');
          }

          // If we're in an iframe, we need a proxy approach
          if (window !== window.parent) {
              console.log("Content is in iframe, using proxy approach");
              this.useProxy = true;
              this.isFound = true;  // We'll assume proxy will work
              return true;
          }
          
          return false;
      },
      
      // Get API handle using proxy if needed
      getHandle: function() {
          if (!this.isFound) {
              this.find();
          }
          
          if (this.useProxy) {
              // Will use postMessage proxy
              return true;
          }
          
          return this.handle;
      }
  };
  
  // Initialize proxy communication
  t.SCORM.proxy = {
      send: function(action, params, callback) {
          var messageId = new Date().getTime().toString();
          
          // Save callback for later response
          if (callback) {
              this.callbacks = this.callbacks || {};
              this.callbacks[messageId] = callback;
          }
          
          // Send message to parent frame
          window.parent.postMessage({
              scormProxyRequest: true,
              action: action,
              params: params,
              messageId: messageId
          }, '*');
      },
      
      // Process responses
      receiveMessage: function(event) {
          // Verify origin (replace with your domain)
          if (event.origin !== "https://your-django-app-domain.com") {
              return;
          }
          
          var data = event.data;
          if (data.scormProxyResponse && data.messageId) {
              // Find and execute callback
              if (this.callbacks && this.callbacks[data.messageId]) {
                  this.callbacks[data.messageId](data.result, data.errorCode, data.errorMsg);
                  delete this.callbacks[data.messageId]; // Clean up
              }
          }
      }
  };
  
  // Listen for proxy responses
  window.addEventListener('message', function(event) {
      t.SCORM.proxy.receiveMessage(event);
  }, false);
  
  t.SCORM.connection = {
      isActive: false,
      
      initialize: function() {
          var API = t.SCORM.API.getHandle();
          var errorCode = 0;
          var result = false;
          
          if (t.SCORM.API.useProxy) {
              // Use proxy to initialize
              t.SCORM.proxy.send('Initialize', [''], function(proxyResult) {
                  result = proxyResult;
                  t.SCORM.connection.isActive = result === 'true';
                  console.log("SCORM initialization via proxy: " + t.SCORM.connection.isActive);
              });
              return true; // Assume success initially with proxy
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  result = API.Initialize('');
              } else {
                  result = API.LMSInitialize('');
              }
              
              if (result.toString() === "true") {
                  t.SCORM.connection.isActive = true;
                  return true;
              }
          }
          
          console.error("SCORM initialization failed");
          return false;
      },
      
      // Other SCORM functions like terminate, getValue, setValue can follow
      // similar pattern using the proxy when needed
      terminate: function() {
          if (!t.SCORM.connection.isActive) {
              return 'false';
          }
          
          var API = t.SCORM.API.getHandle();
          var result = 'false';
          
          if (t.SCORM.API.useProxy) {
              t.SCORM.proxy.send('Terminate', [''], function(proxyResult) {
                  result = proxyResult;
                  t.SCORM.connection.isActive = false;
              });
              return 'true'; // Assume success
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  result = API.Terminate('');
              } else {
                  result = API.LMSFinish('');
              }
              
              if (result.toString() === "true") {
                  t.SCORM.connection.isActive = false;
              }
          }
          
          return result;
      },
      
      getValue: function(parameter) {
          if (!t.SCORM.connection.isActive) {
              return '';
          }
          
          var API = t.SCORM.API.getHandle();
          var result = '';
          
          if (t.SCORM.API.useProxy) {
              // Use proxy for getValue
              // This is synchronous in normal SCORM but needs to be async with proxy
              // We'll return a placeholder and update via callback
              t.SCORM.proxy.send('GetValue', [parameter], function(proxyResult) {
                  result = proxyResult;
                  // You may need a callback system to handle async values
              });
              return 'pending'; // Placeholder
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  result = API.GetValue(parameter);
              } else {
                  result = API.LMSGetValue(parameter);
              }
          }
          
          return result;
      },
      
      setValue: function(parameter, value) {
          if (!t.SCORM.connection.isActive) {
              return 'false';
          }
          
          var API = t.SCORM.API.getHandle();
          var result = 'false';
          
          if (t.SCORM.API.useProxy) {
              t.SCORM.proxy.send('SetValue', [parameter, value], function(proxyResult) {
                  result = proxyResult;
              });
              return 'true'; // Assume success
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  result = API.SetValue(parameter, value);
              } else {
                  result = API.LMSSetValue(parameter, value);
              }
          }
          
          return result;
      },
      
      commit: function() {
          if (!t.SCORM.connection.isActive) {
              return 'false';
          }
          
          var API = t.SCORM.API.getHandle();
          var result = 'false';
          
          if (t.SCORM.API.useProxy) {
              t.SCORM.proxy.send('Commit', [''], function(proxyResult) {
                  result = proxyResult;
              });
              return 'true'; // Assume success
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  result = API.Commit('');
              } else {
                  result = API.LMSCommit('');
              }
          }
          
          return result;
      },
      
      getLastError: function() {
          var API = t.SCORM.API.getHandle();
          var code = 0;
          
          if (t.SCORM.API.useProxy) {
              t.SCORM.proxy.send('GetLastError', [], function(proxyResult) {
                  code = parseInt(proxyResult, 10);
              });
              return 0; // Placeholder
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  code = API.GetLastError();
              } else {
                  code = API.LMSGetLastError();
              }
          }
          
          return code;
      },
      
      getErrorString: function(errorCode) {
          var API = t.SCORM.API.getHandle();
          var result = '';
          
          if (t.SCORM.API.useProxy) {
              t.SCORM.proxy.send('GetErrorString', [errorCode], function(proxyResult) {
                  result = proxyResult;
              });
              return 'Error description pending'; // Placeholder
          } else if (API) {
              if (t.SCORM.version === "2004") {
                  result = API.GetErrorString(errorCode);
              } else {
                  result = API.LMSGetErrorString(errorCode);
              }
          }
          
          return result;
      }
  };
  
  return t;
})();