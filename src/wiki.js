import axios from "axios";
import {
    load
} from 'cheerio';

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

            const birth = $('.bday').text().trim();;

            console.log(birth);

            return {
                authorUrl: imageUrl,
                name: articleTitle,
                birth: birth,
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