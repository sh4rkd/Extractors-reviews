async (fnParams, page, extractorsDataObj, {_, Errors})=> {

    const config = {
        optionsSelector: 'div [role="radiogroup"] label[for*="option"] + div button',//add selectors to get all PDP options
        matchWith: 'attribute', // | textContent
        timeout: 3000 //time(in ms) of every click
    }

    await clickVariantOptions(config) 
 
    async function clickVariantOptions(config){
        try{
            const variantOptions = extractorsDataObj.customData.variantData.options || []
            await page.evaluate(async(config, variantOptions) => {
                const optionsToClick = Array.from(document.querySelectorAll(config.optionsSelector))
                ?.filter(pdpOption => variantOptions?.find(variantOption => {
                    if (config.matchWith == 'attribute'){
                        const attributeNames = pdpOption?.getAttributeNames() || []
                        const attributeValues = attributeNames?.map(att => pdpOption?.getAttribute(att)?.toLowerCase()) || []
                        return attributeValues?.some(attVal => attVal == variantOption?.toLowerCase())
                    } else if (config.matchWith == 'textContent'){
                        const text = pdpOption?.textContent?.toLowerCase()?.trim()
                        return text == variantOption?.toLowerCase()
                    } else {
                        return false
                    }
                }))
                
                for (let i = 0; i < optionsToClick?.length; i++){
                    optionsToClick[i]?.click()
                    await new Promise(r => setTimeout(r, config.timeout))
                }
            }, config, variantOptions)
        }catch(e){}
    }
}