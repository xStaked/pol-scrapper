import puppeteer from "puppeteer";

async function getEmails(urls) {
  const browser = await puppeteer.launch();

  try {
    const pages = await Promise.all(
      urls.map(async (url) => {
        const page = await browser.newPage();
        await page.goto(url);

        const result = await page.evaluate(() => {
          const footerElement = document.querySelector("footer");
          if (!footerElement) {
            return null;
          }

          const emailMatch = footerElement.innerText.match(/\S+@\S+/);
          return emailMatch ? emailMatch[0] : null;
        });

        await page.close();

        return result;
      })
    );

    console.log(pages);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
}

async function searchPages(query) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    `https://www.google.com/search?q=${encodeURIComponent(query)}`
  );

  await page.waitForSelector("div.g");

  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("div.g a h3"));
    return anchors.map((anchor) => anchor.parentElement.href);
  });

  await browser.close();

  return links;
}

(async () => {
  const query = "agencias de transporte en cancun";
  const links = await searchPages(query);
  await getEmails(links);
})();
