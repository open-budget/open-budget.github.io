# Drawing a partition
#
class Partition

    @draw = ->

        level = 1

        chart = d3.select("#partition")
            .append("svg")
                .attr("width", Settings.margin.left + Settings.margin.right)
                .attr("height", Settings.margin.top + Settings.margin.bottom)

        slices = chart.append("g").attr("class", "slices")
        slices.attr("transform", "translate(#{Settings.margin.left}, #{Settings.margin.top})")

        lines  = chart.append("g").attr("class", "lines")
        lines.attr("transform", "translate(#{Settings.margin.left}, #{Settings.margin.top})")

        labels = chart.append("g").attr("class", "labels")
        labels.attr("transform", "translate(#{Settings.margin.left}, #{Settings.margin.top})")

        # decreasing opacity for children partitions
        changeOpacity = ->
            slices.selectAll("path")
                .transition().duration(750)
                .style "opacity", (d) ->
                    if level < Helpers.level(d) then .2 else 1

        partition = d3.layout.partition()
            .sort((a, b) -> d3.ascending a.name, b.name)
            .size([2 * Math.PI, Settings.radius])

        d3.json Settings.url, (error, data) ->
            data = Data.preprocess data

            path = null

            zoomIn = (p) ->
                if p.depth > 1 then p = p.parent
                if not p.children then return
                level += 1
                zoom p, p

            zoomOut = (p) ->
                if level > 1
                    if not p.parent then return
                    level -= 1
                    zoom p.parent, p

            # Zoom to specified new root.
            zoom = (data, p) ->

                if document.documentElement.__transition__
                    return

                # Rescale outside angles to match the new layout
                enterArc = null
                exitArc = null
                outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI])

                insideArc = (d) ->
                    if p.key > d.key
                        depth: d.depth - 1, x: 0, dx: 0
                    else
                        if p.key < d.key
                            depth: d.depth - 1, x: 2 * Math.PI, dx: 0
                        else
                            depth: 0, x: 0, dx: 2 * Math.PI

                outsideArc = (d) ->
                    depth: d.depth + 1
                    x: outsideAngle d.x
                    dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)

                center.datum data

                # When zooming in, arcs enter from the outside and exit to the inside.
                # Enter outside arcs start from the old layout.
                if data == p
                    enterArc = outsideArc
                    exitArc = insideArc
                    outsideAngle.range([p.x, p.x + p.dx])

                path = path.data partition.nodes(data).slice(1), (d) -> d.key

                # When zooming out, arcs enter from the inside and exit to the outside.
                # Exiting outside arcs transition to the new layout.
                if data != p
                    enterArc = insideArc
                    exitArc = outsideArc
                    outsideAngle.range([p.x, p.x + p.dx])

                d3.transition().duration(750)
                    .each ->
                        path.exit().transition()
                            .style("fill-opacity", (d) -> if d.depth == 1 + (data == p) then 1 else 0)
                            .attrTween("d", (d) -> Helpers.arcTween.call @, exitArc d)
                            .remove()

                        path.enter().append("path")
                            .style("fill-opacity", (d) -> if d.depth == 2 - (data == p) then 1 else 0)
                            .style("fill", (d) -> d.fill)
                            .on("click", zoomIn)
                            .style("cursor", "pointer")
                            .on("mouseover", (d)->
                                if Helpers.level(d) == level
                                    d3.select(@).style("opacity", .6)
                            )
                            .on("mouseleave", (d)->
                                if Helpers.level(d) == level
                                    d3.select(@).transition().duration(300).style("opacity", 1)
                            )
                            .each (d) ->
                                @_current = enterArc d
                                return

                        changeOpacity()

                        Labels.draw labels, lines, slices, level, data

                        path.transition()
                            .style("fill-opacity", 1)
                            .attrTween("d", (d) -> Helpers.arcTween.call @, Helpers.updateArc d)

                        return
                return

            # Compute the initial layout on the entire tree to sum sizes.
            # Also compute the full name and fill color for each node,
            # and stash the children so they can be restored as we descend.
            partition
                .value((d) -> d.size)
                .nodes(data)
                .forEach (d) ->
                    d._children = d.children
                    d.sum = d.value
                    d.key = Helpers.key d
                    d.fill = Helpers.fill d

            # Redefine the value function to use the previously-computed sum.
            partition
                .children((d, depth) -> if depth < 2 then d._children else null)
                .value((d) -> d.sum)

            center = slices.append("circle")
                .attr("r", Settings.radius / 3)
                .on("click", zoomOut)

            center.append("title").text("zoom out")

            path = slices.selectAll("path")
                .data(partition.nodes(data).slice 1)
                .enter()
                .append("path")
                .attr("d", Helpers.arc)
                .style("fill", (d) -> d.fill)
                .style("cursor", "pointer")
                .each((d) -> @._current = Helpers.updateArc d)
                .on("click", zoomIn)
                .on("mouseover", (d)->
                    if Helpers.level(d) == level
                        d3.select(@).style("opacity", .6)
                )
                .on("mouseleave", (d)->
                    if Helpers.level(d) == level
                        d3.select(@).transition().duration(300).style("opacity", 1)
                )


            changeOpacity()
            Labels.draw labels, lines, slices, level, data

        d3.select(self.frameElement)
            .style("height", "#{Settings.margin.top + Settings.margin.bottom} px")