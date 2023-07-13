import axios from "axios";
import {
    load
} from 'cheerio';
import puppeteer from "puppeteer";


async function getReads(query) {

    try {
        const responseSearch = await axios.get(`https://www.goodreads.com/search?q=${query}`);
        let $ = load(responseSearch.data)
        const bookTitle = $(".bookTitle:first");
        const bookLink = "https://www.goodreads.com" + bookTitle.attr("href")

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(bookLink);

        await page.waitForSelector('.BookCover__image', {
            timeout: 7000
        });

        const htmlContent = await page.content();
        $ = load(htmlContent)
        const bookImage = $(".BookCover__image img")
        console.log("bookCover: ", bookImage)
        const imageUrl = bookImage.attr("src")
        console.log("imageUrl: ", imageUrl)

        return imageUrl
    } catch (error) {
        console.error("Error retrieving from goodreads:", error);
    }
}

export {
    getReads
}