// =============================================================================
// reference: https://bl.ocks.org/adamjanes/6cf85a4fd79e122695ebde7d41fe327f
// =============================================================================
const EDUCATION_DATA =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const COUNTY_DATA =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

const svg = d3.select("svg");

const tooltip = d3.select("body").append("div").attr("class", "tooltip").attr("id", "tooltip").style("opacity", 0);

const path = d3.geoPath();

const color = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemeYlOrRd[9]);

// ===========================================================================
// Load Data and Draw
// ===========================================================================
const filterEducationById = (id) => education.filter((ed) => ed.fips === id);

d3.queue().defer(d3.json, COUNTY_DATA).defer(d3.json, EDUCATION_DATA).await(ready);

function ready(error, us, education) {
  if (error) {
    throw error;
  }

  // Helper functions
  const filterEducationByCountyId = (countyId) => education.filter((obj) => obj.fips === countyId);

  const mouseover = (d) => {
    tooltip.style("opacity", 0.9);
    tooltip
      .html(function () {
        let result = filterEducationByCountyId(d.id);
        return result[0]["area_name"] + ", " + result[0]["state"] + ":<br> " + result[0].bachelorsOrHigher + "%";
      })
      .attr("data-education", () => filterEducationByCountyId(d.id)[0].bachelorsOrHigher)
      .style("left", d3.event.pageX + 10 + "px")
      .style("top", d3.event.pageY - 28 + "px");
  };

  const mouseout = (d) => {
    tooltip.style("opacity", 0);
  };

  const increaseScale = `scale(1.82, 1.62)`;

  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("transform", increaseScale)
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => filterEducationByCountyId(d.id)[0].bachelorsOrHigher)
    .attr("fill", (d) => color(filterEducationByCountyId(d.id)[0].bachelorsOrHigher))
    .attr("d", path)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout);

  // ===========================================================================
  // Add strokes around states
  // ===========================================================================
  svg
    .append("path")
    .datum(
      topojson.mesh(us, us.objects.states, (a, b) => {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("transform", increaseScale)
    .attr("d", path);

  svg
    .append("path")
    .datum(
      topojson.mesh(us, us.objects.counties, (a, b) => {
        return a !== b;
      })
    )
    .attr("class", "counties")
    .attr("transform", increaseScale)
    .attr("d", path);
  // ===========================================================================
  // Legend
  // ===========================================================================
  const scale = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 960]);

  const legend = svg.append("g").attr("class", "key").attr("id", "legend").attr("transform", "translate(400,915)");

  legend
    .selectAll("rect")
    .data(
      color.range().map((d) => {
        d = color.invertExtent(d);
        if (d[0] === null) d[0] = scale.domain()[0];
        if (d[1] === null) d[1] = scale.domain()[1];
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("height", 9)
    .attr("x", (d) => scale(d[0]))
    .attr("width", (d) => scale(d[1]) - scale(d[0]))
    .attr("fill", (d) => color(d[0]));

  legend
    .append("text")
    .attr("class", "caption")
    .attr("x", scale.range()[0])
    .attr("y", -6)
    .text("Percentage of population with a degree");

  legend
    .call(
      d3
        .axisBottom(scale)
        .tickSize(13)
        .tickFormat(function (x) {
          return Math.round(x) + "%";
        })
        // only first tick has percentage sign
        // .tickFormat(function (scale, i) {
        //   return i > 0 ? Math.round(scale) : Math.round(scale) + "%";
        // })
        .tickValues(color.domain())
    )
    .select(".domain")
    .remove();
}
