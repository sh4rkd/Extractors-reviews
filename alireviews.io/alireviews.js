async (data, { input, config }, { _, Errors }) => {
    let reviews;
  
    try {
      reviews = await input.page.evaluate(async () => {
        const items = [];
  
        const getWidgetInfo = () => {
          if (document.querySelector('[id*="alireviews-block-"]')) {
            return {
              type: "block",
              widgetId: document.querySelector('[id*="alireviews-block-"] [data-section-id]')?.getAttribute('data-section-id')
            };
          }
          if (document.querySelector('[data-section-id][data-section-type*="widget-box"]')) {
            return {
              type: "widget-box",
              widgetId: document.querySelector('[data-section-id][data-section-type*="widget-box"]')?.getAttribute('data-section-id')
  
            };
  
          }
        };
  
        const fetchData = async (page, widgetInfo, shopId, productId) => {
          let url;
  
          if (widgetInfo.type === 'block') {
            url = `https://widget.alireviews.io/api/v1/widget/review-widget?shop_id=${shopId}&block_id=${widgetInfo?.widgetId}&type_page=product&product_id=${productId}&isAdminLogin=false&star=all&customer_id=&product_in_cart=&num_rand=0&total_order_values=0&avg_order_value=0&tag=&country=&last_purchase=&locale=en&widget_id=${widgetInfo?.widgetId}&type_widget=review_box&currentPage=${page}&sort_type=date&style=list`; // URL del widget 'block'
          } else if (widgetInfo.type === 'widget-box') {
            url = `https://widget.alireviews.io/api/v1/widget/review-widget?shop_id=${shopId}&widget_id=${widgetInfo?.widgetId}&type_page=product&product_id=${productId}&isAdminLogin=false&star=all&customer_id=&product_in_cart=&num_rand=0&total_order_values=0&avg_order_value=0&tag=&country=&last_purchase=&locale=en&type_widget=review_box&currentPage=${page}`;
          }
  
          const response = await fetch(url);
          return response.json();
        };
  
        const extractReviewData = (data) => {
          return data?.comments?.data?.map(element => {
            const date = new Date(element?.created_at)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return {
              userName: element?.author,
              content: element?.content,
              date: date,
              rating: {
                value: element?.star,
                max: '5',
                type: 'star'
              }
            };
          });
        };
  
        const getItems = async () => {
          const widgetInfo = getWidgetInfo();
          const shopId = window?.__AR_WIDGET_REVIEW_OBJECT?.shop_id;
          const productId = window?.meta?.product?.id;
  
          let overallRating = null;
  
          const firstPageData = await fetchData(1, widgetInfo, shopId, productId);
          if (firstPageData) {
            overallRating = {
              value: firstPageData?.avgStar,
              max: '5',
              type: 'stars'
            };
          
            items.push(...extractReviewData(firstPageData))
            let totalPages = firstPageData?.comments?.last_page;
            // Obtener el numero total de paginas y hacer los fetch restantes
            for (let page = 2; page <= totalPages; page++) {
              const pageData = await fetchData(page, widgetInfo, shopId, productId);
              items.push(...extractReviewData(pageData));
            }
            return {
              items,
              overallRating
            };
          };
  
        }
          return await getItems();
          
        })
    } catch (e) {
      console.error('Error extracting reviews:', e);
    }
  
    return reviews;
  }
  