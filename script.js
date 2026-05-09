let rawData = [];
let allPumps = [];
const comparisonColors = [
  "#60a5fa",
  "#fb923c",
  "#34d399",
  "#a78bfa",
  "#f87171",
  "#facc15"
];

Papa.parse("data.csv", {
  download: true,
  header: true,
  complete: function(results) {
	console.log(results.data);

	rawData = results.data.map(row => ({
	  pumppu: row["Pumppu"],
	  vesi: row["Vesi"],
	  ulko: Number(row["Ulko"]),
	  tuotto: Number(row["Tuotto"]),
	  input: Number(row["Input"]),
	  cop: Number(row["COP"]),
	  huomautus: row["Huomautus"]
	})).filter(r => !isNaN(r.ulko));
	
	console.log(rawData);
	
    initControls();
    updateCharts();
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
    row.className = "control-card comparison-row";
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
    applySelectionsFromUrl();
  } else {
    document.getElementById("pumpSelect0").value = pumps[0] || "";
    updateWaterOptions(0);
  }

  updateCharts();

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

  const newUrl = `${window.location.pathname}?${params.toString()}`;
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
	  customdata: pumpData.map(d => [d.tuotto]),

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
	  
	layout: {
	  hovermode: "closest",
	  hoverdistance: 30,
	  spikedistance: -1
	}

    dragmode: false,

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
	
	margin: {
	    l: 70,
		r: 30,
		t: 70,
		b: 130
	},

    xaxis: {
      title: "Ulkolämpötila °C",
      gridcolor: "#8e9aad",
	  zeroline: false
	  dtick: 5,
	  minor: {
  	    dtick: 1,
		gridcolor: "#374151",
		showgrid: true
	  }
    },

    yaxis: {
      title: "COP",
      gridcolor: "#8e9aad",
	  dtick: 1,
	  minor: {
	    dtick: 0.5,
		gridcolor: "#374151",
		showgrid: true
	  }
    }

  }, {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false
  });
  
  enableTraceHighlight("copChart");
  
}

function drawPowerChart(selections) {

  const traces = selections.map(selection => {

    const pumpData = rawData
      .filter(d =>
        d.pumppu === selection.pump &&
        d.vesi === selection.water &&
        !isNaN(d.tuotto)
      )
      .sort((a, b) => a.ulko - b.ulko);

    return {
      x: pumpData.map(d => d.ulko),
      y: pumpData.map(d => d.tuotto),
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
	  
	  margin: {
	    l: 70,
		r: 30,
		t: 70,
		b: 130
	  }	  
    };
  });

  Plotly.newPlot("powerChart", traces, {

    dragmode: false,
	
	layout: {
	  hovermode: "closest",
	  hoverdistance: 30,
	  spikedistance: -1
	}

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
	
	margin: {
	    l: 70,
		r: 30,
		t: 70,
		b: 130
	},

    xaxis: {
      title: "Ulkolämpötila °C",
      gridcolor: "#8e9aad",
	  zeroline: false
	  dtick: 5,
	  minor: {
  	    dtick: 1,
		gridcolor: "#374151",
		showgrid: true
	  }
    },

    yaxis: {
      title: "Teho kW",
      gridcolor: "#8e9aad",
	  dtick: 2,
	  minor: {
	    dtick: 1,
		gridcolor: "#374151",
		showgrid: true
	  }
    }

  }, {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false
  });
  
  enableTraceHighlight("powerChart");  
}


function enableTraceHighlight(chartId) {

  const chart = document.getElementById(chartId);

  chart.on("plotly_hover", function(eventData) {

    const hoveredTrace = eventData.points[0].curveNumber;
    const traceCount = chart.data.length;

    const update = {
      opacity: [],
      "line.width": []
    };

    for (let i = 0; i < traceCount; i++) {
      if (i === hoveredTrace) {
        update.opacity.push(1.0);
        update["line.width"].push(6);
      } else {
        update.opacity.push(0.5);
        update["line.width"].push(3);
      }
    }

    Plotly.restyle(chart, update);
  });

  chart.on("plotly_unhover", function() {

    const traceCount = chart.data.length;

    const update = {
      opacity: Array(traceCount).fill(1),
      "line.width": Array(traceCount).fill(4)
    };

    Plotly.restyle(chart, update);
  });
}