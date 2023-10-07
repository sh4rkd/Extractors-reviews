async (fnParams, page, extractorsDataObj, {_, Errors})=> {
  try{
    let domain = new URL(extractorsDataObj.pageData.url)?.origin
    let reviews = await page.evaluate(async(domain)=>{
      let reviewFetched = async (domain, hashKey, sid, productId, page) => {
        let review = await fetch(`${domain}/apps/ssw/lite2/review/index?customer_locale=en&hash_key=${hashKey}&product_id=${productId}&_sid=${sid}&page=${page}&isPartially=true&include_site_review=0&rate=all&order=most_recent&new_widget=1`);
        let data = await review.text();
        const parser = new DOMParser();
        const html = parser.parseFromString(data, 'text/html');

        let existReviews = html.querySelector(`.ssw-item`) !== null;
        let reviews = [];
        if (existReviews) {
          reviews = [...html.querySelectorAll(".ssw-item")].map(item => {
            return {
              content: item?.querySelector(`.ssw-photo-layout__reviews_review-text`)?.textContent.trim()||item?.querySelector(`.ssw-user-text-message`)?.textContent.trim()||"",
              title: item?.querySelector(".wc_review_boby_title")?.textContent.trim() || item?.querySelector(".ssw-title-text")?.textContent.trim() || "",
              date: item?.querySelector(".ssw-photo-layout__reviews_date")?.textContent.trim() || item?.querySelector(".ssw-timestamp")?.textContent.trim() || "",
              userName: item?.querySelector(".ssw-recommend-author")?.textContent.trim() || "",
              rating: {
                value: Number(item?.querySelectorAll(".ssw-photo-layout__reviews_star")?.length||item?.querySelectorAll(".ssw-icon-star")?.length||0),
                max: '5',
                type: 'stars',
              }
            };
          });
        }
        return [reviews, existReviews];
      };

      let reviews = [];
      let productId = window?.__st?.rid || window?.meta?.product?.id || window?.sswApp?.product?.id || window?.ShopifyAnalytics?.meta?.page?.resourceId || ""
      let page = 1;
      let hashKey = "6521810273e2624400035b6a" //change this hashKey
      let sid = "95775a8d-b5f8-9c35-8e10-8caa5f4627ee" //change this sid

      let existReviews = await reviewFetched(domain,hashKey,sid,productId, page);
      if (!existReviews[1]) return [];
      reviews.push(...existReviews[0]); 
      while (existReviews[1]) {
        page++;
        existReviews = await reviewFetched(domain,hashKey,sid,productId, page);
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
    },domain)
    extractorsDataObj.customData.reviews = reviews
  }catch(e){
    console.log(e)
  }
}