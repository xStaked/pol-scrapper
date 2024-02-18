import puppeteer from "puppeteer";

async function searchGoogle(query, pageCount = 5) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();
  const links = [];

  try {
    for (let i = 0; i < pageCount; i++) {
      const start = i * 10; // 10 results per page on Google
      const url = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}&start=${start}`;
      await page.goto(url);

      // Wait for results to load
      await page.waitForSelector("div.g");

      // Extract links from the results
      const pageLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("div.g a h3"));
        return anchors.map((anchor) => anchor.parentElement.href);
      });

      links.push(...pageLinks);
    }
  } catch (error) {
    console.error("Error during Google search:", error);
  } finally {
    await browser.close();
  }

  return links;
}

async function collectEmails(links, minimumCount = 10, timeout = 30000) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  const collectedEmails = [];

  try {
    for (const link of links) {
      const page = await browser.newPage();

      // Configurar tiempo de espera para la carga de la página
      await page.setDefaultNavigationTimeout(timeout);

      try {
        await page.goto(link);

        // Realizar la extracción solo si la página se carga correctamente
        const result = await page.evaluate(() => {
          const footerElement = document.querySelector("footer");
          if (!footerElement) {
            return null;
          }

          const emailMatch = footerElement.innerText.match(/\S+@\S+/);
          return emailMatch ? emailMatch[0] : null;
        });

        if (result !== null) {
          collectedEmails.push(result);
          console.log("Collected email:", result);
        }

        if (collectedEmails.length >= minimumCount) {
          console.log(`Collected ${minimumCount} emails. Ending execution.`);
          break;
        }
      } catch (error) {
        console.error("Error during page navigation:", error.message);
        // Puedes manejar la situación de error según tus necesidades
        // Por ejemplo, podrías registrar el error, continuar con el siguiente enlace, etc.
      } finally {
        await page.close();
      }
    }
  } catch (error) {
    console.error("Error during email collection:", error.message);
  } finally {
    await browser.close();
  }

  return collectedEmails;
}

// Example usage
(async () => {
  const query = "agencias de transporte en cancun";
  const googleLinks = await searchGoogle(query, 5);
  console.log(googleLinks)
  const collectedEmails = await collectEmails(googleLinks, 10);
  console.log(collectedEmails);
})();
