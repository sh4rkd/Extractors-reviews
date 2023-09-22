async (data, { input, config }, { _, Errors }) => {
  try {
    let { tables } = await input?.page?.evaluate(() => {
      //Example page: 'https://www.rvca.com/easy-to-love-french-bikini-bottoms-AVJX400205.html?dwvar_AVJX400205_color=crl&dwvar_AVJX400205_size=l'
      //-------------------------------------------------------------------------------------------------------------------------------------------------------
      //--------------------------------------------------------------------------------------------------------------------------------------------------------
      //--------------------------------------------------------------------------------------------------------------------------------------------------------
      //--------------------->This is the only thing you have to change
      const selectors = {
        tables: ".tb_pr_desc table", //Selector of all tables do you want to extract
        headers: "tr:first-child td", //Selector of the columns values to put as headers
        measurements: "tr:not(:first-child) td:first-child", //Selector of each first value of every row
        rowValues: "tbody tr:not(:first-child)", //Selector of each row excluding the row of the headers
        values: "td:not(:first-child)", //Selector of each value of the row without the first value
        rawData: "__Selector__", //Selector of the entire table
        name: "__Selector__", //Selector of the title
      };
      //--------------------------------------------------------------------------------------------------------------------------------------------------------
      //--------------------------------------------------------------------------------------------------------------------------------------------------------
      //--------------------------------------------------------------------------------------------------------------------------------------------------------
      //Get the values of the columns
      const tables = Array.from(
        new Set([
          ...Array.from(document.querySelectorAll(`${selectors?.tables}`)),
        ])
      );
      if (!tables?.length) {
        return [];
      }
      const tablesWithInfo = [];
      for (const table of tables) {
        console.log(
          table,
          Array.from(table.querySelectorAll(`${selectors?.headers}`))
        );
        const headers = Array.from(
          new Set([
            ...Array.from(
              table.querySelectorAll(`${selectors?.headers}`),
              (th) => th?.textContent?.trim()
            ),
          ])
        );
        console.log(headers);
        headers.shift();
        //Get the values of the first value of the row('title')
        const measurements = Array.from(
          table.querySelectorAll(`${selectors?.measurements}`),
          (m) => {
            const small = m?.querySelector("small");
            if (small) {
              const aux = small.textContent;
              console.log(small);
              small.textContent = ` ${aux}`;
              console.log(small);
            }
            return m?.textContent?.trim();
          }
        );
        //Get the values of table excluding the headers and 'titles'
        const values = Array.from(
          table.querySelectorAll(`${selectors?.rowValues}`),
          (m) =>
            Array.from(m.querySelectorAll(`${selectors?.values}`), (e) => {
              const small = e?.querySelector("small");
              if (small) {
                const aux = small.textContent;
                console.log(small);
                small.textContent = ` ${aux}`;
                console.log(small);
              }
              return e?.textContent?.trim();
            })
        ).filter((e) => (e.length > 0 ? e : null));
        console.log(values, "values");
        if (values[0].length > headers.length) {
          headers.push(" ");
        }
        const rawData = table.querySelector(`${selectors?.rawData}`)?.outerHMTL;
        const name =
          table.querySelector(`${selectors?.name}`)?.textContent?.trim() || "";
        tablesWithInfo.push({ headers, measurements, values, rawData, name });
      }
      return {
        tables: tablesWithInfo,
      };
    });
    if (!tables?.length) {
      return [];
    }
    const repited = [];
    tables = tables
      ?.filter((e) => {
        if (!repited?.includes(e.name)) {
          repited?.push(e.name);
          return e;
        }
        return null;
      })
      ?.filter((e) => e);

    const sizeChart = {
      ...data,
      output: tables?.map((o) => {
        const { headers, measurements, values, name } = o;
        console.log(headers, measurements, values, name);
        return {
          name,
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
    return sizeChart;
  } catch (e) {
    console.log(e);
    return data;
  }
};
