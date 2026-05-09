let rawData = [];
let allPumps = [];

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

    const label = document.createElement("label");
    label.textContent = `Pumppu ${i + 1}`;
	
	const filterInput = document.createElement("input");
	filterInput.id = `pumpFilter${i}`;
	filterInput.className = "pump-filter";
	filterInput.placeholder = "Suodata pumppuja...";

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

    row.appendChild(label);
	row.appendChild(filterInput);
    row.appendChild(pumpSelect);
    row.appendChild(waterSelect);

    controls.appendChild(row);
	
	filterInput.addEventListener("input", () => {
	  refreshPumpOptions(i);
	});

    pumpSelect.addEventListener("change", () => {
      updateWaterOptions(i);
      updateCharts();
    });

    waterSelect.addEventListener("change", updateCharts);
  }

  document.getElementById("pumpSelect0").value = pumps[0] || "";
  updateWaterOptions(0);

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
  } else if (waters.length > 0) {
    waterSelect.value = waters[0];
  }
}

function updateCharts() {
  const selections = [];

  for (let i = 0; i < 6; i++) {
    const pump = document.getElementById(`pumpSelect${i}`).value;
    const water = document.getElementById(`waterSelect${i}`).value;

    if (pump && water) {
      selections.push({ pump, water });
    }
  }

  drawCopChart(selections);
  drawPowerChart(selections);
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

      mode: "lines+markers",

      name: `${selection.pump} / ${selection.water}`,

      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Ulko: %{x}°C<br>" +
        "COP: %{y:.2f}<extra></extra>",

      line: {
        shape: "spline",
        smoothing: 0.6,
        width: 4
      },

      marker: {
        size: 8
      }
    };
  });

  Plotly.newPlot("copChart", traces, {

    dragmode: false,

    title: "COP vertailu",

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
      gridcolor: "#374151"
    },

    yaxis: {
      title: "COP",
      gridcolor: "#374151"
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
        !isNaN(d.tuotto)
      )
      .sort((a, b) => a.ulko - b.ulko);

    return {
      x: pumpData.map(d => d.ulko),
      y: pumpData.map(d => d.tuotto),

      mode: "lines+markers",

      name: `${selection.pump} / ${selection.water}`,

      hovertemplate:
        "<b>%{fullData.name}</b><br>" +
        "Ulko: %{x}°C<br>" +
        "Tuotto: %{y:.1f} kW<extra></extra>",

      line: {
        shape: "spline",
        smoothing: 0.6,
        width: 4
      },

      marker: {
        size: 8
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

    title: "Tuotto vertailu",

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
      gridcolor: "#374151"
    },

    yaxis: {
      title: "Tuotto kW",
      gridcolor: "#374151"
    }

  }, {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false,
    doubleClick: false
  });
}
