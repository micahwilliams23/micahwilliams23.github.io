
// load data from local json
const us_states = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/state_info.json')
const us_cities = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/us_info.json')
const stateShapes = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/states-10m.json')
const tags = d3.json('https://raw.githubusercontent.com/micahwilliams23/harmonic_data/main/testSite/tags.json')

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

d3.select('.tooltip').style('display', 'none')

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
var xLog = d3.scaleLog()
    .domain([])
    .range([margin.left, width + margin.left - margin.right]);

var x = d3.scaleLinear()
    .domain([])
    .range([margin.left, width + margin.left - margin.right]);

svg.append('g')
    .classed('axis xAxis', 'true')
    .attr('transform', 'translate(0,' + (height - margin.bottom) + ')');

// add y axis
var y = d3.scaleLinear()
    .domain([])
    .range([height - margin.bottom, margin.top]);

svg.append('g')
    .classed('axis yAxis', 'true')
    .attr('transform', 'translate(' + margin.left + ',0)');

// add y axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('id', 'yAxisTitle')
    .attr('text-anchor', 'middle')
    .attr('y', - margin.left * 0.2)
    .attr('x', - height / 2)
    .attr('transform', 'rotate(-90)')

// add x axis title
svg.append('text')
    .classed('axisTitle', 'true')
    .attr('id', 'xAxisTitle')
    .attr('text-anchor', 'middle')
    .attr('y', height + margin.bottom / 2)
    .attr('x', width / 2 + margin.left / 2)

// add plot title
svg.append('text')
    .attr('id', 'plotTitle')
    .classed('plotTitles', 'true')
    .attr('y', margin.top / 2 - 10)
    .attr('x', margin.left + 10)
    .text('')

// add plot title
svg.append('text')
    .attr('id', 'plotSubtitle')
    .classed('plotTitles', 'true')
    .attr('y', margin.top / 2 - 10 + 25)
    .attr('x', margin.left + 10)
    .text('')

// add containers
svg.append('g').attr('id', 'scatterplot')
svg.append('g').attr('id', 'tagPlot')
svg.append('g').attr('id', 'mapGroup')
d3.select('#extras').append('g').attr('id', 'tagsMenu')

}

function hideBaseLayer(){
    d3.selectAll('.axisTitle').style('opacity', 0)
    d3.selectAll('.axis').style('opacity', 0)
    d3.select('#dataToggles').style('opacity', 0)
}

function fadeOut(className, duration = 500){
    d3.selectAll(className)
        .transition()
        .duration(duration)
        .style('opacity', 0)
}

function fadeIn(className, duration = 500){
    d3.selectAll(className)
        .transition()
        .duration(duration)
        .style('opacity', 1)
}

