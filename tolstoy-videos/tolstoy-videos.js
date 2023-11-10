async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    try{
      let videos = await page.evaluate(async(id)=>{
        let productId = 
        window?.__st?.rid ||
        window?.meta?.product?.id ||
        window?.sswApp?.product?.id ||
        window?.ShopifyAnalytics?.meta?.page?.resourceId ||
        id ||
        ''; // Esto es solo para pruebas en una herramienta de scraping

        let publishIdfromDocument = document.querySelector(`.tolstoy-stories[data-publish-id][data-product-id]`)?.getAttribute("data-publish-id") 
        let publishId = 
        publishIdfromDocument   ||
        "tnxvorl7kwe6t"//change it

        let appKeyfromDocument = document.querySelector(`script[data-app-key]`)?.getAttribute("data-app-key")
        let appKey = 
        appKeyfromDocument  ||
        "d3da1290-6370-468b-b18e-331d26130b78"//change it

        let shop = 
        window.Shopify.shop ||
        "humankind-swim.myshopify.com"//change it

        let data = await fetch(`https://api.gotolstoy.com/settings/product/${productId}?tolstoyViewers=%7B%22psoa74p787xx2%22%3A%7B%22impressionCount%22%3A3%2C%22playCount%22%3A0%7D%2C%22undefined%22%3A%7B%22impressionCount%22%3A29%2C%22playCount%22%3A0%7D%2C%22abTest%22%3A%7B%7D%7D&defaultPublishId=${publishId}&widgetType=stories&appKey=${appKey}&tags=&appUrl=${shop}`)
        let jsdonData = await data.json()
        let videos = jsdonData.storiesEmbed.storiesSteps.map(e=>e?.stockAsset?.videoUrl)
        return videos
      },extractorsDataObj.customData.id)
      if (videos.length) {
        extractorsDataObj.customData.videos = videos
      }
    }catch(e){
      console.log(e)
    }
}