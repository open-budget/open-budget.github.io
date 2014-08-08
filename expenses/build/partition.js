var Data, Helpers, Labels, Partition, Settings;

Data = (function() {
  function Data() {}

  Data.flatten = function(tree) {
    var iterate, out;
    out = [];
    iterate = function(tree, level) {
      out = out.concat({
        level: level,
        name: tree.name,
        size: tree.size
      });
      if (tree.children) {
        return tree.children.map(function(c) {
          return iterate(c, level + 1);
        });
      }
    };
    iterate(tree, 0);
    return out;
  };

  Data.hierarchy = function(data, limit, isState) {
    var level;
    if (isState == null) {
      isState = data[0].area_id === 0;
    }
    if (limit == null) {
      limit = isState ? 10000 : 1000;
    }
    level = data.filter(function(e) {
      return +e.code % limit === 0;
    });
    return level.map(function(e) {
      return {
        code: e.code,
        name: e.code_name,
        size: e.total,
        children: (function() {
          var filtered, next;
          filtered = data.filter(function(nle) {
            return level.indexOf(nle) === -1 && +nle.code > +e.code && +nle.code < +e.code + limit;
          });
          if (isState) {
            if ((next = Data.hierarchy(filtered, limit / 10, isState)).length === 0) {
              return Data.hierarchy(filtered, limit / 100, isState);
            } else {
              return next;
            }
          } else {
            return Data.hierarchy(filtered, 1, isState);
          }
        })()
      };
    });
  };

  Data.preprocess = function(data) {
    return {
      name: "budget",
      children: this.hierarchy(data).filter(function(e) {
        return Settings.byDefault[0].indexOf(e.code) !== -1;
      })
    };
  };

  return Data;

})();

Helpers = (function() {
  var hue, luminance;

  function Helpers() {}

  Helpers.key = function(d) {
    var k, p;
    k = [];
    p = d;
    while (p.depth) {
      k.push(p.name);
      p = p.parent;
    }
    return k.reverse().join(".");
  };

  Helpers.level = function(d) {
    var k, p;
    k = 0;
    p = d;
    while (p.parent) {
      k++;
      p = p.parent;
    }
    return k;
  };

  hue = d3.scale.category10();

  luminance = d3.scale.sqrt().domain([0, 1e11]).clamp(true).range([80, 20]);

  Helpers.fill = function(d) {
    var c, p;
    p = d;
    while (p.depth > 1) {
      p = p.parent;
    }
    c = d3.lab(hue(p.name));
    c.l = luminance(d.sum);
    return c;
  };

  Helpers.arc = d3.svg.arc().startAngle(function(d) {
    return d.x;
  }).endAngle(function(d) {
    return d.x + d.dx - .01 / (d.depth + .5);
  }).innerRadius(function(d) {
    return Settings.radius / 3 * d.depth;
  }).outerRadius(function(d) {
    return Settings.radius / 3 * (d.depth + 1) - 1;
  });

  Helpers.arcTween = function(b) {
    var i;
    i = d3.interpolate(this._current, b);
    this._current = i(0);
    return function(t) {
      return Helpers.arc(i(t));
    };
  };

  Helpers.updateArc = function(d) {
    return {
      level: Helpers.level(d),
      depth: d.depth,
      x: d.x,
      dx: d.dx
    };
  };

  return Helpers;

})();