// add points for scatterplot
function plotPoints(){

    // change titles and axes
    setPlotTitle('Average Headcount vs. Median Funding in Top US Cities')
    setPlotSubtitle('Sixteen of the top fifty American cities are in California.')
    setXAxisTitle('Median Funding ($M)')
    setYAxisTitle('Average Headcount (IQM)')

    us_cities.then(function(d){

        d = d.sort((a, b) => b.companies - a.companies)
             .filter((d, i) => i < 50 && d.median > 0.5)

        var yMin, yMax;

        // scale for sizing
        var r = d3.scaleSqrt()
            .domain([0, 6000])
            .range([3,30]);

        // scale for delaying point
        var delayScale = d3.scaleLinear()
            .domain([0, 99])
            .range([0,500]);
        
        d.forEach((d, i) => {
            d.rank = i+1;
            if(d.headcount_IQM < yMin || yMin === undefined){yMin = d.headcount_IQM}
            if(d.headcount_IQM > yMax || yMax === undefined){yMax = d.headcount_IQM}
        })

        // new y axis
        y.domain([0, yMax]).nice()
        svg.select(".yAxis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));
        
        // new x axis
        xLog.domain([0.5, 20])
        svg.select(".xAxis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(xLog).tickValues([0.5,1,3,10,30]).tickFormat(d => '$' + d + 'm'));

        // subset of data to label
        var labelled_cities = ['New York', 'San Francisco', 'Boston', 'Seattle', 'Sunnyvale', 'Redwood City', 'Durham', 'Waltham']
        var labelDir = [-135, 45, -45, 100, 45, -180, 45, -180]
        var labels = d.filter(d => labelled_cities.includes(d.city)).map(function(d, i){
            function state(x){
                if(x == 'California'){return 'Calif.'}
                if(x == 'New York'){return 'N.Y.'}
                if(x == 'Massachusetts'){return 'Mass.'}
                if(x == 'North Carolina'){return 'N.C.'}
                if(x == 'Washington'){return 'Wash.'}
                else {return x}
            }
            d.label = d.city + ', ' + state(d.state)
            d.x = Math.cos(labelDir[i] * Math.PI / 180) * 2.5 * r(d.companies)
            d.y = Math.sin(labelDir[i] * Math.PI / 180) * 2.5 * r(d.companies)
            
            return {
                'label': d.label,
                'city': d.city,
                'state': d.state,
                'x': xLog(d.median) + d.x,
                'y': y(d.headcount_IQM) + d.y,
                'x0': xLog(d.median),
                'y0': y(d.headcount_IQM),
                'text_anchor': ['end', 'start', 'start', 'end', 'start', 'end', 'start', 'end'][i]
            }
        })
            
        svg.select('#scatterplot')
            .selectAll('.points')
            .data(d)
            .enter()
            .append('circle')
            .classed('points', 'true')
            .attr('cx', d => xLog(d.median))
            .attr('cy', d => y(d.headcount_IQM))
            .attr('r', 0)
            .style('fill', '#0077b6')
            .on('mouseover', mouseoverPt)
            .on('mousemove', (event) => mousemovePt(event))
            .on('mouseleave', mouseleavePt)
            .transition()
            .duration(350)
            .style('opacity', 0.6)
            .attr('r', d => r(d.companies))
            .delay((d, i) => delayScale(i));;

        svg.select('#scatterplot')
            .selectAll('.labels')
            .data(labels).enter()
            .append('text')
            .classed('labels', 'true')
            .attr('x', d=>d.x)
            .attr('y', d=>d.y + 5)
            .attr('text-anchor', d => d.text_anchor)
            .text(d => d.label)
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1);

        svg.select('#scatterplot')
            .selectAll('.labelLines')
            .data(labels).enter()
            .append('line')
            .classed('labelLines', 'true')
            .attr('x1', d => d.x)
            .attr('x2', d => d.x0)
            .attr('y1', d => d.y)
            .attr('y2', d => d.y0)
            .attr('stroke', '#0077b6')
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1);

        var titlePos = document.querySelector('#plotTitle').getBoundingClientRect()
        
        // make search bar
        d3.select('#extras')
            .append('input')
            .attr('id', 'searchBar')
            .attr('type', 'search')
            .attr('placeholder', 'Search for a city or state: (ex. "Boston" or "Texas")')
            .style('display', 'block')
            .style('top', titlePos.y + 60 + 'px')
            .style('left', titlePos.x + 'px')
            .on('keyup', filterPts)

        fadeIn('.axis')

    })
}

