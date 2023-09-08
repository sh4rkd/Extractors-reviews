async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    try{
      let totalReviews = await page.evaluate(async()=>{
        let reviewFetched = async (productId, page) => {
          // Fetch review and parse to HTML
          let review = await fetch(`https://www.bemilosangeles.com/apps/ssw/lite2/review/index?customer_locale=en&hash_key=64f88f6456a3222c415629b5&product_id=${productId}&_sid=f57d8ce7-7caf-31f8-18d8-7bc34833840b&page=${page}&isPartially=true&include_site_review=0&rate=all&order=most_recent&new_widget=1`);
          let data = await review.text();
          const parser = new DOMParser();
          const html = parser.parseFromString(data, 'text/html');
  
          // Check if reviews exist
          let existReviews = html.querySelector(`#ssw-current-count-items+.ssw-item`) !== null;
          let reviews = [];
          if (existReviews) {
            // Extract all the reviews
            reviews = [...html.querySelectorAll(".ssw-item")].map(item => {
              return {
                content: item?.querySelector(`.ssw-photo-layout__reviews_review-text`)?.textContent.trim(),
                title: item?.querySelector(".wc_review_boby_title")?.textContent.trim() || "",
                date: item?.querySelector(".ssw-photo-layout__reviews_date")?.textContent.trim(),
                userName: item?.querySelector(".ssw-recommend-author")?.textContent.trim(),
                rating: {
                  value: Number(item?.querySelectorAll(".ssw-photo-layout__reviews_star")?.length),
                  max: '5',
                  type: 'stars',
                }
              };
            });
          }
          return [reviews, existReviews];
        };
  
        let reviews = [];
        let productId = __st.rid;
        let page = 1;
        let existReviews = await reviewFetched(productId, page);
        if (!existReviews[1]) return [];
        reviews.push(...existReviews[0]); // Use push with spread to add individual items
        while (existReviews[1]) {
          page++;
          existReviews = await reviewFetched(productId, page);
          reviews.push(...existReviews[0]); // Use push with spread to add individual items
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
      })
      if(totalReviews?.items?.length)extractorsDataObj.customData.totalReviews = totalReviews
    }catch{}
  }