// setup the SVG for the force-directed graph
var svg = d3.select("#visualization svg"),
  width =+svg.attr("width"),
  height =+svg.attr("height");

// set the viewbox to of the svg to enable responsive resizing
svg.attr("viewBox", `0 0 ${width} ${height}`);
svg.attr("preserveAspectRatio", "xMinYMid meet");

// allow zoom in/out
var zoom = d3.zoom()
  .scaleExtent([0.5, 2]) // between 0.5x and 2x
  .on("zoom", function zoomed() {
    // apply the current zoom transform to all g elements inside the SVG
    svg.selectAll("g").attr("transform", d3.event.transform);
  });
svg.call(zoom); // apply the zoom behavior to the SVG element

// force
var simulation = d3
  .forceSimulation()
  .force("link", d3.forceLink().distance(30).strength(1)) // consistent link distance
  .force("charge", d3.forceManyBody().strength(-30)) // adjust charge strength for uniform distribution
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collide", d3.forceCollide().radius(6)) // prevent node overlap
  .force("forceX", d3.forceX(width / 2).strength(0.2)) // pull towards center X
  .force("forceY", d3.forceY(height / 2).strength(0.2)); // pull towards center Y

// infoCard
var infoCard = d3
  .select("#info-card")
  .style("display", "none") // only change to block on hover
  .style("width", "25%") 
  .style("background", "#fff")
  .style("height", `${height}px`);

