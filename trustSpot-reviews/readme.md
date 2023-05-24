
# TrustSpot Reviews Extractor (RPP)


## Sites de ejemplo:

 - https://www.madamglam.com/

## Modo de uso

Para utilizar este extractor, se requiere:

1. Utilizar un "genericExtractor" de reviews y completar los selectores solicitados como si fuéramos a utilizarlos. (puedes copiar y pegar los que estan en el archivo TrustSpot-reviews-rpp.js si es que son los mismos.)

2. Verificar la existencia de: ```window.trustspotWidgetMethods```

3. Verificar los selectores colocados en el código, o configurar los correctos.

![Selectors](https://imgtr.ee/images/2023/05/24/wTM6Q.png)


4. Buscar el endpoint de trustpot para obtener la trustSpotKey (Ir a Red - Buscar el endpoint de TrustSpot en las peticiones "Fetch/XHR" - Seleccionar la request encontrada - en el panel de la derecha seleccionar "Carga util" y copiar el atributo "key")

![Truspot key](https://imgtr.ee/images/2023/05/24/wT2kn.png)

5. Colocar el sitio que estamos trabajando en el formato que muestra el código JS y cambiar la key encontrada.

![Truspot key and origin](https://imgtr.ee/images/2023/05/24/wTOFR.png)



#### Listoooooo

Verifica que se estén extrayendo las reviews.



### NOTAS IMPORTANTES


Esta funcion solo modifica el array de ```items``` de las reviews, por lo que:

 **ES IMPORTANTE PRIMERO CONFIGURAR EL EXTRACTOR GENÉRICO** 
 
para que éste genere todo el objeto de las reviews con el overall rating y todo eso y nosotros solo agreguemos las reviews que conseguimos del endpoint :D

Cualquier duda o mejora me dicen guap@s.

****ATTE: Ozqui****




