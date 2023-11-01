async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    try {
        let title = extractorsDataObj.customData.title
        let id = extractorsDataObj.customData.id
      let { tables } = await page?.evaluate(async (title,id) => {
        let productId = 
        window?.__st?.rid ||
        window?.meta?.product?.id ||
        window?.sswApp?.product?.id ||
        window?.ShopifyAnalytics?.meta?.page?.resourceId ||
        id ||
        ''; // Esto es solo para pruebas en una herramienta de scraping

        let shopDomain = 
        window?.Shopify?.shop   ||  
        'apollomoda.myshopify.com'


        const response = await fetch(`https://app.kiwisizing.com/api/getSizingChart?shop=${shopDomain}&product=${productId}&title=${title.replace(/\s+/g,"%20")}`)
        console.log(`https://app.kiwisizing.com/api/getSizingChart?shop=${shopDomain}&product=${productId}&title=${title.replace(/\s+/g,"%20")}`)
        const tablesWithInfo = await response.json()
        return {
          tables: tablesWithInfo,
        };
      },title,id);
      let data = {}
      console.log(tables)
  
      const tablesToParse = tables?.sizings?.map(e => Object.values(e?.tables)?.map(e => e))?.flat()
      console.log(tablesToParse)
      const sizeChart = {
          ...data,
          output: tablesToParse?.map((o) => {
            const data = o.data
            const headers = data?.shift()?.map(e => e?.value)
            headers?.shift()
            const measurements = data?.map(e => e?.filter(a => a?.type === 'header')?.map(e => e?.value)?.[0])
            const values = data?.map(e => e?.filter(a => a?.type !== 'header')?.map(e => e?.value))
            
            return {
              sizes: headers.map((header, index) => {
                let valueConvertion;
                return {
                  ["label"]: header,
                  ["measurements"]: measurements.map((measurement, indexM) => {
                    valueConvertion = values[indexM][index];
                    return {
                      measurement,
                      [`min_size_float`]: values[indexM][index],
                    };
                  }),
                  conversions: [],
                };
              }),
            };
          }),
        };
      if(sizeChart.length)extractorsDataObj.customData.sizeChart = sizeChart
    } catch (e) {
      console.log(e)
    }
  }