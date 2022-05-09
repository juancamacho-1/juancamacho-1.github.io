window.onload = function () {

    // set the dimensions and margins of the graph
    var stackMargin = { top: 30, right: 60, bottom: 30, left: 20 },
        width = 400 - stackMargin.left - stackMargin.right, // changed width from 460
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
        var size = 20
        stackvg.selectAll("myrect")
            .data(keys)
            .enter()
            .append("rect")
            .attr("x", 950)
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
            .attr("x", 950 + size * 1.2)
            .attr("y", function (d, i) { return 10 + i * (size + 5) + (size / 2) }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function (d) { return color(d) })
            .text(function (d) { return d })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

    })

}