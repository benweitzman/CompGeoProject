function fitToContainer(canvas){
  // Make it visually fill the positioned parent
  canvas.style.width ='100%';
  canvas.style.height='500px';
  // ...then set the internal size to match
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
if (CP.lineTo) {
    CP.dashedLine = function(x, y, x2, y2, da) {
        if (!da) da = [10,5];
        this.save();
        var dx = (x2-x), dy = (y2-y);
        var len = Math.sqrt(dx*dx + dy*dy);
        var rot = Math.atan2(dy, dx);
        this.translate(x, y);
        this.moveTo(0, 0);
        this.rotate(rot);       
        var dc = da.length;
        function fitToContainer(canvas){
  // Make it visually fill the positioned parent
  canvas.style.width ='100%';
  canvas.style.height='100%';
  // ...then set the internal size to match
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
var di = 0, draw = true;
        x = 0;


        while (len > x) {
            x += da[di++ % dc];
            if (x > len) x = len;
            draw ? this.lineTo(x, 0): this.moveTo(x, 0);
            draw = !draw;
        }       
        this.restore();
    }
}

function Point (x, y) {
    this.x = x;
    this.y = y;
    this.isSteiner = false;

    this.distance = function (p) {
        return Math.sqrt(Math.pow(p.x - this.x) + Math.pow(p.y - this.y));
    };

    this.dot = function (p) {
        return this.x * p.x + this.y * p.y;
    };

    this.scalarMult = function (scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    };

    this.subtract = function (p) {
        return this.add(p.scalarMult(-1));
    };

    this.add = function (p) {
        return new Point(this.x + p.x, this.y + p.y);
    };

    this.cross = function (p) {
        return this.x * p.y - p.x * this.y;
    };

    this.thetaTo = function (p) {
        return Math.atan2(this.y-p.y,this.x-p.x);
    }

    this.leftTurn = function (p2, p3) {
        return (p2.x-this.x)*(p3.y-this.y)-(p2.y-this.y)*(p3.x-this.x) > 0
        // var v1 = p2.subtract(this);
        // var v2 = p3.subtract(p2);
        // if (v1.cross(v2) < 0) {
        //     return true;
        // }
        // return false;
    };

    this.rightTurn = function (p2, p3) {
        return (p2.x-this.x)*(p3.y-this.y)-(p2.y-this.y)*(p3.x-this.x) > 0
        // var v1 = p2.subtract(this);
        // var v2 = p3.subtract(p2);
        // if (v1.cross(v2) > 0) {
        //     return true;
        // }
        // return false;
    };

    this.draw = function (context,fillStyle) {
        fillStyle = typeof fillStyle !== 'undefined' ? fillStyle : "red";
        context.beginPath();
        context.arc(this.x, context.canvas.height-this.y, 3, 0, 2 * Math.PI, false);
        context.fillStyle = fillStyle;
        context.fill();
    };

    this.canSee = function (p,pgon) {
        s = new LineSegment(this,p).scale(0.99).reverse().scale(0.99).reverse();
        mid = s.midpoint();
        intersections = s.polygonIntersections(pgon);
        if (intersections.length == 0) {
            if (pgon.containsPoint(mid)) {
                return true;
            } else {
                return false;
            }
        };
        intersections.sort(function (p1, p2) {
            return p1.distance(this)-p2.distance(this);
        });
        if (intersections[0].distance(p) < 0.005) {
            if (pgon.containsPoint(mid)) {
                return true;
            }
        }
        return false;
    }

}
Vector = Point;

function Line (a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;

    this.intersection = function (l) {
        if (this.a * l.b - this.b * l.a == 0) return undefined;
        a = this.a;
        b = this.b;
        e = this.c;
        c = l.a;
        d = l.b;
        f = l.c;
        return new Point((e*d-b*f)/(a*d-b*c),(a*f-e*c)/(a*d-b*c))
    };
}

function Ray(p,theta) {
    this.p = p;
    this.theta = theta;

    this.segmentIntersection = function (s) {
        lineIntersection = s.lineIntersection(this.toLine());
        if (lineIntersection == undefined) return undefined;
        d = new Point(this.p.x+Math.cos(theta), this.p.y+Math.sin(theta));
        // x(t) = (p.x + (d.x-p.x)*t)
        // y(y) = (p.y + (d.y-p.y)*t)
        // t = (x(t)-p.x)/(d.x-p.x)
        if ((lineIntersection.x-this.p.x)/(d.x-this.p.x) >= 0) return lineIntersection;
        return undefined;
    };

    this.toLine = function (s) {
        return new LineSegment(p,new Point(this.p.x+Math.cos(theta),
                                           this.p.y+Math.sin(theta))).toLine();
    };

    this.polygonIntersections = function (pgon) {
        r = this;
        return pgon.edges().map(function (e) {
            return r.segmentIntersection(e);
        }).filter(function (x) { return x != undefined })
    }
}

function LineSegment (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;

    this.midpoint = function () {
        return new Point((this.p1.x+this.p2.x)/2, (this.p1.y+this.p2.y)/2);
    }

    this.scale = function (factor) {
        dx = this.p2.x-this.p1.x;
        dy = this.p2.y-this.p1.y;
        return new LineSegment(p1, new Point(p1.x + dx * factor,
                                             p1.y + dy * factor));
    }

    this.reverse = function () {
        return new LineSegment(this.p2, this.p1);
    }

    this.intersects = function (s) {
        return (this.p1.rightTurn(s.p1, s.p2) != this.p2.rightTurn(s.p1, s.p2)) &&
                (s.p1.rightTurn(this.p1, this.p2) != s.p2.rightTurn(this.p1, this.p2));
    };

    this.intersection = function (s) {
        if (!this.intersects(s)) return undefined;
        return this.toLine().intersection(s.toLine())
    };

    this.lineIntersection = function (l) {
        p = this.toLine().intersection(l);
        if (p == undefined) return undefined;
        if (p.x >= Math.min(this.p1.x, this.p2.x) && 
            p.x <= Math.max(this.p1.x, this.p2.x) &&
            p.y >= Math.min(this.p1.y, this.p2.y) &&
            p.y <= Math.max(this.p1.y, this.p2.y)) {
            return p;
        }
        return undefined;
    };

    this.toLine = function () {
        return new Line(this.p1.y - this.p2.y,
                        this.p2.x - this.p1.x,
                        -1*((this.p1.x - this.p2.x) * this.p1.y + (this.p2.y - this.p1.y) * this.p1.x));
    };

    this.polygonIntersections = function (pgon) {
        s = this;
        return pgon.edges().map(function (e) {
            return s.intersection(e);
        }).filter(function (x) { return x != undefined })
    }

    this.toRay = function () {
        theta = this.p1.thetaTo(this.p2);
        return new Ray(this.p1,theta);
    }

    this.containsPoint = function (p) {
        // x(t) = (p1.x+(p2.x-p1.x)*t)
        // y(t) = (p1.y+(p2.y-p1.y)*t)
        // p is on s if we can solve for t and 0<=t<=1
        tx = (p.x-this.p1.x)/(this.p2.x-this.p1.x);
        ty = (p.y-this.p1.y)/(this.p2.y-this.p1.y);
        if (this.p2.x-this.p1.x==0) tx = ty;
        if (this.p2.y-this.p1.y==0) ty = tx;
        if (Math.abs(tx-ty)<0.001 && tx >= 0 && tx <= 1) return true;
        return false;
    };

    this.draw = function (context,color) {
        color = typeof color !== 'undefined' ? color : "#000";
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(p1.x, context.canvas.height-p1.y);
        context.lineTo(p2.x, context.canvas.height-p2.y);
        context.closePath();
        context.stroke();
    };
}

function Polygon (pointList) {
    this.pointList = pointList;
    this.points = function () {
        return this.pointList;
    };

    this.push = function (p) {
        this.pointList.push(p);
    };

    this.pop = function () {
        return this.pointList.pop();
    };

    this.map = function (f) {
        return this.pointList.map(f);
    };

    this.edges = function () {
        return this.pointList.map(function (p, index, array) {
            return new LineSegment(p, array[(index + 1) % array.length]);
        });
    };

    this.segmentIntersections = function (s) {
        return this.edges().map(function (e) {
            return e.intersection(s);
        }).filter(function (p) {return p != undefined});  
    };

    this.lineIntersections = function (l) {
        return this.edges().map(function (e) {
            return e.lineIntersection(l);
        }).filter(function (p) {return p != undefined});
    };

    this.containsPoint = function (p) {
        return this.lineIntersections(new LineSegment(p,
                                                 new Point(p.x,p.y+1)
                                                ).toLine()).filter(
                                                            function (a) { 
                                                                return a.y > p.y 
                                                            }).length%2 == 1;
    };

    this.visibleFrom = function (p) {
        if (!this.containsPoint(p)) return undefined;
        edges = this.edges();
        pl = this.pointList;
        var stack = [pl[0]];
        var condition = undefined;
        for (i=0;i<pl.length-1;i++) {
            point = pl.slice(1)[i];
            t = stack[stack.length-1]; // t for top
            if (p.rightTurn(t,point) && condition == undefined) {
                stack.push(point);
            } else {
                if (stack.length < 2 || point.rightTurn(stack[stack.length-1],stack[stack.length-2])) {
                    // upward backtrack
                    if (condition == undefined) {
                        condition = function (pp) {
                            e = new LineSegment(pp,pl[(i+2)%pl.length]);
                            l = new LineSegment(p,t).toLine()
                            newPoint = e.lineIntersection(l);
                            if (newPoint) newPoint.isSteiner = true;
                            return newPoint;
                        };
                    } 
                    newPoint = condition(point);
                    if (newPoint != undefined) {
                        stack.push(newPoint);
                        condition = undefined;
                    }
                } else {
                    // downward backtrack
                    l = new LineSegment(p,point).toLine();
                    newPoint = new LineSegment(stack[stack.length-1],stack[stack.length-2]).lineIntersection(l);
                    while (newPoint == undefined) {
                        stack.pop();
                        newPoint = new LineSegment(stack[stack.length-1],stack[stack.length-2]).lineIntersection(l);
                    }
                    newPoint.isSteiner = true;
                    stack.pop();
                    stack.push(newPoint);
                    stack.push(point);
                }
            }
        }
        return new Polygon(stack);
    };

    this.draw = function (context, fillStyle, lineStyle) {
        fillStyle = typeof fillStyle !== 'undefined' ? fillStyle : "rgba(0,255,0,0.1)";
        lineStyle = typeof lineStyle !== 'undefined' ? lineStyle : "#000";
        context.strokeStyle = lineStyle
         context.fillStyle = fillStyle
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(this.pointList.x, context.canvas.height-this.pointList.y);
        this.pointList.slice(1).concat(this.pointList.slice(0,1)).map(function (p) {
            context.lineTo(p.x,context.canvas.height-p.y);
        });
        context.closePath();
        context.stroke();
        context.fill();
        // this.points()[0].draw(context,"blue");
    };
}

function getCanvas() {
  return document.getElementById('canvas');
}
var points = [
              new Point(500,350),
              new Point(300, 0),
              new Point(250,230),
              new Point(50,100),
              new Point(120,250),
              new Point(0, 400),
              new Point(300, 500)
              ].reverse()
var visFromPoint = new Point(499,350)
var pointsPolygon = new Polygon(points);
var visPolygon = pointsPolygon.visibleFrom(visFromPoint);
var angle = 1.5708;
var mode = "hasntStarted";
var ticker = 0;
var tweenPercent = 0;
var kernelPoint = undefined;
var numPoints = 20;
var mousePoint = new Point(0,0);

window.addEventListener('load', function() {

    var canvas = getCanvas();
    fitToContainer(canvas);
    if(canvas && canvas.getContext) {
        var context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#fFf';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    canvas.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('keypress',keyPress,false);
    window.setInterval(update,1000/50);
    $("#generatePoints").on('click', function () {
        randomPoints = []
        randomPointTargets = []
        sumX = 0, sumY = 0;
        for (i=0;i<numPoints;i++) {
            randX = Math.random()*(canvas.width-100)+50;
            randY = Math.random()*(canvas.height-100)+50;
            sumX += randX;
            sumY += randY;
            randomPointTargets.push(new Point(randX,randY));
        }
        avgX = sumX/numPoints;
        avgY = sumY/numPoints;
        avgPoint = new Point(avgX,avgY);
        kernelPoint = avgPoint;
        randomPointTargets.sort(function (a, b) {
            return avgPoint.thetaTo(a)-avgPoint.thetaTo(b);
        });
        for (i=0;i<randomPointTargets.length;i++) {
            randomPoints.push(new Point(avgX,avgY));
        }
        mode = "generatePoints";
        $("#hasntStarted").fadeOut(function () {
            $("#hasStarted").fadeIn();
            $("#next").attr("disabled","");
        });
        $("#toBegin").fadeOut(function () {
            $("#start").fadeIn();
        })
    });
    $("#restartWithPoints").on('click', function () {
        mode = "fadeToPolygon"
        tweenPercent = 0;
        $("#info").children(":gt(1)").not("#start").fadeOut(function () {
            if (!$("#start").is(":visible")) {
                $("#start").fadeIn();
            }
        });
    });
    $("#restart").on('click', function () {
        mode = "hasntStarted";
        $("#hasStarted").fadeOut(function () {
            $("#hasntStarted").fadeIn();
        });
        $("#info").children(":gt(1)").not("#toBegin").fadeOut(function () {
            if (!$("#toBegin").is(":visible")) {
                $("#toBegin").fadeIn();
            }
        })
    })
    $("#addPoints").on('click', function () {
        $("#hasntStarted").fadeOut(function () {
            $("#addPointsButtons").fadeIn();
        });
        $("#toBegin").fadeOut(function () {
            $("#addInstructions").fadeIn();
        });
        $("#undo").attr("disabled","");
        $("#begin").attr("disabled","");
        mode = "selectAKernel";
        kernelPoint = undefined;
    });
    $("#back").on('click', function () {
        mode = "hasntStarted";
        $("#addPointsButtons").fadeOut(function () {
            $("#hasntStarted").fadeIn();
        });
        $("#addInstructions").fadeOut(function () {
            $("#toBegin").fadeIn();
        });
    });
    $("#undo").on('click', function () {
        addedPoints.pop();
    });
    $("#restartPoints").on('click', function () {
        kernelPoint = undefined;
        addedPoints = [];
        mode = "selectAKernel";
        $("#begin").attr("disabled","");
        $("#undo").attr("disabled","");
    });
    $("#begin").on('click', function () {
        mode = "fadeOutKernel";
        tweenPercent = 0;
        $("#addPointsButtons").fadeOut(function () {
            $("#hasStarted").fadeIn();
        });
        $("#addInstructions").fadeOut(function () {
            $("#start").fadeIn();
        });
    });
}, false);

function keyPress(e) {
    points.push(points.shift());
    pointsPolygon = new Polygon(points);
    visPolygon = pointsPolygon.visibleFrom(visFromPoint);
    angle = 1.5;
}

function getEventXCoord(ev){
    if (ev.layerX) { //Firefox
        return ev.layerX;
    }
    return ev.offsetX; //Opera
}

function getEventYCoord(ev){
    if (ev.layerY) { //Firefox
        return ev.layerY;
    }
    return ev.offsetY; //Opera
}
function mouseDown (ev) {
    var x = getEventXCoord(ev);
    var y = getEventYCoord(ev); 
    /*points.push(new Point(x, 600-y));
    pointsPolygon = new Polygon(points);
    angle = 1.5;
    maxXPoint = undefined;
    for (i=0;i<pointsPolygon.points().length;i++) {
        if (maxXPoint == undefined || pointsPolygon.points()[i].x > maxXPoint.x) {
            maxXPoint = pointsPolygon.points()[i];
        }
    }
    visFromPoint = new Point(maxXPoint.x-1,maxXPoint.y);
    visPolygon = pointsPolygon.visibleFrom(visFromPoint);*/
    if (mode == "selectAKernel") {
        kernelPoint = new Point(x, context.canvas.height - y);
        mode = "selectPoints";
        $("#undo").removeAttr("disabled");
        addedPoints = [];
    } else if (mode == "selectPoints") {
        addedPoints.push(new Point(x, context.canvas.height - y));
    }
}

function update () {
    //alert('t3');
    ticker++;
    var canvas = getCanvas();
    context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f00'; //red
    context.strokeStyle = '#000'; //green
    context.lineWidth = 4;
    if (mode == "selectAKernel") {
    } else if (mode == "selectPoints") {
        kernelPoint.draw(context);
        sortedPoints = addedPoints.slice().sort(function (a, b) {
            return kernelPoint.thetaTo(a)-kernelPoint.thetaTo(b);
        });
        sortedPoints.map(function (a) {
            a.draw(context,"rgb(0,0,0)");
        })
        poly = new Polygon(sortedPoints);
        poly.draw(context,"rgba(0,0,0,0)");
        if (poly.containsPoint(kernelPoint)) {
            $("#begin").removeAttr("disabled");
        } else {
            $("#begin").attr("disabled","");
        }
    } else if (mode == "fadeOutKernel") {
        tweenPercent += 2;
        poly.draw(context,"rgba(0,0,0,0)");
        kernelPoint.draw(context,"rgba(255,0,0,"+(100-tweenPercent)/100+")");
        if (tweenPercent >= 100) {
            tweenPercent = 0;
            randomPoints = sortedPoints;
            pointsPolygon = poly;
            mode = "fadeToPolygon";
        }
    } else if (mode == "generatePoints") {
        fixed = true;
        randomPointTargets.map(function (p, index) {
            x = randomPoints[index].x;
            y = randomPoints[index].y;
            dx = p.x-x;
            dy = p.y-y;
            if (Math.abs(dx)+Math.abs(dy)<2) {
                (randomPoints[index] = new Point(x,y)).draw(context);
            } else {
                fixed = false;
                (randomPoints[index] = new Point(x+dx/10,y+dy/10)).draw(context);
            }
        });
        // new Polygon(randomPoints).draw(context);
        if (fixed) {
            mode = "drawPolygonEdges";
            toDraw = 0;
        }
    } else if (mode == "drawPolygonEdges") {
        randomPoints.map(function (p) {p.draw(context)});
        pointsToDraw = randomPoints.slice(0,toDraw);
        edgesToDraw = new Polygon(pointsToDraw).edges().slice(0,toDraw-1);
        edgesToDraw.map(function (e) { e.draw(context)});
        toDraw++;
        if (toDraw == randomPoints.length+10) {
            mode = "fadeToPolygon";
            pointsPolygon = new Polygon(randomPoints);
            tweenPercent = 0;

        }
    } else if (mode == "fadeToPolygon") {
        tweenPercent+=5;
        randomPoints.map(function (p) {p.draw(context,"rgba(255,0,0,"+(100-tweenPercent)/100+")")});
        pointsPolygon.draw(context,"rgba(0,255,0,"+tweenPercent/100*0.2+")");
        if (tweenPercent == 100) {
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                mode = "animateVisPolygon"
                angle = 1.5;
                maxXPoint = undefined;
                indexOfMax = -1;
                points = randomPoints;
                for (i=0;i<pointsPolygon.points().length;i++) {
                    if (maxXPoint == undefined || pointsPolygon.points()[i].x > maxXPoint.x) {
                        maxXPoint = pointsPolygon.points()[i];
                        indexOfMax = i;
                    }
                }
                // maxXPoint = points[Math.floor(Math.random()*points.length)];
                theta = maxXPoint.thetaTo(kernelPoint);
                visFromPoint = new Point(maxXPoint.x-Math.cos(theta)*2,maxXPoint.y-Math.sin(theta)*2);
                while (points[0] != maxXPoint) {
                    points.push(points.shift());
                }
                angle = points[1].thetaTo(points[0]);
                if (angle < 0) angle += Math.PI*2;
                endAngle = points[0].thetaTo(points[points.length-1])+Math.PI;
                console.log(angle*180/Math.PI,endAngle*180/Math.PI);
                visPolygon = pointsPolygon.visibleFrom(visFromPoint);
                $("#next").attr("disabled","");
                $("#start").fadeOut(function () {
                    $("#computeVis").fadeIn();
                });
            });
        }
    } else if (mode == "animateVisPolygon") {
        pointsPolygon.draw(context);
        if (visPolygon) { 
            if (angle<endAngle) {
                angle += 0.02;
            } else {
                angle = Math.PI*2+1.5708;
                $("#next").removeAttr("disabled").off('click').on('click', function () {
                    mode = "highlightSteinerPoints"
                    tweenPercent = 0;
                    $("#next").attr("disabled","");
                    $("#computeVis").fadeOut(function () {
                        $("#steinerPoints").fadeIn();
                    });
                });
            }
            // visPolygon.draw(context);
            movingRay = new Ray(visFromPoint,angle);
            movingRayIntersection = movingRay.polygonIntersections(visPolygon)[0];
            new LineSegment(visFromPoint,movingRayIntersection).draw(context);
            stableRay = new Ray(visFromPoint,1.5708)
            stableRayIntersection = stableRay.polygonIntersections(visPolygon)[0];
            new LineSegment(visFromPoint,stableRayIntersection).draw(context);
            leftEdge = visPolygon.edges().filter(function (e) {
                return e.containsPoint(stableRayIntersection);
            })[0];
            rightEdge = visPolygon.edges().filter(function (e) {
                return e.containsPoint(movingRayIntersection);
            })[0];
            sweepPoints = visPolygon.points().slice(0);
            while (leftEdge.p2 != sweepPoints[0]) {
                sweepPoints.push(sweepPoints.shift())
            }
            for (i=0;i<sweepPoints.length;i++) {
                if (sweepPoints[i] == rightEdge.p1) {
                    sweepPoints = sweepPoints.slice(0,i+1);
                    break;
                }
            }
            sweepPoints.push(movingRayIntersection);
            sweepPoints.push(visFromPoint);
            sweepPoints.push(stableRayIntersection);
            sweepPolygon =  new Polygon(sweepPoints);
            if (sweepPolygon.containsPoint(mousePoint)) {
                sweepPolygon.draw(context,"rgba(0,125,0,0.6)");  
            } else {
                sweepPolygon.draw(context,"rgba(0,255,0,0.6)");
            }
        }
        visFromPoint.draw(context);
    } else if (mode == "highlightSteinerPoints") {
        pointsPolygon.draw(context);
        visPolygon.draw(context,"rgba(0,255,0,0.6)");
        steinerPoints = []
        visPolygon.points().filter(function (p) {return p.isSteiner}).map(
                function (p) {steinerPoints.push(p);
                              p.draw(context,
                                     "rgba(0,0,255,"+tweenPercent/100+")")});
        
        tweenPercent += 2;
        visFromPoint.draw(context);
        if (tweenPercent > 200) {
            tweenPercent = 200;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                mode = "computeGeodesics";
                steinerEdges = pointsPolygon.edges().filter(function (e) {
                    for (i=0;i<steinerPoints.length;i++) {
                        if (e.containsPoint(steinerPoints[i])) return true;
                    }
                    return false;
                })
                visPoints = visPolygon.points();
                visLength = visPoints.length;
                windows = []
                tweenPercent = 0;
                steinerPoints.map(function (p) {
                    index = visPoints.indexOf(p);
                    steinerEdge = pointsPolygon.edges().filter(function (e) {
                        return e.containsPoint(p);
                    })[0];
                    if (steinerEdge.containsPoint(visPoints[(index-1+visLength)%visLength])) {
                        windows.push([visPoints[(index+1)%visLength],p,steinerEdge.p2,steinerEdge.p1]);
                    } else {
                        windows.push([visPoints[(index-1+visLength)%visLength],p,steinerEdge.p1,steinerEdge.p2]);
                    }
                })
                $("#next").attr("disabled","");
                $("#steinerPoints").fadeOut(function () {
                    $("#extendedVis").fadeIn();
                });
            });
        }
    } else if (mode == "computeGeodesics") {
        tweenPercent += 2
        pointsPolygon.draw(context);
        visPolygon.draw(context,"rgba(0,255,0,0.6)");
        geodesics = windows.map (function (w) {
            points = pointsPolygon.points();
            i1 = points.indexOf(w[0]);
            i2 = points.indexOf(w[2]);
            stack = [w[0]];
            rht = w[0].rightTurn(w[1],w[2]);
            ord = rht ? -1 : 1;
            for (i=i1;i!=(i2+ord+points.length)%points.length;i = (i+ord+points.length)%points.length) {
                if (stack.length<2) {
                    stack.push(points[i]);
                } else {
                    while (stack.length>= 2 && 
                           stack[stack.length-2].rightTurn(stack[stack.length-1],
                                                           points[i]) != rht) {
                        stack.pop();
                    }
                    stack.push(points[i]);
                }
            }
            // stack.push(w[2]);
            return stack;
        });
        geodesics.map(function (pl, idx) {
             (new Polygon(pl.concat(windows[idx][1]))).draw(context,"rgba(0,255,255,"+tweenPercent/100*0.6+")",
                                                                    "rgba(0,0,0,"+tweenPercent/100+")");
            if (pl.length>2) {
                for (i=0;i<pl.length-1;i++) {
                    ls = new LineSegment(pl[i],pl[i+1]);
                    l = ls.toLine();
                    e = new LineSegment(windows[idx][1],windows[idx][2]);
                    inter = e.lineIntersection(l);
                    if (inter) {
                        context.dashedLine(pl[i].x,canvas.height-pl[i].y,inter.x, canvas.height-inter.y);
                        context.strokeStyle= "rgba(0,0,0,"+tweenPercent/100+")";
                        context.stroke();
                    }
                }
            }
        });
        visFromPoint.draw(context);
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                tweenPercent = 0;
                mode = "connectVertices";
                subStarPoints = [maxXPoint];
                pl = pointsPolygon.pointList;
                subPolygons = [];
                windows.map (function (w, idx, r) {
                    pointsToAdd = undefined;
                    v = w[0];
                    x = w[2];
                    y = w[3];
                    rht = w[0].rightTurn(w[1],w[2]);
                    ord = rht ? -1 : 1;
                    if (maxXPoint.canSee(y, pointsPolygon)) {
                        if (ord == 1) {
                            pointsToAdd = [v, y]
                        } else {
                            pointsToAdd = [y, v];
                        }
                    } else {
                        if (ord == 1) {
                            pointsToAdd = [v, r[(idx+1)%r.length][0]];
                        } 
                    }
                    if (pointsToAdd != undefined) {
                        indexOfTop = pl.indexOf(subStarPoints.slice(-1)[0]);
                        p1 = pointsToAdd[0];
                        if (pl.indexOf(p1) != indexOfTop+1) {
                            for (i=indexOfTop+1;i<pl.indexOf(p1);i++) {
                                subStarPoints.push(pl[i]);
                            }
                        }
                        subPolygonPoints = [];
                        p2 = pointsToAdd[1];
                        p2_idx = pl.indexOf(p2);
                        p1_idx = pl.indexOf(p1);
                        for (i=Math.min(p1_idx,p2_idx);i<=Math.max(p2_idx,p1_idx);i++) {
                            subPolygonPoints.push(pl[i]);
                        }
                        subPolygons.push(new Polygon(subPolygonPoints));
                        subStarPoints.push(p1,pointsToAdd[1]);
                    }
                });
                indexOfTop = pl.indexOf(subStarPoints.slice(-1)[0]);
                for (i=indexOfTop+1;i<pl.length;i++) {
                    subStarPoints.push(pl[i]);
                }
                subStarPolygon = new Polygon(subStarPoints);
                $("#next").attr("disabled","");
                $("#extendedVis").fadeOut(function () {
                    $("#constructEdges").fadeIn();
                });
            });
        }
    } else if (mode == "connectVertices") {
        pointsPolygon.draw(context);
        visPolygon.draw(context,"rgba(0,255,0,0.6)");
        geodesics.map(function (pl, idx) {
            (new Polygon(pl.concat(windows[idx][1]))).draw(context,"rgba(0,255,255,0.6)",
                                                                    "rgba(0,0,0,1)");
            if (pl.length>2) {
                for (i=0;i<pl.length-1;i++) {
                    ls = new LineSegment(pl[i],pl[i+1]);
                    l = ls.toLine();
                    e = new LineSegment(windows[idx][1],windows[idx][2]);
                    inter = e.lineIntersection(l);
                    if (inter) {
                        context.dashedLine(pl[i].x,canvas.height-pl[i].y,inter.x,canvas.height-inter.y);
                        context.strokeStyle= "rgba(0,0,0,1)";
                        context.stroke();
                    }
                }
            }
        });
        subStarPolygon.draw(context,"rgba(0,255,0,"+tweenPercent/100*0.6+")",
                                     "rgba(0,0,0,"+tweenPercent/100+")");
        visFromPoint.draw(context);
        tweenPercent += 2
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                tweenPercent = 0;
                mode = "showSubPolygons";
                $("#next").attr("disabled","");
                $("#constructEdges").fadeOut(function () {
                    $("#highlightSubPolygons").fadeIn();
                })
            });
        }
    } else if (mode == "showSubPolygons") {
        pointsPolygon.draw(context,"rgba(0,255,0,"+0.1*(100-tweenPercent)/100+")","rgba(0,0,0,"+(100-tweenPercent)/100+")");
        visPolygon.draw(context,"rgba(0,255,0,"+0.6*(100-tweenPercent)/100+")","rgba(0,0,0,"+(100-tweenPercent)/100+")");
        geodesics.map(function (pl, idx) {
             (new Polygon(pl.concat(windows[idx][1]))).draw(context,"rgba(0,255,255,"+(100-tweenPercent)/100*0.6+")",
                                                                    "rgba(0,0,0,"+(100-tweenPercent)/100+")");
            if (pl.length>2) {
                for (i=0;i<pl.length-1;i++) {
                    ls = new LineSegment(pl[i],pl[i+1]);
                    l = ls.toLine();
                    e = new LineSegment(windows[idx][1],windows[idx][2]);
                    inter = e.lineIntersection(l);
                    if (inter) {
                        context.dashedLine(pl[i].x,canvas.height-pl[i].y,inter.x,canvas.height-inter.y);
                        context.strokeStyle= "rgba(0,0,0,"+(100-tweenPercent)/100+")";
                        context.stroke();
                    }
                }
            }
        });
        subStarPolygon.draw(context,"rgba(0,255,0,0.6)",
                                     "rgba(0,0,0,1)");
        subPolygons.map(function (sp) {
            sp.draw(context,"rgba(0,0,255,"+tweenPercent/100*0.6+")",
                            "rgba(0,0,0,"+tweenPercent/100+")");
        });
        visFromPoint.draw(context);
        tweenPercent += 2
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                mode = "blowUpPolygons";
                tweenPercent = 0;
                $("#next").attr("disabled","");
                $("#highlightSubPolygons").fadeOut(function () {
                    $("#blowUp").fadeIn();
                })
            });
        }
    } else if (mode == "blowUpPolygons") {
        subStarPolygon.draw(context,"rgba(0,255,0,0.6)",
                                    "rgba(0,0,0,1)");
        blownUpPolygons = subPolygons.map(function (sp) {
            polygonAvg = sp.points().reduce(function (a, b) {
                return a.add(b)
            }).scalarMult(1/sp.points().length);
            vect = polygonAvg.subtract(kernelPoint);
            blownUpPoints = sp.map(function (pt) {
                return pt.add(vect.scalarMult(tweenPercent/100*0.1));
            });
            return new Polygon(blownUpPoints);
        });
        blownUpPolygons.map(function (bup) {
            bup.draw(context,"rgba(0,0,255,0.6)");
        });
        visFromPoint.draw(context);
        tweenPercent += 2
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                tweenPercent = 0;
                mode = "triangulateStarShaped";
                $("#next").attr("disabled","");
                $("#blowUp").fadeOut(function () {
                    $("#triangulateStar").fadeIn();
                });
            });
        }
    } else if (mode == "triangulateStarShaped") {
        subStarPolygon.draw(context,"rgba(0,255,0,0.6)",
                                    "rgba(0,0,0,1)");
        blownUpPolygons.map(function (bup) {
            bup.draw(context,"rgba(0,0,255,0.6)");
        });
        for (i=2;i<subStarPolygon.points().length-1;i++) {
            new LineSegment(visFromPoint,subStarPolygon.points()[i]).draw(context,"rgba(0,0,0,"+tweenPercent/100+")");
        }
        visFromPoint.draw(context);
        tweenPercent += 2
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                tweenPercent = 0;
                mode = "triangulateWEV";
                $("#next").attr("disabled","");
                $("#triangulateStar").fadeOut(function () {
                    $("#triangulateWEV").fadeIn();
                });
            });
        }
    } else if (mode == "triangulateWEV") {
        subStarPolygon.draw(context,"rgba(0,255,0,0.6)",
                                    "rgba(0,0,0,1)");
        blownUpPolygons.map(function (bup) {
            bup.draw(context,"rgba(0,0,255,0.6)");
        });
        visFromPoint.draw(context);
        blownUpPolygons.map(function (bup) {
            points = bup.pointList.slice();
            minXPoint = undefined
            for (i=0;i<points.length;i++) {
                if (minXPoint == undefined || points[i].x < minXPoint) {
                    minXPoint = points[i];
                }
            }
            i0 = points.indexOf(minXPoint);
            i1 = (i0+1)%points.length;
            i2 = (i1+1)%points.length;
            while (points.length > 3) {
                p0 = points[i0];
                p1 = points[i1];
                p2 = points[i2];
                if (p0.rightTurn(p1, p2)) {
                    new LineSegment(p0, p2).draw(context, "rgba(0,0,0,"+tweenPercent/100+")");
                    points = points.slice(0, i1).concat(points.slice(i1+1))
                    i0 = points.indexOf(p0);
                    i1 = points.indexOf(p2);
                    i2 = (i1+1)%points.length;
                } else {
                    i0 = (i0+1)%points.length;
                    i1 = (i1+1)%points.length;
                    i2 = (i2+1)%points.length;
                }
            }
        });
        for (i=2;i<subStarPolygon.points().length-1;i++) {
            new LineSegment(visFromPoint,subStarPolygon.points()[i]).draw(context);
        }
        tweenPercent += 2
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                tweenPercent = 0;
                mode = "assembleBUP";
                $("#next").attr("disabled","");
                $("#triangulateWEV").fadeOut(function () {
                    $("#assemble").fadeIn();
                })
            });
        }
    } else if (mode == "assembleBUP") {
        subStarPolygon.draw(context,"rgba(0,255,0,0.6)",
                                    "rgba(0,0,0,1)");
        blownUpPolygons = subPolygons.map(function (sp) {
            polygonAvg = sp.points().reduce(function (a, b) {
                return a.add(b)
            }).scalarMult(1/sp.points().length);
            vect = polygonAvg.subtract(kernelPoint);
            blownUpPoints = sp.map(function (pt) {
                return pt.add(vect.scalarMult((100-tweenPercent)/100*0.1));
            });
            return new Polygon(blownUpPoints);
        });
        blownUpPolygons.map(function (bup) {
            bup.draw(context,"rgba(0,0,255,0.6)");
        });
        blownUpPolygons.map(function (bup) {
            points = bup.pointList.slice();
            i0 = 0;
            i1 = 1;
            i2 = 2;
            while (points.length > 3) {
                p0 = points[i0];
                p1 = points[i1];
                p2 = points[i2];
                if (p0.rightTurn(p1, p2)) {
                    new LineSegment(p0, p2).draw(context);
                    points = points.slice(0, i1).concat(points.slice(i1+1))
                    i0 = points.indexOf(p0);
                    i1 = points.indexOf(p2);
                    i2 = (i1+1)%points.length;
                } else {
                    i0 = (i0+1)%points.length;
                    i1 = (i1+1)%points.length;
                    i2 = (i2+1)%points.length;
                }
            }
        });
        for (i=2;i<subStarPolygon.points().length-1;i++) {
            new LineSegment(visFromPoint,subStarPolygon.points()[i]).draw(context);
        }
        visFromPoint.draw(context);
        tweenPercent += 2
        if (tweenPercent > 100) {
            tweenPercent = 100;
            $("#next").removeAttr("disabled").off('click').on('click', function () {
                tweenPercent = 0;
                mode = "finish";
                $("#next").attr("disabled","");
                $("#assemble").fadeOut(function () {
                    $("#finish").fadeIn();
                })
            });
        }
    } else if (mode == "finish") {
        subStarPolygon.draw(context,"rgba(0,255,0,0.6)",
                                    "rgba(0,0,0,1)");
        subPolygons.map(function (bup) {
            bup.draw(context,"rgba(0,"+Math.floor(255*tweenPercent/100)+","+Math.floor(255*(100-tweenPercent)/100)+",0.6)");
        });
        subPolygons.map(function (bup) {
            points = bup.pointList.slice();
            i0 = 0;
            i1 = 1;
            i2 = 2;
            while (points.length > 3) {
                p0 = points[i0];
                p1 = points[i1];
                p2 = points[i2];
                if (p0.rightTurn(p1, p2)) {
                    new LineSegment(p0, p2).draw(context);
                    points = points.slice(0, i1).concat(points.slice(i1+1))
                    i0 = points.indexOf(p0);
                    i1 = points.indexOf(p2);
                    i2 = (i1+1)%points.length;
                } else {
                    i0 = (i0+1)%points.length;
                    i1 = (i1+1)%points.length;
                    i2 = (i2+1)%points.length;
                }
            }
        });
        for (i=2;i<subStarPolygon.points().length-1;i++) {
            new LineSegment(visFromPoint,subStarPolygon.points()[i]).draw(context);
        }
        visFromPoint.draw(context,"rgba(255,0,0,"+(100-tweenPercent)/100);
        tweenPercent += 2;  
        if (tweenPercent > 100) {
            tweenPercent = 100;
        }
    }
};