Labels = (function() {
  function Labels() {}

  Labels.draw = function(labels, lines, slices, level, parent) {
    var arc, data, height, key, outerArc, pie, radius, width;
    data = [];
    slices.selectAll("path").filter(function(d) {
      return Helpers.level(d) === level && d.parent.code === parent.code;
    }).each(function(d) {
      return data.push({
        label: d.name,
        value: d.value
      });
    });
    width = 450;
    height = 450;
    radius = Math.min(width, height) / 2;
    pie = d3.layout.pie().sort(null).value(function(d) {
      return d.value;
    });
    arc = d3.svg.arc().outerRadius(radius * .8).innerRadius(radius * .65);
    outerArc = d3.svg.arc().outerRadius(radius * .9).innerRadius(radius * .9);
    key = function(d) {
      return d.data.label;
    };
    return (function(data) {
      var midAngle, polyline, text;
      text = labels.selectAll("text").data(pie(data), key);
      text.enter().append("text").attr("dy", ".35em").attr("width", "100").text(function(d) {
        return d.data.label;
      }).style("opacity", 0);
      midAngle = function(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
      };
      text.transition().duration(750).style("opacity", 1).attrTween("transform", function(d) {
        var interpolate;
        if (this._current == null) {
          this._current = d;
        }
        interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2, pos;
          d2 = interpolate(t);
          pos = outerArc.centroid(d2);
          pos[0] = radius * 1.05 * (midAngle(d2) < Math.PI ? 1 : -1);
          return "translate(" + pos + ")";
        };
      }).styleTween("text-anchor", function(d) {
        var interpolate;
        if (this._current == null) {
          this._current = d;
        }
        interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2;
          d2 = interpolate(t);
          if (midAngle(d2) < Math.PI) {
            return "start";
          } else {
            return "end";
          }
        };
      });
      text.exit().remove();
      polyline = lines.selectAll("polyline").data(pie(data), key);
      polyline.enter().append("polyline").style("opacity", 0);
      polyline.transition().duration(750).style("opacity", 1).attrTween("points", function(d) {
        var interpolate;
        this._current = this._current || d;
        interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2, pos;
          d2 = interpolate(t);
          pos = outerArc.centroid(d2);
          pos[0] = radius * 1.02 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });
      return polyline.exit().remove();
    })(data);
  };

  return Labels;

})();

