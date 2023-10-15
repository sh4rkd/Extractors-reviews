async (fnParams, page, extractorsDataObj, {_, Errors}) => {
    // this function should be added in a postNavigate custom function
    // verify that the selectors below work in your site.
    // example https://us.yonka.com/products/anti-wrinkles-elastine-jour
    const selectors = {
        allReviews: 'div .epContainer .epContent',
        content: '.epReview .epTitle + :not(z)',
        title: '.epReview .epTitle',
        date: '.epDate',
        userName: '.epName',
        stars: '.epRating .fa'
    }

    try{
        const reviews = await page.evaluate((selectors) => {
            function getTextContent(doc, selector){
                return doc.querySelector(selector)?.textContent?.trim() || ''
            }
            function getReview(container){
                return {
                    content: getTextContent(container, selectors.content),
                    title: getTextContent(container, selectors.title),
                    date: getTextContent(container, selectors.date),
                    userName: getTextContent(container, selectors.userName),
                    rating: {
                        value: Array.from(container?.querySelectorAll(selectors.stars))?.length || 0,
                        max: '5',
                        type: 'stars'
                    }
                }
            }
            const reviews = Array.from(document.querySelectorAll(selectors.allReviews))?.map(e => getReview(e))
            const len = reviews?.length ? reviews?.length : 1
            const average = reviews?.map(e => e?.rating?.value)?.reduce((a, b) => a + b, 0) / len
            return {
                "overallRating": {
                    "value": Number(average)?.toFixed(1),
                    "max": "5",
                    "type": "stars"
                },
                "items": reviews
            }
        }, selectors)
        if (reviews?.items?.length){
            extractorsDataObj.customData.reviews = reviews
        }
    } catch(e){}
}