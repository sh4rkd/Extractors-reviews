async (fnParams, page, extractorsDataObj, { _, Errors }) => {
  try {
    let reviews = await page.evaluate(async () => {
      let reviews = [];
      let productId =
        window?.__st?.rid ||
        window?.meta?.product?.id ||
        window?.sswApp?.product?.id ||
        window?.ShopifyAnalytics?.meta?.page?.resourceId ||
        ''; // Esto es solo para pruebas en una herramienta de scraping
      let page = 1;
      let apiToken = "5903a04f-db4b-46d8-8ddd-d9c8ba046b67"; // Cambia este apiToken
      let indexName = "aa2608e7-b0d6-4ffd-88a1-ffdfcc61041e"; // Cambia este indexName

      let reviewFetched = async (apiToken, indexName, productId, page) => {
        let review = await fetch(
          `https://app.targetbay.com/api/v1/webhooks/review-widget?api_token=${apiToken}&index_name=${indexName}&product_id=${productId}&reviewpage=${page}`
        );
        let data = await review.json();
        let text = data.content;
        const parser = new DOMParser();
        const html = parser.parseFromString(text, 'text/html');

        let existReviews = html.querySelector(`.targetbay_reviews_tgb_review_list`) !== null;
        let reviews = [];
        if (existReviews) {
          reviews = [...html.querySelectorAll(".targetbay_reviews_tgb_review_list")].map((item) => {
            let content = item?.querySelector(`.tbsite-targetbay-reviews-comments .targetbay-reviews-product-page-reviews-content`)?.textContent.trim() || item?.querySelector(`.ssw-user-text-message`)?.textContent.trim() || "";
            let title = item?.querySelector(".tbsite-targetbay-reviews-comments .targetbay-reviews-product-page-reviews-title")?.textContent.trim() || item?.querySelector(".ssw-title-text")?.textContent.trim() || "";
            let userName = item?.querySelector(".targetbay_reviews-popup-client-head-name")?.textContent.trim() || "";

            if (content !== "" || title !== "" || userName !== "") {
              return {
                content: content,
                title: title,
                date: item?.querySelector(".targetbay-reviews-list-product-date-readable")?.textContent.trim() || item?.querySelector(".ssw-timestamp")?.textContent.trim() || "",
                userName: userName,
                rating: {
                  value: Number(item?.querySelectorAll(".tbsite-targetbay-reviews-comments .tbProductReview-totalStarRatingIcon .tb-full-star")?.length || item?.querySelectorAll(".ssw-icon-star")?.length || 0),
                  max: '5',
                  type: 'stars',
                },
              };
            }
            return null;
          });
        }
        reviews = reviews.filter((e) => e !== null);
        return [reviews, existReviews];
      };

      // apiToken, indexName, productId, page
      let existReviews = await reviewFetched(apiToken, indexName, productId, page);
      if (!existReviews[1]) return [];
      reviews.push(...existReviews[0]);
      await new Promise((res) => setTimeout(res, 500));
      while (existReviews[1]) {
        page++;
        existReviews = await reviewFetched(apiToken, indexName, productId, page);
        if (existReviews[1]) {
          reviews.push(...existReviews[0]);
          await new Promise((res) => setTimeout(res, 500));
        }
      }

      reviews = new Set(reviews);
      reviews = [...reviews];
      const ratingReviews = reviews.map((review) => review.rating.value);
      const sumsRatingReviews = ratingReviews.reduce((total, rating) => total + rating, 0);
      const avgRating = sumsRatingReviews / ratingReviews.length;

      return {
        "overallRating": {
          "value": Number(avgRating)?.toFixed(1),
          "max": "5",
          "type": "stars",
        },
        "items": reviews,
      };
    });
    extractorsDataObj.customData.reviews = reviews;
  } catch (e) {
    console.log(e);
  }
}