Partition = (function() {
  function Partition() {}

  Partition.draw = function() {
    var changeOpacity, chart, labels, level, lines, partition, slices;
    level = 1;
    chart = d3.select("#partition").append("svg").attr("width", Settings.margin.left + Settings.margin.right).attr("height", Settings.margin.top + Settings.margin.bottom);
    slices = chart.append("g").attr("class", "slices");
    slices.attr("transform", "translate(" + Settings.margin.left + ", " + Settings.margin.top + ")");
    lines = chart.append("g").attr("class", "lines");
    lines.attr("transform", "translate(" + Settings.margin.left + ", " + Settings.margin.top + ")");
    labels = chart.append("g").attr("class", "labels");
    labels.attr("transform", "translate(" + Settings.margin.left + ", " + Settings.margin.top + ")");
    changeOpacity = function() {
      return slices.selectAll("path").transition().duration(750).style("opacity", function(d) {
        if (level < Helpers.level(d)) {
          return .2;
        } else {
          return 1;
        }
      });
    };
    partition = d3.layout.partition().sort(function(a, b) {
      return d3.ascending(a.name, b.name);
    }).size([2 * Math.PI, Settings.radius]);
    d3.json(Settings.url, function(error, data) {
      var center, path, zoom, zoomIn, zoomOut;
      data = Data.preprocess(data);
      path = null;
      zoomIn = function(p) {
        if (p.depth > 1) {
          p = p.parent;
        }
        if (!p.children) {
          return;
        }
        level += 1;
        return zoom(p, p);
      };
      zoomOut = function(p) {
        if (level > 1) {
          if (!p.parent) {
            return;
          }
          level -= 1;
          return zoom(p.parent, p);
        }
      };
      zoom = function(data, p) {
        var enterArc, exitArc, insideArc, outsideAngle, outsideArc;
        if (document.documentElement.__transition__) {
          return;
        }
        enterArc = null;
        exitArc = null;
        outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);
        insideArc = function(d) {
          if (p.key > d.key) {
            return {
              depth: d.depth - 1,
              x: 0,
              dx: 0
            };
          } else {
            if (p.key < d.key) {
              return {
                depth: d.depth - 1,
                x: 2 * Math.PI,
                dx: 0
              };
            } else {
              return {
                depth: 0,
                x: 0,
                dx: 2 * Math.PI
              };
            }
          }
        };
        outsideArc = function(d) {
          return {
            depth: d.depth + 1,
            x: outsideAngle(d.x),
            dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)
          };
        };
        center.datum(data);
        if (data === p) {
          enterArc = outsideArc;
          exitArc = insideArc;
          outsideAngle.range([p.x, p.x + p.dx]);
        }
        path = path.data(partition.nodes(data).slice(1), function(d) {
          return d.key;
        });
        if (data !== p) {
          enterArc = insideArc;
          exitArc = outsideArc;
          outsideAngle.range([p.x, p.x + p.dx]);
        }
        d3.transition().duration(750).each(function() {
          path.exit().transition().style("fill-opacity", function(d) {
            if (d.depth === 1 + (data === p)) {
              return 1;
            } else {
              return 0;
            }
          }).attrTween("d", function(d) {
            return Helpers.arcTween.call(this, exitArc(d));
          }).remove();
          path.enter().append("path").style("fill-opacity", function(d) {
            if (d.depth === 2 - (data === p)) {
              return 1;
            } else {
              return 0;
            }
          }).style("fill", function(d) {
            return d.fill;
          }).on("click", zoomIn).style("cursor", "pointer").on("mouseover", function(d) {
            if (Helpers.level(d) === level) {
              return d3.select(this).style("opacity", .6);
            }
          }).on("mouseleave", function(d) {
            if (Helpers.level(d) === level) {
              return d3.select(this).transition().duration(300).style("opacity", 1);
            }
          }).each(function(d) {
            this._current = enterArc(d);
          });
          changeOpacity();
          Labels.draw(labels, lines, slices, level, data);
          path.transition().style("fill-opacity", 1).attrTween("d", function(d) {
            return Helpers.arcTween.call(this, Helpers.updateArc(d));
          });
        });
      };
      partition.value(function(d) {
        return d.size;
      }).nodes(data).forEach(function(d) {
        d._children = d.children;
        d.sum = d.value;
        d.key = Helpers.key(d);
        return d.fill = Helpers.fill(d);
      });
      partition.children(function(d, depth) {
        if (depth < 2) {
          return d._children;
        } else {
          return null;
        }
      }).value(function(d) {
        return d.sum;
      });
      center = slices.append("circle").attr("r", Settings.radius / 3).on("click", zoomOut);
      center.append("title").text("zoom out");
      path = slices.selectAll("path").data(partition.nodes(data).slice(1)).enter().append("path").attr("d", Helpers.arc).style("fill", function(d) {
        return d.fill;
      }).style("cursor", "pointer").each(function(d) {
        return this._current = Helpers.updateArc(d);
      }).on("click", zoomIn).on("mouseover", function(d) {
        if (Helpers.level(d) === level) {
          return d3.select(this).style("opacity", .6);
        }
      }).on("mouseleave", function(d) {
        if (Helpers.level(d) === level) {
          return d3.select(this).transition().duration(300).style("opacity", 1);
        }
      });
      changeOpacity();
      return Labels.draw(labels, lines, slices, level, data);
    });
    return d3.select(self.frameElement).style("height", "" + (Settings.margin.top + Settings.margin.bottom) + " px");
  };

  return Partition;

})();

Settings = (function() {
  function Settings() {}

  Settings.margin = {
    top: 350,
    right: 500,
    bottom: 350,
    left: 500
  };

  Settings.radius = Math.min(Settings.margin.top, Settings.margin.bottom, Settings.margin.right, Settings.margin.left) - 10;

  Settings.url = "https://api.open-budget.org/v1/expenses.json?area_id=0&year=2014";

  Settings.byDefault = {
    0: ["0110000", "0300000", "0410000", "0500000", "0600000", "0650000", "0700000", "0750000", "0800000", "0900000", "3100000"]
  };

  return Settings;

})();