// load and process data
d3.csv("shows.csv").then(function (showsData) {
  d3.csv("cast_show_links.csv").then(function (castShowLinksData) {
    
    // process the shows data
    var showNodes = showsData.map((show) => ({ // map each show data to a new format
      id: show.name,  // use the show's name as its id
      ...show,  // include evertyhing of the show
      type: "show", // add the type to distinguish the show nodes
    }));

    // process cast nodes and links
    var castMap = {}; // empty object to store the cast nodes
    castShowLinksData.forEach((link) => { //Iterate over each cast-show link
      var castId = link.target; // get the cast id from the link
      if (!castMap[castId]) { // check if the cast id is not already in the castMap
        castMap[castId] = { id: castId, type: "cast", shows: [] }; // initialize a new cast node
      }
      castMap[castId].shows.push(link.source); // add show to cast
    });

    var castNodes = Object.values(castMap); // convert castMap object to array of its cast nodes
    var nodes = showNodes.concat(castNodes); // combine show nodes and cast nodes into one array
    var links = castShowLinksData.map((link) => ({
      source: showNodes.find((show) => show.name === link.source), // find the corresponding show node
      target: castMap[link.target], // find the corresponding cast node
    }));

    // set node radius based on its type
    var radiusScale = d3.scaleOrdinal().domain(["show", "cast"]).range([9, 5]);

    // append ths links to the svg
    var link = svg
      .append("g") 
      .attr("class", "links")
      .selectAll("line")
      .data(links) // bind data to the line elements
      .enter()
      .append("line")
      .attr("stroke-width", 2)
      .attr("stroke", "gray");

    // a flag to track if node is clicked
    var nodeClicked = false;

    // append the nodes to the svg
    var node = svg
      .append("g")
      .attr("class", "nodes") // set class for styling
      .selectAll("circle") // all circles are nodes
      .data(nodes) // bind data to the circle elements
      .enter()
      .append("circle")
      .attr("fill", (d) => (d.type === "show" ? "#32cc6f" : "#3297d6")) // set color based on type 
      .attr("r", (d) => radiusScale(d.type)) // set radius based on node type
      .on("mouseover", function (d) { // mouseover event for nodes
        if (!nodeClicked) { 
          d3.select(this).style("stroke", "black"); // change stroke to black on mouseover
          link.style("opacity", (l) => 
            l.source === d || l.target === d ? 1 : 0.1, // highlight connected links
          );
          node.style("opacity", (n) => // change node opacity
            n === d ||
            links.some( // highlight connected nodes
              (l) =>
                (l.source === d && l.target === n) ||
                (l.target === d && l.source === n),
            )
              ? 1
              : 0.1,
          );
          labels
            .filter(function (labelD) { // filter labels to match the current node
              return labelD === d;
            })
            .style("visibility", "visible"); // make the corresponding label visible
          updateInfoCard(d);
        }
      })
      .on("mouseout", function () {
        // hide the label when the mouse leaves the node if the node is not locked
        if (!d3.select(this).classed("locked")) {
          labels.style("visibility", "hidden");
        }
      })
      .on("click", function (d) {
        d3.select(this).style("stroke", "black");
        link.style("opacity", (l) => 
          l.source === d || l.target === d ? 1 : 0.1, // highlight connected links
        );
        node.style("opacity", (n) => // Change opacity of nodes
          n === d ||
          links.some( // highlight connected nodes
            (l) =>
              (l.source === d && l.target === n) ||
              (l.target === d && l.source === n),
          )
            ? 1
            : 0.1,
        );
        labels
          .filter(function (labelD) { // fiter labels to match wiht the clicked node
            return labelD === d;
          })
          .style("visibility", "visible"); //make the coooredpondinng label visible

        updateInfoCard(d); // updadte the infocard with the clicked node's data
        d3.select("#search").property("value", ""); // clear the searchbox
      })
      .call( // enable the drag function on nodes
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended),
      );

    // label 
    var labels = svg
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes) // bind data to the text elements
      .enter()
      .append("text")
      .text((d) => d.name || d.id)  // set text based on node's name or id
      .style("fill", "#555")
      .style("font-family", "Arial")
      .style("font-size", 10)
      .style("visibility", "hidden") // hide text by default
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y);

    // reset styles of node and links
    function resetNodeStyles() {
      d3.selectAll(".nodes circle")
        .classed("locked", false) // remove the lock from all nodes
        .style("opacity", 1)
        .style("stroke", "none");
      d3.selectAll(".links line").style("opacity", 1);
      infoCard.style("display", "none");
    }
    svg.on("click", function () { 
      if (d3.event.target.tagName !== "circle") {  // check if clicked element is not a node
        resetNodeStyles(); // reset styles if clicked outside of nodes
        nodeClicked = false; // reset nodeClicked flag
        d3.select("#search").property("value", ""); // clear the search input field too
        labels.style("visibility", "hidden"); // hide all labels
      }
    });

    function ticked() {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels
        .attr("x", (d) => d.x + 12) // adjust label positions based on node positions
        .attr("y", (d) => d.y + 3);
    }

    simulation.nodes(nodes).on("tick", ticked).force("link").links(links);

    var searchDatalist = d3.select("#search-options");

    // combine show and cast nodes into a single list
    var combinedNodes = showNodes
      .map((show) => ({
        name: show.name,
        type: "show",
      }))
      .concat(
        castNodes.map((cast) => ({
          name: cast.id,
          type: "cast",
        })),
      );

    // sort the combined list alphabetically by the name
    var sortedCombinedNodes = combinedNodes.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // append sorted nodes to the datalist
    sortedCombinedNodes.forEach((node) => {
      searchDatalist.append("option").attr("value", node.name);
    });

    d3.select("#search")
      .on("input", function () {
        var searchTerm = this.value.toLowerCase(); // get the lowercase search term

        // determine if each node starts with the search term
        var matchingNodes = nodes.filter((node) => {
          var nameMatch =
            node.name && node.name.toLowerCase().startsWith(searchTerm);
          var idMatch =
            node.id && node.id.toLowerCase().startsWith(searchTerm);
          return nameMatch || idMatch;
        });

        console.log(matchingNodes); // check the matching nodes in the console

        // reset all nodes and links to low opacity
        d3.selectAll(".nodes circle")
          .style("opacity", 0.1)
          .style("stroke", "none");
        d3.selectAll(".links line").style("opacity", 0.1);
        labels.style("visibility", "hidden"); // hide all labels initially

        // if the search term is empty, reset styles and hide all labels
            if (searchTerm.length === 0) {
              // If the search term is empty, reset styles and hide all labels
              resetNodeStyles();
              labels.style("visibility", "hidden");
              infoCard.style("display", "none");
            } else {
              var matchingNodes = nodes.filter((node) => {
                var nameMatch = node.name && node.name.toLowerCase().startsWith(searchTerm);
                var idMatch = node.id && node.id.toLowerCase().startsWith(searchTerm);
                return nameMatch || idMatch;
              });
              // if there are matching nodes
              if (matchingNodes.length > 0) {
                // highlight the matching nodes
                matchingNodes.forEach((matchedNode) => {
                  d3.selectAll(".nodes circle")
                    .filter((d) => d === matchedNode)
                    .style("opacity", 1)  // highlight matching nodes
                    .style("stroke", "black");

                  // show labels for matching nodes
                  labels
                    .filter((labelD) => labelD === matchedNode)
                    .style("visibility", "visible"); // show labels for matching nodes

                  // show infocard for matched node
                  updateInfoCard(matchedNode);

                  // highlight connected links and nodes
                  d3.selectAll(".links line")
                    .filter(
                      (l) => l.source === matchedNode || l.target === matchedNode,
                    )
                    .style("opacity", 1)
                    .each(function (l) {
                      let connectedNode =
                        l.source === matchedNode ? l.target : l.source;
                      // highlight connected cast nodes for a show or show nodes for a cast
                      if (
                        (matchedNode.type === "show" &&
                          connectedNode.type === "cast") ||
                        (matchedNode.type === "cast" && connectedNode.type === "show")
                      ) {
                        d3.selectAll(".nodes circle")
                          .filter((node) => node === connectedNode)
                          .style("opacity", 1)
                          .style("stroke", "black");
                      }
              });
          });
        } else {
          // rreset all nodes and links to full opacity if no match found
          d3.selectAll(".nodes circle")
            .style("opacity", 1)
            .style("stroke", "none");
          d3.selectAll(".links line").style("opacity", 1);
          infoCard.style("display", "none"); // hide the indocard
          labels.style("visibility", "hidden"); // hide all labels too
        }
        }
      })
      .on("click", function () {
        // clear the search barn and reset the styles on click
        this.value = "";
        searchTerm = "";
        // reset all nodes and links to full opacity
        d3.selectAll(".nodes circle")
          .style("opacity", 1)
          .style("stroke", "none");
        d3.selectAll(".links line").style("opacity", 1);
        labels.style("visibility", "hidden"); // hide all labels
        infoCard.style("display", "none"); // hide the info card too
      });
  });
});

function updateInfoCard(entity) {
  infoCard.style("display", "block");
  infoCard.html("");

  if (entity.type === "show") {
    infoCard
      .append("div")
      .attr("class", "info-card-title")
      .html("<h1>" + entity.name + "</h1>");

    // Determine the correct display text for the cast
    var castDisplayText = entity.cast && entity.cast.length > 0 ? entity.cast : "None";
    infoCard
      .append("div")
      .attr("class", "info-card-section")
      .html("<strong>Cast:</strong> " + castDisplayText); // Use castDisplayText here

    infoCard
      .append("div")
      .attr("class", "info-card-section")
      .html("<strong>Genre:</strong> " + entity.genre);
    infoCard
      .append("div")
      .attr("class", "info-card-section")
      .html("<strong>Plot:</strong> " + entity.description);
  } else if (entity.type === "cast") {
    infoCard
      .append("div")
      .attr("class", "info-card-title")
      .html("<h1>" + entity.id + "</h1>");
    infoCard.append("p").html("<strong>Shows Acted: </strong>" + entity.shows);
  }
}


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.5).restart();
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
