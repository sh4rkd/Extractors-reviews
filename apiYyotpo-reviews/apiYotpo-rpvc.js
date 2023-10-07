async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    //*** in the reviews extractor in extension add a custom strategy and add the path: reviews ***
     
    // this custom function should be added in a perVariant custom function.

    // these are the two things you should find for your site and change the ones below.
    // example of url where this data was obtained (you should find in the Network tab):
    // https://api-cdn.yotpo.com/v1/widget/WtcdrDlLuRTanxcSXiWnX4V4zjyFnhTR7PqIcZmA/products/6641056186503/reviews.json?sort=date&page=1&per_page=20
    // example site: https://www.shopbala.com/products/bala-balance-blocks?color=heather
    const apiKey = 'WtcdrDlLuRTanxcSXiWnX4V4zjyFnhTR7PqIcZmA'
    const { id } = extractorsDataObj.customData

    try{
        const reviews = await page.evaluate(async(apiKey, id) => {
            const maxReviewsPerRequest = 20
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
                    content, 
                    score, 
                    created_at,
                    title
                } = reviewObj
                return {
                content,
                title,
                date: created_at?.replace(/T.*/gmi, '')?.trim() || '',
                userName: reviewObj?.user?.display_name?.trim() || '',
                rating: {
                  value: score,
                  max: '5',
                  type: 'stars'
                }
              }
            }
            function getUrlToFetch(page){
                return `https://api-cdn.yotpo.com/v1/widget/${apiKey}/products/${id}/reviews.json?sort=date&page=${page}&per_page=${maxReviewsPerRequest}`
            }

            const firstUrlToFetch = getUrlToFetch(1)
            const firstData = await fetchReviews(firstUrlToFetch)
            const totalReviews = firstData?.response?.pagination?.total || 0
            if (!totalReviews) return {}
            const averageRating = Number(firstData?.response?.bottomline?.average_score || '')?.toFixed(1)
            let items = firstData?.response?.reviews?.map(e => getReview(e)) || []
            const totalOfRequests = Math.ceil(totalReviews / maxReviewsPerRequest)
            for (let i = 1; i < totalOfRequests; i++){
                const newUrlToFetch = getUrlToFetch(i + 1)
                const resData = await fetchReviews(newUrlToFetch)
                const moreReviews = resData?.response?.reviews?.map(e => getReview(e)) || []
                items = [...items, ...moreReviews]
            }
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