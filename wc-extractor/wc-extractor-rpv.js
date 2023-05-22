async (fnParams, page, extractorsDataObj, {_, Errors})=> {
            //Enter 0 to sort the reviews in ascending order, and 1 for descending order
              let reverse = 1

              const dataToFetch = await page.evaluate((link)=>{
                let reviewCountText = document.querySelector(".wc_review_count_text");
                let reviewCount = reviewCountText ? Number(reviewCountText.textContent.match(/\d+/g)?.[0]) : 0;
                let referrer = `${new URL(link).origin}/`
                let shop = Shopify.shop
                let productHandle = new URL(link).pathname.split("/").filter(e=>e)[1]
                let productId = __st.rid
                return {
                  referrer,
                  shop,
                  productHandle,
                  productId,
                  link,
                  reviewCount
                }
              }, extractorsDataObj.pageData.url)

              let items = await page.evaluate(async(dataToFetch)=>{
                let {referrer,shop,productHandle,productId,link,reviewCount} = dataToFetch
                let page = 0
                const reviewFetch = async(referrer,shop,productHandle,productId,link,page) =>{
                  let webFetch = await fetch("https://thimatic-apps.com/product_review/get_product_review_filter.php", {
                    "headers": {
                      "accept": "text/html, */*; q=0.01",
                      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "cross-site"
                    },
                    "referrer": referrer,
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": `shop=${shop}&product_handle=${productHandle}&product_id=${productId}&limit=${page}&page_url=${link}&filter=pictures-first&rating_val=&load_more=wc_load_more`,
                    "method": "POST",
                    "mode": "cors",
                    "credentials": "omit"
                  });
                  let webText = await webFetch.text()
                  const parser = new DOMParser()
                  let web = parser.parseFromString(webText, 'text/html');

                  let reviews = [...web.querySelectorAll(".wc_review_grid_item")].map(item=>{
                    return {
                      content: item?.querySelector(`[itemprop="description"]`)?.textContent.trim(),
                      title: item?.querySelector(".wc_review_boby_title")?.textContent,
                      date: item?.querySelector(".wc_review_date")?.textContent,
                      userName: item?.querySelector(".wc_review_author_name")?.textContent,
                      rating: {
                        value: Number(item?.querySelectorAll(".wc_grid_str .wc_icon_color:not(.wc_icon_empty)")?.length),
                        max: '5',
                        type:'stars',
                      }
                    }
                  })
                  return reviews
                }

                let reviews = []
                while(reviewCount>0){
                  let reviewsInWhile = await reviewFetch(referrer,shop,productHandle,productId,link,page)
                  reviews.push(reviewsInWhile)
                  reviewCount-=(reviewsInWhile).length
                  page++
                }
                return [].concat(...reviews).reverse()
              },dataToFetch)
              let reviews = {"overallRating": {
                "value": Number(averageRating)?.toFixed(1),
                 "max": "5",
                  "type": "stars"
               },
              "items": items
            }

            extractorsDataObj.customData.reviews = reverse?reviews:reviews.reverse()
          }
        }