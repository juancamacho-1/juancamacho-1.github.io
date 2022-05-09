window.onload = function () {

  var clusterMap = L.map('cluster-map', {
    center: [35.0844, -106.6504],
    zoom: 5
  });

  L.tileLayer('https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=583e007f2faa4a3e81b796e31bb0c115', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    apikey: '583e007f2faa4a3e81b796e31bb0c115',
    maxZoom: 22
  }).addTo(clusterMap);


  /*     Markers      */

  d3.csv("data/msb-reduced/msb_reduced.csv").then(function (data) {
    drawMarkerSelect(data);
  });


  function drawMarkerSelect(data) {
    var xf = crossfilter(data);
    var groupname = "marker-select";
    var facilities = xf.dimension(function (d) { return d.catalogNumber; });
    var facilitiesGroup = facilities.group().reduce(
      function (p, v) { // add
        p.collectionCode = v.collectionCode;
        p.latLong = v.latLong;
        p.species = v.species;
        p.family = v.family;
        p.genus = v.genus;
        p.catalogNumber = v.catalogNumber;
        p.year = v.year;
        ++p.count;
        return p;
      },
      function (p, v) { // remove
        --p.count;
        return p;
      },
      function () { // init
        return { count: 0 };
      }
    );

    var marker = dc_leaflet.markerChart("#cluster-map-anchor", groupname)
      .dimension(facilities)
      .group(facilitiesGroup)
      .map(clusterMap)
      .showMarkerTitle(false)
      .fitOnRender(false)
      .fitOnRedraw(false)
      .filterByArea(true)
      .cluster(true)
      .clusterOptions({ disableClusteringAtZoom: 14 })
      .valueAccessor(function (kv) {
        return kv.value.count;
      })
      .locationAccessor(function (kv) {
        return kv.value.latLong;
      })
      .popup(function (kv) {
        var collectionName = "";

        //Changing the collection Code to Collection Name
        if (kv.value.collectionCode === 'Herp') {
          collectionName = "Herpetology";
        } else if (kv.value.collectionCode === 'Fish') {
          collectionName = "Ichthology";
        } else if (kv.value.collectionCode === 'Herb') {
          collectionName = "Herbarium";
        } else if (kv.value.collectionCode === 'Mamm') {
          collectionName = "Mammalogy";
        } else if (kv.value.collectionCode === 'Arth') {
          collectionName = "Arthropods";
        } else if (kv.value.collectionCode === 'Host') {
          collectionName = "Host";
        } else if (kv.value.collectionCode === 'Para') {
          collectionName = "Parasite";
        } else if (kv.value.collectionCode === 'Bird') {
          collectionName = "Ornithology";
        } else {
          collectionName = "Unknown Collection";
        }

        return "<b>Collection: </b>" + collectionName + "<br>"
          + "<b>Family: </b>" + kv.value.family + "<br>"
          + "<b>Genus: </b>" + kv.value.genus + "<br>"
          + "<b>Species: </b>" + kv.value.species + "<br>"
          + "<b>Catalog Number: </b>" + kv.value.catalogNumber + "<br>"
          + "<b>Year Collected: </b>" + kv.value.year + "<br>"
          + "<b>Coordinates: </b>" + kv.value.latLong;
      })
      .icon(function (kv) {
        if (kv.value.collectionCode === 'Herp') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/lizard.png'
          });
        } else if (kv.value.collectionCode === 'Fish') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/fish.png'
          });
        } else if (kv.value.collectionCode === 'Herb') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/plant.png'
          });
        } else if (kv.value.collectionCode === 'Mamm') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/rat.png'
          });
        } else if (kv.value.collectionCode === 'Arth') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/beetle.png'
          });
        } else if (kv.value.collectionCode === 'Host') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/host.png'
          });
        } else if (kv.value.collectionCode === 'Para') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/parasite.png'
          });
        } else if (kv.value.collectionCode === 'Bird') {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/bird.png'
          });
        } else {
          return L.icon({
            iconSize: [40, 40],
            iconUrl: 'icons/unknown.png'
          });
        }
      });
    ;

    var types = xf.dimension(function (d) { return d.collectionCode; });
    var typesGroup = types.group().reduceCount();
    var pie = dc.pieChart(".pie", groupname)
      .dimension(types)
      .group(typesGroup)
      .width(180)
      .height(180)
      .renderLabel(true)
      .renderTitle(true)
      .ordering(function (p) {
        return -p.value;
      });

    // START YEAR FILTER
    var yearDim = xf.dimension(function (d) { return d.year; })
    var countPerYear = yearDim.group().reduceCount()
    var yearlyMoveChart = dc.barChart('#yearly-move-chart', groupname)
      .width(300)
      .height(180)
      .dimension(yearDim)
      .group(countPerYear)
      .x(d3.scaleLinear().domain([1900, 2022]))
      .elasticY(true)
      .centerBar(true)
      .barPadding(1)
      .xAxisLabel('Year')
      .yAxisLabel('# Collections')
      .margins({ top: 10, bottom: 55, right: 10, left: 55 });


    // Order, Family, Genus Filter
    var selectOrder = new dc.SelectMenu(".selectOrder", groupname)
    var selectFamily = new dc.SelectMenu(".selectFamily", groupname)
    var selectGenus = new dc.SelectMenu(".selectGenus", groupname)

    var orderDim = xf.dimension(function (d) { return d.order; });
    var orderGroup = orderDim.group().reduceCount()
    var familyDim = xf.dimension(function (d) { return d.family; });
    var familyGroup = familyDim.group().reduceCount()
    var genusDim = xf.dimension(function (d) { return d.genus; });
    var genusGroup = genusDim.group().reduceCount()

    selectOrder
      .dimension(orderDim)
      .group(orderGroup)
      .controlsUseVisibility(true)
      .height(10)
      .width(300)
      .multiple(true)
      .numberVisible(7)

    selectFamily
      .dimension(familyDim)
      .group(familyGroup)
      .controlsUseVisibility(true)
      .height(10)
      .width(300)
      .multiple(true)
      .numberVisible(7)

    selectGenus
      .dimension(genusDim)
      .group(genusGroup)
      .controlsUseVisibility(true)
      .height(10)
      .width(300)
      .multiple(true)
      .numberVisible(7)

    // Table for downloading data
    var allDim = xf.dimension(function (d) { return d; })

    var table = new dc.DataTable(".table", groupname)
    // table
    //   .dimension(reversible_group(facilitiesGroup))
    //   .columns([function (d) { return d.value.catalogNumber },
    //   function (d) { return d.value.collectionCode },
    //   function (d) { return d.value.order },
    //   function (d) { return d.value.family },
    //   function (d) { return d.value.genus },
    //   function (d) { return d.value.species },
    //   function (d) { return d.value.year },
    //   function (d) { return d.value.latLong },
    //   ])
    //   // .showSections(false)
    //   .sortBy(function (d) { return d.value.collectionCode })
    //   .size(10)

    // function reversible_group(group) {
    //   return {
    //     top: function (N) {
    //       return group.top(N);
    //     },
    //     bottom: function (N) {
    //       return group.top(Infinity).slice(-N).reverse();
    //     }
    //   };
    // }


    table
      .dimension(allDim)
      // .group(function (d) { return 'dc.js insists on putting a row here so I remove it using JS'; })
      .size(40)
      .columns([
        {
          label: "Collection",
          format: function (d) { return d.collectionCode }
        },
        {
          label: "CatalogNumber",
          format: function (d) { return d.catalogNumber }
        },
        {
          label: "Order",
          format: function (d) { return d.order }
        },
        {
          label: "Family",
          format: function (d) { return d.family }
        },
        {
          label: "Genus",
          format: function (d) { return d.genus }
        },
        {
          label: "Species",
          format: function (d) { return d.species }
        },
        {
          label: "Year",
          format: function (d) { return d.year }
        },
        {
          label: "Coordinates",
          format: function (d) { return d.latLong }
        }
      ])
      .sortBy(function (d) { return d.collectionCode })
      .order(d3.descending)

    // Download Button
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;

    d3.select('.download-button')
      .on('click', function () {
        var data = allDim.top(Infinity);
        data = data.sort(function (a, b) {
          return table.order()(table.sortBy()(a), table.sortBy()(b));
        });
        data = data.map(function (d) {
          var row = {};
          table.columns().forEach(function (c) {
            row[table._doColumnHeaderFormat(c)] = table._doColumnValueFormat(c, d);
          });
          return row;
        });

        var blob = new Blob([d3.csvFormat(data)], { type: "text/csv;charset=utf-8" });
        saveAs(blob, 'msb-data-' + today + '.csv');
      });

    dc.renderAll(groupname);


    return { marker: marker, pie: pie, yearlyMoveChart: yearlyMoveChart, selectOrder: selectOrder, selectFamily: selectFamily, selectGenus: selectGenus, table: table };


  }

  //BarChart Modal
  google.charts.load("current", {
    packages: ['corechart']
  });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    var data = google.visualization.arrayToDataTable([
      ['Collection', 'Specimens', {
        role: 'style'
      }],
      ['Mammalogy', 300077, 'red'],
      ['Ichthyology', 106809, 'cyan',],
      ['Herbarium', 88615, 'green',],
      ['Herpetology', 82717, 'lime'],
      ['Arthropods', 56513, 'brown'],
      ['Ornithology', 37072, 'purple'],
      ['Parasites', 15881, 'black'],
      ['Hosts', 9619, 'orange']
    ]);

    var options = {
      bar: {
        groupWidth: '90%'
      },
      height: '300',
      legend: 'none',
      width: '780',
    };

    var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));

    if (navigator.userAgent.match(/Trident\/7\./)) {
      google.visualization.events.addListener(chart, 'click', function () {
        chart_div.innerHTML = '<img src="' + chart.getImageURI() + '">';
        console.log(chart_div.innerHTML);
      });
      chart.draw(data, options);
    } else {
      google.visualization.events.addListener(chart, 'select png', function () {
        chart_div.innerHTML = '<img src="' + chart.getImageURI() + '">';
        console.log(chart_div.innerHTML);
      });
      chart.draw(data, options);
      document.getElementById('png').innerHTML = '<a href="' + chart.getImageURI() + '" target="_blank"><span class="glyphicon glyphicon-print"></span></a>';
    }
  }

  // Stacked Area Chart Modal


     // set the dimensions and margins of the graph
     modalWidth = d3.select()
     var stackMargin = { top: 40, right: 100, bottom: 50, left: 40 }
     width = 700 - stackMargin.left - stackMargin.right, // changed width from 460
     height = 300 - stackMargin.top - stackMargin.bottom; // changed height from 400, make sure to change location of legend!

 // append the svg object to the body of the page
 var stackvg = d3.select("#stacked-area")
     .append("svg")
     .attr("width", width + stackMargin.left + stackMargin.right)
     .attr("height", height + stackMargin.top + stackMargin.bottom)
     .append("g")
     .attr("transform",
         "translate(" + stackMargin.left + "," + stackMargin.top + ")");

 // Parse the Data
 d3.csv("data/specimens-by-collections0_1900-2020.csv").then(function (data) {


     //////////
     // GENERAL //
     //////////

     // List of groups = header of the csv files
     var keys = data.columns.slice(1)    // gets the name of each column and assigns it to var keys

     // color palette
     var color = d3.scaleOrdinal()
         .domain(keys)                   // assigns each key a different color
         .range(d3.schemeSet2);

     //stack the data?
     var stackedData = d3.stack()        // stacks the data so the minimum value of variable n is the max value of variable n-1
         .keys(keys)
         (data)

     //////////
     // AXIS //
     //////////

     // Add X axis
     var x = d3.scaleLinear()
         .domain(d3.extent(data, function (d) { return d.year; }))
         .range([0, width]);
     var xAxis = stackvg.append("g")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(x).ticks(5))

     // Add X axis label:
     stackvg.append("text")
         .attr("text-anchor", "end")
         .attr("x", width/2 + 40)
         .attr("y", height + 40)
         .text("Time (year)");

     // Add Y axis label:
     stackvg.append("text")
         .attr("text-anchor", "end")
         .attr("x", 0)
         .attr("y", -20)
         .text("# Collections Made") // Changed Y axis Label
         .attr("text-anchor", "start")

     // Add Y axis
     var y = d3.scaleLinear()
         .domain([0, 22000]) // originally set at 200000, set to a number better for your own data
         .range([height, 0]);
     stackvg.append("g")
         .call(d3.axisLeft(y).ticks(10))



     //////////
     // BRUSHING AND CHART //
     //////////

     // Add a clipPath: everything out of this area won't be drawn.
     var clip = stackvg.append("defs").append("svg:clipPath")
         .attr("id", "clip")
         .append("svg:rect")
         .attr("width", width)
         .attr("height", height)
         .attr("x", 0)
         .attr("y", 0);

     // Add brushing
     var brush = d3.brushX()                 // Add the brush feature using the d3.brush function
         .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
         .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

     // Create the scatter variable: where both the circles and the brush take place
     var areaChart = stackvg.append('g')
         .attr("clip-path", "url(#clip)")

     // Area generator
     var area = d3.area()
         .x(function (d) { return x(d.data.year); })
         .y0(function (d) { return y(d[0]); })
         .y1(function (d) { return y(d[1]); })

     // Show the areas
     areaChart
         .selectAll("mylayers")
         .data(stackedData)
         .enter()
         .append("path")
         .attr("class", function (d) { return "myArea " + d.key })
         .style("fill", function (d) { return color(d.key); })
         .attr("d", area)

     // Add the brushing
     areaChart
         .append("g")
         .attr("class", "brush")
         .call(brush);

     var idleTimeout
     function idled() { idleTimeout = null; }

     // A function that update the chart for given boundaries
     function updateChart() {

         extent = d3.event.selection

         // If no selection, back to initial coordinate. Otherwise, update X axis domain
         if (!extent) {
             if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
             x.domain(d3.extent(data, function (d) { return d.year; }))
         } else {
             x.domain([x.invert(extent[0]), x.invert(extent[1])])
             areaChart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
         }

         // Update axis and area position
         xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5))
         areaChart
             .selectAll("path")
             .transition().duration(1000)
             .attr("d", area)
     }



     //////////
     // HIGHLIGHT GROUP //
     //////////

     // What to do when one group is hovered
     var highlight = function (d) {
         console.log(d)
         // reduce opacity of all groups
         d3.selectAll(".myArea").style("opacity", .1)
         // expect the one that is hovered
         d3.select("." + d).style("opacity", 1)
     }

     // And when it is not hovered anymore
     var noHighlight = function (d) {
         d3.selectAll(".myArea").style("opacity", 1)
     }



     //////////
     // LEGEND //
     //////////

     // Add one dot in the legend for each name.
     var size = 10
     stackvg.selectAll("myrect")
         .data(keys)
         .enter()
         .append("rect")
         .attr("x", 570)
         .attr("y", function (d, i) { return 10 + i * (size + 5) }) // 100 is where the first dot appears. 25 is the distance between dots
         .attr("width", size)
         .attr("height", size)
         .style("fill", function (d) { return color(d) })
         .on("mouseover", highlight)
         .on("mouseleave", noHighlight)

     // Add one dot in the legend for each name.
     stackvg.selectAll("mylabels")
         .data(keys)
         .enter()
         .append("text")
         .attr("x", 570 + size * 1.2)
         .attr("y", function (d, i) { return 10 + i * (size + 5) + (size / 2) }) // 100 is where the first dot appears. 25 is the distance between dots
         .style("fill", function (d) { return color(d) })
         .text(function (d) { return d })
         .attr("text-anchor", "left")
         .style("alignment-baseline", "middle")
         .on("mouseover", highlight)
         .on("mouseleave", noHighlight)

 })
}
