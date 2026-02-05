const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log("--- Starting Admin Edit Test ---");
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100, // Slightly slower so we can watch it
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Set a longer default timeout for slow local servers
  page.setDefaultNavigationTimeout(60000); 

  page.on('dialog', async dialog => {
    console.log(`ALERT: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // 1. LOGIN
    console.log("Navigating to login...");
    // Use 'domcontentloaded' to avoid waiting for heavy images/ads
    await page.goto('http://localhost:5173/auth?tab=signin', { waitUntil: 'domcontentloaded' });

    console.log("Waiting for login fields...");
    await page.waitForSelector('#input-email', { visible: true });
    await page.type('#input-email', 'admin@cinemax.com');
    await page.type('#input-password', 'admin@123');
    
    console.log("Clicking Login...");
    await Promise.all([
      page.click('#btn-go'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // 2. NAVIGATE TO MANAGE MOVIES
    console.log("Navigating to Manage Movies...");
    await page.goto('http://localhost:5173/admin/manage-movies', { waitUntil: 'networkidle2' });

    // 3. SELECT THE FIRST EDIT BUTTON
    console.log("Looking for movies in the table...");
    const firstEditBtn = 'button[id^="edit-movie-"]';
    
    // Check if movies exist before trying to click
    const moviesExist = await page.$(firstEditBtn);
    if (!moviesExist) {
        throw new Error("No movies found in the table! Add a movie first.");
    }

    await page.click(firstEditBtn);
    console.log("Clicked Edit button.");

    // 4. WAIT FOR FORM DATA POPULATION
    await page.waitForSelector('#movie-title', { visible: true });
    console.log("Waiting for data to fetch...");
    
    await page.waitForFunction(
      () => {
        const input = document.getElementById('movie-title');
        return input && input.value.trim() !== "";
      },
      { timeout: 10000 }
    );

    // 5. HELPER FUNCTION TO CLEAR AND TYPE
    const editField = async (selector, text) => {
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(selector, text);
    };

    console.log("Editing Title and Genre...");
    await editField('#movie-title', 'Updated Movie Title');
    await editField('#movie-genre', 'Action / Adventure');

    // 6. UPDATE SHOWTIME
    console.log("Entering new Showtime...");
    await editField('#showtime-hall-0', 'Luxury Hall 5');
    
    await page.click('#showtime-time-0');
    // MMDDYYYY + Tab + HHmmA
    await page.keyboard.type('03152026');
    await page.keyboard.press('Tab');
    await page.keyboard.type('0930PM');

    // 7. SUBMIT
    console.log("Submitting form...");
    await page.click('#submit-movie-btn');

    // Wait to see the success alert
    await new Promise(r => setTimeout(r, 4000));
    console.log("Edit Test Successful!");

  } catch (err) {
    console.error("--- TEST FAILED ---");
    console.error(`Reason: ${err.message}`);
    await page.screenshot({ path: 'debug_screenshot.png' });
    console.log("Screenshot saved as debug_screenshot.png");
  } finally {
    console.log("Closing browser...");
    await browser.close();
  }
})();