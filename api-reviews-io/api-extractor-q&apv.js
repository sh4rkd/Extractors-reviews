async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    let variants = extractorsDataObj.customData.variants
    const skuArray = variants.map(item => item.sku);
    const idArray = variants.map(item => item.id);
    const concatenatedString = [...skuArray, ...idArray].join('%3B');
    let questionsAndAnswers = await page.evaluate(async(concatenatedString)=>{
      const store = 'komuso-design' //change this store variable
      let urlToFetch = `https://api.reviews.io/questions?store=${store}&grouping_hash=${concatenatedString}&page=1&per_page=8`
      let response = await fetch(urlToFetch)
      let data = await response.json()
      if(data.total>8){
        urlToFetch = `https://api.reviews.io/questions?store=${store}&grouping_hash=${concatenatedString}&page=1&per_page=${data.total}`
        response = await fetch(urlToFetch)
        data = await response.json()
      }
      let questionsAndAnswers = data.data.map(e=>{
        return{
          question:{
            content:e?.question??"",
            date:e?.date_created?.split(" ")[0]??"",
            userName:e?.name??""
          },
          answer:{
            content:e?.responses[0]?.answer??"",
            date:e?.responses[0]?.date_created?.split(" ")[0]??"",
            userName:e?.responses[0]?.name??""
          }
        }
      })
      return questionsAndAnswers
    },concatenatedString)
    extractorsDataObj.customData.questionsAndAnswers = questionsAndAnswers
  }