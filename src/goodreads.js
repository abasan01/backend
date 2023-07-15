import axios from "axios";
import {
    load
} from 'cheerio';
import puppeteer from "puppeteer";



async function getReads(query) {

    try {
        console.log("Spajanje na goodreads")
        const responseSearch = await axios.get(`https://www.goodreads.com/search?q=${query}`);
        let $ = load(responseSearch.data)
        const bookTitle = $(".bookTitle:first").attr("href");
        const authorName = $(".authorName:first").text()
        //console.log("authorName: ", authorName)
        if (bookTitle === undefined) {
            throw new Error("Knjiga nije nađena!");
        }
        const bookLink = "https://www.goodreads.com" + bookTitle
        //console.log("bookLink: ", bookLink)


        console.log("Očitavanje stranice")
        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();
        await page.goto(bookLink);

        await page.waitForSelector('.BookCover__image', {
            timeout: 7000
        });

        const htmlContent = await page.content();
        $ = load(htmlContent)

        const yearPublic = $('.FeaturedDetails [data-testid="publicationInfo"]').text()
        let splitted = yearPublic.split(",")

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

        return {
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