async (data, { input, config }, { _, Errors }) => {
    let reviews;

    try {
        reviews = await input.page.evaluate(async () => {
            const items = [];
            const feraPublicKey = window?.fera?.abTests?._opts?.api?._config?.store_pk
            const feraApiClient = window?.fera?.abTests?._opts?.api?._apiClientDescriptor


            const fetchData = async (page, feraPublicKey, feraApiClient) => {
                let url = `https://api.fera.ai/v2/public/reviews.json?page=${page}&limit=100&sort_by=most_recent&review_type=product&public_key=${feraPublicKey}&api_client=${feraApiClient}`;
                const response = await fetch(url);
                return response.json();
            };

            const extractReviewData = (data) => {
                return data?.map(element => {
                    const date = new Date(element?.created_at)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return {
                        userName: element?.customer_name,
                        content: element?.body,
                        date: date,
                        rating: {
                            value: element?.rating,
                            max: '5',
                            type: 'star'
                        }
                    };
                });
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

            const getItems = async () => {
                let page = 1;
                while (true) {
                    const pageData = await fetchData(page, feraPublicKey, feraApiClient);
                    if (pageData?.length == 0) break;
                    items.push(...extractReviewData(pageData));
                    page++
                }
                return items
            }
            let fetchedReviews = await getItems()
            let overallRating = extractOverallRating(fetchedReviews)
            return {
                items: fetchedReviews,
                overallRating
            };

        })
    } catch (e) {
        console.error('Error extracting reviews:', e);
    }

    return reviews;
}
