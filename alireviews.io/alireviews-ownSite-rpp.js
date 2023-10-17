async (data, { input, config }, { _, Errors }) => {

    let reviews
    const urlString = input?.pageData?.url
    const urlObject = new URL(urlString);

    const baseUrl = urlObject.origin;

    try {
        reviews = await input.page.evaluate(async (params) => {

            const [baseUrl] = params
            //Check that this selectors are working first or configure it.
            const baseElementSelector = `.main_reviews_container`
            const reviewSelector = `.cell.item[data-id]`
            const usernameSelector = `span.areviews_user_name`
            const titleSelector = ``
            const contentSelector = `.comment_container`
            const dateSelector = `.comment_time`
            const starsBaseElementSelector = `.main_container_review_stars`
            const singleStarSelector = `.fas.fa-star`
            const reviewMaxRatingValue = `5`
            const reviewRatingStrategy = `stars`

            const endpointUrl = `${baseUrl}/apps/aliexpress_reviews`


            const extractReviews = async () => {
                let items = [];
                let pageNum = 1;

                while (true) {
                    const data = {
                        shop: window?.Shopify?.shop,
                        page: pageNum?.toString(),
                        product_id: window?.item?.ProductID,
                        customer_reviews_status: 1,
                        customer_id: '',
                        sort_value: '',
                        areviews_rating: ''
                    };

                    const response = await fetch(endpointUrl, {
                        method: "POST",
                        body: new URLSearchParams(data)
                    });

                    const reviewsHtml = await response.text();
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

                    if (reviews.some((review) => !review.content && !review.date && !review.userName)) {
                        break;
                    }

                    pageNum++;
                }

                return items
            };

            const extractOverallRating = (reviewsItems) => {
                let overallRating = {
                    max: '5',
                    type: 'stars'
                }

                if (reviewsItems?.length === 0) {
                    overallRating.value = 0;
                } else {
                    const total = reviewsItems.reduce((sum, review) => {
                        return sum + (review?.rating?.value || 0);
                    }, 0);
                    const value = (total / reviewsItems.length)?.toString()
                    const fixedValue = value?.match(/^(\d+\.\d)/)?.[1]
                    overallRating.value = fixedValue;
                }
                return overallRating;
            }

            let fetchedReviews = await extractReviews()
            let overallRating = extractOverallRating(fetchedReviews)
            return {
                items: fetchedReviews,
                overallRating
            };
        }, [baseUrl])
    } catch (e) {
        console.error('Error extracting reviews', e)
    }

    return reviews
}