async (fnParams, page, extractorsDataObj, { _, Errors }) => {
  // >> activate the disable-web-security option in navigation options 
  // >> add this custom in a perVariant custom       
  // find the juni store key in newwork tab and change the below variable
  // example url: https://api.juniphq.com/v1/product_reviews?include=product%2Ccustomer%2Cstore%2Crespondent%2Csurvey_answers%2Ctik_tok_urls&filter%5Bproduct_remote_ids%5D%5B%5D=6889983541386&sort%5Bfield%5D=created_at&sort%5Border%5D=desc&page%5Bsize%5D=100&v=TRWyAzKgXFVMsgdtPLyjeUEo
  // this would be the key: TRWyAzKgXFVMsgdtPLyjeUEo (from the example url)
  const junipStoreKey = "DDeH8DGMqDUA4ojWZVoazg5L" //this is all you need to change

  const { id: productId } = extractorsDataObj.customData
  let { origin } = new URL(extractorsDataObj.pageData.url)
  const fetchHeader = getFetchHeader(origin, junipStoreKey)
  const {
    id: reviewsID, 
    rating_average: averageRating,
    rating_count: totalReviews
  } = await fetchReviewDetails(junipStoreKey, productId, fetchHeader)
  const maxReviewsPerRequest = 100

  const config = {
      junipStoreKey,
      productId, 
      origin,
      fetchHeader,
      reviewsID,
      maxReviewsPerRequest,
      averageRating,
      totalReviews
  }
  const reviews = await fetchReviews(config)

  async function fetchReviews(config){
    try{
      return await page.evaluate(async(config) => {
        if (config.totalReviews < 1){
          return {}
        }
        const firstUrlToFetch = `https://api.juniphq.com/v1/product_reviews?include=product%2Ccustomer%2Cstore%2Crespondent%2Csurvey_answers%2Ctik_tok_urls&filter%5Bproduct_remote_ids%5D%5B%5D=${config.productId}&sort%5Bfield%5D=created_at&sort%5Border%5D=desc&page%5Bsize%5D=${config.maxReviewsPerRequest}&v=${config.junipStoreKey}`
        const firstRes = await fetch(firstUrlToFetch, config.fetchHeader)
        const firstJson = firstRes.status == 200 ? await firstRes.json() : {}
        let afterKey = firstJson?.meta?.page?.after || ''
        const allReviews = firstJson?.product_reviews || []
        while(afterKey){
          const nextUrlToFetch = `https://api.juniphq.com/v1/product_reviews?include=product%2Ccustomer%2Cstore%2Crespondent%2Csurvey_answers%2Ctik_tok_urls&page%5Bsize%5D=${config.maxReviewsPerRequest}&filter%5Bproduct_ids%5D%5B%5D=${config.reviewsID}&sort%5Bfield%5D=created_at&sort%5Border%5D=desc&page%5Bafter%5D=${afterKey}&v=${config.junipStoreKey}`
          const nextRes = await fetch(nextUrlToFetch, config.fetchHeader)
          const nextJson = nextRes.status == 200 ? await nextRes.json() : {}
          nextJson?.product_reviews?.map(e => allReviews.push(e))
          afterKey = nextJson?.meta?.page?.after
        }
        const items = allReviews?.map(e => getReviewObj(e))

        function getReviewObj(review){
          return {
            content: review?.body,
            title: review?.title,
            date: review?.created_at?.split("T")?.[0] ?? "",
            userName: `${review?.customer?.first_name || ''} ${review?.customer?.last_name || ''}`,
            rating: {
              value: review?.rating || 0,
              max: "5",  
              type: "stars",
            } 
          }
        }
        const reviewsToReturn = {
          overallRating: {
            value: isNaN(Number(config.averageRating))
              ? ""
              : Number(config.averageRating).toFixed(1),
            max: "5",
            type: "stars",
          },
          items
        }
        return items?.length ? reviewsToReturn : {}
      }, config)
    }catch(e){} 
  }

  async function fetchReviewDetails(junipStoreKey, productId, fetchHeader){
    const config = {
      junipStoreKey, productId, fetchHeader
    }
      try{
          return await page.evaluate(async(config) => {
              const urlToFetch = `https://api.juniphq.com/v1/products?filter%5Bremote_ids%5D=${config.productId}&v=${config.junipStoreKey}`
              const res = await fetch(urlToFetch, config.fetchHeader)
              const data = res.status == 200 ? await res.json() : {}
              return data?.products?.[0] || {}
          }, config)
      }catch(e){}
  }   
  function getFetchHeader(origin, junipStoreKey){
      return {
        headers: {
          accept: "*/*",
          "accept-language": "es-ES,es;q=0.9",
          "content-type": "application/json",
          "junip-store-key": junipStoreKey,
          "sec-ch-ua":
            '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
        },
        origin,
        referrer: `${origin}/`,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "omit",
      }
  }
  extractorsDataObj.customData.reviews = reviews
}