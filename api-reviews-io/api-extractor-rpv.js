async (fnParams, page, extractorsDataObj, {_, Errors})=> {
  // this custom has to be place in perVariant function custom
  // the store variable is the only one thing you have to change
    let variants = extractorsDataObj.customData.variants
    const skuArray = variants.map(item => item.sku);
    const idArray = variants.map(item => item.id);
    const concatenatedString = [...skuArray, ...idArray].join('%3B');

    let items = await page.evaluate(async(concatenatedString)=>{
      const store = 'beauty-bakerie' //change this store variable
        let reviewsTotal = Number(document.querySelector("div .ruk-rating-snippet-count")?.textContent.match(/\d+/)?.[0]|0)
        let urlToFetch = `https://api.reviews.io/timeline/data?type=product_review&store=${store}&sort=date_desc&page=1&per_page=${reviewsTotal}&sku=${concatenatedString}&lang=en&enable_avatars=true&include_subrating_breakdown=1`
        let response = await fetch(urlToFetch)
        let data = await response.json() 
        let items = data.timeline.map(e => {
          return{
              content:e._source.comments,
              title:e._source.product_name,
              date:e._source.date_created?.split(" ")[0]??"",
              userName:e._source.author,
              rating:{
                value:e._source?.rating|0,
                max:"5",
                type:'stars',
              }
          }
      })
      return items
    },concatenatedString)
    const sumRatingValues = items.reduce((sum, review) => sum + review.rating.value, 0);
    const averageRating = sumRatingValues / items.length;
    let reviews = {"overallRating": {
      "value": Number(averageRating)?.toFixed(1),
       "max": "5",
        "type": "stars"
     },
    "items": items
  }
  if (reviews?.items?.length){
    extractorsDataObj.customData.reviews = reviews
  }

}