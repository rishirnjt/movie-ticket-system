const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  const testEmail = `rishi_${Date.now()}@test.com`;

  try {
    await page.goto("http://localhost:5173/auth", { waitUntil: "networkidle2" });

    // Switch to Sign Up
    await page.waitForSelector(".auth-tab");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.auth-tab'));
      const signupTab = tabs.find(el => el.textContent.includes('SIGN UP'));
      signupTab.click();
    });

    // Fill Form
    await page.waitForSelector("#reg-input-email");
    await page.type("#reg-input-phone", "9841000000");
    await page.type("#reg-input-email", testEmail);
    await page.type("#reg-input-dob", "1999-01-01");
    await page.type("#reg-input-first-name", "Rishi");
    await page.type("#reg-input-last-name", "Ranjit");
    await page.type("#reg-input-password", "Pass123!");
    await page.click("#reg-checkbox-terms");

    // Pre-handle the alert
    page.on('dialog', async dialog => {
      console.log("💬 Alert:", dialog.message());
      await dialog.accept();
    });

    // Click Confirm and wait for URL to change to localhost:5173/
    console.log("🚀 Submitting and waiting for redirect...");
    
    await Promise.all([
      page.click("#btn-register-confirm"),
      page.waitForNavigation({ waitUntil: "networkidle2" }) 
    ]);

    // Final Assertion
    const currentUrl = page.url();
    if (currentUrl === "http://localhost:5173/") {
      console.log("✅ SUCCESS: Redirected to landing page!");
    } else {
      console.log("⚠️ Ended up at:", currentUrl);
    }

  } catch (error) {
    console.error("🚨 Test failed:", error.message);
  } finally {
    setTimeout(() => browser.close(), 3000);
  }
})();