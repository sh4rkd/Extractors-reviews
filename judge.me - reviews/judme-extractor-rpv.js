async (fnParams, page, extractorsDataObj, { _, Errors }) => {
    try{
        let itemGroupId = extractorsDataObj.customData.id
        let items = await page.evaluate(async(itemGroupId)=>{
            const fetchData = async (originalUrl) => {
                try {
                    const urlObject = new URL(originalUrl);
                    const urlWithoutQuery = urlObject.origin + urlObject.pathname;
                    const response = await fetch(urlWithoutQuery + ".js");
                    console.log(response)
                    const data = await response.json();
                    return data.id;
                } catch (error) {
                }
            }

            let domain = 
            window?.SHOPIFY_PERMANENT_DOMAIN    ||
            "butterlordz.myshopify.com" //change if you need it!!
            
            let shopDomain = 
            window?.Shopify?.shop   ||  
            "butterlordz.myshopify.com" //change if you need it!!
    
            let platform = 
            window?.jdgmSettings?.platform  ||
            "shopify"   //change if you need it!!
    
            let perPage = "10"
    
            let productId =
            window?.__st?.rid ||
            window?.meta?.product?.id ||
            window?.sswApp?.product?.id ||
            window?.ShopifyAnalytics?.meta?.page?.resourceId ||
            itemGroupId ||
            await fetchData(url)    ||
            ''; // Esto es solo para pruebas en una herramienta de scraping
    
            let generateLinksPerReview = ((domain, shopDomain, platform, totalPage, perPage, productId)=>{
                let linksPerReview = []
                for(let i=1;i<=totalPage;i++){
                    linksPerReview.push(`https://judge.me/reviews/reviews_for_widget?url=${domain}&shop_domain=${shopDomain}&platform=${platform}&page=${i}&per_page=${perPage}&product_id=${productId}`)
                }
                return linksPerReview
            })
    
            let review = (async(link)=>{
                let dataFetch = await fetch(link)
                let data = await dataFetch.json()
                let text = data.html
                let totalCount = data.total_count
                const parser = new DOMParser();
                const html = parser.parseFromString(text, 'text/html');
                let reviews = [...html.querySelectorAll(".jdgm-rev")].map(item => {
                    let unformatedDate = item?.querySelector(".jdgm-rev__timestamp")?.textContent ||  item?.querySelector(".jdgm-rev__timestamp")?.getAttribute("data-content").trim() || ""
                    const date = new Date(unformatedDate)
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Remember to add 1 to the month because months start at 0!
                    const year = date.getFullYear().toString().slice(2, 4); // Get the last two digits of the year

                    // Format the date as "MM/DD/YY"
                    const formattedDate = `${month}/${day}/${year}`;          
                    return {
                      content: item?.querySelector(`.jdgm-rev__body`)?.textContent.trim()|| "" ,
                      title: item?.querySelector(".jdgm-rev__title")?.textContent.trim() || "",
                      date: formattedDate,
                      userName: item?.querySelector(".jdgm-rev__author")?.textContent.trim() || "",
                      rating: {
                        value: Number([...item.querySelectorAll(".jdgm-rev__header .jdgm-rev__rating .jdgm--on")]?.length||0),
                        max: '5',
                        type: 'stars',
                      }
                    };
                  }
                );
                return {reviews,totalCount}      
            })
    
            let firstFetch = generateLinksPerReview(domain, shopDomain, platform, 1, perPage, productId)[0]
            firstFetch = await review(firstFetch)
            //firstFetch.totalCount
            let totalCount = Math.round(firstFetch.totalCount/10)+1
    
            let allLinksToFetch = generateLinksPerReview(domain, shopDomain, platform, totalCount, perPage, productId)
    
            let allReviews = await Promise.all(allLinksToFetch.map(async(link) => await review(link)));
            return allReviews
        },itemGroupId)
    
        items = [...items.map(item => item.reviews)].flat();

        const sumRatingValues = items.reduce((sum, review) => sum + review.rating.value, 0);
        const averageRating = sumRatingValues / items.length;

        const roundedAverageRating = Number(averageRating.toFixed(1));

        const reviews = {
            "overallRating": {
                "value": roundedAverageRating,
                "max": "5",
                "type": "stars"
            },
            "items": items
        };

        if (reviews?.items?.length){
            extractorsDataObj.customData.reviews = reviews
        }
    }catch{}
}
