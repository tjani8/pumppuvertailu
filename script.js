let rawData = [];

Papa.parse("data.csv", {
  download: true,
  header: true,
  complete: function(results) {

    rawData = results.data.map(row => ({
      pumppu: row["Pumppu"],
      vesi: row["vesi"],
      ulko: Number(row["Ulko"]),
      tuotto: Number(row["Tuotto"]),
      input: Number(row["Input"]),
      cop: Number(row["COP"]),
      huomautus: row["Huomautus"]
    })).filter(r => !isNaN(r.ulko));

    initControls();
    updateCharts();
  }
});

function initControls() {

  const pumpSelect = document.getElementById("pumpSelect");
  const waterSelect = document.getElementById("waterSelect");

  const pumps = [...new Set(rawData.map(r => r.pumppu))];
  const waters = [...new Set(rawData.map(r => r.vesi))];

  pumps.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    pumpSelect.appendChild(option);
  });

  waters.forEach(w => {
    const option = document.createElement("option");
    option.value = w;
    option.textContent = w;
    waterSelect.appendChild(option);
  });

  pumpSelect.addEventListener("change", updateCharts);
  waterSelect.addEventListener("change", updateCharts);
}

function updateCharts() {

  const pump = document.getElementById("pumpSelect").value;
  const water = document.getElementById("waterSelect").value;

  const filtered = rawData
    .filter(r => r.pumppu === pump && r.vesi === water)
    .sort((a, b) => a.ulko - b.ulko);

  drawCopChart(filtered, pump, water);
  drawPowerChart(filtered, pump, water);
}

function drawCopChart(data, pump, water) {

  const trace = {
    x: data.map(d => d.ulko),
    y: data.map(d => d.cop),
    mode: "lines+markers",
    name: pump,
    line: {
      shape: "spline",
      smoothing: 0.6,
      width: 4
    },
    marker: {
      size: 8
    }
  };

  Plotly.newPlot("copChart", [trace], {
    title: `${pump} – COP (${water})`,
    paper_bgcolor: "#1f2937",
    plot_bgcolor: "#1f2937",
    font: {
      color: "white"
    },
    xaxis: {
      title: "Ulkolämpötila °C",
      gridcolor: "#374151"
    },
}