async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    //*** in the reviews extractor in extension add a custom strategy and add the path: reviews ***
     
    // this custom function should be added in a perVariant custom function.

    // these are the two things you should find for your site and change the ones below.
    // example of url where this data was obtained (you should find in the Network tab):
    // https://widget.trustpilot.com/trustbox-data/60f537b5b0f1639de1fe048c?businessUnitId=59a03eed0000ff0005a9abd7&locale=en-US
    // example site: https://www.modularclosets.com/
    const trustBoxData = {
        trustBoxId: '60f537b5b0f1639de1fe048c', //change it
        businessUnitId: '59a03eed0000ff0005a9abd7' //change it
    }
    

    const { id } = extractorsDataObj.customData
    const skus = extractorsDataObj?.customData?.variants?.map(e => e?.sku)
    skus.push(id)
    let stringSkus = ''
    for (let i = 0; i < skus?.length; i++){
        if (i == 0){
            stringSkus = stringSkus + skus[i]
        } else {
            stringSkus = stringSkus + ',' + skus[i]
        }
    }  
    async function getTrustPilotData(jsonSkus = stringSkus, trustIds = trustBoxData){
        try{
            return await page.evaluate((jsonSkus, trustIds) => {
                function getAttData(node, attributeName){
                    return node?.getAttribute(attributeName)?.trim()
                }
                const trustPilotNode = document.querySelector('div .trustpilot-widget')
                return {
                    templateId: trustIds?.trustBoxId || getAttData(trustPilotNode, 'data-template-id'),
                    businessUnitId: trustIds?.businessUnitId || getAttData(trustPilotNode, 'data-businessunit-id'),
                    skus: getAttData(trustPilotNode, 'data-sku') || jsonSkus
                } 
            }, jsonSkus, trustIds)
        }catch(e){
            return {}
        }
    } 
    const trusPilotData = await getTrustPilotData()

    try{
        const reviews = await page.evaluate(async(trusPilotData, stringSkus) => {
            const maxReviewsPerRequest = 50
            const fetchHeaders = {
                method: 'GET',
                mode: 'cors'
            }
            async function fetchReviews(url, headers = fetchHeaders){
                try{
                    const res = await fetch(url, headers)
                    const json = res.status == 200 ? await res.json() : {}
                    return json
                }catch(e){
                    return {}
                }
            }
            function getReview(reviewObj){
                const { content, stars, createdAt} = reviewObj
                return {
                content,
                title: '',
                date: createdAt?.replace(/T.*/gmi, '')?.trim() || '',
                userName: reviewObj?.consumer?.displayName?.trim() || '',
                rating: {
                  value: stars,
                  max: '5',
                  type: 'stars'
                }
              }
            }
            function getReviewsData(average, items){
                return {
                "overallRating": {
                  "value": Number(average)?.toFixed(1),
                  "max": "5",
                  "type": "stars"
                },
                "items": items
              }
            }
            function getUrlToFetch(index, trustData = trusPilotData, idSkus = stringSkus, max = maxReviewsPerRequest){
                const base = `https://widget.trustpilot.com/trustbox-data/${trustData.templateId}`
                const query = `?businessUnitId=${trustData.businessUnitId}&locale=en-US&sku=${idSkus}&reviewLanguages=en&reviewsPerPage=${max}&includeImportedReviews=true&page=${index}`
                return `${base}${query}`
            }

            const firstReviews = await fetchReviews(getUrlToFetch(1))
            const average = firstReviews?.productReviewsSummary?.starsAverage
            const totalOfReviews = firstReviews?.productReviewsSummary?.numberOfReviews?.total
            if (totalOfReviews == 0){
                return {
                    items: []
                }
            }
            let productReviews = firstReviews?.productReviews?.reviews?.map(review => getReview(review)) || []
            const totalOfRequests = Math.ceil(totalOfReviews / maxReviewsPerRequest)
            for (let i = 1; i < totalOfRequests; i++){
                const fetchData = await fetchReviews(getUrlToFetch(i + 1))
                const reviewsData = fetchData?.productReviews?.reviews?.map(review => getReview(review)) || []
                productReviews = [...productReviews, ...reviewsData]
            }
            return getReviewsData(average, productReviews) 

        }, trusPilotData, stringSkus)
        if (reviews?.items?.length){
            extractorsDataObj.customData.reviews = reviews
        }
    }catch(e){
        console.log(e)
    }
}