// add points for scatterplot
function plotTags(){

    setPlotTitle('Average Headcount vs. Median Funding by Technology Type')
    setPlotSubtitle('Highly funded correlates with higher headcounts, except in industries like Nanotechnology, Biotech, and Medical Devices.')
    setXAxisTitle('Median Funding ($M)')
    setYAxisTitle('Average Headcount (IQM)')


    tags.then(function(d){

        d = d.filter(d => d.tag != 'Agriculture')

        var delayScale = d3.scaleLinear()
            .domain([0, d.length])
            .range([0,500]);

        // scale for sizing
        var r = d3.scaleSqrt()
            .domain([0, Math.max(...d.map(d => d.data.length))])
            .range([3,20]);

        var yMin, yMax;

        d.forEach((d, i) => {
            d.rank = i+1;
            if(d.headcount_IQM < yMin || yMin === undefined){yMin = d.headcount_IQM}
            if(d.headcount_IQM > yMax || yMax === undefined){yMax = d.headcount_IQM}
        })

        // new y axis
        y.domain([0, yMax]).nice()
        svg.select(".yAxis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));
        
        // new x axis
        var xExtent = d3.extent(d.map(d => d.median))
        xLog.domain(xExtent)
        svg.select(".xAxis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(xLog).tickFormat((d, i) => {
                if(d%5==0|i==0|d==1){return '$' + d + 'm'}}));

        // subset of data to label
        var labelled_tags = [
            'Biotechnology',
            'Business Software Services',
            'Chemical / Life Sciences', 
            'Communications Technology',
            'Social / Civic / Gov Tech',
            'Cloud Infrastructure', 
            'Financial Technology', 
            'Health / Wellness', 
            'Nanotechnology', 
            'Next Gen Computing'
        ]

        var labelDir = [45, -135, -135, 135, 85, 135, -135, -135, 45, -135]
        var labels = d.filter(d => labelled_tags.includes(d.tag))
            .map(function(d, i){

            d.x = Math.cos(labelDir[i] * Math.PI / 180) * 2.5 * r(d.data.length)
            d.y = Math.sin(labelDir[i] * Math.PI / 180) * 2.5 * r(d.data.length)

            function anchor(x){
                if(Math.abs(x) < 90){return 'start'}
                else if(Math.abs(x) > 90){return 'end'}
                else {return 'middle'}
            }
            
            return {
                'tag': d.tag,
                'label': d.tag,
                'tag_type': d.tag_type,
                'x': xLog(d.median) + d.x,
                'y': y(d.headcount_IQM) + d.y,
                'x0': xLog(d.median),
                'y0': y(d.headcount_IQM),
                'text_anchor': anchor(labelDir[i])
            }
        })

        console.log(labels)

        svg.select('#tagPlot')
            .selectAll('.labels')
            .data(labels).enter()
            .append('text')
            .classed('labels', 'true')
            .attr('x', d=>d.x)
            .attr('y', d=>d.y + 5)
            .attr('text-anchor', d => d.text_anchor)
            .text(d => d.label)
            .style('opacity', 0);

        svg.select('#tagPlot')
            .selectAll('.labelLines')
            .data(labels).enter()
            .append('line')
            .classed('labelLines', 'true')
            .attr('x1', d => d.x)
            .attr('x2', d => d.x0)
            .attr('y1', d => d.y)
            .attr('y2', d => d.y0)
            .attr('stroke', 'gray')
            .style('opacity', 0);
        
        var titlePos = document.querySelector('#plotTitle').getBoundingClientRect()

        // make tag type toggle
        d3.select('#tagsMenu')
            .style('display', 'block')
            .style('position', 'absolute')
            .style('top', titlePos.y + 60 + 'px')
            .style('left', titlePos.x + 'px')

        d3.select('#tagsMenu') 
            .append('label')
            .attr('for', 'tagTypes')
            .text('Select tag type: ')

        d3.select('#tagsMenu')
            .append('select')
            .attr('name', 'tagTypes')
            .attr('id', 'tagTypes')
            .on('change', filterTags)

        var types = [
            {'label': 'Technology', 'value' : 'tech'},
            {'label': 'Industry', 'value' : 'industry'}
        ]
        d3.select('#tagTypes')
            .selectAll('.tagOption')
            .data(types).enter()
            .append('option')
            .attr('value', d => d.value)
            .text(d => d.label)
    
        svg.select('#tagPlot')
            .style('opacity', 1)
            .selectAll('.points')
            .data(d)
            .enter()
            .append('circle')
            .classed('points', 'true')
            .attr('cx', d => xLog(d.median))
            .attr('cy', d => y(d.headcount_IQM))
            .attr('r', d => r(d.data.length))
            .style('fill', d => d.tag_type == 'tech' ? '#00b677' : '#b60077')
            .style('opacity', 0)
            .on('mouseover', mouseoverTag)
            .on('mousemove', (event) => mousemovePt(event))
            .on('mouseleave', mouseleaveTag)
            .on('click', clickPt);

        // show only points with selected tag type
        filterTags()

    })
}

// hide points before replotting
function hidePoints(){
    fadeOut('.points')
    fadeOut('#searchBar')
    fadeOut('.labels')
    fadeOut('.labelLines')

    setTimeout(() => {
        svg.select('#scatterplot').selectAll('.points').remove()
        d3.select('#searchBar').remove()
        svg.select('#scatterplot').selectAll('.labelLines').remove()
        svg.select('#scatterplot').selectAll('.labels').remove()
    }, 500);
}

function filterPts(){

    var points = d3.selectAll('.points');
    var labels = svg.select('#scatterplot').selectAll('.labels'),
        labelLines = svg.select('#scatterplot').selectAll('.labelLines');
    var query = document.querySelector('#searchBar').value.toLowerCase();

    points.style('fill', '#0077b6').style('opacity', 0.1)
    if(query == ''){
        points.style('fill', '#0077b6').style('opacity', 0.6)
        labels.style('opacity', 1)
        labelLines.style('opacity', 1)
    }

    if(query != ''){
        labels.style('opacity', 0.1)
        labelLines.style('opacity', 0.1)
    }

    // highlight point
    d3.selectAll('.points')
        .attr('opacity', 0.1)
        .style('fill', 'gray')
    
    // recolor points that match search
    points.data().forEach((d, i) => {
        if(d.state.toLowerCase().startsWith(query) || d.city.toLowerCase().startsWith(query)){
            var match = points['_groups'][0][i]
            match.style.fill = '#0077b6'
            match.style.opacity = 0.6
        }
    })
    
    // show labels that match
    labels.data().forEach((d, i) => {
        if(d.city.toLowerCase().startsWith(query) || d.state.toLowerCase().startsWith(query)){
            var match = labels['_groups'][0][i]
            match.style.opacity = 1
        }
    })

    // show label lines that match
    labels.data().forEach((d, i) => {
        if(d.city.toLowerCase().startsWith(query) || d.state.toLowerCase().startsWith(query)){
            var match = labelLines['_groups'][0][i]
            match.style.opacity = 1
        }
    })
}

