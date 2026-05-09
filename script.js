let rawData = [];
let allPumps = [];
let visibleComparisons = 2;
const maxComparisons = 6;
const csvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzUjGukV__4N0fx4mUCQuTIt_Fskg7jPqHNawq_bF2H4cA4i_ur5nyw9QPtyptMfe8PaRHl4upB1HS/pub?gid=893857219&single=true&output=csv";
const comparisonColors = [
  "#60a5fa",
  "#fb923c",
  "#34d399",
  "#a78bfa",
  "#f87171",
  "#facc15"
];

document.getElementById("shareButton")
  .addEventListener("click", copyShareLink);

function copyShareLink() {

  navigator.clipboard.writeText(window.location.href);

  const button = document.getElementById("shareButton");

  const originalText = button.textContent;

  button.textContent = "Linkki kopioitu ✓";

  setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}


// Papa.parse("data.csv", {
Papa.parse(csvUrl, {
  download: true,
  header: true,
  complete: function(results) {

	rawData = results.data.map(row => ({
	  pumppu: row["Pumppu"],
	  vesi: row["Vesi"],
	  ulko: Number(row["Ulko"]),
	  teho: Number(row["Teho"]),
	  input: Number(row["Input"]),
	  cop: Number(row["COP"]),
	  huomautus: row["Huomautus"]
	})).filter(r => !isNaN(r.ulko));
	
	
    initControls();
	updateInfoCard();
  }
});

function initControls() {
  const controls = document.getElementById("comparisonControls");

  controls.innerHTML = "";
  
  allPumps = [...new Set(rawData.map(r => r.pumppu))]
    .filter(Boolean)
    .sort();

  const pumps = allPumps;

  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
	row.id = `comparisonRow${i}`;
    row.className = "control-card comparison-row";
	row.style.display = i < visibleComparisons ? "flex" : "none";
	row.style.borderLeft = `6px solid ${comparisonColors[i]}`;

    const label = document.createElement("label");
    label.textContent = `Pumppu ${i + 1}`;
	
	const filterWrapper = document.createElement("div");
	filterWrapper.className = "filter-wrapper";

	const filterInput = document.createElement("input");
	filterInput.id = `pumpFilter${i}`;
	filterInput.className = "pump-filter";
	filterInput.placeholder = "Suodata pumppuja...";

	const clearButton = document.createElement("span");
	clearButton.className = "clear-filter";
	clearButton.innerHTML = "×";

	filterWrapper.appendChild(filterInput);
	filterWrapper.appendChild(clearButton);

    const pumpSelect = document.createElement("select");
    pumpSelect.id = `pumpSelect${i}`;
    pumpSelect.className = "pump-select";

    const emptyPump = document.createElement("option");
    emptyPump.value = "";
    emptyPump.textContent = "Ei valintaa";
    pumpSelect.appendChild(emptyPump);

    pumps.forEach(pump => {
      const option = document.createElement("option");
      option.value = pump;
      option.textContent = pump;
      pumpSelect.appendChild(option);
    });

    const waterSelect = document.createElement("select");
    waterSelect.id = `waterSelect${i}`;
    waterSelect.className = "water-select";
	
	const noteDiv = document.createElement("div");
	noteDiv.id = `note${i}`;
	noteDiv.className = "note";
	noteDiv.textContent = "";

    row.appendChild(label);
	row.appendChild(filterWrapper);
    row.appendChild(pumpSelect);
    row.appendChild(waterSelect);
	row.appendChild(noteDiv);

    controls.appendChild(row);
	
	filterInput.addEventListener("input", () => {
	  refreshPumpOptions(i);
	});
	
	clearButton.addEventListener("click", () => {
	  filterInput.value = "";
	  refreshPumpOptions(i);
	});

    pumpSelect.addEventListener("change", () => {
      updateWaterOptions(i);
      updateCharts();
    });

    waterSelect.addEventListener("change", () => {
	  updateNote(i);
	  updateCharts();
	});
  }

  if (window.location.search) {
	updateVisibleComparisonsFromUrl();
	applySelectionsFromUrl();
  } else {
	const defaults = [
	  "Panasonic 12 kW T-CAP WH-MXC12J9E8 ",
	  "Power World PW050-DKZLRS-E",
	];

	defaults.forEach((search, index) => {
	  const pumpSelect =
		document.getElementById(`pumpSelect${index}`);

	  if (!pumpSelect) return;

	  const match =
		[...pumpSelect.options]
		  .find(option =>
			option.value.includes(search)
		  );

	  if (match) {
		pumpSelect.value = match.value;
		updateWaterOptions(index);
	  }
	});
  }


  updateCharts();
  
  document.getElementById("addComparisonButton")
  .addEventListener("click", () => {

    if (visibleComparisons < maxComparisons) {

      const row =
        document.getElementById(
          `comparisonRow${visibleComparisons}`
        );

      row.style.display = "flex";

      visibleComparisons++;

      if (visibleComparisons >= maxComparisons) {
        document.getElementById(
          "addComparisonButton"
        ).style.display = "none";
      }
    }
  updateCharts();
  });

}

