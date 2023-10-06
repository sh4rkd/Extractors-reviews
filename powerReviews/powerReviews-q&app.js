async (data, {input, config}, {_, Errors}) => {
  // PowerReviews Questions Extractor (*** in the q&a extractor in extension add a custom post process function ***)
  
  // the powerreviews url can be found in Network tab in Dev Tools.
  // example of url where the attributes below were found
  // https://display.powerreviews.com/m/289446/l/en_US/product/${pid}/questions?apikey=4a3f85c4-b20b-4663-9b6d-d3daa031348b&_noconfig=true
  // example of site with this config: https://eva-nyc.com/

  // PowerReviews Questions Configuration including API key and Merchant ID
  const powerReviewsQuestionsConfig = {
      apiKey: '7ae4d048-cc91-44b8-9e7f-b226bc46d95d', // ** change this **
      merchantId: '521391717' // ** change this **
  }

  // Product ID (can be found in DOM or WindowObj)
  const pid = await input.page.evaluate(() => { 
      const productIdDOM = document.querySelector('[data-pr-page_id]')?.getAttribute('data-pr-page_id')?.trim() // ** change this **
      const productIdWindowObj = window.PRODUCT_ID?.replace(/prod/gmi, '')?.trim()
      return productIdWindowObj || productIdDOM
  })

  // This is where all the data is fetched
  const questionsAndAnswers = await input.page.evaluate(async(powerReviewsQuestionsConfig, pid)=>{
    const maxQnAsPerRequest = 10 //Maximun number of questions/requests allowed by powerReviews
    const fetchheaders = {
      hedaers: {
          'access-control-allow-credentials': 'true',
          'access-control-allow-origin': origin,
          'content-encoding': 'gzip',
          'content-type': 'application/json',
          'accept': '*/*',
      },
      origin,
      method: 'GET',
      mode: 'cors'
    }

    // Takes an array of fetch promises and handles multiple JSON responses
    async function getAllQnAs(promisesArr){
      try{
          const res = await Promise.all(promisesArr)
          const jsons = await Promise.all(res.map(response => response.json()))
          return jsons
      }catch(e){
          return []
      }
    }

    // Takes URL and headers to get the first API fetch which will help track the rest of the pages
    async function getData(url, headers = fetchheaders){
      try{
          const res = await fetch(url, headers)
          const json = res.status == 200 ? await res.json() : {}
          return {
            json,
            status: res.status
          }
      } catch(e){
          return {
            json: {},
            status: 404
          }
      }
    }

    // Takes fetch data from promises and returns an object including QnA information
    function getQnAs(data){
      const { details, answer } = data

      // convert-epoch-to-dd-mm-yyyy
      let questionDate = new Date(Math.round(Number(details?.created_date)))
      let answerDate = new Date(Math.round(Number(answer[0]?.details?.created_date)))

      return {
        question:{
          content: details?.text??"",
          date: questionDate.getFullYear()+"-"+(("0" + (questionDate.getMonth() + 1)).slice(-2))+"-"+(("0" + questionDate.getDate()).slice(-2)),
          userName: details?.nickname??""
        },
        answer:{
          content: answer[0]?.details?.text??"",
          date: answerDate.getFullYear()+"-"+(("0" + (answerDate.getMonth() + 1)).slice(-2))+"-"+(("0" + answerDate.getDate()).slice(-2)),
          userName: answer[0]?.details?.nickname??""
        }
      }
    }

    try {
      const urlToFetch = `https://display.powerreviews.com/m/${powerReviewsQuestionsConfig.merchantId}/l/en_US/product/${pid}/questions?_noconfig=true&apikey=${powerReviewsQuestionsConfig.apiKey}`
      const {json, status} = await getData(urlToFetch) // First Fetch

      if (status !== 200){
        return {
          items: [],
          urlToFetch,
          json,
          status,
        }
      }

      const totalQnAs = json.paging['total_results'] // Total q&a results
      const totalRequests = Math.ceil(totalQnAs / maxQnAsPerRequest) // Calculates total q&a's and max per request for paging
      const promises = []
      
      for (let i = 0; i < totalRequests; i++){
        promises.push(fetch(`https://display.powerreviews.com/m/${powerReviewsQuestionsConfig.merchantId}/l/en_US/product/${pid}/questions?paging.from=${i * maxQnAsPerRequest}&paging.size=${maxQnAsPerRequest}&filters=&search=&sort=Newest&image_only=false&page_locale=en_US&_noconfig=true&apikey=${powerReviewsQuestionsConfig.apiKey}`, fetchheaders))
      }

      // Fetch all data from all the pages
      let returnData = []
      const allFetchQnAs = await getAllQnAs(promises)
      allFetchQnAs.map(qna => {
          returnData = [...returnData, ...qna?.results?.map(e => getQnAs(e))]
      })

      return returnData

    } catch(err) { return { items: []}}
  }, powerReviewsQuestionsConfig, pid)
  
  return questionsAndAnswers?.length > 0 ?  questionsAndAnswers : data
}