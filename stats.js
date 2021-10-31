function quantile(arr, q) {
  const sorted = arr.sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (sorted[base + 1] !== undefined) {
    return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
  } else {
    return Math.floor(sorted[base]);
  }
}

function prepareData(result) {
  return result.data.map((item) => {
    item.date = item.timestamp.split("T")[0];

    return item;
  });
}

// показывает значение метрики за несколько деней
function showMetricByPeriod(data, page, name, startDate, endDate) {
  const sampleData = data
    .filter(
      (item) =>
        item.page == page &&
        item.name == name &&
        item.date >= startDate &&
        item.date <= endDate
    )
    .map((item) => item.value);

  if (sampleData.length) {
    const result = {};

    result.hits = sampleData.length;
    result.p25 = quantile(sampleData, 0.25) || 0;
    result.p50 = quantile(sampleData, 0.5) || 0;
    result.p75 = quantile(sampleData, 0.75) || 0;
    result.p95 = quantile(sampleData, 0.95) || 0;

    console.log(`All metrics from ${startDate} to ${endDate}:`);
    console.table(result);
  } else {
    console.error(
      `There is no information about metrics from ${startDate} to ${endDate}`
    );
  }
}

// показывает сессию пользователя
function showSession(data, page, requestId) {
  const sessionData = data.filter(
    (item) => item.requestId == requestId && item.page == page
  );

  if (sessionData.length) {
    const { browser, platform, env } = sessionData[0].additional;
    const { date } = sessionData[0];
    const result = {
      browser,
      env,
      platform,
      date,
      hits: sessionData.length,
    };
    sessionData.map((item) => {
      const { name, value } = item;
      if (!result[name]) result[name] = value;
    });

    console.log(`All metrics for session id ${requestId}:`);
    console.table(result);
  } else {
    console.error(`There is no information about session id '${requestId}'`);
  }
}

// сравнивает метрику в разных срезах
function compareMetricByPrameter(data, page, name, paramName) {
  const paramsData = {};
  const filteredData = data.filter(
    (item) => item.page == page && item.name == name
  );

  filteredData.forEach((item) => {
    const paramVal = item.additional[paramName];
    if (paramsData[paramVal]) paramsData[paramVal].push(item.value);
    else paramsData[paramVal] = [item.value];
  });

  const result = {};

  for (key in paramsData) {
    if (paramsData[key].length) {
      const values = paramsData[key];
      result[key] = {
        hits: values.length,
        p25: quantile(values, 0.25) || 0,
        p50: quantile(values, 0.5) || 0,
        p75: quantile(values, 0.75) || 0,
        p95: quantile(values, 0.95) || 0,
      };
    }
  }

  console.log(
    `All data about ${name} metric grouped by ${paramName} parameter:`
  );
  console.table(result);
}

// сравнивает метрики в разных браузерах
function compareAllMetricsByBrowsers(data, page, firstBrowser, secondBrowser) {
  const firstBrowserData = data.filter(
    (item) => item.page == page && item.additional.browser == firstBrowser
  );
  const secondBrowserData = data.filter(
    (item) => item.page == page && item.additional.browser == secondBrowser
  );

  console.log(
    `Compare metrics for ${firstBrowser} and ${secondBrowser} browsers`
  );

  const table = {};
  table[`${firstBrowser} - fcp`] = getMetric(firstBrowserData, "fcp");
  table[`${secondBrowser} - fcp`] = getMetric(secondBrowserData, "fcp");
  table[`${firstBrowser} - ttfb`] = getMetric(firstBrowserData, "ttfb");
  table[`${secondBrowser} - ttfb`] = getMetric(secondBrowserData, "ttfb");
  table[`${firstBrowser} - lcp`] = getMetric(firstBrowserData, "lcp");
  table[`${secondBrowser} - lcp`] = getMetric(secondBrowserData, "lcp");
  table[`${firstBrowser} - fid`] = getMetric(firstBrowserData, "fid");
  table[`${secondBrowser} - fid`] = getMetric(secondBrowserData, "fid");
  table[`${firstBrowser} - load`] = getMetric(firstBrowserData, "load");
  table[`${secondBrowser} - load`] = getMetric(secondBrowserData, "load");
  table[`${firstBrowser} - generate`] = getMetric(firstBrowserData, "generate");
  table[`${secondBrowser} - generate`] = getMetric(
    secondBrowserData,
    "generate"
  );
  table[`${firstBrowser} - draw`] = getMetric(firstBrowserData, "draw");
  table[`${secondBrowser} - draw`] = getMetric(secondBrowserData, "draw");

  console.table(table);
}

// рассчитывает метрику из всего массива данных
function getMetric(data, name) {
  const sampleData = data
    .filter((item) => item.name == name)
    .map((item) => item.value);

  const result = {};

  result.name = name;
  result.hits = sampleData.length;
  result.p25 = quantile(sampleData, 0.25) || 0;
  result.p50 = quantile(sampleData, 0.5) || 0;
  result.p75 = quantile(sampleData, 0.75) || 0;
  result.p95 = quantile(sampleData, 0.95) || 0;

  return result;
}

// рассчитывает метрику за выбранный день
function addMetricByDate(data, page, name, date) {
  const sampleData = data
    .filter(
      (item) => item.page == page && item.name == name && item.date == date
    )
    .map((item) => item.value);

  const result = {};

  result.hits = sampleData.length;
  result.p25 = quantile(sampleData, 0.25) || 0;
  result.p50 = quantile(sampleData, 0.5) || 0;
  result.p75 = quantile(sampleData, 0.75) || 0;
  result.p95 = quantile(sampleData, 0.95) || 0;

  return result;
}

// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
  console.log(`All metrics for ${date}:`);

  const table = {};
  table["First contentful paint"] = addMetricByDate(data, page, "fcp", date);
  table["Time to First Byte"] = addMetricByDate(data, page, "ttfb", date);
  table["Largest contentful paint"] = addMetricByDate(data, page, "lcp", date);
  table["First input delay"] = addMetricByDate(data, page, "fid", date);
  table.Load = addMetricByDate(data, page, "load", date);
  table.Generate = addMetricByDate(data, page, "generate", date);
  table.Draw = addMetricByDate(data, page, "draw", date);

  console.table(table);
}

fetch(
  "https://shri.yandex/hw/stat/data?counterId=D8F28E50-2021-11EC-9EDF-9F93090795B1"
)
  .then((res) => res.json())
  .then((result) => {
    const data = prepareData(result);

    calcMetricsByDate(data, "index", "2021-10-28");

    showSession(data, "index", "951868718058");

    showMetricByPeriod(data, "index", "load", "2021-10-28", "2021-10-29");

    compareMetricByPrameter(data, "index", "ttfb", "platform");

    compareAllMetricsByBrowsers(data, "index", "Edge 95", "Firefox 93");
  });
