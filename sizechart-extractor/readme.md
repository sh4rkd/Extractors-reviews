# SizeChart extractor por selectores

## Sites de ejemplo:

- https://topfoxx.com/products/charisma-lip-ring-gold
- https://www.rvca.com/easy-to-love-french-bikini-bottoms-AVJX400205.html?dwvar_AVJX400205_color=crl&dwvar_AVJX400205_size=l

## Cosas a tener en cuenta

Esta función es una postProcess de la estrategia de selector para lo cuál debe de ser configurada con un selector o dejarlo simplemente como "\_\_SELECTOR\_\_".
Si se requiere una modificación extra a la tabla haganmelo saber, este caso que pongo es el más general, pero me he encontrado casos donde debo modificar un poco el como extraigo la info por si llegan a haber casos así no más diganmelo y los ayudo a modificarla.

## Explicación

La función reconstruye a mano el formato con el que está configurado la estrategia de selector, pero solamente para que funcione se deben crear selectores específicos en el siguiente objeto:

```
selectores:  {
tables,
headers,
measurements,
rowValues,
values,
rawData?,
name?
}
```

[Ejemplo de que es cada selector](https://imgtr.ee/image/6bjnA)

**Tables**: Selector que ejecuta un 'querySelectorAll' por lo que si tenemos varias tablas, podemos poner todos los selectores aquí, si es que es la misma estructura en todas las tablas. Estos selectores son las tablas en general, si está bien estructurada con la semantica de html, el selector debe de ser hasta la etiqueta de "\<table\>" y si se necesita reconstruir como en el caso de abajo, el selector debe de ser padre de todos los elementos html donde esta la información a extraer.

**Headers**: Este selector se ejecuta sobre los resultados de tables, y también es un 'querySelectorAll', aquí se deben de extraer los valores de la primera fila, regularmente en la semantica de HTML vienen como 'th'.

**measurements**: vuelve a ejecutar sobre el resultado de tables, y al igual que los headers deben de ser los primeros valores pero ahora de la primera fila, excluyendo el primer resultado ya que ese debe de ser un header.

**rowValues**: Es un selector de todas las filas pero sin los headers y los measurements, pero extrayendolos de manera que el resultado sea una única fila.

**values**: El selector de values es para cada valor individual y se ejecuta sobre el resultado de rowValues

**rawData**: No es necesario para el funcionamiento pero en caso de que haya un tag de table aquí se pone el selector a esa table para que extraiga la info como outerHTML.

**name**: Aquí se pondría el caption de la table en dado caso de que haya un selector para este, si se deja en blanco o no encuentra el selector dado la table no tendra title, por lo que también es opcional este selector.

[Ejemplo de los selectores para extraer una tabla](https://snipboard.io/hH4zXT.jpg)
