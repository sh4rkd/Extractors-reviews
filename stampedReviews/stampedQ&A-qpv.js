async (fnParams, page, extractorsDataObj, {_, Errors})=> {
  //*** in the reviews extractor in extension add a custom strategy and add the path: reviews ***
  
  // this custom should be added as a perVariant custom function and that's it.
  // example site: https://www.miir.com/
   
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
  async function EncodeTitle(title){
    try{
      return await page.evaluate((title) => encodeURIComponent(title), title)
    }catch(e){}
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
    name: await EncodeTitle(title),
    sku: variantSku?.toString()?.replace(/\s/gm, '-')?.toLowerCase(),
    fetchHeaders, 
    apiKey,  
    storeShop
  }
  
  async function getReviews(props = prop){
    try{
      const reviews = await page.evaluate(async(props) => {
        async function fetchRecursive(url, retries = 0, headers = props.fetchHeaders) {
          const response = await fetch(url, headers)
          if (response.status === 200) {
            return response.json()
          } else {
            if (retries < 3) {
              retries++
              return await fetchRecursive(url, retries, headers)
            } else {
              return {}
            }
          }
        }
        const shop = props.storeShop
        function getUrlToFetch(pageNumber, prodProps = props, pageShop = shop){
          let {productId, name, sku, apiKey} = props
          const url = `https://stamped.io/api/widget/questions?productId=${productId}&productSKU=${sku}&productTitle=${name}&page=${pageNumber}&apiKey=${apiKey}&storeUrl=${shop}&take=100`
          return url
        }  
        
        const urlToFetch = getUrlToFetch(1)
        console.log(urlToFetch)
        const json = await fetchRecursive(urlToFetch)
        if (json?.result && json?.count == 0){
          return {
            fetchStatus: 200,
            count: 0,
            reviews: []
          }
        }
        function getReviewsFromDoc(doc){
          return Array.from(doc.querySelectorAll('.stamped-review'))
          ?.map(e=>{
            console.log(e)
            return{
              question:{
                content:e.querySelector(`.stamped-review-content .stamped-review-content-body [style*="white-space"]`)?.textContent||"",
                date:e.querySelector(".stamped-review-header .created")?.textContent??"",
                userName:e.querySelector(".stamped-review-header .author")?.textContent??""
              },
              answer:{
                content:e.querySelector(`.stamped-review-reply [style*="white-space"]`)?.textContent||"",
                date:e.querySelector(".stamped-review-reply .created")?.textContent??"",
                userName:e.querySelector(".stamped-review-reply [data-author]").getAttribute("data-author")??""
              }
            }
          })
        }
        async function getAllReviews(promisesArr){
          try{
              const res = await Promise.all(promisesArr)
              const jsons = await Promise.all(res.map(response => response.json()))
              return jsons?.map(e => {
                const widHtml = e.result
                const parser = new DOMParser()
                const stampedDoc = parser.parseFromString(widHtml, 'text/html')
                return getReviewsFromDoc(stampedDoc) || []
              })
          }catch(e){
              return []
          }
        }
        
        const { t:count } = json 
        const htmlText = json?.result
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
        console.log(reviewsToReturn)
        return reviewsToReturn
      }, props)
      return reviews
    }catch(e){
      console.log(e)
      return []
    }
  }

  const reviews = await getReviews()
    extractorsDataObj.customData.qya = reviews
}