function filterTags(){

    fadeOut('.points', 250)
    fadeOut('.labels', 250)
    fadeOut('.labelLines', 250)

    svg.select('#tagPlot')
        .selectAll('.points')
        .transition()
        .duration(500)
        .style('opacity', d => d.tag_type == document.querySelector('#tagTypes').value ? '0.6' : '0')
        .delay((d, i) => 250 + i * 10)
    
    svg.select('#tagPlot')
        .selectAll('.labels')
        .transition()
        .duration(500)
        .style('opacity', d => d.tag_type == document.querySelector('#tagTypes').value ? 1 : 0)
        .delay((d, i) => 500 + i * 50)
    
    svg.select('#tagPlot')
        .selectAll('.labelLines')
        .transition()
        .duration(500)
        .style('opacity', d => d.tag_type == document.querySelector('#tagTypes').value ? 1 : 0)
        .delay((d, i) => 500 + i * 50)

    setTimeout(() => {
        svg.select('#tagPlot')
            .selectAll('.points')
            .style('display', d => d.tag_type == document.querySelector('#tagTypes').value ? 'block' : 'none') 
    }, 500);
}

function hideTags(){

    fadeOut('#tagPlot')
    fadeOut('#tagsMenu')
    setTimeout(() => {
        svg.select('#tagPlot').selectAll('.points').remove()
        svg.select('#tagPlot').selectAll('.labels').remove()
        svg.select('#tagPlot').selectAll('.labelLines').remove()
        d3.select('#tagsMenu').selectAll('label').remove()
        d3.select('#tagsMenu').selectAll('select').remove()
        
    }, 500);


}

// restore opacity
function mouseleavePt(){

    // remove info
    d3.select('.tooltip').select('table').remove()
    d3.select('.tooltipTagList').remove()
    
    // hide tooltip
    d3.select('.tooltip')
        .style('opacity', 0)
        .style('display', 'none')

    if(document.querySelector('#searchBar').value == ''){
        // return points to regular opacity and color
        d3.selectAll('.points')
            .style('fill', '#0077b6')
            .attr('opacity', 0.6);
    }
}

function mousemovePt(event){

    
    // console.log(tooltip.offsetHeight)

    var tooltip = document.querySelector('.tooltip'),
        window = document.querySelector('#svgDiv'),
        yPos = Math.min(window.offsetHeight - tooltip.offsetHeight - 30, event.clientY)

    d3.select('.tooltip')
        .style('left', (event.clientX+20) + 'px')
        .style('top', yPos + 'px');

}

// highlight point on mouseover
function mouseoverPt(){

    var data = d3.select(this).data()[0],
    
        // format data
        city = data.city + ', ' + data.state,
        companies = Intl.NumberFormat().format(data.companies),
        funding = '$' + data.median.toFixed(2) + 'm',
        headcount = data.headcount_IQM.toFixed(2),
        query = document.querySelector('#searchBar').value;

        rownames = ['City:', 'Median Funding:', 'Avg. Headcount:', '# Companies:']
        info = [city, funding, headcount, companies];

        // combine data for table
        info.map((d, i) => {
            return info[i] = [rownames[i], info[i]]
        })
        
    if(query == '' | data.city.toLowerCase().startsWith(query.toLowerCase()) | data.state.toLowerCase().startsWith(query.toLowerCase())){

        d3.select('.tooltip')
            .style('opacity', 1)
            .style('display', 'block')

        // create frequency table of tags
        var top_tags = {}
        data.data.forEach(d => {
            if(d.tech_tags){
                var tags = d.tech_tags.replaceAll(/[^A-Za-z0-9_ /,]/g, '').split(',')
                tags.forEach(tag => {
                    if(tag == ''){
                        return
                    } else if(Object.keys(top_tags).includes(tag)){
                        top_tags[tag].value += 1
                    } else {
                        top_tags[tag] = {
                            'key': tag,
                            'value': 1
                        }
                    }
                })
            }
        })

        // select tag names from top 5 most freq tags
        top_tags = Object.values(top_tags).sort((a,b) => b.value - a.value).slice(0,5).map(d => d.key)

        // add table and info
        d3.select('.tooltip').append('table')
            .style('table-layout', 'fixed')
            .selectAll('tr')
            .data(info)
            .enter()    
            .append('tr')
            .classed('tooltipRownames', 'true')
            .append('td')
            .html(d => d[0] + ' <span style=\'font-weight:bolder\'>' + d[1] + '</span>')

        d3.select('.tooltip').append('g')
            .classed('tooltipTagList', 'true')

        d3.select('.tooltipTagList')
            .append('text')
            .text('Top Industries:')
        
        d3.select('.tooltipTagList')
            .append('ol')
            .style('margin', '5px')
            .selectAll('li')
            .data(top_tags)
            .enter()
            .append('li')
            .text(d => d)
    }
    
    // change color if search bar is empty, else keep colors from filter
    if(query == ''){
        // highlight point
        d3.selectAll('.points')
            .attr('opacity', 0.1)
            .style('fill', 'gray')
        
        d3.select(this)
            .style('fill', '#0077b6')
            .attr('opacity', 0.6)
    }
}

