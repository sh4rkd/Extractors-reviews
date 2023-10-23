async (fnParams, page, extractorsDataObj, {_, Errors})=> {
  try{
    let {url} = extractorsDataObj.pageData
    let domain = new URL(url).origin
    let dataToFetch = await page.evaluate((domain)=>{
      let junipStoreKey = 
      document.querySelector(".junip-store-key")?.getAttribute("data-store-key")  ||
      "esU5GDtQya3WWadz2K8FhiFJ"//modificar la junip key
      
      let totalReviews = 
      Number(document.querySelector(".junip-product-review-count")?.textContent?.replace(/\,||\./g,"").match(/\d+/)[0]|0) ||
      ""//modificar el selector de total reviews
  
      let reviewId = 
      window?.__st?.rid ||
      window?.meta?.product?.id ||
      window?.sswApp?.product?.id ||
      window?.ShopifyAnalytics?.meta?.page?.resourceId ||
      ''; // Esto es solo para pruebas en una herramienta de scraping
  
      let quantityReviews = 100
  
      let referrer = `${domain}/`
  
      return {
        junipStoreKey,
        reviewId,
        totalReviews,
        quantityReviews,
        referrer
      }
    }, domain)
  
    let items = await page.evaluate(async(dataToFetch)=>{
      let {junipStoreKey, reviewId, totalReviews, quantityReviews, referrer} = dataToFetch
      let reviewsToParse = []
      const junipFetch = async(link,junipStoreKey, referrer) =>{
        let dataFetch = await fetch(link, {
          "headers": {
            "accept": "*/*",
            "accept-language": "es-ES,es;q=0.9",
            "content-type": "application/json",
            "junip-store-key": junipStoreKey,
            "sec-ch-ua": "\"Google Chrome\";v=\"113\", \"Chromium\";v=\"113\", \"Not-A.Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site"
          },
          "referrer": referrer,
          "referrerPolicy": "strict-origin-when-cross-origin",
          "body": null,
          "method": "GET",
          "mode": "cors",
          "credentials": "omit"
        });
        return await dataFetch.json()
      }
      let dataFirstFetch = await junipFetch(`https://api.juniphq.com/v1/product_reviews?include=product%2Ccustomer%2Crespondent%2Csurvey_answers%2Ctik_tok_urls&filter%5Bproduct_remote_ids%5D%5B%5D=${reviewId}&sort%5Bfield%5D=created_at&sort%5Border%5D=desc&page%5Bsize%5D=${quantityReviews}&v=${junipStoreKey}`,junipStoreKey, referrer)
      reviewsToParse.push(dataFirstFetch.product_reviews)
  
      if(totalReviews>quantityReviews){
        totalReviews -= quantityReviews
        let lastProductId = dataFirstFetch.product_reviews.slice(-1)[0].product_id
        let pageAfter = dataFirstFetch.meta.page.after
  
        while(totalReviews>0){
          let lastReviewFetch = await junipFetch(`https://api.juniphq.com/v1/product_reviews?include=product%2Ccustomer%2Crespondent%2Csurvey_answers%2Ctik_tok_urls&page%5Bsize%5D=${quantityReviews}&filter%5Bproduct_ids%5D%5B%5D=${lastProductId}&sort%5Bfield%5D=created_at&sort%5Border%5D=desc&page%5Bafter%5D=${pageAfter}&v=${junipStoreKey}`,junipStoreKey, referrer)
          reviewsToParse.push(lastReviewFetch.product_reviews)
          totalReviews -= lastReviewFetch.product_reviews.length
          lastProductId = lastReviewFetch.product_reviews.slice(-1)[0].product_id
          pageAfter = lastReviewFetch.meta.page.after
        }
      }
      let reviews = [].concat(...reviewsToParse).map(e => {
          return{
              content:e?.body,
              title:e?.title,
              date:e?.created_at?.split("T")[0]??"",
              userName:`${e?.customer?.first_name} ${e?.customer?.last_name}`,
              rating:{
                value:e?.rating|0,
                max:"5",
                type:'stars',
              }
          }
      })
      return reviews
    }, dataToFetch)
  
    const sumRatingValues = items.reduce((sum, review) => sum + review.rating.value, 0);
    const averageRating = sumRatingValues / items.length;
    let reviews = {"overallRating": {
      "value": isNaN(Number(averageRating)) ? "" : Number(averageRating).toFixed(1),
      "max": "5",
        "type": "stars"
    },
    "items": items
    }
    extractorsDataObj.customData.reviews = reviews
  }catch{}
}