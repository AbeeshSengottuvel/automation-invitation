window.TECH_DATA = [
  {
    "id": "playwright",
    "name": "Playwright",
    "pitch": "Reliable end-to-end testing for modern web apps.",
    "icon": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>",
    "languages": [
      "JS",
      "TS",
      "Python",
      "Java",
      ".NET"
    ],
    "browserSupport": [
      "Chromium",
      "Firefox",
      "WebKit"
    ],
    "parallel": true,
    "learningCurve": "Medium",
    "pros": [
      "Auto-waiting out of the box",
      "Multiple contexts per test",
      "Network interception"
    ],
    "con": "Newer ecosystem compared to Selenium.",
    "url": "https://playwright.dev"
  },
  {
    "id": "cypress",
    "name": "Cypress",
    "pitch": "Fast, easy and reliable testing for anything that runs in a browser.",
    "icon": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/></svg>",
    "languages": [
      "JS",
      "TS"
    ],
    "browserSupport": [
      "Chrome",
      "Firefox",
      "Edge",
      "Safari (Experimental)"
    ],
    "parallel": true,
    "learningCurve": "Low",
    "pros": [
      "Time travel debugging",
      "Real-time reloads",
      "Consistent results"
    ],
    "con": "Limited multi-tab and cross-domain support.",
    "url": "https://www.cypress.io"
  },
  {
    "id": "selenium",
    "name": "Selenium WebDriver",
    "pitch": "The industry standard for browser automation.",
    "icon": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/></svg>",
    "languages": [
      "Java",
      "Python",
      "C#",
      "Ruby",
      "JS"
    ],
    "browserSupport": [
      "Chrome",
      "Firefox",
      "Edge",
      "Safari",
      "IE"
    ],
    "parallel": true,
    "learningCurve": "High",
    "pros": [
      "W3C Standard",
      "Huge community",
      "All major languages"
    ],
    "con": "Requires manual wait management and framework building.",
    "url": "https://www.selenium.dev"
  },
  {
    "id": "webdriverio",
    "name": "WebdriverIO",
    "pitch": "Next-gen browser and mobile automation test framework for Node.js.",
    "icon": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'/></svg>",
    "languages": [
      "JS",
      "TS"
    ],
    "browserSupport": [
      "Chrome",
      "Firefox",
      "Edge",
      "Safari"
    ],
    "parallel": true,
    "learningCurve": "Medium",
    "pros": [
      "Native mobile app support",
      "Extensive plugin ecosystem",
      "Flexible protocol support"
    ],
    "con": "Configuration can be complex for beginners.",
    "url": "https://webdriver.io"
  },
  {
    "id": "robot",
    "name": "Robot Framework",
    "pitch": "Generic open source automation framework for acceptance testing.",
    "icon": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='11' width='18' height='10' rx='2'/><circle cx='12' cy='5' r='2'/><path d='M12 7v4M8 16h8'/></svg>",
    "languages": [
      "Python",
      "Java"
    ],
    "browserSupport": [
      "Any (via Selenium/Playwright libraries)"
    ],
    "parallel": true,
    "learningCurve": "Low",
    "pros": [
      "Keyword-driven approach",
      "Readable by non-coders",
      "Rich ecosystem of libraries"
    ],
    "con": "Can become hard to maintain without strict conventions.",
    "url": "https://robotframework.org"
  }
];
