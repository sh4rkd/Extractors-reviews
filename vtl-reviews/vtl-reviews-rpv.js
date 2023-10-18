async (fnParams, page, extractorsDataObj, { _, Errors }) => {
  // Script test to extract VTL Reviews
  try {
    let productId = extractorsDataObj.customData.id;
    let reviews = await page.evaluate(async (productId) => {
      let reviewsObject = {};
      let vtlCacheKey =
        window?.vtlsLiquidData?.ubCacheKey ||
        window?.vtlsLiquidData?.rpCacheKey ||
        window?.vtlsLiquidData?.cacheKeys.filter((key) => key > 0) ||
        "1697123429"; // We can view the cacheKey from the window object. Replace the cacheKey string with the string that corresponds to the page.
      // Also, the path rpCacheKey / ubCacheKey may not be right for the fetch, for these cases, it seems that using one of the cacheKeys (other than "0") of the array may work properly. path: window?.vtlsLiquidData?.cacheKeys

      // Url to fetch and fetch
      let reviewsJson = `https://appsolve.io/api/reviews/${vtlCacheKey}/${productId}.json`; // for this url to fetch, it may be /reviews/ or /reviews-groups/. /reviews/ works most times
      let response = await fetch(reviewsJson);

      if (response.status == 200) {
        let vtlObject = await response.json();
        let numberOfReviews = vtlObject.reviewStats.r;
        let averageRating = vtlObject.reviewStats.s;

        let rawReviewsArray = vtlObject.reviews;

        let reviewsToReturn = [];

        for (let review of rawReviewsArray) {
          let reviewObject = {};
          let ratingObj = { max: "5", type: "stars" };

          let content = review.review;
          let date = review.date;
          let userName = review.name;
          let rating = review.stars;

          ratingObj["value"] = Number(rating);

          reviewObject["content"] = content;
          reviewObject["title"] = "";
          reviewObject["date"] = date;
          reviewObject["userName"] = userName;
          reviewObject["rating"] = ratingObj;

          reviewsToReturn.push(reviewObject);
        }

        reviewsObject["overallRating"] = {
          value: Number(averageRating)?.toFixed(1),
          max: "5",
          type: "stars",
        };

        reviewsObject["items"] = reviewsToReturn;

        return reviewsObject;
      } else {
        return {};
      }
    }, productId);

    if (reviews?.items?.length) {
      extractorsDataObj.customData.reviews = reviews;
    }
  } catch (e) {
    console.log(e);
  }
};
