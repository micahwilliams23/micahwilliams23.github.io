
// load data from local json
const founding_locations = d3.json('founding_locations.json')
const all_companies = d3.json('all_companies.json')

// set the dimensions and margins of the graph
var bb = document.querySelector('#svgDiv').getBoundingClientRect(),
    width = bb.right - bb.left,
    height = width * 0.65,
    margin_prop = 0.05,
    margin = {
        top: height * margin_prop, 
        bottom: height * margin_prop, 
        right: width * margin_prop * 0.25, 
        left: width * margin_prop * 0.75};

// make checkboxes for scatterplot
const continents = ['North America', 'Europe', 'East Asia and the Pacific', 'South Asia', 'Middle East and North Africa', 'Latin America and Caribbean', 'Sub-Saharan Africa']
const form = d3.select('#dataToggles')
for(i in continents){

    c = continents.sort()[i]
    form.append('input')
        .attr('type', 'checkbox')
        .classed('checkbox', 'true')
        .attr('name', c)
        .attr('checked', 'true')
        .on('click', function(){
            d3.select(this).attr('checked', !this.checked)
            hidePoints()
            setTimeout(() => {plotPoints()}, 500)
        })

    form.append('text')
        .classed('checkboxText', 'true')
        .text(c);
    form.append('br')
}
form.style('opacity', 0)
d3.select('.cityInfo').style('left', '3000px')

// draw SVG, axes, titles
{
// make svg for graphic
var svg = d3.select('#svgDiv')
    .append('svg')
        .attr('id', 'svgContainer')
        .attr('viewBox', '0 0 ' + (width * 1.1) + ' ' + (height * 1.1))
        .attr('preserveAspectRatio', 'xMinYMin meet')
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// add x axis
var x = d3.scaleLog()
    .domain([0.15, 60])
    .range([margin.left, width + margin.left - margin.right]);
svg.append('g')
    .classed('axis', 'true')
    .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
    .call(d3.axisBottom(x)
            .tickValues([0.3, 1, 3, 10, 30])
            .tickFormat(d => '$' + d + 'm'));

// add y axis
var y = d3.scaleLinear()
    .domain([0, 60])
    .range([height - margin.bottom, margin.top]);

svg.append('g')
    .classed('axis', 'true')
    .attr('transform', 'translate(' + margin.left + ',0)')
    .call(d3.axisLeft(y).ticks(5));

// add y axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('y', - margin.left * 0.2)
    .attr('x', - (height / 2 + 2*margin.top + margin.bottom))
    .attr('transform', 'rotate(-90)')
    .text('Average Headcount (IQM)')

// add x axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('y', height + margin.bottom / 2)
    .attr('x', width / 2 - margin.left)
    .text('Median Funding')

// add plot title
svg.append('text')
    .attr('id', 'plotTitle')
    .attr('y', margin.top / 2 - 10)
    .attr('x', margin.left + 10)
    .text('Funding vs. Headcount in Top 100 Cities by Company Count')
}

function hideBaseLayer(){
    d3.selectAll('.axisTitle').style('opacity', 0)
    d3.selectAll('.axis').style('opacity', 0)
    d3.select('#dataToggles').style('opacity', 0)
}

function mapCities(){

    hideBaseLayer()
    setPlotTitle('Founding Locations Around the World')

    // set map projection
    const projection = d3.geoNaturalEarth()
        .scale(width / 4.5)
        .translate([width/2, height/2 + 50])

    // get map data from github
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(data){

        // remove Antarctica
        data.features = data.features.filter(d => d.properties.name != 'Antarctica')

        // add map to svg
        svg.append('g')
            .selectAll('path')
            .data(data.features)
            .join('path')
            .attr('d', d3.geoPath().projection(projection))
            .style('stroke', '#111')
            .style('fill', 'lightgray')
            .style('opacity', 0.4)

    })
}
mapCities()

