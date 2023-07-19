import axios from "axios";
import {
    load
} from 'cheerio';

function toNumber(str) {

    let finalString = ""

    console.log(str)

    for (let index = 0; index < str.length; index++) {
        const element = str[index];
        console.log(element)
        if (checkString(element)) {
            finalString += element
        }

    }
    console.log(finalString)
    return finalString
}

function checkString(str) {
    return !Number.isNaN(Number(str));
}

function toMonth(str) {
    const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)/i;
    console.log(str)
    const match = monthRegex.exec(str);
    return match ? match[0] : "";
}

async function getWiki(query) {

    try {
        const searchArt = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${query}`);

        const articles = searchArt.data.query.search;
        //console.log("articles: ", articles)

        if (articles.length > 0) {
            const articleTitle = articles[0].title;
            console.log("articleTitle: ", articleTitle)
            const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`;
            console.log("Izvodi se !!!!!!!! ", articleUrl)

            const imgResponse = await axios.get(`https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`);
            const $ = load(imgResponse.data)
            const imageUrl = $(".infobox-image img").attr("src");
            let paragraphs = [];
            $("p").each((index, element) => {
                if ($(element).next().is("h1, h2, h3, h4, h5, h6")) {
                    return false;
                }

                const current = $(element).text().trim()

                if (current) {
                    paragraphs.push(current);
                }
            });
            const bornRow = $('th.infobox-label:contains("Born")');
            const birth = bornRow
                .next('td.infobox-data')
                .contents()
                // @ts-ignore
                .filter((_, el) => !$(el).attr('style') || !$(el).attr('style').includes('display:none'))
                .text()
                .trim();
            const birthArray = birth.split(" ")

            console.log(birthArray);

            let counter = 0;
            let birthDate = ""
            birthArray.forEach(element => {

                if (toMonth(element)) {
                    birthDate += toMonth(element) + " "
                }
                if (toNumber(element)) {
                    birthDate += toNumber(element) + " "
                }
                console.log(birthDate)

                if (counter > 2) {
                    return
                }
            });

            return {
                authorUrl: imageUrl,
                name: query,
                birth: birthDate.trim(),
                description: paragraphs
            };
        }
    } catch (error) {
        console.error("Error retrieving Wikipedia article:", error);
    }

    return {
        articleUrl: "placeholder",
        imageUrl: "/img/placeholder.5aba16cd.jpg"
    };
}

export {
    getWiki
}