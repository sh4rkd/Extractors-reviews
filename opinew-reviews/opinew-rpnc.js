async (fnParams, page, extractorsDataObj, {_, parseUrl, Errors}) => {
    // copy and paste this code in a postNavigateCustom and add a custom strategy for reviews adding the path "reviews"
    const { origin } = new URL(extractorsDataObj.pageData.url) 
    async function GetAllReviews(origin){
        try{ 
            return await page.evaluate(async(origin) => {
                const fetchHeaders = {
                    headers: {
                        'content-type': 'application/json',
                        'accept-encoding': 'gzip, deflate, br',
                    },
                    origin: origin,
                    referer: origin + '/',
                    method: 'GET',
                    mode: 'cors'
                }
                
                function GetUrlToFetch(id, page){
                    return `https://api.opinew.com/plugins/product_api?get_by=platform_product_id&platform_product_id=${id}&sort_by=content&page=${page}`
                }
                function getReview(obj){
                    return {
                        content: obj.body,
                        title: '',
                        date: obj.created_ts?.replace(/\s.*/gm, ''),
                        userName: obj.user_name,
                        rating: {
                          value: obj.star_rating,
                          max: '5',
                          type: 'stars'
                        }
                    }
                }
                async function GetAllPromises(promisesArr){
                    try{
                        const res = await Promise.all(promisesArr)
                        const jsons = await Promise.all(res.map(response => response.json()))
                        return jsons?.filter(e => e?.reviews?.length)?.map(e => e?.reviews)
                    }catch(e){
                        return []
                    }
                }
                

                const productId = '4835083812925' || window.meta.product.id
                const firstRes = await fetch(GetUrlToFetch(productId, 1), fetchHeaders)
                const firstJson = firstRes.status == 200 ? await firstRes.json() : {}
                const reviewsLen = firstJson?.reviews?.length
                const totalOfPages = firstJson.review_page_count || 0
                const totalPerBatch = 25 //don't increase this number, otherwise we will get 429 error
                const totalOfRequests = totalOfPages > (totalPerBatch - 1) ? Math.ceil(totalOfPages / totalPerBatch)  : 1
                
                let init =  0
                let final = totalPerBatch
                const averageRating = firstJson?.product?.average_rating || firstJson?.product?.average_stars || ''
                const promises = []
                let reviewsToReturn = []
                if (totalOfPages > 0){
                    for (let j = 0; j < totalOfRequests; j++){
                        final = ((j + 1) == totalOfRequests) ? totalOfPages : totalPerBatch*(j + 1)
                        for (let i = init; i < final; i++){
                            const newUrl = GetUrlToFetch(productId, i + 1)
                            promises.push(fetch(newUrl, fetchHeaders))
     
                        }
                        init = final
                        const allReviews = await GetAllPromises(promises)
                        const temp = allReviews?.map(reviewsArr => {
                            const items = reviewsArr?.map(r => getReview(r))
                            reviewsToReturn = [...reviewsToReturn, ...items]
                            return
                        })
                        await new Promise(r => setTimeout(r, 5000))
                        if (j == 1){
                            // remove this block to test, if you dont get reviews then keep it here.
                            break
                        }
                    }
                    const finalObj = {
                        "overallRating": {
                          "value": Number(averageRating)?.toFixed(1),
                          "max": "5",
                          "type": "stars"
                        },
                        "items": reviewsToReturn
                    }
                    return finalObj
                }
                return {}

            }, origin)
        }catch(e){
            return {}
        }
    }
    const reviews = await GetAllReviews(origin)
    if (reviews?.items?.length){
        extractorsDataObj.customData.reviews = reviews
    }
}