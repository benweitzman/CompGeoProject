function Point (x, y) {
    this.x = x;
    this.y = y;

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
        var v1 = p2.subtract(this);
        var v2 = p3.subtract(p2);
        if (v1.cross(v2) < 0) {
            return true;
        }
        return false;
    };

    this.rightTurn = function (p2, p3) {
        var v1 = p2.subtract(this);
        var v2 = p3.subtract(p2);
        if (v1.cross(v2) > 0) {
            return true;
        }
        return false;
    };

    this.draw = function (context,fillStyle) {
        fillStyle = typeof fillStyle !== 'undefined' ? fillStyle : "red";
        context.beginPath();
        context.arc(this.x, 600-this.y, 5, 0, 2 * Math.PI, false);
        context.fillStyle = fillStyle;
        context.fill();
    };

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
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(p1.x, 600-p1.y);
        context.lineTo(p2.x, 600-p2.y);
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
        this.pointList.map(f);
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
                            return e.lineIntersection(l);
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
                    stack.pop();
                    stack.push(newPoint);
                    stack.push(point);
                    /*for (;i<pl.length-1;i++) {

                    }*/
                }
            }
        }
        return new Polygon(stack);
    };

    this.draw = function (context, fillStyle) {
        fillStyle = typeof fillStyle !== 'undefined' ? fillStyle : "rgba(0,255,0,0.1)";
        context.strokeStyle = '#000'; //black
         context.fillStyle = fillStyle
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(this.pointList.x, 600-this.pointList.y);
        this.pointList.slice(1).concat(this.pointList.slice(0,1)).map(function (p) {
            context.lineTo(p.x,600-p.y);
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
var mode = "generatePoints";
var ticker = 0;
var tweenPercent = 0;
var kernelPoint = undefined;
var numPoints = 20;
var mousePoint = new Point(0,0);

window.addEventListener('load', function() {
    var canvas = getCanvas();
    if(canvas && canvas.getContext) {
        var context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#fFf';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    // mouseMove();
    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('keypress',keyPress,false);
    window.setInterval(update,1000/50);
    randomPoints = []
    randomPointTargets = []
    sumX = 0, sumY = 0;
    for (i=0;i<numPoints;i++) {
        randX = Math.random()*600;
        randY = Math.random()*600;
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
    points.push(new Point(x, 600-y));
    pointsPolygon = new Polygon(points);
    angle = 1.5;
    maxXPoint = undefined;
    for (i=0;i<pointsPolygon.points().length;i++) {
        if (maxXPoint == undefined || pointsPolygon.points()[i].x > maxXPoint.x) {
            maxXPoint = pointsPolygon.points()[i];
        }
    }
    visFromPoint = new Point(maxXPoint.x-1,maxXPoint.y);
    visPolygon = pointsPolygon.visibleFrom(visFromPoint);
}

function mouseMove (ev) {
    var x = getEventXCoord(ev);
    var y = getEventYCoord(ev);
    mousePoint = new Point(x, 600-y);
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
    if (mode == "generatePoints") {
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
            console.log(angle*180/Math.PI);
            visPolygon = pointsPolygon.visibleFrom(visFromPoint);
        }
    } else if (mode == "animateVisPolygon") {
        pointsPolygon.draw(context);
        visFromPoint.draw(context);
        if (visPolygon) { 
            if (angle<Math.PI*2+1.5708) {
                angle += 0.02;
            } else {
                angle = Math.PI*2+1.5708;
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
    }
    /*var seg1 = new LineSegment(new Point(200, 200), new Point(x, 600-y));
    seg1.draw(context);
    
    var seg2 = new LineSegment(new Point(200, 300), new Point(300, 250));

    seg2.draw(context);
    var intersectionPoint = seg1.intersection(seg2);
    if (intersectionPoint != undefined) {
        intersectionPoint.draw(context);
    }*/
    
    /**/
};