// restore opacity
function mouseleaveTag(){

    // remove info
    d3.select('.tooltip').select('table').remove()
    d3.select('.tooltipTagList').remove()
    
    // hide tooltip
    d3.select('.tooltip')
        .style('opacity', 0)
        .style('display', 'none')

    // return points to regular opacity and color
    d3.select('#tagPlot').selectAll('.points')
        .style('fill', d => d.tag_type == 'tech' ? '#00b677' : '#b60077')
        .style('opacity', 0.6);
}

// highlight point on mouseover
function mouseoverTag(){

    var data = d3.select(this).data()[0],
    
        // format data
        tag = data.tag,
        companies = Intl.NumberFormat().format(data.data.length),
        funding = '$' + data.median.toFixed(2) + 'm',
        headcount = data.headcount_IQM.toFixed(2);

        rownames = ['Tag:', 'Median Funding:', 'Avg. Headcount:', '# Companies:']
        info = [tag, funding, headcount, companies];

        // combine data for table
        info.map((d, i) => {
            return info[i] = [rownames[i], info[i]]
        })
        
        d3.select('.tooltip')
            .style('opacity', 1)
            .style('display', 'block')

        // add table and info
        d3.select('.tooltip').append('table')
            .style('table-layout', 'fixed')
            .selectAll('tr')
            .data(info)
            .enter()    
            .append('tr')
            .classed('tooltipRownames', 'true')
            .append('td')
            .html(d => d[0] + ' <span style=\'font-weight:bolder\'>' + d[1] + '</span>')

        d3.select('.tooltip').append('g')
            .classed('tooltipTagList', 'true')

        d3.select('.tooltipTagList')
            .append('text')
            .text('Top Cities:')
        
        d3.select('.tooltipTagList')
            .append('ol')
            .style('margin', '5px')
            .selectAll('li')
            .data(data.top_cities)
            .enter()
            .append('li')
            .text(d => d)

    // highlight point
    d3.selectAll('.points')
        .style('opacity', d => d.tag_type == document.querySelector('#tagTypes').value ? '0.1' : '0')
        .style('fill', 'gray')
    
    d3.select(this)
        .style('opacity', 0.6)
        .style('fill', d => d.tag_type == 'tech' ? '#00b677' : '#b60077')
}

function setPlotTitle(newTitle){
    d3.select('#plotTitle').text(newTitle)
}
function setPlotSubtitle(newTitle){
    d3.select('#plotSubtitle').text(newTitle)
}
function setXAxisTitle(newTitle){
    d3.select('#xAxisTitle').text(newTitle)
}
function setYAxisTitle(newTitle){
    d3.select('#yAxisTitle').text(newTitle)
}

function showBaseLayer(){
    d3.selectAll('.axisTitle')
        .transition()
        .duration(500)
        .style('opacity', 1)

    d3.selectAll('.axis')
        .transition()
        .duration(500)
        .style('opacity', 1)
    
    d3.selectAll('.xAxis')
        .transition()
        .duration(500)
        .style('opacity', 1)

    d3.select('#dataToggles')
        .transition()
        .duration(500)
        .style('opacity', 1)
}

function showPoints(){

    // plot points
    plotPoints()

    // fade in search and axes
    fadeIn('#searchBar')
    fadeIn('.axisTitle')
    fadeIn('.labels')
    fadeIn('.labelLines')

}

function showTags(){

    fadeIn('#tagsMenu')
    hidePoints()
    plotTags()
}

showPoints()
fadeOut('#plotTitle')
fadeOut('#plotSubtitle')