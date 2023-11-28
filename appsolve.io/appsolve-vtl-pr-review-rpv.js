//if the cors don't block us
async (fnParams, page, extractorsDataObj, {_, Errors}) => {
    let groupId = extractorsDataObj.customData.id
    let {url} = extractorsDataObj.pageData
    let domain = new URL(extractorsDataObj.pageData.url)?.origin
    const config = {
      groupId,
      url,
      domain
    }
    try {
        let pdpReviews = await page.evaluate(async (config) => {
            const {groupId:itemGroupId, url, domain} = config

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

            let productId =
            window?.__st?.rid ||
            window?.meta?.product?.id ||
            window?.sswApp?.product?.id ||
            window?.ShopifyAnalytics?.meta?.page?.resourceId ||
            itemGroupId ||
            await fetchData(url)    ||
            ''; // Esto es solo para pruebas en una herramienta de scraping

            let randomNumer = Math.round(Math.floor(Math.random() * (productId/2 - productId/4 + 1)) + productId/4)
            let urlAPI = `https://appsolve.io/api/reviews/${randomNumer}/${productId}.json`;
            async function getData(url) {
                try {
                    let response = await fetch(url, {
                    "headers": {
                        "accept": "*/*",
                        "accept-language": "es-419,es;q=0.9",
                        "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "cross-site"
                    },
                    "referrer": `${domain}/`,
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": null,
                    "method": "GET",
                    "mode": "cors",
                    "credentials": "omit"
                    });
                    let data = await response.json()
                    return data
                } catch(e) {
                    console.log('Fetch Error', e);
                }
            }
            let reviews = await getData(urlAPI)
            return reviews
        }, config)

        let reviews = {
            overallRating: {
                type: "stars",
                max: "5",
                value: `${pdpReviews.reviewStats.s}`
	        }
        }

        let items = pdpReviews.reviews.map(item => {
            return {
                userName: item.name,
                content: item.review,
                rating: {
                    type: "stars",
				    max: "5",
                    value: `${item.stars}`
                },
                date: item.date
            }
        })

        reviews.items = items

        extractorsDataObj.customData.customReviews = reviews

    } catch(e) {}   
}

//if the cors block us
async (fnParams, page, extractorsDataObj, { _, Errors }) => {
    let groupId = extractorsDataObj.customData.id;
    try {
      let pdpReviews = await page.evaluate(async (itemGroupId) => {
        let randomNumer = Math.round(Math.floor(Math.random() * (itemGroupId / 2 - itemGroupId / 4 + 1)) + itemGroupId / 4);
        let urlAPI = `https://appsolve.io/api/reviews/${randomNumer}/${itemGroupId}.json`;
  
        return new Promise((resolve, reject) => {
          let xhr = new XMLHttpRequest();
          xhr.open("GET", urlAPI, true);
          xhr.onload = function () {
            if (xhr.status === 200) {
              let data = JSON.parse(xhr.responseText);
              resolve(data);
            } else {
              reject(new Error(`XHR Request failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = function () {
            reject(new Error('XHR Request failed'));
          };
          xhr.send();
        });
      }, groupId);
  
      let reviews = {
        overallRating: {
          type: "stars",
          max: "5",
          value: `${pdpReviews.reviewStats.s}`,
        },
      };
  
      let items = pdpReviews.reviews.map((item) => {
        return {
          userName: item.name,
          content: item.review,
          rating: {
            type: "stars",
            max: "5",
            value: `${item.stars}`,
          },
          date: item.date,
        };
      });
  
      reviews.items = items;
  
      extractorsDataObj.customData.customReviews = reviews;
    } catch (e) {}
}
  