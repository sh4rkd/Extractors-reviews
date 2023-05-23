async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    //*** in the reviews extractor in extension add a custom strategy and add the path: reviews ***
    
    // this custom should be added as a postNavigate custom function
    // example site: https://www.legends.com/
    
    async function getStoreName(){
        try{
            return await page.evaluate(() => {
                const shopFromDOM = document.querySelector('[src*="shop="i][src*="myshopify.com"i]')
                ?.src?.replace(/.*shop=/gmi, '')?.replace(/(?<=myshopify?.com).*/gmi, '')?.trim() || ''
                const shopFromWindow = window.Shopify?.shop?.trim() || ''
                return shopFromDOM ? shopFromDOM : shopFromWindow
            })
        }catch(e){
            return ''
        }
    }
    async function getApiKey(store){
        try{
            return await page.evaluate(async(store) => {
                const apiKeyUrlFetch = `https://stamped.io/api/getappkey?shopShopifyDomain=${store}`
                const res = await fetch(apiKeyUrlFetch, {
                    method: 'GET',
                    mode: 'cors'
                })
                const resData = res.status == 200 ? await res.json() : {}
                return resData?.apiKey
            }, store)
        }catch(e){
            return ''
        }
    }

    const storeShop = await getStoreName()
    const apiKey = await getApiKey(storeShop)
    const {id, title} = extractorsDataObj.customData
    const { origin } = new URL(extractorsDataObj.pageData.url)
    const { sku: variantSku } = extractorsDataObj.customData.variantData
    const fetchHeaders = {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-encoding': 'gzip, deflate, br',
        'origin': origin,
        'referer': origin + '/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
      },
      method: 'GET',
      mode: 'cors'
    }
    const prop = {
      productId: id,
      name: title?.replace(/\s/gm, '%20'),
      sku: variantSku?.toString()?.replace(/\s/gm, '-')?.toLowerCase(),
      fetchHeaders,
      apiKey,
      storeShop
    }
    
    async function getReviews(props = prop){
      try{
        const {fetchStatus, count, reviews} = await page.evaluate(async(props) => {
          async function fetchRecursive(url, headers = props.fetchHeaders, retries = 0) {
            const response = await fetch(url, headers)
            if (response.status === 200) {
              return response.json()
            } else {
              if (retries < 3) {
                retries++
                return fetchRecursive(url, retries)
              } else {
                return {}
              }
            }
          }
          const shop = document.querySelector('[src*="shop="][src*=".myshopify"]')?.src?.replace(/.*shop=/gm, '')?.trim() || props.storeShop
          function getUrlToFetch(pageNumber, prodProps = props, pageShop = shop){
            const url = `https://stamped.io/api/widget?productId=${prodProps.productId}&productName=${prodProps.name}&productSKU=${prodProps.sku}&page=${pageNumber}&apiKey=${prodProps.apiKey}&storeUrl=${pageShop}&take=100`
            return url
          }
          
          const urlToFetch = getUrlToFetch(1)
          
          const json = await fetchRecursive(urlToFetch)
          if (json?.widget && json?.count == 0){
            return {
              fetchStatus: 200,
              count: 0,
              reviews: {}
            }
          }
          function getReviewsFromDoc(doc){
            return Array.from(doc.querySelectorAll('#stamped-reviews-tab .stamped-review'))
            ?.map(rev => {
              const content = rev?.querySelector('.stamped-review-content-body')?.textContent?.trim()
              const title = rev?.querySelector('.stamped-review-header-title')?.textContent?.trim()
              const date = rev?.querySelector('.created')?.textContent?.trim()
              const userName =  rev?.querySelector('.author')?.textContent?.trim()
              const rating = {
                value: Array.from(rev?.querySelectorAll('.stamped-starratings .stamped-fa-star'))?.length,
                max: '5',
                type: 'stars'
              }
              return {
                content, title, date, userName, rating
              }
            })
          }
          async function getAllReviews(promisesArr){
            try{
                const res = await Promise.all(promisesArr)
                const jsons = await Promise.all(res.map(response => response.json()))
                return jsons?.map(e => {
                  const widHtml = e.widget
                  const parser = new DOMParser()
                  const stampedDoc = parser.parseFromString(widHtml, 'text/html')
                  return getReviewsFromDoc(stampedDoc) || []
                })
            }catch(e){
                return []
            }
          }
          
          const averageRating = json.rating
          const { count } = json 
          const htmlText = json?.widget
          const parser = new DOMParser()
          const stampedDoc = parser.parseFromString(htmlText, 'text/html')
          const firstBatchReviews = getReviewsFromDoc(stampedDoc) || [{}]
          let reviewsToReturn = [...firstBatchReviews]
          const totalRequests = Math.ceil(count / firstBatchReviews?.length)
          
          const promises = [] 
          for (let i = 1; i < totalRequests; i++){
            const urlFetch = getUrlToFetch(i + 1)
            promises.push(fetch(urlFetch, props.fetchHeaders))
          }
          const allReviews = await getAllReviews(promises)
          const revs = allReviews?.filter(e => e?.length)?.map(e => {
            reviewsToReturn = [...reviewsToReturn, ...e]
            return 
          })

          const stampedReviews = {
            "overallRating": {
              "value": Number(averageRating)?.toFixed(1),
              "max": "5",
              "type": "stars"
            },
            "items": reviewsToReturn
          }
          return {
            fetchStatus: 200,
            count: reviewsToReturn?.length,
            reviews: stampedReviews
          }
        }, props)
        return {
          fetchStatus, count, reviews
        }
      }catch(e){
        return {
          fetchStatus: 404,
          count: 0,
          reviews: {}
        }
      }
    }

    const {reviews, fetchStatus} = await getReviews()
    if (fetchStatus == 200 && reviews?.items?.length){
      extractorsDataObj.customData.reviews = reviews
    }
}