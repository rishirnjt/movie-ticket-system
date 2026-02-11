const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 80,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  page.on('dialog', async dialog => {
    console.log(`DIALOG: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. LOGIN FIRST
    console.log(" Logging in...");
    await page.goto('http://localhost:5173/auth?tab=signin', { waitUntil: 'networkidle2' });
    await page.type('#input-email', 'rishi007@gmail.com');
    await page.type('#input-password', 'rishi@123');
    await page.click('#btn-go');
    
    // Wait for redirect back to Home
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 2. SELECT MOVIE FROM HOME (This populates the state!)
    console.log("Selecting movie and showtime from Home...");
    await page.waitForSelector('.movie-card');
    
    // Clicking the first showtime button of the first movie
    const showtimeBtn = '.movie-card:first-child .showtimes button:first-child';
    await page.waitForSelector(showtimeBtn);
    await page.click(showtimeBtn);

    // 3. SEAT SELECTION
    console.log("Waiting for Seat Selection to load...");
    // Now location.state.selectedShowtime will NOT be null
    await page.waitForSelector('.seats-grid');

    console.log("Selecting seats A1, A2...");
    // Since you don't have IDs, we click by index
    const seats = await page.$$('.seat.available');
    await seats[0].click();
    await seats[1].click();

    // 4. BOOK
    console.log("Clicking Book...");
    await page.click('.book-btn');

    // 5. HANDLE SUCCESS POPUP
    await page.waitForSelector('.success-overlay', { visible: true });
    console.log("Booking Successful!");
    
    await page.click('.success-ok-btn');
    console.log("Redirected to My Account.");

    await new Promise(r => setTimeout(r, 4000));

  } catch (error) {
    console.error("Test Failed:", error.message);
   
  } finally {
    await browser.close();
  }
})();