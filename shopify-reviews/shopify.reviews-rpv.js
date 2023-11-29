async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    // ############################################
    // >> add this custom function in a perVariant custom 
    // >> activate the disable-web-security option in navigation options.
    // ############################################
   
    const { id } = extractorsDataObj.customData
    const { origin } = new URL(extractorsDataObj.pageData.url)
  
    const config = {
      id, origin
    }
    try{ 
      const reviews = await page.evaluate(async(config) => {
        const shopText = document.querySelector('[src*="shop="][src*="myshopify.com"]')?.src?.match(/(?<=shop=).*myshopify\.com/gm)?.[0] || ''
        const shop = window?.Shopify?.shop || shopText
        let hasReviews = true
        let pagination = 1
        const items = []
        while(hasReviews){
          const urlToFetch = getReviewsUrl(pagination)
          const res = await fetch(urlToFetch, {
            headers: {
              'content-security-policy': `default-src https: 'self'; font-src https: data: 'self'; frame-ancestors https: ${shop} admin.shopify.com; img-src https: data: 'self'; object-src 'none'; script-src https: 'unsafe-eval' 'strict-dynamic'; style-src https: 'unsafe-inline'; upgrade-insecure-requests`,
            },
            'referrer-policy': 'origin-when-cross-origin',
            referer: `${config.origin}/`,
            method: 'GET',
            mode: 'cors'
          })
          const textData = res.status == 200 ? await res.text() : ''
          const stringJson = textData?.match(/(?<=\()([\s\S]+)(?=\))/gm)?.[0] || '{}'
          const json = JSON.parse(stringJson)
          const reviewsDocu = createDocument(json.reviews)
          const reviewObjects = Array.from(reviewsDocu.querySelectorAll('body > .spr-review'))?.map(node => items.push(getReviewObj(node))) || []
          hasReviews = reviewObjects?.length > 0 ? true : false
          pagination++
        }
        
        function getReviewObj(node){
          const title = getTextContent(node, '.spr-review-header .spr-review-header-title')
          const userName = getTextContent(node, '.spr-review-header-byline > strong')
          const date = getTextContent(node, '.spr-review-header-byline > strong ~ strong')
          const content = getTextContent(node, '.spr-review-content-body')
          const stars = Array.from(node.querySelectorAll('i[class="spr-icon spr-icon-star"]'))?.length || 0
          return {
            content,
            title,
            date,
            userName,
            rating: {
              value: Number(stars),
              max: '5',
              type: 'stars'
            }
          }
        }
        function getReviewsUrl(page){
          return `https://productreviews.shopifycdn.com/proxy/v4/reviews?callback=paginateCallback${config.id}&page=${page}&product_id=${config.id}&shop=${shop}`
        }
        function getTextContent(doc, selector){
          return doc.querySelector(selector)?.textContent?.trim() || ''
        }
        function createDocument(html){
          html = html?.length ? html : ''
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          return doc
        }
        const totalRating = items?.map(e => e?.rating?.value)?.reduce((a, b) => a + b, 0)
        const averageRating = items?.length ? totalRating / items?.length : 0
        const reviewsToReturn = {
          "overallRating": {
            "value": Number(averageRating)?.toFixed(1),
            "max": "5",
            "type": "stars"
          },
          "items": items
        }
        return items?.length > 0 ? reviewsToReturn : {}
      }, config)
      extractorsDataObj.customData.reviews = reviews
    }catch(e){}
}