// If the other strategy receives lower reviews than the PDP...
// ... when your reviews require both importedProductReviews and productReviews.
async (fnParams, page, extractorsDataObj, { _, Errors }) => {
    const trustBoxData = {
        trustBoxId: '57177697fdb1180308e3815f', // cambia esto
        businessUnitId: '5c63e78c2f5803000199fc14' // cambia esto
    }

    const { id } = extractorsDataObj.customData
    const skus = extractorsDataObj?.customData?.variants?.map(e => e?.sku)
    skus.push(id)
    let stringSkus = ''
    for (let i = 0; i < skus?.length; i++) {
        if (i == 0) {
            stringSkus = stringSkus + skus[i]
        } else {
            stringSkus = stringSkus + ',' + skus[i]
        }
    }
    async function getTrustPilotData(jsonSkus = stringSkus, trustIds = trustBoxData) {
        try {
            return await page.evaluate((jsonSkus, trustIds) => {
                function getAttData(node, attributeName) {
                    return node?.getAttribute(attributeName)?.trim()
                }
                const trustPilotNode = document.querySelector('div .trustpilot-widget')
                return {
                    templateId: trustIds?.trustBoxId || getAttData(trustPilotNode, 'data-template-id'),
                    businessUnitId: trustIds?.businessUnitId || getAttData(trustPilotNode, 'data-businessunit-id'),
                    skus: getAttData(trustPilotNode, 'data-sku') || jsonSkus
                }
            }, jsonSkus, trustIds)
        } catch (e) {
            return {}
        }
    }
    const trusPilotData = await getTrustPilotData()

    try {
        const reviews = await page.evaluate(async (trusPilotData, stringSkus) => {
            const maxReviewsPerRequest = 50
            const fetchHeaders = {
                method: 'GET',
                mode: 'cors'
            }
            async function fetchReviews(url, headers = fetchHeaders) {
                try {
                    const res = await fetch(url, headers)
                    const json = res.status == 200 ? await res.json() : {}
                    return json
                } catch (e) {
                    return {}
                }
            }
            function getReview(reviewObj) {
                const { content, stars, createdAt } = reviewObj
                return {
                    content,
                    title: '',
                    date: createdAt?.replace(/T.*/gmi, '')?.trim() || '',
                    userName: reviewObj?.consumer?.displayName?.trim() || '',
                    rating: {
                        value: stars,
                        max: '5',
                        type: 'stars'
                    }
                }
            }
            function getReviewsData(average, items) {
                return {
                    "overallRating": {
                        "value": Number(average)?.toFixed(1),
                        "max": "5",
                        "type": "stars"
                    },
                    "items": items
                }
            }
            function getUrlToFetch(index, trustData = trusPilotData, idSkus = stringSkus, max = maxReviewsPerRequest) {
                const base = `https://widget.trustpilot.com/trustbox-data/${trustData.templateId}`
                const query = `?businessUnitId=${trustData.businessUnitId}&locale=en-US&sku=${idSkus}&reviewLanguages=en&reviewsPerPage=${max}&reviewLanguages=en&page=${index}`
                return `${base}${query}`
            }

            const firstReviews = await fetchReviews(getUrlToFetch(1))
            const average = firstReviews?.productReviewsSummary?.starsAverage
            const totalOfReviews = firstReviews?.productReviewsSummary?.numberOfReviews?.total
            if (totalOfReviews == 0) {
                return {
                    items: []
                }
            }
            let productReviews = firstReviews?.importedProductReviews?.productReviews?.map(review => getReview(review)) || []
            let productReviews2 = firstReviews?.productReviews?.reviews?.map(review => getReview(review)) || []
            const totalOfRequests = Math.ceil(totalOfReviews / maxReviewsPerRequest)
            let i = 0;
            while (true) {
                const fetchData = await fetchReviews(getUrlToFetch(i + 1))
                const reviewsData = fetchData?.importedProductReviews?.productReviews?.map(review => getReview(review)) || []
                const reviewsData2 = fetchData?.productReviews?.reviews?.map(review => getReview(review)) || []
                productReviews = [...productReviews, ...reviewsData, ...productReviews2, ...reviewsData2]
                i++
                if (reviewsData?.length == 0 && reviewsData2?.length == 0) break
            }

            //for deduplicate productReviews
            productReviews = productReviews.filter((review, index, self) => {
                const currentReviewJSON = JSON.stringify(review);
                return (
                    index === self.findIndex((r) => JSON.stringify(r) === currentReviewJSON)
                );
            });
            const sumRatingValues = productReviews.reduce((sum, review) => sum + review.rating.value, 0);
            const averageRating = sumRatingValues / productReviews.length;
            return getReviewsData(averageRating, productReviews)

        }, trusPilotData, stringSkus)

        if (reviews?.items?.length) {
            extractorsDataObj.customData.reviews = reviews
        }
    } catch (e) {
        console.log(e)
    }
}
