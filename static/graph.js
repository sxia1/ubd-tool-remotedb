const links = data.links.map(d => Object.create(d));
const nodes = data.nodes.map(d => Object.create(d));
const types = Array.from(new Set(links.map(d => d.label)));

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX())
    .force("y", d3.forceY());

var width = window.innerWidth;
var height = window.innerHeight;

var toolTip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("max-width", "700px")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "#d5ffd9")
    .style("font-family", "Verdana")
    .style("border-radius", "5px")
    .style("padding", "10px");

console.log(toolTip)

var sidebar = d3.select("body")
    .append("div")
    .attr("id", "sidebar")
    .style("width", "500px")
    .style("position", "absolute")
    .style("right", "20px")
    .style("top", "120px")
    .style("opacity", 0)
    .style("background-color", "#d5ffd9")
    .style("font-family", "Verdana")
    .style("border-radius", "5px")
    .style("padding", "10px");

const svg = d3.select("body").append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("font", "5px sans-serif");

const container = svg.append("g")
    .attr("class", "everything");

// Per-type markers, as they don"t inherit styles.
container.append("defs").selectAll("marker")
    .data(types)
    .join("marker")
        .attr("id", d => `arrow-${d}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -0.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
    .append("path")
        .attr("fill", defcolor())
        .attr("d", "M0,-5L10,0L0,5");

const link = container.append("g")
    .attr("class","links")
    .selectAll("path")
    .data(links)
    .enter().append("g")
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 0.6)
    .attr("stroke", linkcolor())
    .attr("marker-end", d => `url(${new URL(`#arrow-${d.label}`, location)})`);

d3.select(".links").selectAll("g").append('text')
    .data(links)
    .attr("fill", "#40404080")
    .attr("stroke-width", .1)
    .attr("font-size", 2.5)
    .attr("text-anchor", "middle")
    .text(d => info(d));

const node = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")

node.append("circle")
    .style("stroke", "#40404080")
    .attr("stroke-width", 0)
    .attr("fill", color())
    .attr("r", 4)
    .on("mouseover", function(event, d) {
        d3.select("#tooltip")
            .style("opacity", 1)
            .html(info(d))
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px")
     })
    .on("mousemove", function(event, d) {
        d3.select("#tooltip")
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px")
     })
    .on("mouseout", function() {
        d3.select("#tooltip").style("opacity", 0)
            .style("left", "0px")
            .style("top", "0px")
            .html("")
     })
    .on("click", function(event, d) {
        d3.select("#sidebar")
            .style("opacity", 1)
            .html(info(d))
        d3.select(this)
            .style("stroke-width", "2px")
     })
     .on("dblclick", function(event, d) {
        d3.select(this)
            .style("stroke-width", "0px")
     });

node.append("text")
    .attr("x", 5)
    .attr("y", "0.31em")
    .text(d => d.topic)
    .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke-width", .1);

simulation.on("tick", () => {
    link.attr("d", d => linkArc(d));
    node.attr("transform", d => `translate(${d.x},${d.y})`);
    d3.select(".links").selectAll("g").selectAll("text")
        .attr("x", d => (d.source.x + d.target.x)/2)
        .attr("y", d => (d.source.y + d.target.y)/2);
});

node.call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

svg.call(d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([1, 8])
    .on("zoom", zoomed));

function color(){
    var colordomain = ['topic', 'application', 'dataset']
    var colordata = ['#DDAA33', '#004488', '#BB5566']
    const scale = d3.scaleOrdinal().domain(colordomain).range(colordata);
    return d => scale(d.label);
}

function linkcolor(){
    var colordomain = ['uses', 'about']
    var colordata = ['#004488', '#DDAA33']
    const scale = d3.scaleOrdinal().domain(colordomain).range(colordata);
    return d => scale(d.label);
}

function defcolor(){
        var colordomain = ['uses', 'about']
    var colordata = ['#004488', '#DDAA33']
    const scale = d3.scaleOrdinal().domain(colordomain).range(colordata);
    return d => scale(d);
}

function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `M${d.source.x},${d.source.y}
            A${r},${r} 0 0,1 ${d.target.x},${d.target.y}`;
}

function info(d) {
    var str = ""
    if(d.label == "application"){
        if(d.verified){
            str += "Verified "
        }
        else{
            str += "Unverified "
        }
        str += d.type + " ";
        str += d.label + "<br><br>";
        str += d.name + "<br><br>";
        str += d.site + "<br><br>";
        str += d.description;
    }
    if(d.label == "dataset"){
        str += d.label + "<br><br>";
        str += d.title + "<br><br>";
        str += d.doi;
    }
    if(d.label == "topic"){
        str += d.topic + " " + d.label;
    }
    if(d.label == "about"){
        str += d.label;
    }
    if(d.label == "uses"){
        if(d.verified){
            str += "Verified "
        }
        else{
            str += "Unverified "
        }
        str += d.label;
    }
    return str;
}

function zoomed({transform}) {
    container.attr("transform", transform);
}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event,d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event,d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

