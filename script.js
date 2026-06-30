// SSO Redirect Recovery - Auto-redirect with countdown and fallback links
// Data source: localStorage 'intra-user-departmentInfo' JSON with {intranetName: string, intranetGlobe: assetID}
// Agency URL format: ./?a={assetID} (Squiz Matrix navigation)

(function () {
  "use strict";

  // Log current user for debugging (Squiz Matrix keyword will be replaced server-side)
  console.log("Logged in as: %globals_user_name%");

  // Configuration
  const COUNTDOWN_SECONDS = 5;
  const NTG_CENTRAL_URL = "https://ntgcentral.nt.gov.au";

  // State
  let countdownTimer = null;
  let secondsRemaining = COUNTDOWN_SECONDS;
  let redirectCancelled = false;

  // DOM Elements
  const agencyLink = document.getElementById("agency-link");
  const ntgCentralLink = document.getElementById("ntg-central-link");
  const countdownSection = document.getElementById("countdown-section");
  const countdownText = document.getElementById("countdown-text");
  const srAnnouncements = document.getElementById("sr-announcements");
  const noJsFallback = document.getElementById("no-js-fallback");

  // Hide no-JS fallback since JavaScript is enabled
  if (noJsFallback) {
    noJsFallback.style.display = "none";
  }

  // Ensure NTG Central always targets the configured URL
  if (ntgCentralLink) {
    ntgCentralLink.href = NTG_CENTRAL_URL;
  }

  // Retrieve department info from localStorage
  function getDepartmentInfo() {
    try {
      const deptInfoRaw = localStorage.getItem("intra-user-departmentInfo");

      if (!deptInfoRaw) {
        console.warn("Department info not found in localStorage");
        return null;
      }

      const deptInfo = JSON.parse(deptInfoRaw);
      const { intranetName, intranetGlobe, intranetURL } = deptInfo;

      if (!intranetName || (!intranetURL && !intranetGlobe)) {
        console.warn(
          "Missing intranetName and intranetURL/intranetGlobe in department info:",
          deptInfo,
        );
        return null;
      }

      return {
        name: intranetName,
        url: intranetURL,
        assetId: intranetGlobe,
      };
    } catch (error) {
      console.error(
        "Failed to parse department info from localStorage:",
        error,
      );
      return null;
    }
  }

  // Build agency intranet URL
  function buildAgencyUrl(deptInfo) {
    if (deptInfo && deptInfo.url) {
      return deptInfo.url;
    }

    if (deptInfo && deptInfo.assetId) {
      return "./?a=" + deptInfo.assetId;
    }

    return null;
  }

  // Update navigation links with agency data
  function updateNavigationLinks(deptInfo) {
    const agencyUrl = buildAgencyUrl(deptInfo);

    if (deptInfo && deptInfo.name && agencyUrl) {
      // Show and populate agency link
      // Only append 'intranet' if it's not already in the name
      const linkText = deptInfo.name.toLowerCase().includes("intranet")
        ? deptInfo.name
        : deptInfo.name + " intranet";
      agencyLink.textContent = linkText;
      agencyLink.href = agencyUrl;
      agencyLink.classList.remove("hidden");
      return true;
    } else {
      // Hide agency link if data unavailable
      agencyLink.classList.add("hidden");
      return false;
    }
  }

  // Update countdown text
  function updateCountdownText(deptInfo, seconds) {
    // Get the first visible link to use its text
    const firstVisibleLink = document.querySelector(".nav-link:not(.hidden)");
    const linkText = firstVisibleLink
      ? firstVisibleLink.textContent.trim()
      : "your page";

    countdownText.textContent =
      "Redirecting to your " + linkText + " in " + seconds + "s...";
  }

  // Perform redirect to first visible link
  function performRedirect() {
    if (redirectCancelled) {
      console.log("Redirect cancelled by user");
      return;
    }

    // Find the first visible navigation link
    const firstVisibleLink = document.querySelector(".nav-link:not(.hidden)");

    if (firstVisibleLink && firstVisibleLink.href) {
      const url = firstVisibleLink.href;
      try {
        console.log("Redirecting to:", url);
        window.location.href = url;
      } catch (error) {
        console.error("Auto-redirect failed:", error);
        // Hide countdown on failure
        countdownSection.classList.add("hidden");
      }
    } else {
      console.error("Auto-redirect failed: no valid link found");
      countdownSection.classList.add("hidden");
    }
  }

  // Cancel redirect (called when user clicks a link)
  function cancelRedirect() {
    redirectCancelled = true;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    console.log("Auto-redirect cancelled - user clicked navigation link");
  }

  // Start countdown and auto-redirect
  function startCountdown(deptInfo) {
    // Check if we have a valid link to redirect to
    const firstVisibleLink = document.querySelector(".nav-link:not(.hidden)");

    if (
      !firstVisibleLink ||
      !firstVisibleLink.href ||
      firstVisibleLink.href === "#"
    ) {
      console.warn(
        "Auto-redirect disabled: no valid navigation link available",
      );
      countdownSection.classList.add("hidden");
      return;
    }

    // Initial countdown text
    updateCountdownText(deptInfo, secondsRemaining);

    // Announce to screen readers
    if (srAnnouncements) {
      const linkText = firstVisibleLink.textContent.trim() || "your page";
      srAnnouncements.textContent =
        "You're now signed in. Redirecting to your " +
        linkText +
        " in " +
        secondsRemaining +
        " seconds.";
    }

    // Start countdown timer
    countdownTimer = setInterval(function () {
      secondsRemaining--;

      if (secondsRemaining > 0) {
        updateCountdownText(deptInfo, secondsRemaining);

        // Update screen reader announcement
        if (srAnnouncements) {
          srAnnouncements.textContent =
            "Redirecting in " + secondsRemaining + " seconds";
        }
      } else {
        // Countdown complete - perform redirect
        clearInterval(countdownTimer);
        countdownTimer = null;
        performRedirect();
      }
    }, 1000);
  }

  // Add click handlers to cancel redirect
  function addLinkClickHandlers() {
    const allLinks = document.querySelectorAll(".nav-link");
    allLinks.forEach(function (link) {
      link.addEventListener("click", cancelRedirect);
    });
  }

  // Initialize
  function init() {
    const deptInfo = getDepartmentInfo();

    // Update navigation links
    updateNavigationLinks(deptInfo);

    // Add click handlers to cancel redirect
    addLinkClickHandlers();

    // Start countdown (will redirect to first visible link)
    startCountdown(deptInfo);
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
