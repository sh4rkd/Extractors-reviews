async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    try{
      let productId = extractorsDataObj.customData.id
      let reviews = await page.evaluate(async(productId)=>{
        let clientId = window?.LOOX?.clientId||"VJ-J5FhdCw"//change empty string to clientId
        let hashKey = window?.LOOX?.hash||window?.loox_global_hash||"1696513680338"//change empty string to hashKey
        let page = 1

        let reviewFetched = async (clientId, hashKey, productId, page) => {
          let review = await fetch(`https://loox.io/widget/${clientId}/reviews?h=${hashKey}&productId=${productId}&page=${page}`, {
  "headers": {
    "accept": "*/*",
    "accept-language": "es-419,es;q=0.9",
    "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": `https://loox.io/widget/${clientId}/reviews?h=${hashKey}&productId=${productId}`,
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "omit"
});
          let data = await review.text();
          const parser = new DOMParser();
          const html = parser.parseFromString(data, 'text/html');
  
          let existReviews = html.querySelector(`.ssw-item`) !== null;
          let reviews = [];
          if (existReviews) {
            reviews = [...html.querySelectorAll(".ssw-item")].map(item => {
              return {
                content: item?.querySelector(`.main-text`)?.textContent.trim()||item?.querySelector(`.ssw-user-text-message`)?.textContent.trim()||"",
                title: item?.querySelector(".titles")?.textContent.trim() || item?.querySelector(".ssw-title-text")?.textContent.trim() || "",
                date: item?.querySelector(".time")?.textContent.trim() || item?.querySelector(".ssw-timestamp")?.textContent.trim() || "",
                userName: item?.querySelector(".title")?.textContent.trim() || "",
                rating: {
                  value: Number(item?.querySelectorAll(`.stars [aria-label*="full"]`)?.length||item?.querySelectorAll(".ssw-icon-star")?.length||0),
                  max: '5',
                  type: 'stars',
                }
              };
            });
          }
          return [reviews, existReviews];
        };
  
        let reviews = [];
        //clientId, hashKey, total, productId, page
        let existReviews = await reviewFetched(clientId, hashKey, productId, page);
        if (!existReviews[1]) return [];
        reviews.push(...existReviews[0]); 
        while (existReviews[1]) {
          page++;
          existReviews = await reviewFetched(clientId, hashKey, productId, page);
          reviews.push(...existReviews[0]); 
        }
  
        const ratingReviews = reviews.map(review => review.rating.value);
        const sumsRatingReviews = ratingReviews.reduce((total, rating) => total + rating, 0);
        const avgRating = sumsRatingReviews / ratingReviews.length;
  
        return {
          "overallRating": {
            "value": Number(avgRating)?.toFixed(1),
            "max": "5",
            "type": "stars"
          },
          "items": reviews
        }
      },productId)
      extractorsDataObj.customData.reviews = reviews
    }catch(e){
      console.log(e)
    }
  }