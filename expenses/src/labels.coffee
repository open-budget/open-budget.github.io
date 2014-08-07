#
#
class Labels

    #
    #
    @draw = (labels, lines, slices, level, parent) ->

        # gathering data to display
        data = []

        slices.selectAll("path")
            .filter((d) -> Helpers.level(d) == level and d.parent.code == parent.code)
            .each((d) -> data.push({label: d.name, value: d.value}))

        # settings
        width  = 450
        height = 450
        radius = Math.min(width, height) / 2

        # helpers
        pie      = d3.layout.pie().sort(null).value((d) -> d.value)
        arc      = d3.svg.arc().outerRadius(radius * .8).innerRadius(radius * .65)
        outerArc = d3.svg.arc().outerRadius(radius * .9).innerRadius(radius * .9)
        key      = (d) -> d.data.label

        ((data) ->
            text = labels.selectAll("text").data(pie(data), key)

            text.enter()
                .append("text")
                .attr("dy", ".35em")
                .attr("width", "100")
                .text((d) -> d.data.label)
                .style("opacity", 0)

            midAngle = (d) -> d.startAngle + (d.endAngle - d.startAngle) / 2

            text.transition().duration(750)
                .style("opacity", 1)
                .attrTween("transform", (d) ->
                    @_current ?= d
                    interpolate = d3.interpolate @_current, d
                    @_current = interpolate 0

                    (t) ->
                        d2 = interpolate t
                        pos = outerArc.centroid d2
                        pos[0] = radius * 1.05  * (if midAngle(d2) < Math.PI then 1 else -1)
                        "translate(#{pos})"
                )
                .styleTween("text-anchor", (d) ->
                    @_current ?= d
                    interpolate = d3.interpolate @_current, d
                    @_current = interpolate 0
                    (t) ->
                        d2 = interpolate t
                        if midAngle(d2) < Math.PI then "start" else "end"
                )

            text.exit().remove()

            polyline = lines.selectAll("polyline").data(pie(data), key)
            polyline.enter()
            .append("polyline")
            .style("opacity", 0)

            polyline.transition().duration(750)
            .style("opacity", 1)
            .attrTween("points", (d) ->
                @_current = @_current || d
                interpolate = d3.interpolate(@_current, d)
                @_current = interpolate 0

                (t) ->
                    d2 = interpolate t
                    pos = outerArc.centroid d2
                    pos[0] = radius * 1.02 * (if midAngle(d2) < Math.PI then 1 else -1)
                    [arc.centroid(d2), outerArc.centroid(d2), pos]
            )

            polyline.exit().remove()

        )(data)
