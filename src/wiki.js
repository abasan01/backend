import axios from "axios";
import {
    load
} from 'cheerio';

async function getWiki(query) {

    try {
        const searchArt = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${query}`);

        const articles = searchArt.data.query.search;
        console.log("articles", articles)

        if (articles.length > 0) {
            const articleTitle = articles[0].title;
            console.log("articleTitle: ", articleTitle)
            const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`;
            console.log("Izvodi se !!!!!!!! ", articleUrl)
            let imageUrl = await getWikipediaImageUrl(articleTitle);

            console.log("imageUrl u articles: ", imageUrl)

            if (typeof (imageUrl) == "undefined") {
                imageUrl = "/img/placeholder.5aba16cd.jpg"
            }

            console.log("imageUrl u articles nakon if-a: ", imageUrl)

            return {
                articleUrl: articleUrl,
                imageUrl: imageUrl
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

async function getWikipediaImageUrl(articleTitle) {
    try {
        const imgResponse = await axios.get(`https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`);
        const $ = load(imgResponse.data)
        const articleContent = $(".infobox-image img");
        console.log("articleContent: ", articleContent)
        const imageUrl = articleContent.attr("src")
        console.log("imageUrl: ", imageUrl, "typeof (imageUrl) == undefined ", typeof (imageUrl) == "undefined")
        return imageUrl;
    } catch (error) {
        console.error("Error retrieving Wikipedia image:", error);
    }

    return "/img/placeholder.5aba16cd.jpg";
}

export {
    getWiki
}