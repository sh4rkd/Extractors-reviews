async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    //*** in the reviews extractor in extension add a custom strategy and add the path: reviews ***
     
    // this custom function should be added in a perVariant custom function.

    // there is only one thing(apiKey) you should find for your site.
    // example of url where this data was obtained (you should find it in the Network tab):
    // https://api.okendo.io/v1/stores/422fd413-f489-4469-86da-aaf780623abc/products/shopify-4559911092308/reviews
    // example site: https://www.bubsnaturals.com/products/wanted-coffee-medium-roast?variant=40055347576916
    const apiKey = '422fd413-f489-4469-86da-aaf780623abc'
    
    
    const { id } = extractorsDataObj.customData
    try{
        const reviews = await page.evaluate(async(apiKey, id) => {
            const fetchHeaders = {
                method: 'GET',
                mode: 'cors'
            }
            async function fetchReviews(url, headers = fetchHeaders){
                try{
                    const res = await fetch(url, headers)
                    const json = res.status == 200 ? await res.json() : {}
                    return json
                }catch(e){
                    return {}
                }
            }
            function getReview(reviewObj){
                const { 
                    body: content, 
                    rating: score, 
                    dateCreated: created_at,
                    title
                } = reviewObj
                return {
                content,
                title,
                date: created_at?.replace(/T.*/gmi, '')?.trim() || '',
                userName: reviewObj?.reviewer?.displayName?.trim() || '',
                rating: {
                  value: score,
                  max: '5',
                  type: 'stars'
                }
              }
            }
            const firstUrlToFetch = `https://api.okendo.io/v1/stores/${apiKey}/products/shopify-${id}/reviews`

            const firstData = await fetchReviews(firstUrlToFetch)        
            let items = firstData?.reviews?.map(e => getReview(e)) || []
            let nextUrlToFetch = firstData?.nextUrl?.length ? `https://api.okendo.io/v1${firstData?.nextUrl}` : false
            while (nextUrlToFetch){
                const nextFetchData = await fetchReviews(nextUrlToFetch)
                const nextReviews = nextFetchData?.reviews?.map(e => getReview(e)) || []
                items = [...items, ...nextReviews]
                nextUrlToFetch = nextFetchData?.nextUrl?.length ? `https://api.okendo.io/v1${nextFetchData?.nextUrl}` : false
            }
            const totalRatings = items?.map(e  => e?.rating?.value)?.reduce((a, b) => Number(a) + Number(b), 0)
            const averageRating = items?.length > 0 ? (totalRatings / items?.length)?.toFixed(1) : 0
            return {
                "overallRating": {
                  "value": averageRating,
                  "max": "5",
                  "type": "stars"
                },
                "items": items
              }

        }, apiKey, id)
        if (reviews?.items?.length){
            extractorsDataObj.customData.reviews = reviews
        }
    }catch(e){
        console.log(e)
    }
}