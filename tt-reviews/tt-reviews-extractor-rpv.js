async (fnParams, page, extractorsDataObj, {_, Errors})=> {
     //This is the ID needed for the API in case of https://www.mauijim.com/. 
     //It is custom changed if you need it.
    let id = extractorsDataObj.customData.customId||extractorsDataObj.customData.id||""//change it
    let items = await page.evaluate(async(id)=>{
        let shopId = "VY8HgCGz4l3Mth7site" //change it
        let countReviews = 0 //Number of reviews: if you put 0 reviews, take all the reviews.

        let fetchReviews = await fetch(`https://cdn-ws.turnto.com/v5/sitedata/${shopId}/${id}/d/review/en_US/0/${countReviews}/%7B%7D/RECENT/true/true/?`)
        let data = await fetchReviews.json()
        let items = data.reviews.map(e=>{
            return{
                content:e?.text||"",
                title:e?.title||"",
                date:e?.dateCreatedFormatted||"",
                userName:e?.user?.nickname||`${e?.user?.firstName} ${e?.user?.lastName}`,
                rating:{
                    value:e?.rating,
                    max:"5",
                    type:'stars',
                }
            }
        })
        return items  
    },id)
    
    const sumRatingValues = items.reduce((sum, review) => sum + review.rating.value, 0);
    const averageRating = sumRatingValues / items.length;
    let reviews = {
        "overallRating": {
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