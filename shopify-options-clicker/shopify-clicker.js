async (fnParams, page, extractorsDataObj, {_, Errors})=> {
    /**
     * this custom has to be added in a perVariant custom function
     */
    
     /**
      * elementsToMatch and elementsToClick MUST select the same amount of elements
      */
    const config = {
        elementsToMatch: 'div [role="radiogroup"] [for*="option"] input',
        elementsToClick: 'div [role="radiogroup"] [for*="option"] input + label',
        matchWith: 'attribute', // | textContent
        timeout: 3000 //time(in ms) of every click
    }

    await clickVariantOptions(config) 
 
    async function clickVariantOptions(config){
        try{
            const variantOptions = extractorsDataObj.customData.variantData.options
            ?.map(o => o?.toLowerCase()) || []
            await page.evaluate(async(config, variantOptions) => {
                const indexArr = []
                getArray(config.elementsToMatch)
                ?.filter((pdpOption, index) => {
                    return variantOptions?.find(variantOption => {
                        if (config.matchWith == 'attribute'){
                            const attributeValues = getAttributeValues(pdpOption)
                            const bool = attributeValues?.some(attVal => attVal == variantOption)
                            if (bool){
                                indexArr.push(index)
                            }
                            return bool
                        } else if (config.matchWith == 'textContent'){
                            const text = pdpOption?.textContent?.toLowerCase()?.trim()
                            const bool = text == variantOption
                            if (bool){
                                indexArr.push(index)
                            }
                            return bool
                        } else {
                            return false
                        }
                    })
                })
                const optionsToClick = getArray(config.elementsToClick)
                ?.filter((_, i) => indexArr?.includes(i))

                for (let i = 0; i < optionsToClick?.length; i++){
                    optionsToClick[i]?.click()
                    await new Promise(r => setTimeout(r, config.timeout))
                }

                function getArray(selector){
                    return Array.from(document.querySelectorAll(selector)) || []
                }
                function getAttributeValues(element){
                    const attributeNames = element?.getAttributeNames() || []
                    const attributeValues = attributeNames?.map(att => element?.getAttribute(att)?.toLowerCase()) || []
                    return attributeValues
                }
            }, config, variantOptions)
        }catch(e){}
    }
}