async (fnParams, page, extractorsDataObj, {_, Errors}) => {
    //*** in the reviews extractor in extension add a custom strategy and the path is: reviews ***
    // the powerreviews url can be found in Network tab in Dev Tools.
    // example of url where the attributes below were found
    // https://display.powerreviews.com/m/289446/l/en_US/product/${pid}/reviews?apikey=4a3f85c4-b20b-4663-9b6d-d3daa031348b&_noconfig=true
    // example of site with this config: https://www.smashbox.com/
    const powerReviewsConfig = {
        apiKey: '4a3f85c4-b20b-4663-9b6d-d3daa031348b', //change it
        merchantId: '289446' //change it
    }
    const pid = await page.evaluate(() => { 
        // find the pid or id of the product according on the pdp, so you have change the code inside this page evaluate.
        const productIdDOM = document.querySelector('div .sd-product-spp [data-product-id]')?.getAttribute('data-product-id')?.trim()
        const productIdWindowObj = window.PRODUCT_ID?.replace(/prod/gmi, '')?.trim()
        return productIdWindowObj || productIdDOM
    })

    //don't change anything from here.
    const reviews = await page.evaluate(async(pid, pageUrl, powerReviewsConfig) => {
        const maxReviewsPerRequest = 25 //Maximun number of reviews/request allowed by powerReviews
        const { apiKey, merchantId} = powerReviewsConfig
        const { origin } = new URL(pageUrl)
        const referer = origin + '/'
        const powerReviewDisplayOrigin = 'https://display.powerreviews.com'
        const fetchheaders = {
            hedaers: {
                'access-control-allow-credentials': 'true',
                'access-control-allow-origin': origin,
                'content-encoding': 'gzip',
                'content-type': 'application/json',
                'accept': '*/*',
            },
            origin,
            referer,
            method: 'GET',
            mode: 'cors'
        }
        async function getAllReviews(promisesArr){
            try{
                const res = await Promise.all(promisesArr)
                const jsons = await Promise.all(res.map(response => response.json()))
                  return jsons?.map(e => e.results[0].reviews)
            }catch(e){
                return []
            }
        }
        async function getData(url, headers = fetchheaders){
            try{
                const res = await fetch(url, headers)
                const json = res.status == 200 ? await res.json() : {}
                return {
                  json,
                  status: res.status
                }
            } catch(e){
                return {
                  json: {},
                  status: 404
                }
            }
        }
        function getReview(data){
            const { details } = data
            return {
                content: details.comments,
                title: details.headline,
                date: '',
                userName: details.nickname,
                rating: {
                  value: data.metrics.rating,
                  max: '5',
                  type: 'stars'
                }
            }
        }
        function getNextUrlHandler(totalRevArr, size = maxReviewsPerRequest, merchId = merchantId, productId = pid){
            const baseUrl = `/m/${merchId}/l/en_US/product/${productId}/reviews?`
            const query = `paging.from=${totalRevArr}&paging.size=${size}&filters=&search=&sort=Newest&image_only=false&page_locale=en_US`
            return baseUrl + query
        }
        function getNextUrlToFetch(handler, key = apiKey){
            return powerReviewDisplayOrigin + handler + `&_noconfig=true&apikey=${key}`
        }

        try{
            const builtUrlToFetch = `${powerReviewDisplayOrigin}/m/${merchantId}/l/en_US/product/${pid}/reviews?apikey=${apiKey}&_noconfig=true`
            const {json, status} = await getData(builtUrlToFetch)

            if (status !== 200){
                return {
                  items: [],
                  builtUrlToFetch,
                  json,
                  status,
                }
            }

            let reviewsToReturn = []
            const totalReviews = json.paging['total_results']
            const averageRating = json.results[0]?.rollup['average_rating']
            const totalRequests = Math.ceil(totalReviews / maxReviewsPerRequest)
            const promises = []
            for (let i = 0; i < totalRequests; i++){
                const handler = getNextUrlHandler( i * maxReviewsPerRequest)
                const nextUrlToFetch = getNextUrlToFetch(handler)
                promises.push(fetch(nextUrlToFetch, fetchheaders))
            }
            const allFetchReviews = await getAllReviews(promises)
            const allReviews = allFetchReviews.map(reviews => {
                const items = reviews?.map(e => getReview(e))
                reviewsToReturn = [...reviewsToReturn, ...items]
                return 
            })

            return {
                "overallRating": {
                  "value": Number(averageRating)?.toFixed(1),
                  "max": "5",
                  "type": "stars"
                },
                "items": reviewsToReturn
            }
        }catch(e){
              return {
                items: []
              }
        }

    }, pid, extractorsDataObj.pageData.url, powerReviewsConfig)
            
    if (reviews?.items?.length){
        extractorsDataObj.customData.reviews = reviews
    }
}