let extPanelWindow = null;
let cureentStatus = 'Stopped';

chrome.devtools.panels.create("Response Override",
  "../images/icon.png",
  "../panel/panel.html",
  (panel) => {
    panel.onShown.addListener(pinTab);
  }
);
function ajaxMe(url, success, error) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url)
  xhr.send();
  xhr.onload = function() {
    if (xhr.status === 200) {
      success(xhr)
    } else {
      error(xhr.status)
    }
  }
}
function replaceResponse(response, filteredData, callback) {
  var find = new RegExp(filteredData.find, "g");
  callback(response.replace(find, filteredData.replace))
}
function checkURLTagged(url, replaceData) {
  for (let i = 0; i < replaceData.length; i++) {
    if (url.indexOf(replaceData[i].url) !== -1) {
      return replaceData[i];
    }
  }
  return false;
}

let debugee = null;
function setupDebugger(target) {
  debugee = { tabId: target.id };

  chrome.debugger.attach(debugee, "1.0", () => {
    chrome.debugger.sendCommand(debugee, "Network.setRequestInterception", { patterns: [{ urlPattern: '*' }] });
  });

  chrome.debugger.onEvent.addListener((source, method, params) => {
    var request = params.request;
    var continueParams = {
      interceptionId: params.interceptionId,
    };
    if (source.tabId === target.id) {
      if (method === "Network.requestIntercepted") {
        chrome.storage.local.get("replaceData", (storageData) => {
          let filteredData = checkURLTagged(params.request.url, storageData.replaceData);
          if (filteredData) {
            var responseLines = [];
            responseLines.push('HTTP/1.1 200 OK');
            //responseLInes.push('Access-Control-Allow-Headers:Accept,Authorization,Content-TYpe,X-Custom-Header,DNT,X-CustomHeader,DNT,X-CustomHeader,Keep-Alive,User-Agent')
            ajaxMe(request.url, (data) => {
              replaceResponse(data.response, filteredData, (replacedData) => {
                let headers = data.getAllResponseHeaders();
                responseLines.push(headers);
                responseLines.push('');
                responseLines.push('');
                responseLines.push(replacedData);
                continueParams.rawResponse = btoa(unescape(encodeURIComponent(responseLines.join('\r\n'))));
                chrome.debugger.sendCommand(debugee, 'Network.continueInterceptedRequest', continueParams);
              });
            }, (status) => {
              responseLInes[0] = `HTTP/1.1 ${status}`;
              continecontinueParams.rawResponse = btoa(responseLines.join('\r\n'));
              chrome.debugger.sendCommand(debugee, 'Network.continueInterceptedRequest', continueParams);
            });
          } else {
            chrome.debugger.sendCommand(debugee, 'Network.continueInterceptedRequest', continueParams);
          }
        });
      }
    }
  });
}

function setupActions() {
  extPanelWindow.addEventListener('message', (event) => {
    if (event.source !== extPanelWindow) {
      returnl
    }
    let message = event.data;
    if (message && message.source !== 'override-debug') {
      return;
    }
    switch (message.action) {
      case 'start': {
        startOverride();
        break;
      }
      case 'stop': {
        destroyDebugger();
      }
    }
  })
}

function startOverride() {
  chrome.tabs.getSelected(null, (tab) => {
    setupDebugger(tab);
  });
}
function pinTab(panelWindow) {
  extPanelWindow = panelWindow;
  setupActions();
}
function destroyDebugger() {
  chrome.debugger.detach(debugee);
}