// add points for scatterplot
function plotPoints(){

    // show continents checkboxes
    d3.select('#dataToggles').style('opacity', 1)

    // check which continents are checked
    var checkboxes = [...document.getElementsByClassName('checkbox')],
        showContinents = [],

        // scale for sizing points
        r = d3.scaleSqrt()
            .domain([0, 6000])
            .range([5,15]);


    checkboxes.forEach(function(box, i){
        if(box.checked == true){
            showContinents.push(box.name)
        }
    })

    d3.select('.cityInfo')
        // .style('opacity', 0)
        .style('left', '3000px')
        .style('top', '0px')

    founding_locations.then(function(d){

        var delayScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0,1000]);

        var color = d3.scaleOrdinal()
            .domain(continents)
            .range(['#1B9E77', '#D95F02', '#7570B3', '#E7298A', '#66A61E', '#A6761D', '#666666'])
    
        svg.append('g')
            .attr('id', 'scatterplot')
            .selectAll('.points')
            .data(d.filter(d => showContinents.includes(d.EPI_regions)))
            .enter()
            .append('circle')
            .classed('points')
            .attr('cx', d => x(d.funding_m))
            .attr('cy', d => y(d.headcount_IQM))
            .attr('r', d => r(d.companies))
            .style('fill', d => color(d.EPI_regions))
            .attr('opacity', '0')
            .on('mouseover', mouseover)
            .on('mousemove', (event) => mousemove(event))
            .on('mouseleave', mouseleave);
    
        svg.selectAll('.points')
            .transition()
            .duration(350)
            .attr('opacity', 0.35)
            .delay((d, i) => delayScale(i));
    })
}

// hide points before replotting
function hidePoints(){
    svg.selectAll('.points')
        .transition()
        .duration(150)
        .attr('opacity', 0)

    setTimeout(() => {
        svg.selectAll('.points')
            .data([])
            .exit()
            .remove();
    }, 150);
}

// restore opacity
function mouseleave(){

    
    var color = d3.scaleOrdinal()
            .domain(continents)
            .range(['#1B9E77', '#D95F02', '#7570B3', '#E7298A', '#66A61E', '#A6761D', '#666666'])

    // return points to regular opacity and color
    d3.selectAll('.points')
        .style('fill', d => color(d.EPI_regions))
        .attr('opacity', 0.35);

    // move tooltip off screen
    d3.select('.cityInfo')
        .style('left', '3000px')
        .style('top', '0px')  
        .style('opacity', 0);
}

function mousemove(event){

    var pos = d3.pointer(event),
        leftPos = () => {
            if(pos[0] + 180 < width){
                return (pos[0]+180) + 'px'
            } else {
                return (pos[0] - 250) + 'px'
            }
        };

    d3.select('.cityInfo')
        .style('left', leftPos)
        .style('top', (pos[1]+0) + 'px');

}

// highlight point on mouseover
function mouseover(){

    var color = d3.scaleOrdinal()
            .domain(continents)
            .range(['#1B9E77', '#D95F02', '#7570B3', '#E7298A', '#66A61E', '#A6761D', '#666666'])

    function makeCityName(data){
        if (data.country != 'United States') {
            city = data.city + ', ' + data.country
        } else {
            city = data.city + ', ' + data.state
        }
        return city
    }

    var data = d3.select(this).data()[0],
    
        // format data
        city = makeCityName(data),
        companies = Intl.NumberFormat().format(data.companies),
        funding = '$' + data.funding_m.toFixed(2) + 'm',
        headcount = data.headcount_IQM.toFixed(2);

    d3.select('.cityInfo').style('opacity', 1)

    d3.select('#cityName').text(city)
    d3.select('#noCompanies').text(companies)
    d3.select('#medianFunding').text(funding)
    d3.select('#avgHeadcount').text(headcount)

    // highlight point
    d3.selectAll('.points')
        .attr('opacity', 0.1)
        .style('fill', 'gray')
    
    d3.select(this)
        .style('fill', d => color(d.EPI_regions))
        .attr('opacity', 0.35)

}

function setPlotTitle(newTitle){
    d3.select('#plotTitle').text(newTitle)
}

// plot points
// plotPoints()
hidePoints()