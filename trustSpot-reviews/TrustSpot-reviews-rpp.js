async (data, { input, config }, { _, Errors }) => {

    //For use this extractor you need to use a "genericExtractor" and fill the requested selectors as if we are going to use them:
    //Example:
    // "ratingType": "stars",
    // "maxRatingValue": "5",
    // "deduplicate": false,
    // "baseElementSelector": ".product-reviews-content ",
    // "reviewElementSelector": "#trustspot-widget-review-block",
    // "userNameSelector": ".user-name:not(.ts-location)",
    // "contentSelector": ".description-block p",
    // "dateSelector": ".date",
    // "extractorReviewRatingConfig": {
    //   "ratingReviewStrategy": "starsSelector",
    //   "starsSelector": ".stars ",
    //   "starSelectorElement": ".ts-widget-review-star.filled"
    // },
    // "extractorOverallRatingConfig": {
    //   "ratingReviewStrategy": "selectorTextContent",
    //   "selectorTextContent": ".trustspot-average-rating",
    //   "ignoreBaseElementSelector": false
    // }

    //------------------------> If you have doubts, you can see the ReadMe.
  let newItems
  try {
    newItems = await input.page.evaluate(async () => {
      const widgetMethods = window.trustspotWidgetMethods;
      const objetoEncontrado = widgetMethods.find((obj) => obj.params?.sku);

      //Check that this selectors are working first or configure it.
      const baseElementSelector = `#product-widget-review-result`
      const reviewSelector = `#trustspot-product-reviews #trustspot-widget-review-block`
      const usernameSelector = `.result-box .user-name:not(.ts-location)`
      const titleSelector = ``
      const contentSelector = `.description-block p`
      const dateSelector = `.result-box .date`
      const starsBaseElementSelector = `.result-box`
      const singleStarSelector = `.stars .filled`
      const reviewMaxRatingValue = `5`
      const reviewRatingStrategy = `stars`

      //Go to Network/Red - Search for trustspot endpoint- Select a request - On the right panel select "Useful load/Carga util" and copy the "key" attribute and paste it here:
      const trustSpotKey = `9414ad8f8f5fb1f4a5198548feaca0b52a10c94f5abced3e5f362f5e359ff0465374bcfccc620b4ded3971d7b5bfac976699cdf1c69d3f53495b567f6949a2cb`

      //Website in this format: (Replace it)
      const origin = `https://www.madamglam.com`

      const extractReviews = async () => {
        let items = [];
        let pageNum = 1;

        while (true) {
          const data = {
            "methods[0][method]": "main_widget",
            "methods[0][params][sku]": objetoEncontrado?.params?.sku,
            "page": pageNum.toString(),
            key: trustSpotKey,
            devicePixelRatio: 1
          };

          const response = await fetch("https://trustspot.io/api/pub/product_review", {
            method: "POST",
            headers: {
              "accept": "*/*",
              "accept-language": "es-ES,es;q=0.9,en;q=0.8",
              "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
              "origin": origin,
              "referer": window.location.href,
              "sec-ch-ua": "\"Google Chrome\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": "\"Windows\"",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "cross-site"
            },
            body: new URLSearchParams(data)
          });

          const json = await response.json();
          const reviewsHtml = json['0']?.content;
          const parser = new DOMParser();
          const doc = parser.parseFromString(reviewsHtml, "text/html");
          const reviewsParsed = [...doc.querySelectorAll(`${reviewSelector}`)]

          if (reviewsParsed.length === 0) {
            break;
          }

          const reviews = reviewsParsed.map((reviewParsed) => {
            const review = {};
            review.content = reviewParsed.querySelector(contentSelector)?.textContent?.trim();
            review.date = reviewParsed.querySelector(dateSelector)?.textContent?.trim();
            review.userName = reviewParsed.querySelector(usernameSelector)?.textContent?.trim();
            review.rating = {
              value: [...reviewParsed.querySelectorAll(`${starsBaseElementSelector} ${singleStarSelector}`)]?.length,
              max: reviewMaxRatingValue,
              type: reviewRatingStrategy
            };
            return review;
          });

          items = [...items, ...reviews];

          if (reviews.some((review) => !review.content || !review.date || !review.userName)) {
            break;
          }

          pageNum++;
        }

        return items
      };

      let fetchedReviews = await extractReviews()
      return fetchedReviews
    })
  } catch (e) { }
  data.items = newItems
  return data
}