function refreshPumpOptions(index) {
  const filterInput = document.getElementById(`pumpFilter${index}`);
  const pumpSelect = document.getElementById(`pumpSelect${index}`);

  const filterText = filterInput.value.toLowerCase().trim();
  const previousPump = pumpSelect.value;

  const filteredPumps = allPumps.filter(pump =>
    pump.toLowerCase().includes(filterText)
  );

  pumpSelect.innerHTML = "";

  const emptyPump = document.createElement("option");
  emptyPump.value = "";
  emptyPump.textContent = "Ei valintaa";
  pumpSelect.appendChild(emptyPump);

  filteredPumps.forEach(pump => {
    const option = document.createElement("option");
    option.value = pump;
    option.textContent = pump;
    pumpSelect.appendChild(option);
  });

  if (filteredPumps.includes(previousPump)) {
    pumpSelect.value = previousPump;
  } else {
    pumpSelect.value = "";
  }

  updateWaterOptions(index);
  updateCharts();
}

function updateWaterOptions(index) {
  const pumpSelect = document.getElementById(`pumpSelect${index}`);
  const waterSelect = document.getElementById(`waterSelect${index}`);

  const selectedPump = pumpSelect.value;
  const previousWater = waterSelect.value;

  waterSelect.innerHTML = "";

  if (!selectedPump) {
	const option = document.createElement("option");
	option.value = "";
	option.textContent = "-";
	waterSelect.appendChild(option);
	updateNote(index);
	return;
  }

  const waters = [...new Set(
    rawData
      .filter(r => r.pumppu === selectedPump)
      .map(r => r.vesi)
  )].filter(Boolean).sort();

  waters.forEach(water => {
    const option = document.createElement("option");
    option.value = water;
    option.textContent = water;
    waterSelect.appendChild(option);
  });

  if (waters.includes(previousWater)) {
    waterSelect.value = previousWater;
  } else if (waters.includes("35 °C")) {
	  waterSelect.value = "35 °C";
  } else if (waters.length > 0) {
    waterSelect.value = waters[0];
  }
  updateNote(index);
}

function updateNote(index) {
  const pump = document.getElementById(`pumpSelect${index}`).value;
  const water = document.getElementById(`waterSelect${index}`).value;
  const noteDiv = document.getElementById(`note${index}`);

  if (!pump || !water) {
    noteDiv.textContent = "";
    return;
  }

  const notes = [...new Set(
    rawData
      .filter(r => r.pumppu === pump && r.vesi === water)
      .map(r => r.huomautus)
      .filter(Boolean)
  )];

  noteDiv.textContent = notes.length > 0
    ? `Huom: ${notes.join(" / ")}`
    : "";
}

function applySelectionsFromUrl() {
  const params = new URLSearchParams(window.location.search);

  for (let i = 0; i < 6; i++) {
    const pump = params.get(`p${i + 1}`);
    const water = params.get(`w${i + 1}`);

    if (!pump) continue;

    const pumpSelect = document.getElementById(`pumpSelect${i}`);
    const waterSelect = document.getElementById(`waterSelect${i}`);

    pumpSelect.value = pump;
    updateWaterOptions(i);

    if (water) {
      waterSelect.value = water;
	  updateNote(i);
    }
  }
}

