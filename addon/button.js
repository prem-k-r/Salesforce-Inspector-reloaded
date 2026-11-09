// sfdcBody: normal Salesforce page
// ApexCSIPage: Developer Console
// auraLoadingBox: Lightning / Salesforce1
// studioBody: Exoperience Builder
// flowContainer: Flow Debugger
const visualForceDomains = ["visualforce.com", "vf.force.com"];
if (document.querySelector("body.sfdcBody, body.ApexCSIPage, #auraLoadingBox, #studioBody, #flowContainer") || visualForceDomains.filter(host => location.host.endsWith(host)).length > 0) {
  // We are in a Salesforce org
  chrome.runtime.sendMessage({message: "getSfHost", url: location.href}, sfHost => {
    if (sfHost && !document.getElementById("insext")) {
      initButton(sfHost, false);
      let script = document.createElement("script");
      script.src = chrome.runtime.getURL("inject.js");
      document.body.appendChild(script);
    }
  });
}

function initButton(sfHost, inInspector) {
  let rootEl = document.createElement("div");
  rootEl.id = "insext";
  if (window !== window.top) {
    rootEl.style.display = "none";
  }
  let btn = document.createElement("button");
  let iFrameLocalStorage = {};
  btn.type = "button";
  btn.className = "insext-btn";
  btn.accessKey = "i";
  btn.title = "Show Salesforce details (Alt+I / Shift+Alt+I)";
  rootEl.appendChild(btn);
  loadPopup(sfHost);
  document.body.appendChild(rootEl);


  // Calulates default position, left to right for horizontal, and adds boundaries to keep it on screen
  function calcPopup({popupArrowOrientation: o, popupArrowPosition: pos, popupHeighDynamictMode: dynamicHeight}) {
    o = o || "vertical"; // Default to vertical
    const isVertical = o === "vertical";
    pos = pos ? Math.min(95, pos) + "%" : "122px";
    const [posStyle, oStyle] = isVertical ? ["top", "right"] : ["left", "bottom"];
    const imgSrc = isVertical
      ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M14 7l-5 5 5 5' stroke='%230176d3' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%230176d3' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
    let btnClasses = [];
    btnClasses.push(`insext-btn-${o}`);
    if (dynamicHeight === "true") {
      btnClasses.push("insext-btn-dynamic-height");
    }
    return {pos, posStyle, oStyle, imgSrc, btnClasses};
  }

  function setRootCSSProperties(rootElement, buttonElement) {
    const p = calcPopup(iFrameLocalStorage);
    let img = document.createElement("img");
    img.role = "presentation";
    img.src = p.imgSrc;
    rootElement.style[p.posStyle] = p.pos;
    rootElement.style[p.oStyle] = 0;
    p.btnClasses.forEach(item => buttonElement.classList.add(item));
    buttonElement.appendChild(img);
  }

  function observeElement(selector, callback) {
    const targetNode = document.querySelector(selector);

    if (targetNode) {
      callback(targetNode);
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        const targetNode = document.querySelector(selector);
        if (targetNode) {
          callback(targetNode);
          obs.disconnect();
        }
      });

      observer.observe(document, {
        childList: true,
        subtree: true
      });
    }
  }

  // Salesforce pages: Salesforce cloud icon, color filled in the SVG
  function salesforceCloudSvg(color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="${color}" d="M13.339 7.219a5.62 5.62 0 0 1 4.063-1.74c2.078 0 3.938 1.203 4.917 2.943c.844-.401 1.802-.604 2.802-.604c3.802 0 6.88 3.12 6.88 6.964c0 3.839-3.083 6.958-6.901 6.958a7.3 7.3 0 0 1-1.359-.141a5 5 0 0 1-4.401 2.604a5.3 5.3 0 0 1-2.198-.5a5.76 5.76 0 0 1-5.302 3.495a5.74 5.74 0 0 1-5.401-3.755a5 5 0 0 1-1.099.099c-2.938 0-5.339-2.401-5.339-5.401c0-2 1.078-3.74 2.677-4.677A6.1 6.1 0 0 1 2.157 11c0-3.438 2.802-6.198 6.203-6.198c2.042 0 3.797.938 4.958 2.401z"/></svg>`;
  }

  // Extension pages: the extension's own icon, color filled in the SVG
  function extensionIconSvg(color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="${color}" d="M33.5 19.225c-13.725 0-24.85 11.1-24.875 24.8 0 3.5.726 6.85 2.05 9.875A21.62 21.62 0 0 0 0 72.6c0 11.925 9.55 21.576 21.35 21.576 1.525 0 2.975-.151 4.4-.451 3.25 8.8 12.125 15.05 21.625 15.05S65.051 103 68.551 94.75a20.1 20.1 0 0 0 8.824 2.025c7.55 0 14.15-4.176 17.6-10.326 1.75.375 3.575.551 5.425.551 15.25 0 27.6-12.475 27.6-27.85s-12.35-27.826-27.6-27.826c-3.975 0-7.725.85-11.15 2.375C85.325 26.724 77.95 22 69.5 22c-6.35 0-12.1 2.675-16.225 6.975a24.82 24.82 0 0 0-19.775-9.75M89.855 50.04c5.212-.219 12.836.461 20.327 1.813 4.512.814 5.209 1.08 5.65 2.17.165.407.17.487.168 3.197-.002 2.09-.026 2.846-.1 3.058-.103.298-.433.584-1.513 1.313-1.268.856-2.227 1.858-2.678 2.799-.312.65-.678 1.789-1.047 3.261-1.102 4.396-2.082 6.805-3.578 8.784-1.72 2.275-3.69 3.503-6.926 4.316-3.54.89-8.27 1.431-12.504 1.434-3.1.001-6.126-.364-8.146-.985-3.602-1.106-5.997-3.831-8.469-9.638-.632-1.485-1.867-4.6-2.309-5.82-1.279-3.54-1.925-4.243-3.87-4.216-1.908.027-2.268.53-4.458 6.243-1.187 3.097-1.792 4.529-2.568 6.084-.753 1.507-1.775 3.151-2.545 4.093-.87 1.065-2.09 2.052-3.27 2.647-2.444 1.232-7.273 1.814-12.535 1.51v.002c-2.592-.15-4.811-.408-7.095-.823-5.865-1.065-8.42-2.637-10.625-6.529-.76-1.34-1.407-3.185-2.21-6.307-.541-2.108-.922-3.332-1.226-3.943-.545-1.096-1.415-2.017-2.717-2.875-.41-.27-.876-.61-1.037-.754-.557-.503-.542-.412-.568-3.453-.025-2.989.009-3.345.363-3.834.553-.763 2.305-1.223 8.46-2.22 4.372-.71 6.566-.951 11.286-1.253 1.848-.118 6.04-.119 7.584-.002 4.871.37 8.57.902 12.655 1.823 4.273.962 4.544 1.008 8.634 1.384.754.07 3.314.047 4.43-.039 2.581-.198 4.17-.443 7.072-1.092 6.304-1.408 9.974-1.922 15.365-2.148m-49.021 3.766c-2.35-.116-4.559-.106-6.492.037-5.906.436-8.42.978-10.1 2.177-.834.597-1.208 1.087-1.596 2.1-.336.88-.42 1.556-.373 2.983.094 2.806.787 6.459 1.743 9.183 1.027 2.93 2.14 4.603 3.75 5.631 1.557.995 3.155 1.455 7.025 2.02 3.213.468 6.281.638 8.975.494 3.208-.172 5.427-.608 6.687-1.313.594-.332 1.605-1.273 2.129-1.982.468-.633.807-1.257 1.27-2.336.203-.475.674-1.54 1.046-2.365 1.036-2.299 1.574-3.99 2.079-6.534.376-1.9.434-2.45.345-3.234-.174-1.532-.898-2.876-2.011-3.732-1.576-1.213-3.598-1.895-7.153-2.41a78 78 0 0 0-7.324-.72m47.871.035c-3.945.318-5.122.449-7.492.832-2.557.413-3.405.63-4.701 1.205-2.415 1.07-3.713 2.74-3.907 5.021-.074.875.433 3.646 1.002 5.48.484 1.558 1.902 5.191 2.551 6.534 1.185 2.45 2.25 3.695 3.795 4.426 1.943.919 6.935 1.357 11.568 1.015 2.139-.157 5.248-.575 6.684-.898 1.697-.382 2.271-.555 2.926-.879 1.296-.641 2.488-1.64 3.185-2.67.548-.808 1.384-2.686 1.913-4.297.906-2.764 1.68-8.395 1.404-10.197-.19-1.236-.551-2.016-1.295-2.799-1.572-1.654-3.752-2.22-10.674-2.773-1.82-.146-5.164-.145-6.959 0"/><path fill="#ffffffcc" d="M40.883 52.809c-2.383-.118-4.63-.11-6.615.037-5.946.438-8.66.97-10.608 2.361-.93.665-1.522 1.444-1.947 2.557-.378.988-.489 1.896-.44 3.373.098 2.942.801 6.635 1.8 9.48 1.062 3.03 2.306 4.964 4.154 6.145 1.7 1.087 3.512 1.595 7.42 2.166 3.268.477 6.396.65 9.171.502 3.275-.175 5.58-.575 7.123-1.438.875-.489 1.808-1.398 2.446-2.262.517-.7.907-1.421 1.384-2.535.197-.459.67-1.528 1.04-2.35 1.057-2.347 1.632-4.154 2.146-6.747.38-1.918.46-2.659.36-3.543-.202-1.777-1.05-3.376-2.397-4.412-1.76-1.354-3.992-2.082-7.617-2.608a79 79 0 0 0-7.42-.726m47.742.037c-3.95.319-5.186.456-7.572.842-2.577.416-3.588.674-4.948 1.277-2.645 1.173-4.274 3.236-4.496 5.851-.06.718.077 1.577.272 2.645.195 1.067.47 2.244.771 3.217.517 1.666 1.897 5.206 2.606 6.672 1.229 2.542 2.487 4.052 4.267 4.894 1.216.575 2.986.886 5.116 1.072s4.58.212 6.955.038c2.196-.162 5.27-.57 6.828-.92 1.712-.386 2.414-.595 3.15-.96 1.448-.716 2.745-1.787 3.57-3.005.687-1.013 1.482-2.856 2.036-4.545.49-1.493.907-3.613 1.185-5.635.279-2.021.44-3.833.256-5.027-.21-1.362-.698-2.43-1.558-3.336-.906-.954-2.08-1.63-3.803-2.078-1.724-.448-4.036-.724-7.516-1.002-1.917-.153-5.225-.153-7.119 0"/></svg>`;
  }

  function setFavicon(sfHost) {
    // Only update favicon if enabled, otherwise keep default
    let {[sfHost + "_customFavicon"]: fav, "colorizeProdBanner": colorizeProd, [sfHost + "_isSandbox"]: isSandbox, [sfHost + "_trialExpirationDate"]: trialExpDate, [sfHost + "_prodBannerText"]: prodBannerText} = iFrameLocalStorage;
    fav = typeof fav === "string" ? fav.trim() : "";
    if (!fav) {
      return;
    }
    let current = document.querySelector('link[rel="shortcut icon"]');
    let link = current ? current : document.createElement("link");
    link.setAttribute("rel", "icon");
    link.orgType = "image/x-icon";
    if (fav.indexOf("http") == -1){
      const color = fav;
      const extensionPage = window.location.href.startsWith(chrome.runtime.getURL(""));
      if (iFrameLocalStorage.colorizeSandboxBanner === "true" && !extensionPage && (isSandbox === "true" || (trialExpDate && trialExpDate !== "null"))){
        colorizeBanner(color, isSandbox, prodBannerText);
      }
      if (colorizeProd === "true" && isSandbox === "false" && trialExpDate === "null"){
        colorizeBanner(color, isSandbox, prodBannerText);
        if (extensionPage){
          addBorder(color);
        }
      }
      fav = "data:image/svg+xml;base64," + btoa(extensionPage ? extensionIconSvg(color) : salesforceCloudSvg(color));
      link.setAttribute("type", "image/svg+xml");
    }
    link.href = fav;
    document.head.appendChild(link);
  }

  function colorizeBanner(faviconColor, isSandbox, bannerText){
    const sandboxBannerSelector = "div.slds-color__background_gray-1.slds-text-align_center.slds-size_full.slds-text-body_regular.oneSystemMessage";
    if (isSandbox === "false"){
      let envNameBanner = addBannerText(isSandbox, faviconColor, bannerText, sandboxBannerSelector);
      const bannerContainer = document.querySelector(sandboxBannerSelector);
      addBannerText(isSandbox, faviconColor, bannerText, bannerContainer);
      if (bannerContainer) {
        //most of the time
        bannerContainer.appendChild(envNameBanner);
      } else {
        //when login as is displayed the banner is not reachable without mutation obersver
        observeElement(sandboxBannerSelector, (banner) => {
          banner.appendChild(envNameBanner);
        });
      }
    } else {
      // add a new observer for the new devops_center sandbox banner
      observeElement("devops_center-base-component", (banner) => {
        const navBar = banner.getElementsByClassName("navBar-container")[0];
        if (bannerText){
          addBannerText(true, faviconColor, bannerText, navBar.firstChild);
        }
        if (navBar) navBar.style.backgroundColor = faviconColor;
      });

    }
  }

  function addBannerText(isSandbox, faviconColor, bannerText, bannerContainer) {
    const envNameBanner = document.createElement("div");
    envNameBanner.style.backgroundColor = faviconColor;
    envNameBanner.style.color = "white";
    const envNameSpan = document.createElement("span");
    envNameSpan.textContent = bannerText ? bannerText : "WARNING: THIS IS PRODUCTION";
    envNameBanner.appendChild(envNameSpan);
    if (isSandbox === "false"){
      envNameBanner.className = "slds-notify_alert";
    } else {
      bannerContainer.firstChild.after(envNameBanner);
    }
    return envNameBanner;
  }

  function addBorder(fav){
    const style = document.createElement("style");
    style.textContent = `
      body::before {
        content: '';
        display: block;
        position: fixed;
        width: 100%;
        height: 2px;
        background-color: ${fav};
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  }

  function loadPopup(sfHost) {
    btn.addEventListener("click", () => {
      const isInactive = !rootEl.classList.contains("insext-active");
      togglePopup(isInactive);
    });

    let popupSrc = chrome.runtime.getURL("popup.html?host=" + sfHost);
    let popupEl = document.createElement("iframe");
    popupEl.title = "Salesforce Inspector Reloaded";

    function getOrientation(source) {
      return getKeyFromStorage(source, "popupArrowOrientation", "vertical");
    }

    function getKeyFromStorage(source, key, defaultValue) {
      const o = (source === "localStorage") ? localStorage.getItem(key) : iFrameLocalStorage?.[key];
      return o || defaultValue;
    }

    // return a value for direction popup will expand, based on position and orientation
    function calcDirection(pos, o) {
      if (o === "horizontal") {
        return pos < 90 ? "left" : "right";
      }
      return pos >= 55 ? "up" : null;
    }

    function resetPopupClass(source, dynamicHeight, orientation, position = "20", direction = null) {
      popupEl.className = "insext-popup";
      popupEl.classList.add(`insext-popup-${orientation}`);

      //manage dynamic height of popup
      const intPosition = Number(position);

      if (dynamicHeight) {
        const height = direction === "up" ? intPosition : (98 - (orientation === "horizontal" ? 0 : intPosition)); //the height is the total height minus the position and the popup margin at the bottom
        popupEl.style.height = `calc(${height}vh)`;

        //in up direction, we need to adjust the top position to keep the popup on screen
        if (direction === "up") {
          popupEl.style.top = `calc(-${intPosition - 5}vh)`;
        }
      } else {
        popupEl.style.height = "";
      }
    }

    resetPopupClass("localStorage", getKeyFromStorage("localStorage", "popupHeighDynamictMode"), getOrientation("localStorage"));
    popupEl.src = popupSrc;
    addEventListener("message", e => {
      if (e.source != popupEl.contentWindow) {
        return;
      }
      if (e.data.insextInitRequest) {
        // Set CSS classes for arrow button position
        iFrameLocalStorage = e.data.iFrameLocalStorage;
        const {popupArrowPosition: pos} = iFrameLocalStorage;
        const o = getOrientation("iframe");
        const dynamicHeight = getKeyFromStorage("iframe", "popupHeighDynamictMode", "true") === "true";
        const dir = calcDirection(pos, o);
        resetPopupClass("iframe", dynamicHeight, o, pos, dir);
        if (dir) {
          popupEl.classList.add(`insext-popup-${o}-${dir}`);
        }
        const hideIframes = getKeyFromStorage("iframe", "popupHideInEmbeddedPages", "true") === "true";
        const isDeploymentPage = location.href.includes("monitorDeploymentsDetails") || location.href.includes("asyncId=0Af");
        if (window !== window.top && (!hideIframes || isDeploymentPage)) {
          rootEl.style.display = "";
        }
        setRootCSSProperties(rootEl, btn);
        setFavicon(sfHost);
        popupEl.contentWindow.postMessage({
          insextInitResponse: true,
          sfHost,
          inDevConsole: !!document.querySelector("body.ApexCSIPage"),
          inLightning: !!document.querySelector("#auraLoadingBox"),
          inInspector,
        }, "*");
      }

      togglePopup(e.data.insextOpenPopup, e.data.insextClosePopup);
      if (e.data.insextShowApiName) {
        let apiNamesClass = "field-api-name";
        if (e.data.btnLabel.startsWith("Show")){
          document.querySelectorAll("record_flexipage-record-field > div, records-record-layout-item > div, div .forcePageBlockItemView").forEach(field => {
            let label = field.querySelector("span");
            if (field.dataset.targetSelectionName && label.querySelector("mark") == null){
              label.innerText = label.innerText + " ";
              const fieldApiName = document.createElement("mark");
              fieldApiName.className = apiNamesClass;
              fieldApiName.style.cursor = "copy";
              fieldApiName.innerText = field.dataset.targetSelectionName.split(".")[2];
              label.appendChild(fieldApiName);
              label.addEventListener("click", copy);
            }
          });
        } else {
          document.querySelectorAll("." + apiNamesClass).forEach(e => e.remove());
        }
      }
      if (e.data.lightningNavigate) {
        document.dispatchEvent(new CustomEvent("lightningNavigate", {detail: e.data.lightningNavigate}));
      }
    });
    rootEl.appendChild(popupEl);
    // Function to handle copy action
    function copy(e) {
      // Retrieve the text content of the target element triggered by the event
      const originalText = e.target.innerText; // Save the original text
      // Attempt to copy the text to the clipboard
      navigator.clipboard.writeText(originalText).then(() => {
        // Create a new span element to show the copy success indicator
        const copiedIndicator = document.createElement("span");
        copiedIndicator.textContent = "Copied ✓"; // Set the text content to indicate success
        copiedIndicator.className = "copiedText"; // Assign a class for styling purposes

        // Add the newly created span right after the clicked element in the DOM
        if (e.target.nextSibling) {
          // If the target has a sibling, insert the indicator before the sibling
          e.target.parentNode.insertBefore(copiedIndicator, e.target.nextSibling);
        } else {
          // If no sibling, append the indicator as the last child of the parent
          e.target.parentNode.appendChild(copiedIndicator);
        }

        // Remove the indicator span after 2 seconds
        setTimeout(() => {
          if (copiedIndicator.parentNode) {
            // Ensure the element still has a parent before removing
            copiedIndicator.parentNode.removeChild(copiedIndicator);
          }
        }, 2000); // Set timeout for 2 seconds
      }).catch(err => {
        // Log an error message if the copy action fails
        console.error("Copy failed: ", err);
      });
    }
    function openPopup() {
      let activeContentElem = document.querySelector("div.windowViewMode-normal.active, section.oneConsoleTab div.windowViewMode-maximized.active.lafPageHost");
      let isFieldsPresent = activeContentElem ? !!activeContentElem.querySelector("record_flexipage-record-field > div, records-record-layout-item > div, div .forcePageBlockItemView") : false;
      popupEl.contentWindow.postMessage({insextUpdateRecordId: true,
        locationHref: location.href,
        isFieldsPresent
      }, "*");
      rootEl.classList.add("insext-active");
      // These event listeners are only enabled when the popup is active to avoid interfering with Salesforce when not using the inspector
      addEventListener("click", outsidePopupClick);
      popupEl.focus();
    }
    function closePopup() {
      rootEl.classList.remove("insext-active");
      removeEventListener("click", outsidePopupClick);
      popupEl.blur();
    }
    function togglePopup(openCondition, closeCondition = !openCondition) {
      if (openCondition) {
        openPopup();
      } else if (closeCondition) {
        closePopup();
      }
    }
    function outsidePopupClick(e) {
      // Close the popup when clicking outside it
      if (!rootEl.contains(e.target)) {
        closePopup();
      }
    }
  }
}
