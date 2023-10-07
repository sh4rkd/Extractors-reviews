async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    //*** in the reviews extractor in extension add a custom strategy and add the path: reviews ***
     
    // this custom function should be added in a perVariant custom function.

    // these are the one thing(apiKey) you should find for your site
    // example of url where this data was obtained (you should find it in the Network tab):
    // https://api.yotpo.com/products/WtcdrDlLuRTanxcSXiWnX4V4zjyFnhTR7PqIcZmA/5107590594695/questions?page=1
    // example site: https://www.shopbala.com/products/bala-bars?weight=3-lb&color=sage
    const apiKey = 'WtcdrDlLuRTanxcSXiWnX4V4zjyFnhTR7PqIcZmA'
    
    
    const { id } = extractorsDataObj.customData
    try{
        const questions = await page.evaluate(async(apiKey, id) => {
            const fetchHeaders = {
                method: 'GET',
                mode: 'cors'
            }
            async function fetchQAs(url, headers = fetchHeaders){
                try{
                    const res = await fetch(url, headers)
                    const json = res.status == 200 ? await res.json() : {}
                    return json
                }catch(e){
                    return {}
                }
            }
            function getQA(QAobj){
                const {
                    content: question,
                    created_at: questionDate
                } = QAobj
                const answerObj = QAobj?.sorted_public_answers?.[0] || {}
                const {
                    content: answer,
                    created_at: answerDate
                } = answerObj
                return {
                    question:{
                      content: question?.trim() || '',
                      date: questionDate?.trim() || '',
                      userName: QAobj?.asker?.display_name?.trim() || ''
                    },
                    answer:{
                      content: answer?.trim() || '',
                      date: answerDate?.trim() || '',
                      userName: answerObj?.answerer?.display_name?.trim() || ''
                    }
                  }
            }
            function getUrlToFetch(page){
                return `https://api.yotpo.com/products/${apiKey}/${id}/questions?page=${page}`
            }

            const firstUrlToFetch = getUrlToFetch(1)
            const firstData = await fetchQAs(firstUrlToFetch)
            const totalQuestions = firstData?.response?.total_questions || 0
            if (!totalQuestions) return {}

            let items = firstData?.response?.questions?.map(e => getQA(e)) || []
            const perPage = firstData?.response?.per_page
            const totalOfRequests = Math.ceil(totalQuestions / perPage)
            for (let i = 1; i < totalOfRequests; i++){
                const newUrlToFetch = getUrlToFetch(i + 1)
                const resData = await fetchQAs(newUrlToFetch)
                const moreQuestions = resData?.response?.questions?.map(e => getQA(e)) || []
                items = [...items, ...moreQuestions]
            }
            return items

        }, apiKey, id)
        if (questions?.length){
            extractorsDataObj.customData.questions = questions
        }
    }catch(e){
        console.log(e)
    }
}