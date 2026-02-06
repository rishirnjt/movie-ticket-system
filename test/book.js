const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 70, // Medium speed for stability
    defaultViewport: null 
  });
  const page = await browser.newPage();

  // Handle all browser alerts (Booking success & Cancellation success)
  page.on('dialog', async dialog => {
    console.log(`DIALOG APPEARED: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    console.log("🎬 Logging in...");
    await page.goto("http://localhost:5173/auth?tab=signin", { waitUntil: "networkidle2" });

    await page.waitForSelector("#input-email");
    await page.type("#input-email", "rishi007@gmail.com");
    await page.type("#input-password", "rishi@123");
    
    await Promise.all([
      page.click("#btn-go"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    // ---------- PART 1: BOOKING ----------
    console.log("Selecting movie and showtime...");
    await page.waitForSelector(".movie-card");
    const showtimeButton = ".movie-card:first-child .showtimes button:first-child";
    await page.waitForSelector(showtimeButton);
    await page.click(showtimeButton);

    console.log("Selecting seats A1 and A2...");
    await page.waitForSelector("#seat-A1", { visible: true });
    await page.click("#seat-A1");
    await page.click("#seat-A2");

    console.log("Clicking BOOK...");
    await page.click("#btn-book");

    // Wait for the success overlay to confirm booking
    await page.waitForSelector(".success-overlay", { visible: true });
    console.log("✅ Booking successful!");

    // ---------- PART 2: REDIRECTION & CANCELLATION ----------
    console.log("Navigating to My Account for cancellation...");
    // You can click a Nav link or use direct navigation
    await page.goto("http://localhost:5173/myaccount", { waitUntil: "networkidle2" });

    // 1. Ensure "My Reservations" tab is active
    await page.waitForSelector(".reservation-row");

    // 2. Click the most recent reservation row (the first one) to expand it
    console.log("Expanding the newest reservation...");
    await page.click(".reservation-row:first-child");

    // 3. Wait for the dropdown content (checkboxes) to appear
    await page.waitForSelector(".dropdown-row", { visible: true });

    // 4. Select the checkboxes for the seats we just booked
    console.log("Selecting seats to cancel...");
    const checkboxes = await page.$$('.dropdown-table input[type="checkbox"]');
    
    // Select the first two checkboxes (A1 and A2)
    if (checkboxes.length >= 2) {
        await checkboxes[0].click();
        await checkboxes[1].click();
    } else if (checkboxes.length > 0) {
        await checkboxes[0].click();
    }

    // 5. Click the Cancel button
    console.log("Clicking 'Cancel Selected'...");
    await page.waitForSelector(".cancel-btn");
    await page.click(".cancel-btn");

    console.log("--- 🏁 Flow Complete: Booked and Cancelled! ---");
    await new Promise(r => setTimeout(r, 3000));

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
})();