function updateUrlFromSelections() {
  const params = new URLSearchParams();

  for (let i = 0; i < 6; i++) {
    const pump = document.getElementById(`pumpSelect${i}`).value;
    const water = document.getElementById(`waterSelect${i}`).value;

    if (pump && water) {
      params.set(`p${i + 1}`, pump);
      params.set(`w${i + 1}`, water);
    }
  }

  const query = params.toString();
  const newUrl = query
	? `${window.location.pathname}?${query}`
	: window.location.pathname;

  window.history.replaceState({}, "", newUrl);
}

function updateCharts() {
  const selections = [];

  for (let i = 0; i < 6; i++) {
    const pump = document.getElementById(`pumpSelect${i}`).value;
    const water = document.getElementById(`waterSelect${i}`).value;

    if (pump && water) {
      selections.push({
		pump,
		water,
		color: comparisonColors[i],
		index: i
	  });
    }
  }

  drawPowerChart(selections);
  drawCopChart(selections);
  drawCustomLegend(selections);
  updateUrlFromSelections();
}

function drawCopChart(selections) {

  const traces = selections.map(selection => {

    const pumpData = rawData
      .filter(d =>
        d.pumppu === selection.pump &&
        d.vesi === selection.water &&
        !isNaN(d.cop)
      )
      .sort((a, b) => a.ulko - b.ulko);

    return {
      x: pumpData.map(d => d.ulko),
      y: pumpData.map(d => d.cop),
	  customdata: pumpData.map(d => [d.teho]),

      mode: "lines+markers",

      name: `${selection.pump} / ${selection.water}`,

      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Ulko: %{x}°C<br>" +
        "COP: %{y:.2f}<br>" +
		"Teho: %{customdata[0]:.1f} kW<extra></extra>",

      line: {
        shape: "spline",
        smoothing: 0.6,
        width: 4,
		color: selection.color
      },

      marker: {
        size: 8,
		color: selection.color
      }
    };
  });

  Plotly.newPlot("copChart", traces, {	

    dragmode: false,
	showlegend: false,

    title: "COP",

    paper_bgcolor: "#1f2937",
    plot_bgcolor: "#1f2937",

    font: {
      color: "white"
    },

    legend: {
	  orientation: "h",
	  x: 0,
	  y: -0.25
	},
		
	margin: getChartMargin(),

    xaxis: {
      title: "Ulkolämpötila °C",
      gridcolor: "#3f5f4f",
	  zeroline: false,
	  dtick: 5,
	  // minor: {
  	    // dtick: 1,
		// gridcolor: "#2b4438",
		// showgrid: true
	  // }
    },

    yaxis: {
      title: "COP",
      gridcolor: "#3f5f4f",
	  dtick: 1,
	  minor: {
	    dtick: 0.5,
		gridcolor: "#2b4438",
		showgrid: true
	  }
    }

  }, {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false
  });
    
}

function drawPowerChart(selections) {

  const traces = selections.map(selection => {

    const pumpData = rawData
      .filter(d =>
        d.pumppu === selection.pump &&
        d.vesi === selection.water &&
        !isNaN(d.teho)
      )
      .sort((a, b) => a.ulko - b.ulko);

    return {
      x: pumpData.map(d => d.ulko),
      y: pumpData.map(d => d.teho),
	  customdata: pumpData.map(d => [d.cop]),

      mode: "lines+markers",

      name: `${selection.pump} / ${selection.water}`,

      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Ulko: %{x}°C<br>" +
        "Teho: %{y:.1f} kW<br>" +
		"COP: %{customdata[0]:.2f}<extra></extra>",

      line: {
        shape: "spline",
        smoothing: 0.6,
        width: 4,
		color: selection.color
      },

      marker: {
        size: 8,
		color: selection.color
      }, 
    };
  });

  Plotly.newPlot("powerChart", traces, {

    dragmode: false,
	showlegend: false,

    title: "Teho",

    paper_bgcolor: "#1f2937",
    plot_bgcolor: "#1f2937",

    font: {
      color: "white"
    },

    legend: {
	  orientation: "h",
	  x: 0,
	  y: -0.25
	},
		
	margin: getChartMargin(),

    xaxis: {
      title: "Ulkolämpötila °C",
      gridcolor: "#3f5f4f",
	  zeroline: false,
	  dtick: 5,
	  // minor: {
  	    // dtick: 1,
		// gridcolor: "#2b4438",
		// showgrid: true
	  // }
    },

    yaxis: {
      title: "Teho kW",
      gridcolor: "#3f5f4f",
	  dtick: 2,
	  minor: {
	    dtick: 1,
		gridcolor: "#2b4438",
		showgrid: true
	  }
    }

  }, {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false
  });
  
}


