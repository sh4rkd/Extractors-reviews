async (fnParams, page, extractorsDataObj, {_, Errors}) => {
    // thise extractor is normally used in shopify sites
    const { url } = extractorsDataObj.pageData
    const { origin } = new URL(url)
    const handle = url?.replace(/.*product\//gm, '')?.replace(/\?.*/gm, '')
    const dataUrl = {
        origin, handle
    }
    async function GetAllReviews(dataUrl){
        try{
            return await page.evaluate(async(dataUrl) => {
                
                const shop = window.Shopify.shop
                const productId = window.meta.product.id
                const plataform = 'shopify'

                function GetFetchBody(productId, handle, page){
                    const order = (page == 1) ? null : "late"
                    return {"handle":handle,"product_id":productId,"page":page,"type":"load-more","order":order,"filter":"all","feature":false,"domain":shop,"platform":plataform}
                }
                function GetHeaders(bodyObj){
                    return {
                        body: JSON.stringify(bodyObj),
                        origin: dataUrl.origin,
                        referer: dataUrl.origin + '/',
                        referrerPolicy: 'strict-origin-when-cross-origin',
                        method: 'POST',
                        mode: 'cors',
                        credentials: 'omit'
                    }
                }
                function GetReview(obj){
                    return {
                        content: obj.body_text,
                        title: obj.title,
                        date: obj.created_at?.replace(/T.*/gm, ''),
                        userName: obj.author,
                        rating: {
                          value: obj.rating,
                          max: '5',
                          type: 'stars'
                        }
                    }
                }

                
                const firstRequest = await fetch(`https://app.ryviu.io/frontend/client/get-reviews-data?domain=${shop}`, GetHeaders(GetFetchBody(productId, dataUrl.handle, 1)))
                const firstJson = firstRequest?.status == 200 ? await firstRequest.json() : {}
                const averageRating = firstJson?.ratings?.avg || 0
                const totalReviews = firstJson?.ratings?.count || 0
                const reviewsPerRequest = 10
                const totalOfRequests = Math.ceil(totalReviews / reviewsPerRequest) || 0
                let reviewsToReturn = firstJson?.reviews?.map(e => GetReview(e)) || []
                
                if (totalOfRequests > 0){

                    for (let j = 1; j < totalOfRequests; j++){
                        const moreRevReq = await fetch(`https://app.ryviu.io/frontend/client/get-more-reviews?domain=${shop}`, GetHeaders(GetFetchBody(productId, dataUrl.handle, j + 1)))
                        const moreRevJson = moreRevReq.status == 200 ? await moreRevReq.json() : {}
                        const moreReviews = moreRevJson?.more_reviews?.map(e => GetReview(e)) || []
                        reviewsToReturn = [...reviewsToReturn, ...moreReviews]
                    }
                    
                    return {
                        "overallRating": {
                          "value": Number(averageRating)?.toFixed(1),
                          "max": "5",
                          "type": "stars"
                        },
                        "items": reviewsToReturn
                    }
                }
                return {}

            }, dataUrl)
        }catch(e){
            return {}
        }
    }
    const reviews = await GetAllReviews(dataUrl)
    if (reviews?.items?.length){
        extractorsDataObj.customData.reviews = reviews
    }
}