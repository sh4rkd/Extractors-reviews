async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    // add this custom in a perVariant custom function
    const productTags = extractorsDataObj.customData.tags
    const { origin } = new URL(extractorsDataObj.pageData.url)
    try{   
        const sizechartData = await page.evaluate(async(productTags, origin) => { 
            const settings = document.querySelector('div .component-family[data-settings]')?.getAttribute('data-settings')
            const encodedObj = JSON.parse(settings)?.size_charts
            const sizeObj = JSON.parse(decodeURIComponent(encodedObj))
            const sizeChartHandler = sizeObj?.find(e => e?.tags?.find(tag => productTags?.find(ptg => ptg == tag)))?.page
            const sizeChartUrl = sizeChartHandler ? `${origin}/pages/${sizeChartHandler}?view=none` : ''
            const res = await fetch(sizeChartUrl, {method: 'GET', mode: 'cors'})
            const html = res.status == 200 ? await res.text() : ''
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, 'text/html')
            fixTableNumbers(doc)
            const tableNode = doc?.querySelector('table')
            const table = tableNode?.textContent?.trim() ? tableNode?.outerHTML?.trim() : ''
            const sizechartInfo = table ? doc?.querySelector('body')?.outerHTML?.replace(/<table([\s\S]+)<\/table>/gm, '')?.trim() : ''
            
            const image = doc.querySelector('body img[src]')?.src || ''
            function fixTableNumbers(doc){
                Array.from(doc.querySelectorAll('table td'))
                ?.filter(e => e?.textContent?.trim() != '00')
                ?.filter(e => !/[a-zA-Z]+/gmi.test(e?.textContent))
                ?.map(e => {
                    const textNumber = e?.textContent?.trim()
                    const integer = textNumber?.replace('⁄', '/')?.split(/\s/gm)?.[0]
                    const numberToDivide = textNumber?.replace('⁄', '/')?.split(/\s/gm)?.[1]?.split(/\//gm)?.map(e => Number(e))
                    const decimal = numberToDivide?.length == 2 ? numberToDivide[0] / numberToDivide[1] : 0
                    const measure = Number(integer) + decimal
                    if (isNaN(measure)){
                        e.textContent = textNumber
                    } else {
                        e.textContent = `${measure}`
                    }
                    return
                })
            }
           
            return table ? {
                table: {content: table, title: ''},
                info: sizechartInfo,
                image
            } : {}
        }, productTags, origin)
        extractorsDataObj.customData.sizechartData = sizechartData
    }catch(e){
        console.log(e)
    }
}