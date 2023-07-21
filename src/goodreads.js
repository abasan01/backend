import axios from "axios";
import {
    load
} from 'cheerio';
import puppeteer, {
    executablePath
} from "puppeteer";



async function getReads(query) {

    try {
        console.log("Spajanje na goodreads")
        console.log("query: ", query)
        const responseSearch = await axios.get(`https://www.goodreads.com/search?q=${query}`);
        let $ = load(responseSearch.data)
        const bookHref = $(".bookTitle:first").attr("href");
        const authorName = $(".authorName:first").text()
        console.log("authorName: ", authorName)
        if (bookHref === undefined) {
            throw new Error("Knjiga nije nađena!");
        }
        const bookLink = "https://www.goodreads.com" + bookHref
        //console.log("bookLink: ", bookLink)


        console.log("Očitavanje stranice")
        const browser = await puppeteer.launch({
            args: [
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--single-process",
                "--no-zygote",
            ],
            executablePath: process.env.NODE_ENV === "produiction" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
        });
        const page = await browser.newPage();
        await page.goto(bookLink);

        await page.waitForSelector('.BookCover__image', {
            timeout: 10000
        });

        const htmlContent = await page.content();
        $ = load(htmlContent)

        const yearPublic = $('.FeaturedDetails [data-testid="publicationInfo"]').text()
        let splitted = yearPublic.split(",")

        const bookTitle = $('[data-testid="bookTitle"]').text()
        console.log("bookTitle: ", bookTitle)

        let desc = $(".DetailsLayoutRightParagraph__widthConstrained").text()
        //console.log(desc)

        const bookImage = $(".BookCover__image img")
        const imageUrl = bookImage.attr("src")
        //console.log("imageUrl: ", imageUrl)
        //console.log("bookCover: ", bookImage)

        const genre = $('.BookPageMetadataSection__genres .Button__labelItem:first').text()
        //console.log("genre", genre)

        let pagesArray = $(".BookDetails").text()

        let pages = pagesArray.split(" ")

        console.log("Gotovo")

        return {
            title: bookTitle,
            imageUrl: imageUrl,
            year: splitted[1].trim(),
            description: desc,
            genre: genre,
            author: authorName,
            pages: pages[0]
        }
    } catch (error) {
        console.error("Error retrieving from goodreads:", error);
    }
}

export {
    getReads
}