function drawCustomLegend(selections) {
  const legend = document.getElementById("customLegend");
  legend.innerHTML = "";

  selections.forEach((selection, index) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.textContent = `${selection.pump} / ${selection.water}`;
    item.style.borderLeft = `6px solid ${selection.color}`;

    item.addEventListener("mouseenter", () => {
      highlightTrace(index);
    });

    item.addEventListener("mouseleave", () => {
      resetTraceHighlight();
    });

    legend.appendChild(item);
  });
}

function highlightTrace(index) {
  ["copChart", "powerChart"].forEach(chartId => {
    const chart = document.getElementById(chartId);
    const traceCount = chart.data.length;

    Plotly.restyle(chart, {
      opacity: Array.from({ length: traceCount }, (_, i) => i === index ? 1 : 0.25),
      "line.width": Array.from({ length: traceCount }, (_, i) => i === index ? 6 : 3)
    });
  });
}

function resetTraceHighlight() {
  ["copChart", "powerChart"].forEach(chartId => {
    const chart = document.getElementById(chartId);
    const traceCount = chart.data.length;

    Plotly.restyle(chart, {
      opacity: Array(traceCount).fill(1),
      "line.width": Array(traceCount).fill(4)
    });
  });
}

function getChartMargin() {
  if (window.innerWidth < 700) {
    return {
      l: 25,
      r: 10,
      t: 60,
      b: 80
    };
  }

  return {
    l: 70,
    r: 30,
    t: 70,
    b: 80
  };
}


function updateVisibleComparisonsFromUrl() {
  const params = new URLSearchParams(window.location.search);

  let highestUsedIndex = 0;

  for (let i = 0; i < maxComparisons; i++) {
    const pump = params.get(`p${i + 1}`);
    const water = params.get(`w${i + 1}`);

    if (pump || water) {
      highestUsedIndex = i + 1;
    }
  }

  visibleComparisons = Math.max(2, highestUsedIndex);

  for (let i = 0; i < maxComparisons; i++) {
    const row = document.getElementById(`comparisonRow${i}`);

    if (row) {
      row.style.display = i < visibleComparisons ? "flex" : "none";
    }
  }

  const button = document.getElementById("addComparisonButton");

  if (button) {
    button.style.display =
      visibleComparisons >= maxComparisons ? "none" : "inline-block";
  }
}


function updateInfoCard() {
  const infoCard = document.getElementById("infoCard");

  const pumpCount = new Set(
    rawData.map(r => r.pumppu).filter(Boolean)
  ).size;

  const pointCount = rawData.filter(r =>
    !isNaN(r.ulko) &&
    (!isNaN(r.cop) || !isNaN(r.teho))
  ).length;

  infoCard.innerHTML = `
    <p>
      Tietokannassa on tällä hetkellä 
      <strong>${pumpCount}</strong> lämpöpumppua ja 
      <strong>${pointCount}</strong> datapistettä.
    </p>

    <p>
      Arvot perustuvat valmistajien ilmoittamiin tietoihin, esitteisiin,
      teknisiin taulukoihin ja muuhun saatavilla olevaan aineistoon.
      Tiedot voivat sisältää virheitä, puutteita tai eri mittaustapojen
      aiheuttamia eroja.
    </p>

    <p>
      Vertailu on tarkoitettu suuntaa-antavaksi eikä sitä tule käyttää
      ainoana perusteena laitevalinnalle.
    </p>
  `;
}