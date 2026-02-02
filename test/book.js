const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log("🎬 Logging in...");
    await page.goto("http://localhost:5173/auth", { waitUntil: "networkidle2" });

    await page.waitForSelector("#input-email");
    await page.type("#input-email", "rishi007@gmail.com");
    await page.type("#input-password", "rishi@123");
    
    await Promise.all([
      page.click("#btn-go"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    console.log("Logged in. Looking for movies...");

    // 1. Wait for the movie grid to render
    await page.waitForSelector(".movie-card");

    // 2. Find the first movie card and click its first showtime button
    console.log(" Selecting the first available showtime...");
    
    // This selector targets the first button inside the 'showtimes' div of the first 'movie-card'
    const showtimeButton = ".movie-card:first-child .showtimes button";
    
    await page.waitForSelector(showtimeButton);
    await page.click(showtimeButton);

    // 3. SEAT SELECTION
    console.log(" Waiting for seat grid to load...");
    await page.waitForSelector("#seat-A1", { visible: true });

    console.log("Selecting seats A1 and A2...");
    await page.click("#seat-A1");
    await page.click("#seat-A2");

    // 4. CLICK BOOK
    console.log("Clicking BOOK...");
    await page.click("#btn-book");

    // 5. SUCCESS CHECK
    await page.waitForSelector(".success-overlay", { visible: true, timeout: 5000 });
    console.log("Booking sequence complete!");

  } catch (error) {
    console.error("Test failed:", error.message);
    await page.screenshot({ path: 'debug_screenshot.png' });
  } finally {
    // Keep browser open for a few seconds to see result
    setTimeout(async () => await browser.close(), 5000);
  }
})();